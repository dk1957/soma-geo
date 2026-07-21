// ============================================================================
// Admin API: Stripe Sync
// GET  /api/admin/stripe-sync — Fetch Stripe subscription overview
// POST /api/admin/stripe-sync — Perform admin actions (sync, grant_trial, cancel)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import type Stripe from 'stripe'

// ── GET: Fetch Stripe subscription overview for admin dashboard ──
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    // Fetch all subscriptions with account + plan info
    const { data: subscriptions, error } = await supabase
      .from('account_subscriptions')
      .select(`
        id,
        account_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        stripe_subscription_id,
        stripe_customer_id,
        amount_paid,
        auto_renew,
        created_at,
        updated_at,
        metadata,
        account:accounts(id, name, stripe_customer_id),
        plan:subscription_plans(id, display_name, plan_slug, plan_tier, monthly_price_usd)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Compute summary stats
    const now = new Date()
    const stats = {
      total: subscriptions?.length || 0,
      active: 0,
      trialing: 0,
      expired: 0,
      past_due: 0,
      canceled: 0,
      expiring_soon: 0, // Expires within 7 days
      trial_ending_soon: 0, // Trial ends within 3 days
      mrr: 0,
      stripe_synced: 0,
      unsynced: 0,
    }

    const enriched = (subscriptions || []).map(sub => {
      const periodEnd = new Date(sub.current_period_end)
      const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isTrial = sub.status === 'trialing' || sub.metadata?.is_trial === true

      // Detect effective status (active but period ended = expired)
      let effectiveStatus = sub.status
      if (['active', 'trialing'].includes(sub.status) && daysRemaining <= 0) {
        effectiveStatus = 'expired'
      }

      // Stats
      if (effectiveStatus === 'active') stats.active++
      else if (effectiveStatus === 'trialing') stats.trialing++
      else if (effectiveStatus === 'expired') stats.expired++
      else if (effectiveStatus === 'past_due') stats.past_due++
      else if (effectiveStatus === 'canceled') stats.canceled++

      if (effectiveStatus === 'active' && daysRemaining <= 7 && daysRemaining > 0) {
        stats.expiring_soon++
      }
      if (effectiveStatus === 'trialing' && daysRemaining <= 3 && daysRemaining > 0) {
        stats.trial_ending_soon++
      }

      if (sub.stripe_subscription_id) {
        stats.stripe_synced++
      } else {
        stats.unsynced++
      }

      // MRR: convert paid amount to monthly
      if (effectiveStatus === 'active' && sub.amount_paid) {
        const cycleMonths = sub.billing_cycle === 'monthly' ? 1 : sub.billing_cycle === 'quarterly' ? 3 : sub.billing_cycle === 'biannual' ? 6 : 12
        stats.mrr += sub.amount_paid / cycleMonths
      }

      // Use plan monthly price as fallback for MRR
      const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
      if (effectiveStatus === 'active' && !sub.amount_paid && plan?.monthly_price_usd) {
        stats.mrr += plan.monthly_price_usd
      }

      return {
        ...sub,
        effective_status: effectiveStatus,
        days_remaining: daysRemaining,
        is_trial: isTrial,
        account_name: (Array.isArray(sub.account) ? sub.account[0] : sub.account)?.name || 'Unknown',
        plan_name: plan?.display_name || 'Unknown',
        plan_tier: plan?.plan_tier || 'unknown',
      }
    })

    stats.mrr = Math.round(stats.mrr * 100) / 100

    return NextResponse.json({
      success: true,
      stats,
      subscriptions: enriched,
    })
  } catch (error) {
    console.error('Admin stripe-sync GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST: Perform admin actions ──
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { user, email } = guard

    const body = await request.json()
    const { action, account_id, subscription_id, days, plan_id, notes } = body

    const supabase = createServiceClient()

    switch (action) {

      // ── Grant a trial subscription to an account ──
      case 'grant_trial': {
        if (!account_id) {
          return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
        }

        const trialDays = days || 14

        // Look up plan
        let trialPlanId = plan_id
        if (!trialPlanId) {
          const { data: growthPlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('plan_slug', 'growth')
            .eq('is_active', true)
            .single()
          trialPlanId = growthPlan?.id
        }

        if (!trialPlanId) {
          return NextResponse.json({ error: 'Could not find a plan for trial' }, { status: 400 })
        }

        // Remove all existing subscriptions for this account (clean slate for new trial)
        // Keep only Stripe-linked ones as canceled for audit trail
        await supabase
          .from('account_subscriptions')
          .delete()
          .eq('account_id', account_id)
          .is('stripe_subscription_id', null)
          .in('status', ['canceled', 'expired'])

        // Deactivate any remaining active/trialing subscriptions
        await supabase
          .from('account_subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('account_id', account_id)
          .in('status', ['active', 'trialing'])

        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + trialDays)

        const { data: newSub, error: subError } = await supabase
          .from('account_subscriptions')
          .insert({
            account_id,
            plan_id: trialPlanId,
            status: 'trialing',
            billing_cycle: 'monthly',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            auto_renew: false,
            metadata: { is_trial: true, trial_days: trialDays, granted_by: email },
          })
          .select('id')
          .single()

        if (subError) {
          return NextResponse.json({ error: 'Failed to create trial', details: subError.message }, { status: 500 })
        }

        await supabase.from('subscription_history').insert({
          account_id,
          subscription_id: newSub?.id,
          event_type: 'trial_started',
          new_plan_id: trialPlanId,
          new_status: 'trialing',
          event_data: { admin_action: true, granted_by: email, trial_days: trialDays, notes },
        })

        await logAdminAction(email, 'grant_trial', { account_id, plan_id: trialPlanId, trial_days: trialDays, notes })

        return NextResponse.json({
          success: true,
          message: `${trialDays}-day trial granted successfully`,
        })
      }

      // ── Sync a specific account's subscription with Stripe ──
      case 'sync_account': {
        if (!account_id) {
          return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
        }

        const { data: account } = await supabase
          .from('accounts')
          .select('id, name, stripe_customer_id')
          .eq('id', account_id)
          .single()

        if (!account?.stripe_customer_id) {
          return NextResponse.json({
            success: true,
            message: 'No Stripe customer linked to this account',
            synced: false,
          })
        }

        // Fetch active subscriptions from Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: account.stripe_customer_id,
          status: 'all',
          limit: 5,
        })

        if (stripeSubscriptions.data.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No Stripe subscriptions found for this customer',
            synced: false,
          })
        }

        // Take the most recent active/trialing subscription
        const stripeSub = stripeSubscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
          || stripeSubscriptions.data[0]

        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'expired',
          incomplete: 'past_due',
          incomplete_expired: 'expired',
          paused: 'paused',
        }

        const mappedStatus = statusMap[stripeSub.status] || stripeSub.status
        const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString()
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()
        const planId = stripeSub.metadata?.plan_id
        const billingCycle = stripeSub.metadata?.billing_cycle

        // Update or create local subscription
        const { data: existingLocalSub } = await supabase
          .from('account_subscriptions')
          .select('id')
          .eq('account_id', account_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const updateData: Record<string, any> = {
          status: mappedStatus,
          stripe_subscription_id: stripeSub.id,
          stripe_customer_id: account.stripe_customer_id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          auto_renew: !stripeSub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }

        if (planId) updateData.plan_id = planId
        if (billingCycle) updateData.billing_cycle = billingCycle

        if (existingLocalSub) {
          await supabase
            .from('account_subscriptions')
            .update(updateData)
            .eq('id', existingLocalSub.id)
        } else {
          await supabase
            .from('account_subscriptions')
            .insert({
              account_id,
              ...updateData,
              plan_id: planId || undefined,
              billing_cycle: billingCycle || 'monthly',
            })
        }

        await logAdminAction(email, 'sync_stripe', { account_id, stripe_subscription_id: stripeSub.id })

        return NextResponse.json({
          success: true,
          message: `Synced with Stripe — status: ${mappedStatus}`,
          synced: true,
          stripe_status: stripeSub.status,
          mapped_status: mappedStatus,
        })
      }

      // ── Bulk sync: Sync all accounts that have Stripe customers ──
      case 'sync_all': {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, stripe_customer_id')
          .not('stripe_customer_id', 'is', null)

        if (!accounts || accounts.length === 0) {
          return NextResponse.json({ success: true, message: 'No Stripe-linked accounts found', synced: 0 })
        }

        let synced = 0
        let errors = 0

        for (const acc of accounts) {
          try {
            const stripeSubscriptions = await stripe.subscriptions.list({
              customer: acc.stripe_customer_id!,
              status: 'all',
              limit: 3,
            })

            const stripeSub = stripeSubscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
              || stripeSubscriptions.data[0]

            if (!stripeSub) continue

            const statusMap: Record<string, string> = {
              active: 'active', trialing: 'trialing', past_due: 'past_due',
              canceled: 'canceled', unpaid: 'expired', incomplete: 'past_due',
              incomplete_expired: 'expired', paused: 'paused',
            }

            const { data: existingLocalSub } = await supabase
              .from('account_subscriptions')
              .select('id')
              .eq('account_id', acc.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            const updatePayload: Record<string, any> = {
              status: statusMap[stripeSub.status] || stripeSub.status,
              stripe_subscription_id: stripeSub.id,
              stripe_customer_id: acc.stripe_customer_id,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              auto_renew: !stripeSub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }

            if (stripeSub.metadata?.plan_id) updatePayload.plan_id = stripeSub.metadata.plan_id
            if (stripeSub.metadata?.billing_cycle) updatePayload.billing_cycle = stripeSub.metadata.billing_cycle

            if (existingLocalSub) {
              await supabase.from('account_subscriptions').update(updatePayload).eq('id', existingLocalSub.id)
            } else {
              await supabase.from('account_subscriptions').insert({
                account_id: acc.id,
                ...updatePayload,
                billing_cycle: stripeSub.metadata?.billing_cycle || 'monthly',
              })
            }

            synced++
          } catch (err) {
            console.error(`Sync error for account ${acc.id}:`, err)
            errors++
          }
        }

        await logAdminAction(email, 'sync_all_stripe', { synced, errors, total: accounts.length })

        return NextResponse.json({
          success: true,
          message: `Synced ${synced} of ${accounts.length} Stripe-linked accounts (${errors} errors)`,
          synced,
          errors,
          total: accounts.length,
        })
      }

      // ── Cancel a subscription via Stripe ──
      case 'cancel_subscription': {
        if (!account_id) {
          return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
        }

        const { data: sub } = await supabase
          .from('account_subscriptions')
          .select('id, stripe_subscription_id, status, plan_id')
          .eq('account_id', account_id)
          .in('status', ['active', 'trialing', 'past_due'])
          .single()

        if (!sub) {
          return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        // Cancel in Stripe if applicable
        if (sub.stripe_subscription_id) {
          try {
            await stripe.subscriptions.update(sub.stripe_subscription_id, {
              cancel_at_period_end: true,
            })
          } catch (stripeErr: any) {
            console.error('Stripe cancel error:', stripeErr.message)
            // Continue — cancel locally even if Stripe fails
          }
        }

        // Update local status
        await supabase
          .from('account_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            auto_renew: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)

        await supabase.from('subscription_history').insert({
          account_id,
          subscription_id: sub.id,
          event_type: 'canceled',
          previous_plan_id: sub.plan_id,
          previous_status: sub.status,
          new_status: 'canceled',
          event_data: { admin_action: true, canceled_by: email, notes },
        })

        // Pause auto_run on brands
        await supabase
          .from('brands')
          .update({
            auto_run_paused: true,
            auto_run_paused_at: new Date().toISOString(),
            auto_run_pause_reason: 'Subscription canceled',
          })
          .eq('account_id', account_id)
          .eq('is_active', true)

        await logAdminAction(email, 'cancel_subscription', { account_id, subscription_id: sub.id, notes })

        return NextResponse.json({
          success: true,
          message: 'Subscription canceled successfully',
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Admin stripe-sync POST error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}
