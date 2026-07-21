/**
 * Citations/Sources API
 * GET /api/reports/[id]/citations
 * 
 * Returns citation domain analysis for sources & publishers
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
      const { data: emailCapture, error: captureError } = await supabase
        .from('external_report_email_captures')
        .select('id, external_report_id, external_brand_reports!inner(id, brand_id, is_active, requires_email_capture, expires_at)')
        .eq('access_token', publicAccessToken)
        .maybeSingle()

      if (captureError) return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 403 })
      const externalReport = (emailCapture?.external_brand_reports as any) || null
      if (externalReport) {
        if (externalReport.id !== reportId) return NextResponse.json({ error: 'Access token does not match report' }, { status: 403 })
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
    
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    const domainType = searchParams.get('type') || undefined
    const onlyTargetPublishers = searchParams.get('targets') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const citations = await analyticsService.getCitationDomains(
      (report.brands as any).account_id,
      report.brand_id,
      period,
      {
        domainType,
        onlyTargetPublishers,
        limit
      }
    )
    
    // Format for frontend
    const formattedCitations = citations.map(c => ({
      domain: c.domain,
      type: c.domain_type,
      source_category: c.source_category,
      totalCitations: c.total_citations,
      responsesUsing: c.unique_responses_citing,
      usedPercentage: Number(c.used_percentage?.toFixed(1)) || 0,
      avgCitations: Number(c.avg_citations_per_response?.toFixed(1)) || 0,
      trustScore: c.trust_score ? Math.round(Number(c.trust_score) * 100) : null,
      isAuthoritative: c.is_authoritative,
      isTargetPublisher: c.is_target_publisher,
      partnershipScore: Math.round(c.partnership_opportunity_score || 0),
      topics: c.associated_topics || [],
      brands: c.associated_brands || []
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedCitations
    })
  } catch (error: any) {
    console.error('Error fetching citations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
