import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { LLMResponseStorage } from '@/lib/services/llm-response-storage'

// Max responses per request to prevent abuse
const MAX_RESPONSES_PER_REQUEST = 200

// Validation schema for run data storage
const storeRunSchema = z.object({
  externalRunId: z.string().max(255),
  userId: z.string().max(255),
  accountId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  brandData: z.object({
    brandName: z.string().max(500),
    brandWebsite: z.string().max(500).optional(),
    brandCategory: z.string().max(255).optional(),
    targetMarkets: z.array(z.string().max(100)).max(50).optional(),
    productsServices: z.string().max(5000).optional()
  }),
  prompts: z.array(z.any()).max(100).optional(),
  responses: z.array(z.any()).max(MAX_RESPONSES_PER_REQUEST).optional(),
  progress: z.object({
    total_jobs: z.number(),
    completed_jobs: z.number(),
    failed_jobs: z.number(),
    running_jobs: z.number(),
    progress_percentage: z.number(),
    is_complete: z.boolean(),
    cached_responses: z.number().optional(),
    actual_completion_time: z.number().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller
    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service client with elevated permissions for database operations
    const serviceClient = createServiceClient()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = storeRunSchema.parse(body)

    // Verify the caller owns the userId they're submitting for
    if (validatedData.userId !== user.clerkUserId) {
      return NextResponse.json({ error: 'Forbidden: userId mismatch' }, { status: 403 })
    }

    // If accountId is provided, verify the caller has access to that account
    if (validatedData.accountId) {
      const { data: userAccess, error: accessError } = await serviceClient
        .from('account_users')
        .select('account_id')
        .eq('account_id', validatedData.accountId)
        .eq('clerk_id', user.clerkUserId)
        .eq('is_active', true)
        .maybeSingle()

      if (accessError || !userAccess) {
        return NextResponse.json({ error: 'Forbidden: no access to this account' }, { status: 403 })
      }
    }

    // Store run data server-side

    // 1. Create or get brand context with service role permissions
    let brandContextId: string
    
    try {
      // Try to get existing brand context using clerk_id
      const { data: existingContext } = await serviceClient
        .from('brand_contexts')
        .select('id')
        .eq('clerk_id', validatedData.userId)
        .eq('brand_name', validatedData.brandData.brandName)
        .maybeSingle()
        
      if (existingContext) {
        brandContextId = existingContext.id
      } else {
        // Create new brand context with proper fields for RLS - use clerk_id instead of user_id
        const brandContextData: any = {
          clerk_id: validatedData.userId,
          brand_name: validatedData.brandData.brandName,
          context_text: validatedData.brandData.productsServices || 'Brand context',
          metadata: {
            brandWebsite: validatedData.brandData.brandWebsite,
            brandCategory: validatedData.brandData.brandCategory,
            targetMarkets: validatedData.brandData.targetMarkets,
            productsServices: validatedData.brandData.productsServices
          }
        }

        // Add account_id and brand_id if available (required for RLS)
        if (validatedData.accountId) {
          brandContextData.account_id = validatedData.accountId
        }
        if (validatedData.brandId) {
          brandContextData.brand_id = validatedData.brandId
        }

        const { data: newContext, error: contextError } = await serviceClient
          .from('brand_contexts')
          .insert([brandContextData])
          .select('id')
          .single()
          
        if (contextError || !newContext) {
          console.error('❌ Failed to create brand context:', contextError)
          throw new Error(`Failed to create brand context: ${contextError?.message}`)
        }
        
        brandContextId = newContext.id
      }
    } catch (error) {
      console.error('❌ Error with brand context:', error)
      return NextResponse.json({ 
        error: 'Failed to create brand context',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // 2. Ensure user has a profile and get the profile ID
    let profileId: string
    try {
      // First, try to find existing profile by clerk_id
      const { data: existingProfile, error: profileError } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('clerk_id', validatedData.userId)
        .single()
      
      if (existingProfile) {
        profileId = existingProfile.id
      } else {
        // If no profile exists, create one with clerk_id
        const { data: newProfile, error: insertError } = await serviceClient
          .from('profiles')
          .insert({
            clerk_id: validatedData.userId,
            email: user.email || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()
        
        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`)
        }
        profileId = newProfile.id
      }
    } catch (profileSetupError) {
      console.error('❌ Profile setup failed:', profileSetupError)
      return NextResponse.json({ 
        error: `Profile setup error: ${profileSetupError instanceof Error ? profileSetupError.message : 'Unknown error'}`,
        success: false
      }, { status: 500 })
    }

    // 3. Create run record
    let run: any
    try {
      const runData: any = {
        run_id: validatedData.externalRunId,
        profile_id: profileId, // Use profile_id instead of user_id
        brand_context_id: brandContextId,
        brand_name: validatedData.brandData.brandName,
        status: validatedData.progress?.is_complete ? 'completed' : 'running',
        total_jobs: validatedData.progress?.total_jobs || 0,
        completed_jobs: validatedData.progress?.completed_jobs || 0,
        failed_jobs: validatedData.progress?.failed_jobs || 0,
        running_jobs: validatedData.progress?.running_jobs || 0,
        progress_percentage: validatedData.progress?.progress_percentage || 0,
        cached_responses: validatedData.progress?.cached_responses || 0,
        actual_completion_time: validatedData.progress?.actual_completion_time,
        completed_at: validatedData.progress?.is_complete ? new Date().toISOString() : null
      }

      // Add account_id and brand_id if available (required for RLS)
      if (validatedData.accountId) {
        runData.account_id = validatedData.accountId
      }
      if (validatedData.brandId) {
        runData.brand_id = validatedData.brandId
      }

      const { data: newRun, error: runError } = await serviceClient
        .from('runs')
        .insert([runData])
        .select()
        .single()

      if (runError || !newRun) {
        console.error('❌ Failed to create run:', runError)
        throw new Error(`Failed to create run: ${runError?.message}`)
      }

      run = newRun
    } catch (error) {
      console.error('❌ Error creating run:', error)
      return NextResponse.json({ 
        error: 'Failed to create run',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // 3. Store responses if provided
    let storedResponses = []
    if (validatedData.responses && validatedData.responses.length > 0) {
      try {
        const responsesToInsert = validatedData.responses.map((response: any) => ({
          run_id: run.id,
          external_run_id: validatedData.externalRunId,
          user_id: validatedData.userId,
          account_id: validatedData.accountId || null,
          brand_id: validatedData.brandId || null,
          brand_context_id: brandContextId,
          model: response.model || response.model_name || 'unknown',
          model_name: response.model || response.model_name || 'unknown',
          prompt_text: response.prompt || response.question || response.query || '',
          query: response.prompt || response.question || response.query || '',
          raw_response: response.answer || response.raw_response || response.response || '',
          brand_mentioned: response.brand_mentioned || false,
          brand_mention_count: response.brand_mention_count || 0,
          competitor_mentions: response.competitors_mentioned || response.competitors || [],
          citations: response.citations || response.sources || [],
          confidence_score: response.confidence_score || response.confidence_estimate || null,
          relevance_score: response.relevance_score || null,
          quality_score: response.quality_score || null,
          metadata: {
            raw_response: response.raw_response || response,
            sources_list: response.sources_list || [],
            timestamp: response.timestamp || response.created_at || new Date().toISOString()
          }
        }))

        // 📁 PRIMARY: Store response content to Supabase Storage (file-based)
        const fileStorage = new LLMResponseStorage(serviceClient)
        const fileResponses = responsesToInsert.map((r: any) => ({
          id: r.run_id + '_' + (r.model_name || 'unknown'),
          run_id: r.run_id,
          prompt_id: r.run_id,
          profile_id: profileId,
          account_id: validatedData.accountId || '',
          brand_id: validatedData.brandId || '',
          model_name: r.model_name || r.model || 'unknown',
          model_provider: 'OpenRouter',
          prompt_text: r.prompt_text || r.query || '',
          raw_response: r.raw_response || '',
          response_time_ms: r.response_time_ms,
          token_usage: r.token_usage,
          cost_estimate: r.cost_estimate || 0,
          success: true,
          error_message: null,
          retry_count: 0,
          consumer_behavior: undefined,
          system_prompt: undefined,
          created_at: r.created_at || new Date().toISOString(),
        }))
        const { stored, records } = await fileStorage.batchStoreResponses(fileResponses as any)
        storedResponses = records || []
      } catch (error) {
        console.error('❌ Error storing responses:', error)
        // Don't fail the whole request if response storage fails
      }
    }

    return NextResponse.json({
      success: true,
      run: run,
      brand_context_id: brandContextId,
      stored_responses: storedResponses.length,
      message: 'Run data stored successfully'
    })

  } catch (error) {
    console.error('❌ Store Run API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to store run data'
    }, { status: 500 })
  }
}