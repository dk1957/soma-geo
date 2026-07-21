import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      external_report_id,
      share_token,
      visitor_id,
      session_id,
      email,
      phone_number,
      full_name,
      company_name,
      job_title,
      company_size,
      user_agent,
      referrer_url,
      device_type,
      browser
    } = body

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Validate required fields
    if (!email || !share_token || !visitor_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get external report ID if not provided
    let reportId = external_report_id
    if (!reportId && share_token) {
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

      reportId = report.id
    }

    // Calculate engagement metrics (simplified for now)
    const sectionsViewed = ['preview'] // Will be enhanced based on actual tracking
    const timeOnReport = 120 // Default value, will be enhanced with actual tracking

    // Calculate lead intent score
    const { data: intentScore } = await supabase
      .rpc('calculate_lead_intent_score', {
        p_company_size: company_size || 'unknown',
        p_job_title: job_title || '',
        p_time_on_report: timeOnReport,
        p_sections_viewed: sectionsViewed,
        p_referrer_url: referrer_url || ''
      })

    // Determine intent level based on score
    let intentLevel = 'unknown'
    if (intentScore >= 80) intentLevel = 'high'
    else if (intentScore >= 60) intentLevel = 'medium'
    else if (intentScore >= 40) intentLevel = 'low'

    // Create lead record
    const { data: leadData, error: leadError } = await supabase
      .from('external_report_leads')
      .insert({
        external_report_id: reportId,
        visitor_id,
        session_id,
        email,
        phone_number,
        full_name,
        company_name,
        job_title,
        company_size,
        intent_level: intentLevel,
        lead_score: intentScore || 0,
        source_utm: '', // Will be enhanced with UTM tracking
        referrer_url,
        time_on_report: timeOnReport,
        sections_viewed: sectionsViewed,
        ip_address,
        device_type,
        browser
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error creating lead record:', leadError)
      return NextResponse.json(
        { error: 'Failed to save lead information' },
        { status: 500 }
      )
    }

    // Send notification email to BD team (optional)
    // This could be enhanced with email service integration
    
    return NextResponse.json({
      success: true,
      lead_id: leadData.id,
      intent_level: intentLevel,
      lead_score: intentScore
    })

  } catch (error) {
    console.error('Error capturing lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}