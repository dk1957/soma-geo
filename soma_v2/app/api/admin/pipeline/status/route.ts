import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/pipeline/status
 *
 * Returns a cross-brand overview of extraction and aggregation health.
 * Includes per-brand breakdown of pending/failed/complete response counts
 * and whether daily metrics exist.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. Response file status counts (global)
  const { data: statusCounts } = await supabase.rpc('get_extraction_status_counts').single()

  // Fallback: manual queries if RPC doesn't exist
  let globalStats: {
    total: number
    pending: number
    failed: number
    complete: number
    processing: number
  }

  if (statusCounts) {
    globalStats = statusCounts as any
  } else {
    const [
      { count: total },
      { count: pending },
      { count: failed },
      { count: complete },
      { count: processing },
    ] = await Promise.all([
      supabase.from('llm_response_files').select('*', { count: 'exact', head: true }).eq('success', true),
      supabase.from('llm_response_files').select('*', { count: 'exact', head: true }).eq('success', true).eq('extraction_status', 'pending'),
      supabase.from('llm_response_files').select('*', { count: 'exact', head: true }).eq('success', true).eq('extraction_status', 'failed'),
      supabase.from('llm_response_files').select('*', { count: 'exact', head: true }).eq('success', true).eq('extraction_status', 'complete'),
      supabase.from('llm_response_files').select('*', { count: 'exact', head: true }).eq('success', true).eq('extraction_status', 'processing'),
    ])
    globalStats = {
      total: total ?? 0,
      pending: pending ?? 0,
      failed: failed ?? 0,
      complete: complete ?? 0,
      processing: processing ?? 0,
    }
  }

  // 2. Per-brand breakdown of failed/pending extractions
  const { data: failedByBrand } = await supabase
    .from('llm_response_files')
    .select('brand_id, extraction_status, extraction_error')
    .eq('success', true)
    .in('extraction_status', ['failed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(500)

  // Group by brand
  const brandMap = new Map<string, { pending: number; failed: number; errors: string[] }>()
  for (const row of failedByBrand ?? []) {
    if (!brandMap.has(row.brand_id)) {
      brandMap.set(row.brand_id, { pending: 0, failed: 0, errors: [] })
    }
    const entry = brandMap.get(row.brand_id)!
    if (row.extraction_status === 'pending') entry.pending++
    if (row.extraction_status === 'failed') {
      entry.failed++
      if (row.extraction_error && !entry.errors.includes(row.extraction_error)) {
        entry.errors.push(row.extraction_error)
      }
    }
  }

  // Fetch brand names for affected brands
  const affectedBrandIds = Array.from(brandMap.keys())
  let brandNames: Record<string, string> = {}
  if (affectedBrandIds.length > 0) {
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .in('id', affectedBrandIds)

    for (const b of brands ?? []) {
      brandNames[b.id] = b.name
    }
  }

  const affectedBrands = affectedBrandIds.map(id => ({
    brand_id: id,
    brand_name: brandNames[id] || 'Unknown',
    ...brandMap.get(id)!,
  })).sort((a, b) => (b.failed + b.pending) - (a.failed + a.pending))

  // 3. Today's aggregation status — check daily_brand_metrics
  const { count: todayMetricsCount } = await supabase
    .from('daily_brand_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('run_date', today)

  // 4. Recent runs with pipeline status
  const { data: recentRuns } = await supabase
    .from('runs')
    .select(`
      id,
      brand_id,
      status,
      pipeline_status,
      prompt_count,
      model_count,
      total_jobs,
      completed_jobs,
      failed_jobs,
      total_cost,
      created_at,
      completed_at
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get brand names for recent runs
  const runBrandIds = [...new Set((recentRuns ?? []).map(r => r.brand_id).filter(Boolean))]
  if (runBrandIds.length > 0) {
    const { data: runBrands } = await supabase
      .from('brands')
      .select('id, name')
      .in('id', runBrandIds)

    for (const b of runBrands ?? []) {
      brandNames[b.id] = b.name
    }
  }

  const runs = (recentRuns ?? []).map(r => ({
    ...r,
    brand_name: brandNames[r.brand_id] || 'Unknown',
  }))

  return NextResponse.json({
    success: true,
    extraction: globalStats,
    aggregation: {
      today_metrics_count: todayMetricsCount ?? 0,
      run_date: today,
    },
    affected_brands: affectedBrands,
    recent_runs: runs,
  })
}
