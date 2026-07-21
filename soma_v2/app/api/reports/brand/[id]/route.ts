import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/reporting/[id]
 * Get a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    // For service client, we use brand-based access control instead of user auth
    // The client should send brand_id to ensure proper filtering
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Fetch the report with sections, filtering by brand_id for access control
    const { data: report, error } = await supabase
      .from('brand_reports')
      .select(`
        *,
        brands!inner(id, name, logo_url)
      `)
      .eq('id', id)
      .eq('brand_id', brandId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      console.error('Error fetching report:', error)
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    // Separately fetch report sections (optional)
    let reportSections: any[] = []
    try {
      const { data: sections } = await supabase
        .from('report_sections')
        .select(`
          id,
          section_type,
          section_order,
          title,
          content,
          charts_data,
          tables_data,
          insights,
          is_visible,
          created_at,
          updated_at
        `)
        .eq('report_id', id)
        .order('section_order')
      
      reportSections = sections || []
    } catch (sectionsError) {
      console.warn('Could not fetch report sections:', sectionsError)
      // Continue without sections
    }

    // Add sections to the report object
    const reportWithSections = {
      ...report,
      report_sections: reportSections
    }

    // Update view count
    await supabase
      .from('brand_reports')
      .update({ 
        views_count: (report.views_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({ 
      success: true,
      data: reportWithSections 
    })

  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/reporting/[id]
 * Update a specific report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    // For service client, we use brand-based access control
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const {
      title,
      description,
      content,
      executive_summary,
      key_findings,
      recommendations,
      status,
      custom_sections,
      branding_config
    } = body

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title) updateData.title = title
    if (description) updateData.description = description
    if (content) updateData.content = content
    if (executive_summary) updateData.executive_summary = executive_summary
    if (key_findings) updateData.key_findings = key_findings
    if (recommendations) updateData.recommendations = recommendations
    if (status) updateData.status = status
    if (custom_sections) updateData.custom_sections = custom_sections
    if (branding_config) updateData.branding_config = branding_config

    // Set published_at if status is changing to published
    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    // Update the report, filtering by brand_id for access control
    const { data: report, error } = await supabase
      .from('brand_reports')
      .update(updateData)
      .eq('id', id)
      .eq('brand_id', brandId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      console.error('Error updating report:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: report 
    })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/reporting/[id]
 * Delete a specific report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    // For service client, we use brand-based access control
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Delete the report (sections will be deleted via cascade), filtering by brand_id for access control
    const { error } = await supabase
      .from('brand_reports')
      .delete()
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) {
      console.error('Error deleting report:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Report deleted successfully' 
    })

  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}