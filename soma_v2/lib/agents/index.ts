/**
 * AI Analysis Agents
 * ==================
 * Public API for the AEO analysis agent system.
 */

// Core framework
export { executeAgent, loadAgentConfig, isSkillEnabled } from './core'
export { getAgentModel, createOpenRouterProvider } from './provider'

// Schemas
export {
  BrandDetectionOutputSchema,
  SentimentOutputSchema,
  CitationOutputSchema,
  TopicOutputSchema,
  BrandTopicOutputSchema,
  BrandTopicAssociationSchema,
} from './schemas'

export type {
  BrandDetectionOutput,
  SentimentOutput,
  CitationOutput,
  TopicOutput,
  BrandTopicOutput,
  BrandTopicAssociation,
} from './schemas'

// Types
export type {
  AnalysisAgentType,
  AgentConfig,
  AgentBrandContext,
  AgentResult,
  AgentRunMetrics,
} from './types'

// Specialized agents
export { runBrandDetectionAgent } from './analysis/brand-detection-agent'
export { runSentimentAgent } from './analysis/sentiment-agent'
export { runCitationAgent } from './analysis/citation-agent'
export { runTopicAgent, runBrandTopicAgent } from './analysis/topic-agent'

// Orchestrator
export {
  orchestrateAnalysis,
  type OrchestrationResult,
  type OrchestratedBrandFact,
  type OrchestratedCitation,
  type OrchestratedTopic,
  type OrchestratedBrandTopicAssociation,
} from './orchestrator'
