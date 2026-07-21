// ============================================================================
// API Route: Change Subscription Plan
// POST /api/accounts/subscriptions/change-plan
//
// Routes plan changes through Stripe Checkout for proper payment capture.
// For users with existing Stripe subscriptions, updates the subscription
// directly via the Stripe API (proration). For others, creates a new
// Stripe Checkout session.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import type { BillingCycle } from '@/lib/types/subscription';
import type Stripe from 'stripe';

const BILLING_CYCLE_INTERVAL: Record<BillingCycle, { interval: Stripe.Price.Recurring.Interval; interval_count: number }> = {
  monthly: { interval: 'month', interval_count: 1 },
  quarterly: { interval: 'month', interval_count: 3 },
  biannual: { interval: 'month', interval_count: 6 },
  annual: { interval: 'year', interval_count: 1 },
  biennial: { interval: 'year', interval_count: 2 },
};

const BILLING_CYCLE_USD_FIELD: Record<BillingCycle, string> = {
  monthly: 'monthly_price_usd',
  quarterly: 'quarterly_price_usd',
  biannual: 'biannual_price_usd',
  annual: 'annual_price_usd',
  biennial: 'biennial_price_usd',
};

const BILLING_CYCLE_PRICE_FIELD: Record<BillingCycle, string> = {
  monthly: 'stripe_monthly_price_id',
  quarterly: 'stripe_quarterly_price_id',
  biannual: 'stripe_biannual_price_id',
  annual: 'stripe_annual_price_id',
  biennial: 'stripe_biennial_price_id',
};

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServiceClient();
    
    const { account_id, new_plan_id, billing_cycle } = await request.json();
    
    if (!account_id || !new_plan_id || !billing_cycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!BILLING_CYCLE_INTERVAL[billing_cycle as BillingCycle]) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }
    
    // Verify user has access to this account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single();
    
    if (!accountUser || !['owner', 'admin'].includes(accountUser.role)) {
      return NextResponse.json({ 
        error: 'Only account owners and admins can change subscription plans' 
      }, { status: 403 });
    }
    
    // Get the new plan details
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', new_plan_id)
      .eq('is_active', true)
      .single();
    
    if (planError || !newPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }
    
    // Get current subscription
    const { data: currentSubscription } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('account_id', account_id)
      .in('status', ['active', 'trialing'])
      .single();

    const bc = billing_cycle as BillingCycle;

    // ── PATH A: Existing Stripe subscription → update via Stripe API ──
    if (currentSubscription?.stripe_subscription_id) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(currentSubscription.stripe_subscription_id);
        
        if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
          // Determine the price to switch to
          const priceField = BILLING_CYCLE_PRICE_FIELD[bc];
          const stripePriceId = newPlan[priceField] as string | null;

          let newPriceId: string;

          if (stripePriceId) {
            newPriceId = stripePriceId;
          } else {
            // Create an inline price in Stripe for this plan/cycle
            const usdField = BILLING_CYCLE_USD_FIELD[bc];
            const priceUsd = newPlan[usdField] as number | null;

            if (!priceUsd || priceUsd <= 0) {
              return NextResponse.json(
                { error: `No pricing configured for ${billing_cycle} billing on this plan` },
                { status: 400 }
              );
            }

            const { interval, interval_count } = BILLING_CYCLE_INTERVAL[bc];
            const createdPrice = await stripe.prices.create({
              currency: 'usd',
              unit_amount: Math.round(priceUsd * 100),
              recurring: { interval, interval_count },
              product_data: {
                name: `${newPlan.display_name} Plan`,
              },
            });
            newPriceId = createdPrice.id;
          }

          // Update the subscription with proration
          const updatedStripeSub = await stripe.subscriptions.update(
            currentSubscription.stripe_subscription_id,
            {
              items: [{
                id: stripeSub.items.data[0].id,
                price: newPriceId,
              }],
              proration_behavior: 'create_prorations',
              metadata: {
                account_id,
                plan_id: new_plan_id,
                billing_cycle,
              },
            }
          );

          // Update local DB to reflect the change immediately
          await supabase
            .from('account_subscriptions')
            .update({
              plan_id: new_plan_id,
              billing_cycle,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentSubscription.id);

          // Log the change
          await supabase.from('subscription_history').insert({
            account_id,
            subscription_id: currentSubscription.id,
            event_type: 'upgraded',
            event_data: {
              changed_by: currentUser.clerkUserId,
              payment_method: 'stripe',
              stripe_subscription_id: updatedStripeSub.id,
              proration: true,
            },
            previous_plan_id: currentSubscription.plan_id,
            new_plan_id,
            previous_status: currentSubscription.status,
            new_status: 'active',
            triggered_by: currentUser.clerkUserId,
          }).catch(e => console.warn('Failed to log subscription history:', e));

          return NextResponse.json({
            success: true,
            method: 'stripe_update',
            data: {
              plan_name: newPlan.display_name,
              billing_cycle,
              message: 'Plan updated successfully. Proration applied.',
            },
          });
        }
      } catch (stripeErr: any) {
        console.error('Stripe subscription update failed, falling back to checkout:', stripeErr.message);
        // Fall through to checkout flow below
      }
    }

    // ── PATH B: No Stripe subscription (trial/new) → create Stripe Checkout ──
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get or create Stripe customer
    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, stripe_customer_id')
      .eq('id', account_id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    let stripeCustomerId = account.stripe_customer_id;

    if (!stripeCustomerId) {
      const customerEmail = currentUser.clerkUser?.email || currentUser.profile?.email || undefined;
      const customer = await stripe.customers.create({
        name: account.name,
        email: customerEmail,
        metadata: { account_id, clerk_user_id: currentUser.clerkUserId },
      });
      stripeCustomerId = customer.id;
      await supabase.from('accounts').update({ stripe_customer_id: customer.id }).eq('id', account_id);
    }

    // Build line items
    const priceField = BILLING_CYCLE_PRICE_FIELD[bc];
    const stripePriceId = newPlan[priceField] as string | null;

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (stripePriceId) {
      lineItems = [{ price: stripePriceId, quantity: 1 }];
    } else {
      const usdField = BILLING_CYCLE_USD_FIELD[bc];
      const priceUsd = newPlan[usdField] as number | null;

      if (!priceUsd || priceUsd <= 0) {
        return NextResponse.json(
          { error: `No pricing configured for ${billing_cycle} billing on this plan` },
          { status: 400 }
        );
      }

      const { interval, interval_count } = BILLING_CYCLE_INTERVAL[bc];
      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${newPlan.display_name} Plan`,
            description: `Soma AI ${newPlan.display_name} — ${billing_cycle} billing`,
          },
          unit_amount: Math.round(priceUsd * 100),
          recurring: { interval, interval_count },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: lineItems,
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard/subscription?refresh=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/subscription`,
      metadata: {
        account_id,
        plan_id: new_plan_id,
        billing_cycle,
        clerk_user_id: currentUser.clerkUserId,
      },
      subscription_data: {
        metadata: {
          account_id,
          plan_id: new_plan_id,
          billing_cycle,
        },
      },
    });

    return NextResponse.json({
      success: true,
      method: 'stripe_checkout',
      checkout_url: session.url,
    });
    
  } catch (error: any) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change plan' },
      { status: 500 }
    );
  }
}
