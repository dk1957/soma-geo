import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/cron/check-subscriptions
 * Cron job to:
 * 1. Expire overdue subscriptions
 * 2. Log expiry events
 * 3. Return summary of actions taken
 * 
 * Should be called daily by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const results: {
      expired: Array<{ account_id: string; account_name: string; plan_name: string; was_trial: boolean }>
      expiring_soon: Array<{ account_id: string; account_name: string; plan_name: string; days_remaining: number }>
      errors: string[]
    } = {
      expired: [],
      expiring_soon: [],
      errors: []
    }

    // 1. Expire overdue subscriptions
    try {
      const { data: expiredSubs, error: expireError } = await supabase
        .rpc('expire_overdue_subscriptions')

      if (expireError) {
        results.errors.push(`Expiry check failed: ${expireError.message}`)
      } else if (expiredSubs && expiredSubs.length > 0) {
        results.expired = expiredSubs.map((s: any) => ({
          account_id: s.account_id,
          account_name: s.account_name,
          plan_name: s.plan_name,
          was_trial: s.was_trial,
        }))

        // Log expiry events to subscription_history
        for (const sub of expiredSubs) {
          await supabase.from('subscription_history').insert({
            account_id: sub.account_id,
            subscription_id: sub.subscription_id,
            event_type: sub.was_trial ? 'trial_ended' : 'expired',
            event_data: {
              plan_name: sub.plan_name,
              expired_by_cron: true,
              expired_at: sub.expired_at,
            },
            new_status: 'expired',
            previous_status: sub.was_trial ? 'trialing' : 'active',
            notes: `Auto-expired by subscription check cron`,
          })
        }

        // Pause auto-run on all brands for expired accounts
        for (const sub of expiredSubs) {
          await supabase
            .from('brands')
            .update({
              auto_run_paused: true,
              auto_run_paused_at: new Date().toISOString(),
              auto_run_pause_reason: 'Subscription expired',
            })
            .eq('account_id', sub.account_id)
            .eq('is_active', true)
        }
      }
    } catch (err: any) {
      results.errors.push(`Expiry process error: ${err.message}`)
    }

    // 2. Get subscriptions expiring in next 7 days (for notifications/reminders)
    try {
      const { data: expiringSoon, error: expiringError } = await supabase
        .rpc('get_expiring_subscriptions', { p_days_ahead: 7 })

      if (expiringError) {
        results.errors.push(`Expiring check failed: ${expiringError.message}`)
      } else if (expiringSoon) {
        results.expiring_soon = expiringSoon.map((s: any) => ({
          account_id: s.account_id,
          account_name: s.account_name,
          plan_name: s.plan_name,
          days_remaining: s.days_remaining,
        }))
      }
    } catch (err: any) {
      results.errors.push(`Expiring soon check error: ${err.message}`)
    }

    // 2b. Create notifications for expired and expiring subscriptions
    try {
      // Notify all members of newly expired accounts
      for (const sub of results.expired) {
        const { data: members } = await supabase
          .from('account_users')
          .select('clerk_id')
          .eq('account_id', sub.account_id)
          .eq('is_active', true)

        if (members) {
          for (const member of members) {
            if (!member.clerk_id) continue
            await supabase.rpc('create_user_notification', {
              p_clerk_id: member.clerk_id,
              p_account_id: sub.account_id,
              p_type: 'system',
              p_title: 'Subscription Expired',
              p_message: `Your ${sub.plan_name || 'subscription'} plan has expired. Upgrade now to restore access to all features.`,
              p_action_url: '/dashboard/subscription',
              p_metadata: JSON.stringify({ event: 'subscription_expired', was_trial: sub.was_trial }),
            })
          }
        }
      }

      // Notify members of accounts expiring soon (only at 7, 3, and 1 day marks to avoid spam)
      const notifyAtDays = [7, 3, 1]
      for (const sub of results.expiring_soon) {
        if (!notifyAtDays.includes(sub.days_remaining)) continue

        // Check if we already sent a notification for this day
        const { count } = await supabase
          .from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', sub.account_id)
          .eq('type', 'system')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .ilike('title', '%expir%')

        if (count && count > 0) continue // Already notified today

        const { data: members } = await supabase
          .from('account_users')
          .select('clerk_id')
          .eq('account_id', sub.account_id)
          .eq('is_active', true)

        if (members) {
          const dayText = sub.days_remaining === 1 ? '1 day' : `${sub.days_remaining} days`
          for (const member of members) {
            if (!member.clerk_id) continue
            await supabase.rpc('create_user_notification', {
              p_clerk_id: member.clerk_id,
              p_account_id: sub.account_id,
              p_type: 'system',
              p_title: 'Subscription Expiring Soon',
              p_message: `Your ${sub.plan_name || 'subscription'} plan expires in ${dayText}. Renew now to avoid losing access.`,
              p_action_url: '/dashboard/subscription',
              p_metadata: JSON.stringify({ event: 'subscription_expiring', days_remaining: sub.days_remaining }),
            })
          }
        }
      }
    } catch (err: any) {
      results.errors.push(`Notification creation error: ${err.message}`)
    }

    // 3. Clean up old rate limit entries
    try {
      await supabase.rpc('cleanup_rate_limits')
    } catch {
      // Non-critical, ignore
    }

    // 4. Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'check-subscriptions',
      status: results.errors.length > 0 ? 'partial_failure' : 'success',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      results: {
        expired_count: results.expired.length,
        expiring_soon_count: results.expiring_soon.length,
        errors: results.errors,
      },
    })

    return NextResponse.json({
      success: true,
      summary: {
        subscriptions_expired: results.expired.length,
        subscriptions_expiring_soon: results.expiring_soon.length,
        errors: results.errors.length,
      },
      details: results,
    })
  } catch (error: any) {
    console.error('Cron check-subscriptions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request)
}
