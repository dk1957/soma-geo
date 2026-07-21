import { createServiceClient } from '@/lib/supabase/server'
import { LLMRunOrchestrator } from '@/lib/services/llm-run-orchestrator'
import { getAvailableLLMModels, getDefaultModelsForPlan, getPlanModelLimit } from '@/lib/services/config-service'

/**
 * Check if an account has an active (or trialing) subscription.
 * Returns true if the account can run analysis.
 */
export async function hasActiveSubscription(accountId: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('account_subscriptions')
    .select('id, status')
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing'])
    .limit(1)
    .maybeSingle()

  return !!data
}

export async function runForBrand(brandId: string, options: any = {}) {
  const supabase = createServiceClient()

  // Get brand details
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name, account_id, target_markets, products_services, brand_category')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    throw new Error(`Brand not found: ${brandError?.message}`)
  }

  // Check subscription status unless explicitly skipped (e.g., admin override)
  if (!options.skipSubscriptionCheck) {
    const isActive = await hasActiveSubscription(brand.account_id)
    if (!isActive) {
      throw new Error(`Account ${brand.account_id} does not have an active subscription. Run skipped.`)
    }
  }

  // Get a valid profile ID for the account (usually the owner)
  const { data: accountUsers, error: accountError } = await supabase
    .from('account_users')
    .select('user_id, clerk_id, role')
    .eq('account_id', brand.account_id)
    .order('role', { ascending: true })
    .limit(1)

  console.log('🔍 Account users found:', accountUsers)

  let profileId = null
  let targetClerkId = null
  let targetUserId = null

  if (accountUsers && accountUsers.length > 0) {
    targetClerkId = accountUsers[0].clerk_id
    targetUserId = accountUsers[0].user_id
    
    console.log('🔍 Looking for profile with:', { clerk_id: targetClerkId, user_id: targetUserId })
    
    // Try to find profile by clerk_id first
    let profile = null
    if (targetClerkId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, clerk_id, user_id')
        .eq('clerk_id', targetClerkId)
        .maybeSingle()
      
      console.log('🔍 Profile lookup by clerk_id:', { data, error })
      profile = data
    }
    
    // If no profile found by clerk_id, try by user_id (UUID)
    if (!profile && targetUserId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, clerk_id, user_id')
        .eq('user_id', targetUserId)
        .maybeSingle()
      
      console.log('🔍 Profile lookup by user_id:', { data, error })
      profile = data
    }
    
    // If still no profile, create one using service role (bypasses RLS)
    if (!profile) {
      console.log('⚠️ No profile found, creating one...')
      
      // Get account owner's email if available
      const { data: account } = await supabase
        .from('accounts')
        .select('owner_id')
        .eq('id', brand.account_id)
        .single()
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          clerk_id: targetClerkId || null,
          user_id: targetUserId || null,
          email: `run-${brand.account_id}@withsoma.ai`,
          full_name: `Run User - ${brand.name}`,
          onboarding_status: 'completed',
          onboarding_completed_at: new Date().toISOString(),
          timezone: 'UTC',
          language_preference: 'en'
        })
        .select('id, clerk_id, user_id')
        .single()
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        throw new Error(`Failed to create profile: ${createError.message}`)
      } else {
        profile = newProfile
        console.log('✅ Profile created successfully:', profile)
      }
    }
    
    if (profile) {
      profileId = profile.id
      // Use the profile's IDs as authoritative
      if (!targetClerkId) targetClerkId = profile.clerk_id
      if (!targetUserId) targetUserId = profile.user_id
    }
  }

  if (!profileId) {
    throw new Error('No valid profile/user found for run execution. Please ensure the account has a valid user.')
  }

  console.log('✅ Using profile:', { profileId, clerk_id: targetClerkId, user_id: targetUserId })

  // Get selected user prompts for this brand
  const { data: userPrompts, error: promptsError } = await supabase
    .from('user_prompts')
    .select(`
      id,
      prompt_text,
      intent_category,
      priority,
      geo_region,
      geo_sub_region,
      country:countries(code, name)
    `)
    .eq('brand_id', brandId)
    .eq('is_selected', true)
    .limit(20)

  if (promptsError) {
    throw new Error(`Failed to fetch prompts: ${promptsError.message}`)
  }

  if (!userPrompts || userPrompts.length === 0) {
    throw new Error('No selected prompts found for this brand')
  }

  // Format prompts for run
  const formattedPrompts = userPrompts.map((prompt: any) => ({
    id: prompt.id,
    text: prompt.prompt_text,
    intent_category: prompt.intent_category || 'general',
    priority: prompt.priority || 5,
    locale: prompt.country?.code,
    country_name: prompt.country?.name || prompt.geo_sub_region || prompt.geo_region,
    geo_region: prompt.geo_region,
    geo_sub_region: prompt.geo_sub_region
  }))

  // Get models from database configuration
  // First check if brand has selected models, otherwise use defaults from plan
  const { data: brandData } = await supabase
    .from('brands')
    .select('selected_models')
    .eq('id', brandId)
    .single()

  let models: string[]
  if (brandData?.selected_models && brandData.selected_models.length > 0) {
    // Use brand's selected models - map to OpenRouter IDs
    const availableModels = await getAvailableLLMModels()
    models = brandData.selected_models
      .map((id: string) => availableModels.find(m => m.id === id)?.openRouterId)
      .filter(Boolean)
  } else {
    // Use default models for growth plan from database
    const defaultModelIds = await getDefaultModelsForPlan('growth')
    const availableModels = await getAvailableLLMModels()
    models = defaultModelIds
      .map(id => availableModels.find(m => m.id === id)?.openRouterId)
      .filter(Boolean)
  }

  // Fallback to first 3 available models if nothing configured
  if (!models || models.length === 0) {
    const availableModels = await getAvailableLLMModels()
    models = availableModels.slice(0, 3).map(m => m.openRouterId)
    console.log('⚠️ No models configured, using fallback defaults:', models)
  }

  console.log(`📋 Using models for run:`, models)

  const runOptions = {
    use_cache: false,
    force_rerun: true,
    concurrency_limit: 6,
    timeout_ms: 120000,
    temperature: 0.2,
    max_tokens: 2000,
    include_longitudinal_analysis: true,
    ...options
  }

  // Create run orchestrator
  const orchestrator = new LLMRunOrchestrator({
    supabase: supabase
  })
  
  console.log(`🚀 Starting run for brand ${brand.name} (ID: ${brandId})`)
  console.log(`📋 Brand selected models:`, brandData?.selected_models || 'none (using defaults)')

  // Start run
  const run = await orchestrator.runRun({
    prompts: formattedPrompts,
    accountId: brand.account_id,
    brandId: brandId,
    models,
    profileId: profileId,
    userId: targetUserId || targetClerkId, // Use UUID user_id if available, fallback to clerk_id
    options: runOptions
  })

  return {
    success: true,
    run_id: run.runId,
    message: `Started run with ${formattedPrompts.length} prompts`,
    prompts_count: formattedPrompts.length
  }
}
