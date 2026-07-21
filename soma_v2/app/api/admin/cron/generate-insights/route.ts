import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { StrategicInsightAgent } from '@/lib/services/strategic-insight-agent'
import { LLMRunOrchestrator } from '@/lib/services/llm-run-orchestrator'

export const maxDuration = 300 // 5 minutes

// Process up to N brands per cron tick to stay within the function timeout
const MAX_BRANDS_PER_RUN = 3

/**
 * Cron: Generate Strategic Insights
 * ==================================
 * Runs after the daily batch (scheduled ~1 hour after run-batch).
 * Finds active brands that have fresh data but no recent insight, then
 * calls the LLM-powered StrategicInsightAgent to generate analyses.
 *
 * Auth: Vercel Cron (CRON_SECRET bearer token)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const startTime = Date.now()

  try {
    // 1. Check if insight generation is enabled (admin feature flag)
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('value')
      .eq('key', 'insight_agent_settings')
      .maybeSingle()

    const settings = flag?.value || {}
    if (settings.auto_generate === false) {
      return NextResponse.json({ status: 'skipped', reason: 'auto_generate disabled' })
    }

    // 2. Find active brands with subscribers
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!brands || brands.length === 0) {
      return NextResponse.json({ status: 'skipped', reason: 'no active brands' })
    }

    // 3. Filter: only brands that DON'T have a fresh insight (< 24h old)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentInsights } = await supabase
      .from('strategic_insights')
      .select('brand_id')
      .gte('created_at', oneDayAgo)

    const recentBrandIds = new Set((recentInsights || []).map(r => r.brand_id))
    const brandsNeedingInsights = brands.filter(b => !recentBrandIds.has(b.id))

    if (brandsNeedingInsights.length === 0) {
      return NextResponse.json({
        status: 'completed',
        reason: 'all brands have recent insights',
        brands_checked: brands.length,
      })
    }

    // 4. Generate insights for up to MAX_BRANDS_PER_RUN brands
    const agent = new StrategicInsightAgent()
    const toProcess = brandsNeedingInsights.slice(0, MAX_BRANDS_PER_RUN)
    const results: Array<{ brandId: string; brandName: string; status: string; error?: string }> = []

    for (const brand of toProcess) {
      try {
        await agent.generateAnalysis(brand.id, {
          forceRefresh: true,
          triggerSource: 'scheduled',
        })
        results.push({ brandId: brand.id, brandName: brand.name, status: 'success' })
      } catch (err: any) {
        console.error(`[CronInsights] Failed for ${brand.name}:`, err?.message)
        results.push({ brandId: brand.id, brandName: brand.name, status: 'error', error: err?.message })
      }
    }

    const durationMs = Date.now() - startTime
    const successCount = results.filter(r => r.status === 'success').length

    // 5. Broadcast pipeline_complete to all brands that got new insights
    const succeededBrands = results.filter(r => r.status === 'success')
    after(async () => {
      const svc = createServiceClient()
      for (const b of succeededBrands) {
        await LLMRunOrchestrator.broadcastPipelineComplete(svc, b.brandId, { source: 'cron-insights' })
      }
    })

    // 6. Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'generate-insights',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      brands_checked: brands.length,
      brands_needed_run: brandsNeedingInsights.length,
      brands_processed: toProcess.length,
      brands_successful: successCount,
      brands_failed: toProcess.length - successCount,
      brands_remaining: brandsNeedingInsights.length - toProcess.length,
      results,
    }).then(() => {}, () => {}) // non-critical

    return NextResponse.json({
      status: 'completed',
      duration_ms: durationMs,
      brands_checked: brands.length,
      brands_needing_insights: brandsNeedingInsights.length,
      brands_processed: toProcess.length,
      successful: successCount,
      failed: toProcess.length - successCount,
      remaining: brandsNeedingInsights.length - toProcess.length,
      results,
    })
  } catch (error: any) {
    console.error('[CronInsights] Fatal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
