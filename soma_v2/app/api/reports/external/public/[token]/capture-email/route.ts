import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params
    const { token } = params
    const body = await request.json()
    const { email, name, company } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get external report by share token
    const { data: externalReport, error: reportError } = await supabase
      .from('external_brand_reports')
      .select('id, requires_email_capture, is_active, expires_at')
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (reportError || !externalReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Check if report has expired
    if (externalReport.expires_at && new Date(externalReport.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 403 }
      )
    }

    // Create or update email capture record
    const { data: existingCapture } = await supabase
      .from('external_report_email_captures')
      .select('id, access_token')
      .eq('external_report_id', externalReport.id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    let accessToken: string

    if (existingCapture) {
      // Return existing access token
      accessToken = existingCapture.access_token
      
      // Update last accessed time
      await supabase
        .from('external_report_email_captures')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', existingCapture.id)
    } else {
      // Generate new access token
      accessToken = crypto.randomUUID()

      // Create new email capture record
      const { error: insertError } = await supabase
        .from('external_report_email_captures')
        .insert({
          external_report_id: externalReport.id,
          email: email.toLowerCase(),
          name: name || null,
          company: company || null,
          access_token: accessToken,
          captured_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error capturing email:', insertError)
        return NextResponse.json(
          { error: 'Failed to capture email' },
          { status: 500 }
        )
      }

      // Update email capture count on external report
      const { error: rpcError } = await supabase.rpc('increment_email_captures', {
        report_id: externalReport.id
      })
      
      if (rpcError) {
        console.error('Failed to increment email captures:', rpcError)
      }
    }

    // Return success with access token
    return NextResponse.json({
      success: true,
      access_token: accessToken,
      message: existingCapture ? 'Welcome back!' : 'Email captured successfully'
    })

  } catch (error) {
    console.error('Error capturing email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
