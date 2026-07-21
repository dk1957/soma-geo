import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/tasks - List tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contact_id') || ''
    const dealId = searchParams.get('deal_id') || ''
    const priority = searchParams.get('priority') || ''
    const dueBefore = searchParams.get('due_before') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name, company_domain),
        deal:crm_deals(id, deal_name, deal_value, stage)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (status) query = query.eq('status', status)
    if (contactId) query = query.eq('contact_id', contactId)
    if (dealId) query = query.eq('deal_id', dealId)
    if (priority) query = query.eq('priority', priority)
    if (dueBefore) query = query.lte('due_date', dueBefore)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching CRM tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Get summary counts
    const [pending, overdue, dueToday] = await Promise.all([
      supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
      supabase.from('crm_tasks').select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', new Date().toISOString()),
      supabase.from('crm_tasks').select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])
        .gte('due_date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte('due_date', new Date(new Date().setHours(23, 59, 59, 999)).toISOString()),
    ])

    return NextResponse.json({
      success: true,
      data,
      summary: {
        pending: pending.count || 0,
        overdue: overdue.count || 0,
        dueToday: dueToday.count || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/tasks - Create a task
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        contact_id: body.contact_id || null,
        deal_id: body.deal_id || null,
        title: body.title,
        description: body.description || null,
        task_type: body.task_type || 'follow_up',
        priority: body.priority || 'medium',
        status: 'pending',
        due_date: body.due_date || null,
        assigned_to: body.assigned_to || null,
        created_by: guard.email,
      })
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name),
        deal:crm_deals(id, deal_name, deal_value, stage)
      `)
      .single()

    if (error) {
      console.error('Error creating CRM task:', error)
      return NextResponse.json({ error: 'Failed to create task', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/crm/tasks - Update a task
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Auto-set completed_at when marking complete
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name),
        deal:crm_deals(id, deal_name, deal_value, stage)
      `)
      .single()

    if (error) {
      console.error('Error updating CRM task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/crm/tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })

    const { error } = await supabase.from('crm_tasks').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
