/**
 * External Report Metrics API
 * GET /api/reports/[id]/metrics
 * 
 * Returns all metrics data for external brand visibility report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import ExternalReportAnalyticsService from '@/lib/services/external-report-analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const reportId = params.id
    
    if (!user?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()
    
    // Get report to verify access and extract brand/account info
    const { data: report, error: reportError } = await supabase
      .from('external_brand_reports')
      .select(`
        *,
        brands (
          id,
          name,
          account_id
        )
      `)
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }
    
    // Verify user has access to this account via clerk_id
    const { data: accountAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', (report.brands as any).account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()
    
    if (!accountAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    const runId = searchParams.get('runId') || undefined
    
    // Fetch metrics using service
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const data = await analyticsService.getCompleteReportData(
      (report.brands as any).account_id,
      report.brand_id,
      period,
      runId
    )
    
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        reportId,
        brandId: report.brand_id,
        brandName: (report.brands as any).name,
        period,
        fetchedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching report metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
