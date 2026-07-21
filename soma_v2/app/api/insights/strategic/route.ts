/**
 * Strategic Insights API
 *
 * POST /api/insights/strategic?brand_id=<id>  — Generate new LLM-powered analysis
 * GET  /api/insights/strategic?brand_id=<id>  — Get cached or most recent analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { StrategicInsightAgent } from '@/lib/services/strategic-insight-agent'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('strategic_insights')
      .select('id, analysis, model_used, generation_type, data_sources, confidence_score, created_at')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ data: null, message: 'No analysis available. Generate one first.' })
    }

    return NextResponse.json({
      data: {
        id: data.id,
        ...data.analysis as any,
        model_used: data.model_used,
        generation_type: data.generation_type,
        data_sources: data.data_sources,
        confidence_score: data.confidence_score,
        created_at: data.created_at,
        cached: true,
      },
    })
  } catch (error) {
    console.error('[Strategic Insights GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const forceRefresh = body.force_refresh === true

    const agent = new StrategicInsightAgent()
    const analysis = await agent.generateAnalysis(brandId, {
      forceRefresh,
      triggerSource: 'manual',
    })

    return NextResponse.json({ data: analysis })
  } catch (error) {
    console.error('[Strategic Insights POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}
