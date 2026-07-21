import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/reporting
 * List all brand reports for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Note: Using service client which bypasses RLS, so we handle brand filtering in the query
    // The client should send brand_id to ensure proper filtering
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const reportType = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const brandId = searchParams.get('brand_id')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'
    const includeStats = searchParams.get('include_stats')
    
    const offset = (page - 1) * limit

    // Require brand_id for proper filtering since we're using service client
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Build query for brand_reports table
    let query = supabase
      .from('brand_reports')
      .select(`
        id,
        title,
        description,
        report_type,
        status,
        overall_score,
        visibility_score,
        discoverability_score,
        mention_count,
        citation_count,
        competitor_count,
        views_count,
        downloads_count,
        is_public,
        access_level,
        date_range_start,
        date_range_end,
        platforms_filter,
        created_at,
        updated_at,
        generated_at
      `)
      .eq('brand_id', brandId)
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply additional filters
    if (reportType) {
      query = query.eq('report_type', reportType)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Error fetching brand reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('brand_reports')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)

    if (reportType) countQuery = countQuery.eq('report_type', reportType)
    if (status) countQuery = countQuery.eq('status', status)
    if (search) countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting brand reports:', countError)
    }

    let summary = {}
    
    if (includeStats === 'true') {
      // Calculate summary statistics
      const totalReports = count || 0
      const avgOverallScore = reports && reports.length > 0 
        ? reports.reduce((sum: number, r: any) => sum + (r.overall_score || 0), 0) / reports.length
        : 0
      
      const currentMonth = new Date().getMonth()
      const reportsThisMonth = reports?.filter(r => new Date(r.created_at).getMonth() === currentMonth).length || 0
      const publicReports = reports?.filter(r => r.is_public).length || 0

      // Count by report type
      const reportTypeBreakdown = reports?.reduce((acc: any, r: any) => {
        acc[r.report_type] = (acc[r.report_type] || 0) + 1
        return acc
      }, {}) || {}

      summary = {
        total_reports: totalReports,
        avg_overall_score: Math.round(avgOverallScore * 10) / 10,
        reports_this_month: reportsThisMonth,
        public_reports: publicReports,
        report_type_breakdown: reportTypeBreakdown
      }
    }

    return NextResponse.json({
      success: true,
      data: reports || [],
      summary,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in brand reports GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reporting
 * Create a new brand report
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Get current user from Clerk
    const currentUser = await getCurrentUser()
    
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      brand_id,
      title,
      description,
      report_type,
      audit_id,
      filters = {},
      auto_generate = true
    } = body

    // Validate required fields
    if (!brand_id || !title || !report_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: brand_id, title, and report_type' 
      }, { status: 400 })
    }

    // Validate report type
    const validReportTypes = [
      'brand_visibility', 'brand_discoverability', 'brand_audit', 
      'brand_mentions', 'brand_competitors', 'sources_citations',
      'visibility_report_external'
    ]
    
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json({ 
        error: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Check if user has access to the brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    let report

    if (auto_generate) {
      // Use the brand reporting service to generate the report
      const { BrandReportingService } = await import('@/lib/services/brand-reporting')
      const reportingService = new BrandReportingService()

      try {
        switch (report_type) {
          case 'brand_visibility':
            report = await reportingService.generateBrandVisibilityReport(brand_id, currentUser.clerkUserId, filters, report_type)
            break
          case 'brand_discoverability':
            report = await reportingService.generateBrandVisibilityReport(brand_id, currentUser.clerkUserId, filters, report_type)
            break
          case 'visibility_report_external':
            report = await reportingService.generateBrandVisibilityReport(brand_id, currentUser.clerkUserId, filters, report_type)
            break
          case 'brand_audit':
          case 'brand_competitors':
          case 'sources_citations':
            return NextResponse.json({ error: `Unsupported report type: ${report_type}` }, { status: 400 })
          case 'brand_mentions':
            report = await reportingService.generateBrandMentionsReport(brand_id, currentUser.clerkUserId, filters)
            break
          default:
            throw new Error('Invalid report type')
        }
      } catch (serviceError) {
        console.error('Error generating report with service:', serviceError)
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
      }
    } else {
      // Create a basic report manually
      const reportData = {
        clerk_id: currentUser.clerkUserId,
        brand_id,
        audit_id,
        title,
        description,
        report_type,
        status: 'draft',
        date_range_start: filters.dateRangeStart,
        date_range_end: filters.dateRangeEnd,
        platforms_filter: filters.platforms || [],
        regions_filter: filters.regions || [],
        languages_filter: filters.languages || [],
        query_categories_filter: filters.queryCategories || [],
        executive_summary: description || '',
        key_findings: {},
        metrics_data: {},
        charts_data: {},
        recommendations: [],
        raw_data: {}
      }

      const { data, error } = await supabase
        .from('brand_reports')
        .insert(reportData)
        .select('*')
        .single()

      if (error) {
        console.error('Error creating manual report:', error)
        return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
      }

      report = data
    }

    return NextResponse.json({ 
      success: true,
      data: report
    }, { status: 201 })

  } catch (error) {
    console.error('Error in brand reports POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}