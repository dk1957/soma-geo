/**
 * Multi-LLM Submission Service with OpenRouter Search Capabilities
 * ----------------------------------------------------------------
 * Purpose: Submit high-intent prompts to major consumer LLMs with built-in search 
 * via OpenRouter's :online models and collect responses with advanced analysis.
 * 
 * Features:
 * - Submits prompts to premium consumer-equivalent LLMs (ChatGPT, Claude, Gemini, Perplexity)
 * - Uses OpenRouter's :online models for automatic web search capabilities
 * - Return response that are indistinguishable from when we use the same prompts inside the consumer apps of the models like Chatgpt, Perplexity, Claude, etc.
 * - Stores results in the data so that the geo-analysis-service.ts can use the response for analysis and extraction of structure analysis
 * - Handles rate limiting and retries with intelligent fallback
 * 
 * Workflow:
 * Input: PromptRunResult from prompt-generation-service.ts
 * 1. LLM Submission: Send to consumer LLMs with built-in search via OpenRouter
 * 2. Response same as response in the consumers of these models
 * 3. Data Storage: Store in database for geo analysis
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import { llmResponseValidator, ValidationResult } from './llm-response-validator'
import { ConsumerResponseProcessor } from './consumer-response-processor'
import type { ProcessedResponse } from '@/lib/types/response-format-specification'
// REPLACED: Using unified analysis system instead of fragmented services
// import { createGEOAnalysisService, GEOAnalysisService } from './geo-analysis-service'
import { getAvailableLLMModels, getDefaultModelsForPlan, getSystemPrompt, getRunConfig, clearCacheKey } from './config-service'
import type { LLMModelConfig } from '@/lib/config/models'
import { webSearchConfigService, type WebSearchConfig } from './web-search-config-service'
import { LLMResponseStorage } from './llm-response-storage'
import { getAccountTimezone, getDateInTimezone } from '@/lib/utils/timezone'

// Redis interfaces for task tracking
export interface TaskOutput {
  taskId: string
  runId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number // 0-100
  result?: any
  error?: string
  startTime: string
  endTime?: string
  metadata: Record<string, any>
}

export interface CachedResult {
  key: string
  data: any
  timestamp: number
  ttl: number
}

export interface RunPrompt {
  id: string
  text: string
  locale?: string // Country code or locale identifier (e.g., 'za', 'ng', 'ke')
  country_name?: string // Full country name (e.g., 'South Africa', 'Nigeria', 'Kenya')
  geo_region?: string // Geographic region (e.g., 'Africa', 'Europe', 'Asia')
  geo_sub_region?: string // Geographic sub-region (e.g., 'West Africa', 'Northern Europe')
  userPersona?: string
  userContext?: string
  conversationalStyle?: 'casual' | 'professional' | 'skeptical' | 'enthusiastic' | 'concerned'
  intentType?: 'discovery' | 'research' | 'comparison' | 'purchase_decision' | 'problem_solving'
  commercialIntent?: number // 0-100 scale
  authenticity?: number // 0-100 scale
  expectedBrandMention?: 'direct' | 'indirect' | 'competitive'
  queryComplexity?: 'simple' | 'moderate' | 'complex'
  marketRelevance?: number // 0-100
  audienceAlignment?: number // 0-100
  competitiveAngle?: boolean
  urgency?: 'low' | 'medium' | 'high'
  specificity?: number // 0-100
  rationale?: string
}

export interface BrandContext {
  brandName: string
  website?: string
  industry?: string
  markets?: string[]
  businessCategory?: string
  businessCategories?: string[]
  productsServices?: string
  competitors?: string[][]
  targetAudience?: string
  uniqueValueProposition?: string
}

export interface LLMConfig {
  name: string
  model: string
  maxTokens: number
  temperature: number
  supports_search: boolean
  supports_reasoning: boolean
  supports_citations: boolean
  rate_limit_rpm: number
  timeout_ms: number
  input_cost_per_million: number
  output_cost_per_million: number
  tier: 'premium' | 'standard'
  consumer_behavior: string // How to make responses match consumer app behavior
}

export interface RunJob {
  id: string
  promptId: string
  prompt: string
  model: string
  modelConfig: LLMConfig
  brandContext: BrandContext | null
  profileId: string
  accountId: string
  brandId: string
  runId: string
  promptMetadata?: Partial<RunPrompt>
}

export interface LLMResponse {
  id: string // UUID
  run_id: string // UUID
  prompt_id: string // UUID
  profile_id: string
  account_id: string
  brand_id: string
  model_name: string
  model_provider: string
  prompt_text: string
  raw_response: string
  response_time_ms?: number
  token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  cost_estimate?: number
  success: boolean
  error_message?: string
  retry_count: number
  consumer_behavior?: string
  system_prompt?: string
  created_at: string
  prompt_metadata?: Partial<RunPrompt>
  // Response processing metadata for quality tracking
  processing_metadata?: {
    format_detected?: string
    platform_style?: string
    quality_score?: number
    authenticity_score?: number
    brand_mentions_found?: number
    sources_found?: number
    word_count?: number
    is_analysis_ready?: boolean
  }
  // Extracted citations for Source Authority Network tracking
  extracted_citations?: ExtractedCitation[]
  // Analysis fields for semantic processing
  response_embedding?: number[] | null
  semantic_analysis?: Record<string, unknown>
  extraction_quality_score?: number | null
  analysis_completed?: boolean
  last_analysed?: string | null
}

// Citation extracted from LLM response for Source Authority Network
export interface ExtractedCitation {
  url: string
  domain: string
  title?: string
  snippet?: string
  citation_position: number
  citation_format: 'numbered' | 'inline_link' | 'sources_section' | 'bare_url'
  context_text?: string
  raw_citation_data?: Record<string, unknown>
}

export interface RunResult {
  runId: string
  totalJobs: number
  completedJobs: number
  failedJobs: number
  status: 'running' | 'completed' | 'failed'
  responses: LLMResponse[]
  totalCost: number
  averageResponseTime: number
}

export class LLMRunOrchestrator {
  private supabase: SupabaseClient
  private redis?: Redis
  private cache: Map<string, CachedResult> = new Map()
  private openRouterApiKey: string
  private appUrl: string
  
  // Task tracking
  private activeTasks = new Map<string, TaskOutput>()
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
  private readonly TASK_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  
  // Premium LLM Configuration - Now loaded dynamically from database
  private LLM_CONFIGS: LLMConfig[] = []
  private modelsInitialized = false
  private availableModelsCache: LLMModelConfig[] = []

  // Rate limiting and retry management (optimized for faster failover)
  private rateLimitedModels = new Set<string>()
  private lastRateLimitReset = Date.now()
  private lastApiCall: { [key: string]: number } = {}
  private readonly API_RATE_LIMIT_MS = 50 // Reduced to 50ms for even faster processing
  private modelFailureCount = new Map<string, number>() // Track model failures
  
  // Track ongoing runs to prevent duplicates
  private ongoingRuns = new Set<string>()
  // Track models in the current executing batch (for fallback dedup)
  private currentBatchModels: Set<string> | null = null
  // Track cleanup interval for proper disposal
  private static cleanupIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(config: {
    redis?: Redis
    supabase: SupabaseClient
    concurrencyLimit?: number
    timeoutMs?: number
  }) {
    this.supabase = config.supabase
    this.redis = config.redis
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || ''
    this.appUrl = process.env.APP_URL || 'https://soma.ai'
    
    if (!this.openRouterApiKey) {
      console.warn('⚠️ OPENROUTER_API_KEY not found. LLM submission will fail.')
    }
    
    // Set up periodic cleanup (singleton pattern - only one interval per process)
    if (typeof window === 'undefined' && !(globalThis as any).__somaCleanupActive) {
      (globalThis as any).__somaCleanupActive = true
      LLMRunOrchestrator.cleanupIntervalId = setInterval(() => this.cleanupTasks(), 5 * 60 * 1000)
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    if (LLMRunOrchestrator.cleanupIntervalId) {
      clearInterval(LLMRunOrchestrator.cleanupIntervalId)
      LLMRunOrchestrator.cleanupIntervalId = null
      ;(globalThis as any).__somaCleanupActive = false
    }
  }

  /**
   * Initialize LLM models from database configuration
   * Must be called before running runs
   */
  async initializeModels(): Promise<void> {
    if (this.modelsInitialized) return
    
    try {
      console.log('🔄 Loading LLM model configurations from database...')
      this.availableModelsCache = await getAvailableLLMModels()
      
      this.LLM_CONFIGS = this.availableModelsCache.map(config => ({
        name: config.name,
        model: config.openRouterId,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        supports_search: config.supports_search,
        supports_reasoning: config.supports_reasoning,
        supports_citations: config.supports_citations,
        rate_limit_rpm: config.rate_limit_rpm,
        timeout_ms: config.timeout_ms,
        input_cost_per_million: config.cost_per_token * 1000000,
        output_cost_per_million: config.cost_per_token * 1000000,
        tier: 'premium' as const,
        consumer_behavior: config.consumer_behavior
      }))
      
      this.modelsInitialized = true
      console.log(`✅ Loaded ${this.LLM_CONFIGS.length} LLM models from database`)
    } catch (error) {
      console.error('❌ Failed to load LLM models from database:', error)
      throw new Error('Failed to initialize LLM models configuration')
    }
  }

  /**
   * Convert HighIntentPrompt array from prompt simulator to RunPrompt array
   * CRITICAL: Only extract raw prompts to avoid bias - no brand context or metadata used
   * This ensures LLM responses are completely neutral and uninfluenced by brand preferences
   */
  static convertHighIntentPromptsToRunPrompts(highIntentPrompts: any[]): RunPrompt[] {
    return highIntentPrompts.map((prompt, index) => ({
      id: prompt.id || `prompt_${Date.now()}_${index}`,
      text: prompt.simulatedPrompt || prompt.text
      // INTENTIONALLY OMITTING ALL METADATA TO PREVENT BIAS:
      // - No userPersona, conversationalStyle, commercialIntent
      // - No brand preferences, competitive angles, or target markets
      // - No metadata that could influence LLM responses
      // This ensures objective, unbiased responses suitable for accurate GEO analysis
    }))
  }

  /**
   * Main method to run run directly from PromptRunResult
   * CRITICAL: No brand context used to avoid bias - only raw prompts processed
   */
  async runRunFromHighIntentPrompts(
    promptRunResult: any, // PromptRunResult from prompt-generation-service
    params: {
      accountId: string
      brandId: string
      profileId: string
      userId: string
      models?: string[] // Optional: specific models to use
    }
  ): Promise<RunResult> {
    // Ensure models are initialized
    await this.initializeModels()
    
    console.log(`🎯 Running UNBIASED LLM run from ${promptRunResult.simulatedPrompts.length} high-intent prompts`)
    console.log(`⚠️  Brand context intentionally excluded to prevent bias`)
    
    // Convert high-intent prompts to run prompts (text only)
    const runPrompts = LLMRunOrchestrator.convertHighIntentPromptsToRunPrompts(
      promptRunResult.simulatedPrompts
    )
    
    // CRITICAL: Pass null brand context to ensure unbiased responses
    return this.runRun({
      prompts: runPrompts,
      brandContext: null, // No brand context to avoid bias
      accountId: params.accountId,
      brandId: params.brandId,
      profileId: params.profileId,
      userId: params.userId,
      models: params.models
    })
  }

  /**
   * Clean up completed and failed tasks
   */
  private cleanupTasks(): void {
    const now = Date.now()
    for (const [taskId, task] of Array.from(this.activeTasks.entries())) {
      const taskAge = now - new Date(task.startTime).getTime()
      
      // Remove completed/failed tasks older than 1 hour
      if ((task.status === 'completed' || task.status === 'failed') && taskAge > 60 * 60 * 1000) {
        this.activeTasks.delete(taskId)
        if (this.redis) {
          this.redis.del(`task:${taskId}`).catch(console.warn)
        }
      }
      
      // Timeout stuck running tasks
      if (task.status === 'running' && taskAge > this.TASK_TIMEOUT_MS) {
        task.status = 'failed'
        task.error = 'Task timeout'
        task.endTime = new Date().toISOString()
        this.updateTaskOutput(task)
      }
    }
    
    console.log(`🧹 Task cleanup: ${this.activeTasks.size} active tasks remaining`)
  }

  /**
   * Create and track a new task
   */
  private async createTask(taskId: string, runId: string, metadata: Record<string, any> = {}): Promise<TaskOutput> {
    const task: TaskOutput = {
      taskId,
      runId,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      metadata
    }
    
    this.activeTasks.set(taskId, task)
    
    if (this.redis) {
      try {
        await this.redis.setex(`task:${taskId}`, 7200, JSON.stringify(task)) // 2 hours TTL
      } catch (error) {
        console.warn(`Failed to store task in Redis: ${error}`)
      }
    }
    
    return task
  }

  /**
   * Update task progress and output
   */
  private async updateTaskOutput(task: TaskOutput): Promise<void> {
    this.activeTasks.set(task.taskId, task)
    
    if (this.redis) {
      try {
        await this.redis.setex(`task:${task.taskId}`, 7200, JSON.stringify(task))
      } catch (error) {
        console.warn(`Failed to update task in Redis: ${error}`)
      }
    }
  }

  /**
   * Get task status and output
   */
  async getTaskOutput(taskId: string): Promise<TaskOutput | null> {
    // Check memory first
    let task = this.activeTasks.get(taskId)
    
    if (!task && this.redis) {
      try {
        const redisData = await this.redis.get(`task:${taskId}`)
        if (redisData) {
          task = JSON.parse(redisData as string)
          if (task) {
            this.activeTasks.set(taskId, task) // Cache in memory
          }
        }
      } catch (error) {
        console.warn(`Failed to retrieve task from Redis: ${error}`)
      }
    }
    
    return task || null
  }

  /**
   * Store results with caching
   */
  private async storeWithCache(key: string, data: any, ttlMs: number = this.CACHE_TTL_MS): Promise<void> {
    // Store in memory cache
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
    
    // Store in Redis
    if (this.redis) {
      try {
        await this.redis.setex(`cache:${key}`, Math.floor(ttlMs / 1000), JSON.stringify(data))
      } catch (error) {
        console.warn(`Failed to cache data in Redis: ${error}`)
      }
    }
  }

  /**
   * Retrieve cached results
   */
  private async getFromCache(key: string): Promise<any> {
    // Check memory cache first
    const memCache = this.cache.get(key)
    if (memCache && Date.now() - memCache.timestamp < memCache.ttl) {
      return memCache.data
    }
    
    // Check Redis cache
    if (this.redis) {
      try {
        const redisData = await this.redis.get(`cache:${key}`)
        if (redisData) {
          const data = JSON.parse(redisData as string)
          // Update memory cache
          this.cache.set(key, {
            key,
            data,
            timestamp: Date.now(),
            ttl: this.CACHE_TTL_MS
          })
          return data
        }
      } catch (error) {
        console.warn(`Failed to retrieve from Redis cache: ${error}`)
      }
    }
    
    return null
  }

  /**
   * Store run outputs in Redis for tracking
   */
  private async storeRunOutput(runId: string, output: RunResult): Promise<void> {
    const key = `run:${runId}`
    
    if (this.redis) {
      try {
        await this.redis.setex(key, 7200, JSON.stringify(output)) // 2 hours TTL
        console.log(`📊 Stored run output: ${runId}`)
      } catch (error) {
        console.warn(`Failed to store run output: ${error}`)
      }
    }
  }

  /**
   * Get run outputs from Redis
   */
  async getRunOutput(runId: string): Promise<RunResult | null> {
    if (this.redis) {
      try {
        const data = await this.redis.get(`run:${runId}`)
        if (data) {
          return JSON.parse(data as string)
        }
      } catch (error) {
        console.warn(`Failed to retrieve run output: ${error}`)
      }
    }
    
    return null
  }

  async runRun(params: {
    prompts: RunPrompt[]
    brandContext?: BrandContext | null // IGNORED - kept for interface compatibility only
    brandContextId?: string
    accountId: string
    brandId: string
    models?: string[] // Optional: specific models to use
    profileId: string
    userId: string // CRITICAL: Required for RLS policies
    options?: any
  }): Promise<RunResult> {
    // Ensure models are initialized from database
    await this.initializeModels()
    
    // Create a stable key for dedup (excludes timestamp so same config is detected)
    const runKey = `${params.accountId}-${params.brandId}-${params.prompts.length}`
    
    // Check if this run is already running
    if (this.ongoingRuns.has(runKey)) {
      console.log(`⚠️ Run already running for key: ${runKey}`)
      throw new Error('Run already in progress for this configuration')
    }
    
    // Add to ongoing runs
    this.ongoingRuns.add(runKey)
    
    const runId = this.generateId('sim')
    const jobs: RunJob[] = []
    const runStartTime = new Date().toISOString()
    
    // Debug: Log options to verify force_rerun is being passed
    console.log(`🔧 Run options:`, params.options)
    
    // Create task for tracking
    const taskId = `task_${runId}`
    const task = await this.createTask(taskId, runId, {
      promptCount: params.prompts.length,
      modelCount: params.models?.length || this.LLM_CONFIGS.length,
      userId: params.profileId
    })
    
    try {
      // Determine models to use - PRIORITY: params.models > brand's selected_models > plan defaults
      let modelsToUse = params.models

      if (!modelsToUse || modelsToUse.length === 0) {
        // Fetch brand's selected models - this is the primary source
        const { data: brandData } = await this.supabase
          .from('brands')
          .select('selected_models')
          .eq('id', params.brandId)
          .single()
        
        if (brandData?.selected_models && brandData.selected_models.length > 0) {
          // Use brand's explicitly selected models - map to OpenRouter IDs
          console.log(`📋 Using brand's selected models:`, brandData.selected_models)
          modelsToUse = brandData.selected_models
            .map((id: string) => this.availableModelsCache.find(m => m.id === id)?.openRouterId)
            .filter(Boolean) as string[]
        }
      }

      // Fallback ONLY if brand has no selected models - use Growth plan defaults
      if (!modelsToUse || modelsToUse.length === 0) {
         console.log(`⚠️ No models selected for brand, using Growth plan defaults`)
         const growthModels = this.availableModelsCache.filter(m => m.tier === 'growth')
         modelsToUse = growthModels.map(m => m.openRouterId)
      }

      const configsToUse = this.LLM_CONFIGS.filter(config => modelsToUse!.includes(config.model))
      // Track batch models for fallback dedup
      this.currentBatchModels = new Set(configsToUse.map(c => c.model))

      console.log(`🚀 Starting run ${runId} with ${params.prompts.length} prompts across ${configsToUse.length} models`)
      console.log(`📊 Models being used:`, modelsToUse)

      console.log(`📝 Ensuring ${params.prompts.length} prompts exist in user_prompts table`)
      
      // Batch fetch all existing prompts for this brand+account in one query
      const promptTexts = params.prompts.map(p => p.text)
      const { data: existingPrompts } = await this.supabase
        .from('user_prompts')
        .select('id, prompt_text')
        .eq('account_id', params.accountId)
        .eq('brand_id', params.brandId)
        .in('prompt_text', promptTexts)

      const existingPromptMap = new Map(
        (existingPrompts || []).map(p => [p.prompt_text, p.id])
      )

      // Identify prompts that need to be inserted
      const promptsToInsert = params.prompts.filter(p => !existingPromptMap.has(p.text))
      
      if (promptsToInsert.length > 0) {
        const { data: newPrompts, error: insertError } = await this.supabase
          .from('user_prompts')
          .insert(
            promptsToInsert.map(p => ({
              account_id: params.accountId,
              brand_id: params.brandId,
              prompt_text: p.text,
              category: 'run',
              priority: 1,
              is_selected: true,
              rationale: 'Auto-created for run'
            }))
          )
          .select('id, prompt_text')

        if (insertError) {
          console.warn(`⚠️ Failed to batch-insert prompts:`, insertError)
        } else if (newPrompts) {
          for (const np of newPrompts) {
            existingPromptMap.set(np.prompt_text, np.id)
          }
          console.log(`✅ Created ${newPrompts.length} new prompts in user_prompts table`)
        }
      }

      // Assign IDs to all prompts
      for (const prompt of params.prompts) {
        const existingId = existingPromptMap.get(prompt.text)
        if (existingId) {
          prompt.id = existingId
        }
      }
      console.log(`✅ ${existingPrompts?.length || 0} existing + ${promptsToInsert.length} new prompts resolved`)

      // Update task progress
      task.status = 'running'
      task.progress = 10
      await this.updateTaskOutput(task)

      // Create jobs for each prompt x model combination
      // CRITICAL: All jobs use null brand context to ensure completely unbiased LLM responses
      console.log(`🏭 Creating jobs: ${params.prompts.length} prompts × ${configsToUse.length} models = ${params.prompts.length * configsToUse.length} total jobs`)
      
      for (const prompt of params.prompts) {
        for (const modelConfig of configsToUse) {
          const jobId = this.generateId('job')
          
          jobs.push({
            id: jobId,
            promptId: prompt.id,
            prompt: prompt.text, // Only raw prompt text - no metadata
            model: modelConfig.model,
            modelConfig,
            brandContext: null, // ALWAYS NULL - prevents any brand bias in responses
            profileId: params.profileId,
            accountId: params.accountId,
            brandId: params.brandId,
            runId,
            // Pass locale metadata to ensure location-specific responses
            promptMetadata: {
              locale: prompt.locale,
              country_name: prompt.country_name,
              geo_region: prompt.geo_region,
              geo_sub_region: prompt.geo_sub_region
            }
          })
        }
      }
      
      console.log(`✅ Created ${jobs.length} jobs for run ${runId} (${params.prompts.length}P × ${configsToUse.length}M)`)

      // Safety check — should never happen since we don't skip jobs at creation time
      if (jobs.length === 0 && params.prompts.length > 0) {
        console.error(`❌ No jobs created despite ${params.prompts.length} prompts and ${configsToUse.length} models`)
        this.ongoingRuns.delete(runKey)
        task.progress = 100
        task.status = 'failed'
        task.metadata.batchMessage = 'No jobs created — check model configuration'
        task.endTime = new Date().toISOString()
        await this.updateTaskOutput(task)
        
        return {
          runId,
          responses: [],
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          totalCost: 0,
          averageResponseTime: 0,
          message: 'No jobs created — check model configuration'
        }
      }

    // Store run record in both Redis and database
    const runRecord = {
      id: runId,
      profileId: params.profileId,
      accountId: params.accountId,
      brandId: params.brandId,
      promptCount: params.prompts.length,
      modelCount: configsToUse.length,
      totalJobs: jobs.length,
      status: 'running',
      startTime: runStartTime
    }
    
    await this.storeWithCache(`run:${runId}`, runRecord)
    
    // Store run in database directly with current schema
    const { data: dbInsertResult, error: simError } = await this.supabase
      .from('runs')
      .insert({
        id: runId,
        profile_id: params.profileId,
        account_id: params.accountId,
        brand_id: params.brandId,
        prompt_count: params.prompts.length,
        model_count: configsToUse.length,
        total_jobs: jobs.length,
        completed_jobs: 0,
        failed_jobs: 0,
        status: 'running',
        total_cost: 0,
        brand_context: params.brandContext || {},
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()
    
    if (simError) {
      console.error('❌ Failed to store run in database:', simError)
      // Continue anyway since we have Redis backup
    }

    const responses: LLMResponse[] = []
    let completedJobs = 0
    let failedJobs = 0
    let totalCost = 0
    let totalResponseTime = 0

    // Fetch run config from database
    const runConfig = await getRunConfig()
    console.log(`📋 Using run config: concurrency=${runConfig.concurrency_limit}, timeout=${runConfig.timeout_ms}ms`)

    // Process jobs in batches based on config concurrency limit
    const BATCH_SIZE = runConfig.concurrency_limit || 8
    const batches = []
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      batches.push(jobs.slice(i, i + BATCH_SIZE))
    }

    console.log(`🚀 Processing ${jobs.length} jobs in ${batches.length} batches of ${BATCH_SIZE} for optimal performance`)
    
    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} jobs)`)
      console.log(`📋 Batch ${batchIndex + 1} job details:`, batch.map(j => ({ id: j.id, model: j.model, promptLength: j.prompt.length })))
      
      // Execute jobs within the batch in parallel
      console.log(`⚡ Starting concurrent execution of ${batch.length} jobs in batch ${batchIndex + 1}`)
      const batchPromises = batch.map(async (job, jobIndex) => {
        const jobStartTime = Date.now()
        console.log(`  🎯 Job ${jobIndex + 1}/${batch.length}: ${job.model} - "${job.prompt.substring(0, 50)}..." (ID: ${job.id})`)
        try {
          console.log(`    🔄 Executing job ${jobIndex + 1} with model ${job.model}...`)
          const response = await this.executeJob(job)
          const jobTime = Date.now() - jobStartTime
          console.log(`    ✅ Job ${jobIndex + 1} completed in ${jobTime}ms - Response length: ${response.raw_response?.length || 0} chars, Success: ${response.success}`)
          
          if (response.success) {
            completedJobs++
            if (response.cost_estimate) {
              totalCost += response.cost_estimate
            }
            if (response.response_time_ms) {
              totalResponseTime += response.response_time_ms
            }
          } else {
            failedJobs++
            console.log(`    ❌ Job ${jobIndex + 1} failed: ${response.error_message}`)
          }
          
          return response
        } catch (error) {
          const jobTime = Date.now() - jobStartTime
          console.error(`    ❌ Job ${jobIndex + 1} threw error after ${jobTime}ms:`, error)
          failedJobs++
          
          // Create failed response record
          const failedResponse: LLMResponse = {
            id: this.generateId('resp'),
            run_id: job.runId,
            prompt_id: job.promptId,
            profile_id: job.profileId,
            account_id: job.accountId,
            brand_id: job.brandId,
            model_name: job.model,
            model_provider: 'OpenRouter',
            prompt_text: job.prompt,
            raw_response: '',
            response_time_ms: 0,
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: 0,
            created_at: new Date().toISOString()
          }
          
          return failedResponse
        }
      })
      
      // Wait for current batch to complete
      console.log(`⏳ Waiting for all ${batch.length} jobs in batch ${batchIndex + 1} to complete...`)
      const batchResults = await Promise.all(batchPromises)
      console.log(`🏁 Batch ${batchIndex + 1} completed - Processing results...`)
      responses.push(...batchResults)
      
      // Update progress after each batch - reserve more for geo analysis
      const progressPercent = Math.floor(((batchIndex + 1) / batches.length) * 75) // Reserve 25% for storage and geo analysis
      task.progress = progressPercent
      task.metadata.currentBatch = batchIndex + 1
      task.metadata.totalBatches = batches.length
      task.metadata.completedJobs = completedJobs
      task.metadata.totalJobs = jobs.length
      task.metadata.batchMessage = `Processing batch ${batchIndex + 1}/${batches.length} - ${completedJobs}/${jobs.length} jobs completed`
      await this.updateTaskOutput(task)
      
      console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed. Progress: ${progressPercent}%`)
    }
    
    // Batch store all responses for optimal database performance
    console.log(`💾 Batch storing ${responses.length} responses to database...`)
    await this.batchStoreResponses(responses, params.options)

    // ─── AEO Extraction + Aggregation + Insights ─────────
    // Run extraction → aggregation → insights pipeline BEFORE marking run complete.
    // This ensures the pipeline finishes before the serverless function exits.
    // The pipeline is fault-tolerant: each step is isolated, retried, and verified.
    try {
      await this.triggerExtractionPipeline(runId, params.accountId, params.brandId)
    } catch (err) {
      console.error('⚠️ AEO extraction pipeline error (non-blocking):', err)
    }

    // Update run status in both Redis and database
    const finalStatus = failedJobs === jobs.length ? 'failed' : 'completed'
    const runUpdate = {
      id: runId,
      status: finalStatus,
      totalJobs: jobs.length,
      completedJobs,
      failedJobs,
      totalCost,
      averageResponseTime: completedJobs > 0 ? totalResponseTime / completedJobs : 0,
      endTime: new Date().toISOString()
    }
    
    await this.storeWithCache(`run:${runId}`, runUpdate)
    
    // Update run status in database (job counts are auto-updated by trigger)
    const { error: updateError } = await this.supabase
      .from('runs')
      .update({
        status: finalStatus,
        // REMOVED: completed_jobs and failed_jobs - these are auto-calculated by database trigger
        total_cost: totalCost,
        average_response_time_ms: completedJobs > 0 ? Math.round(totalResponseTime / completedJobs) : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', runId)
    
    if (updateError) {
      console.error('❌ Failed to update run in database:', updateError)
    }

    console.log(`✅ Run ${runId} ${finalStatus}: ${completedJobs}/${jobs.length} successful, cost: $${totalCost.toFixed(4)}`)

    // Mark task as complete with final result
    task.status = finalStatus as 'completed' | 'failed'
    task.progress = 100
    task.metadata.batchMessage = finalStatus === 'failed' ? 'Run failed' : 'Run complete'
    task.endTime = new Date().toISOString()
    task.result = {
      runId,
      totalJobs: jobs.length,
      completedJobs,
      failedJobs,
      totalCost,
      averageResponseTime: completedJobs > 0 ? totalResponseTime / completedJobs : 0
    }
    await this.updateTaskOutput(task)

    // Store run output in Redis
    const result: RunResult = {
      runId,
      totalJobs: jobs.length,
      completedJobs,
      failedJobs,
      status: finalStatus,
      responses,
      totalCost,
      averageResponseTime: completedJobs > 0 ? totalResponseTime / completedJobs : 0
    }
    
    await this.storeRunOutput(runId, result)

    // Remove from ongoing runs
    this.ongoingRuns.delete(runKey)

    return result
    
    } catch (error) {
      // Mark task as failed
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
      task.endTime = new Date().toISOString()
      await this.updateTaskOutput(task)
      
      // Remove from ongoing runs even on error
      this.ongoingRuns.delete(runKey)
      
      throw error
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PIPELINE REPORT TYPES
  // ═══════════════════════════════════════════════════════════════════

  static readonly PIPELINE_STEPS = ['extraction', 'aggregation', 'insights', 'broadcast'] as const

  // ═══════════════════════════════════════════════════════════════════
  //  FAULT-TOLERANT EXTRACTION PIPELINE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Run the post-response pipeline: extraction → aggregation → insights → broadcast.
   *
   * **Fault-tolerance guarantees:**
   * - Each step is isolated in its own try/catch — one failure cannot kill later steps.
   * - Transient failures are retried once automatically.
   * - Every step records timing, result summary, and error details.
   * - After each data-producing step a verification query confirms rows were created.
   * - The full report is persisted to `runs.pipeline_report` (JSONB) so it
   *   is always visible from the admin dashboard, even after the function exits.
   * - Overall pipeline_status is `completed` | `partial` (some failed) | `failed`.
   */
  private async triggerExtractionPipeline(runId: string, accountId: string, brandId: string): Promise<void> {
    const pipelineStart = Date.now()

    // ── Initialise report skeleton ──
    type StepName = typeof LLMRunOrchestrator.PIPELINE_STEPS[number]
    interface PipelineStepReport {
      name: StepName
      status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
      started_at: string | null
      completed_at: string | null
      duration_ms: number | null
      result: Record<string, unknown> | null
      error: string | null
      retry_count: number
      verified: boolean
    }
    interface PipelineVerification {
      responses_stored: number
      extraction_rows_created: number
      brand_metrics_rows: number
      competitor_metrics_rows: number
      prompt_metrics_rows: number
      insights_generated: boolean
      broadcast_sent: boolean
    }
    interface PipelineReport {
      status: 'pending' | 'running' | 'completed' | 'partial' | 'failed'
      started_at: string
      completed_at: string | null
      duration_ms: number | null
      steps: PipelineStepReport[]
      verification: PipelineVerification
    }

    const makeStep = (name: StepName): PipelineStepReport => ({
      name, status: 'pending', started_at: null, completed_at: null,
      duration_ms: null, result: null, error: null, retry_count: 0, verified: false,
    })

    const report: PipelineReport = {
      status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
      steps: LLMRunOrchestrator.PIPELINE_STEPS.map(makeStep),
      verification: {
        responses_stored: 0,
        extraction_rows_created: 0,
        brand_metrics_rows: 0,
        competitor_metrics_rows: 0,
        prompt_metrics_rows: 0,
        insights_generated: false,
        broadcast_sent: false,
      },
    }

    const stepMap = new Map(report.steps.map(s => [s.name, s]))

    // Resolve the account's timezone so every date boundary in the pipeline
    // is consistent — especially the aggregator's created_at filters.
    const accountTimezone = await getAccountTimezone(this.supabase, accountId)
    const today = getDateInTimezone(accountTimezone)

    // Helper: save report to DB (called after every step so partial progress is visible)
    const persistReport = async () => {
      try {
        await this.supabase.from('runs').update({
          pipeline_status: report.status,
          pipeline_report: report as unknown as Record<string, unknown>,
          pipeline_started_at: report.started_at,
          pipeline_completed_at: report.completed_at,
        }).eq('id', runId)
      } catch (e) {
        console.warn('⚠️ Failed to persist pipeline report:', e)
      }
    }

    // Helper: run a step with retry
    const runStep = async <T>(
      name: StepName,
      fn: () => Promise<T>,
    ): Promise<{ ok: true; value: T } | { ok: false; error: string }> => {
      const step = stepMap.get(name)!
      step.status = 'running'
      step.started_at = new Date().toISOString()

      for (let attempt = 0; attempt <= 1; attempt++) {
        try {
          const value = await fn()
          step.status = 'completed'
          step.completed_at = new Date().toISOString()
          step.duration_ms = Date.now() - new Date(step.started_at!).getTime()
          await persistReport()
          return { ok: true, value }
        } catch (err) {
          step.retry_count = attempt
          const msg = err instanceof Error ? err.message : String(err)
          step.error = msg
          console.warn(`⚠️ Pipeline step "${name}" attempt ${attempt + 1} failed:`, msg)
          if (err instanceof Error && err.stack) {
            console.error(`📛 Pipeline step "${name}" stack trace:\n${err.stack}`)
          }
          if (attempt === 0) {
            // Brief pause before retry
            await new Promise(r => setTimeout(r, 1000))
          }
        }
      }

      // Both attempts failed
      step.status = 'failed'
      step.completed_at = new Date().toISOString()
      step.duration_ms = Date.now() - new Date(step.started_at!).getTime()
      await persistReport()
      return { ok: false, error: step.error! }
    }

    // ── Mark pipeline as running ──
    console.log(`🔬 [Pipeline] Starting fault-tolerant pipeline for run ${runId}, brand ${brandId}`)
    await persistReport()

    // ──────────────────────────────────────────────────────
    //  STEP 1 — EXTRACTION
    // ──────────────────────────────────────────────────────
    let extractionProcessed = 0
    const extractionResult = await runStep('extraction', async () => {
      const { AEOExtractorService } = await import('@/lib/services/aeo-extractor')
      const extractor = new AEOExtractorService(this.supabase)
      const result = await extractor.processPendingResponses(200, brandId)
      extractionProcessed = result.processed

      // Verify: count response_data rows for this brand + today
      const { count } = await this.supabase
        .from('response_data')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .gte('created_at', `${today}T00:00:00Z`)

      const rowCount = count ?? 0
      report.verification.extraction_rows_created = rowCount
      stepMap.get('extraction')!.result = {
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped ?? 0,
        response_data_rows_today: rowCount,
      }
      stepMap.get('extraction')!.verified = rowCount > 0

      console.log(`🔬 [Pipeline] Extraction: ${result.processed} processed, ${result.failed} failed | Verified ${rowCount} response_data rows`)
      return result
    })

    // Pre-count stored responses for the verification summary
    {
      const { count } = await this.supabase
        .from('llm_response_files')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .gte('created_at', `${today}T00:00:00Z`)
      report.verification.responses_stored = count ?? 0
    }

    // ──────────────────────────────────────────────────────
    //  STEP 2 — AGGREGATION
    // ──────────────────────────────────────────────────────
    // Run even if extraction "failed" because there may be response_data from a prior partial extraction
    if (extractionProcessed > 0 || report.verification.extraction_rows_created > 0) {
      await runStep('aggregation', async () => {
        const { AEOAggregatorService } = await import('@/lib/services/aeo-aggregator')
        const aggregator = new AEOAggregatorService(this.supabase)
        const aggResult = await aggregator.aggregateForDate(today, { accountId, brandId, timezone: accountTimezone })

        // Verify: brand metrics
        const { count: brandMetrics } = await this.supabase
          .from('daily_brand_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .eq('run_date', today)

        // Verify: competitor metrics
        const { count: competitorMetrics } = await this.supabase
          .from('daily_competitor_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .eq('run_date', today)

        // Verify: prompt metrics
        const { count: promptMetrics } = await this.supabase
          .from('daily_prompt_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .eq('run_date', today)

        report.verification.brand_metrics_rows = brandMetrics ?? 0
        report.verification.competitor_metrics_rows = competitorMetrics ?? 0
        report.verification.prompt_metrics_rows = promptMetrics ?? 0

        const step = stepMap.get('aggregation')!
        step.result = {
          brand_metrics: aggResult.brandMetrics,
          model_metrics: aggResult.modelMetrics ?? 0,
          prompt_metrics: aggResult.promptMetrics,
          verified_brand_rows: brandMetrics ?? 0,
          verified_competitor_rows: competitorMetrics ?? 0,
          verified_prompt_rows: promptMetrics ?? 0,
        }
        step.verified = (brandMetrics ?? 0) > 0

        console.log(`📊 [Pipeline] Aggregation: brand=${brandMetrics}, competitor=${competitorMetrics}, prompt=${promptMetrics}`)
        return aggResult
      })
    } else {
      const step = stepMap.get('aggregation')!
      step.status = 'skipped'
      step.result = { reason: 'No extraction rows to aggregate' }
      console.log('📊 [Pipeline] Aggregation skipped — no extraction rows')
      await persistReport()
    }

    // ──────────────────────────────────────────────────────
    //  STEP 3 — STRATEGIC INSIGHTS
    // ──────────────────────────────────────────────────────
    // Run even if aggregation had issues — insights reads from whatever data exists
    await runStep('insights', async () => {
      const { StrategicInsightAgent } = await import('@/lib/services/strategic-insight-agent')
      const agent = new StrategicInsightAgent()
      const insightResult = await agent.generateAnalysis(brandId, {
        forceRefresh: true,
        triggerSource: 'pipeline',
      })

      // Verify: insights row exists
      const { data: insightRow } = await this.supabase
        .from('strategic_insights')
        .select('id, updated_at')
        .eq('brand_id', brandId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const generated = !!insightRow
      report.verification.insights_generated = generated

      const step = stepMap.get('insights')!
      step.result = {
        findings_count: insightResult?.key_findings?.length ?? 0,
        recommendations_count: insightResult?.recommendations?.length ?? 0,
        verified_row_exists: generated,
        insight_updated_at: insightRow?.updated_at ?? null,
      }
      step.verified = generated

      console.log(`🧠 [Pipeline] Insights: ${insightResult?.key_findings?.length ?? 0} findings, verified=${generated}`)
      return insightResult
    })

    // ──────────────────────────────────────────────────────
    //  STEP 4 — BROADCAST
    // ──────────────────────────────────────────────────────
    const broadcastResult = await runStep('broadcast', async () => {
      const channel = this.supabase.channel(`brand:${brandId}`)
      const sendResult = await channel.send({
        type: 'broadcast',
        event: 'pipeline_complete',
        payload: {
          brandId,
          runId,
          pipelineStatus: report.status,
          processed: extractionProcessed,
          timestamp: new Date().toISOString(),
        },
      })
      await this.supabase.removeChannel(channel)

      const sent = sendResult === 'ok'
      report.verification.broadcast_sent = sent

      const step = stepMap.get('broadcast')!
      step.result = { send_result: sendResult }
      step.verified = sent

      if (!sent) throw new Error(`Broadcast returned "${sendResult}"`)
      console.log(`📡 [Pipeline] Broadcast sent for brand ${brandId}`)
      return sendResult
    })

    // ──────────────────────────────────────────────────────
    //  FINALIZE REPORT
    // ──────────────────────────────────────────────────────
    const completedSteps = report.steps.filter(s => s.status === 'completed').length
    const failedSteps = report.steps.filter(s => s.status === 'failed').length
    const totalSteps = report.steps.filter(s => s.status !== 'skipped').length

    if (failedSteps === 0) {
      report.status = 'completed'
    } else if (completedSteps > 0) {
      report.status = 'partial'
    } else {
      report.status = 'failed'
    }

    report.completed_at = new Date().toISOString()
    report.duration_ms = Date.now() - pipelineStart

    await persistReport()

    // Log final summary
    const stepSummary = report.steps.map(s => `${s.name}:${s.status}`).join(' → ')
    console.log(`✅ [Pipeline] Complete for run ${runId}: ${report.status} (${report.duration_ms}ms) | ${stepSummary}`)
    if (report.status !== 'completed') {
      console.warn(`⚠️ [Pipeline] Verification: responses=${report.verification.responses_stored}, extraction=${report.verification.extraction_rows_created}, brand_metrics=${report.verification.brand_metrics_rows}, competitor_metrics=${report.verification.competitor_metrics_rows}, insights=${report.verification.insights_generated}`)
    }
  }

  /**
   * Send a broadcast event to a brand channel (for use outside the pipeline).
   */
  static async broadcastPipelineComplete(
    supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>,
    brandId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const channel = supabase.channel(`brand:${brandId}`)
      const sendResult = await channel.send({
        type: 'broadcast',
        event: 'pipeline_complete',
        payload: { brandId, timestamp: new Date().toISOString(), ...metadata }
      })
      await supabase.removeChannel(channel)
      console.log(`📡 Static broadcast pipeline_complete for brand ${brandId}: ${sendResult}`)
    } catch (err) {
      console.warn('⚠️ Static broadcast failed:', err)
    }
  }

  private async executeJob(job: RunJob): Promise<LLMResponse> {
    const startTime = Date.now()
    
    try {
      // Check if model has too many recent failures
      const failureCount = this.modelFailureCount.get(job.modelConfig.model) || 0
      if (failureCount >= 3) {
        console.warn(`⚠️ Skipping ${job.modelConfig.model} - ${failureCount} recent failures`)
        throw new Error(`Model ${job.modelConfig.model} has too many recent failures (${failureCount})`)
      }
      
      // Check cache first
      const cacheKey = `${job.prompt}-${job.model}`
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        console.log(`💾 Cache hit for ${job.model}`)
        return {
          ...cached,
          id: this.generateId('resp'),
          run_id: job.runId,
          prompt_id: job.promptId,
          profile_id: job.profileId,
          account_id: job.accountId,
          brand_id: job.brandId,
          created_at: new Date().toISOString()
        }
      }
      
      // Enforce rate limiting
      await this.enforceRateLimit(job.modelConfig.name)
      
      // Build system prompt (cached internally per model+locale)
      const systemPrompt = await this.buildConsumerSystemPrompt(job.modelConfig, null, job.promptMetadata)
      
      // Call OpenRouter API
      const response = await this.callOpenRouter(
        job.prompt,
        job.modelConfig,
        systemPrompt,
        null, // Explicitly null to prevent any brand context usage
        job.promptMetadata
      )
      
      const responseTime = Date.now() - startTime
      const responseId = this.generateId('resp')
      
      // Process response through consumer response processor
      const processedResponse: ProcessedResponse = ConsumerResponseProcessor.processResponse(
        response.content,
        response.model_used || job.model,
        job.prompt,
        {
          run_id: job.runId,
          brand_context_id: '',
          prompt_id: job.promptId
        }
      )
      
      // Validate response quality before storing
      if (!processedResponse.validation_result.is_valid) {
        console.warn(`⚠️ Quality validation failed for ${job.model}:`, processedResponse.validation_result.validation_errors)
      }
      
      // Extract citations from response for Source Authority Network
      const extractedCitations = this.extractCitationsFromResponse(
        processedResponse,
        response.annotations,
        response.content
      )
      
      // Store the processed, standardized response in our database format
      const llmResponse: LLMResponse = {
        id: responseId,
        run_id: job.runId,
        prompt_id: job.promptId,
        profile_id: job.profileId,
        account_id: job.accountId,
        brand_id: job.brandId,
        model_name: response.model_used || job.model,
        model_provider: 'OpenRouter',
        prompt_text: job.prompt,
        // CRITICAL: Store the authentic consumer-facing content
        raw_response: processedResponse.standardized_response.consumer_content,
        response_time_ms: responseTime,
        token_usage: response.usage,
        cost_estimate: this.calculateCost(response.usage, job.modelConfig),
        success: true,
        retry_count: 0,
        consumer_behavior: job.modelConfig.consumer_behavior,
        system_prompt: systemPrompt,
        created_at: new Date().toISOString(),
        // Add processing metadata for quality tracking
        processing_metadata: {
          format_detected: processedResponse.standardized_response.format_metadata.response_format,
          platform_style: processedResponse.standardized_response.platform_context.simulated_platform,
          quality_score: processedResponse.validation_result.quality_score,
          authenticity_score: processedResponse.validation_result.authenticity_score,
          brand_mentions_found: processedResponse.standardized_response.format_metadata.brand_visibility?.brands_mentioned?.length ?? 0,
          sources_found: processedResponse.standardized_response.format_metadata.source_analysis?.sources_cited?.length ?? 0,
          word_count: processedResponse.standardized_response.format_metadata.model_metadata.word_count,
          is_analysis_ready: processedResponse.analysis_ready
        },
        // Include extracted citations for batch storage
        extracted_citations: extractedCitations,
        // Add fallback metadata for tracking
        ...(response.is_fallback && {
          fallback_used: response.is_fallback,
          fallback_reason: response.fallback_reason,
          original_model: job.model
        })
        // INTENTIONALLY OMITTING prompt_metadata to prevent bias storage
      }

      // Analysis will be triggered after all run responses are stored
      // This prevents race conditions between immediate analysis and batch processing

      return llmResponse
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Enhanced error handling with specific error types
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle specific error patterns
        if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          this.markModelRateLimited(job.modelConfig.model)
          errorMessage = `Rate limited: ${errorMessage}`
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          errorMessage = `Model not available: ${errorMessage}`
        } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
          errorMessage = `Request timeout: ${errorMessage}`
        } else if (errorMessage.includes('All models failed')) {
          errorMessage = `All fallback models failed: ${errorMessage}`
        }
      }
      
      console.error(`Job ${job.id} failed with ${job.modelConfig.model}:`, errorMessage)
      
      // Return failed response instead of throwing
      return {
        id: this.generateId('resp'),
        run_id: job.runId,
        prompt_id: job.promptId,
        profile_id: job.profileId,
        account_id: job.accountId,
        brand_id: job.brandId,
        model_name: job.model,
        model_provider: 'OpenRouter',
        prompt_text: job.prompt,
        raw_response: '',
        response_time_ms: responseTime,
        success: false,
        error_message: errorMessage,
        retry_count: 0,
        created_at: new Date().toISOString()
        // INTENTIONALLY OMITTING prompt_metadata to prevent bias storage
      }
    }
  }

  // Cache for built system prompts to avoid rebuilding identical prompts
  private systemPromptCache = new Map<string, { prompt: string; timestamp: number }>()
  private static readonly SYSTEM_PROMPT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Static locale map — no need to recreate per call
  private static readonly LOCALE_TO_COUNTRY: Record<string, string> = {
    'za': 'South Africa', 'ng': 'Nigeria', 'ke': 'Kenya', 'gh': 'Ghana', 'eg': 'Egypt',
    'us': 'United States', 'gb': 'United Kingdom', 'uk': 'United Kingdom',
    'ca': 'Canada', 'au': 'Australia', 'de': 'Germany', 'fr': 'France',
    'ae': 'United Arab Emirates', 'sa': 'Saudi Arabia', 'in': 'India', 'br': 'Brazil',
    'mx': 'Mexico', 'jp': 'Japan', 'cn': 'China', 'sg': 'Singapore',
    'my': 'Malaysia', 'ph': 'Philippines', 'id': 'Indonesia', 'th': 'Thailand',
    'vn': 'Vietnam', 'kr': 'South Korea', 'nz': 'New Zealand', 'ie': 'Ireland',
    'nl': 'Netherlands', 'be': 'Belgium', 'ch': 'Switzerland', 'at': 'Austria',
    'se': 'Sweden', 'no': 'Norway', 'dk': 'Denmark', 'fi': 'Finland',
    'pl': 'Poland', 'cz': 'Czech Republic', 'es': 'Spain', 'it': 'Italy',
    'pt': 'Portugal', 'il': 'Israel', 'tr': 'Turkey', 'ru': 'Russia',
    'ar': 'Argentina', 'cl': 'Chile', 'co': 'Colombia', 'pe': 'Peru'
  }

  private async buildConsumerSystemPrompt(modelConfig: LLMConfig, brandContext: BrandContext | null, promptMetadata?: Partial<RunPrompt>): Promise<string> {
    // Build cache key from model + locale (the only varying parts)
    const locale = promptMetadata?.locale || ''  
    const country = promptMetadata?.country_name || ''
    const subRegion = promptMetadata?.geo_sub_region || ''
    const region = promptMetadata?.geo_region || ''
    const cacheKey = `sysprompt:${modelConfig.model}:${locale}:${country}:${subRegion}:${region}`
    
    // Check cache
    const cached = this.systemPromptCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < LLMRunOrchestrator.SYSTEM_PROMPT_CACHE_TTL) {
      return cached.prompt
    }
    
    // Fetch system prompt from database configuration
    let basePrompt: string
    
    const localeToCountryName = LLMRunOrchestrator.LOCALE_TO_COUNTRY
    // Build location context string if locale, country_name, or geo_sub_region is provided
    let locationContext = ''
    if (promptMetadata?.country_name || promptMetadata?.locale || promptMetadata?.geo_sub_region || promptMetadata?.geo_region) {
      let locationName = promptMetadata.country_name
      
      // Fall back to geo_sub_region, then geo_region, then locale code lookup
      if (!locationName) {
        if (promptMetadata.geo_sub_region) {
          locationName = promptMetadata.geo_sub_region
        } else if (promptMetadata.geo_region) {
          locationName = promptMetadata.geo_region
        } else if (promptMetadata.locale) {
          const localeCode = promptMetadata.locale.toLowerCase()
          locationName = localeToCountryName[localeCode] || promptMetadata.locale.toUpperCase()
        }
      }
      
      if (locationName) {
        console.log(`🌍 Building location context for: ${locationName} (locale: ${promptMetadata.locale}, sub_region: ${promptMetadata.geo_sub_region})`)
        locationContext = `\n\nIMPORTANT: The user is located in ${locationName}. Tailor your response specifically for ${locationName}:
- Use local terminology, brands, and references relevant to ${locationName}
- Include locally available products, services, and companies
- Consider local regulations, market conditions, and consumer preferences
- Cite sources from ${locationName} when available
- Prices and currencies should be relevant to ${locationName}`
      }
    }
    
    // Mandatory behavioral override appended to every system prompt
    const noClarificationDirective = `\n\nCRITICAL BEHAVIORAL RULES:
- NEVER ask the user for clarification, URLs, or additional information.
- NEVER say "I need more details" or "Could you provide...".
- ALWAYS answer the question directly with your best knowledge and web search results.
- If information is ambiguous, provide the most likely interpretation and note alternatives.
- If you cannot find an answer, say so honestly — do NOT ask follow-up questions.`

    try {
      const dbPrompt = await getSystemPrompt('query_run')
      // Replace template variables
      basePrompt = dbPrompt
        .replace('{model_name}', modelConfig.name)
        .replace('{location_context}', locationContext)
      basePrompt += noClarificationDirective
    } catch (error) {
      console.warn('⚠️ Failed to fetch system prompt from database, using fallback')
      basePrompt = `You are ${modelConfig.name}. Respond exactly as you would in your consumer application.${locationContext}

CRITICAL INSTRUCTIONS:
1. ANSWER DIRECTLY: Start with the answer immediately. No "Based on my search" or "Here is what I found".
2. CITE EVERYTHING: Use inline citations [1], [2] for every fact.
3. STRUCTURE: Use Markdown. ## Headings, **Bold** for key terms, and numbered lists.
4. NO FLUFF: Be concise. No filler sentences.
5. SOURCES: End with a "Sources" section listing full URLs.
${noClarificationDirective}

FORMAT:
## Direct Answer
[Concise direct answer to the query]

## Key Insights
1. **[Point 1]**: [Details] [1]
2. **[Point 2]**: [Details] [2]

## Sources
[1] [Source Title](URL)
[2] [Source Title](URL)`
    }
    
    // Cache the built prompt
    this.systemPromptCache.set(cacheKey, { prompt: basePrompt, timestamp: Date.now() })
    
    return basePrompt
  }

  private async callOpenRouter(
    prompt: string,
    modelConfig: LLMConfig,
    systemPrompt: string,
    brandContext: BrandContext | null,
    promptMetadata?: Partial<RunPrompt>
  ): Promise<{ content: string; usage?: any; model_used?: string; is_fallback?: boolean; fallback_reason?: string; annotations?: any[] }> {
    
    // Try primary model first
    const primaryResult = await this.callOpenRouterWithModel(
      modelConfig.model,
      systemPrompt,
      prompt,
      modelConfig.timeout_ms,
      modelConfig.temperature,
      modelConfig.maxTokens
    )
    
    if (primaryResult) {
      return {
        content: primaryResult.content,
        usage: this.estimateTokenUsage(systemPrompt + prompt, primaryResult.content),
        model_used: modelConfig.model,
        is_fallback: false,
        annotations: primaryResult.annotations
      }
    }
    
    // Fallback logic
    console.warn(`⚠️ Primary model ${modelConfig.name} failed, attempting fallbacks...`)
    
    // Track the failed model to avoid using it as fallback for other jobs
    this.modelFailureCount.set(modelConfig.model, (this.modelFailureCount.get(modelConfig.model) || 0) + 1)
    
    // Get available fallback models (excluding current one AND models already in this batch
    // to avoid generating duplicate responses that will just be filtered out later)
    const modelsInCurrentBatch = new Set(this.LLM_CONFIGS.map(c => c.model))
    const fallbackConfigs = this.LLM_CONFIGS.filter(c => {
      if (c.model === modelConfig.model) return false
      // Skip models with too many failures
      const failures = this.modelFailureCount.get(c.model) || 0
      if (failures >= 3) return false
      return true
    })
    
    // Filter out fallback models that are already scheduled in the current batch
    // to avoid wasted duplicate API calls
    const nonDuplicateFallbacks = fallbackConfigs.filter(c => {
      const isInBatch = this.currentBatchModels?.has(c.model)
      if (isInBatch) {
        console.log(`⏭️ Skipping fallback ${c.name} - already in current batch`)
      }
      return !isInBatch
    })
    
    for (const fallbackConfig of nonDuplicateFallbacks) {
      console.log(`🔄 Attempting fallback with model: ${fallbackConfig.name}`)
      
      // Rebuild system prompt for fallback model
      const fallbackSystemPrompt = await this.buildConsumerSystemPrompt(fallbackConfig, brandContext, promptMetadata)
      
      const fallbackResult = await this.callOpenRouterWithModel(
        fallbackConfig.model,
        fallbackSystemPrompt,
        prompt,
        fallbackConfig.timeout_ms,
        fallbackConfig.temperature,
        fallbackConfig.maxTokens
      )
      
      if (fallbackResult) {
        console.log(`✅ Fallback successful with ${fallbackConfig.name}`)
        return {
          content: fallbackResult.content,
          usage: this.estimateTokenUsage(fallbackSystemPrompt + prompt, fallbackResult.content),
          model_used: fallbackConfig.model,
          is_fallback: true,
          fallback_reason: `Primary model ${modelConfig.name} failed`,
          annotations: fallbackResult.annotations
        }
      }
    }
    
    // If all models fail, throw error
    throw new Error(`All models failed. Primary: ${modelConfig.name}, Fallbacks: ${nonDuplicateFallbacks.map(c => c.name).join(', ')}`)
  }

  private async callOpenRouterWithModel(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number = 30000,
    temperature?: number,
    maxTokens?: number
  ): Promise<{ content: string; annotations?: any[] } | null> {
    const maxRetries = 2
    
    // Get web search configuration for this model
    const webSearchConfig = await webSearchConfigService.getConfigForModel(model)
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        
        // Apply :online suffix if configured
        const effectiveModel = webSearchConfig && webSearchConfig.use_online_suffix 
          ? webSearchConfigService.applyOnlineSuffix(model, webSearchConfig)
          : model
        
        const requestBody: any = {
          model: effectiveModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens ?? 4000,
          temperature: temperature ?? 0.0
        }

        // Add web search plugin if using Responses API
        if (webSearchConfig && webSearchConfig.use_responses_api) {
          const plugins = webSearchConfigService.buildWebSearchPlugin(webSearchConfig)
          if (plugins.length > 0) {
            requestBody.plugins = plugins
          }
        }

        // Add web_search_options for native search (Chat Completions API)
        if (webSearchConfig && !webSearchConfig.use_responses_api) {
          const searchOptions = webSearchConfigService.buildChatCompletionOptions(webSearchConfig)
          if (Object.keys(searchOptions).length > 0) {
            Object.assign(requestBody, searchOptions)
          }
        }

        // Warn if system prompt is suspiciously large
        if (systemPrompt.length > 10000) {
          console.warn(`🚨 Large system prompt for ${model}: ${systemPrompt.length} chars`)
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.appUrl,
            'X-Title': 'Soma AI Brand Visibility Analysis'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          const sentModel = requestBody.model || model
          
          // Handle specific error types
          if (response.status === 402) {
            console.warn(`💳 Credits depleted for ${sentModel} (402)`)
            return null
          } else if (response.status === 429) {
            console.warn(`⏳ Rate limited on ${sentModel}, attempt ${attempt + 1}/${maxRetries + 1}`)
            if (attempt < maxRetries) {
              await this.delay((attempt + 1) * 2000)
              continue
            }
          } else if (response.status === 404) {
            console.warn(`❌ Model ${sentModel} not found on OpenRouter (404). Check if model ID is valid.`)
            return null
          } else if (response.status >= 500) {
            console.warn(`Server error ${response.status} for ${sentModel}, attempt ${attempt + 1}/${maxRetries + 1}`)
            if (attempt < maxRetries) {
              await this.delay((attempt + 1) * 1000)
              continue
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        const messageAnnotations = data.choices?.[0]?.message?.annotations
        
        if (data.error) {
          console.error(`❌ API error from ${model}:`, data.error)
          throw new Error(`API error: ${data.error.message || data.error}`)
        }

        let content = data.choices?.[0]?.message?.content
        if (!content) {
          throw new Error('No content in response')
        }

        // Log cost info concisely
        if (data.usage?.cost) {
          console.log(`✅ ${model}: ${content.length} chars, $${data.usage.cost.toFixed(4)}, ${messageAnnotations?.length || 0} annotations`)
        } else {
          console.log(`✅ ${model}: ${content.length} chars, ${messageAnnotations?.length || 0} annotations`)
        }

        // OpenRouter standardizes web search citations in message.annotations
        const annotations = data.choices?.[0]?.message?.annotations
        if (annotations && Array.isArray(annotations) && annotations.length > 0) {
          const urlCitations = annotations.filter((a: any) => a.type === 'url_citation')
          
          if (urlCitations.length > 0) {
            // Check if response already has a Sources section
            const hasSourcesSection = /##?\s*(Sources|References|Citations)/i.test(content)
            
            if (!hasSourcesSection) {
              // Build sources section from URL citations
              const sourcesSection = urlCitations.map((citation: any, index: number) => {
                const urlCitation = citation.url_citation || {}
                const url = urlCitation.url || ''
                const title = urlCitation.title || ''
                
                // Use title if available, otherwise extract domain
                let displayName = title
                if (!displayName && url) {
                  try {
                    displayName = new URL(url).hostname.replace('www.', '')
                  } catch {
                    displayName = url
                  }
                }
                
                return url ? `[${index + 1}] [${displayName}](${url})` : `[${index + 1}] ${displayName}`
              }).join('\n')
              
              content = `${content}\n\n## Sources\n${sourcesSection}`
            }
          }
        }
        
        // Track successful model usage
        this.modelFailureCount.set(model, 0)
        
        return { content: content.trim(), annotations: annotations || [] }

      } catch (error) {
        const currentFailures = this.modelFailureCount.get(model) || 0
        this.modelFailureCount.set(model, currentFailures + 1)
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`Timeout for ${model} after ${timeoutMs}ms, attempt ${attempt + 1}`)
          } else {
            console.warn(`Error with ${model}, attempt ${attempt + 1}:`, error.message)
          }
        }
        
        if (attempt === maxRetries) {
          return null
        }
        
        // Brief delay before retry
        await this.delay(1000)
      }
    }
    
    return null
  }

  private estimateTokenUsage(input: string, output: string): any {
    const promptTokens = Math.floor(input.length / 4)
    const completionTokens = Math.floor(output.length / 4)
    
    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  }

  private calculateCost(usage: any, modelConfig: LLMConfig): number {
    if (!usage) return 0
    
    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    
    // Calculate cost per million tokens, then convert to actual cost
    const inputCost = (inputTokens / 1_000_000) * (modelConfig.input_cost_per_million || 0)
    const outputCost = (outputTokens / 1_000_000) * (modelConfig.output_cost_per_million || 0)
    
    return inputCost + outputCost
  }

  private async enforceRateLimit(modelName: string): Promise<void> {
    const lastCall = this.lastApiCall[modelName] || 0
    const timeSinceLastCall = Date.now() - lastCall
    
    if (timeSinceLastCall < this.API_RATE_LIMIT_MS) {
      const waitTime = this.API_RATE_LIMIT_MS - timeSinceLastCall
      await this.delay(waitTime)
    }
    
    this.lastApiCall[modelName] = Date.now()
  }

  private markModelRateLimited(model: string): void {
    this.rateLimitedModels.add(model)
    console.warn(`⚠️ Model ${model} rate limited`)
    
    // Reset rate limits after 30 minutes instead of 1 hour for faster recovery
    setTimeout(() => {
      this.rateLimitedModels.delete(model)
      console.log(`✅ Rate limit reset for ${model}`)
    }, 30 * 60 * 1000)
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Extract citations from processed response for Source Authority Network tracking.
   * Combines citations from:
   * 1. OpenRouter message.annotations (API-provided, most reliable)
   * 2. ConsumerResponseProcessor source_analysis (parsed from text)
   * 3. Fallback text parsing for any missed URLs
   */
  private extractCitationsFromResponse(
    processedResponse: ProcessedResponse,
    apiAnnotations?: any[],
    rawContent?: string
  ): ExtractedCitation[] {
    const citations: ExtractedCitation[] = []
    const seenUrls = new Set<string>()
    
    // 1. API-provided annotations (OpenRouter's message.annotations) - highest priority
    if (apiAnnotations && Array.isArray(apiAnnotations)) {
      const urlCitations = apiAnnotations.filter((a: any) => a.type === 'url_citation')
      urlCitations.forEach((citation: any, index: number) => {
        const urlCitation = citation.url_citation || {}
        const url = urlCitation.url || ''
        const title = urlCitation.title || ''
        
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url)
          citations.push({
            url,
            domain: this.extractDomainFromUrl(url),
            title: title || undefined,
            snippet: urlCitation.content || undefined,
            citation_position: index + 1,
            citation_format: 'sources_section',
            context_text: urlCitation.content?.substring(0, 500),
            raw_citation_data: citation
          })
        }
      })
    }
    
    // 2. Sources from ConsumerResponseProcessor
    const sourceAnalysis = processedResponse.standardized_response.format_metadata.source_analysis
    if (sourceAnalysis?.sources_cited && Array.isArray(sourceAnalysis.sources_cited)) {
      sourceAnalysis.sources_cited.forEach((source: any, index: number) => {
        const url = source.url || ''
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url)
          citations.push({
            url,
            domain: source.domain || this.extractDomainFromUrl(url),
            title: source.title || undefined,
            citation_position: citations.length + 1,
            citation_format: url.includes('](') ? 'inline_link' : 'bare_url',
            context_text: source.citation_text?.substring(0, 500)
          })
        }
      })
    }
    
    // 3. Fallback: Parse any remaining URLs from raw content
    if (rawContent) {
      const urlRegex = /https?:\/\/[^\s\)\"\'<>]+/gi
      const matches = rawContent.matchAll(urlRegex)
      for (const match of matches) {
        const url = match[0].replace(/[.,;:!?\]]+$/, '') // Clean trailing punctuation
        if (url && !seenUrls.has(url) && this.isValidUrl(url)) {
          seenUrls.add(url)
          citations.push({
            url,
            domain: this.extractDomainFromUrl(url),
            citation_position: citations.length + 1,
            citation_format: 'bare_url'
          })
        }
      }
    }
    
    console.log(`📎 Extracted ${citations.length} citations from response`)
    return citations
  }
  
  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '').toLowerCase()
    } catch {
      // If URL parsing fails, try basic extraction
      const match = url.match(/https?:\/\/(?:www\.)?([^\/\s]+)/i)
      return match ? match[1].toLowerCase() : url
    }
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }
  
  /**
   * Legacy storeCitations — removed.
   * Citations are now stored by the AEO extraction pipeline (aeo-extractor.ts → aeo_citations table).
   */

  private async batchStoreResponses(responses: LLMResponse[], options?: any): Promise<void> {
    if (responses.length === 0) return
    
    // Filter out in-memory duplicates by creating a unique key
    const uniqueResponses = new Map<string, LLMResponse>()
    let duplicatesFiltered = 0
    
    for (const response of responses) {
      const uniqueKey = `${response.account_id}-${response.brand_id}-${response.prompt_text}-${response.model_name}`
      if (!uniqueResponses.has(uniqueKey)) {
        uniqueResponses.set(uniqueKey, response)
      } else {
        duplicatesFiltered++
      }
    }
    
    if (duplicatesFiltered > 0) {
      console.log(`🔍 Filtered ${duplicatesFiltered} in-batch duplicates (${responses.length} → ${uniqueResponses.size})`)
    }

    const responsesToInsert: LLMResponse[] = Array.from(uniqueResponses.values())

    // Only keep successful responses for storage
    const successfulResponses = responsesToInsert.filter(r => r.success && r.raw_response)
    if (successfulResponses.length === 0) {
      console.warn('⚠️ No successful responses to store')
      return
    }

    // Validate responses before storage
    const validationResult = await llmResponseValidator.validateBatch(successfulResponses)
    
    console.log(`✅ Validation: ${validationResult.summary.valid}/${validationResult.summary.total} valid, avg quality: ${Math.round(validationResult.summary.avgQualityScore)}`)
    
    if (validationResult.invalidResponses.length > 0) {
      console.warn(`⚠️ ${validationResult.invalidResponses.length} invalid responses rejected`)
    }
    
    if (validationResult.validResponses.length === 0) {
      console.warn('⚠️ No valid responses to store after validation')
      return
    }
    
    console.log(`💾 Storing ${validationResult.validResponses.length} responses...`)

    // 📁 Store response content to Supabase Storage + llm_response_files table
    const fileStorage = new LLMResponseStorage(this.supabase)
    const fileResult = await fileStorage.batchStoreResponses(validationResult.validResponses)
    console.log(`📁 File storage: ${fileResult.stored} stored, ${fileResult.failed} failed`)

    if (fileResult.stored === 0) {
      console.error('❌ No responses stored to file storage')
      return
    }

    // Write manifest for the run run
    if (fileResult.records.length > 0) {
      const first = validationResult.validResponses[0]
      await fileStorage.writeManifest(
        first.account_id,
        first.brand_id,
        first.run_id,
        fileResult.records
      )
    }

    console.log(`✅ Stored ${fileResult.stored} responses to file storage`)
    
    // Citations are stored by the AEO extraction pipeline (aeo-extractor.ts)
    // which runs after batchStoreResponses via triggerExtractionPipeline()
  }

  // NOTE: Single storeResponse removed — batch storage (storeResponses) is the only path

  /**
   * Get brand context for analysis - includes enhanced fields for smart prompt generation
   */
  private async getBrandContextForAnalysis(brandId: string): Promise<any> {
    console.log(`🔍 Getting brand context for brandId: ${brandId}`)
    
    try {
      if (!brandId) {
        console.warn(`⚠️ No brandId provided to getBrandContextForAnalysis`)
        return null
      }

      const { data: brand, error } = await this.supabase
        .from('brands')
        .select(`
          id,
          name,
          entity_aliases,
          industry,
          account_id,
          description,
          brand_category,
          target_markets,
          products_services,
          business_type,
          business_model,
          target_audience,
          primary_value,
          known_competitors,
          brand_website
        `)
        .eq('id', brandId)
        .single()

      if (error) {
        console.error(`❌ Database error getting brand context for ${brandId}:`, error)
        return null
      }
      
      if (!brand) {
        console.warn(`⚠️ No brand found for brandId: ${brandId}`)
        return null
      }

      console.log(`✅ Retrieved brand context: ${brand.name} (ID: ${brand.id})`)
      
      return {
        brandId: brand.id,
        brandName: brand.name,
        brandAliases: brand.entity_aliases || [],
        industry: brand.industry || 'General',
        accountId: brand.account_id,
        // Enhanced fields for smarter prompt generation
        description: brand.description || '',
        businessCategory: brand.brand_category || brand.industry || 'General',
        markets: brand.target_markets || [],
        productsServices: brand.products_services || '',
        businessType: brand.business_type || '',
        businessModel: brand.business_model || '',
        targetAudience: brand.target_audience || '',
        primaryValue: brand.primary_value || '',
        competitors: brand.known_competitors || [],
        website: brand.brand_website || ''
      }
    } catch (error) {
      console.error(`❌ Failed to get brand context for ${brandId}:`, error)
      return null
    }
  }

  private generateId(prefix: string): string {
    // Generate proper UUID for database compatibility
    return crypto.randomUUID()
  }

}
