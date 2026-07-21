import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'

// Toggle auto-run pause for a brand
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { user, email } = guard

    const body = await request.json()
    const { brandId, paused, reason } = body

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Use service client for admin operations
    const adminSupabase = createServiceClient()

    const updateData: Record<string, any> = {
      auto_run_paused: paused,
      updated_at: new Date().toISOString()
    }

    if (paused) {
      updateData.auto_run_paused_at = new Date().toISOString()
      updateData.auto_run_paused_by = user.clerkUserId
      updateData.auto_run_pause_reason = reason || null
    } else {
      updateData.auto_run_paused_at = null
      updateData.auto_run_paused_by = null
      updateData.auto_run_pause_reason = null
    }

    const { data, error } = await adminSupabase
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .select('id, name, auto_run_paused')
      .single()

    if (error) {
      console.error('Error updating brand auto-run status:', error)
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }

    await logAdminAction({ action: 'brand_toggle_auto_run', adminEmail: email, targetId: brandId, targetType: 'brand', metadata: { paused, reason, brandName: data?.name } })

    return NextResponse.json({
      success: true,
      brand: data,
      message: paused ? 'Auto-run paused' : 'Auto-run resumed'
    })

  } catch (error) {
    console.error('Admin brand toggle error:', error)
    return NextResponse.json({
      error: 'Failed to toggle auto-run',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
