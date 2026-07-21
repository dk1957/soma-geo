import { NextRequest, NextResponse } from 'next/server'
import { resolveAnalyticsContext } from '@/lib/api/analytics-auth'
import { periodToStartDate, getModelPlatform, computeTrend, computeChange } from '@/lib/types/analytics'

type CitationRow = {
  domain: string
  source_type: string | null
  is_high_authority: boolean | null
  times_referenced: number | null
}

type SentimentBucket = {
  positive: number
  neutral: number
  negative: number
  total: number
}

async function loadBrandResponseFilesForPeriod(supabase: any, brandId: string, startDate: string) {
  const { data, error } = await supabase
    .from('llm_response_files')
    .select('id, model_name')
    .eq('brand_id', brandId)
    .eq('success', true)
    .eq('extraction_status', 'complete')
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lte('created_at', new Date().toISOString())

  if (error || !data) {
    if (error) console.error('Brand analytics response file load error:', error)
    return {
      responseIds: [] as string[],
      modelByResponseId: new Map<string, string>(),
    }
  }

  return {
    responseIds: data.map((row: { id: string; model_name: string }) => row.id),
    modelByResponseId: new Map<string, string>(
      data.map((row: { id: string; model_name: string }) => [row.id, row.model_name])
    ),
  }
}

async function loadBrandScopedCitations(supabase: any, responseIds: string[]): Promise<CitationRow[]> {
  if (responseIds.length === 0) return []

  const citations: CitationRow[] = []
  for (let index = 0; index < responseIds.length; index += 200) {
    const batch = responseIds.slice(index, index + 200)
    const { data, error } = await supabase
      .from('aeo_citations')
      .select('domain, source_type, is_high_authority, times_referenced')
      .in('response_id', batch)

    if (error) {
      console.error('Brand analytics citation load error:', error)
      continue
    }

    citations.push(...((data || []) as CitationRow[]))
  }

  return citations
}

async function loadSentimentBucketsByPlatform(
  supabase: any,
  brandId: string,
  responseIds: string[],
  modelByResponseId: Map<string, string>
): Promise<Map<string, SentimentBucket>> {
  const buckets = new Map<string, SentimentBucket>()
  if (responseIds.length === 0) return buckets

  for (let index = 0; index < responseIds.length; index += 200) {
    const batch = responseIds.slice(index, index + 200)
    const { data, error } = await supabase
      .from('response_data')
      .select('response_id, raw_sentiment')
      .eq('brand_id', brandId)
      .is('competitor_id', null)
      .eq('mentioned', true)
      .in('response_id', batch)

    if (error) {
      console.error('Brand analytics sentiment load error:', error)
      continue
    }

    for (const row of (data || []) as Array<{ response_id: string; raw_sentiment: number | null }>) {
      const modelName = modelByResponseId.get(row.response_id)
      if (!modelName) continue

      const platform = getModelPlatform(modelName)
      const bucket = buckets.get(platform) || { positive: 0, neutral: 0, negative: 0, total: 0 }
      const sentiment = row.raw_sentiment ?? 0

      if (sentiment > 0.1) bucket.positive += 1
      else if (sentiment < -0.1) bucket.negative += 1
      else bucket.neutral += 1

      bucket.total += 1
      buckets.set(platform, bucket)
    }
  }

  return buckets
}

/**
 * Brand Analytics API
 * ===================
 * Comprehensive brand visibility breakdown: LVI components, per-model scores,
 * citation sources, and competitive positioning — all from real pipeline data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || searchParams.get('brand_id')
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'

    const auth = await resolveAnalyticsContext(brandId)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { context, supabase } = auth
    const startDate = periodToStartDate(period)

    // Fetch daily brand metrics for the period
    const { data: brandMetrics, error: bmError } = await supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: false })

    if (bmError) throw bmError

    // Fetch model metrics for per-platform breakdown
    const { data: modelMetrics } = await supabase
      .from('daily_model_metrics')
      .select('*')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: false })

    const { responseIds, modelByResponseId } = await loadBrandResponseFilesForPeriod(supabase, context.brandId, startDate)
    const [topDomains, sentimentBuckets] = await Promise.all([
      loadBrandScopedCitations(supabase, responseIds),
      loadSentimentBucketsByPlatform(supabase, context.brandId, responseIds, modelByResponseId),
    ])

    const latest = brandMetrics?.[0] ?? null
    const previous = brandMetrics && brandMetrics.length > 1 ? brandMetrics[1] : null

    // LVI component breakdown
    const lvi = {
      overall: latest?.lvi_score ?? 0,
      change: computeChange(latest?.lvi_score, previous?.lvi_score),
      trend: computeTrend(latest?.lvi_score, previous?.lvi_score),
      components: {
        visibility_rate: latest?.visibility_rate ?? 0,
        citation_rate: latest?.citation_rate ?? 0,
        avg_sentiment: latest?.avg_sentiment ?? 0,
        share_of_voice: latest?.share_of_voice ?? 0,
        recommendation_rate: latest?.recommendation_rate ?? 0,
        avg_competitive_density: latest?.avg_competitive_density ?? 0,
      }
    }

    // Model breakdown
    const modelMap = new Map<string, { latest: any; prev: any | null; totalResponses: number }>()
    for (const row of (modelMetrics || [])) {
      const platform = getModelPlatform(row.model_name)
      const existing = modelMap.get(platform)
      if (!existing) {
        modelMap.set(platform, { latest: row, prev: null, totalResponses: row.total_responses })
      } else {
        if (!existing.prev) existing.prev = row
        existing.totalResponses += row.total_responses
      }
    }

    const modelBreakdown = Array.from(modelMap.entries()).map(([platform, { latest: l, prev: p, totalResponses }]) => ({
      platform,
      lvi_score: l.lvi_score ?? 0,
      visibility_rate: l.visibility_rate ?? 0,
      citation_rate: l.citation_rate ?? 0,
      avg_sentiment: l.avg_sentiment ?? 0,
      share_of_voice: l.share_of_voice ?? 0,
      total_responses: totalResponses,
      responses_with_mention: l.responses_with_mention ?? 0,
      total_citations: l.total_citations ?? 0,
      total_brand_mentions: l.total_brand_mentions ?? 0,
      avg_brand_rank: l.avg_brand_rank ?? 0,
      trend: computeTrend(l.lvi_score, p?.lvi_score),
      change: computeChange(l.lvi_score, p?.lvi_score),
    })).sort((a, b) => b.lvi_score - a.lvi_score)

    // Source analysis from citations
    const domainAgg = new Map<string, { count: number; sourceType: string | null; isHighAuth: boolean }>()
    for (const c of topDomains) {
      const existing = domainAgg.get(c.domain)
      const citationCount = c.times_referenced ?? 1
      if (!existing) {
        domainAgg.set(c.domain, { count: citationCount, sourceType: c.source_type, isHighAuth: !!c.is_high_authority })
      } else {
        existing.count += citationCount
      }
    }
    const sourceAnalysis = Array.from(domainAgg.entries())
      .map(([domain, { count, sourceType, isHighAuth }]) => ({ domain, citations: count, source_type: sourceType, is_high_authority: isHighAuth }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 15)

    // Trend timeseries
    const trendData = (brandMetrics || []).map(m => ({
      date: m.run_date,
      lvi_score: m.lvi_score,
      visibility_rate: m.visibility_rate,
      citation_rate: m.citation_rate,
      avg_sentiment: m.avg_sentiment,
      share_of_voice: m.share_of_voice,
      total_responses: m.total_responses,
    })).reverse()

    // Fetch competitor data if requested
    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, competitor_name')
      .eq('brand_id', context.brandId)

    const competitorIds = (competitors || []).map(c => c.id)
    let competitorPositioning: any[] = []

    if (competitorIds.length > 0) {
      const { data: compMetrics } = await supabase
        .from('daily_competitor_metrics')
        .select('competitor_id, lvi_score, visibility_rate, citation_rate, avg_sentiment, share_of_voice, total_responses, responses_with_mention, total_citations, avg_brand_rank')
        .in('competitor_id', competitorIds)
        .order('run_date', { ascending: false })

      const compMap = new Map<string, any>()
      for (const row of (compMetrics || [])) {
        if (!compMap.has(row.competitor_id)) compMap.set(row.competitor_id, row)
      }

      competitorPositioning = (competitors || [])
        .map(c => {
          const cm = compMap.get(c.id)
          return {
            name: c.competitor_name,
            lvi_score: cm?.lvi_score ?? 0,
            visibility_rate: cm?.visibility_rate ?? 0,
            share_of_voice: cm?.share_of_voice ?? 0,
            avg_sentiment: cm?.avg_sentiment ?? 0,
            citation_rate: cm?.citation_rate ?? 0,
            total_mentions: cm?.responses_with_mention ?? 0,
            mentions: cm?.responses_with_mention ?? 0,
            total_citations: cm?.total_citations ?? 0,
            avg_position: cm?.avg_brand_rank ?? 0,
            co_mention_rate: 0,
          }
        })
        .sort((a, b) => b.lvi_score - a.lvi_score)
    }

    // Compute total citations from source_analysis
    const totalCitations = sourceAnalysis.reduce((s, d) => s + d.citations, 0)
    const highAuthCitations = sourceAnalysis.filter(d => d.is_high_authority).reduce((s, d) => s + d.citations, 0)

    // Build citation type breakdown
    const citationTypes: Record<string, number> = {}
    for (const d of sourceAnalysis) {
      const t = d.source_type || 'unknown'
      citationTypes[t] = (citationTypes[t] || 0) + d.citations
    }

    return NextResponse.json({
      success: true,
      // ── New shape (used by lib/api/client.ts, new consumers) ──
      analytics: {
        brand_name: context.brandName,
        period,
        lvi,
        model_breakdown: modelBreakdown,
        source_analysis: sourceAnalysis,
        trend_data: trendData,
        summary: {
          total_responses: latest?.total_responses ?? 0,
          total_mentions: latest?.total_brand_mentions ?? 0,
          total_citations: latest?.total_citations ?? 0,
          unique_domains: latest?.unique_citing_domains ?? 0,
          models_tracked: latest?.total_models_run ?? 0,
          last_updated: latest?.updated_at ?? null,
        }
      },
      // ── Legacy shape (used by reports/[id], prompts/[promptId], brand-visibility-report) ──
      lvi_metrics: {
        overall_lvi: lvi.overall,
        lvi_change: lvi.change,
        lvi_trend: lvi.trend,
        lvi_by_model: modelBreakdown.map(m => ({
          model: m.platform,
          model_name: m.platform,
          lvi_score: m.lvi_score,
          visibility_rate: m.visibility_rate,
          mention_rate: m.visibility_rate,
          mention_count: m.responses_with_mention,
          response_count: m.total_responses,
          citation_rate: m.citation_rate,
          citation_count: m.total_citations,
          avg_position: m.avg_brand_rank,
          sentiment: m.avg_sentiment,
          avg_sentiment: m.avg_sentiment,
          share_of_voice: m.share_of_voice,
          total_responses: m.total_responses,
          competitor_mentions: 0,
          trend: m.trend,
        })),
        lvi_by_prompt: [], // Prompt-level data handled by separate API
        lvi_components: {
          mention_frequency: latest?.visibility_rate ?? 0,
          position_quality: latest?.avg_brand_rank ? Math.max(0, 100 - (latest.avg_brand_rank * 10)) : 0,
          citation_authority: latest?.citation_rate ?? 0,
          sentiment_quality: latest?.avg_sentiment != null ? Math.round(((latest.avg_sentiment + 1) / 2) * 100) : 0,
          competitive_position: latest?.share_of_voice ?? 0,
          platform_coverage: (latest?.total_models_run ?? 0) > 0 ? Math.round((modelBreakdown.length / latest!.total_models_run) * 100) : 0,
        },
      },
      brand_info: {
        brand_id: context.brandId,
        brand_name: context.brandName,
        total_mentions: latest?.total_brand_mentions ?? 0,
        total_responses: latest?.total_responses ?? 0,
        total_citations: latest?.total_citations ?? 0,
        models_tracked: latest?.total_models_run ?? 0,
        analysis_period: {
          start: startDate,
          end: new Date().toISOString().split('T')[0],
        },
      },
      share_of_voice: {
        overall_share: latest?.share_of_voice ?? 0,
        share_by_model: modelBreakdown.map(m => ({
          model: m.platform,
          model_name: m.platform,
          share: m.share_of_voice,
          share_percentage: m.share_of_voice,
          total_responses: m.total_responses,
          brand_mentions: m.total_responses > 0 ? Math.round(m.visibility_rate / 100 * m.total_responses) : 0,
          competitor_mentions: 0,
          trend: m.trend,
        })),
        competitor_comparison: competitorPositioning.map(c => ({
          competitor_name: c.name,
          name: c.name,
          mentions: c.mentions,
          share: c.share_of_voice,
          share_percentage: c.share_of_voice,
          avg_sentiment: c.avg_sentiment,
          lvi_score: c.lvi_score,
        })),
      },
      quality_metrics: {
        mention_rate: latest?.visibility_rate ?? 0,
        avg_sentiment: latest?.avg_sentiment ?? 0,
        recommendation_rate: latest?.recommendation_rate ?? 0,
        citation_rate: latest?.citation_rate ?? 0,
        visibility_rate: latest?.visibility_rate ?? 0,
        // Legacy aliases (used by report components)
        avg_completeness: latest?.recommendation_rate ?? 0,
        avg_accuracy: latest?.citation_rate ?? 0,
        avg_relevance: latest?.visibility_rate ?? 0,
      },
      competitive_analysis: {
        direct_competitors: (competitors || []).map(c => c.competitor_name),
        discovered_brands: [],
        market_position_score: lvi.overall,
        competitor_positioning: competitorPositioning,
        detailed_competitor_analysis: competitorPositioning.map(c => {
          const mentionRate = (latest?.total_responses ?? 1) > 0 ? (c.mentions || 0) / (latest?.total_responses ?? 1) : 0
          const prominence = Math.round(mentionRate * 100)
          return {
            name: c.name,
            mention_count: c.mentions || 0,
            prominence_score: prominence,
            model_count: 0,
            models: [],
            citation_count: c.total_citations || 0,
            avg_sentiment: c.avg_sentiment || 0,
            threat_level: prominence >= 80 ? 'high' : prominence >= 40 ? 'medium' : 'low',
            market_share_estimate: prominence,
            co_mention_rate: c.co_mention_rate || 0,
          }
        }),
        sentiment_analysis: modelBreakdown.map(m => {
          const bucket = sentimentBuckets.get(m.platform) || { positive: 0, neutral: 0, negative: 0, total: 0 }
          return {
            model_name: m.platform,
            avg_sentiment: m.avg_sentiment,
            total_sentiment_scores: bucket.total,
            sentiment_distribution: {
              positive: bucket.positive,
              negative: bucket.negative,
              neutral: bucket.neutral,
            },
          }
        }),
        citation_analysis: {
          total_citations: totalCitations,
          avg_citations_per_response: (latest?.total_responses ?? 0) > 0
            ? totalCitations / latest!.total_responses
            : 0,
          avg_authority_score: sourceAnalysis.length > 0
            ? sourceAnalysis.filter(d => d.is_high_authority).length / sourceAnalysis.length * 100
            : 0,
          high_authority_citations: highAuthCitations,
          citation_types: citationTypes,
        },
      },
      source_analysis: {
        top_domains: sourceAnalysis,
        citations_by_prompt: [], // Prompt-level citations handled by separate API
        authority_distribution: {
          high_authority: sourceAnalysis.filter(d => d.is_high_authority).length,
          medium_authority: sourceAnalysis.filter(d => !d.is_high_authority).length,
          low_authority: 0,
        },
      },
      trends: {
        lvi_trend: lvi.change,
        mention_trend: computeChange(latest?.total_brand_mentions, previous?.total_brand_mentions),
        sentiment_trend: computeChange(latest?.avg_sentiment, previous?.avg_sentiment),
      },
    })
  } catch (error) {
    console.error('Brand analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}