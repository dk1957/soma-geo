import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/activities - List activities for a contact or deal
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id') || ''
    const dealId = searchParams.get('deal_id') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (contactId) query = query.eq('contact_id', contactId)
    if (dealId) query = query.eq('deal_id', dealId)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CRM activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/activities - Log an activity
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        contact_id: body.contact_id,
        deal_id: body.deal_id || null,
        activity_type: body.activity_type,
        subject: body.subject || null,
        body: body.body || null,
        channel: body.channel || null,
        metadata: body.metadata || {},
        performed_by: guard.email,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating CRM activity:', error)
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
    }

    // Update contact last_activity_at
    if (body.contact_id) {
      await supabase
        .from('crm_contacts')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', body.contact_id)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
