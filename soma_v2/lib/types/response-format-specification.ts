/**
 * Response Format Specification for Soma AI GEO Platform
 * ======================================================
 * 
 * This file defines the standardized format for raw responses from all LLM models
 * to ensure consistency in our Answer/Generative Engine Optimization platform.
 * 
 * CRITICAL: Raw responses must mimic exactly what users would get from consumer apps
 * like ChatGPT, Gemini, Claude, and Perplexity when searching for brand information.
 */

export interface ConsumerResponseFormat {
  // Core response content (what the user actually sees)
  response_content: string // The exact text/markdown the consumer app would show
  response_format: 'markdown' | 'plain_text' | 'structured_text'
  
  // Model metadata (for our internal analysis)
  model_metadata: {
    model_name: string
    model_provider: string
    response_language: string
    content_length: number
    word_count: number
    estimated_reading_time: number // in seconds
  }
  
  // Quality indicators
  response_quality: {
    is_complete: boolean // No truncation occurred
    has_sources: boolean // Citations/sources provided
    is_coherent: boolean // Logical flow and structure
    confidence_level: 'high' | 'medium' | 'low'
  }
  
  // Content structure analysis
  content_structure: {
    has_headings: boolean
    has_lists: boolean
    has_comparisons: boolean
    has_recommendations: boolean
    paragraph_count: number
    section_count: number
  }
  
  // Brand mention tracking (for GEO analysis)
  brand_visibility: {
    brands_mentioned: string[]
    primary_brand_mentioned: boolean
    brand_mention_positions: number[] // Character positions
    competitor_brands_found: string[]
  }
  
  // Source tracking (critical for GEO analysis)
  source_analysis: {
    sources_cited: Array<{
      url?: string
      domain?: string
      title?: string
      citation_text: string
      position_in_response: number
    }>
    authority_sources: number // Count of high-authority domains
    brand_owned_sources: number // Count of brand's own sources
  }
  
  // Response authenticity verification
  authenticity: {
    response_id: string
    generated_at: string
    prompt_hash: string // To verify which prompt generated this
    is_cached: boolean
    generation_time_ms: number
  }
}

/**
 * Consumer App Response Templates
 * ===============================
 * 
 * These templates define how responses should be formatted for each consumer app
 * to ensure we capture the authentic user experience.
 */

export interface ChatGPTResponseFormat extends ConsumerResponseFormat {
  response_format: 'markdown'
  // ChatGPT typically uses markdown with clear headings, bullet points, and numbered lists
  // Structure: Direct answer → Detailed explanation → Sources (if any)
}

export interface ClaudeResponseFormat extends ConsumerResponseFormat {
  response_format: 'structured_text'
  // Claude often uses clear sectioning with headers, thoughtful analysis
  // Structure: Context → Analysis → Recommendations → Caveats
}

export interface GeminiResponseFormat extends ConsumerResponseFormat {
  response_format: 'markdown'
  // Gemini tends to be comprehensive with tables, comparisons, and detailed citations
  // Structure: Overview → Detailed comparison → Sources with links
}

export interface PerplexityResponseFormat extends ConsumerResponseFormat {
  response_format: 'structured_text'
  // Perplexity focuses heavily on sources and citations throughout
  // Structure: Answer with inline citations → Source list
}

/**
 * Standardized Raw Response Container
 * ==================================
 * 
 * This is what gets stored in our llm_run_responses.raw_response field
 */
export interface StandardizedRawResponse {
  // The actual consumer-facing content
  consumer_content: string
  
  // Metadata about the response format and quality
  format_metadata: ConsumerResponseFormat
  
  // Platform-specific formatting preferences
  platform_context: {
    simulated_platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'generic'
    maintains_platform_style: boolean
    authentic_user_experience: boolean
  }
  
  // Internal tracking for our GEO analysis
  internal_tracking: {
    prompt_id: string
    run_id: string
    brand_context_id: string
    generation_timestamp: string
    processing_notes: string[]
  }
}

/**
 * Response Processing Pipeline
 * ===========================
 * 
 * Defines how responses should be processed to maintain consistency
 */

export interface ResponseProcessingRules {
  // Content consistency rules
  content_rules: {
    min_word_count: number // Prevent truncated responses
    max_word_count: number // Prevent excessively long responses
    require_brand_relevance: boolean
    require_sources_when_factual: boolean
    maintain_natural_language: boolean
  }
  
  // Format standardization rules
  format_rules: {
    standardize_markdown: boolean // Convert all to consistent markdown
    preserve_platform_voice: boolean // Keep ChatGPT style vs Claude style
    normalize_citations: boolean // Standardize citation formats
    clean_formatting_artifacts: boolean // Remove API artifacts
  }
  
  // Quality assurance rules
  quality_rules: {
    detect_truncation: boolean
    validate_completeness: boolean
    check_coherence: boolean
    verify_brand_mentions: boolean
    assess_source_quality: boolean
  }
}

/**
 * Model-Specific Response Expectations
 * ====================================
 * 
 * What we expect from each model to ensure authentic consumer experience
 */

export const MODEL_RESPONSE_EXPECTATIONS = {
  'openai/gpt-4': {
    typical_format: 'markdown',
    expected_features: ['clear_structure', 'balanced_analysis', 'practical_advice'],
    citation_style: 'minimal_inline',
    average_length: '300-800 words',
    tone: 'helpful_professional'
  },
  
  'anthropic/claude-3.5-haiku': {
    typical_format: 'structured_text',
    expected_features: ['thoughtful_analysis', 'nuanced_perspective', 'caveats'],
    citation_style: 'contextual_references',
    average_length: '400-1000 words',
    tone: 'analytical_balanced'
  },
  
  'google/gemini-2.5-flash': {
    typical_format: 'markdown',
    expected_features: ['comprehensive_tables', 'detailed_comparisons', 'rich_citations'],
    citation_style: 'numbered_references',
    average_length: '500-1200 words',
    tone: 'informative_comprehensive'
  },
  
  'x-ai/grok-3-mini': {
    typical_format: 'structured_text',
    expected_features: ['direct_answers', 'practical_focus', 'current_information'],
    citation_style: 'inline_links',
    average_length: '200-600 words',
    tone: 'direct_practical'
  }
} as const

/**
 * Response Validation Schema
 * =========================
 * 
 * Used to validate responses before storing and analysis
 */

export interface ResponseValidationResult {
  is_valid: boolean
  validation_errors: string[]
  validation_warnings: string[]
  quality_score: number // 0-100
  authenticity_score: number // 0-100
  completeness_score: number // 0-100
  brand_relevance_score: number // 0-100
  
  // Specific validation checks
  checks: {
    has_minimum_content: boolean
    is_not_truncated: boolean
    maintains_platform_voice: boolean
    contains_relevant_information: boolean
    has_proper_structure: boolean
    sources_are_credible: boolean
  }
  
  // Recommendations for improvement
  improvement_suggestions: string[]
}

/**
 * Export types for use throughout the application
 */
export type SupportedResponseFormat = 'markdown' | 'plain_text' | 'structured_text'
export type SupportedPlatform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'generic'
export type QualityLevel = 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Utility type for response processing
 */
export interface ProcessedResponse {
  original_raw_response: string
  standardized_response: StandardizedRawResponse
  validation_result: ResponseValidationResult
  analysis_ready: boolean
}
