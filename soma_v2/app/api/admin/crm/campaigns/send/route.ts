import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// POST /api/admin/crm/campaigns/send - Send a campaign
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { campaignId, contactIds } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('crm_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get recipients — either specified contacts or from target segments
    let contacts: any[] = []
    if (contactIds && contactIds.length > 0) {
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, email, phone, full_name, company_name')
        .in('id', contactIds)
      contacts = data || []
    } else {
      // Get all contacts matching segment criteria
      let q = supabase
        .from('crm_contacts')
        .select('id, email, phone, full_name, company_name')

      const seg = campaign.target_segments || {}
      if (seg.contact_type) q = q.eq('contact_type', seg.contact_type)
      if (seg.lead_status) q = q.eq('lead_status', seg.lead_status)
      if (seg.lead_source) q = q.eq('lead_source', seg.lead_source)
      if (seg.min_score) q = q.gte('lead_score', seg.min_score)

      const { data } = await q
      contacts = data || []
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts match the target criteria' }, { status: 400 })
    }

    // Update campaign status
    await supabase.from('crm_campaigns').update({
      status: 'sending',
      total_recipients: contacts.length,
      sent_at: new Date().toISOString(),
    }).eq('id', campaignId)

    const results = { sent: 0, failed: 0, errors: [] as string[] }

    if (campaign.campaign_type === 'email' || campaign.campaign_type === 'email_sequence') {
      // Send via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
      }

      const resend = new Resend(resendKey)

      for (const contact of contacts) {
        if (!contact.email) continue

        try {
          // Replace template variables
          let htmlContent = campaign.body_html || ''
          let subject = campaign.subject || ''
          const replacements: Record<string, string> = {
            '{{name}}': contact.full_name || 'there',
            '{{first_name}}': (contact.full_name || 'there').split(' ')[0],
            '{{company}}': contact.company_name || 'your company',
            '{{email}}': contact.email,
          }
          for (const [key, value] of Object.entries(replacements)) {
            htmlContent = htmlContent.replaceAll(key, value)
            subject = subject.replaceAll(key, value)
          }

          const result = await resend.emails.send({
            from: `${campaign.from_name || 'Soma AI'} <${campaign.from_email || 'alerts@withsoma.ai'}>`,
            to: [contact.email],
            subject,
            html: htmlContent,
            text: campaign.body_text || undefined,
            replyTo: campaign.reply_to || undefined,
          })

          // Track recipient
          await supabase.from('crm_campaign_recipients').insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            email: contact.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_message_id: (result as any)?.data?.id || null,
          })

          // Log activity
          await supabase.from('crm_activities').insert({
            contact_id: contact.id,
            activity_type: 'campaign_sent',
            subject: `Campaign: ${campaign.name}`,
            body: subject,
            channel: 'email',
            performed_by: guard.email,
            metadata: { campaign_id: campaignId },
          })

          results.sent++
        } catch (err: any) {
          results.failed++
          results.errors.push(`${contact.email}: ${err.message}`)

          await supabase.from('crm_campaign_recipients').insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            email: contact.email,
            status: 'failed',
            error_message: err.message,
          })
        }
      }
    } else if (campaign.campaign_type === 'sms' || campaign.campaign_type === 'sms_sequence') {
      // Send via Twilio
      const twilioSid = process.env.TWILIO_ACCOUNT_SID
      const twilioToken = process.env.TWILIO_AUTH_TOKEN
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER

      if (!twilioSid || twilioSid === 'your_twilio_account_sid') {
        return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 })
      }

      for (const contact of contacts) {
        if (!contact.phone) continue

        try {
          let smsBody = campaign.body_text || ''
          smsBody = smsBody.replaceAll('{{name}}', contact.full_name || 'there')
          smsBody = smsBody.replaceAll('{{company}}', contact.company_name || 'your company')

          // Twilio REST API
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
          const twilioRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: contact.phone,
              From: twilioPhone || '',
              Body: smsBody,
            }),
          })

          const twilioData = await twilioRes.json()

          await supabase.from('crm_campaign_recipients').insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            phone: contact.phone,
            status: twilioRes.ok ? 'sent' : 'failed',
            sent_at: twilioRes.ok ? new Date().toISOString() : null,
            twilio_message_sid: twilioData.sid || null,
            error_message: twilioRes.ok ? null : (twilioData.message || 'SMS send failed'),
          })

          await supabase.from('crm_activities').insert({
            contact_id: contact.id,
            activity_type: 'sms_sent',
            subject: `SMS Campaign: ${campaign.name}`,
            body: smsBody,
            channel: 'sms',
            performed_by: guard.email,
            metadata: { campaign_id: campaignId },
          })

          if (twilioRes.ok) results.sent++
          else results.failed++
        } catch (err: any) {
          results.failed++
          results.errors.push(`${contact.phone}: ${err.message}`)
        }
      }
    }

    // Update campaign final stats
    await supabase.from('crm_campaigns').update({
      status: 'sent',
      total_sent: results.sent,
    }).eq('id', campaignId)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/campaigns/send:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
