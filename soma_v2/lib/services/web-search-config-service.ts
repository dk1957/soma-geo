/**
 * Web Search Configuration Service
 * ---------------------------------
 * Fetches and applies web search settings for each LLM model
 * Supports OpenRouter's Responses API and :online suffix
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface WebSearchConfig {
  model_id: string
  provider: string
  web_search_enabled: boolean
  search_engine: 'auto' | 'native' | 'exa'
  max_results: number
  search_context_size: 'low' | 'medium' | 'high'
  use_online_suffix: boolean
  use_responses_api: boolean
  custom_search_prompt: string | null
  is_active: boolean
}

export interface OpenRouterWebSearchOptions {
  enabled: boolean
  engine?: 'native' | 'exa'
  max_results?: number
  search_prompt?: string
  search_context_size?: 'low' | 'medium' | 'high'
  use_online_suffix?: boolean
  use_responses_api?: boolean
}

class WebSearchConfigService {
  private static instance: WebSearchConfigService
  private configCache: Map<string, WebSearchConfig> = new Map()
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private lastCacheUpdate: number = 0

  private constructor() {}

  static getInstance(): WebSearchConfigService {
    if (!WebSearchConfigService.instance) {
      WebSearchConfigService.instance = new WebSearchConfigService()
    }
    return WebSearchConfigService.instance
  }

  /**
   * Get web search configuration for a specific model
   */
  async getConfigForModel(modelId: string): Promise<WebSearchConfig | null> {
    // Refresh cache if expired
    if (Date.now() - this.lastCacheUpdate >= this.cacheExpiry || this.configCache.size === 0) {
      await this.refreshCache()
    }

    // 1. Exact match (e.g., "openai/gpt-4o-mini" matches "openai/gpt-4o-mini")
    if (this.configCache.has(modelId)) {
      return this.configCache.get(modelId) || null
    }

    // 2. Flexible fallback: extract model family from OpenRouter ID
    //    e.g., "openai/gpt-5.4-mini" → after "/" = "gpt-5.4-mini" → matches config key "gpt"
    //    e.g., "x-ai/grok-4.1-fast" → after "/" = "grok-4.1-fast" → matches config key "grok"
    const afterSlash = modelId.includes('/') ? modelId.split('/').pop()! : modelId
    for (const [key, config] of this.configCache.entries()) {
      if (afterSlash.startsWith(key)) {
        return config
      }
    }

    return null
  }

  /**
   * Get all web search configurations
   */
  async getAllConfigs(): Promise<WebSearchConfig[]> {
    if (this.configCache.size === 0 || Date.now() - this.lastCacheUpdate >= this.cacheExpiry) {
      await this.refreshCache()
    }

    return Array.from(this.configCache.values())
  }

  /**
   * Refresh the configuration cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const supabase = createServiceClient()
      
      const { data, error } = await supabase
        .from('web_search_config')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching web search configs:', error)
        return
      }

      // Update cache
      this.configCache.clear()
      if (data) {
        for (const config of data) {
          this.configCache.set(config.model_id, config)
        }
      }

      this.lastCacheUpdate = Date.now()
      console.log(`✅ Web search config cache refreshed: ${this.configCache.size} models`)
    } catch (error) {
      console.error('Error refreshing web search config cache:', error)
    }
  }

  /**
   * Get OpenRouter options for a model
   * Returns null if web search is disabled for the model
   */
  async getOpenRouterOptions(modelId: string): Promise<OpenRouterWebSearchOptions | null> {
    const config = await this.getConfigForModel(modelId)
    
    if (!config || !config.web_search_enabled) {
      return null
    }

    return {
      enabled: true,
      engine: config.search_engine === 'auto' ? undefined : config.search_engine,
      max_results: config.max_results,
      search_prompt: config.custom_search_prompt || undefined,
      search_context_size: config.search_context_size,
      use_online_suffix: config.use_online_suffix,
      use_responses_api: config.use_responses_api
    }
  }

  /**
   * Apply web search options to model ID
   * Appends :online suffix if configured
   */
  applyOnlineSuffix(modelId: string, config: WebSearchConfig | null): string {
    if (!config || !config.web_search_enabled || !config.use_online_suffix) {
      return modelId
    }

    // Don't add :online if already present
    if (modelId.includes(':online')) {
      return modelId
    }

    return `${modelId}:online`
  }

  /**
   * Build plugins array for OpenRouter Responses API
   */
  buildWebSearchPlugin(config: WebSearchConfig | null): any[] {
    if (!config || !config.web_search_enabled || !config.use_responses_api) {
      return []
    }

    const plugin: any = {
      id: 'web',
      max_results: config.max_results
    }

    // Add engine if not auto
    if (config.search_engine !== 'auto') {
      plugin.engine = config.search_engine
    }

    // Add custom search prompt if provided
    if (config.custom_search_prompt) {
      plugin.search_prompt = config.custom_search_prompt
    }

    return [plugin]
  }

  /**
   * Build web search options for Chat Completions API (legacy)
   */
  buildChatCompletionOptions(config: WebSearchConfig | null): any {
    if (!config || !config.web_search_enabled) {
      return {}
    }

    const options: any = {}

    // Add web_search_options for native search
    if (config.search_engine === 'native' && config.search_context_size) {
      options.web_search_options = {
        search_context_size: config.search_context_size
      }
    }

    return options
  }

  /**
   * Clear the cache (useful for testing or after updates)
   */
  clearCache(): void {
    this.configCache.clear()
    this.lastCacheUpdate = 0
  }
}

// Export singleton instance
export const webSearchConfigService = WebSearchConfigService.getInstance()

/**
 * Helper function to get web search config for a model
 */
export async function getWebSearchConfig(modelId: string): Promise<WebSearchConfig | null> {
  return webSearchConfigService.getConfigForModel(modelId)
}

/**
 * Helper function to get OpenRouter options
 */
export async function getWebSearchOptions(modelId: string): Promise<OpenRouterWebSearchOptions | null> {
  return webSearchConfigService.getOpenRouterOptions(modelId)
}
