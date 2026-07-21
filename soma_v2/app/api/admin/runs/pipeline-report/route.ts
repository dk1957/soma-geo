import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdminEmail, getEmailFromUser } from '@/lib/auth/admin'

/**
 * GET /api/admin/runs/pipeline-report?brand_id=xxx&limit=10
 *
 * Returns recent runs for a brand with their full pipeline reports.
 * Admin-only endpoint.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = getEmailFromUser(user)
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brand_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)

  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: runs, error } = await supabase
    .from('runs')
    .select(`
      id,
      status,
      pipeline_status,
      pipeline_report,
      pipeline_started_at,
      pipeline_completed_at,
      prompt_count,
      model_count,
      total_jobs,
      completed_jobs,
      failed_jobs,
      total_cost,
      average_response_time_ms,
      created_at,
      completed_at,
      run_date
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch pipeline reports:', error)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }

  // Compute summary stats
  const total = runs?.length ?? 0
  const pipelineCompleted = runs?.filter(r => r.pipeline_status === 'completed').length ?? 0
  const pipelinePartial = runs?.filter(r => r.pipeline_status === 'partial').length ?? 0
  const pipelineFailed = runs?.filter(r => r.pipeline_status === 'failed').length ?? 0
  const pipelinePending = runs?.filter(r => r.pipeline_status === 'pending' || !r.pipeline_status).length ?? 0

  return NextResponse.json({
    success: true,
    runs: runs ?? [],
    summary: {
      total,
      pipeline_completed: pipelineCompleted,
      pipeline_partial: pipelinePartial,
      pipeline_failed: pipelineFailed,
      pipeline_pending: pipelinePending,
      health_pct: total > 0 ? Math.round((pipelineCompleted / total) * 100) : 100,
    },
  })
}
