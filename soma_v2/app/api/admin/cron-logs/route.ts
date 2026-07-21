import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // filter by status
    const jobName = searchParams.get('job_name') || 'daily-run'
    const days = parseInt(searchParams.get('days') || '30') // how far back to look

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Build query
    let query = supabase
      .from('cron_logs')
      .select('*', { count: 'exact' })
      .eq('job_name', jobName)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('[Admin Cron Logs] Error fetching logs:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch cron logs',
        details: error.message 
      }, { status: 500 })
    }

    // Calculate summary statistics
    const { data: summaryData } = await supabase
      .from('cron_logs')
      .select('status, brands_successful, brands_failed, duration_ms')
      .eq('job_name', jobName)
      .gte('started_at', startDate.toISOString())

    const summary = {
      total: summaryData?.length || 0,
      by_status: {
        completed: summaryData?.filter(l => l.status === 'completed').length || 0,
        failed: summaryData?.filter(l => l.status === 'failed').length || 0,
        skipped: summaryData?.filter(l => l.status === 'skipped').length || 0,
        started: summaryData?.filter(l => l.status === 'started').length || 0 // stuck/orphaned
      },
      total_brands_processed: summaryData?.reduce((acc, l) => acc + (l.brands_successful || 0), 0) || 0,
      total_brands_failed: summaryData?.reduce((acc, l) => acc + (l.brands_failed || 0), 0) || 0,
      avg_duration_ms: summaryData?.length 
        ? Math.round(summaryData.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / summaryData.length)
        : 0,
      last_24h: {
        runs: 0,
        completed: 0,
        failed: 0,
        skipped: 0
      }
    }

    // Calculate last 24h stats
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const last24hLogs = summaryData?.filter(l => new Date(l.status) >= oneDayAgo) || []
    // This filter was wrong, let's query properly
    const { data: last24hData } = await supabase
      .from('cron_logs')
      .select('status')
      .eq('job_name', jobName)
      .gte('started_at', oneDayAgo.toISOString())

    if (last24hData) {
      summary.last_24h = {
        runs: last24hData.length,
        completed: last24hData.filter(l => l.status === 'completed').length,
        failed: last24hData.filter(l => l.status === 'failed').length,
        skipped: last24hData.filter(l => l.status === 'skipped').length
      }
    }

    // Get next scheduled run info (based on vercel.json cron schedule)
    const now = new Date()
    const nextRun = new Date(now)
    nextRun.setUTCHours(6, 0, 0, 0) // 6 AM UTC based on vercel.json
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      logs,
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      schedule: {
        cron_expression: '0 6 * * *',
        description: 'Daily at 6:00 AM UTC',
        next_run: nextRun.toISOString()
      }
    })

  } catch (error) {
    console.error('[Admin Cron Logs] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}

// Manual trigger endpoint
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get email for admin check
    let userEmail = user.clerkUser?.email || user.profile?.email
    
    if (!userEmail) {
      try {
        const clerkUserDirect = await currentUser()
        userEmail = clerkUserDirect?.emailAddresses?.[0]?.emailAddress || undefined
      } catch (error) {
        console.error('[Admin Cron Logs] Error fetching Clerk user:', error)
      }
    }

    const hasAdminAccess = userEmail && (
      ADMIN_EMAILS.includes(userEmail.toLowerCase()) ||
      isWithSomaAiEmail(userEmail)
    )

    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Trigger the cron job manually
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/cron/run-runs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Cron job triggered manually',
      triggered_by: userEmail,
      result: data
    })

  } catch (error) {
    console.error('[Admin Cron Logs] Error triggering cron:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger cron job',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
