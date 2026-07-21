/**
 * Agent Core
 * ==========
 * Core execution framework for AI analysis agents.
 * Handles config loading, retries, metrics tracking, and error handling.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { getAgentModel } from './provider'
import { getAgentModelConfig } from '@/lib/services/config-service'
import { getSystemPrompt } from '@/lib/services/config-service'
import type { AgentConfig, AgentResult, AnalysisAgentType, AgentRunMetrics } from './types'

/** Default config used when DB config is unavailable */
const DEFAULT_CONFIGS: Record<string, AgentConfig> = {
  analysis_brand_detector: {
    agent_type: 'analysis_brand_detector',
    model_id: 'google/gemini-2.0-flash-001',
    provider: 'openrouter',
    temperature: 0.05,
    max_tokens: 2000,
  },
  analysis_sentiment: {
    agent_type: 'analysis_sentiment',
    model_id: 'google/gemini-2.0-flash-001',
    provider: 'openrouter',
    temperature: 0.05,
    max_tokens: 1500,
  },
  analysis_citation: {
    agent_type: 'analysis_citation',
    model_id: 'google/gemini-2.0-flash-001',
    provider: 'openrouter',
    temperature: 0.05,
    max_tokens: 2000,
  },
  analysis_topic: {
    agent_type: 'analysis_topic',
    model_id: 'google/gemini-2.0-flash-001',
    provider: 'openrouter',
    temperature: 0.15,
    max_tokens: 1500,
  },
}

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500

/**
 * Load agent configuration from DB with fallback to defaults.
 */
export async function loadAgentConfig(agentType: AnalysisAgentType): Promise<AgentConfig> {
  try {
    const dbConfig = await getAgentModelConfig(agentType)
    if (dbConfig) {
      return {
        agent_type: dbConfig.agent_type,
        model_id: dbConfig.model_id,
        provider: dbConfig.provider,
        temperature: dbConfig.temperature,
        max_tokens: dbConfig.max_tokens,
      }
    }
  } catch (err) {
    console.warn(`[Agent] Failed to load config for ${agentType}, using default:`, err)
  }

  const fallback = DEFAULT_CONFIGS[agentType]
  if (!fallback) {
    throw new Error(`No configuration available for agent type: ${agentType}`)
  }
  return fallback
}

/**
 * Execute an AI agent with structured output, retries, and metrics.
 *
 * @param agentType  - The agent type (used to load config from DB)
 * @param schema     - Zod schema for the output structure
 * @param system     - System prompt defining the agent's role (fallback if DB prompt not found)
 * @param prompt     - User prompt with the data to analyze
 * @param responseId - The response ID being processed (for metrics)
 */
export async function executeAgent<T extends z.ZodType>(
  agentType: AnalysisAgentType,
  schema: T,
  system: string,
  prompt: string,
  responseId: string,
): Promise<AgentResult<z.infer<T>>> {
  const startTime = Date.now()
  const config = await loadAgentConfig(agentType)

  // Try loading system prompt from DB; fall back to the hardcoded one passed in
  // Priority: per-sub-agent prompt → system-level shared prompt → hardcoded fallback
  let resolvedSystem = system
  try {
    // First try per-sub-agent prompt (e.g., sub_agent_analysis_brand_detector)
    const subAgentPrompt = await getSystemPrompt(`sub_agent_${agentType}`, 'system')
    if (subAgentPrompt && subAgentPrompt.length > 50) {
      resolvedSystem = subAgentPrompt
    } else {
      // Fall back to system-level shared prompt
      const dbPrompt = await getSystemPrompt(agentType as any, 'system')
      if (dbPrompt && dbPrompt.length > 50) {
        resolvedSystem = dbPrompt
      }
    }
  } catch {
    // DB prompt not found — use the hardcoded fallback
  }

  let lastError: string | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(`[Agent:${agentType}] Retry ${attempt}/${MAX_RETRIES} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const model = getAgentModel(config.model_id)

      const result = await generateObject({
        model,
        schema,
        output: 'object' as const,
        system: resolvedSystem,
        prompt,
        temperature: config.temperature,
        maxOutputTokens: config.max_tokens,
      })

      const durationMs = Date.now() - startTime

      // Log metrics
      const metrics: AgentRunMetrics = {
        agent_type: agentType,
        model_id: config.model_id,
        response_id: responseId,
        duration_ms: durationMs,
        prompt_tokens: result.usage?.inputTokens ?? 0,
        completion_tokens: result.usage?.outputTokens ?? 0,
        success: true,
        created_at: new Date().toISOString(),
      }
      logAgentMetrics(metrics)

      return {
        success: true,
        data: result.object as z.infer<T>,
        agentType,
        modelId: config.model_id,
        durationMs,
        tokenUsage: result.usage
          ? {
              promptTokens: result.usage.inputTokens ?? 0,
              completionTokens: result.usage.outputTokens ?? 0,
              totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
            }
          : undefined,
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      // Log full error details for debugging provider issues
      if (err && typeof err === 'object') {
        const errObj = err as any
        const details: string[] = []
        if ('cause' in errObj && errObj.cause !== undefined) {
          const cause = errObj.cause
          details.push(`cause: ${cause instanceof Error ? cause.message : JSON.stringify(cause)}`)
        }
        if ('responseBody' in errObj) details.push(`body: ${JSON.stringify(errObj.responseBody)?.substring(0, 500)}`)
        if ('data' in errObj) details.push(`data: ${JSON.stringify(errObj.data)?.substring(0, 500)}`)
        if ('statusCode' in errObj) details.push(`status: ${errObj.statusCode}`)
        if ('url' in errObj) details.push(`url: ${errObj.url}`)
        if ('requestBodyValues' in errObj) details.push(`reqBody: (present)`)
        // If no details extracted, dump all enumerable keys
        if (details.length === 0) {
          const keys = Object.keys(errObj)
          details.push(`keys: [${keys.join(',')}]`)
          for (const key of keys.filter(k => k !== 'stack' && k !== 'message')) {
            try { details.push(`${key}: ${JSON.stringify(errObj[key])?.substring(0, 200)}`) } catch {}
          }
        }
        console.error(`[Agent:${agentType}] Attempt ${attempt + 1} failed:`, lastError, '|', details.join(' | '))
      } else {
        console.error(`[Agent:${agentType}] Attempt ${attempt + 1} failed:`, lastError)
      }

      // Schema generation mismatches are non-deterministic — retry them.
      // Only skip retries on hard errors like auth failures or rate limits.
      if (lastError.includes('401') || lastError.includes('403')) {
        break
      }
    }
  }

  const durationMs = Date.now() - startTime

  // Log failure metrics
  const metrics: AgentRunMetrics = {
    agent_type: agentType,
    model_id: config.model_id,
    response_id: responseId,
    duration_ms: durationMs,
    prompt_tokens: 0,
    completion_tokens: 0,
    success: false,
    error: lastError,
    created_at: new Date().toISOString(),
  }
  logAgentMetrics(metrics)

  return {
    success: false,
    data: null,
    agentType,
    modelId: config.model_id,
    durationMs,
    error: lastError,
  }
}

/**
 * Log agent execution metrics to console and database.
 */
async function logAgentMetrics(metrics: AgentRunMetrics): Promise<void> {
  const status = metrics.success ? '✅' : '❌'
  const tokens = metrics.prompt_tokens + metrics.completion_tokens
  console.log(
    `[Agent Metrics] ${status} ${metrics.agent_type} | ` +
    `${metrics.duration_ms}ms | ${tokens} tokens | ` +
    `model=${metrics.model_id}` +
    (metrics.error ? ` | error=${metrics.error.substring(0, 100)}` : '')
  )

  // Write to agent_run_metrics table (non-blocking, fire-and-forget)
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    await supabase.from('agent_run_metrics').insert({
      agent_type: metrics.agent_type,
      model_id: metrics.model_id,
      response_id: metrics.response_id,
      duration_ms: metrics.duration_ms,
      prompt_tokens: metrics.prompt_tokens,
      completion_tokens: metrics.completion_tokens,
      success: metrics.success,
      error: metrics.error?.substring(0, 500) || null,
    })
  } catch (err) {
    // Non-fatal: metric logging should never block the pipeline
    console.warn('[Agent Metrics] Failed to write metrics to DB:', err)
  }
}

/**
 * Check if a specific analysis skill is enabled.
 * Reads from the agent_skills table.
 */
export async function isSkillEnabled(skillKey: string): Promise<boolean> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('agent_skills')
      .select('is_enabled')
      .eq('agent_system', 'analysis')
      .eq('skill_key', skillKey)
      .single()

    return data?.is_enabled ?? true // Default to enabled if not found
  } catch {
    return true // Default to enabled on error
  }
}
