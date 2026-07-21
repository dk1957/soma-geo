import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const searchParams = request.nextUrl.searchParams
    const accessToken = searchParams.get('access_token')
    
    // Check if user is authenticated (logged in) via Clerk
    const currentUser = await getCurrentUser()
    const isAuthenticated = !!currentUser?.clerkUserId
    
    const supabase = createServiceClient()

    // Get external report by share token
    const { data: externalReport, error } = await supabase
      .from('external_brand_reports')
      .select(`
        id,
        title,
        brand_name,
        brand_id,
        description,
        executive_summary,
        key_metrics,
        preview_content,
        full_content,
        requires_email_capture,
        preview_section_count,
        created_at,
        is_active,
        expires_at,
        source_report_id
      `)
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (error || !externalReport) {
      console.error('Error fetching external report:', error)
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    console.log('External report found:', {
      id: externalReport.id,
      source_report_id: externalReport.source_report_id,
      title: externalReport.title,
      requires_email_capture: externalReport.requires_email_capture
    })

    // Skip email capture if user is already authenticated
    if (isAuthenticated) {
      console.log('✅ User is authenticated, skipping email capture')
    }
    // Check if email capture is required and validate access token
    else if (externalReport.requires_email_capture && accessToken) {
      // Verify access token
      const { data: emailCapture, error: captureError } = await supabase
        .from('external_report_email_captures')
        .select('id, email, last_accessed_at')
        .eq('external_report_id', externalReport.id)
        .eq('access_token', accessToken)
        .maybeSingle()

      if (captureError || !emailCapture) {
        return NextResponse.json(
          { 
            error: 'Invalid or expired access',
            requires_email_capture: true 
          },
          { status: 403 }
        )
      }

      // Update last accessed time
      await supabase
        .from('external_report_email_captures')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', emailCapture.id)
    } else if (externalReport.requires_email_capture && !accessToken && !isAuthenticated) {
      // Email capture required but no access token provided and not authenticated
      // Return preview data for better UX (show blurred report)
      return NextResponse.json(
        { 
          error: 'Email required to access this report',
          requires_email_capture: true,
          preview_only: true,
          // Include basic info for the overlay
          id: externalReport.id,
          title: externalReport.title,
          brand_name: externalReport.brand_name,
          brand_id: externalReport.brand_id,
          description: externalReport.description,
          executive_summary: externalReport.executive_summary,
          key_metrics: externalReport.key_metrics,
          preview_content: externalReport.preview_content || externalReport.full_content,
          preview_section_count: externalReport.preview_section_count,
          created_at: externalReport.created_at
        },
        { status: 403 }
      )
    }

    // Fetch the source report separately
    let sourceReport = null
    if (externalReport.source_report_id) {
      const { data, error: sourceError } = await supabase
        .from('brand_reports')
        .select(`
          raw_data,
          metrics_data,
          overall_score,
          visibility_score,
          mention_count,
          citation_count
        `)
        .eq('id', externalReport.source_report_id)
        .single()

      if (sourceError) {
        console.error('Error fetching source report:', sourceError)
        console.log('Attempted to fetch report ID:', externalReport.source_report_id)
      } else {
        sourceReport = data
        console.log('Source report found with data keys:', Object.keys(sourceReport || {}))
      }
    } else {
      console.warn('No source_report_id found in external report')
    }

    // Merge source report data into external report
    // If source report not found, try to use data from external report itself
    const reportData = {
      ...externalReport,
      brand_id: externalReport.brand_id,
      raw_data: sourceReport?.raw_data || externalReport.full_content?.raw_data || {},
      metrics_data: sourceReport?.metrics_data || externalReport.full_content?.metrics_data || {},
      overall_score: sourceReport?.overall_score || externalReport.key_metrics?.overall_score,
      visibility_score: sourceReport?.visibility_score || externalReport.key_metrics?.visibility_score,
      mention_count: sourceReport?.mention_count || externalReport.key_metrics?.mention_count,
      citation_count: sourceReport?.citation_count || externalReport.key_metrics?.citation_count,
      brand: {
        id: externalReport.brand_id,
        name: externalReport.brand_name
      }
    }
    
    console.log('Final report data structure:', {
      hasRawData: !!reportData.raw_data && Object.keys(reportData.raw_data).length > 0,
      hasMetricsData: !!reportData.metrics_data && Object.keys(reportData.metrics_data).length > 0,
      hasScores: !!reportData.overall_score
    })

    // Check if report has expired
    if (externalReport.expires_at && new Date(externalReport.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 403 }
      )
    }

    // Note: View count is tracked via the /api/external-reports/track-view endpoint
    // which is called from the client side to properly track unique visitors
    // Just update last_viewed_at here
    await supabase
      .from('external_brand_reports')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', externalReport.id)

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error fetching external report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}