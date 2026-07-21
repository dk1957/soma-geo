import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  
  // Check for brand_id in query params (new flow)
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brand_id')
  
  const supabase = createServiceClient()

  // If brand_id provided, check gsc_connections for that brand
  if (brandId) {
    const { data, error } = await supabase
      .from('gsc_connections')
      .select('id, is_active, site_url')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching GSC connection status:', error)
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({ 
      connected: data !== null,
      siteUrl: data?.site_url
    })
  }

  // Legacy flow - check by clerk user id
  if (!currentUser?.clerkUserId) {
    return NextResponse.json({ connected: false })
  }

  // For legacy, check if user has any connected brands
  const { data: accountMember } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('clerk_id', currentUser.clerkUserId)
    .eq('is_active', true)
    .single()

  if (!accountMember) {
    return NextResponse.json({ connected: false })
  }

  const { data: brands } = await supabase
    .from('brands')
    .select('id')
    .eq('account_id', accountMember.account_id)

  if (!brands || brands.length === 0) {
    return NextResponse.json({ connected: false })
  }

  const brandIds = brands.map(b => b.id)
  
  const { data, error } = await supabase
    .from('gsc_connections')
    .select('id')
    .in('brand_id', brandIds)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching GSC connection status:', error)
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({ connected: data !== null })
}
