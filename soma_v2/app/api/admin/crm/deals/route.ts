import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/deals - List deals with pipeline view
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    const stage = searchParams.get('stage') || ''
    const assignedTo = searchParams.get('assigned_to') || ''

    let query = supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name, company_domain, lead_score)
      `)
      .order('created_at', { ascending: false })

    if (stage) query = query.eq('stage', stage)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CRM deals:', error)
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
    }

    // Pipeline summary
    const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    const pipeline: Record<string, { count: number; value: number }> = {}
    for (const s of stages) {
      const stageDeals = (data || []).filter(d => d.stage === s)
      pipeline[s] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0),
      }
    }

    const totalPipelineValue = (data || [])
      .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
      .reduce((sum, d) => sum + (d.deal_value || 0) * ((d.probability || 0) / 100), 0)

    return NextResponse.json({
      success: true,
      data,
      pipeline,
      totalPipelineValue,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/deals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('crm_deals')
      .insert({
        contact_id: body.contact_id,
        deal_name: body.deal_name,
        deal_value: body.deal_value || 0,
        stage: body.stage || 'discovery',
        probability: body.probability || 10,
        plan_interest: body.plan_interest || null,
        billing_cycle_interest: body.billing_cycle_interest || null,
        expected_close_date: body.expected_close_date || null,
        assigned_to: body.assigned_to || null,
        notes: body.notes || null,
        tags: body.tags || [],
      })
      .select(`*, contact:crm_contacts(id, full_name, email, company_name)`)
      .single()

    if (error) {
      console.error('Error creating CRM deal:', error)
      return NextResponse.json({ error: 'Failed to create deal', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/deals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/crm/deals - Update a deal (stage changes, etc.)
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
    }

    // If closing, set actual close date
    if (updates.stage === 'closed_won' || updates.stage === 'closed_lost') {
      updates.actual_close_date = new Date().toISOString().split('T')[0]
      if (updates.stage === 'closed_won') updates.probability = 100
      if (updates.stage === 'closed_lost') updates.probability = 0
    }

    const { data, error } = await supabase
      .from('crm_deals')
      .update(updates)
      .eq('id', id)
      .select(`*, contact:crm_contacts(id, full_name, email, company_name)`)
      .single()

    if (error) {
      console.error('Error updating CRM deal:', error)
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }

    // Log stage change as activity
    if (updates.stage && body.contact_id) {
      await supabase.from('crm_activities').insert({
        contact_id: body.contact_id || data?.contact?.id,
        deal_id: id,
        activity_type: 'status_change',
        subject: `Deal moved to ${updates.stage}`,
        performed_by: 'admin',
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/crm/deals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
