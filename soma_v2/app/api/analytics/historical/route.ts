import { NextRequest, NextResponse } from 'next/server'
import { resolveAnalyticsContext } from '@/lib/api/analytics-auth'
import { periodToStartDate, getModelPlatform } from '@/lib/types/analytics'
import type { TimeseriesPoint } from '@/lib/types/analytics'

/**
 * Historical Analytics API
 * ========================
 * Returns time-series data from daily_brand_metrics and daily_model_metrics
 * for charting LVI, visibility, citations over time.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || searchParams.get('brand_id')
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    const granularity = searchParams.get('granularity') || 'daily' // daily | weekly
    const model = searchParams.get('model') // optional: filter to specific model

    const auth = await resolveAnalyticsContext(brandId)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { context, supabase } = auth
    const startDate = periodToStartDate(period)

    // Overall brand timeseries
    const { data: brandSeries, error: bErr } = await supabase
      .from('daily_brand_metrics')
      .select('run_date, lvi_score, visibility_rate, citation_rate, avg_sentiment, share_of_voice, recommendation_rate, total_responses, total_brand_mentions, total_citations, avg_brand_rank')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: true })

    if (bErr) throw bErr

    const timeseries: TimeseriesPoint[] = (brandSeries || []).map(row => ({
      date: row.run_date,
      lvi_score: row.lvi_score ?? 0,
      visibility_rate: row.visibility_rate ?? 0,
      citation_rate: row.citation_rate ?? 0,
      avg_sentiment: row.avg_sentiment ?? 0,
      share_of_voice: row.share_of_voice ?? 0,
      recommendation_rate: row.recommendation_rate ?? 0,
      total_responses: row.total_responses ?? 0,
      total_mentions: row.total_brand_mentions ?? 0,
      total_citations: row.total_citations ?? 0,
    }))

    // Per-model timeseries (optional)
    let modelTimeseries: Record<string, Array<{ date: string; lvi_score: number; visibility_rate: number; citation_rate: number }>> = {}

    let modelQuery = supabase
      .from('daily_model_metrics')
      .select('model_name, run_date, lvi_score, visibility_rate, citation_rate, avg_sentiment, share_of_voice, total_responses')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: true })

    if (model) {
      modelQuery = modelQuery.eq('model_name', model)
    }

    const { data: modelSeries } = await modelQuery

    for (const row of (modelSeries || [])) {
      const platform = getModelPlatform(row.model_name)
      if (!modelTimeseries[platform]) modelTimeseries[platform] = []
      modelTimeseries[platform].push({
        date: row.run_date,
        lvi_score: row.lvi_score ?? 0,
        visibility_rate: row.visibility_rate ?? 0,
        citation_rate: row.citation_rate ?? 0,
      })
    }

    // Aggregate weekly if requested
    let aggregatedTimeseries = timeseries
    if (granularity === 'weekly' && timeseries.length > 7) {
      aggregatedTimeseries = aggregateWeekly(timeseries)
    }

    return NextResponse.json({
      success: true,
      historical_data: aggregatedTimeseries,
      model_timeseries: modelTimeseries,
      data_summary: {
        total_days: timeseries.length,
        models_tracked: Object.keys(modelTimeseries).length,
        date_range: {
          start: timeseries[0]?.date ?? null,
          end: timeseries[timeseries.length - 1]?.date ?? null,
        }
      },
      metadata: { period, granularity, brand_name: context.brandName }
    })
  } catch (error) {
    console.error('Analytics Historical Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = new URL(request.url)
    if (body.brandId) url.searchParams.set('brandId', body.brandId)
    if (body.period) url.searchParams.set('period', body.period)
    if (body.granularity) url.searchParams.set('granularity', body.granularity)
    return GET(new NextRequest(url.toString(), { headers: request.headers }))
  } catch (error) {
    console.error('Analytics Dashboard POST Error:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

function aggregateWeekly(daily: TimeseriesPoint[]): TimeseriesPoint[] {
  const weeks: TimeseriesPoint[] = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    const n = chunk.length
    weeks.push({
      date: chunk[0].date,
      lvi_score: Math.round(chunk.reduce((s, p) => s + p.lvi_score, 0) / n * 100) / 100,
      visibility_rate: Math.round(chunk.reduce((s, p) => s + p.visibility_rate, 0) / n * 100) / 100,
      citation_rate: Math.round(chunk.reduce((s, p) => s + p.citation_rate, 0) / n * 100) / 100,
      avg_sentiment: Math.round(chunk.reduce((s, p) => s + p.avg_sentiment, 0) / n * 1000) / 1000,
      share_of_voice: Math.round(chunk.reduce((s, p) => s + p.share_of_voice, 0) / n * 100) / 100,
      recommendation_rate: Math.round(chunk.reduce((s, p) => s + p.recommendation_rate, 0) / n * 100) / 100,
      total_responses: chunk.reduce((s, p) => s + p.total_responses, 0),
      total_mentions: chunk.reduce((s, p) => s + p.total_mentions, 0),
      total_citations: chunk.reduce((s, p) => s + p.total_citations, 0),
    })
  }
  return weeks
}
