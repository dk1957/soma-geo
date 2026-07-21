interface BrandContext {
  brandName: string
  competitors: string[]
  industry: string
  keyMessages: string[]
}

/**
 * Enhanced response interface for run analysis
 */
export interface EnhancedResponse {
  // Required properties - UUID converted from TEXT
  id: string // UUID: converted from text
  run_id: string // UUID: references runs.id
  prompt_id: string // UUID: converted from text, references user_prompts.id
  
  // Original response data
  model_name: string
  response_text: string
  raw_response: string
  llm_provider: string
  prompt_text?: string
  created_at?: string
  
  // Enhanced analysis
  brand_mentioned: boolean
  brand_mention_count: number
  brand_mentions: Array<{
    type: 'direct' | 'indirect' | 'category' | 'competitor'
    text: string
    context: string
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    position: number
  }>
  
  competitor_mentions: Array<{
    name: string
    mention_type: 'direct' | 'indirect'
    context: string
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    mention_count?: number
    positioning?: string
    market_position?: number
  }>
  
  // Analysis metadata
  analysis_version: string
  processing_timestamp: string
}

export class ResponseEnhancer {
  /**
   * Enhance a batch of run responses with comprehensive analysis
   */
  async enhanceResponses(
    responses: any[],
    brandContext: BrandContext,
    aiGeneratedPrompts: any[]
  ): Promise<EnhancedResponse[]> {
    console.log('🔍 Enhancing responses with brand/competitor analysis...')
    
    const enhancedResponses: EnhancedResponse[] = []
    
    for (const response of responses) {
      try {
        const enhanced = await this.enhanceSingleResponse(response, brandContext, aiGeneratedPrompts)
        enhancedResponses.push(enhanced)
      } catch (error) {
        console.error('❌ Error enhancing response:', error)
        // Fall back to basic enhancement
        enhancedResponses.push(this.createBasicEnhancement(response))
      }
    }
    
    console.log(`✅ Enhanced ${enhancedResponses.length} responses`)
    return enhancedResponses
  }

  /**
   * Enhance a single response with comprehensive analysis
   */
  async enhanceSingleResponse(
    response: any,
    brandContext: BrandContext,
    aiGeneratedPrompts: any[]
  ): Promise<EnhancedResponse> {
    const responseText = response.response_text || response.raw_response || response.text || ''
    
    // Find matching prompt
    const prompt = aiGeneratedPrompts.find(p => p.id === response.prompt_id) || { text: 'Unknown prompt' }
    
    // Perform intelligent brand and competitor analysis
    const analysis = this.performIntelligentAnalysis(responseText, brandContext)
    
    return {
      // Required properties
      id: response.id || '',
      raw_response: responseText,
      // Original data
      llm_provider: response.llm_provider || 'unknown',
      model_name: response.model_name || 'unknown',
      prompt_text: prompt.text,
      response_text: responseText,
      created_at: response.created_at || new Date().toISOString(),
      run_id: response.run_id || '',
      prompt_id: response.prompt_id || '',
      
      // Enhanced analysis
      brand_mentioned: analysis.brandMentioned,
      brand_mention_count: analysis.brandMentionCount,
      brand_mentions: analysis.brandMentions,
      
      competitor_mentions: analysis.competitorMentions || [],
      
      // Metadata
      analysis_version: '2.0.0',
      processing_timestamp: new Date().toISOString()
    }
  }

  /**
   * Create basic enhancement when all else fails
   */
  private createBasicEnhancement(response: any): EnhancedResponse {
    const responseText = response.response_text || response.raw_response || response.text || ''
    
    return {
      // Required properties
      id: response.id || '',
      raw_response: responseText,
      // Original data
      llm_provider: response.llm_provider || 'unknown',
      model_name: response.model_name || 'unknown',
      prompt_text: response.prompt_text || 'Unknown prompt',
      response_text: responseText,
      created_at: response.created_at || new Date().toISOString(),
      run_id: response.run_id || '',
      prompt_id: response.prompt_id || '',
      
      // Minimal analysis
      brand_mentioned: false,
      brand_mention_count: 0,
      brand_mentions: [],
      competitor_mentions: [],
      
      // Metadata
      analysis_version: '0.1.0-basic',
      processing_timestamp: new Date().toISOString()
    }
  }

  /**
   * Perform intelligent analysis of response text
   */
  private performIntelligentAnalysis(responseText: string, brandContext: BrandContext) {
    const textLower = responseText.toLowerCase()
    const brandNameLower = brandContext.brandName.toLowerCase()
    
    // Brand mention detection with context
    const brandRegex = new RegExp(`\\b${brandContext.brandName}\\b`, 'gi')
    const brandMatches = responseText.match(brandRegex) || []
    const brandMentioned = brandMatches.length > 0
    
    // Extract brand mention contexts
    const brandMentions = brandMatches.map((match, index) => {
      const position = responseText.toLowerCase().indexOf(brandNameLower, index > 0 ? responseText.toLowerCase().indexOf(brandNameLower) + brandNameLower.length : 0)
      const context = this.extractContext(responseText, position, 100)
      const sentiment = this.analyzeSentimentInContext(context)
      
      return {
        type: 'direct' as const,
        text: match,
        context,
        sentiment,
        confidence: 0.7,
        position: responseText.toLowerCase().indexOf(brandNameLower)
      }
    })
    
    // Detect competitors
    const competitorsFound = brandContext.competitors.filter(comp => 
      textLower.includes(comp.toLowerCase())
    )
    
    const competitorMentions = competitorsFound.map((comp, index) => ({
      name: comp,
      mention_type: 'direct' as const,
      confidence: 0.8,
      sentiment: 'neutral' as const,
      context: `Mentioned alongside ${brandContext.brandName}`,
      mention_count: 1,
      positioning: 'alternative' as const,
      market_position: index + 1
    }))

    return {
      brandMentioned,
      brandMentionCount: brandMatches.length,
      brandMentions,
      competitorMentions
    }
  }

  /**
   * Extract context around a position in text
   */
  private extractContext(text: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength / 2)
    const end = Math.min(text.length, position + contextLength / 2)
    return text.slice(start, end).trim()
  }

  /**
   * Analyze sentiment in context
   */
  private analyzeSentimentInContext(context: string): 'positive' | 'neutral' | 'negative' {
    const positive = ['good', 'great', 'excellent', 'amazing', 'best', 'top', 'leading', 'superior']
    const negative = ['bad', 'poor', 'worst', 'terrible', 'awful', 'inferior', 'disappointing']
    
    const contextLower = context.toLowerCase()
    const positiveCount = positive.filter(word => contextLower.includes(word)).length
    const negativeCount = negative.filter(word => contextLower.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
}

// Export singleton instance
export const responseEnhancer = new ResponseEnhancer()