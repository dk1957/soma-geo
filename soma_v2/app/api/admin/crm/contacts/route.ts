import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/contacts - List contacts with filtering
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const contactType = searchParams.get('type') || ''
    const leadStatus = searchParams.get('status') || ''
    const leadSource = searchParams.get('source') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false

    let query = supabase
      .from('crm_contacts')
      .select('*', { count: 'exact' })

    // Filters
    if (contactType) query = query.eq('contact_type', contactType)
    if (leadStatus) query = query.eq('lead_status', leadStatus)
    if (leadSource) query = query.eq('lead_source', leadSource)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,company_domain.ilike.%${search}%`)
    }

    // Sort
    const validSorts = ['created_at', 'lead_score', 'last_contacted_at', 'company_name', 'full_name', 'updated_at']
    const safeSort = validSorts.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(safeSort, { ascending: sortOrder })
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching CRM contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Get summary stats
    const [
      { count: totalContacts },
      { count: totalProspects },
      { count: totalLeads },
      { count: totalCustomers },
    ] = await Promise.all([
      supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
      supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'prospect'),
      supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'lead'),
      supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'customer'),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
      stats: {
        total: totalContacts || 0,
        prospects: totalProspects || 0,
        leads: totalLeads || 0,
        customers: totalCustomers || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        email: body.email || null,
        phone: body.phone || null,
        full_name: body.full_name || null,
        job_title: body.job_title || null,
        linkedin_url: body.linkedin_url || null,
        company_name: body.company_name || null,
        company_domain: body.company_domain || null,
        company_industry: body.company_industry || null,
        company_size: body.company_size || null,
        company_country: body.company_country || null,
        company_city: body.company_city || null,
        company_address: body.company_address || null,
        company_latitude: body.company_latitude || null,
        company_longitude: body.company_longitude || null,
        company_description: body.company_description || null,
        contact_type: body.contact_type || 'prospect',
        lead_source: body.lead_source || 'manual',
        lead_status: body.lead_status || 'new',
        lead_score: body.lead_score || 0,
        budget_range: body.budget_range || null,
        pain_points: body.pain_points || [],
        use_case: body.use_case || null,
        assigned_to: body.assigned_to || null,
        tags: body.tags || [],
        notes: body.notes || null,
        research_data: body.research_data || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating CRM contact:', error)
      return NextResponse.json({ error: 'Failed to create contact', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/crm/contacts - Update a contact
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating CRM contact:', error)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/crm/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/contacts - Delete a contact
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('crm_contacts').delete().eq('id', id)

    if (error) {
      console.error('Error deleting CRM contact:', error)
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/crm/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
