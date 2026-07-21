import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { JobsService } from '@/lib/services/jobs-service'

/**
 * Content Processing Utilities
 */
function cleanText(rawText: string): string {
  if (!rawText) return ''
  
  return rawText
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown formatting
    .replace(/[*_`#\[\]]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters except punctuation
    .replace(/[^\w\s.,!?;:'"()-]/g, '')
    // Trim
    .trim()
}

function extractBrandMentionsFromText(text: string, brandName: string, competitors: string[] = []): any[] {
  const mentions: any[] = []
  const textLower = text.toLowerCase()
  
  // Search for the target brand
  const brandLower = brandName.toLowerCase()
  let searchStart = 0
  
  while (true) {
    const position = textLower.indexOf(brandLower, searchStart)
    if (position === -1) break
    
    // Extract context around the mention (50 chars before and after)
    const start = Math.max(0, position - 50)
    const end = Math.min(text.length, position + brandName.length + 50)
    const context = text.substring(start, end)
    
    // Basic sentiment analysis (simplified)
    const sentiment = calculateSentiment(context)
    
    mentions.push({
      brand_name: brandName,
      position: position,
      context: context,
      sentiment: sentiment,
      mention_type: 'direct',
      count: 1
    })
    
    searchStart = position + brandName.length
  }
  
  // Search for competitors
  competitors.forEach(competitor => {
    const competitorLower = competitor.toLowerCase()
    let searchStart = 0
    
    while (true) {
      const position = textLower.indexOf(competitorLower, searchStart)
      if (position === -1) break
      
      const start = Math.max(0, position - 50)
      const end = Math.min(text.length, position + competitor.length + 50)
      const context = text.substring(start, end)
      const sentiment = calculateSentiment(context)
      
      mentions.push({
        brand_name: competitor,
        position: position,
        context: context,
        sentiment: sentiment,
        mention_type: 'competitor',
        count: 1
      })
      
      searchStart = position + competitor.length
    }
  })
  
  return mentions
}

function calculateSentiment(text: string): number {
  // Simple sentiment analysis based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'best', 'recommend', 'love', 'perfect']
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'disappointing', 'poor', 'useless']
  
  const textLower = text.toLowerCase()
  let score = 0
  
  positiveWords.forEach(word => {
    const matches = (textLower.match(new RegExp(word, 'g')) || []).length
    score += matches * 0.1
  })
  
  negativeWords.forEach(word => {
    const matches = (textLower.match(new RegExp(word, 'g')) || []).length
    score -= matches * 0.1
  })
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, score))
}

/**
 * Jobs Run Endpoint
 * ========================
 * 
 * Creates a job record for LLM run tasks and stores responses in the responses table.
 * This integrates with the existing /api/llm-run endpoint.
 */

export async function POST(request: NextRequest) {
  // Add multiple types of logging to see what shows up
  console.log('🚀 Jobs run API called!')
  console.error('🚀 Jobs run API called (error log)!')
  process.stdout.write('🚀 Jobs run API called (stdout)!\n')
  
  try {
    console.log('🔍 Jobs API request headers:', {
      'user-agent': request.headers.get('user-agent')?.substring(0, 50),
      'content-type': request.headers.get('content-type'),
      'cookie': request.headers.get('cookie') ? 'Present' : 'Missing',
      'cookies-count': request.cookies.getAll().length
    })
    
    // Get authenticated user using Clerk
    const user = await getCurrentUser()
    const serviceSupabase = createServiceClient()
    
    console.log('🔍 Jobs API auth check:', {
      hasUser: !!user,
      clerkUserId: user?.clerkUserId
    })
    
    if (!user?.clerkUserId) {
      console.log('❌ Jobs run auth failed: No user found')
      return NextResponse.json({
        error: 'Unauthorized - valid authentication required'
      }, { status: 401 })
    }

    console.log('✅ Jobs run auth success for user:', user.clerkUserId)

    // Use service role for server-side operations
    const jobsService = new JobsService(true)
    
    const body = await request.json()
    const { 
      brandName, 
      accountId,
      brandId = null,
      prompts = [],
      models = [],
      runId = null,
      action = 'create' // 'create' or 'store_responses'
    } = body
    
    if (!accountId) {
      return NextResponse.json({
        error: 'Account ID is required for run jobs'
      }, { status: 400 })
    }

    // Get or create user profile to get proper profile_id
    let profileId: string | null = null
    try {
      // First, try to find existing profile
      const { data: existingProfile, error: profileError } = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.clerkUserId)
        .single()
      
      if (existingProfile) {
        profileId = existingProfile.id
      } else {
        // If no profile exists, create one
        console.log('🔧 Creating missing profile for user:', user.clerkUserId)
        const { data: newProfile, error: insertError } = await serviceSupabase
          .from('profiles')
          .insert({
            clerk_id: user.clerkUserId,
            email: user.clerkUser?.email || `user-${user.clerkUserId}@soma.ai`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()
        
        if (insertError || !newProfile) {
          console.error('❌ Failed to create profile:', insertError)
          return NextResponse.json({
            error: 'Failed to create user profile'
          }, { status: 500 })
        }
        
        profileId = newProfile.id
      }
      
      console.log('✓ Profile resolved:', { clerkUserId: user.clerkUserId, profileId })
    } catch (profileErr) {
      console.error('❌ Profile resolution error:', profileErr)
      return NextResponse.json({
        error: 'Failed to resolve user profile'
      }, { status: 500 })
    }

    if (action === 'create') {
      // Create JSON prompts structure with unique IDs
      const promptsJson = prompts.map((prompt: any, index: number) => {
        const promptText = typeof prompt === 'string' ? prompt : (prompt.text || '')
        return {
          id: crypto.randomUUID(),
          text: promptText,
          type: typeof prompt === 'object' && prompt.type ? prompt.type : 
                (promptText.toLowerCase().includes(brandName?.toLowerCase() || '') ? 'direct_mention' : 'problem_focused'),
          created_at: new Date().toISOString()
        }
      })

      // Extract provider and model information
      const modelInfo = models.map((model: string) => {
        const provider = model.includes('/') ? model.split('/')[0] : 
                        model.includes('gpt') ? 'openai' : 
                        model.includes('claude') ? 'anthropic' :
                        model.includes('gemini') ? 'google' : 'unknown'
        
        const modelName = model.includes('/') ? model.split('/')[1].split(':')[0] : model
        
        return { provider, model: modelName, full_name: model }
      })

      const primaryModel = modelInfo[0] || { provider: 'unknown', model: 'unknown', full_name: 'unknown' }

      // Create job record for run task
      const jobId = await jobsService.createJob({
        account_id: accountId,
        brand_id: brandId, // This will be auto-assigned if null via trigger
        job_category: 'visibility',
        job_type: 'prompt_generation', // Fixed: use allowed value
        model: primaryModel.model,
        provider: primaryModel.provider,
        prompt: JSON.stringify(promptsJson), // Store JSON structure in prompt column
        metadata: {
          brand_name: brandName,
          source: 'onboarding_run',
          timestamp: new Date().toISOString(),
          run_id: runId,
          prompt_count: prompts.length,
          model_count: models.length,
          expected_responses: prompts.length * models.length,
          models_info: modelInfo,
          prompts_structured: promptsJson
        }
      })

      return NextResponse.json({
        success: true,
        job_id: jobId,
        message: `Created run job for ${prompts.length} prompts x ${models.length} models`,
        prompts_with_ids: promptsJson,
        models_info: modelInfo
      })

    } else if (action === 'store_responses') {
      // Store run responses by fetching them from responses table
      const { 
        jobId, 
        runId: externalRunId, 
        job_id, 
        brandName: targetBrandName, 
        competitors = [],
        accountId: requestAccountId, // Get accountId from request body
        brandId: requestBrandId // Get brandId from request body
      } = body
      
      // Use either jobId or job_id (support both formats)
      const finalJobId = jobId || (typeof job_id === 'string' ? job_id : job_id?.job_id) || 'run_' + externalRunId
      
      console.log('🔍 Job ID resolution:', {
        jobId,
        job_id,
        finalJobId,
        hasJobId: !!finalJobId
      })
      
      // Use accountId from request body if provided, otherwise fall back to main accountId
      const finalAccountId = requestAccountId || accountId
      const finalBrandId = requestBrandId || brandId
      
      if (!externalRunId && !finalJobId) {
        return NextResponse.json({
          error: 'Either runId or jobId is required to fetch responses'
        }, { status: 400 })
      }

      console.log('🔍 Store responses called with:', {
        externalRunId,
        finalJobId,
        finalAccountId,
        finalBrandId,
        targetBrandName
      })

      // Ensure job record exists for foreign key constraint
      if (finalJobId.startsWith('run_')) {
        console.log('🔧 Creating job record for run responses...')
        const { error: jobCreateError } = await serviceSupabase
          .from('jobs')
          .upsert({
            job_id: finalJobId,
            account_id: finalAccountId,
            brand_id: finalBrandId,
            status: 'completed',
            job_type: 'other', // Fixed: use allowed value for data transfer
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (jobCreateError) {
          console.error('Failed to create job record:', jobCreateError)
        } else {
          console.log('✅ Job record created:', finalJobId)
        }
      }

      // Fetch responses from llm_response_files table based on run ID
      let query = serviceSupabase
        .from('llm_response_files')
        .select('*')
      
      if (externalRunId) {
        // Get the run record using the external ID directly as the primary key
        const { data: simRecord, error: simError } = await serviceSupabase
          .from('runs')
          .select('id')
          .eq('id', externalRunId)
          .single()
        
        if (simError || !simRecord) {
          console.error('Run not found:', externalRunId, simError)
          return NextResponse.json({
            error: 'Run not found',
            details: `No run found with ID: ${externalRunId}`
          }, { status: 404 })
        }
        
        query = query.eq('run_id', simRecord.id)
      }
      
      if (finalAccountId) {
        query = query.eq('account_id', finalAccountId)
      }

      const { data: llmResponses, error: fetchError } = await query

      if (fetchError) {
        console.error('Failed to fetch LLM responses:', fetchError)
        return NextResponse.json({
          error: 'Failed to fetch run responses',
          details: fetchError.message
        }, { status: 500 })
      }

      if (!llmResponses || llmResponses.length === 0) {
        console.log('No LLM responses found for run:', externalRunId)
        return NextResponse.json({
          success: true,
          message: 'No responses found to store',
          responses_stored: 0
        })
      }

      console.log(`Found ${llmResponses.length} LLM responses to process (not store - they already exist)`)

      // Process the existing responses instead of re-inserting them
      // The responses are already in the database - we just need to analyze them
      console.log(`✅ Processing ${llmResponses.length} existing responses`)

      // Update job status to completed
      if (finalJobId) {
        await jobsService.updateJobStatus(finalJobId, 'completed')
      }

      return NextResponse.json({
        success: true,
        responses_stored: llmResponses.length,
        message: `Processed ${llmResponses.length} existing responses (no duplication).`,
        details: {
          responses_found: llmResponses.length,
          responses_processed: llmResponses.length,
          run_id: externalRunId
        }
      })
    }

    return NextResponse.json({
      error: 'Invalid action. Use "create" or "store_responses"'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Jobs run endpoint error:', error)
    return NextResponse.json({
      error: 'Failed to process run job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}