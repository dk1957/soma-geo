import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ 
        hasAccount: false, 
        hasBrands: false, 
        isMember: false,
        isOwner: false,
      })
    }

    const supabase = createServiceClient()

    // Check owned accounts (by clerk_id)
    const { data: ownedAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_clerk_id', user.clerkUserId)
      .eq('is_active', true)

    // Check membership (by clerk_id)
    const { data: memberAccounts } = await supabase
      .from('account_users')
      .select('account_id, is_active')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)

    // Combine accounts
    const allAccountIds = [
      ...(ownedAccounts || []).map(a => a.id),
      ...(memberAccounts || []).map(m => m.account_id)
    ]

    const accountId = allAccountIds.length > 0 ? allAccountIds[0] : null

    let hasBrands = false
    if (accountId) {
      const { data: brands } = await supabase
        .from('brands')
        .select('id')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .limit(1)

      hasBrands = !!(brands && brands.length > 0)
    }

    return NextResponse.json({
      hasAccount: !!accountId,
      hasBrands,
      isMember: (memberAccounts || []).length > 0,
      isOwner: (ownedAccounts || []).length > 0,
      accountId,
    })
  } catch (error) {
    console.error('Error checking dashboard access:', error)
    return NextResponse.json({ 
      hasAccount: false, 
      hasBrands: false, 
      isMember: false,
      isOwner: false,
      error: 'Failed to check access'
    })
  }
}
