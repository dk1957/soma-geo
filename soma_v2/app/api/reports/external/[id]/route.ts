import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeLeads = searchParams.get('include_leads') === 'true'

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Get external report analytics
    const { data: externalReport, error } = await supabase
      .from('external_brand_reports')
      .select(`
        id,
        share_token,
        title,
        brand_name,
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
        is_active,
        last_viewed_at
      `)
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .single()

    if (error || !externalReport) {
      return NextResponse.json(
        { error: 'External report not found' },
        { status: 404 }
      )
    }

    const result = {
      external_report: externalReport,
      public_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'}/reports/public/${externalReport.share_token}`
    }

    // Include leads data if requested
    if (includeLeads) {
      const { data: leads, error: leadsError } = await supabase
        .from('external_report_leads')
        .select(`
          id,
          email,
          phone_number,
          full_name,
          company_name,
          job_title,
          company_size,
          intent_level,
          lead_score,
          lead_status,
          time_on_report,
          sections_viewed,
          ip_address,
          country,
          city,
          device_type,
          browser,
          created_at,
          contacted_by_bd,
          bd_contact_date,
          bd_notes
        `)
        .eq('external_report_id', id)
        .order('created_at', { ascending: false })

      if (leadsError) {
        console.error('Error fetching leads:', leadsError)
      } else {
        result.leads = leads
      }

      // Get view analytics
      const { data: views, error: viewsError } = await supabase
        .from('external_report_views')
        .select(`
          id,
          visitor_id,
          page_section,
          view_duration,
          device_type,
          browser,
          country,
          city,
          created_at
        `)
        .eq('external_report_id', id)
        .order('created_at', { ascending: false })
        .limit(100) // Limit to recent views

      if (viewsError) {
        console.error('Error fetching views:', viewsError)
      } else {
        result.views = views
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching external report analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE endpoint to modify external report settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Validate allowed update fields
    const allowedFields = [
      'title',
      'description',
      'is_active',
      'requires_email_capture',
      'preview_section_count',
      'expires_at'
    ]

    const updateData = {}
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update external report
    const { data: updatedReport, error } = await supabase
      .from('external_brand_reports')
      .update(updateData)
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .select()
      .single()

    if (error || !updatedReport) {
      return NextResponse.json(
        { error: 'Failed to update external report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      external_report: updatedReport
    })

  } catch (error) {
    console.error('Error updating external report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to deactivate external report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Deactivate external report (soft delete)
    const { error } = await supabase
      .from('external_brand_reports')
      .update({ is_active: false })
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to deactivate external report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deactivating external report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}