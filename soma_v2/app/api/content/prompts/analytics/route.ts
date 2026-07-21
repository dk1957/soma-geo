import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Prompt Analytics API
 * ====================
 * Provides comprehensive analytics for individual prompts using brand_appearances data
 * Includes LVI, sentiment, position, platforms, and competitive metrics
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const promptId = searchParams.get('prompt_id')

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, name')
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

    // ─── Build analytics from response_data + daily_prompt_metrics ───

    // If a specific prompt_id is requested, filter to it
    let responseDataQuery = supabase
      .from('response_data')
      .select('response_id, brand_id, mentioned, brand_rank, brand_mention_count, raw_sentiment, citation_count, total_response_citations, is_primary_recommendation, co_mentioned_brands, competitive_density, created_at')
      .eq('brand_id', brandId)

    if (promptId) {
      // Get response_ids for this prompt
      const { data: responseFiles } = await supabase
        .from('llm_response_files')
        .select('id, model_name, prompt_text, created_at')
        .eq('brand_id', brandId)
        .eq('prompt_id', promptId)
        .eq('extraction_status', 'complete')

      if (!responseFiles || responseFiles.length === 0) {
        return NextResponse.json({
          success: true,
          analytics: {
            summary: { total_appearances: 0, avg_lvi: 0, avg_sentiment: 0, avg_position: 0, mention_rate: 0, citation_rate: 0 },
            by_prompt: [],
            by_platform: [],
            trends: []
          }
        })
      }

      const responseIds = responseFiles.map(f => f.id)
      responseDataQuery = responseDataQuery.in('response_id', responseIds)
    }

    const { data: responseData } = await responseDataQuery

    if (!responseData || responseData.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          summary: { total_appearances: 0, avg_lvi: 0, avg_sentiment: 0, avg_position: 0, mention_rate: 0, citation_rate: 0 },
          by_prompt: [],
          by_platform: [],
          trends: []
        }
      })
    }

    // Get response file info for model/platform mapping
    const respIds = [...new Set(responseData.map(r => r.response_id))]
    const { data: responseFiles } = await supabase
      .from('llm_response_files')
      .select('id, model_name, prompt_id, created_at')
      .in('id', respIds.slice(0, 500))

    const fileMap = new Map((responseFiles || []).map(f => [f.id, f]))

    // Compute summary metrics
    const totalResponses = responseData.length
    const mentionedRows = responseData.filter(r => r.mentioned)
    const mentionRate = totalResponses > 0 ? (mentionedRows.length / totalResponses) * 100 : 0

    const sentiments = mentionedRows.map(r => r.raw_sentiment).filter((s): s is number => s !== null)
    const avgSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null

    const ranks = mentionedRows.map(r => r.brand_rank).filter((r): r is number => r !== null && r > 0)
    const avgPosition = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0

    const citedRows = mentionedRows.filter(r => r.citation_count > 0)
    const citationRate = mentionedRows.length > 0 ? (citedRows.length / mentionedRows.length) * 100 : 0

    // LVI = (vis*0.35) + (normRank*0.30) + (cit*0.15) + (normSent*0.20)
    // normRank default 0 when no rank data (matches aggregator — no free points for invisible brands)
    const normRank = avgPosition > 0 ? Math.max(0, (1 - (avgPosition - 1) / 9)) * 100 : 0
    const normSentiment = (((avgSentiment ?? 0) + 1) / 2) * 100
    const calculatedLvi = mentionRate > 0
      ? Math.max(0, Math.min(100, mentionRate * 0.35 + normRank * 0.30 + citationRate * 0.15 + normSentiment * 0.20))
      : 0 // If brand never mentioned, LVI = 0 (matches aggregator)

    // Platform breakdown
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

    const byPlatform = Object.entries(platformStats).map(([model, stats]) => ({
      model,
      responses: stats.responses,
      mentions: stats.mentions,
      mentionRate: stats.responses > 0 ? Math.round((stats.mentions / stats.responses) * 100) : 0,
      avgSentiment: stats.sentiments.length > 0 ? stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length : 0,
      avgPosition: stats.ranks.length > 0 ? stats.ranks.reduce((a, b) => a + b, 0) / stats.ranks.length : 0,
      citationRate: stats.mentions > 0 ? Math.round((stats.citations / stats.mentions) * 100) : 0,
    }))

    // Per-platform LVI calculation for the platforms map
    const platformsWithLvi = byPlatform.map(p => {
      const pNormRank = p.avgPosition > 0 ? Math.max(0, (1 - (p.avgPosition - 1) / 9)) * 100 : 0
      const pNormSent = ((p.avgSentiment + 1) / 2) * 100
      const pLvi = p.mentionRate > 0
        ? Math.max(0, Math.min(100, p.mentionRate * 0.35 + pNormRank * 0.30 + p.citationRate * 0.15 + pNormSent * 0.20))
        : 0
      return { ...p, lvi: Math.round(pLvi * 10) / 10 }
    })

    // Time series from daily_prompt_metrics (if prompt_id specified)
    let timeSeries: any[] = []
    // Use pre-computed LVI from stored metrics when available
    let storedLvi: number | null = null
    if (promptId) {
      const { data: dpm } = await supabase
        .from('daily_prompt_metrics')
        .select('run_date, lvi_score, visibility_rate, avg_sentiment, avg_brand_rank, citation_rate, total_responses, share_of_voice')
        .eq('prompt_id', promptId)
        .eq('brand_id', brandId)
        .order('run_date', { ascending: true })

      timeSeries = (dpm || []).map(d => ({
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

      // Use the latest stored LVI from the pre-computed aggregator pipeline
      if (dpm && dpm.length > 0) {
        const latestMetric = dpm[dpm.length - 1]
        storedLvi = latestMetric.lvi_score
      }
    }

    // Competitor analytics — query response_data for all brands in the same responses
    // This gives us per-competitor LVI, sentiment, and position from real data
    const competitorMentions: Record<string, { count: number; sentiments: number[]; ranks: number[]; citations: number; responses: number }> = {}
    
    // Collect co-mentioned brands from primary brand's response_data
    for (const rd of responseData) {
      if (rd.co_mentioned_brands && Array.isArray(rd.co_mentioned_brands)) {
        for (const comp of rd.co_mentioned_brands) {
          if (!competitorMentions[comp]) competitorMentions[comp] = { count: 0, sentiments: [], ranks: [], citations: 0, responses: 0 }
          competitorMentions[comp].count++
        }
      }
    }

    // Query response_data for competitor brands in the same responses to get their rank/sentiment
    if (Object.keys(competitorMentions).length > 0 && respIds.length > 0) {
      const { data: competitorData } = await supabase
        .from('response_data')
        .select('response_id, brand_id, mentioned, brand_rank, raw_sentiment, citation_count')
        .neq('brand_id', brandId)
        .in('response_id', respIds.slice(0, 500))
        .eq('mentioned', true)

      if (competitorData) {
        // Get brand names for competitor brand_ids
        const compBrandIds = [...new Set(competitorData.map(c => c.brand_id))]
        const { data: compBrands } = await supabase
          .from('brands')
          .select('id, name')
          .in('id', compBrandIds)

        const brandNameMap = new Map((compBrands || []).map(b => [b.id, b.name]))

        for (const cd of competitorData) {
          const compName = brandNameMap.get(cd.brand_id)
          if (!compName) continue
          if (!competitorMentions[compName]) competitorMentions[compName] = { count: 0, sentiments: [], ranks: [], citations: 0, responses: 0 }
          competitorMentions[compName].responses++
          if (cd.raw_sentiment !== null) competitorMentions[compName].sentiments.push(cd.raw_sentiment)
          if (cd.brand_rank !== null && cd.brand_rank > 0) competitorMentions[compName].ranks.push(cd.brand_rank)
          if (cd.citation_count > 0) competitorMentions[compName].citations++
        }
      }
    }

    const topCompetitors = Object.entries(competitorMentions)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([name, data]) => {
        // Prefer actual response_data count over co_mentioned_brands count
        const effectiveCount = data.responses > 0 ? data.responses : data.count
        const compMentionRate = totalResponses > 0 ? (effectiveCount / totalResponses) * 100 : 0
        const compAvgSentiment = data.sentiments.length > 0 ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length : null
        const compAvgRank = data.ranks.length > 0 ? data.ranks.reduce((a, b) => a + b, 0) / data.ranks.length : null
        const compCitRate = effectiveCount > 0 ? (data.citations / effectiveCount) * 100 : 0
        
        // Compute per-competitor LVI using same formula as primary brand
        const compNormRank = compAvgRank && compAvgRank > 0 ? Math.max(0, (1 - (compAvgRank - 1) / 9)) * 100 : 0
        const compNormSent = compAvgSentiment !== null ? ((compAvgSentiment + 1) / 2) * 100 : 0
        const compLvi = compMentionRate > 0
          ? Math.max(0, Math.min(100, compMentionRate * 0.35 + compNormRank * 0.30 + compCitRate * 0.15 + compNormSent * 0.20))
          : 0

        return {
          name,
          mentionCount: effectiveCount,
          frequency: Math.round(compMentionRate),
          lvi: Math.round(compLvi * 10) / 10,
          avg_sentiment: compAvgSentiment !== null ? Math.round(compAvgSentiment * 100) / 100 : null,
          avg_position: compAvgRank !== null ? Math.round(compAvgRank * 10) / 10 : null,
          citation_rate: Math.round(compCitRate),
        }
      })

    // Prefer pre-computed LVI from aggregator pipeline; fallback to calculated
    const finalLvi = storedLvi ?? calculatedLvi
    const mentionCount = mentionedRows.length
    const citationCount = citedRows.length

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          // Snake_case (original API shape)
          total_appearances: totalResponses,
          avg_lvi: Math.round(finalLvi * 100) / 100,
          avg_sentiment: avgSentiment !== null ? Math.round(avgSentiment * 1000) / 1000 : null,
          avg_position: Math.round(avgPosition * 100) / 100,
          mention_rate: Math.round(mentionRate * 100) / 100,
          citation_rate: Math.round(citationRate * 100) / 100,
          // CamelCase aliases (consumed by prompt detail page)
          totalResponses,
          lviScore: Math.round(finalLvi * 100) / 100,
          avgSentiment: avgSentiment !== null ? Math.round(avgSentiment * 1000) / 1000 : null,
          avgPosition: Math.round(avgPosition * 100) / 100,
          mentionRate: Math.round(mentionRate * 100) / 100,
          citationRate: Math.round(citationRate * 100) / 100,
          mentionCount,
          citationCount,
        },
        by_prompt: [],
        by_platform: platformsWithLvi,
        platforms: platformsWithLvi.reduce((acc, p) => {
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
        trends: timeSeries,
        timeSeries,
        competitors: topCompetitors,
      },
    })
  } catch (error: any) {
    console.error('Prompt analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
