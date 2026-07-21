import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    let query = supabase
      .from('crm_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('campaign_type', type)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CRM campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('crm_campaigns')
      .insert({
        name: body.name,
        description: body.description || null,
        campaign_type: body.campaign_type || 'email',
        status: 'draft',
        subject: body.subject || null,
        body_html: body.body_html || null,
        body_text: body.body_text || null,
        template_id: body.template_id || null,
        target_segments: body.target_segments || {},
        from_email: body.from_email || process.env.FROM_EMAIL || 'alerts@withsoma.ai',
        from_name: body.from_name || 'Soma AI',
        reply_to: body.reply_to || process.env.FROM_EMAIL || 'alerts@withsoma.ai',
        created_by: guard.email,
        tags: body.tags || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating CRM campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/crm/campaigns - Update a campaign
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('crm_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating CRM campaign:', error)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/crm/campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
