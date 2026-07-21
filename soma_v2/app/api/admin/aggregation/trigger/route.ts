import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { AEOAggregatorService } from '@/lib/services/aeo-aggregator'
import { getAccountTimezone, getDateInTimezone } from '@/lib/utils/timezone'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json().catch(() => ({}))
    const { runDate, accountId, brandId, timezone: explicitTz } = body

    // Resolve timezone: explicit > account lookup > UTC
    let tz = explicitTz || 'UTC'
    if (!explicitTz && accountId) {
      const supabase = createServiceClient()
      tz = await getAccountTimezone(supabase, accountId)
    }

    const aggregator = new AEOAggregatorService()
    const effectiveDate = runDate || getDateInTimezone(tz)
    const result = await aggregator.aggregateForDate(effectiveDate, { accountId, brandId, timezone: tz })

    return NextResponse.json({
      success: true,
      runDate: effectiveDate,
      timezone: tz,
      ...result,
    })
  } catch (error) {
    console.error('[API] Aggregation trigger error:', error)
    return NextResponse.json({
      error: 'Aggregation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
