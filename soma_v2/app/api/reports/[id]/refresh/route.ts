/**
 * Refresh Metrics API
 * POST /api/reports/[id]/refresh
 * 
 * Triggers re-calculation of all metrics for a report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import ExternalReportAnalyticsService from '@/lib/services/external-report-analytics'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const reportId = params.id
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    
    const { data: report, error: reportError } = await supabase
      .from('external_brand_reports')
      .select('brand_id, run_id, brands!inner(account_id)')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    
    // Verify user has access via clerk_id
    const { data: accountAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', (report.brands as any).account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()
    
    if (!accountAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const result = await analyticsService.refreshMetrics(
      (report.brands as any).account_id,
      report.brand_id,
      report.run_id
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to refresh metrics', details: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Metrics refreshed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error refreshing metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
