
export interface LLMModelConfig {
  id: string
  name: string
  provider: string
  tier: 'growth' | 'pro' | 'enterprise'
  openRouterId: string
  description?: string
  // Orchestrator config
  maxTokens: number
  temperature: number
  supports_search: boolean
  supports_reasoning: boolean
  supports_citations: boolean
  rate_limit_rpm: number
  timeout_ms: number
  cost_per_token: number
  consumer_behavior: string
}

export const AVAILABLE_MODELS: LLMModelConfig[] = [
  // Growth Plan Models (First 3)
  { 
    id: 'grok', 
    name: 'X AI (Grok)', 
    provider: 'x-ai', 
    tier: 'growth',
    openRouterId: 'x-ai/grok-3-mini',
    description: 'High-speed model with real-time X platform access',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: true,
    supports_citations: true,
    rate_limit_rpm: 20,
    timeout_ms: 30000,
    cost_per_token: 0.000005,
    consumer_behavior: 'direct_and_factual'
  },
  { 
    id: 'gemini', 
    name: 'Google (Gemini)', 
    provider: 'google', 
    tier: 'growth',
    openRouterId: 'google/gemini-2.5-flash-lite',
    description: 'Fast, multimodal model with Google Search integration',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: true,
    supports_citations: true,
    rate_limit_rpm: 40,
    timeout_ms: 30000,
    cost_per_token: 0.0000003,
    consumer_behavior: 'comprehensive_with_sources'
  },
  { 
    id: 'gpt', 
    name: 'OpenAI (GPT)', 
    provider: 'openai', 
    tier: 'growth',
    openRouterId: 'openai/gpt-4o',
    description: 'Advanced reasoning and general knowledge',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: false,
    supports_citations: true,
    rate_limit_rpm: 30,
    timeout_ms: 30000,
    cost_per_token: 0.0000025,
    consumer_behavior: 'search_and_synthesize'
  },

  // Pro Plan Models (First 4 = Growth + Perplexity)
  { 
    id: 'sonar', 
    name: 'Perplexity (Sonar)', 
    provider: 'perplexity', 
    tier: 'pro',
    openRouterId: 'perplexity/sonar-reasoning-pro',
    description: 'Specialized for deep research and citations',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: true,
    supports_citations: true,
    rate_limit_rpm: 30,
    timeout_ms: 45000, // Longer timeout for deep research
    cost_per_token: 0.000001,
    consumer_behavior: 'detailed_analysis'
  },

  // Enterprise Plan Models (All 6)
  { 
    id: 'llama', 
    name: 'Meta (Llama)', 
    provider: 'meta', 
    tier: 'enterprise',
    openRouterId: 'meta-llama/llama-3.3-70b-instruct',
    description: 'Open-source leader with strong reasoning',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: true,
    supports_citations: true,
    rate_limit_rpm: 30,
    timeout_ms: 30000,
    cost_per_token: 0.0000004,
    consumer_behavior: 'detailed_analysis'
  },
  { 
    id: 'claude', 
    name: 'Anthropic (Claude)', 
    provider: 'anthropic', 
    tier: 'enterprise',
    openRouterId: 'anthropic/claude-3.5-sonnet',
    description: 'Nuanced understanding and high-quality writing',
    maxTokens: 4000,
    temperature: 0.0,
    supports_search: true,
    supports_reasoning: true,
    supports_citations: true,
    rate_limit_rpm: 30,
    timeout_ms: 30000,
    cost_per_token: 0.000003,
    consumer_behavior: 'detailed_analysis'
  }
]

export const PLAN_LIMITS = {
  growth: 3,
  pro: 4,
  enterprise: 6
}

export const DEFAULT_MODELS = {
  growth: ['grok', 'gemini', 'gpt'],
  pro: ['grok', 'gemini', 'gpt', 'sonar'],
  enterprise: ['grok', 'gemini', 'gpt', 'sonar', 'llama', 'claude']
}
