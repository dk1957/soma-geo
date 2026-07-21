/**
 * Insights & Recommendations API
 * GET /api/reports/[id]/insights
 * 
 * Returns AI-generated insights and actionable recommendations
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
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const { insights, recommendations } = await analyticsService.getInsightsAndRecommendations(
      (report.brands as any).account_id,
      report.brand_id,
      period
    )
    
    return NextResponse.json({
      success: true,
      data: {
        insights,
        recommendations
      }
    })
  } catch (error: any) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
