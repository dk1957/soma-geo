/**
 * Configuration Service
 * =====================
 * Centralized service for fetching system configurations from the database
 * with in-memory caching to minimize database queries.
 * 
 * Replaces hardcoded configurations in lib/config/models.ts
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { LLMModelConfig } from '@/lib/config/models'

// Cache duration: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000

// In-memory cache
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Clear all cached configurations
 */
export function clearConfigCache(): void {
  cache.clear()
  console.log('🗑️ Configuration cache cleared')
}

/**
 * Clear specific cache key
 */
export function clearCacheKey(key: string): void {
  cache.delete(key)
  console.log(`🗑️ Cache key '${key}' cleared`)
}

/**
 * Get cached data or fetch from database
 */
async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }
  
  const data = await fetcher()
  
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
  
  return data
}

// =============================================================================
// SYSTEM PROMPTS CONFIGURATION
// =============================================================================

export type PromptType =
  | 'query_run'
  | 'prompt_generation'
  | 'prompt_scoring'
  | 'brand_intelligence'
  // Analysis agent prompts:
  | 'analysis_brand_detector'
  | 'analysis_sentiment'
  | 'analysis_citation'
  | 'analysis_topic'
  // Per-sub-agent prompts (sub_agent_{id}):
  | `sub_agent_${string}`
  // Backward-compat aliases (resolved at runtime):
  | 'consumer_simulation'
  | 'consumer_run'
  | 'prompt_generation_onboarding'
  | 'prompt_generation_dashboard'
  | 'prompt_generation_full'
  | 'prompt_generation_legacy'

export type PromptRole = 'system' | 'user'

export interface SystemPromptConfig {
  id: string
  prompt_type: string
  role: PromptRole
  name: string
  description: string
  content: string
  variables: string[]
  is_active: boolean
  version: number
}

// Map legacy aliases to canonical DB prompt_type values
function resolvePromptType(promptType: string): string {
  switch (promptType) {
    case 'consumer_simulation':
    case 'consumer_run':
      return 'query_run'
    case 'prompt_generation_onboarding':
    case 'prompt_generation_dashboard':
    case 'prompt_generation_full':
    case 'prompt_generation_legacy':
      return 'prompt_generation'
    default:
      return promptType
  }
}

/**
 * Fetch a prompt by type and role (replaces hardcoded prompts)
 */
export async function getSystemPrompt(
  promptType: PromptType,
  role: PromptRole = 'system'
): Promise<string> {
  const dbType = resolvePromptType(promptType)
  return getCached(`system_prompt_${dbType}_${role}`, async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('prompt_type', dbType)
      .eq('role', role)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      console.warn(`⚠️ Prompt '${dbType}' [${role}] not found in database, using fallback`)
      return getDefaultSystemPrompt(promptType)
    }
    
    return data.content
  })
}

/**
 * Fetch both system and user prompts for a prompt type
 */
export async function getPromptPair(
  promptType: PromptType
): Promise<{ system: string; user: string | null }> {
  const [system, user] = await Promise.all([
    getSystemPrompt(promptType, 'system'),
    getSystemPrompt(promptType, 'user').catch(() => null)
  ])
  return { system, user }
}

/**
 * Fetch all system prompts (both system and user roles)
 */
export async function getAllSystemPrompts(): Promise<SystemPromptConfig[]> {
  return getCached('all_system_prompts', async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('prompt_type', { ascending: true })
      .order('role', { ascending: true })
    
    if (error) {
      console.error('Error fetching system prompts:', error)
      throw new Error(`Failed to fetch system prompts: ${error.message}`)
    }
    
    return data || []
  })
}

/**
 * Default system prompts (fallback when database is empty)
 */
function getDefaultSystemPrompt(promptType: PromptType): string {
  const resolved = resolvePromptType(promptType)
  const defaults: Record<string, string> = {
    query_run: `You are {model_name}. Respond exactly as you would in your consumer application.

CRITICAL INSTRUCTIONS:
1. ANSWER DIRECTLY: Start with the answer immediately. No "Based on my search" or "Here is what I found".
2. CITE EVERYTHING: Use inline citations [1], [2] for every fact.
3. STRUCTURE: Use Markdown. ## Headings, **Bold** for key terms, and numbered lists.
4. NO FLUFF: Be concise. No filler sentences.
5. SOURCES: End with a "Sources" section listing full URLs.`,
    
    prompt_generation: `You are an expert at generating high-intent consumer search queries.

Given a brand context, generate authentic queries that real consumers would use.
Make queries natural, varied, and representative of real consumer behavior.`,
    
    prompt_scoring: `You are an expert at evaluating user prompts for commercial intent and quality.

SCORING CRITERIA (0-10 scale):
1. Intent Strength: How likely to lead to business action
2. Consumer Naturalness: How realistic and natural the prompt sounds
3. Market Relevance: How well it fits the brand category and target markets
4. Conversion Potential: Likelihood to influence purchase/engagement decisions

Be precise and consistent in scoring.`,
    
    brand_intelligence: `You are an expert brand researcher.

Analyze the provided brand information and extract:
1. Key value propositions
2. Target audience characteristics
3. Competitive positioning
4. Industry context
5. Relevant search terms consumers would use`
  }
  
  return defaults[resolved] || defaults.query_run
}

// =============================================================================
// RUN SETTINGS CONFIGURATION
// =============================================================================

export interface RunConfig {
  id?: string
  concurrency_limit: number
  timeout_ms: number
  temperature: number
  max_tokens: number
  default_period_days: number
  retry_attempts: number
  retry_delay_ms: number
  rate_limit_rpm: number
  cost_tracking_enabled: boolean
  is_active: boolean
}

const DEFAULT_RUN_CONFIG: RunConfig = {
  concurrency_limit: 3,
  timeout_ms: 120000,
  temperature: 0.7,
  max_tokens: 8000,
  default_period_days: 30,
  retry_attempts: 3,
  retry_delay_ms: 1000,
  rate_limit_rpm: 100,
  cost_tracking_enabled: true,
  is_active: true
}

/**
 * Fetch run configuration (replaces hardcoded settings)
 */
export async function getRunConfig(): Promise<RunConfig> {
  return getCached('run_config', async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('run_config')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      console.warn('⚠️ Run config not found in database, using defaults')
      return DEFAULT_RUN_CONFIG
    }
    
    return {
      id: data.id,
      concurrency_limit: data.concurrency_limit ?? DEFAULT_RUN_CONFIG.concurrency_limit,
      timeout_ms: data.timeout_ms ?? DEFAULT_RUN_CONFIG.timeout_ms,
      temperature: Number(data.temperature ?? DEFAULT_RUN_CONFIG.temperature),
      max_tokens: data.max_tokens ?? DEFAULT_RUN_CONFIG.max_tokens,
      default_period_days: data.default_period_days ?? DEFAULT_RUN_CONFIG.default_period_days,
      retry_attempts: data.retry_attempts ?? DEFAULT_RUN_CONFIG.retry_attempts,
      retry_delay_ms: data.retry_delay_ms ?? DEFAULT_RUN_CONFIG.retry_delay_ms,
      rate_limit_rpm: data.rate_limit_rpm ?? DEFAULT_RUN_CONFIG.rate_limit_rpm,
      cost_tracking_enabled: data.cost_tracking_enabled ?? DEFAULT_RUN_CONFIG.cost_tracking_enabled,
      is_active: true
    }
  })
}

// =============================================================================
// LLM MODELS CONFIGURATION
// =============================================================================

/**
 * Fetch all active LLM models (replaces AVAILABLE_MODELS)
 */
export async function getAvailableLLMModels(): Promise<LLMModelConfig[]> {
  return getCached('llm_models', async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('llm_model_configs')
      .select('*')
      .eq('is_active', true)
      .eq('purpose', 'query_run')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching LLM models:', error)
      throw new Error(`Failed to fetch LLM models: ${error.message}`)
    }
    
    // Map database schema to LLMModelConfig interface
    return (data || []).map(model => ({
      id: model.model_id,
      name: model.name,
      provider: model.provider,
      tier: model.tier as 'growth' | 'pro' | 'enterprise',
      tiers: model.tiers || [model.tier], // Support multi-tier
      openRouterId: model.openrouter_id,
      description: model.description || undefined,
      maxTokens: model.max_tokens,
      temperature: Number(model.temperature),
      supports_search: model.supports_search,
      supports_reasoning: model.supports_reasoning,
      supports_citations: model.supports_citations,
      rate_limit_rpm: model.rate_limit_rpm,
      timeout_ms: model.timeout_ms,
      cost_per_token: Number(model.cost_per_token),
      input_cost_per_million: Number(model.input_cost_per_million || 0),
      output_cost_per_million: Number(model.output_cost_per_million || 0),
      consumer_behavior: model.consumer_behavior
    }))
  })
}

/**
 * Fetch LLM models by tier
 */
export async function getLLMModelsByTier(tier: 'growth' | 'pro' | 'enterprise'): Promise<LLMModelConfig[]> {
  const allModels = await getAvailableLLMModels()
  
  // Include all models that have this tier in their tiers array
  // OR models where their tier hierarchy is at or below the requested tier
  const tierHierarchy = ['growth', 'pro', 'enterprise']
  const tierIndex = tierHierarchy.indexOf(tier)
  
  return allModels.filter(model => {
    // Check if model has this tier in its tiers array (multi-tier support)
    const modelTiers = (model as any).tiers || [model.tier]
    if (modelTiers.some((t: string) => tierHierarchy.indexOf(t) <= tierIndex)) {
      return true
    }
    // Fallback: check legacy single tier
    const modelTierIndex = tierHierarchy.indexOf(model.tier)
    return modelTierIndex <= tierIndex
  })
}

/**
 * Agent model configuration
 */
export interface AgentModelConfig {
  agent_type: string
  model_id: string
  provider: 'openai' | 'groq' | 'openrouter'
  temperature: number
  max_tokens: number
}

/**
 * Fetch agent model config by type
 */
export async function getAgentModelConfig(agentType: string): Promise<AgentModelConfig | null> {
  return getCached(`agent_${agentType}`, async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('agent_model_configs')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error(`Error fetching agent config for ${agentType}:`, error)
      return null
    }
    
    return {
      agent_type: data.agent_type,
      model_id: data.model_id,
      provider: data.provider as 'openai' | 'groq' | 'openrouter',
      temperature: Number(data.temperature),
      max_tokens: data.max_tokens
    }
  })
}

/**
 * Fetch all agent model configs
 */
export async function getAllAgentModelConfigs(): Promise<AgentModelConfig[]> {
  return getCached('all_agent_configs', async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('agent_model_configs')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching agent configs:', error)
      throw new Error(`Failed to fetch agent configs: ${error.message}`)
    }
    
    return (data || []).map(config => ({
      agent_type: config.agent_type,
      model_id: config.model_id,
      provider: config.provider as 'openai' | 'groq' | 'openrouter',
      temperature: Number(config.temperature),
      max_tokens: config.max_tokens
    }))
  })
}

/**
 * Fetch plan model limits (replaces PLAN_LIMITS)
 */
export async function getPlanModelLimits(): Promise<Record<string, number>> {
  return getCached('plan_limits', async () => {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('plan_model_limits')
      .select('*')
    
    if (error) {
      console.error('Error fetching plan limits:', error)
      throw new Error(`Failed to fetch plan limits: ${error.message}`)
    }
    
    const limits: Record<string, number> = {}
    for (const limit of data || []) {
      limits[limit.plan_slug] = limit.max_models
    }
    
    return limits
  })
}

/**
 * Get model limit for a specific plan
 */
export async function getPlanModelLimit(planSlug: string): Promise<number> {
  const limits = await getPlanModelLimits()
  return limits[planSlug] || 3 // Default to growth plan limit
}

/**
 * Get default models for a plan tier
 */
export async function getDefaultModelsForPlan(tier: 'growth' | 'pro' | 'enterprise'): Promise<string[]> {
  const models = await getLLMModelsByTier(tier)
  const limit = await getPlanModelLimit(tier)
  
  // Return the first N models based on sort order
  return models.slice(0, limit).map(m => m.id)
}
