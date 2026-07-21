import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const body = await request.json()
    
    const {
      source_report_id,
      title,
      description,
      requires_email_capture = true,
      preview_section_count = 2
    } = body

    if (!currentUser?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Validate that user has access to the source report
    console.log('Fetching source report:', source_report_id, 'for clerk_id:', currentUser.clerkUserId)
    
    const { data: sourceReport, error: reportError } = await supabase
      .from('brand_reports')
      .select(`
        id,
        title,
        brand_id,
        clerk_id,
        executive_summary,
        overall_score,
        visibility_score,
        mention_count,
        citation_count,
        competitor_count,
        metrics_data,
        key_findings,
        charts_data,
        recommendations,
        raw_data
      `)
      .eq('id', source_report_id)
      .single()

    if (reportError) {
      console.error('Error fetching source report:', reportError)
      return NextResponse.json(
        { error: 'Source report not found', details: reportError.message },
        { status: 404 }
      )
    }

    if (!sourceReport) {
      return NextResponse.json(
        { error: 'Source report not found' },
        { status: 404 }
      )
    }

    console.log('Source report found:', {
      id: sourceReport.id,
      brand_id: sourceReport.brand_id,
      clerk_id: sourceReport.clerk_id,
      current_clerk_id: currentUser.clerkUserId
    })

    // Check if user owns this report or has access to the brand
    if (sourceReport.clerk_id !== currentUser.clerkUserId) {
      // If report has a brand_id, check brand access
      if (sourceReport.brand_id) {
        const { data: brandAccess, error: brandError } = await supabase
          .from('brands')
          .select(`
            id,
            name,
            account_users!inner(clerk_id, is_active)
          `)
          .eq('id', sourceReport.brand_id)
          .eq('account_users.clerk_id', currentUser.clerkUserId)
          .eq('account_users.is_active', true)
          .maybeSingle()

        if (brandError) {
          console.error('Brand access check failed:', brandError)
        }

        if (!brandAccess) {
          return NextResponse.json(
            { error: 'Access denied to this brand' },
            { status: 403 }
          )
        }
      } else {
        // No brand_id, user must own the report
        return NextResponse.json(
          { error: 'Access denied to this report' },
          { status: 403 }
        )
      }
    }

    // Create external report using the database function if DB schema supports it.
    console.log('Creating external report with params:', {
      source_report_id,
      clerk_id: currentUser.clerkUserId,
      title,
      description
    })

    // Skip RPC and go straight to manual insert for reliability
    // The RPC has schema dependencies that may not exist in all environments
    console.info('Using manual insert for external report creation')

    // Perform manual insert for external report
    // Build preview and full content based on the source report
    // Ensure we have a brand name to satisfy NOT NULL constraint on external_brand_reports.brand_name
    let brandNameForInsert: string | null = null
    if (sourceReport?.brand_id) {
      try {
        const { data: brandRow } = await supabase
          .from('brands')
          .select('name')
          .eq('id', sourceReport.brand_id)
          .single()

        brandNameForInsert = brandRow?.name || null
      } catch (err) {
        console.warn('Failed to fetch brand name for manual external report insert', err)
      }
    }

    const preview_content = {
      executive_summary: sourceReport.executive_summary,
      key_metrics: {
        overall_score: sourceReport.overall_score,
        visibility_score: sourceReport.visibility_score,
        mention_count: sourceReport.mention_count,
        citation_count: sourceReport.citation_count
      },
      preview_note: 'This is a preview of the full brand visibility report. Enter your contact information below to access the complete analysis with detailed insights and recommendations.'
    }

    const full_content = {
      executive_summary: sourceReport.executive_summary,
      metrics_data: sourceReport.metrics_data,
      key_findings: sourceReport.key_findings,
      charts_data: sourceReport.charts_data,
      recommendations: sourceReport.recommendations,
      raw_data: sourceReport.raw_data
    }

    // Prepare insert payload - include brand_name to satisfy NOT NULL when present
    const insertPayload: any = {
      source_report_id: source_report_id,
      clerk_id: currentUser.clerkUserId,
      brand_id: sourceReport.brand_id,
      title: title || `${sourceReport.title} - Shared Report`,
      description: description || 'Comprehensive brand visibility analysis shared for business development purposes',
      preview_content,
      full_content,
      executive_summary: sourceReport.executive_summary,
      key_metrics: {
        overall_score: sourceReport.overall_score,
        visibility_score: sourceReport.visibility_score,
        mention_count: sourceReport.mention_count,
        citation_count: sourceReport.citation_count
      },
      requires_email_capture,
      preview_section_count
    }

    // Include brand_name if present or fallback to a safe string to satisfy NOT NULL
    insertPayload.brand_name = brandNameForInsert || (sourceReport.title ? `${sourceReport.title} - Brand` : 'External Report')

    const { data: insertData, error: insertError } = await supabase
      .from('external_brand_reports')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !insertData) {
      console.error('Manual insert failed for external report:', insertError || 'no data')
      return NextResponse.json(
        { error: 'Failed to create external report', details: (insertError && insertError.message) || 'insert failed' },
        { status: 500 }
      )
    }

    const externalReportId = insertData.id

    // Get the created external report with share token
    const { data: externalReport, error: fetchError } = await supabase
      .from('external_brand_reports')
      .select(`
        id,
        share_token,
        title,
        brand_id,
        description,
        requires_email_capture,
        preview_section_count,
        created_at
      `)
      .eq('id', externalReportId)
      .single()

    if (fetchError || !externalReport) {
      return NextResponse.json(
        { error: 'Failed to retrieve created report' },
        { status: 500 }
      )
    }

    // If we have a brand_id, try to fetch the brand name for the response
    let brandName: string | null = null
    if (externalReport?.brand_id) {
      try {
        const { data: brandRow } = await supabase
          .from('brands')
          .select('name')
          .eq('id', externalReport.brand_id)
          .single()

        brandName = brandRow?.name || null
      } catch (err) {
        console.warn('Failed to fetch brand name for external report response', err)
      }
    }

    // Generate the public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'}/reports/public/${externalReport.share_token}`

    return NextResponse.json({
      success: true,
      external_report: {
        ...externalReport,
        brand_name: brandName,
        public_url: publicUrl
      }
    })

  } catch (error) {
    console.error('Error creating external report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list external reports for a user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const sourceReportId = searchParams.get('source_report_id')

    if (!currentUser?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('external_brand_reports')
      .select(`
        id,
        share_token,
        title,
        brand_id,
        description,
        requires_email_capture,
        total_views,
        unique_visitors,
        email_captures,
        conversion_rate,
        lead_score_avg,
        high_intent_leads,
        created_at,
        expires_at,
        is_active
      `)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true) // Only show active reports
      .order('created_at', { ascending: false })

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    if (sourceReportId) {
      query = query.eq('source_report_id', sourceReportId)
    }

    const { data: externalReports, error } = await query

    if (error) {
      console.error('Error fetching external reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Add public URLs to each report
    const reportsWithUrls = (externalReports || []).map((report: any) => ({
      ...report,
      public_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'}/reports/public/${report.share_token}`
    }))

    return NextResponse.json({
      success: true,
      data: reportsWithUrls
    })

  } catch (error) {
    console.error('Error fetching external reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}