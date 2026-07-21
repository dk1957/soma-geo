import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { clearCacheKey } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

// GET - Fetch all system prompts
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('prompt_type', { ascending: true })
      .order('role', { ascending: true })

    if (error) {
      console.error('Error fetching system prompts:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in GET /api/admin/config/system-prompts:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update a system prompt
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json()
    const { prompt_type, role = 'system', name, description, content, variables, is_active, version } = body

    if (!prompt_type || !content) {
      return NextResponse.json({
        success: false,
        error: 'prompt_type and content are required'
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if prompt exists (by type + role)
    const { data: existing } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('prompt_type', prompt_type)
      .eq('role', role)
      .single()

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('system_prompts')
        .update({
          name,
          description,
          content,
          variables,
          is_active,
          version: (version || 1),
          updated_at: new Date().toISOString()
        })
        .eq('prompt_type', prompt_type)
        .eq('role', role)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('system_prompts')
        .insert({
          prompt_type,
          role,
          name,
          description,
          content,
          variables,
          is_active,
          version: 1
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving system prompt:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 })
    }

    // Clear cache so changes apply immediately
    clearCacheKey(`system_prompt_${prompt_type}_${role}`)
    clearCacheKey(`system_prompt_${prompt_type}_system`)
    clearCacheKey(`system_prompt_${prompt_type}_user`)
    clearCacheKey('all_system_prompts')

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/system-prompts:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
