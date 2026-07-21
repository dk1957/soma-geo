import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/config/agent-skills
 * List all agent skills, optionally filtered by agent_system
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const system = searchParams.get('system')

    let query = supabase
      .from('agent_skills')
      .select('*')
      .order('agent_system', { ascending: true })
      .order('sort_order', { ascending: true })

    if (system) {
      query = query.eq('agent_system', system)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agent skills:', error)
      return NextResponse.json({ error: 'Failed to fetch agent skills' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/config/agent-skills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/config/agent-skills
 * Create a new skill
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    if (!body.agent_system || !body.skill_key || !body.name) {
      return NextResponse.json({ error: 'agent_system, skill_key, and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        agent_system: body.agent_system,
        skill_key: body.skill_key,
        name: body.name,
        description: body.description || '',
        is_enabled: body.is_enabled ?? true,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A skill with this key already exists in this system' }, { status: 409 })
      }
      console.error('Error creating skill:', error)
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/config/agent-skills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config/agent-skills
 * Update a skill by id
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order

    const { data, error } = await supabase
      .from('agent_skills')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating skill:', error)
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/agent-skills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/config/agent-skills
 * Delete a skill by id
 */
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('agent_skills')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/config/agent-skills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
