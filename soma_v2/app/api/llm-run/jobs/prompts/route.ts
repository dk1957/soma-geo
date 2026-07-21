import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { JobsService } from '@/lib/services/jobs-service'

/**
 * Jobs Prompts Endpoint - Simple Record Keeper
 * ============================================
 * 
 * This endpoint is ONLY for recording that a prompt generation task happened.
 * It does NOT generate prompts - use the prompt-generation-service.
 * It does NOT run runs - use /api/llm-run
 * It does NOT store prompts - use /api/content/prompts/store for storage
 * 
 * This is purely for jobs table record keeping.
 */

export async function POST(request: NextRequest) {
  try {
    // Use service role for server-side operations
    const jobsService = new JobsService(true)
    
    const body = await request.json()
    const { 
      brandName, 
      source = 'unknown', 
      accountId = null,
      brandId = null, // Accept brandId from request
      prompts = [],
      model = null,
      totalTokens = null,
      metadata: additionalMetadata = {}
    } = body
    
    // Skip job recording if no account ID provided
    if (!accountId) {
      return NextResponse.json({
        success: true,
        message: 'Job recording skipped - no account ID provided'
      })
    }
    
    // Create structured prompts with unique IDs
    const promptsJson = prompts.map((prompt: any, index: number) => {
      const promptText = typeof prompt === 'string' ? prompt : (prompt.simulatedPrompt || prompt.text || '')
      
      return {
        id: prompt.id || `prompt_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 8)}`,
        text: promptText,
        type: typeof prompt === 'object' && prompt.intent ? 
              (prompt.intent === 'direct' ? 'direct_mention' : 'problem_focused') :
              (promptText.toLowerCase().includes(brandName?.toLowerCase() || '') ? 'direct_mention' : 'problem_focused'),
        created_at: new Date().toISOString(),
        intent: typeof prompt === 'object' ? prompt.intent : undefined,
        rationale: typeof prompt === 'object' ? prompt.rationale : undefined
      }
    })

    // Extract provider and model information if provided
    const provider = model?.includes('/') ? model.split('/')[0] : 
                    model?.includes('gpt') ? 'openai' : 
                    model?.includes('claude') ? 'anthropic' :
                    model?.includes('gemini') ? 'google' : 'unknown'
    
    const modelName = model?.includes('/') ? model.split('/')[1].split(':')[0] : model
    
    // Create job record for prompt generation task
    const jobId = await jobsService.createJob({
      account_id: accountId,
      brand_id: brandId, // Use the provided brand ID (will be auto-assigned if null via trigger)
      job_category: 'discoverability',
      job_type: 'prompt_generation',
      model: modelName,
      provider: provider,
      prompt: JSON.stringify(promptsJson), // Store JSON structure in prompt column
      metadata: {
        brand_name: brandName,
        source: source,
        timestamp: new Date().toISOString(),
        task_type: 'record_keeping_only',
        prompt_count: prompts.length,
        total_tokens: totalTokens,
        prompts_structured: promptsJson,
        model_info: { provider, model: modelName, full_name: model },
        ...additionalMetadata
      }
    })

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: `Recorded ${prompts.length} prompts in jobs table`
    })

  } catch (error) {
    console.error('❌ Jobs prompts endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create prompts job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}