import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { clearConfigCache } from '@/lib/services/config-service'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/config/models
 * List all LLM model configurations
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('llm_model_configs')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching models:', error)
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/config/models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/config/models
 * Create new LLM model configuration
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('llm_model_configs')
      .insert([{
        model_id: body.model_id,
        name: body.name,
        provider: body.provider,
        tier: body.tier || (body.tiers?.[0]) || 'growth',
        tiers: body.tiers || [body.tier || 'growth'],
        openrouter_id: body.openrouter_id,
        description: body.description,
        max_tokens: body.max_tokens || 4000,
        temperature: body.temperature || 0.0,
        supports_search: body.supports_search ?? true,
        supports_reasoning: body.supports_reasoning ?? true,
        supports_citations: body.supports_citations ?? true,
        rate_limit_rpm: body.rate_limit_rpm || 30,
        timeout_ms: body.timeout_ms || 30000,
        input_cost_per_million: body.input_cost_per_million || 0.0,
        output_cost_per_million: body.output_cost_per_million || 0.0,
        consumer_behavior: body.consumer_behavior || 'direct_and_factual',
        is_active: body.is_active ?? true,
        sort_order: body.sort_order || 0,
        purpose: body.purpose || 'query_run',
        is_default_onboarding: body.is_default_onboarding ?? false,
        fallback_priority: body.fallback_priority ?? null
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating model:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Clear cache
    clearConfigCache()
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST /api/admin/config/models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config/models
 * Update LLM model configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('llm_model_configs')
      .update({
        model_id: body.model_id,
        name: body.name,
        provider: body.provider,
        tier: body.tier || (body.tiers?.[0]) || 'growth',
        tiers: body.tiers || [body.tier || 'growth'],
        openrouter_id: body.openrouter_id,
        description: body.description,
        max_tokens: body.max_tokens,
        temperature: body.temperature,
        supports_search: body.supports_search,
        supports_reasoning: body.supports_reasoning,
        supports_citations: body.supports_citations,
        rate_limit_rpm: body.rate_limit_rpm,
        timeout_ms: body.timeout_ms,
        input_cost_per_million: body.input_cost_per_million,
        output_cost_per_million: body.output_cost_per_million,
        consumer_behavior: body.consumer_behavior,
        is_active: body.is_active,
        sort_order: body.sort_order,
        purpose: body.purpose || 'query_run',
        is_default_onboarding: body.is_default_onboarding ?? false,
        fallback_priority: body.fallback_priority ?? null
      })
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating model:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Clear cache
    clearConfigCache()
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/config/models
 * Delete (deactivate) LLM model configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('llm_model_configs')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting model:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Clear cache
    clearConfigCache()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/config/models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
