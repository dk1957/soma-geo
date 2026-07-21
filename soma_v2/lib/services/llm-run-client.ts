/**
 * LLM Run Client
 * =====================
 * 
 * Client-side utilities for interacting with the LLM run API.
 * Provides easy-to-use functions for onboarding and dashboard integration.
 */

export interface RunPrompt {
  id: string
  text: string
  intent_category?: string
  priority: number
}

export interface BrandContext {
  brand_name: string
  website?: string
  industry?: string
  competitors: string[]
  target_markets: string[]
  business_context?: string
}

export interface RunOptions {
  use_cache?: boolean
  concurrency_limit?: number
  timeout_ms?: number
  temperature?: number
  max_tokens?: number
}

interface ResponseData {
  id: string // UUID
  run_id: string // UUID
  job_ids: string[]
  estimated_completion_time: number
  cached_responses: number
  total_jobs: number
  message: string
}

export interface RunResponse {
  success: boolean
  run: {
    id: string // UUID
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    total_jobs: number
    completed_jobs: number
    failed_jobs: number
    estimated_completion_time: number
  }
  data?: ResponseData
  error?: string
}

export interface RunStatus {
  success: boolean
  run: {
    id: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    brand_contexts: { brand_name: string }
    progress: {
      total_jobs: number
      completed_jobs: number
      failed_jobs: number
      running_jobs: number
      cached_responses: number
      progress_percentage: number
      is_complete: boolean
      estimated_completion_time?: number
      actual_duration?: number
    }
    created_at: string
    updated_at: string
  }
}

export interface RunResults {
  success: boolean
  responses: Array<{
    id: string
    prompt_text: string
    model_name: string
    answer_text: string
    citations: Array<{
      source_name: string
      url: string
      excerpt: string
      relevance_score: number
    }>
    brand_mentions: Array<{
      brand_name: string
      count: number
      contexts: string[]
    }>
    confidence_estimate: number
    created_at: string
  }>
  total_count: number
  has_more: boolean
}

export class LLMRunClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/llm-run') {
    this.baseUrl = baseUrl
  }

  /**
   * Start a new LLM run
   * Note: brandData is accepted for backwards compatibility but not sent to API
   * to maintain unbiased run results
   */
  async startRun(params: {
    prompts: RunPrompt[]
    models?: string[]
    options?: RunOptions
    brandData?: {
      knownCompetitors?: string[]
      brandCategory?: string
      targetMarkets?: string[]
    }
  }): Promise<RunResponse> {
    const requestBody = {
      prompts: params.prompts,
      models: params.models || [
        'openai/gpt-4o-mini:online',
        'meta-llama/llama-4-8b-instruct:online',
        'google/gemini-2.5-flash:online',
        'x-ai/grok-3-mini:online'
      ],
      // REMOVED: brand_data - not sent to maintain unbiased run
      options: {
        use_cache: true,
        concurrency_limit: 10, // Increased from 8 to 10 for faster processing
        timeout_ms: 90000, // Reduced from 120s to 90s
        temperature: 0.2,
        max_tokens: 2000, // Increased from 400 to prevent response truncation
        ...params.options
      }
    }
    
    console.log('🚀 Starting LLM Run with request:', {
      promptCount: requestBody.prompts.length,
      models: requestBody.models,
      options: requestBody.options
    })
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorDetails
      try {
        errorDetails = await response.json()
      } catch (parseError) {
        errorDetails = { 
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        }
      }
      
      console.error('LLM Run API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorDetails
      })
      
      throw new Error(errorDetails.error || errorDetails.message || `HTTP ${response.status}: Failed to start run`)
    }

    return response.json()
  }

  /**
   * Check run status
   */
  async getRunStatus(runId: string): Promise<RunStatus> {
    const response = await fetch(`${this.baseUrl}/status?run_id=${runId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get run status')
    }

    return response.json()
  }

  /**
   * Get run results
   */
  async getRunResults(params: {
    runId?: string
    brandContextId?: string
    limit?: number
    offset?: number
  }): Promise<RunResults> {
    const searchParams = new URLSearchParams()
    
    if (params.runId) searchParams.set('run_id', params.runId)
    if (params.brandContextId) searchParams.set('brand_context_id', params.brandContextId)
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)

    if (!response.ok) {
      console.log(`❌ LLM Run GET failed with status ${response.status}`)
      try {
        const error = await response.json()
        console.log('❌ Error details:', error)
        
        // If it's an auth error, return empty results instead of throwing
        if (response.status === 401) {
          console.log('⚠️ Authentication required - returning empty results')
          return { 
            success: false, 
            responses: [], 
            total_count: 0, 
            has_more: false,
            error: 'Authentication required'
          } as RunResults
        }
        
        throw new Error(error.message || error.error || 'Failed to get run results')
      } catch (parseError) {
        console.log('❌ Failed to parse error response:', parseError)
        throw new Error(`HTTP ${response.status}: Failed to get run results`)
      }
    }

    return response.json()
  }

  /**
   * Get user's runs with status
   */
  async getUserRuns(): Promise<{
    success: boolean
    runs: Array<any>
    summary: {
      total_runs: number
      running_runs: number
      completed_runs: number
      failed_runs: number
    }
  }> {
    const response = await fetch(`${this.baseUrl}/status?user_runs=true`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get user runs')
    }

    return response.json()
  }

  /**
   * Poll run until completion
   */
  async pollRunCompletion(
    runId: string, 
    options: {
      maxWaitTime?: number
      pollInterval?: number
      onProgress?: (status: RunStatus) => void
    } = {}
  ): Promise<RunStatus> {
    const {
      maxWaitTime = 300000, // 5 minutes
      pollInterval = 5000,   // 5 seconds
      onProgress
    } = options

    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getRunStatus(runId)
        
        if (onProgress) {
          onProgress(status)
        }

        if (status.run.progress.is_complete || 
            status.run.status === 'completed' ||
            status.run.status === 'failed') {
          return status
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))

      } catch (error) {
        console.error('Polling error:', error)
        // Continue polling on error
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    throw new Error('Run polling timeout')
  }

  /**
   * Convert prompts for onboarding use case
   * Generate UUIDs for prompt IDs to match database schema
   */
  static createOnboardingPrompts(
    basePrompts: string[]
  ): RunPrompt[] {
    return basePrompts.map((prompt, index) => ({
      id: crypto.randomUUID(), // Generate proper UUID instead of string identifier
      text: prompt,
      intent_category: 'commercial_research',
      priority: Math.min(10, Math.max(1, 10 - index)) // Higher priority for earlier prompts (1-10 range)
    }))
  }

  /**
   * Format results for onboarding display
   */
  static formatOnboardingResults(results: RunResults) {
    const brandMentions = new Map<string, number>()
    const modelPerformance = new Map<string, { responses: number; avgConfidence: number }>()
    let totalCitations = 0

    results.responses.forEach(response => {
      // Aggregate brand mentions
      response.brand_mentions.forEach(mention => {
        const current = brandMentions.get(mention.brand_name) || 0
        brandMentions.set(mention.brand_name, current + mention.count)
      })

      // Track model performance
      const current = modelPerformance.get(response.model_name) || { responses: 0, avgConfidence: 0 }
      current.responses++
      current.avgConfidence = (current.avgConfidence * (current.responses - 1) + response.confidence_estimate) / current.responses
      modelPerformance.set(response.model_name, current)

      // Count citations
      totalCitations += response.citations.length
    })

    return {
      summary: {
        total_responses: results.responses.length,
        total_citations: totalCitations,
        avg_confidence: results.responses.reduce((sum, r) => sum + r.confidence_estimate, 0) / results.responses.length,
        brand_mentions: Array.from(brandMentions.entries()).map(([brand, count]) => ({ brand, count })),
        model_performance: Array.from(modelPerformance.entries()).map(([model, stats]) => ({
          model,
          responses: stats.responses,
          avg_confidence: Math.round(stats.avgConfidence)
        }))
      },
      responses: results.responses
    }
  }
}

// Default export for easy importing
export default LLMRunClient