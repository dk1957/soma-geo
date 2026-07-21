import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { clearCacheKey } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

// Default settings if none exist in database
const DEFAULT_SETTINGS = {
  concurrency_limit: 3,
  timeout_ms: 120000,
  temperature: 0.7,
  max_tokens: 8000,
  default_period_days: 30,
  retry_attempts: 3,
  retry_delay_ms: 1000,
  rate_limit_rpm: 100,
  cost_tracking_enabled: true
}

// GET - Fetch run settings
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    // Try to get settings from config table
    const { data, error } = await supabase
      .from('run_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching run config:', error)
    }

    // Return existing settings or defaults
    // Map DB column names to UI field names so the admin UI can load them correctly
    const raw = data || DEFAULT_SETTINGS
    const mapped = {
      ...raw,
      // Aliases: DB column name → UI field name
      default_temperature: raw.temperature,
      default_max_tokens: raw.max_tokens,
      max_retries: raw.retry_attempts,
      requests_per_minute: raw.rate_limit_rpm,
    }
    return NextResponse.json({
      success: true,
      data: mapped
    })
  } catch (error) {
    console.error('Error in GET /api/admin/config/run:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update run settings
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json()
    
    // Map frontend field names to database column names
    // The admin UI sends default_temperature, max_retries, etc.
    // while the database uses temperature, retry_attempts, etc.
    const concurrency_limit = body.concurrency_limit
    const timeout_ms = body.timeout_ms
    const temperature = body.temperature ?? body.default_temperature
    const max_tokens = body.max_tokens ?? body.default_max_tokens
    const default_period_days = body.default_period_days
    const retry_attempts = body.retry_attempts ?? body.max_retries
    const retry_delay_ms = body.retry_delay_ms
    const rate_limit_rpm = body.rate_limit_rpm ?? body.requests_per_minute
    const cost_tracking_enabled = body.cost_tracking_enabled
    // Additional fields from admin UI
    const fallback_enabled = body.fallback_enabled
    const rate_limit_enabled = body.rate_limit_enabled
    const max_cost_per_run = body.max_cost_per_run
    const daily_cost_limit = body.daily_cost_limit
    const auto_analysis_enabled = body.auto_analysis_enabled
    const longitudinal_analysis_enabled = body.longitudinal_analysis_enabled
    const deduplication_window_hours = body.deduplication_window_hours
    const force_rerun_allowed = body.force_rerun_allowed

    // Validate settings
    if (concurrency_limit !== undefined && (concurrency_limit < 1 || concurrency_limit > 20)) {
      return NextResponse.json({
        success: false,
        error: 'concurrency_limit must be between 1 and 20'
      }, { status: 400 })
    }

    if (timeout_ms !== undefined && (timeout_ms < 10000 || timeout_ms > 300000)) {
      return NextResponse.json({
        success: false,
        error: 'timeout_ms must be between 10000 and 300000'
      }, { status: 400 })
    }

    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return NextResponse.json({
        success: false,
        error: 'temperature must be between 0 and 2'
      }, { status: 400 })
    }

    if (max_tokens !== undefined && (max_tokens < 100 || max_tokens > 32000)) {
      return NextResponse.json({
        success: false,
        error: 'max_tokens must be between 100 and 32000'
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if config exists
    const { data: existing } = await supabase
      .from('run_config')
      .select('id')
      .eq('is_active', true)
      .single()

    const settings = {
      concurrency_limit: concurrency_limit ?? DEFAULT_SETTINGS.concurrency_limit,
      timeout_ms: timeout_ms ?? DEFAULT_SETTINGS.timeout_ms,
      temperature: temperature ?? DEFAULT_SETTINGS.temperature,
      max_tokens: max_tokens ?? DEFAULT_SETTINGS.max_tokens,
      default_period_days: default_period_days ?? DEFAULT_SETTINGS.default_period_days,
      retry_attempts: retry_attempts ?? DEFAULT_SETTINGS.retry_attempts,
      retry_delay_ms: retry_delay_ms ?? DEFAULT_SETTINGS.retry_delay_ms,
      rate_limit_rpm: rate_limit_rpm ?? DEFAULT_SETTINGS.rate_limit_rpm,
      cost_tracking_enabled: cost_tracking_enabled ?? DEFAULT_SETTINGS.cost_tracking_enabled,
      // Additional settings from admin UI
      ...(fallback_enabled !== undefined && { fallback_enabled }),
      ...(rate_limit_enabled !== undefined && { rate_limit_enabled }),
      ...(max_cost_per_run !== undefined && { max_cost_per_run }),
      ...(daily_cost_limit !== undefined && { daily_cost_limit }),
      ...(auto_analysis_enabled !== undefined && { auto_analysis_enabled }),
      ...(longitudinal_analysis_enabled !== undefined && { longitudinal_analysis_enabled }),
      ...(deduplication_window_hours !== undefined && { deduplication_window_hours }),
      ...(force_rerun_allowed !== undefined && { force_rerun_allowed }),
      is_active: true,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('run_config')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('run_config')
        .insert(settings)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving run config:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 })
    }

    // Clear cache so changes apply immediately
    clearCacheKey('run_config')

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/config/run:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
