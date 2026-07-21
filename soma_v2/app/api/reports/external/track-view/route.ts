import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Handle empty body gracefully
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const {
      share_token,
      visitor_id,
      session_id,
      page_section,
      view_duration,
      user_agent,
      referrer_url,
      device_type,
      browser,
      screen_resolution
    } = body

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Get external report ID from share token
    const { data: report, error } = await supabase
      .from('external_brand_reports')
      .select('id')
      .eq('share_token', share_token)
      .eq('is_active', true)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Invalid share token' },
        { status: 404 }
      )
    }

    // Check if this is a unique visitor for this report
    const { data: existingView } = await supabase
      .from('external_report_views')
      .select('visitor_id')
      .eq('external_report_id', report.id)
      .eq('visitor_id', visitor_id)
      .limit(1)

    const isUniqueVisitor = !existingView || existingView.length === 0

    // Create view record
    const { error: viewError } = await supabase
      .from('external_report_views')
      .insert({
        external_report_id: report.id,
        visitor_id,
        session_id,
        page_section,
        view_duration,
        ip_address,
        user_agent,
        referrer_url,
        device_type,
        browser,
        screen_resolution
      })

    if (viewError) {
      console.error('Error creating view record:', viewError)
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      )
    }

    // Always update total_views for every view
    // Update unique_visitors only if this is a new visitor
    const { data: currentReport } = await supabase
      .from('external_brand_reports')
      .select('total_views, unique_visitors')
      .eq('id', report.id)
      .single()
    
    if (currentReport) {
      const updateData: {
        total_views: number
        unique_visitors?: number
        last_viewed_at: string
      } = { 
        total_views: (currentReport.total_views || 0) + 1,
        last_viewed_at: new Date().toISOString()
      }
      
      // Only increment unique_visitors for new visitors
      if (isUniqueVisitor) {
        updateData.unique_visitors = (currentReport.unique_visitors || 0) + 1
      }
      
      await supabase
        .from('external_brand_reports')
        .update(updateData)
        .eq('id', report.id)
    }

    return NextResponse.json({ success: true, isUniqueVisitor })

  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}