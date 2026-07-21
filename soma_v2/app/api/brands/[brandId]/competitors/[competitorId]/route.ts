import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  // Extract IDs from URL
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const brandId = pathParts[3]
  const competitorId = pathParts[5]
  try {
    const supabase = createServiceClient()
    if (!brandId || !competitorId) {
      return NextResponse.json({ error: 'Brand ID and Competitor ID are required' }, { status: 400 })
    }

    // Get user from Clerk
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user access to the account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the competitor
    const { error: deleteError } = await supabase
      .from('competitors')
      .delete()
      .eq('id', competitorId)
      .eq('brand_id', brandId)

    if (deleteError) {
      console.error('Error deleting competitor:', deleteError)
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Competitor deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/brands/[brandId]/competitors/[competitorId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  // Extract IDs from URL
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const brandId = pathParts[3]
  const competitorId = pathParts[5]
  try {
    const supabase = createServiceClient()
    if (!brandId || !competitorId) {
      return NextResponse.json({ error: 'Brand ID and Competitor ID are required' }, { status: 400 })
    }
    const body = await request.json()

    // Get user from Clerk
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user access to the account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the competitor (deprecated metric columns removed — now derived from daily_brand_metrics)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.competitor_name) updateData.competitor_name = body.competitor_name
    if (body.competitor_domain !== undefined) updateData.competitor_domain = body.competitor_domain
    if (body.competitor_category !== undefined) updateData.competitor_category = body.competitor_category
    if (body.is_direct_competitor !== undefined) updateData.is_direct_competitor = body.is_direct_competitor
    if (body.linked_brand_id !== undefined) updateData.linked_brand_id = body.linked_brand_id

    const { data: updatedCompetitor, error: updateError } = await supabase
      .from('competitors')
      .update(updateData)
      .eq('id', competitorId)
      .eq('brand_id', brandId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating competitor:', updateError)
      return NextResponse.json({ error: 'Failed to update competitor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      competitor: updatedCompetitor
    })

  } catch (error) {
    console.error('Error in PUT /api/brands/[brandId]/competitors/[competitorId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}