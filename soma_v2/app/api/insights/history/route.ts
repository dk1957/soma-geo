/**
 * Insight History API
 *
 * GET /api/insights/history?brand_id=<id>&limit=<n>
 *
 * Returns past strategic analyses for a brand, with pagination.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 50)

  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('strategic_insights')
      .select('id, generation_type, trigger_source, model_used, confidence_score, data_sources, created_at, analysis')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Return summaries (not full analysis) for the list
    const summaries = (data || []).map(row => ({
      id: row.id,
      generation_type: row.generation_type,
      trigger_source: row.trigger_source,
      model_used: row.model_used,
      confidence_score: row.confidence_score,
      data_sources: row.data_sources,
      created_at: row.created_at,
      executive_summary: (row.analysis as any)?.executive_summary?.substring(0, 300) || '',
      finding_count: (row.analysis as any)?.key_findings?.length || 0,
      opportunity_count: (row.analysis as any)?.opportunities?.length || 0,
      threat_count: (row.analysis as any)?.threats?.length || 0,
    }))

    return NextResponse.json({ data: summaries })
  } catch (error) {
    console.error('[Insight History] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
