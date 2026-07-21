import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { clearConfigCache } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

export interface WebSearchConfig {
  id: string
  model_id: string
  provider: string
  web_search_enabled: boolean
  search_engine: 'auto' | 'native' | 'exa'
  max_results: number
  search_context_size: 'low' | 'medium' | 'high'
  use_online_suffix: boolean
  use_responses_api: boolean
  custom_search_prompt: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// GET - Fetch all web search configurations
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('web_search_config')
      .select('*')
      .order('provider', { ascending: true })

    if (error) {
      console.error('Error fetching web search config:', error)
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
    console.error('Error in GET /api/admin/config/web-search:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update a web search configuration
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json()
    const { 
      model_id, 
      provider,
      web_search_enabled, 
      search_engine, 
      max_results, 
      search_context_size,
      use_online_suffix,
      use_responses_api,
      custom_search_prompt,
      is_active 
    } = body

    if (!model_id) {
      return NextResponse.json({
        success: false,
        error: 'model_id is required'
      }, { status: 400 })
    }

    // Validate search_engine
    if (search_engine && !['auto', 'native', 'exa'].includes(search_engine)) {
      return NextResponse.json({
        success: false,
        error: 'search_engine must be one of: auto, native, exa'
      }, { status: 400 })
    }

    // Validate max_results
    if (max_results !== undefined && (max_results < 1 || max_results > 10)) {
      return NextResponse.json({
        success: false,
        error: 'max_results must be between 1 and 10'
      }, { status: 400 })
    }

    // Validate search_context_size
    if (search_context_size && !['low', 'medium', 'high'].includes(search_context_size)) {
      return NextResponse.json({
        success: false,
        error: 'search_context_size must be one of: low, medium, high'
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if config exists
    const { data: existing } = await supabase
      .from('web_search_config')
      .select('id')
      .eq('model_id', model_id)
      .single()

    const configData = {
      model_id,
      provider: provider || 'unknown',
      web_search_enabled: web_search_enabled ?? true,
      search_engine: search_engine || 'auto',
      max_results: max_results ?? 5,
      search_context_size: search_context_size || 'medium',
      use_online_suffix: use_online_suffix ?? false,
      use_responses_api: use_responses_api ?? true,
      custom_search_prompt: custom_search_prompt || null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('web_search_config')
        .update(configData)
        .eq('model_id', model_id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('web_search_config')
        .insert(configData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving web search config:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 })
    }

    // Clear cache so changes apply immediately
    clearConfigCache()

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/web-search:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Bulk update multiple configurations
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json()
    const { configs } = body

    if (!Array.isArray(configs)) {
      return NextResponse.json({
        success: false,
        error: 'configs must be an array'
      }, { status: 400 })
    }

    const supabase = createServiceClient()
    const results = []
    const errors = []

    for (const config of configs) {
      const { model_id, ...updateData } = config
      
      if (!model_id) {
        errors.push({ model_id: 'unknown', error: 'model_id is required' })
        continue
      }

      const { data, error } = await supabase
        .from('web_search_config')
        .upsert({
          model_id,
          ...updateData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'model_id' })
        .select()
        .single()

      if (error) {
        errors.push({ model_id, error: error.message })
      } else {
        results.push(data)
      }
    }

    // Clear cache so changes apply immediately
    if (results.length > 0) {
      clearConfigCache()
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error in POST /api/admin/config/web-search:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
