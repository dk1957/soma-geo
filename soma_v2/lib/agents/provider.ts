/**
 * AI Agent Provider
 * =================
 * Configures the Vercel AI SDK provider for OpenRouter.
 * All analysis agents use this centralized provider instance.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

/**
 * Create an OpenRouter provider for the Vercel AI SDK.
 * Uses OPENROUTER_API_KEY from environment.
 */
export function createOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required for AI agents')
  }

  return createOpenAICompatible({
    name: 'openrouter',
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      'HTTP-Referer': process.env.APP_URL || 'https://soma.ai',
      'X-Title': 'Soma AI - AEO Analysis Agents',
    },
    supportsStructuredOutputs: true,
  })
}

/**
 * Get a model instance for a specific model ID via OpenRouter.
 */
export function getAgentModel(modelId: string) {
  const provider = createOpenRouterProvider()
  return provider.chatModel(modelId)
}
