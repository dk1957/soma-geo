import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/agents/metrics
 * Get agent execution metrics for the admin dashboard.
 * Query params:
 *   - agent_type: filter by agent type
 *   - days: lookback period (default 7)
 *   - limit: max rows (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    const agentType = searchParams.get('agent_type')
    const days = parseInt(searchParams.get('days') || '7')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Aggregate metrics per agent
    let query = supabase
      .from('agent_run_metrics')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agentType) {
      query = query.eq('agent_type', agentType)
    }

    const { data: metrics, error } = await query

    if (error) {
      console.error('Error fetching agent metrics:', error)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Compute summary stats
    const byAgent = new Map<string, {
      total: number
      success: number
      failed: number
      avg_duration_ms: number
      avg_tokens: number
      total_tokens: number
    }>()

    for (const m of (metrics || [])) {
      const existing = byAgent.get(m.agent_type) || {
        total: 0, success: 0, failed: 0,
        avg_duration_ms: 0, avg_tokens: 0, total_tokens: 0,
      }
      existing.total++
      if (m.success) existing.success++
      else existing.failed++
      existing.avg_duration_ms += m.duration_ms
      const tokens = (m.prompt_tokens || 0) + (m.completion_tokens || 0)
      existing.total_tokens += tokens
      byAgent.set(m.agent_type, existing)
    }

    // Finalize averages
    const summary = Array.from(byAgent.entries()).map(([agent_type, stats]) => ({
      agent_type,
      total_runs: stats.total,
      success_count: stats.success,
      failure_count: stats.failed,
      success_rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      avg_duration_ms: stats.total > 0 ? Math.round(stats.avg_duration_ms / stats.total) : 0,
      avg_tokens: stats.total > 0 ? Math.round(stats.total_tokens / stats.total) : 0,
      total_tokens: stats.total_tokens,
    }))

    return NextResponse.json({
      success: true,
      summary,
      recent: (metrics || []).slice(0, 20),
      period_days: days,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/agents/metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
