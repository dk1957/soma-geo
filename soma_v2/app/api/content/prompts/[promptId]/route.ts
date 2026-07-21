import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Unified Prompt Detail API
 * =========================
 * Returns everything the prompt detail page needs in a single request:
 *   - Prompt metadata (text, category, geography, topic)
 *   - Summary metrics (LVI, position, sentiment, citations, mention rate)
 *   - Time series from daily_prompt_metrics
 *   - Platform/model breakdown
 *   - Competitor rankings (from response_data co-mentions)
 *   - Recent responses list (paginated)
 *
 * This replaces 4 separate client-side fetches with one server-side call,
 * ensuring data consistency and resilience.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const responsesLimit = Math.min(Math.max(parseInt(searchParams.get('responses_limit') || '200') || 200, 1), 500)

    if (!brandId) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // ─── Auth: verify brand access ───
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id, name')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // ─── 1. Load prompt metadata ───
    const { data: prompt, error: promptError } = await supabase
      .from('user_prompts')
      .select(`
        *,
        country:countries(id, code, name, flag_emoji),
        topic:prompt_topics(id, name, slug, color, icon)
      `)
      .eq('id', promptId)
      .eq('brand_id', brandId)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // ─── 2. Load response files for this prompt ───
    const { data: responseFiles } = await supabase
      .from('llm_response_files')
      .select('id, prompt_id, prompt_text, model_name, model_provider, response_preview, created_at, run_id, response_time_ms, success, cost_estimate, word_count, storage_path, extraction_status')
      .eq('brand_id', brandId)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(responsesLimit)

    const allResponseFiles = responseFiles || []
    const extractedFiles = allResponseFiles.filter(f => f.extraction_status === 'complete')
    const responseIds = extractedFiles.map(f => f.id)

    // ─── 3. Load response_data for analytics ───
    let responseData: any[] = []
    if (responseIds.length > 0) {
      // Batch fetch
      for (let i = 0; i < responseIds.length; i += 500) {
        const batch = responseIds.slice(i, i + 500)
        const { data } = await supabase
          .from('response_data')
          .select('response_id, brand_id, mentioned, brand_rank, brand_mention_count, raw_sentiment, citation_count, total_response_citations, is_primary_recommendation, co_mentioned_brands, competitive_density, created_at')
          .eq('brand_id', brandId)
          .in('response_id', batch)

        if (data) responseData = responseData.concat(data)
      }
    }

    // ─── 4. Load daily_prompt_metrics (authoritative source — same as dashboard) ───
    const { data: dailyMetrics } = await supabase
      .from('daily_prompt_metrics')
      .select('run_date, lvi_score, visibility_rate, avg_sentiment, avg_brand_rank, citation_rate, total_responses, share_of_voice')
      .eq('prompt_id', promptId)
      .eq('brand_id', brandId)
      .order('run_date', { ascending: true })

    const timeSeries = (dailyMetrics || []).map(d => ({
      date: d.run_date,
      lvi: d.lvi_score,
      visibility: d.visibility_rate,
      sentiment: d.avg_sentiment,
      position: d.avg_brand_rank,
      citationRate: d.citation_rate,
      responses: d.total_responses,
      mentions: d.visibility_rate > 0 && d.total_responses > 0
        ? Math.round(d.total_responses * d.visibility_rate / 100)
        : 0,
      sov: d.share_of_voice,
    }))

    // ─── 5. Compute summary metrics ───
    // Primary: use latest daily_prompt_metrics (pre-aggregated by AEO aggregator
    // with per-account LVI weights from lvi_config — same pipeline as dashboard)
    const latestDailyMetric = dailyMetrics && dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1] : null

    // Fallback: compute from raw response_data (only when no aggregated data exists)
    const totalResponsesRaw = responseData.length
    const mentionedRows = responseData.filter(r => r.mentioned)
    const citedRows = mentionedRows.filter(r => r.citation_count > 0)

    let totalResponses: number
    let mentionRate: number
    let avgSentiment: number | null
    let avgPosition: number | null
    let citationRate: number
    let finalLvi: number
    let mentionCount: number
    let citationCount: number

    if (latestDailyMetric) {
      // Use pre-aggregated metrics (matches dashboard methodology exactly)
      totalResponses = latestDailyMetric.total_responses
      mentionRate = latestDailyMetric.visibility_rate
      avgSentiment = latestDailyMetric.avg_sentiment ?? null
      avgPosition = latestDailyMetric.avg_brand_rank
      citationRate = latestDailyMetric.citation_rate
      finalLvi = latestDailyMetric.lvi_score

      // Derive counts from rates (same as dashboard)
      mentionCount = mentionRate > 0 && totalResponses > 0
        ? Math.round(totalResponses * mentionRate / 100)
        : 0
      citationCount = citationRate > 0 && mentionCount > 0
        ? Math.round(mentionCount * citationRate / 100)
        : 0

      // Zero-visibility enforcement (same as dashboard /api/reports/[id]/data)
      if (mentionRate === 0 && mentionCount === 0) {
        finalLvi = 0
        avgSentiment = null
        avgPosition = null
      }
    } else {
      // Fallback: compute from raw response_data with default weights
      totalResponses = totalResponsesRaw
      mentionRate = totalResponsesRaw > 0 ? (mentionedRows.length / totalResponsesRaw) * 100 : 0

      const sentiments = mentionedRows.map(r => r.raw_sentiment).filter((s): s is number => s !== null)
      avgSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null

      const ranks = mentionedRows.map(r => r.brand_rank).filter((r): r is number => r !== null && r > 0)
      avgPosition = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null

      citationRate = mentionedRows.length > 0 ? (citedRows.length / mentionedRows.length) * 100 : 0

      mentionCount = mentionedRows.length
      citationCount = citedRows.length

      // LVI with default weights (fallback only)
      if (mentionRate === 0) {
        finalLvi = 0
        avgSentiment = null
        avgPosition = null
      } else {
        const normRank = avgPosition !== null && avgPosition > 0 ? Math.max(0, (1 - (avgPosition - 1) / 9)) * 100 : 0
        const normSentiment = (((avgSentiment ?? 0) + 1) / 2) * 100
        finalLvi = Math.max(0, Math.min(100, mentionRate * 0.35 + normRank * 0.30 + citationRate * 0.15 + normSentiment * 0.20))
      }
    }

    // ─── 6. Platform/model breakdown ───
    const fileMap = new Map(extractedFiles.map(f => [f.id, f]))
    const platformStats: Record<string, { responses: number; mentions: number; citations: number; sentiments: number[]; ranks: number[] }> = {}

    for (const rd of responseData) {
      const file = fileMap.get(rd.response_id)
      const model = file?.model_name || 'Unknown'
      if (!platformStats[model]) platformStats[model] = { responses: 0, mentions: 0, citations: 0, sentiments: [], ranks: [] }
      platformStats[model].responses++
      if (rd.mentioned) {
        platformStats[model].mentions++
        if (rd.raw_sentiment !== null) platformStats[model].sentiments.push(rd.raw_sentiment)
        if (rd.brand_rank !== null && rd.brand_rank > 0) platformStats[model].ranks.push(rd.brand_rank)
        if (rd.citation_count > 0) platformStats[model].citations++
      }
    }

    const platforms = Object.entries(platformStats).map(([model, stats]) => {
      const mRate = stats.responses > 0 ? (stats.mentions / stats.responses) * 100 : 0
      const mAvgSent = stats.sentiments.length > 0 ? stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length : 0
      const mAvgPos = stats.ranks.length > 0 ? stats.ranks.reduce((a, b) => a + b, 0) / stats.ranks.length : 0
      const mCitRate = stats.mentions > 0 ? (stats.citations / stats.mentions) * 100 : 0
      const pNormRank = mAvgPos > 0 ? Math.max(0, (1 - (mAvgPos - 1) / 9)) * 100 : 0
      const pNormSent = ((mAvgSent + 1) / 2) * 100
      const pLvi = mRate > 0
        ? Math.max(0, Math.min(100, mRate * 0.35 + pNormRank * 0.30 + mCitRate * 0.15 + pNormSent * 0.20))
        : 0

      return {
        model,
        responses: stats.responses,
        mentions: stats.mentions,
        mentionRate: Math.round(mRate),
        avgSentiment: Math.round(mAvgSent * 1000) / 1000,
        avgPosition: Math.round(mAvgPos * 100) / 100,
        citationRate: Math.round(mCitRate),
        lvi: Math.round(pLvi * 10) / 10,
      }
    }).sort((a, b) => b.lvi - a.lvi)

    // ─── 7. Competitor analysis from response_data ───
    const competitorMentions: Record<string, { count: number; sentiments: number[]; ranks: number[]; citations: number }> = {}

    // Collect from co_mentioned_brands
    for (const rd of responseData) {
      if (rd.co_mentioned_brands && Array.isArray(rd.co_mentioned_brands)) {
        for (const comp of rd.co_mentioned_brands) {
          if (!competitorMentions[comp]) competitorMentions[comp] = { count: 0, sentiments: [], ranks: [], citations: 0 }
          competitorMentions[comp].count++
        }
      }
    }

    // Get competitor response_data for real rank/sentiment
    if (Object.keys(competitorMentions).length > 0 && responseIds.length > 0) {
      const { data: competitorData } = await supabase
        .from('response_data')
        .select('response_id, brand_id, mentioned, brand_rank, raw_sentiment, citation_count')
        .neq('brand_id', brandId)
        .in('response_id', responseIds.slice(0, 500))
        .eq('mentioned', true)

      if (competitorData) {
        const compBrandIds = [...new Set(competitorData.map(c => c.brand_id))]
        const { data: compBrands } = await supabase
          .from('brands')
          .select('id, name')
          .in('id', compBrandIds)

        const brandNameMap = new Map((compBrands || []).map(b => [b.id, b.name]))

        for (const cd of competitorData) {
          const compName = brandNameMap.get(cd.brand_id)
          if (!compName) continue
          if (!competitorMentions[compName]) competitorMentions[compName] = { count: 0, sentiments: [], ranks: [], citations: 0 }
          if (cd.raw_sentiment !== null) competitorMentions[compName].sentiments.push(cd.raw_sentiment)
          if (cd.brand_rank !== null && cd.brand_rank > 0) competitorMentions[compName].ranks.push(cd.brand_rank)
          if (cd.citation_count > 0) competitorMentions[compName].citations++
        }
      }
    }

    const competitors = Object.entries(competitorMentions)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([name, data]) => {
        // Use raw response count for competitor mention rate calculation
        // (co_mentioned_brands comes from all response_data, not a single day)
        const compDenominator = totalResponsesRaw > 0 ? totalResponsesRaw : totalResponses
        const compMentionRate = compDenominator > 0 ? (data.count / compDenominator) * 100 : 0
        const compAvgSentiment = data.sentiments.length > 0 ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length : null
        const compAvgRank = data.ranks.length > 0 ? data.ranks.reduce((a, b) => a + b, 0) / data.ranks.length : null
        const compCitRate = data.count > 0 ? (data.citations / data.count) * 100 : 0

        const compNormRank = compAvgRank && compAvgRank > 0 ? Math.max(0, (1 - (compAvgRank - 1) / 9)) * 100 : 0
        const compNormSent = compAvgSentiment !== null ? ((compAvgSentiment + 1) / 2) * 100 : 50
        const compLvi = compMentionRate > 0
          ? Math.max(0, Math.min(100, compMentionRate * 0.35 + compNormRank * 0.30 + compCitRate * 0.15 + compNormSent * 0.20))
          : 0

        return {
          name,
          mentionCount: data.count,
          frequency: Math.round(compMentionRate),
          lvi: Math.round(compLvi * 10) / 10,
          avg_sentiment: compAvgSentiment !== null ? Math.round(compAvgSentiment * 100) / 100 : null,
          avg_position: compAvgRank !== null ? Math.round(compAvgRank * 10) / 10 : null,
          citation_rate: Math.round(compCitRate),
        }
      })

    // ─── 8. Load citations for this prompt's responses ───
    let citations: any[] = []
    if (responseIds.length > 0) {
      for (let i = 0; i < responseIds.length; i += 500) {
        const batch = responseIds.slice(i, i + 500)
        const { data: citData } = await supabase
          .from('aeo_citations')
          .select('id, response_id, domain, url, page_title, citation_rank, times_referenced, source_type')
          .in('response_id', batch)
          .order('citation_rank', { ascending: true })

        if (citData) citations = citations.concat(citData)
      }
    }

    // Group citations by URL, tracking which models cited each
    const citationsByUrl: Record<string, {
      domain: string
      url: string
      page_title: string
      source_type: string
      best_rank: number
      total_references: number
      models: string[]
    }> = {}

    for (const cit of citations) {
      const key = cit.url || cit.domain
      const file = fileMap.get(cit.response_id)
      const modelName = file?.model_name || 'Unknown'

      if (!citationsByUrl[key]) {
        citationsByUrl[key] = {
          domain: cit.domain,
          url: cit.url || '',
          page_title: cit.page_title || '',
          source_type: cit.source_type || 'earned',
          best_rank: cit.citation_rank ?? 999,
          total_references: 0,
          models: [],
        }
      }

      citationsByUrl[key].total_references += cit.times_referenced || 1
      if (cit.citation_rank != null && cit.citation_rank < citationsByUrl[key].best_rank) {
        citationsByUrl[key].best_rank = cit.citation_rank
      }
      if (!citationsByUrl[key].models.includes(modelName)) {
        citationsByUrl[key].models.push(modelName)
      }
    }

    const groupedCitations = Object.values(citationsByUrl)
      .sort((a, b) => a.best_rank - b.best_rank)

    // ─── 9. Build response list for Recent Chats ───
    const recentResponses = allResponseFiles.map(r => ({
      id: r.id,
      prompt_id: r.prompt_id,
      prompt_text: r.prompt_text,
      model_name: r.model_name,
      model_provider: r.model_provider,
      raw_response: r.response_preview || '',
      created_at: r.created_at,
      run_id: r.run_id,
      response_time_ms: r.response_time_ms,
      success: r.success,
      cost_estimate: r.cost_estimate,
      word_count: r.word_count,
    }))

    // ─── Return unified response ───
    return NextResponse.json({
      success: true,
      prompt: {
        ...prompt,
        classification: prompt.category,
        country_name: prompt.country?.name,
        country_code: prompt.country?.code,
      },
      analytics: {
        summary: {
          totalResponses,
          lviScore: Math.round(finalLvi * 100) / 100,
          avgSentiment: avgSentiment !== null ? Math.round(avgSentiment * 1000) / 1000 : null,
          avgPosition: avgPosition !== null ? Math.round(avgPosition * 100) / 100 : 0,
          mentionRate: Math.round(mentionRate * 100) / 100,
          citationRate: Math.round(citationRate * 100) / 100,
          mentionCount,
          citationCount,
          shareOfVoice: latestDailyMetric?.share_of_voice ?? 0,
        },
        timeSeries,
        // Platforms as object (keyed by model name — consumed by detail page)
        platforms: platforms.reduce((acc, p) => {
          acc[p.model] = {
            responses: p.responses,
            mentions: p.mentions,
            mentionRate: p.mentionRate,
            avgSentiment: p.avgSentiment,
            avgPosition: p.avgPosition,
            citationRate: p.citationRate,
            lvi: p.lvi,
          }
          return acc
        }, {} as Record<string, any>),
        by_platform: platforms,
        competitors,
        citations: groupedCitations,
      },
      responses: recentResponses,
      brand: {
        id: brand.id,
        name: brand.name,
      },
    })
  } catch (error: any) {
    console.error('[Prompt Detail API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
