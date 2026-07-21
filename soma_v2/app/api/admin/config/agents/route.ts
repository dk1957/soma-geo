import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { clearConfigCache } from '@/lib/services/config-service'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/config/agents
 * List all agent model configurations
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('agent_model_configs')
      .select('*')
      .order('agent_type', { ascending: true })
    
    if (error) {
      console.error('Error fetching agent configs:', error)
      return NextResponse.json({ error: 'Failed to fetch agent configs' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/config/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config/agents
 * Bulk update agent model configurations
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    
    if (!Array.isArray(body.configs)) {
      return NextResponse.json({ error: 'configs array is required' }, { status: 400 })
    }
    
    // Update each config
    const updates = body.configs.map(async (config: any) => {
      const { error } = await supabase
        .from('agent_model_configs')
        .upsert({
          agent_type: config.agent_type,
          model_id: config.model_id,
          provider: config.provider || 'openrouter',
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          is_active: config.is_active ?? true
        }, {
          onConflict: 'agent_type'
        })
      
      if (error) {
        console.error(`Error updating ${config.agent_type}:`, error)
        throw error
      }
    })
    
    await Promise.all(updates)
    
    // Clear cache
    clearConfigCache()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
