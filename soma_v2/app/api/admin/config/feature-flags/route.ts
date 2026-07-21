import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET - Fetch all feature flags
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', 'features')
      .order('key')

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 })
    }

    return NextResponse.json({ flags: data || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/config/feature-flags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a feature flag
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email } = guard

    const body = await request.json()
    const { key, value, description } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('system_configurations')
      .upsert({
        key,
        value: typeof value === 'object' ? value : { enabled: value },
        description: description || null,
        category: 'features',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      console.error('Error updating feature flag:', error)
      return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
    }

    return NextResponse.json({ flag: data })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/feature-flags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
