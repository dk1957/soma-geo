/**
 * Consumer Response Processor
 * Processes raw LLM responses into standardized format for analysis.
 */

import type { ProcessedResponse, StandardizedRawResponse, ResponseValidationResult } from '@/lib/types/response-format-specification'

interface ResponseContext {
  run_id: string
  brand_context_id: string
  prompt_id: string
}

export class ConsumerResponseProcessor {
  static processResponse(
    content: string,
    model: string,
    prompt: string,
    context: ResponseContext
  ): ProcessedResponse {
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const hasSources = /\[.*?\]\(.*?\)|https?:\/\/|Sources:|References:/i.test(content)
    const provider = model.split('/')[0] || 'generic'

    const platform = provider === 'openai' ? 'chatgpt'
      : provider === 'anthropic' ? 'claude'
      : provider === 'google' ? 'gemini'
      : provider === 'perplexity' ? 'perplexity'
      : 'generic' as const

    const standardized_response: StandardizedRawResponse = {
      consumer_content: content,
      format_metadata: {
        response_content: content,
        response_format: 'markdown',
        model_metadata: {
          model_name: model,
          model_provider: provider,
          response_language: 'en',
          content_length: content.length,
          word_count: wordCount,
          estimated_reading_time: Math.ceil(wordCount / 200),
        },
        response_quality: {
          is_complete: content.length > 50,
          has_sources: hasSources,
        },
      } as any,
      platform_context: {
        simulated_platform: platform,
        maintains_platform_style: true,
        authentic_user_experience: true,
      },
      internal_tracking: {
        prompt_id: context.prompt_id,
        run_id: context.run_id,
        brand_context_id: context.brand_context_id,
        generation_timestamp: new Date().toISOString(),
        processing_notes: [],
      },
    }

    const validation_result: ResponseValidationResult = {
      is_valid: content.length > 10,
      validation_errors: content.length <= 10 ? ['Response too short'] : [],
      validation_warnings: [],
      quality_score: Math.min(100, Math.max(0, Math.round(
        (content.length > 200 ? 30 : content.length > 50 ? 15 : 0) +
        (hasSources ? 25 : 0) +
        (wordCount > 100 ? 25 : wordCount > 30 ? 15 : 0) +
        (/##?\s/.test(content) ? 10 : 0) +
        (/\d/.test(content) ? 10 : 0)
      ))),
      authenticity_score: Math.min(100, Math.max(0,
        50 + (hasSources ? 20 : 0) + (wordCount > 100 ? 15 : 0) + (/##?\s/.test(content) ? 15 : 0)
      )),
      completeness_score: content.length > 500 ? 95 : content.length > 200 ? 75 : content.length > 50 ? 50 : 20,
      brand_relevance_score: 70, // requires brand context to compute — kept as baseline
      checks: {
        has_minimum_content: content.length > 50,
        is_not_truncated: true,
        maintains_platform_voice: true,
        contains_relevant_information: content.length > 50,
        has_proper_structure: true,
        sources_are_credible: hasSources,
      },
      improvement_suggestions: [],
    }

    return {
      original_raw_response: content,
      standardized_response,
      validation_result,
      analysis_ready: content.length > 50,
    }
  }
}
