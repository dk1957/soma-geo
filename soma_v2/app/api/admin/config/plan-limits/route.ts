import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { clearConfigCache } from '@/lib/services/config-service'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/config/plan-limits
 * Get plan model limits
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('plan_model_limits')
      .select('*')
      .order('plan_slug', { ascending: true })
    
    if (error) {
      console.error('Error fetching plan limits:', error)
      return NextResponse.json({ error: 'Failed to fetch plan limits' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/config/plan-limits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config/plan-limits
 * Update plan model limits
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    
    if (!Array.isArray(body.limits)) {
      return NextResponse.json({ error: 'limits array is required' }, { status: 400 })
    }
    
    // Update each limit
    const updates = body.limits.map(async (limit: any) => {
      const { error } = await supabase
        .from('plan_model_limits')
        .upsert({
          plan_slug: limit.plan_slug,
          max_models: limit.max_models
        }, {
          onConflict: 'plan_slug'
        })
      
      if (error) {
        console.error(`Error updating ${limit.plan_slug}:`, error)
        throw error
      }
    })
    
    await Promise.all(updates)
    
    // Clear cache
    clearConfigCache()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/plan-limits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
