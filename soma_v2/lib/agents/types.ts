/**
 * Agent Types
 * ===========
 * Shared types for the AI analysis agent system.
 */

/** Agent type identifiers matching agent_model_configs.agent_type */
export type AnalysisAgentType =
  | 'analysis_brand_detector'
  | 'analysis_sentiment'
  | 'analysis_citation'
  | 'analysis_topic'

/** Configuration loaded from agent_model_configs table */
export interface AgentConfig {
  agent_type: string
  model_id: string
  provider: 'openai' | 'groq' | 'openrouter'
  temperature: number
  max_tokens: number
}

/** Brand context passed to agents */
export interface AgentBrandContext {
  primaryBrand: {
    id: string
    name: string
    aliases: string[]
    domain: string | null
  }
  competitors: {
    id: string
    name: string
    domain: string | null
    linked_brand_id: string | null
  }[]
}

/** Result from a single agent execution */
export interface AgentResult<T> {
  success: boolean
  data: T | null
  agentType: AnalysisAgentType
  modelId: string
  durationMs: number
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

/** Metrics tracked per agent run for admin visibility */
export interface AgentRunMetrics {
  agent_type: string
  model_id: string
  response_id: string
  duration_ms: number
  prompt_tokens: number
  completion_tokens: number
  success: boolean
  error?: string
  created_at: string
}

/**
 * Agent System Types (for Admin Config UI)
 * =========================================
 * New types for the redesigned agent configuration interface
 */

/** Prompt version with content and metadata */
export interface AgentPrompt {
  id: string
  type: "system" | "user"
  content: string
  version: number
  created_at: string
  updated_at: string
}

/** Sub-agent configuration */
export interface SubAgent {
  id: string
  system_id: string
  name: string
  role?: string
  description?: string
  enabled: boolean
  model?: string
  temperature?: number
  max_tokens?: number
  skills?: string[]
  /** Per-sub-agent prompts (system + user) */
  prompts?: AgentPrompt[]
  /** Skill feature flags specific to this sub-agent */
  skill_flags?: SubAgentSkillFlag[]
  created_at: string
  updated_at: string
}

/** Skill feature flag for a sub-agent */
export interface SubAgentSkillFlag {
  skill_key: string
  label: string
  enabled: boolean
  description?: string
}

/** Content type option for the content pipeline */
export interface ContentTypeOption {
  value: string
  label: string
  description?: string
  enabled: boolean
}

/** Optimization strategy option */
export interface OptimizationStrategyOption {
  value: string
  label: string
  description: string
  time_estimate: string
  enabled: boolean
}

/** Execution settings for the content pipeline */
export interface ContentExecutionSettings {
  max_iterations: { value: number; min: number; max: number; description: string }
  convergence_threshold: { value: number; min: number; max: number; description: string }
  plateau_window: { value: number; min: number; max: number; description: string }
  num_queries: { value: number; min: number; max: number; description: string }
}

/** Content pipeline configuration (attached to content system) */
export interface ContentPipelineConfig {
  content_types: ContentTypeOption[]
  optimization_strategies: OptimizationStrategyOption[]
  execution_settings: ContentExecutionSettings
}

/** Complete agent system configuration */
export interface AgentSystem {
  id: string
  name: string
  codename: string
  description?: string
  enabled: boolean
  sub_agents?: SubAgent[]
  prompts?: AgentPrompt[]
  /** Content pipeline config (content system only) */
  pipeline_config?: ContentPipelineConfig
  created_at: string
  updated_at: string
}
