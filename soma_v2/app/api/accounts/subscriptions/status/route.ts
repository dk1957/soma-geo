import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/dashboard/subscriptions/status
 * Returns subscription validity status for the current account.
 * Used by the SubscriptionBanner and PaywallOverlay components.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify user has access
    const { data: access } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .maybeSingle()

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('account_subscriptions')
      .select(`
        id, status, billing_cycle, 
        current_period_start, current_period_end,
        trial_start, trial_end,
        plan:subscription_plans(plan_name, display_name, plan_tier)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json({
        success: true,
        status: {
          is_valid: false,
          status: 'none',
          days_remaining: null,
          plan_name: null,
          is_trial: false,
        }
      })
    }

    const now = new Date()
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
    const isTrial = subscription.status === 'trialing'
    const dbStatusActive = ['active', 'trialing'].includes(subscription.status)
    
    let daysRemaining: number | null = null
    if (isTrial && trialEnd) {
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else if (periodEnd) {
      daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Derive effective status: if period has ended but DB still says active
    // (e.g. auto_renew enabled but no payment processor to actually renew),
    // treat it as expired
    const periodExpired = daysRemaining !== null && daysRemaining <= 0
    const isValid = dbStatusActive && !periodExpired
    const effectiveStatus = dbStatusActive && periodExpired ? 'expired' : subscription.status

    const plan = subscription.plan as any

    return NextResponse.json({
      success: true,
      status: {
        is_valid: isValid,
        status: effectiveStatus,
        days_remaining: daysRemaining,
        plan_name: plan?.display_name || plan?.plan_name || null,
        is_trial: isTrial,
      }
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
