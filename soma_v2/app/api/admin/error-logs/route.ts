import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const accountId = searchParams.get('accountId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const severity = searchParams.get('severity') // error, warning, info

    const adminSupabase = createServiceClient()

    // Get failed response files
    let query = adminSupabase
      .from('llm_response_files')
      .select(`
        id,
        created_at,
        error_message,
        success,
        response_time_ms,
        model_name,
        run_id,
        brand_id,
        account_id
      `)
      .not('error_message', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by account if specified
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    // Filter by brand if specified
    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data: errorResponses, error: responsesError } = await query

    if (responsesError) {
      console.error('Error fetching error logs:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch error logs' }, { status: 500 })
    }

    // Get failed runs (overall failures)
    const { data: failedRuns, error: simsError } = await adminSupabase
      .from('runs')
      .select(`
        id,
        created_at,
        status,
        error_message,
        brand:brands(id, name, account:accounts(id, name))
      `)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get recent job failures
    const { data: failedJobs, error: jobsError } = await adminSupabase
      .from('jobs')
      .select(`
        id,
        created_at,
        type,
        status,
        metadata,
        error,
        brand:brands(id, name)
      `)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50)

    // Combine and format error logs
    const errorLogs = []

    // Add response-level errors
    for (const response of errorResponses || []) {
      errorLogs.push({
        id: response.id,
        type: 'response_error',
        severity: 'error',
        timestamp: response.created_at,
        message: response.error_message,
        context: {
          model: response.model_name,
          response_time: response.response_time_ms,
          run_id: response.run_id
        },
        brand: null,
        account: null
      })
    }

    // Add run-level errors
    for (const sim of failedRuns || []) {
      const brand = sim.brand as any
      const account = brand?.account as any

      errorLogs.push({
        id: sim.id,
        type: 'run_error',
        severity: 'critical',
        timestamp: sim.created_at,
        message: sim.error_message || 'Run failed',
        context: {
          status: sim.status
        },
        brand: brand ? { id: brand.id, name: brand.name } : null,
        account: account ? { id: account.id, name: account.name } : null
      })
    }

    // Add job-level errors
    for (const job of failedJobs || []) {
      const brand = job.brand as any

      errorLogs.push({
        id: job.id,
        type: 'job_error',
        severity: 'warning',
        timestamp: job.created_at,
        message: job.error || 'Job failed',
        context: {
          job_type: job.type,
          metadata: job.metadata
        },
        brand: brand ? { id: brand.id, name: brand.name } : null,
        account: null
      })
    }

    // Sort by timestamp
    errorLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Calculate summary stats
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const summary = {
      total: errorLogs.length,
      last_24h: errorLogs.filter(e => new Date(e.timestamp) > last24h).length,
      last_7d: errorLogs.filter(e => new Date(e.timestamp) > last7d).length,
      by_severity: {
        critical: errorLogs.filter(e => e.severity === 'critical').length,
        error: errorLogs.filter(e => e.severity === 'error').length,
        warning: errorLogs.filter(e => e.severity === 'warning').length
      },
      by_type: {
        response_error: errorLogs.filter(e => e.type === 'response_error').length,
        run_error: errorLogs.filter(e => e.type === 'run_error').length,
        job_error: errorLogs.filter(e => e.type === 'job_error').length
      }
    }

    return NextResponse.json({
      success: true,
      logs: errorLogs.slice(0, limit),
      summary,
      pagination: {
        limit,
        offset,
        total: errorLogs.length
      }
    })

  } catch (error) {
    console.error('Admin error logs error:', error)
    return NextResponse.json({
      error: 'Failed to fetch error logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
