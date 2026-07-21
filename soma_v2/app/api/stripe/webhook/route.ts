// ============================================================================
// Stripe Webhook Handler
// POST /api/stripe/webhook
// Processes Stripe events to sync subscription state with the database.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30s for webhook processing

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient()
  const accountId = session.metadata?.account_id
  const planId = session.metadata?.plan_id
  const billingCycle = session.metadata?.billing_cycle
  const clerkUserId = session.metadata?.clerk_user_id

  if (!accountId || !planId) {
    console.error('Webhook: Missing metadata in checkout session', session.id)
    return
  }

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id

  if (!stripeSubscriptionId) {
    console.error('Webhook: No subscription ID from checkout', session.id)
    return
  }

  // Fetch the full subscription from Stripe for period dates
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id || null

  // Check for existing subscription on this account
  const { data: existingSub } = await supabase
    .from('account_subscriptions')
    .select('id, status, plan_id')
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing', 'expired', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()
  const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString()
  const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString()
  const amount = session.amount_total ? session.amount_total / 100 : null

  if (existingSub) {
    // Update existing subscription
    await supabase
      .from('account_subscriptions')
      .update({
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle || 'monthly',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        amount_paid: amount,
        auto_renew: true,
        ended_at: null,
        canceled_at: null,
        updated_at: now,
      })
      .eq('id', existingSub.id)

    // Un-pause auto_run on brands
    await supabase
      .from('brands')
      .update({
        auto_run_paused: false,
        auto_run_paused_at: null,
        auto_run_pause_reason: null,
      })
      .eq('account_id', accountId)
      .eq('is_active', true)

    await supabase.from('subscription_history').insert({
      account_id: accountId,
      subscription_id: existingSub.id,
      event_type: existingSub.status === 'expired' ? 'renewed' : 'upgraded',
      event_data: { stripe_session_id: session.id, payment_method: 'stripe' },
      previous_plan_id: existingSub.plan_id,
      new_plan_id: planId,
      previous_status: existingSub.status,
      new_status: 'active',
      amount,
      currency: 'USD',
      triggered_by: clerkUserId || 'stripe_webhook',
    })
  } else {
    // Create new subscription
    const { data: newSub } = await supabase
      .from('account_subscriptions')
      .insert({
        account_id: accountId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle || 'monthly',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        amount_paid: amount,
        currency: 'USD',
        auto_renew: true,
      })
      .select('id')
      .single()

    if (newSub) {
      await supabase.from('subscription_history').insert({
        account_id: accountId,
        subscription_id: newSub.id,
        event_type: 'created',
        event_data: { stripe_session_id: session.id, payment_method: 'stripe' },
        new_plan_id: planId,
        new_status: 'active',
        amount,
        currency: 'USD',
        triggered_by: clerkUserId || 'stripe_webhook',
      })
    }
  }

  // Update Stripe customer ID on the account
  if (stripeCustomerId) {
    await supabase
      .from('accounts')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', accountId)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createServiceClient()
  const accountId = subscription.metadata?.account_id

  if (!accountId) return

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

  const mappedStatus = statusMap[subscription.status] || subscription.status
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString()
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  const updateData: Record<string, any> = {
    status: mappedStatus,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    auto_renew: !subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  // Sync plan_id and billing_cycle if present in metadata
  if (subscription.metadata?.plan_id) {
    updateData.plan_id = subscription.metadata.plan_id
  }
  if (subscription.metadata?.billing_cycle) {
    updateData.billing_cycle = subscription.metadata.billing_cycle
  }

  await supabase
    .from('account_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createServiceClient()

  await supabase
    .from('account_subscriptions')
    .update({
      status: 'expired',
      ended_at: new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Pause auto_run on brands
  const accountId = subscription.metadata?.account_id
  if (accountId) {
    await supabase
      .from('brands')
      .update({
        auto_run_paused: true,
        auto_run_paused_at: new Date().toISOString(),
        auto_run_pause_reason: 'Subscription canceled',
      })
      .eq('account_id', accountId)
      .eq('is_active', true)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Handle subscription renewals and plan change invoices
  const relevantReasons = ['subscription_cycle', 'subscription_update', 'subscription_create']
  if (!invoice.billing_reason || !relevantReasons.includes(invoice.billing_reason)) return

  const supabase = createServiceClient()
  const stripeSubscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id

  if (!stripeSubscriptionId) return

  // Get the subscription to update period dates
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  await supabase
    .from('account_subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      amount_paid: invoice.amount_paid ? invoice.amount_paid / 100 : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  // Log renewal event for audit trail
  if (invoice.billing_reason === 'subscription_cycle') {
    const { data: localSub } = await supabase
      .from('account_subscriptions')
      .select('id, account_id, plan_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (localSub) {
      await supabase.from('subscription_history').insert({
        account_id: localSub.account_id,
        subscription_id: localSub.id,
        event_type: 'renewed',
        new_plan_id: localSub.plan_id,
        new_status: 'active',
        amount: invoice.amount_paid ? invoice.amount_paid / 100 : null,
        currency: 'USD',
        event_data: {
          invoice_id: invoice.id,
          billing_reason: invoice.billing_reason,
        },
        triggered_by: 'stripe_webhook',
      }).catch(() => {})
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createServiceClient()
  const stripeSubscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id

  if (!stripeSubscriptionId) return

  await supabase
    .from('account_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  // Log payment failure for audit trail
  const { data: localSub } = await supabase
    .from('account_subscriptions')
    .select('id, account_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (localSub) {
    await supabase.from('subscription_history').insert({
      account_id: localSub.account_id,
      subscription_id: localSub.id,
      event_type: 'payment_failed',
      new_status: 'past_due',
      event_data: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due ? invoice.amount_due / 100 : null,
        attempt_count: invoice.attempt_count,
        next_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null,
      },
      triggered_by: 'stripe_webhook',
    }).catch(() => {})

    // Notify account users about payment failure
    const { data: accountUsers } = await supabase
      .from('account_users')
      .select('clerk_id')
      .eq('account_id', localSub.account_id)
      .eq('is_active', true)

    if (accountUsers && accountUsers.length > 0) {
      const notifications = accountUsers.map(au => ({
        clerk_id: au.clerk_id,
        account_id: localSub.account_id,
        type: 'payment_failed',
        title: 'Payment failed',
        message: 'Your subscription payment could not be processed. Please update your payment method to avoid service interruption.',
        action_url: '/dashboard/subscription',
        is_read: false,
      }))

      await supabase.from('notifications').insert(notifications).catch(() => {})
    }
  }
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  const supabase = createServiceClient()
  const accountId = subscription.metadata?.account_id

  await supabase
    .from('account_subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Pause auto_run on brands
  if (accountId) {
    await supabase
      .from('brands')
      .update({
        auto_run_paused: true,
        auto_run_paused_at: new Date().toISOString(),
        auto_run_pause_reason: 'Subscription paused',
      })
      .eq('account_id', accountId)
      .eq('is_active', true)
  }
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  const supabase = createServiceClient()
  const accountId = subscription.metadata?.account_id
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString()
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  await supabase
    .from('account_subscriptions')
    .update({
      status: 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      auto_renew: !subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Un-pause auto_run on brands
  if (accountId) {
    await supabase
      .from('brands')
      .update({
        auto_run_paused: false,
        auto_run_paused_at: null,
        auto_run_pause_reason: null,
      })
      .eq('account_id', accountId)
      .eq('is_active', true)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  // Stripe sends this 3 days before trial ends
  // Create a notification so the user knows to subscribe
  const supabase = createServiceClient()
  const accountId = subscription.metadata?.account_id

  if (!accountId) return

  const trialEnd = new Date(subscription.trial_end! * 1000)
  const daysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // Get account users to notify
  const { data: accountUsers } = await supabase
    .from('account_users')
    .select('clerk_id')
    .eq('account_id', accountId)
    .eq('is_active', true)

  if (accountUsers && accountUsers.length > 0) {
    const notifications = accountUsers.map(au => ({
      clerk_id: au.clerk_id,
      account_id: accountId,
      type: 'trial_ending',
      title: 'Your trial ends soon',
      message: `Your free trial ends in ${daysRemaining} days. Subscribe to keep your data and continue tracking.`,
      action_url: '/dashboard/subscription',
      is_read: false,
    }))

    await supabase
      .from('notifications')
      .insert(notifications)
      .then(() => console.log(`Trial ending notifications sent for account ${accountId}`))
      .catch(err => console.warn('Failed to create trial ending notifications:', err))
  }

  // Log the event
  const { data: existingSub } = await supabase
    .from('account_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (existingSub) {
    await supabase.from('subscription_history').insert({
      account_id: accountId,
      subscription_id: existingSub.id,
      event_type: 'trial_ending',
      event_data: { days_remaining: daysRemaining, trial_end: trialEnd.toISOString() },
      triggered_by: 'stripe_webhook',
    }).catch(() => {})
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event: Stripe.Event

    // Verify webhook signature — REQUIRED in production
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, always require signature verification
      console.error('Webhook rejected: STRIPE_WEBHOOK_SECRET not configured in production')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    } else {
      // In development without webhook secret, parse the event directly
      event = JSON.parse(body) as Stripe.Event
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.resumed':
        await handleSubscriptionResumed(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
