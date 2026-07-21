import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import type Stripe from 'stripe'

/**
 * Helper to log subscription changes to subscription_history.
 * Silently fails — audit logging should not block the main action.
 */
async function logSubscriptionEvent(
  supabase: ReturnType<typeof createServiceClient>,
  opts: {
    accountId: string
    subscriptionId?: string | null
    eventType: string
    previousPlanId?: string | null
    newPlanId?: string | null
    previousStatus?: string | null
    newStatus?: string | null
    notes?: string | null
  }
) {
  try {
    await supabase.from('subscription_history').insert({
      account_id: opts.accountId,
      subscription_id: opts.subscriptionId ?? null,
      event_type: opts.eventType,
      previous_plan_id: opts.previousPlanId ?? null,
      new_plan_id: opts.newPlanId ?? null,
      previous_status: opts.previousStatus ?? null,
      new_status: opts.newStatus ?? null,
      event_data: { admin_action: true },
      notes: opts.notes ?? null,
    })
  } catch (e) {
    console.warn('Failed to log subscription event:', e)
  }
}

// Update subscription for an account
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { user, email } = guard

    const body = await request.json()
    const { accountId, action, planId, status, endDate, notes } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const adminSupabase = createServiceClient()

    // Get current subscription
    const { data: currentSub, error: subError } = await adminSupabase
      .from('account_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('account_id', accountId)
      .single()

    switch (action) {
      case 'upgrade':
      case 'downgrade':
      case 'change_plan': {
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        // Get the new plan
        const { data: newPlan, error: planError } = await adminSupabase
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single()

        if (planError || !newPlan) {
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // If there's an active Stripe subscription, propagate the change to Stripe
        if (currentSub?.stripe_subscription_id) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)
            
            if (['active', 'trialing'].includes(stripeSub.status)) {
              // Determine the price ID for the current billing cycle
              const bc = currentSub.billing_cycle || 'monthly'
              const priceFieldMap: Record<string, string> = {
                monthly: 'stripe_monthly_price_id',
                quarterly: 'stripe_quarterly_price_id',
                biannual: 'stripe_biannual_price_id',
                annual: 'stripe_annual_price_id',
              }
              const priceField = priceFieldMap[bc]
              let newPriceId = priceField ? (newPlan[priceField] as string | null) : null
              
              // Create inline price if no pre-configured price ID
              if (!newPriceId) {
                const usdFieldMap: Record<string, string> = {
                  monthly: 'monthly_price_usd',
                  quarterly: 'quarterly_price_usd',
                  biannual: 'biannual_price_usd',
                  annual: 'annual_price_usd',
                }
                const usdField = usdFieldMap[bc]
                const priceUsd = usdField ? (newPlan[usdField] as number | null) : null
                
                if (priceUsd && priceUsd > 0) {
                  const intervalMap: Record<string, { interval: Stripe.Price.Recurring.Interval; interval_count: number }> = {
                    monthly: { interval: 'month', interval_count: 1 },
                    quarterly: { interval: 'month', interval_count: 3 },
                    biannual: { interval: 'month', interval_count: 6 },
                    annual: { interval: 'year', interval_count: 1 },
                  }
                  const { interval, interval_count } = intervalMap[bc] || intervalMap.monthly
                  
                  const createdPrice = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: Math.round(priceUsd * 100),
                    recurring: { interval, interval_count },
                    product_data: { name: `${newPlan.display_name} Plan` },
                  })
                  newPriceId = createdPrice.id
                }
              }
              
              if (newPriceId) {
                await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
                  items: [{
                    id: stripeSub.items.data[0].id,
                    price: newPriceId,
                  }],
                  proration_behavior: 'create_prorations',
                  metadata: {
                    account_id: accountId,
                    plan_id: planId,
                    billing_cycle: bc,
                  },
                })
              }
            }
          } catch (stripeErr: any) {
            console.warn('Failed to sync plan change to Stripe:', stripeErr.message)
            // Continue with DB update even if Stripe sync fails
          }
        }

        // Update the subscription in DB
        const { data, error } = await adminSupabase
          .from('account_subscriptions')
          .update({
            plan_id: planId,
            updated_at: new Date().toISOString()
          })
          .eq('account_id', accountId)
          .select('*, plan:subscription_plans(*)')
          .single()

        if (error) {
          // If no subscription exists, create one
          if (error.code === 'PGRST116') {
            const { data: newSub, error: createError } = await adminSupabase
              .from('account_subscriptions')
              .insert({
                account_id: accountId,
                plan_id: planId,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .select('*, plan:subscription_plans(*)')
              .single()

            if (createError) {
              return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
            }

            await logSubscriptionEvent(adminSupabase, {
              accountId,
              subscriptionId: newSub?.id,
              eventType: 'created',
              previousPlanId: null,
              newPlanId: planId,
              newStatus: 'active',
              notes,
            })

            return NextResponse.json({
              success: true,
              message: `Subscription created with ${newPlan.display_name} plan`,
              subscription: newSub
            })
          }

          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
        }

        const eventType = action === 'upgrade' ? 'upgraded' : action === 'downgrade' ? 'downgraded' : 'upgraded'
        await logSubscriptionEvent(adminSupabase, {
          accountId,
          subscriptionId: currentSub?.id,
          eventType,
          previousPlanId: currentSub?.plan_id,
          newPlanId: planId,
          notes,
        })

        return NextResponse.json({
          success: true,
          message: `Plan changed to ${newPlan.display_name}`,
          subscription: data
        })
      }

      case 'change_status': {
        if (!status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        const validStatuses = ['active', 'trialing', 'past_due', 'canceled', 'expired', 'paused']
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Sync status changes to Stripe when applicable
        if (currentSub?.stripe_subscription_id) {
          try {
            if (status === 'canceled') {
              await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
                cancel_at_period_end: true,
              })
            } else if (status === 'paused') {
              await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
                pause_collection: { behavior: 'void' },
              })
            } else if (status === 'active' && currentSub.status === 'paused') {
              await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
                pause_collection: '',
              } as any)
            }
          } catch (stripeErr: any) {
            console.warn('Failed to sync status change to Stripe:', stripeErr.message)
          }
        }

        // Pause/resume auto_run on brands based on status
        if (['canceled', 'expired', 'paused'].includes(status)) {
          await adminSupabase
            .from('brands')
            .update({
              auto_run_paused: true,
              auto_run_paused_at: new Date().toISOString(),
              auto_run_pause_reason: `Subscription ${status}`,
            })
            .eq('account_id', accountId)
            .eq('is_active', true)
        } else if (status === 'active' && ['canceled', 'expired', 'paused'].includes(currentSub?.status || '')) {
          await adminSupabase
            .from('brands')
            .update({
              auto_run_paused: false,
              auto_run_paused_at: null,
              auto_run_pause_reason: null,
            })
            .eq('account_id', accountId)
            .eq('is_active', true)
        }

        const { data, error } = await adminSupabase
          .from('account_subscriptions')
          .update({
            status,
            ...(status === 'canceled' ? { canceled_at: new Date().toISOString(), auto_renew: false } : {}),
            ...(status === 'expired' ? { ended_at: new Date().toISOString(), auto_renew: false } : {}),
            updated_at: new Date().toISOString()
          })
          .eq('account_id', accountId)
          .select('*, plan:subscription_plans(*)')
          .single()

        if (error) {
          return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 })
        }

        // Map status to valid event_type for the CHECK constraint
        const statusEventMap: Record<string, string> = {
          active: 'resumed',
          trialing: 'trial_started',
          past_due: 'payment_failed',
          canceled: 'canceled',
          expired: 'expired',
          paused: 'paused',
        }

        await logSubscriptionEvent(adminSupabase, {
          accountId,
          subscriptionId: currentSub?.id,
          eventType: statusEventMap[status] || 'resumed',
          previousPlanId: currentSub?.plan_id,
          newPlanId: currentSub?.plan_id,
          previousStatus: currentSub?.status,
          newStatus: status,
          notes,
        })

        return NextResponse.json({
          success: true,
          message: `Subscription status changed to ${status}`,
          subscription: data
        })
      }

      case 'extend': {
        if (!endDate) {
          return NextResponse.json({ error: 'End date is required' }, { status: 400 })
        }

        const { data, error } = await adminSupabase
          .from('account_subscriptions')
          .update({
            current_period_end: endDate,
            updated_at: new Date().toISOString()
          })
          .eq('account_id', accountId)
          .select('*, plan:subscription_plans(*)')
          .single()

        if (error) {
          return NextResponse.json({ error: 'Failed to extend subscription' }, { status: 500 })
        }

        await logSubscriptionEvent(adminSupabase, {
          accountId,
          subscriptionId: currentSub?.id,
          eventType: 'renewed',
          previousPlanId: currentSub?.plan_id,
          newPlanId: currentSub?.plan_id,
          notes: `Extended to ${new Date(endDate).toLocaleDateString()}. ${notes || ''}`.trim(),
        })

        return NextResponse.json({
          success: true,
          message: `Subscription extended to ${new Date(endDate).toLocaleDateString()}`,
          subscription: data
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin subscription error:', error)
    return NextResponse.json({
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get all subscription plans
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const adminSupabase = createServiceClient()

    const { data: plans, error } = await adminSupabase
      .from('subscription_plans')
      .select('*')
      .order('monthly_price_usd', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plans
    })

  } catch (error) {
    console.error('Admin get plans error:', error)
    return NextResponse.json({
      error: 'Failed to fetch plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
