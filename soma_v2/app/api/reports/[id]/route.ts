import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const reportId = params.id
    const { searchParams } = new URL(request.url)
    const brandIdParam = searchParams.get('brandId')

    // First, try fetching from external_brand_reports table (don't filter by brandId - external reports have their own brand)
    let { data: report, error } = await supabase
      .from('external_brand_reports')
      .select(`
        id,
        source_report_id,
        brand_id,
        title,
        description,
        brand_name,
        full_content,
        executive_summary,
        key_metrics,
        created_at,
        updated_at,
        share_token,
        total_views,
        unique_visitors,
        email_captures,
        conversion_rate,
        last_viewed_at,
        brands(
          id,
          name,
          industry,
          target_markets
        )
      `)
      .eq('id', reportId)
      .maybeSingle()

    // If not found in external reports, try brand_reports table
    // Do NOT filter by brandId param — access is verified below via account_users
    if (!report && !error) {
      const { data: brandReport, error: brandReportError } = await supabase
        .from('brand_reports')
        .select(`
          *,
          brands(
            id,
            name,
            industry,
            target_markets
          )
        `)
        .eq('id', reportId)
        .maybeSingle()

      report = brandReport
      error = brandReportError
    }
    
    // Get the actual brand_id from the report for access check
    const brandId = report?.brand_id || brandIdParam

    // If found in external_brand_reports, transform to match expected format
    if (report && !error && report.full_content) {
      // Merge full_content into top-level report object
      const fullContentData = report.full_content as any
      report = {
        ...report,
        report_type: 'visibility_report_external' as const,
        status: 'completed' as const,
        metrics_data: fullContentData.metrics_data,
        key_findings: fullContentData.key_findings,
        charts_data: fullContentData.charts_data,
        recommendations: fullContentData.recommendations,
        raw_data: fullContentData.raw_data,
        overall_score: report.key_metrics?.overall_score,
        visibility_score: report.key_metrics?.visibility_score,
        mention_count: report.key_metrics?.mention_count,
        citation_count: report.key_metrics?.citation_count,
        // Include analytics data
        views_count: report.total_views || 0,
        unique_views: report.unique_visitors || 0,
        shares_count: 1, // External report itself counts as 1 share
        email_captures: report.email_captures || 0,
        conversion_rate: report.conversion_rate || 0,
        last_viewed_at: report.last_viewed_at,
        share_url: report.share_token ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'}/reports/public/${report.share_token}` : null
      }
    }

    if (error) {
      console.error('Report fetch error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    if (!report) {
      console.log('Report not found:', { reportId, brandId })
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    console.log('Report found:', { id: report.id, brand_id: report.brand_id, title: report.title })

    // Check user access: verify user belongs to the account that owns this brand
    // Two simple indexed lookups instead of a slow nested PostgREST join
    const { data: brandRow } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .maybeSingle()

    if (!brandRow) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: accountAccess } = await supabase
      .from('account_users')
      .select('clerk_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brandRow.account_id)
      .maybeSingle()

    if (!accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Report GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const reportId = params.id

    // Try to find and verify access in external_brand_reports first
    const { data: externalReport } = await supabase
      .from('external_brand_reports')
      .select(`
        id,
        brand_id,
        brands!inner(
          id,
          accounts!inner(
            account_users!inner(clerk_id)
          )
        )
      `)
      .eq('id', reportId)
      .eq('brands.accounts.account_users.clerk_id', user.clerkUserId)
      .maybeSingle()

    if (externalReport) {
      const { error: deleteError } = await supabase
        .from('external_brand_reports')
        .delete()
        .eq('id', reportId)
      if (deleteError) {
        console.error('Delete error (external_brand_reports):', deleteError)
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'Report deleted successfully' })
    }

    // Fall back to brand_reports table
    const { data: brandReport } = await supabase
      .from('brand_reports')
      .select(`
        id,
        brand_id,
        brands!inner(
          id,
          accounts!inner(
            account_users!inner(clerk_id)
          )
        )
      `)
      .eq('id', reportId)
      .eq('brands.accounts.account_users.clerk_id', user.clerkUserId)
      .maybeSingle()

    if (!brandReport) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('brand_reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      console.error('Delete error (brand_reports):', deleteError)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Report deleted successfully' })

  } catch (error) {
    console.error('Report DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}