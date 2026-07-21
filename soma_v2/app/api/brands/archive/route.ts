import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { id } = body

    // Check if user has permission to archive this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brand_managers')
      .select('role')
      .eq('brand_id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['primary_manager', 'manager'].includes(brandAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to archive brand' }, { status: 403 })
    }

    // Archive brand
    const { error: brandError } = await supabase
      .from('brands')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id)

    if (brandError) {
      console.error('Error archiving brand:', brandError)
      return NextResponse.json({ error: 'Failed to archive brand' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Brand archived successfully'
    })

  } catch (error) {
    console.error('Error in brands archive POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { id } = body

    // Check if user has permission to unarchive this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brand_managers')
      .select('role')
      .eq('brand_id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['primary_manager', 'manager'].includes(brandAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to unarchive brand' }, { status: 403 })
    }

    // Unarchive brand
    const { error: brandError } = await supabase
      .from('brands')
      .update({
        archived_at: null,
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', id)

    if (brandError) {
      console.error('Error unarchiving brand:', brandError)
      return NextResponse.json({ error: 'Failed to unarchive brand' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Brand unarchived successfully'
    })

  } catch (error) {
    console.error('Error in brands archive DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}