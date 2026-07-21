import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { hasActiveSubscription } from '@/lib/services/run-runner'

export const maxDuration = 300 // 5 minutes — run + extraction + aggregation + insights

/**
 * Background Run API
 * =========================
 * 
 * This endpoint starts a run and handles completion in the background.
 * When the run completes, it creates a notification for the user.
 * 
 * The client can immediately redirect to the dashboard after calling this endpoint.
 */

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit run triggers
    const limited = applyRateLimit(request, 'run:background', RATE_LIMITS.run, currentUser.clerkUserId)
    if (limited) return limited

    const supabase = createServiceClient()
    const body = await request.json()
    const {
      prompts,
      brandName,
      brandId,
      accountId,
      brandData,
      formData,
      isOnboarding = false // Flag to indicate if this is an onboarding run
    } = body

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Prompts are required' }, { status: 400 })
    }

    if (!brandId || !accountId) {
      return NextResponse.json({ error: 'Brand ID and Account ID are required' }, { status: 400 })
    }

    // Verify active subscription (skip for onboarding first run — they get a trial)
    if (!isOnboarding) {
      const isActive = await hasActiveSubscription(accountId)
      if (!isActive) {
        return NextResponse.json({ 
          error: 'Subscription required',
          message: 'An active subscription is required to run analysis.'
        }, { status: 402 })
      }
    }

    console.log('🚀 Starting background run:', {
      clerkUserId: currentUser.clerkUserId,
      brandId,
      accountId,
      promptsCount: prompts.length
    })

    const serviceSupabase = createServiceClient()

    // Get cookies to forward to internal API calls
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')

    // Record prompts job (optional - don't fail if it doesn't work)
    let promptsJobId = null
    try {
      const promptsResponse = await fetch(new URL('/api/llm-run/jobs/prompts', request.url).toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookieHeader
        },
        body: JSON.stringify({
          brandName,
          source: 'ai_testing',
          accountId,
          brandId,
          prompts: prompts.map((p: any) => ({
            text: p.prompt || p.text,
            intent: p.intent,
            rationale: p.rationale
          })),
          metadata: {
            trigger_action: 'background_run_started',
            prompts_count: prompts.length,
            brand_context: {
              name: brandName,
              website: formData?.brandWebsite,
              categories: formData?.brandCategories,
              target_markets: formData?.targetMarkets
            }
          }
        })
      })
      
      if (promptsResponse.ok) {
        const promptsData = await promptsResponse.json()
        promptsJobId = promptsData.job_id
        console.log('✅ Recorded prompts job:', promptsJobId)
      } else {
        console.warn('⚠️ Prompts job creation returned:', promptsResponse.status)
      }
    } catch (error) {
      console.warn('⚠️ Failed to record prompts job (non-critical):', error)
    }

    // Create run job record (optional - don't fail if it doesn't work)
    let runJobId = null
    try {
      const jobResponse = await fetch(new URL('/api/llm-run/jobs/run', request.url).toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookieHeader
        },
        body: JSON.stringify({
          action: 'create',
          brandName,
          accountId,
          brandId,
          prompts,
        })
      })
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        runJobId = jobData.job_id
        console.log('✅ Created run job:', runJobId)
      } else {
        console.warn('⚠️ Run job creation returned:', jobResponse.status)
      }
    } catch (error) {
      console.warn('⚠️ Failed to create run job (non-critical):', error)
    }

    // Get brand's target markets for geo context
    let geoContext: { locale?: string; country_name?: string; geo_region?: string; geo_sub_region?: string } = {}
    
    try {
      const { data: brand } = await supabase
        .from('brands')
        .select('target_markets')
        .eq('id', brandId)
        .single()
      
      if (brand?.target_markets && brand.target_markets.length > 0) {
        const markets = brand.target_markets
        
        if (markets.length === 1) {
          // Single market - look up country details
          const marketCode = markets[0].toLowerCase()
          const { data: country } = await supabase
            .from('countries')
            .select('id, code, name, region, sub_region')
            .ilike('code', marketCode)
            .single()
          
          if (country) {
            geoContext = {
              locale: country.code,
              country_name: country.name,
              geo_region: country.region,
              geo_sub_region: country.sub_region
            }
            console.log(`🌍 Geo context from single market: ${country.name} (${country.code})`)
          }
        } else {
          // Multiple markets - try to find common region/sub-region
          const { data: countries } = await supabase
            .from('countries')
            .select('id, code, name, region, sub_region')
            .in('code', markets.map((m: string) => m.toLowerCase()))
          
          if (countries && countries.length > 0) {
            const regions = [...new Set(countries.map(c => c.region))]
            const subRegions = [...new Set(countries.map(c => c.sub_region).filter(Boolean))]
            
            if (subRegions.length === 1) {
              // All countries in same sub-region
              geoContext = {
                geo_sub_region: subRegions[0],
                geo_region: regions[0]
              }
              console.log(`🌍 Geo context from sub-region: ${subRegions[0]}`)
            } else if (regions.length === 1) {
              // All countries in same region
              geoContext = {
                geo_region: regions[0]
              }
              console.log(`🌍 Geo context from region: ${regions[0]}`)
            } else {
              console.log(`🌍 Multiple regions detected, using global context`)
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to resolve geo context (non-critical):', error)
    }

    // Prepare prompts for run - must match the LLM run schema
    // Schema expects: { id, text, intent_category?, priority?, locale?, country_name?, geo_region?, geo_sub_region? }
    const runPrompts = prompts.map((p: any, index: number) => ({
      id: p.id || `prompt-${index + 1}`,
      text: p.prompt || p.text,
      intent_category: p.intent || 'general',
      priority: 5,
      // Apply geo context from brand's target markets
      ...geoContext
    }))

    // Get user's profile ID (required for run)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', currentUser.clerkUserId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Failed to fetch user profile:', profileError)
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 403 })
    }

    // Get or create brand context
    const { data: brandContextData, error: brandContextError } = await supabase
      .from('brand_contexts')
      .upsert({
        clerk_id: currentUser.clerkUserId,
        account_id: accountId,
        brand_id: brandId,
        brand_name: 'Unbiased Run',
        brand_data: { 
          type: 'unbiased_run',
          note: 'Brand context excluded from LLM responses to prevent bias'
        }
      }, {
        onConflict: 'clerk_id,brand_name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (brandContextError) {
      console.error('❌ Brand context creation failed:', brandContextError)
      return NextResponse.json({ 
        error: 'Failed to initialize run' 
      }, { status: 500 })
    }

    // Initialize Redis and orchestrator directly
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()
    const { LLMRunOrchestrator } = await import('@/lib/services/llm-run-orchestrator')
    
    const orchestrator = new LLMRunOrchestrator({
      redis,
      supabase,
      concurrencyLimit: 8,
      timeoutMs: 120000
    })

    // Start run directly (no HTTP call needed)
    console.log('🚀 Starting LLM run directly...')
    const runResult = await orchestrator.runRun({
      prompts: runPrompts,
      brandContext: null, // Unbiased run
      brandContextId: brandContextData.id,
      accountId,
      brandId,
      options: {
        use_cache: true,
        temperature: 0.2,
        max_tokens: 2000
      },
      profileId: profile.id,
      userId: profile.id
    })

    const runId = runResult.runId

    console.log('✅ Run started:', runId)

    // Store a pending notification to track run status
    // This will be updated when run completes
    await serviceSupabase
      .from('user_notifications')
      .insert({
        clerk_id: currentUser.clerkUserId,
        account_id: accountId,
        brand_id: brandId,
        type: 'job',
        title: 'AI Run Started',
        message: `Running ${prompts.length} prompts across 4 AI models...`,
        is_read: false,
        is_dismissed: false,
        action_url: `/dashboard?brand=${brandId}`,
        metadata: {
          run_id: runId,
          job_id: runJobId,
          status: 'running',
          prompts_count: prompts.length,
          models_count: 4,
          started_at: new Date().toISOString()
        }
      })

    // Start background polling for completion (fire and forget)
    // This uses Edge Runtime's waitUntil-like behavior
    pollRunCompletion({
      runId,
      clerkUserId: currentUser.clerkUserId,
      accountId,
      brandId,
      brandName,
      runJobId,
      formData,
      baseUrl: new URL(request.url).origin,
      cookieHeader,
      isOnboarding
    }).catch(error => {
      console.error('❌ Background polling failed:', error)
    })

    return NextResponse.json({
      success: true,
      run_id: runId,
      job_id: runJobId,
      prompts_job_id: promptsJobId,
      message: 'Run started in background. You will be notified when complete.'
    })

  } catch (error) {
    console.error('❌ Background run error:', error)
    return NextResponse.json({
      error: 'Failed to start background run',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Poll for run completion and create notification
 */
async function pollRunCompletion(params: {
  runId: string
  clerkUserId: string
  accountId: string
  brandId: string
  brandName: string
  runJobId: string | null
  formData: any
  baseUrl: string
  cookieHeader: string
  isOnboarding: boolean
}) {
  const {
    runId,
    clerkUserId,
    accountId,
    brandId,
    brandName,
    runJobId,
    formData,
    baseUrl,
    cookieHeader,
    isOnboarding
  } = params

  const serviceSupabase = createServiceClient()
  const maxAttempts = 30 // 30 attempts * 3 seconds = 90 seconds max
  const pollInterval = 3000 // 3 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Query run status directly from DB (avoids stale cookie issues with HTTP polling)
      const { data: run, error: runError } = await serviceSupabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (runError || !run) {
        console.warn(`⚠️ Status check failed on attempt ${attempt + 1}: ${runError?.message || 'Run not found'}`)
        await sleep(pollInterval)
        continue
      }

      const completedJobs = run.completed_jobs || 0
      const failedJobs = run.failed_jobs || 0
      const totalJobs = run.total_jobs || 0
      const progressPercentage = totalJobs > 0 ? Math.round((completedJobs + failedJobs) / totalJobs * 100) : 0
      const isComplete = run.status === 'completed' || run.status === 'failed'

      const progress = {
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        total_jobs: totalJobs,
        progress_percentage: progressPercentage,
        is_complete: isComplete
      }

      console.log(`📊 Run progress (attempt ${attempt + 1}):`, {
        completed: progress.completed_jobs,
        total: progress.total_jobs,
        percentage: progress.progress_percentage,
        isComplete: progress.is_complete
      })

      if (progress?.is_complete) {
        console.log('✅ Run completed!')

        // Store run data
        try {
          await fetch(`${baseUrl}/api/llm-run/store-simple`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            body: JSON.stringify({
              externalRunId: runId,
              clerkUserId,
              accountId,
              brandId,
              brandData: {
                brandName,
                brandWebsite: formData?.brandWebsite,
                brandCategory: formData?.brandCategories?.[0] || 'other',
                targetMarkets: formData?.targetMarkets,
                brandTopics: formData?.brandKeywords || [],
                productsServices: (formData?.brandKeywords || []).join(', ') || formData?.productsServices
              },
              progress
            })
          })
          console.log('✅ Run data stored')
        } catch (storeError) {
          console.error('❌ Failed to store run data:', storeError)
        }

        // Store responses in jobs system
        if (runJobId) {
          try {
            await fetch(`${baseUrl}/api/llm-run/jobs/run`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
              },
              body: JSON.stringify({
                action: 'store_responses',
                job_id: runJobId,
                brandId,
                brandName,
                competitors: formData?.knownCompetitors || [],
                runId,
                accountId
              })
            })
            console.log('✅ Responses stored in Jobs system')
          } catch (storeError) {
            console.error('❌ Failed to store responses:', storeError)
          }
        }

        // Generate visibility audit report ONLY during onboarding
        // Update notification to show completion
        const notificationTitle = isOnboarding
          ? 'AI Run Complete'
          : 'AI Run Complete'
        
        const notificationMessage = isOnboarding
          ? `Your brand visibility analysis for ${brandName} is complete! View your results in the dashboard.`
          : `Your AI run for ${brandName} is complete! View your results in the dashboard.`
        
        const actionUrl = `/dashboard?brand=${brandId}`

        const { error: updateError } = await serviceSupabase
          .from('user_notifications')
          .update({
            title: notificationTitle,
            message: notificationMessage,
            action_url: actionUrl,
            metadata: {
              run_id: runId,
              job_id: runJobId,
              is_onboarding: isOnboarding,
              status: 'completed',
              completed_at: new Date().toISOString(),
              results: {
                completed_jobs: progress.completed_jobs,
                total_jobs: progress.total_jobs,
                success_rate: Math.round((progress.completed_jobs / progress.total_jobs) * 100)
              }
            }
          })
          .eq('clerk_id', clerkUserId)
          .eq('brand_id', brandId)
          .eq('type', 'job')
          .like('metadata->>run_id', runId)

        if (updateError) {
          // If update fails, insert a new notification
          await serviceSupabase
            .from('user_notifications')
            .insert({
              clerk_id: clerkUserId,
              account_id: accountId,
              brand_id: brandId,
              type: isOnboarding ? 'report' : 'job',
              title: notificationTitle,
              message: notificationMessage,
              is_read: false,
              is_dismissed: false,
              action_url: actionUrl,
              metadata: {
                run_id: runId,
                job_id: runJobId,
                is_onboarding: isOnboarding,
                status: 'completed',
                completed_at: new Date().toISOString()
              }
            })
        }

        console.log('✅ Completion notification created with report link:', actionUrl)
        return
      }

      await sleep(pollInterval)
    } catch (error) {
      console.error(`❌ Polling error on attempt ${attempt + 1}:`, error)
      await sleep(pollInterval)
    }
  }

  // Timeout - create a timeout notification
  console.warn('⚠️ Run polling timed out')
  await serviceSupabase
    .from('user_notifications')
    .update({
      title: 'AI Run Taking Longer',
      message: `Your run for ${brandName} is still processing. Check the dashboard for updates.`,
      metadata: {
        run_id: runId,
        status: 'timeout',
        timed_out_at: new Date().toISOString()
      }
    })
    .eq('clerk_id', clerkUserId)
    .eq('brand_id', brandId)
    .eq('type', 'job')
    .like('metadata->>run_id', runId)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
