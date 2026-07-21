import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET - Fetch active config
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('analysis_engine_config')
      .select('*')
      .eq('config_key', 'default')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching analysis engine config:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error) {
    console.error('Error in GET /api/admin/config/analysis-engine:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update or create config
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const adminEmail = guard.email

    const body = await request.json()
    const {
      analysis_model,
      temperature,
      concurrency,
      max_retries,
      hybrid_mode,
      system_prompt,
      user_prompt,
      metric_definitions,
    } = body

    if (!system_prompt || !user_prompt) {
      return NextResponse.json({
        success: false,
        error: 'system_prompt and user_prompt are required'
      }, { status: 400 })
    }

    if (!analysis_model) {
      return NextResponse.json({
        success: false,
        error: 'analysis_model is required'
      }, { status: 400 })
    }

    // Validate metric_definitions is an array
    if (metric_definitions && !Array.isArray(metric_definitions)) {
      return NextResponse.json({
        success: false,
        error: 'metric_definitions must be an array'
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if config exists
    const { data: existing } = await supabase
      .from('analysis_engine_config')
      .select('id, version')
      .eq('config_key', 'default')
      .single()

    const payload = {
      analysis_model: String(analysis_model).slice(0, 100),
      temperature: Math.max(0, Math.min(2, Number(temperature) || 0.1)),
      concurrency: Math.max(1, Math.min(10, Number(concurrency) || 3)),
      max_retries: Math.max(0, Math.min(10, Number(max_retries) || 3)),
      hybrid_mode: Boolean(hybrid_mode),
      system_prompt,
      user_prompt,
      metric_definitions: metric_definitions || [],
      updated_by: adminEmail,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
      result = await supabase
        .from('analysis_engine_config')
        .update({
          ...payload,
          version: (existing.version || 1) + 1,
        })
        .eq('config_key', 'default')
        .select()
        .single()
    } else {
      result = await supabase
        .from('analysis_engine_config')
        .insert({
          config_key: 'default',
          ...payload,
          version: 1,
          is_active: true,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving analysis engine config:', result.error)
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/analysis-engine:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
