/**
 * Prompt Performance API
 * GET /api/reports/[id]/prompts
 * 
 * Returns per-prompt analysis showing opportunities, threats, and strengths
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
      .select('brand_id, brands!inner(account_id, name)')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | 'all'
    const onlyOpportunities = searchParams.get('opportunities') === 'true'
    const onlyThreats = searchParams.get('threats') === 'true'
    const onlyStrengths = searchParams.get('strengths') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const prompts = await analyticsService.getPromptPerformance(
      (report.brands as any).account_id,
      report.brand_id,
      period,
      {
        onlyOpportunities,
        onlyThreats,
        onlyStrengths,
        limit
      }
    )
    
    // Format for frontend
    const formattedPrompts = prompts.map(p => ({
      promptKey: p.prompt_id,
      promptText: p.prompt_text,
      category: p.prompt_category,
      intent: p.prompt_intent,
      totalResponses: p.total_responses,
      totalModels: p.total_models_tested,
      
      // Brand performance
      brandMentioned: p.primary_brand_mentioned,
      brandMentionRate: Number(p.primary_brand_mention_rate?.toFixed(1)) || 0,
      brandAvgPosition: p.primary_brand_avg_position || null,
      brandSentiment: Math.round(Number(p.primary_brand_sentiment) * 100) || 0,
      brandCitations: p.primary_brand_citations || 0,
      brandLVI: Number(p.primary_brand_lvi?.toFixed(1)) || 0,
      
      // Competition
      topCompetitor: p.top_competitor_name,
      competitorMentions: p.top_competitor_mentions || 0,
      visibilityGap: Number(p.visibility_gap?.toFixed(1)) || 0,
      
      // Classification
      isOpportunity: p.is_opportunity,
      isStrength: p.is_strength,
      isThreat: p.is_threat,
      opportunityScore: Math.round(p.opportunity_score || 0),
      priority: p.strategic_priority,
      actionRequired: p.action_required,
      
      // Model breakdown
      modelPerformance: p.model_performance || {}
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedPrompts,
      metadata: {
        total: formattedPrompts.length,
        opportunities: formattedPrompts.filter(p => p.isOpportunity).length,
        threats: formattedPrompts.filter(p => p.isThreat).length,
        strengths: formattedPrompts.filter(p => p.isStrength).length
      }
    })
  } catch (error: any) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
