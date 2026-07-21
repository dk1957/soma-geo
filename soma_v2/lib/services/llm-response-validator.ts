/**
 * LLM Response Validator
 * Validates batch responses for quality before storage.
 */

export interface ValidationResult {
  validResponses: any[]
  invalidResponses: any[]
  summary: {
    total: number
    valid: number
    invalid: number
    avgQualityScore: number
  }
}

class LLMResponseValidator {
  async validateBatch(responses: any[]): Promise<ValidationResult> {
    const validResponses: any[] = []
    const invalidResponses: any[] = []

    for (const response of responses) {
      const content = response?.raw_response || response?.response_content || response?.content || ''
      const isValid = typeof content === 'string' && content.trim().length > 10

      if (isValid) {
        validResponses.push(response)
      } else {
        invalidResponses.push(response)
      }
    }

    const avgQualityScore = validResponses.length > 0
      ? Math.round(validResponses.reduce((sum, r) => {
          const content = r?.raw_response || r?.response_content || r?.content || ''
          const len = content.length
          // Score: 0-100 based on content length (>2000 chars = 100)
          return sum + Math.min(100, Math.round((len / 2000) * 100))
        }, 0) / validResponses.length)
      : 0

    return {
      validResponses,
      invalidResponses,
      summary: {
        total: responses.length,
        valid: validResponses.length,
        invalid: invalidResponses.length,
        avgQualityScore,
      },
    }
  }
}

export const llmResponseValidator = new LLMResponseValidator()
