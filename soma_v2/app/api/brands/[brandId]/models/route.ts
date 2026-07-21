import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAvailableLLMModels, getLLMModelsByTier } from '@/lib/services/config-service'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export const dynamic = 'force-dynamic'

// Map plan slugs to tiers
const PLAN_TIER_MAP: Record<string, 'growth' | 'pro' | 'enterprise'> = {
  'free': 'growth',
  'growth': 'growth',
  'pro': 'pro',
  'enterprise': 'enterprise'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { brandId } = resolvedParams

    // Verify access to brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, selected_models')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Verify user has access to account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get subscription details including plan limits
    const { data: subscription } = await supabase
      .from('account_subscriptions')
      .select(`
        plan:subscription_plans(
          plan_slug,
          plan_tier,
          max_model_platforms
        )
      `)
      .eq('account_id', brand.account_id)
      .in('status', ['active', 'trialing'])
      .single()

    const planData = subscription?.plan as any
    const plan = Array.isArray(planData) ? planData[0] : planData
    const planSlug = plan?.plan_slug || 'growth'
    const planTier = PLAN_TIER_MAP[planSlug] || 'growth'
    const maxModels = plan?.max_model_platforms || 3

    // Get all active models and filter by tier
    const allModels = await getAvailableLLMModels()
    const tierModels = await getLLMModelsByTier(planTier)
    
    // Map models to include availability info
    const modelsWithAvailability = allModels.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      tier: model.tier,
      description: model.description,
      is_available: tierModels.some(tm => tm.id === model.id)
    }))

    return NextResponse.json({
      selected_models: brand.selected_models || [],
      available_models: modelsWithAvailability,
      limit: maxModels,
      plan: planSlug,
      plan_tier: planTier
    })

  } catch (error) {
    console.error('Error fetching brand models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { brandId } = resolvedParams
    const body = await request.json()
    const { models } = body

    if (!Array.isArray(models)) {
      return NextResponse.json({ error: 'Invalid models format' }, { status: 400 })
    }

    // Verify access to brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Verify user has access to account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get subscription details including plan limits
    const { data: subscription } = await supabase
      .from('account_subscriptions')
      .select(`
        plan:subscription_plans(
          plan_slug,
          plan_tier,
          max_model_platforms
        )
      `)
      .eq('account_id', brand.account_id)
      .in('status', ['active', 'trialing'])
      .single()

    const planData = subscription?.plan as any
    const plan = Array.isArray(planData) ? planData[0] : planData
    const planSlug = plan?.plan_slug || 'growth'
    const planTier = PLAN_TIER_MAP[planSlug] || 'growth'
    const maxModels = plan?.max_model_platforms || 3

    // Validate model count against plan limit
    if (models.length > maxModels) {
      return NextResponse.json({ 
        error: `Plan limit exceeded. Your ${planSlug} plan allows up to ${maxModels} models.`,
        limit: maxModels 
      }, { status: 400 })
    }

    // Get models available for this tier
    const tierModels = await getLLMModelsByTier(planTier)
    const validModelIds = new Set(tierModels.map(m => m.id))
    
    // Validate all selected models are available for this tier
    const invalidModels = models.filter(id => !validModelIds.has(id))
    
    if (invalidModels.length > 0) {
      const allModels = await getAvailableLLMModels()
      const invalidModelNames = invalidModels.map(id => {
        const model = allModels.find(m => m.id === id)
        return model ? `${model.name} (requires ${model.tier} plan)` : id
      })
      
      return NextResponse.json({ 
        error: `Some models are not available on your ${planSlug} plan: ${invalidModelNames.join(', ')}`,
        invalid_models: invalidModels
      }, { status: 400 })
    }

    // Update brand
    const { error: updateError } = await supabase
      .from('brands')
      .update({ selected_models: models })
      .eq('id', brandId)

    if (updateError) {
      console.error('Error updating brand models:', updateError)
      return NextResponse.json({ error: 'Failed to update models' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating brand models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
