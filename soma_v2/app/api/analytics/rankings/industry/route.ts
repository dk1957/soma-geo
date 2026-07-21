import { NextRequest, NextResponse } from 'next/server'
import { resolveAnalyticsContext } from '@/lib/api/analytics-auth'
import { computeTrend, computeChange } from '@/lib/types/analytics'

/**
 * Industry Rankings API
 * =====================
 * Returns competitive rankings for a brand and its competitors
 * based on daily_brand_metrics LVI scores.
 *
 * Query params:
 * - brandId (required): Primary brand UUID
 * - accountId (optional): Account UUID (resolved from brand if omitted)
 * - limit (optional): Max results (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || searchParams.get('brand_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    const auth = await resolveAnalyticsContext(brandId)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { context, supabase } = auth

    // 1. Get the primary brand's latest & previous metrics
    const { data: primaryMetrics } = await supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('brand_id', context.brandId)
      .order('run_date', { ascending: false })
      .limit(2)

    const primaryLatest = primaryMetrics?.[0]
    const primaryPrev = primaryMetrics?.[1] ?? null

    // 2. Get competitors for this brand
    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, competitor_name')
      .eq('brand_id', context.brandId)

    // 3. Fetch latest metrics from daily_competitor_metrics
    const competitorIds = (competitors || []).map(c => c.id)
    const compMetricsMap = new Map<string, { latest: any; prev: any | null }>()

    if (competitorIds.length > 0) {
      const { data: compMetrics } = await supabase
        .from('daily_competitor_metrics')
        .select('*')
        .in('competitor_id', competitorIds)
        .order('run_date', { ascending: false })

      for (const row of (compMetrics || [])) {
        const existing = compMetricsMap.get(row.competitor_id)
        if (!existing) {
          compMetricsMap.set(row.competitor_id, { latest: row, prev: null })
        } else if (!existing.prev) {
          existing.prev = row
        }
      }
    }

    // 4. Build combined rankings array
    const rankings: any[] = []

    // Primary brand entry
    if (primaryLatest) {
      // Zero-visibility enforcement: if brand has no mentions, LVI = 0 and sentiment is meaningless
      const primaryInvisible = (primaryLatest.visibility_rate ?? 0) === 0 && (primaryLatest.responses_with_mention ?? 0) === 0
      rankings.push({
        brand_name: context.brandName,
        is_primary: true,
        lvi_score: primaryInvisible ? 0 : (primaryLatest.lvi_score ?? 0),
        mention_rate: primaryLatest.visibility_rate ?? 0,
        avg_position: primaryInvisible ? null : (primaryLatest.avg_brand_rank ?? null),
        avg_sentiment: primaryInvisible ? 0 : (primaryLatest.avg_sentiment ?? 0),
        share_of_voice: primaryInvisible ? null : (primaryLatest.share_of_voice ?? null),
        citation_rate: primaryLatest.citation_rate ?? 0,
        recommendation_rate: primaryLatest.recommendation_rate ?? 0,
        total_responses: primaryLatest.total_responses ?? 0,
        mention_count: primaryLatest.responses_with_mention ?? 0,
        lvi_change: computeChange(primaryLatest.lvi_score, primaryPrev?.lvi_score),
        lvi_change_pct: primaryPrev?.lvi_score
          ? ((primaryLatest.lvi_score - primaryPrev.lvi_score) / Math.max(primaryPrev.lvi_score, 0.01)) * 100
          : 0,
        mention_rate_change_pct: primaryPrev?.visibility_rate
          ? ((primaryLatest.visibility_rate - primaryPrev.visibility_rate) / Math.max(primaryPrev.visibility_rate, 0.01)) * 100
          : 0,
        avg_position_change_pct: primaryPrev?.avg_brand_rank && primaryLatest.avg_brand_rank
          ? ((primaryLatest.avg_brand_rank - primaryPrev.avg_brand_rank) / Math.max(primaryPrev.avg_brand_rank, 0.01)) * 100
          : 0,
        share_of_voice_change_pct: primaryPrev?.share_of_voice != null && primaryLatest.share_of_voice != null
          ? ((primaryLatest.share_of_voice - primaryPrev.share_of_voice) / Math.max(primaryPrev.share_of_voice, 0.01)) * 100
          : 0,
        sentiment_change_pct: primaryPrev?.avg_sentiment
          ? ((primaryLatest.avg_sentiment - primaryPrev.avg_sentiment) / Math.max(Math.abs(primaryPrev.avg_sentiment), 0.01)) * 100
          : 0,
      })
    }

    // Competitor entries
    for (const comp of (competitors || [])) {
      const cm = compMetricsMap.get(comp.id)
      const cl = cm?.latest
      const cp = cm?.prev

      if (!cl) {
        // Competitor without metrics — placeholder
        rankings.push({
          brand_name: comp.competitor_name,
          is_primary: false,
          lvi_score: 0,
          mention_rate: 0,
          avg_position: null,
          avg_sentiment: 0,
          share_of_voice: null,
          citation_rate: 0,
          recommendation_rate: 0,
          total_responses: 0,
          mention_count: 0,
          lvi_change: 0,
          lvi_change_pct: 0,
          mention_rate_change_pct: 0,
          avg_position_change_pct: 0,
          share_of_voice_change_pct: 0,
          sentiment_change_pct: 0,
        })
        continue
      }

      // Zero-visibility enforcement
      const compInvisible = (cl.visibility_rate ?? 0) === 0 && (cl.responses_with_mention ?? 0) === 0

      rankings.push({
        brand_name: comp.competitor_name,
        is_primary: false,
        lvi_score: compInvisible ? 0 : (cl?.lvi_score ?? 0),
        mention_rate: cl?.visibility_rate ?? 0,
        avg_position: compInvisible ? null : (cl?.avg_brand_rank ?? null),
        avg_sentiment: compInvisible ? 0 : (cl?.avg_sentiment ?? 0),
        share_of_voice: compInvisible ? null : (cl?.share_of_voice ?? null),
        citation_rate: cl?.citation_rate ?? 0,
        recommendation_rate: cl?.recommendation_rate ?? 0,
        total_responses: cl?.total_responses ?? 0,
        mention_count: cl?.responses_with_mention ?? 0,
        lvi_change: computeChange(cl?.lvi_score, cp?.lvi_score),
        lvi_change_pct: cl && cp?.lvi_score
          ? ((cl.lvi_score - cp.lvi_score) / Math.max(cp.lvi_score, 0.01)) * 100
          : 0,
        mention_rate_change_pct: cl && cp?.visibility_rate
          ? ((cl.visibility_rate - cp.visibility_rate) / Math.max(cp.visibility_rate, 0.01)) * 100
          : 0,
        avg_position_change_pct: cl?.avg_brand_rank && cp?.avg_brand_rank
          ? ((cl.avg_brand_rank - cp.avg_brand_rank) / Math.max(cp.avg_brand_rank, 0.01)) * 100
          : 0,
        share_of_voice_change_pct: cl?.share_of_voice != null && cp?.share_of_voice != null
          ? ((cl.share_of_voice - cp.share_of_voice) / Math.max(cp.share_of_voice, 0.01)) * 100
          : 0,
        sentiment_change_pct: cl && cp?.avg_sentiment
          ? ((cl.avg_sentiment - cp.avg_sentiment) / Math.max(Math.abs(cp.avg_sentiment), 0.01)) * 100
          : 0,
      })
    }

    // Sort by LVI descending and assign ranks
    rankings.sort((a, b) => b.lvi_score - a.lvi_score)
    rankings.forEach((r, i) => { r.rank = i + 1 })

    const primaryRank = rankings.find(r => r.is_primary)?.rank ?? null

    return NextResponse.json({
      rankings: rankings.slice(0, limit),
      metadata: {
        total_brands: rankings.length,
        primary_brand_rank: primaryRank,
        date_range: {
          start: primaryMetrics?.[primaryMetrics.length - 1]?.run_date ?? null,
          end: primaryMetrics?.[0]?.run_date ?? null,
        }
      }
    })
  } catch (error) {
    console.error('Industry rankings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industry rankings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
