import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/admin/subscription-plans
 * List all subscription plans (including inactive/private)
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }
    
    // Get subscriber counts per plan
    const { data: subCounts } = await supabase
      .from('account_subscriptions')
      .select('plan_id, status')
      .in('status', ['active', 'trialing'])

    const planStats: Record<string, { active: number; trialing: number }> = {}
    for (const sub of subCounts || []) {
      if (!planStats[sub.plan_id]) planStats[sub.plan_id] = { active: 0, trialing: 0 }
      if (sub.status === 'active') planStats[sub.plan_id].active++
      else if (sub.status === 'trialing') planStats[sub.plan_id].trialing++
    }

    const plans = (data || []).map(plan => ({
      ...plan,
      subscriber_count: (planStats[plan.id]?.active || 0) + (planStats[plan.id]?.trialing || 0),
      active_subscribers: planStats[plan.id]?.active || 0,
      trial_subscribers: planStats[plan.id]?.trialing || 0,
    }))

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error('Error in GET /api/admin/subscription-plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/subscription-plans
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    // Rate limit admin writes
    const limited = applyRateLimit(request, 'admin:plans', RATE_LIMITS.admin)
    if (limited) return limited

    const supabase = createServiceClient()
    const body = await request.json()

    const {
      plan_name, plan_slug, display_name, description, plan_tier,
      monthly_price_usd, quarterly_price_usd, biannual_price_usd, annual_price_usd,
      max_brands, max_prompts_per_brand, max_competitors_per_brand, max_team_members,
      allowed_models, max_model_platforms, max_locales_per_prompt,
      features, monthly_run_limit, monthly_report_limit, data_retention_months,
      is_active, is_public, sort_order
    } = body

    // Validate required fields
    if (!plan_name || !plan_slug || !display_name || !plan_tier) {
      return NextResponse.json({ error: 'plan_name, plan_slug, display_name, and plan_tier are required' }, { status: 400 })
    }

    const validTiers = ['growth', 'pro', 'enterprise']
    if (!validTiers.includes(plan_tier)) {
      return NextResponse.json({ error: 'plan_tier must be growth, pro, or enterprise' }, { status: 400 })
    }

    if (monthly_price_usd == null || monthly_price_usd < 0) {
      return NextResponse.json({ error: 'monthly_price_usd must be a non-negative number' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        plan_name,
        plan_slug,
        display_name,
        description: description || null,
        plan_tier,
        monthly_price_usd,
        quarterly_price_usd: quarterly_price_usd ?? null,
        biannual_price_usd: biannual_price_usd ?? null,
        annual_price_usd: annual_price_usd ?? null,
        max_brands: max_brands ?? 1,
        max_prompts_per_brand: max_prompts_per_brand ?? 20,
        max_competitors_per_brand: max_competitors_per_brand ?? 10,
        max_team_members: max_team_members ?? 5,
        allowed_models: allowed_models ?? ['openai', 'anthropic', 'google'],
        max_model_platforms: max_model_platforms ?? 3,
        max_locales_per_prompt: max_locales_per_prompt ?? 1,
        features: features ?? {},
        monthly_run_limit: monthly_run_limit ?? 500,
        monthly_report_limit: monthly_report_limit ?? 10,
        data_retention_months: data_retention_months ?? 12,
        is_active: is_active ?? true,
        is_public: is_public ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A plan with this name or slug already exists' }, { status: 409 })
      }
      console.error('Error creating plan:', error)
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, plan: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/subscription-plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/subscription-plans
 * Update an existing subscription plan
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be directly updatable
    delete updates.created_at
    delete updates.subscriber_count
    delete updates.active_subscribers
    delete updates.trial_subscribers

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A plan with this name or slug already exists' }, { status: 409 })
      }
      console.error('Error updating plan:', error)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    // If quota limits changed, update existing brand_quotas for accounts on this plan
    if (updates.max_prompts_per_brand != null || updates.max_competitors_per_brand != null || 
        updates.max_model_platforms != null || updates.allowed_models != null) {
      const { data: affectedSubs } = await supabase
        .from('account_subscriptions')
        .select('account_id')
        .eq('plan_id', id)
        .in('status', ['active', 'trialing'])

      if (affectedSubs && affectedSubs.length > 0) {
        const accountIds = affectedSubs.map(s => s.account_id)
        
        // Get all brands for these accounts
        const { data: brands } = await supabase
          .from('brands')
          .select('id')
          .in('account_id', accountIds)
          .eq('is_active', true)

        // Re-initialize quotas for each brand
        if (brands) {
          for (const brand of brands) {
            await supabase.rpc('initialize_brand_quota', { p_brand_id: brand.id })
          }
        }
      }
    }

    return NextResponse.json({ success: true, plan: data })
  } catch (error) {
    console.error('Error in PUT /api/admin/subscription-plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/subscription-plans
 * Soft-delete (deactivate) a plan. Cannot delete plans with active subscribers.
 */
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')

    if (!planId) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 })
    }

    // Check for active subscribers
    const { count } = await supabase
      .from('account_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .in('status', ['active', 'trialing'])

    if (count && count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete plan with ${count} active subscriber(s). Move them to another plan first.`,
        active_subscribers: count
      }, { status: 409 })
    }

    // Soft delete
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false, is_public: false, updated_at: new Date().toISOString() })
      .eq('id', planId)

    if (error) {
      console.error('Error deleting plan:', error)
      return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Plan deactivated' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/subscription-plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
