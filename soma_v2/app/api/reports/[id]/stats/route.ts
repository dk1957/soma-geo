/**
 * Brand Performance Stats API
 * GET /api/reports/[id]/stats
 * 
 * Returns the 5 key stats cards metrics
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

      // Try email-capture access token first
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
        // Fallback: allow share_token access when report is public and doesn't require email capture
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()
    
    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('external_brand_reports')
      .select('brand_id, brands!inner(account_id)')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }
    
    const period = (request.nextUrl.searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const stats = await analyticsService.getBrandPerformanceMetrics(
      (report.brands as any).account_id,
      report.brand_id,
      period
    )
    
    if (!stats) {
      return NextResponse.json(
        { error: 'No metrics data available' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        mentionRate: Number(stats.mention_rate?.toFixed(1)) || 0,
        sentimentScore: Math.round(Number(stats.avg_sentiment_score) * 100) || 0,
        avgRanking: Number(stats.avg_ranking_position?.toFixed(1)) || null,
        totalCitations: stats.total_citations || 0,
        lvi: Number(stats.lvi_score?.toFixed(1)) || 0,
        sentimentBreakdown: {
          positive: stats.positive_mentions || 0,
          neutral: stats.neutral_mentions || 0,
          negative: stats.negative_mentions || 0,
        },
        trends: {
          mentionRateChange: Number(stats.mention_rate_change?.toFixed(1)) || 0,
          sentimentChange: Number(stats.sentiment_change?.toFixed(1)) || 0,
          rankingChange: Number(stats.ranking_change?.toFixed(1)) || 0,
          lviChange: Number(stats.lvi_change?.toFixed(1)) || 0,
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
