import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { user, email } = guard

    const { accountId, suspended } = await request.json()
    if (!accountId || typeof suspended !== 'boolean') {
      return NextResponse.json({ error: 'accountId and suspended (boolean) are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // 2. Pause/unpause all brands under this account
    const brandUpdate: Record<string, any> = {
      auto_run_paused: suspended,
      updated_at: new Date().toISOString()
    }

    if (suspended) {
      brandUpdate.auto_run_paused_at = new Date().toISOString()
      brandUpdate.auto_run_paused_by = user.clerkUserId
      brandUpdate.auto_run_pause_reason = 'Account suspended by admin'
    } else {
      brandUpdate.auto_run_paused_at = null
      brandUpdate.auto_run_paused_by = null
      brandUpdate.auto_run_pause_reason = null
    }

    const { data: updatedBrands, error: brandsError } = await supabase
      .from('brands')
      .update(brandUpdate)
      .eq('account_id', accountId)
      .select('id, name')

    if (brandsError) {
      console.error('[Admin Suspend Account] Error updating brands:', brandsError)
    }

    // 3. Update subscription status if exists
    if (suspended) {
      const { error: subError } = await supabase
        .from('account_subscriptions')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .in('status', ['active', 'trialing'])

      if (subError) {
        console.error('[Admin Suspend Account] Error suspending subscription:', subError)
      }
    } else {
      // Reactivate subscription
      const { error: subError } = await supabase
        .from('account_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .eq('status', 'suspended')

      if (subError) {
        console.error('[Admin Suspend Account] Error reactivating subscription:', subError)
      }
    }

    const action = suspended ? 'suspended' : 'unsuspended'
    console.log(`[Admin Suspend Account] Account "${account.name}" (${accountId}) ${action}. ${updatedBrands?.length || 0} brands affected.`)
    await logAdminAction({ action: suspended ? 'account_suspend' : 'account_unsuspend', adminEmail: email, targetId: accountId, targetType: 'account', metadata: { accountName: account.name, brandsAffected: updatedBrands?.length || 0 } })

    return NextResponse.json({
      success: true,
      message: `Account "${account.name}" has been ${action}`,
      accountId,
      suspended,
      brandsAffected: updatedBrands?.length || 0
    })
  } catch (error) {
    console.error('[Admin Suspend Account] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
