import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes — run + extraction + aggregation + insights
import { z } from 'zod'
import { LLMRunOrchestrator } from '@/lib/services/llm-run-orchestrator'
import { Redis } from '@upstash/redis'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Initialize Redis client
const redis = Redis.fromEnv()

// Input validation schema
const llmRunSchema = z.object({
  prompts: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, 'Prompt text cannot be empty'),
    intent_category: z.string().optional(),
    priority: z.number().min(1).max(10).default(5)
  })).min(1, 'At least one prompt is required').max(50, 'Maximum 50 prompts allowed'),
  
  // REMOVED: brand_data - not used in unbiased run
  
  models: z.array(z.enum([
    'openai/gpt-4o-mini:online',
    'meta-llama/llama-4-8b-instruct:online',
    'google/gemini-2.5-flash:online',
    'x-ai/grok-3-mini:online'
  ])).default([
    'openai/gpt-4o-mini:online',
    'meta-llama/llama-4-8b-instruct:online',
    'google/gemini-2.5-flash:online',
    'x-ai/grok-3-mini:online'
  ]),
  
  options: z.object({
    use_cache: z.boolean().default(true),
    concurrency_limit: z.number().min(1).max(20).default(8),
    timeout_ms: z.number().min(10000).max(300000).default(120000),
    temperature: z.number().min(0).max(2).default(0.2),
    max_tokens: z.number().min(100).max(4000).default(2000)
  }).default({})
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit run triggers
    const limited = applyRateLimit(request, 'run:llm', RATE_LIMITS.run, user.clerkUserId)
    if (limited) return limited

    // Get user's profile ID (required for foreign key relationships)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Failed to fetch user profile:', profileError)
      return NextResponse.json({ 
        error: 'User profile not found',
        details: 'User profile must exist to run runs'
      }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = llmRunSchema.parse(body)

    // Get user's account information via clerk_id
    const { data: accountUsers, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        accounts (
          id,
          name,
          slug
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)

    if (accountError || !accountUsers || accountUsers.length === 0) {
      console.error('❌ Failed to fetch user account:', accountError)
      return NextResponse.json({ 
        error: 'User account not found',
        details: 'User must be associated with an active account to run runs'
      }, { status: 403 })
    }

    // Use the first active account if multiple accounts exist
    const accountUser = accountUsers[0]

    // Get a default brand for this account (or create a generic one)
    let { data: defaultBrand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, brand_website, brand_category, brand_categories, target_markets, products_services')
      .eq('account_id', accountUser.account_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    // If no brand exists, create a generic run brand
    if (brandError || !defaultBrand) {
      const { data: newBrand, error: createBrandError } = await supabase
        .from('brands')
        .insert({
          account_id: accountUser.account_id,
          name: 'Generic Run Brand',
          slug: 'generic-run',
          description: 'Auto-created brand for LLM runs',
          brand_type: 'run',
          is_active: true
        })
        .select('id, name, brand_website, brand_category, brand_categories, target_markets, products_services')
        .single()

      if (createBrandError) {
        console.error('❌ Failed to create run brand:', createBrandError)
        return NextResponse.json({ 
          error: 'Failed to initialize run brand',
          details: createBrandError.message 
        }, { status: 500 })
      }
      defaultBrand = newBrand
    }

    // Create a minimal brand context for database constraints only
    // IMPORTANT: This data is NOT passed to the LLM for unbiased run
    const { data: brandContextData, error: brandContextError } = await supabase
      .from('brand_contexts')
      .upsert({
        clerk_id: user.clerkUserId, // Use clerk ID instead of user_id
        account_id: accountUser.account_id,
        brand_id: defaultBrand.id,
        brand_name: 'Unbiased Run', // Generic name - not used in responses
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
        error: 'Failed to initialize run',
        details: brandContextError.message 
      }, { status: 500 })
    }

    // Initialize orchestrator with service client for database operations
    const orchestrator = new LLMRunOrchestrator({
      redis,
      supabase, // Use service client for database operations
      concurrencyLimit: validatedData.options.concurrency_limit,
      timeoutMs: validatedData.options.timeout_ms
    })

    // UNBIASED RUN: No brand context or competitor data extracted
    // This ensures completely neutral LLM responses for objective GEO analysis
    
    // Start run with NULL brand context to prevent bias
    const runResult = await orchestrator.runRun({
      prompts: validatedData.prompts,
      brandContext: null, // CRITICAL: Always null to ensure unbiased responses
      brandContextId: brandContextData.id,
      accountId: accountUser.account_id,
      brandId: defaultBrand.id,
      models: validatedData.models,
      options: validatedData.options,
      profileId: profile.id,
      userId: profile.id // Use profile ID for RLS policies
    })

    return NextResponse.json({
      success: true,
      run: {
        id: runResult.runId,
        status: runResult.status,
        total_jobs: runResult.totalJobs,
        completed_jobs: runResult.completedJobs,
        failed_jobs: runResult.failedJobs,
        estimated_completion_time: 60000
      },
      message: 'Unbiased LLM run started successfully - no brand context influence'
    })

  } catch (error) {
    console.error('❌ LLM Run API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process LLM run request'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve run results
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runId = searchParams.get('run_id')
    const brandContextId = searchParams.get('brand_context_id')
    const brandId = searchParams.get('brand_id')
    const accountId = searchParams.get('account_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's account information using clerk_id
    const { data: accountUsers, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)

    if (accountError || !accountUsers || accountUsers.length === 0) {
      return NextResponse.json({ 
        error: 'User account not found',
        details: 'User must be associated with an active account'
      }, { status: 403 })
    }

    // Use the first active account if multiple accounts exist
    const accountUser = accountUsers[0]

    let runTextId = null
    
    // If runId is provided, use it directly to query responses
    if (runId) {
      // Verify the run exists and user has access
      const { data: simRecord, error: simError } = await supabase
        .from('runs')
        .select('id, account_id')
        .eq('id', runId)
        .single()
      
      if (simError || !simRecord) {
        return NextResponse.json({ 
          error: 'Run not found',
          details: `No run found with ID: ${runId}`
        }, { status: 404 })
      }
      
      // Check if user has access to this run through their account
      if (simRecord.account_id !== accountUser.account_id) {
        return NextResponse.json({ 
          error: 'Access denied',
          details: 'You do not have access to this run'
        }, { status: 403 })
      }
      
      runTextId = simRecord.id
    }

    let query = supabase
      .from('llm_response_files')
      .select(`
        *
      `)
      .eq('account_id', accountUser.account_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (runTextId) {
      query = query.eq('run_id', runTextId)
    }

    if (brandContextId) {
      query = query.eq('brand_context_id', brandContextId)
    }

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data: responses, error: queryError } = await query

    if (queryError) {
      console.error('❌ Failed to retrieve run results:', queryError)
      return NextResponse.json({ 
        error: 'Failed to retrieve results' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      responses,
      total_count: responses.length,
      has_more: responses.length === limit
    })

  } catch (error) {
    console.error('❌ LLM Run GET Error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}