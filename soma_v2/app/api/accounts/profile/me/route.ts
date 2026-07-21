import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser, ensureProfile } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Ensure profile exists
    let profile = user.profile
    if (!profile && user.clerkUserId) {
      try {
        profile = await ensureProfile()
      } catch (error) {
        console.error('Error creating profile:', error)
      }
    }

    // Fetch account memberships using service role (bypass RLS)
    const { data: accountMemberships, error: membershipsError } = await supabase
      .from('account_users')
      .select(`
        role,
        joined_at,
        is_active,
        accounts (
          id,
          name,
          slug,
          account_type,
          billing_plan
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })

    if (membershipsError) {
      console.error('Error fetching account memberships:', membershipsError)
    }

      // Fetch brands for the user's accounts (use service client to bypass RLS)
      const accountIds = accountMemberships?.map((m: any) => m.accounts.id) || []
      let accessibleBrands: any[] = []
      if (accountIds.length > 0) {
        const { data: brandsForAccounts, error: brandsError } = await supabase
          .from('brands')
          .select(`*, account:accounts(*), workspaces(*)`)
          .in('account_id', accountIds)
          .eq('is_active', true)

        if (brandsError) {
          console.error('Error fetching brands for accounts:', brandsError)
        } else {
          // Filter out competitor-linked brands (they should only appear as benchmarks, not in dropdown)
          const { data: competitorLinks } = await supabase
            .from('competitors')
            .select('linked_brand_id')
            .in('account_id', accountIds)
            .not('linked_brand_id', 'is', null)

          const competitorBrandIds = new Set(
            (competitorLinks || []).map((c: any) => c.linked_brand_id)
          )

          accessibleBrands = (brandsForAccounts || []).filter(
            (brand: any) => !competitorBrandIds.has(brand.id)
          )
        }
      }

    const formattedProfile = {
      ...profile,
      account_memberships: accountMemberships?.map((membership: any) => ({
        ...membership.accounts,
        user_role: membership.role,
        joined_at: membership.joined_at
      })) || [],
      accessible_brands: accessibleBrands
    }

    return NextResponse.json({ success: true, profile: formattedProfile, clerkUser: user.clerkUser })
  } catch (error) {
    console.error('Error in /api/profile/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
