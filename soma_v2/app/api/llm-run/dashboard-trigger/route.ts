import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes — run + extraction + aggregation + insights
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { LLMRunOrchestrator } from '@/lib/services/llm-run-orchestrator'
import { getRunConfig } from '@/lib/services/config-service'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { hasActiveSubscription } from '@/lib/services/run-runner'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit run triggers
    const limited = applyRateLimit(request, 'run:dashboard', RATE_LIMITS.run, currentUser.clerkUserId)
    if (limited) return limited

    const supabase = createServiceClient()
    
    // Safely parse request body with error handling
    let body: { brandId?: string; selectedPrompts?: string[]; options?: Record<string, unknown> }
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'Request body is empty' }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    const { brandId, selectedPrompts, options: requestOptions } = body

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Verify user has access to this brand
    const { data: accountUsers, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)

    if (accountError || !accountUsers || accountUsers.length === 0) {
      return NextResponse.json({ error: 'User account not found' }, { status: 403 })
    }

    // Check if brand belongs to user's account
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id, target_markets, products_services, brand_category')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const userAccountIds = accountUsers.map(au => au.account_id)
    if (!userAccountIds.includes(brand.account_id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify active subscription before consuming API credits
    const isActive = await hasActiveSubscription(brand.account_id)
    if (!isActive) {
      return NextResponse.json({ 
        error: 'Subscription required',
        message: 'An active subscription is required to run analysis. Please upgrade your plan.'
      }, { status: 402 })
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', currentUser.clerkUserId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get selected user prompts for this brand (using is_selected from prompts page)
    let { data: userPrompts, error: promptsError } = await supabase
      .from('user_prompts')
      .select(`
        id,
        prompt_text,
        intent_category,
        priority,
        locale,
        country:countries!user_prompts_locale_fkey(code, name)
      `)
      .eq('brand_id', brandId)
      .eq('is_selected', true) // Only use prompts selected on the prompts page
      .limit(20)

    if (promptsError) {
      console.error('Error fetching user prompts:', promptsError)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    if (!userPrompts || userPrompts.length === 0) {
      return NextResponse.json({ 
        error: 'No selected prompts found for this brand',
        message: 'Please select some prompts on the Prompts page before running a run'
      }, { status: 400 })
    }

    // selectedPrompts parameter is kept for potential future use but not required
    // since selection is managed on the prompts page
    if (selectedPrompts && Array.isArray(selectedPrompts) && selectedPrompts.length > 0) {
      userPrompts = userPrompts.filter(prompt => selectedPrompts.includes(prompt.id))
      
      if (userPrompts.length === 0) {
        return NextResponse.json({ 
          error: 'None of the selected prompts were found',
          message: 'Please select valid prompts for run'
        }, { status: 400 })
      }
    }

    // Format prompts for run with country context
    const formattedPrompts = userPrompts.map(prompt => ({
      id: prompt.id,
      text: prompt.prompt_text,
      intent_category: prompt.intent_category || 'general',
      priority: prompt.priority || 5,
      locale: prompt.country?.code,
      country_name: prompt.country?.name
    }))

    // Don't hardcode models - let the orchestrator use brand's selected_models from database
    // The orchestrator will fetch brand.selected_models and map them to OpenRouter IDs

    // Get run config from database for consistent settings
    const runConfig = await getRunConfig()

    // Run options from database config, merge with request options
    const options = {
      use_cache: false, // Always get fresh results for dashboard
      force_rerun: requestOptions?.force_rerun !== false, // Default to true unless explicitly false
      concurrency_limit: runConfig.concurrency_limit,
      timeout_ms: runConfig.timeout_ms,
      temperature: runConfig.temperature,
      max_tokens: runConfig.max_tokens,
      include_longitudinal_analysis: requestOptions?.include_longitudinal_analysis || false,
      ...requestOptions
    }

    // Create run orchestrator
    const orchestrator = new LLMRunOrchestrator({
      supabase
    })
    
    console.log(`🚀 Starting dashboard run for brand ${brand.name}`)
    console.log(`📋 Running ${formattedPrompts.length} prompts (models will be loaded from brand's selected_models)`)

    // Start run - models will be fetched from brand.selected_models by orchestrator
    const run = await orchestrator.runRun({
      prompts: formattedPrompts,
      accountId: brand.account_id,
      brandId: brandId,
      // Don't pass models - orchestrator will use brand's selected_models
      profileId: profile.id,
      userId: currentUser.clerkUserId, // Required for RLS policies
      options
    })

    // Schedule a broadcast via after() as a safety net.
    // The pipeline already ran and broadcast, but this ensures the dashboard
    // refreshes even if the pipeline's broadcast was somehow lost.
    after(async () => {
      await LLMRunOrchestrator.broadcastPipelineComplete(
        createServiceClient(),
        brandId,
        { source: 'dashboard-trigger-after', run_id: run.runId }
      )
    })

    // Return run result
    return NextResponse.json({
      success: true,
      run_id: run.runId,
      message: `Started run with ${formattedPrompts.length} prompts across ${run.totalJobs / formattedPrompts.length || 0} models`,
      prompts_count: formattedPrompts.length,
      total_jobs: run.totalJobs,
      completed_jobs: run.completedJobs,
      status: run.status
    })

  } catch (error) {
    console.error('Dashboard run error:', error)
    return NextResponse.json({
      error: 'Run failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}