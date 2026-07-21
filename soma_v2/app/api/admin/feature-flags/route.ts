import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch public feature flags (read-only, no auth required)
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('system_configurations')
      .select('key, value')
      .eq('category', 'features')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json({ flags: {} })
    }

    // Transform array into key-value map
    const flags: Record<string, any> = {}
    for (const row of data || []) {
      flags[row.key] = row.value
    }

    return NextResponse.json({ flags })
  } catch (error) {
    console.error('Error in GET /api/feature-flags:', error)
    return NextResponse.json({ flags: {} })
  }
}
