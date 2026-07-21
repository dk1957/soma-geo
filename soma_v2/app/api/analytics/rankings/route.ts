import { NextRequest, NextResponse } from 'next/server'
import { resolveAnalyticsContext } from '@/lib/api/analytics-auth'
import type { PlatformRanking } from '@/lib/types/analytics'
import { computeTrend, computeChange, getModelPlatform } from '@/lib/types/analytics'

/**
 * Platform Rankings API
 * =====================
 * Shows how the brand performs across each AI platform (ChatGPT, Gemini, Claude, etc.)
 * Uses daily_model_metrics for real per-platform data — no mock/random values.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id') || searchParams.get('brandId')
    const period = searchParams.get('period') || '30d'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const auth = await resolveAnalyticsContext(brandId)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { context, supabase } = auth

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Get per-model metrics for the period
    const { data: modelMetrics, error } = await supabase
      .from('daily_model_metrics')
      .select('*')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDateStr)
      .order('run_date', { ascending: false })

    if (error) throw error

    // If no model metrics yet, return empty with guidance
    if (!modelMetrics || modelMetrics.length === 0) {
      const { data: brandMetrics } = await supabase
        .from('daily_brand_metrics')
        .select('*')
        .eq('brand_id', context.brandId)
        .gte('run_date', startDateStr)
        .order('run_date', { ascending: false })
        .limit(1)

      return NextResponse.json({
        success: true,
        data: {
          platform_rankings: [],
          prompt_rankings: [],
          overall_metrics: {
            total_responses: brandMetrics?.[0]?.total_responses ?? 0,
            avg_lvi: brandMetrics?.[0]?.lvi_score ?? 0,
            platforms_tracked: brandMetrics?.[0]?.total_models_run ?? 0,
          },
          insights: [{ type: 'info', title: 'Per-Model Data Pending', description: 'Run a new analysis to generate per-platform rankings.' }]
        }
      })
    }

    // Group by platform — aggregate across dates
    const platformGroups = new Map<string, { rows: typeof modelMetrics; displayName: string }>()
    for (const row of modelMetrics) {
      const platform = getModelPlatform(row.model_name)
      if (!platformGroups.has(platform)) {
        platformGroups.set(platform, { rows: [], displayName: platform })
      }
      platformGroups.get(platform)!.rows.push(row)
    }

    const platformRankings: PlatformRanking[] = []

    for (const [platform, { rows, displayName }] of platformGroups) {
      rows.sort((a, b) => b.run_date.localeCompare(a.run_date))
      const latest = rows[0]
      const previous = rows.length > 1 ? rows[1] : null

      const totalResp = rows.reduce((s, r) => s + r.total_responses, 0)
      const avgLVI = totalResp > 0
        ? rows.reduce((s, r) => s + r.lvi_score * r.total_responses, 0) / totalResp : 0
      const avgVis = totalResp > 0
        ? rows.reduce((s, r) => s + r.visibility_rate * r.total_responses, 0) / totalResp : 0
      const avgCit = totalResp > 0
        ? rows.reduce((s, r) => s + r.citation_rate * r.total_responses, 0) / totalResp : 0
      const avgSent = totalResp > 0
        ? rows.reduce((s, r) => s + r.avg_sentiment * r.total_responses, 0) / totalResp : 0
      const avgSoV = totalResp > 0
        ? rows.reduce((s, r) => s + r.share_of_voice * r.total_responses, 0) / totalResp : 0

      platformRankings.push({
        platform,
        display_name: displayName,
        lvi_score: Math.round(avgLVI * 100) / 100,
        visibility_rate: Math.round(avgVis * 100) / 100,
        citation_rate: Math.round(avgCit * 100) / 100,
        avg_sentiment: Math.round(avgSent * 1000) / 1000,
        share_of_voice: Math.round(avgSoV * 100) / 100,
        total_responses: totalResp,
        trend: computeTrend(latest?.lvi_score, previous?.lvi_score),
        change: computeChange(latest?.lvi_score, previous?.lvi_score),
      })
    }

    platformRankings.sort((a, b) => b.lvi_score - a.lvi_score)

    // Get prompt-level rankings
    const { data: promptMetrics } = await supabase
      .from('daily_prompt_metrics')
      .select('prompt_id, visibility_rate, lvi_score, best_performing_model, avg_sentiment, citation_rate, share_of_voice')
      .eq('brand_id', context.brandId)
      .gte('run_date', startDateStr)
      .order('lvi_score', { ascending: false })
      .limit(limit)

    const promptIds = [...new Set((promptMetrics || []).map(p => p.prompt_id))]
    let promptTexts: Record<string, string> = {}
    if (promptIds.length > 0) {
      const { data: prompts } = await supabase
        .from('user_prompts')
        .select('id, prompt_text')
        .in('id', promptIds)
      promptTexts = Object.fromEntries((prompts || []).map(p => [p.id, p.prompt_text]))
    }

    const promptRankings = (promptMetrics || []).map(p => ({
      prompt_id: p.prompt_id,
      prompt_text: promptTexts[p.prompt_id] || 'Unknown prompt',
      lvi_score: p.lvi_score ?? 0,
      visibility_rate: p.visibility_rate ?? 0,
      citation_rate: p.citation_rate ?? 0,
      avg_sentiment: p.avg_sentiment ?? 0,
      share_of_voice: p.share_of_voice ?? 0,
      best_model: p.best_performing_model ? getModelPlatform(p.best_performing_model) : null,
    }))

    // Generate insights from real data
    const insights: Array<{ type: string; title: string; description: string }> = []
    if (platformRankings.length >= 2) {
      const best = platformRankings[0]
      const worst = platformRankings[platformRankings.length - 1]
      if (best.lvi_score - worst.lvi_score > 15) {
        insights.push({
          type: 'opportunity',
          title: `${best.display_name} Leads`,
          description: `${best.display_name} (LVI ${best.lvi_score.toFixed(1)}) outperforms ${worst.display_name} (LVI ${worst.lvi_score.toFixed(1)}).`,
        })
      }
    }
    const improving = platformRankings.filter(p => p.trend === 'up')
    if (improving.length > 0) {
      insights.push({ type: 'success', title: 'Improving Platforms', description: `${improving.map(p => p.display_name).join(', ')} trending up.` })
    }
    const declining = platformRankings.filter(p => p.trend === 'down')
    if (declining.length > 0) {
      insights.push({ type: 'warning', title: 'Declining Platforms', description: `${declining.map(p => p.display_name).join(', ')} trending down.` })
    }

    return NextResponse.json({
      success: true,
      data: {
        platform_rankings: platformRankings,
        prompt_rankings: promptRankings.slice(0, 20),
        overall_metrics: {
          total_responses: platformRankings.reduce((s, p) => s + p.total_responses, 0),
          avg_lvi: platformRankings.length > 0
            ? Math.round(platformRankings.reduce((s, p) => s + p.lvi_score, 0) / platformRankings.length * 100) / 100
            : 0,
          platforms_tracked: platformRankings.length,
          top_platform: platformRankings[0]?.display_name || null,
        },
        insights: insights.slice(0, 5),
      },
      metadata: { period, brand_name: context.brandName }
    })
  } catch (error) {
    console.error('Rankings API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
