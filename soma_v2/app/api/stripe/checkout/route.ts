// ============================================================================
// API Route: Create Stripe Checkout Session
// POST /api/stripe/checkout
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import type { BillingCycle } from '@/lib/types/subscription'
import type Stripe from 'stripe'

const BILLING_CYCLE_PRICE_FIELD: Record<BillingCycle, string> = {
  monthly: 'stripe_monthly_price_id',
  quarterly: 'stripe_quarterly_price_id',
  biannual: 'stripe_biannual_price_id',
  annual: 'stripe_annual_price_id',
  biennial: 'stripe_biennial_price_id',
}

const BILLING_CYCLE_USD_FIELD: Record<BillingCycle, string> = {
  monthly: 'monthly_price_usd',
  quarterly: 'quarterly_price_usd',
  biannual: 'biannual_price_usd',
  annual: 'annual_price_usd',
  biennial: 'biennial_price_usd',
}

const BILLING_CYCLE_INTERVAL: Record<BillingCycle, { interval: Stripe.Price.Recurring.Interval; interval_count: number }> = {
  monthly: { interval: 'month', interval_count: 1 },
  quarterly: { interval: 'month', interval_count: 3 },
  biannual: { interval: 'month', interval_count: 6 },
  annual: { interval: 'year', interval_count: 1 },
  biennial: { interval: 'year', interval_count: 2 },
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_id, plan_id, billing_cycle } = await request.json()

    if (!account_id || !plan_id || !billing_cycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!BILLING_CYCLE_PRICE_FIELD[billing_cycle as BillingCycle]) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify user has access (owner/admin only)
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accountUserError || !accountUser || !['owner', 'admin'].includes(accountUser.role)) {
      console.error('Stripe checkout access denied:', { 
        clerkUserId: currentUser.clerkUserId, 
        account_id, 
        error: accountUserError?.message,
        role: accountUser?.role 
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Determine line_items: use pre-configured Stripe Price ID if available,
    // otherwise create inline price_data from the plan's USD pricing
    const bc = billing_cycle as BillingCycle
    const priceField = BILLING_CYCLE_PRICE_FIELD[bc]
    const stripePriceId = plan[priceField] as string | null | undefined

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]

    if (stripePriceId) {
      // Use pre-configured Stripe Price
      lineItems = [{ price: stripePriceId, quantity: 1 }]
    } else {
      // Fallback: create inline price_data from plan pricing
      const usdField = BILLING_CYCLE_USD_FIELD[bc]
      const priceUsd = plan[usdField] as number | null
      
      if (!priceUsd || priceUsd <= 0) {
        return NextResponse.json(
          { error: `No pricing configured for ${billing_cycle} billing on this plan` },
          { status: 400 }
        )
      }

      const { interval, interval_count } = BILLING_CYCLE_INTERVAL[bc]

      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan.display_name} Plan`,
            description: plan.description || `Soma AI ${plan.display_name} subscription — ${billing_cycle} billing`,
          },
          unit_amount: Math.round(priceUsd * 100), // Stripe uses cents
          recurring: { interval, interval_count },
        },
        quantity: 1,
      }]
    }

    // Get or create Stripe customer
    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, stripe_customer_id')
      .eq('id', account_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    let stripeCustomerId = account.stripe_customer_id

    if (!stripeCustomerId) {
      const customerEmail = currentUser.clerkUser?.email || currentUser.profile?.email || undefined
      const customer = await stripe.customers.create({
        name: account.name,
        email: customerEmail,
        metadata: {
          account_id: account.id,
          clerk_user_id: currentUser.clerkUserId,
        },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('accounts')
        .update({ stripe_customer_id: customer.id })
        .eq('id', account_id)
    }

    // Build success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard/subscription?refresh=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/dashboard/subscription`

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      customer_update: { name: 'auto', address: 'auto' },
      mode: 'subscription',
      line_items: lineItems,
      allow_promotion_codes: true,
      tax_id_collection: { enabled: true },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        account_id: account.id,
        plan_id: plan.id,
        billing_cycle,
        clerk_user_id: currentUser.clerkUserId,
      },
      subscription_data: {
        metadata: {
          account_id: account.id,
          plan_id: plan.id,
          billing_cycle,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
