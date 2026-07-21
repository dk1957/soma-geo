/**
 * Prompt Details API
 * GET /api/reports/[id]/prompts/[promptId]
 * 
 * Returns detailed model-by-model responses for a specific prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import ExternalReportAnalyticsService from '@/lib/services/external-report-analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; promptId: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: reportId, promptId } = params
    
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
    
    const analyticsService = new ExternalReportAnalyticsService(supabase)
    const responses = await analyticsService.getPromptResponses(
      promptId,
      report.brand_id
    )
    
    return NextResponse.json({
      success: true,
      data: responses
    })
  } catch (error: any) {
    console.error('Error fetching prompt details:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
