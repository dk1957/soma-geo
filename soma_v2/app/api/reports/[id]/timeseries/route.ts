/**
 * Timeseries/Trends API
 * GET /api/reports/[id]/timeseries
 * 
 * Returns LVI and other metrics over time for trend charts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import ExternalReportAnalyticsService from '@/lib/services/external-report-analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params
    const searchParams = request.nextUrl.searchParams
    const publicAccessToken = searchParams.get('public_access_token') || searchParams.get('access_token') || null

    let isPublicAccess = false
    if (publicAccessToken) {
      const supabase = createServiceClient()

      const { data: emailCapture } = await supabase
        .from('external_report_email_captures')
        .select('id, external_report_id, external_brand_reports!inner(id, brand_id, is_active, requires_email_capture, expires_at)')
        .eq('access_token', publicAccessToken)
        .maybeSingle()

      if (emailCapture && emailCapture.external_brand_reports) {
        const externalReport = emailCapture.external_brand_reports as any
        if (externalReport.id !== reportId) {
          return NextResponse.json({ error: 'Access token does not match report' }, { status: 403 })
        }
        if (!externalReport.is_active) return NextResponse.json({ error: 'Report is no longer active' }, { status: 403 })
        if (externalReport.expires_at && new Date(externalReport.expires_at) < new Date()) return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
        isPublicAccess = true
      } else {
        const { data: sharedReport } = await supabase
          .from('external_brand_reports')
          .select('id, brand_id, is_active, requires_email_capture, expires_at')
          .eq('share_token', publicAccessToken)
          .maybeSingle()

        if (sharedReport) {
          if (sharedReport.id !== reportId) return NextResponse.json({ error: 'Access token does not match report' }, { status: 403 })
          if (!sharedReport.is_active) return NextResponse.json({ error: 'Report is no longer active' }, { status: 403 })
          if (sharedReport.expires_at && new Date(sharedReport.expires_at) < new Date()) return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
          if (sharedReport.requires_email_capture) return NextResponse.json({ error: 'Access requires email capture' }, { status: 403 })
          isPublicAccess = true
        }
      }
    }

    const user = await getCurrentUser()
    if (!isPublicAccess && !user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    
    const { data: report, error: reportError } = await supabase
      .from('external_brand_reports')
      .select('brand_id, brands!inner(account_id)')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    
    const period = (request.nextUrl.searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    const granularity = (request.nextUrl.searchParams.get('granularity') || 'daily') as 'daily' | 'hourly'
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const timeseries = await analyticsService.getBrandMetricsTimeseries(
      (report.brands as any).account_id,
      report.brand_id,
      period,
      granularity
    )
    
    // Format for frontend
    const formattedData = timeseries.map(t => ({
      date: new Date(t.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lvi: Number(t.lvi_score?.toFixed(1)) || 0,
      mentionRate: Number(t.mention_rate?.toFixed(1)) || 0,
      sentiment: Math.round(Number(t.avg_sentiment) * 100) || 0,
      ranking: t.avg_ranking || null,
      citationRate: Number(t.citation_rate?.toFixed(1)) || 0,
      shareOfVoice: Number(t.share_of_voice?.toFixed(1)) || 0
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedData
    })
  } catch (error: any) {
    console.error('Error fetching timeseries:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
