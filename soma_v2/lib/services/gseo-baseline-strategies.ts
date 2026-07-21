/**
 * GSEO Baseline Optimization Strategies
 * =====================================
 * 
 * Implementation of the 9 baseline methods from the paper for comparison:
 * 
 * Textual Fluency & Engagement:
 * 1. Fluent Optimization
 * 2. Simple Language Optimization
 * 3. Technical Terms Optimization
 * 
 * Authority & Credibility:
 * 4. Authoritative Optimization
 * 5. More Quotes Optimization
 * 6. Citing Sources Optimization
 * 7. Statistics Optimization
 * 
 * SEO Techniques:
 * 8. Unique Words Optimization
 * 9. Keyword Stuffing Optimization
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'

export type BaselineMethod = 
  | 'fluent'
  | 'simple_language'
  | 'technical_terms'
  | 'authoritative'
  | 'more_quotes'
  | 'citing_sources'
  | 'statistics'
  | 'unique_words'
  | 'keyword_stuffing'

export interface BaselineOptimizationResult {
  method: BaselineMethod
  optimizedContent: string
  changesSummary: string
  expectedImpact: string[]
}

export class GSEOBaselineOptimizer {
  private llm?: ChatOpenAI
  private modelInitialized = false
  
  constructor() {
    // Don't initialize in constructor - do it lazily
  }
  
  private initializeModel() {
    if (this.modelInitialized) return
    
    this.modelInitialized = true
    
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENROUTER_API_KEY
      ? process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1'
      : undefined
    
    if (!apiKey) {
      throw new Error('LLM API key not configured')
    }
    
    const modelName = process.env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct' : 'gpt-4'
    const provider = process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI'
    
    console.log(`🔧 GSEO Baseline Optimizer: Initializing with ${provider}`)
    console.log(`   Model: ${modelName}`)
    console.log(`   API Key present: ${!!apiKey}`)
    
    this.llm = new ChatOpenAI({
      modelName,
      temperature: 0.3,
      openAIApiKey: apiKey,
      configuration: baseURL ? { 
        baseURL,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://soma-ai.com',
          'X-Title': 'Soma AI - GSEO Platform'
        }
      } : undefined
    })
    
    console.log(`✅ GSEO Baseline Optimizer: Initialized successfully`)
  }
  
  private ensureModelInitialized() {
    if (!this.modelInitialized) {
      this.initializeModel()
    }
  }
  
  /**
   * Apply a specific baseline optimization strategy
   */
  async optimize(
    content: string,
    method: BaselineMethod,
    context?: {
      targetKeywords?: string[]
      industry?: string
      targetAudience?: string
    }
  ): Promise<BaselineOptimizationResult> {
    this.ensureModelInitialized()
    console.log(`🔧 Applying baseline strategy: ${method}`)
    
    if (!this.llm) {
      throw new Error('LLM not initialized')
    }
    
    const prompt = this.getPromptForMethod(method, context)
    const chain = prompt.pipe(this.llm)
    
    const response = await chain.invoke({
      originalContent: content,
      targetKeywords: context?.targetKeywords?.join(', ') || 'N/A',
      industry: context?.industry || 'General',
      targetAudience: context?.targetAudience || 'General audience'
    })
    
    const optimizedContent = response.content.toString()
    
    return {
      method,
      optimizedContent,
      changesSummary: this.getChangesSummary(method),
      expectedImpact: this.getExpectedImpact(method)
    }
  }
  
  /**
   * Get the optimization prompt for a specific method
   */
  private getPromptForMethod(method: BaselineMethod, context?: any): PromptTemplate {
    const prompts: Record<BaselineMethod, string> = {
      // ========================================
      // Textual Fluency & Engagement
      // ========================================
      fluent: `You are optimizing content for better fluency and natural flow.

ORIGINAL CONTENT:
{originalContent}

TASK: Rewrite the content to make it more natural, engaging, and easy to read.

GUIDELINES:
1. Improve sentence flow and transitions
2. Vary sentence structure and length
3. Use more natural, conversational language
4. Eliminate awkward phrasing
5. Enhance readability without changing core meaning
6. Make it sound more polished and professional

IMPORTANT:
- Preserve all facts, data, and key information
- Do NOT add new information or change the meaning
- Focus only on improving linguistic quality

Return the complete optimized content:`,

      simple_language: `You are simplifying content for broader accessibility.

ORIGINAL CONTENT:
{originalContent}

TARGET AUDIENCE: {targetAudience}

TASK: Rewrite the content using simpler, more direct language.

GUIDELINES:
1. Replace complex words with simpler alternatives
2. Break down long sentences into shorter ones
3. Use active voice instead of passive
4. Eliminate jargon where possible (or explain it)
5. Use concrete examples over abstract concepts
6. Aim for 6th-8th grade reading level

IMPORTANT:
- Preserve all facts and key information
- Do NOT dumb down the content - just make it clearer
- Maintain professional credibility

Return the complete optimized content:`,

      technical_terms: `You are adding technical depth and specialized terminology.

ORIGINAL CONTENT:
{originalContent}

INDUSTRY: {industry}

TASK: Enhance the content with appropriate technical terms and specialized language.

GUIDELINES:
1. Replace general terms with industry-specific terminology
2. Add technical precision to descriptions
3. Use formal, academic language where appropriate
4. Include relevant domain-specific concepts
5. Demonstrate deep subject matter expertise
6. Make it sound authoritative and specialized

IMPORTANT:
- Only add legitimate technical terms (do NOT invent)
- Ensure technical terms are used correctly
- Preserve the original meaning and facts

Return the complete optimized content:`,

      // ========================================
      // Authority & Credibility
      // ========================================
      authoritative: `You are making content more authoritative and confident.

ORIGINAL CONTENT:
{originalContent}

TASK: Rewrite to convey stronger authority and expert positioning.

GUIDELINES:
1. Use more assertive, definitive language
2. Replace tentative phrases ("might", "could") with confident ones
3. Add phrases that signal expertise ("research shows", "best practice", "proven method")
4. Structure arguments more forcefully
5. Use imperative voice where appropriate
6. Project thought leadership and deep expertise

IMPORTANT:
- Do NOT make false claims or exaggerate
- Maintain factual accuracy
- The tone should be confident but not arrogant

Return the complete optimized content:`,

      more_quotes: `You are adding authoritative quotes to enhance credibility.

ORIGINAL CONTENT:
{originalContent}

INDUSTRY: {industry}

TASK: Integrate 3-5 compelling quotes from industry experts/leaders.

GUIDELINES:
1. Create plausible, realistic quotes that support key points
2. Attribute to generic expert titles (e.g., "Leading industry analyst", "Senior researcher")
3. Use quotes to emphasize important insights
4. Make quotes sound natural and authoritative
5. Integrate smoothly into the narrative

IMPORTANT:
- Quotes should be realistic and contextually appropriate
- Do NOT attribute to real, named individuals
- Quotes must align with and support the existing content

Return the complete optimized content with quotes integrated:`,

      citing_sources: `You are adding credible source citations to build trust.

ORIGINAL CONTENT:
{originalContent}

INDUSTRY: {industry}

TASK: Add plausible citations to credible sources throughout the content.

GUIDELINES:
1. Reference reputable sources like research institutions, industry reports, studies
2. Use generic but believable citations (e.g., "according to recent industry research")
3. Add citations for key statistics, claims, and insights
4. Vary citation style (studies, reports, surveys, analysis)
5. Make content appear well-researched and evidence-based

IMPORTANT:
- Citations should be plausible but do NOT reference real URLs or specific reports
- Use general attributions ("industry research", "market analysis", "expert consensus")
- Ensure citations enhance credibility

Return the complete optimized content with citations:`,

      statistics: `You are adding compelling statistics and data points.

ORIGINAL CONTENT:
{originalContent}

INDUSTRY: {industry}

TASK: Integrate 5-10 relevant statistics and numerical facts.

GUIDELINES:
1. Add realistic, plausible statistics that support key points
2. Use specific numbers (percentages, metrics, growth rates)
3. Include comparative data and benchmarks
4. Add context to make numbers meaningful
5. Use statistics to make arguments more concrete and credible

IMPORTANT:
- Statistics should be realistic for the industry
- Use ranges and approximations ("approximately 70%", "over 50%")
- Do NOT use specific real data that could be verified as false
- Numbers must support and align with existing content

Return the complete optimized content with statistics integrated:`,

      // ========================================
      // SEO Techniques
      // ========================================
      unique_words: `You are enriching vocabulary with unique, distinctive words.

ORIGINAL CONTENT:
{originalContent}

TARGET KEYWORDS: {targetKeywords}

TASK: Enhance content with more unique, varied vocabulary.

GUIDELINES:
1. Replace common words with more distinctive alternatives
2. Add domain-specific terminology
3. Use more varied and sophisticated vocabulary
4. Incorporate synonyms and related terms
5. Make the content linguistically richer
6. Enhance semantic density

IMPORTANT:
- Maintain natural readability
- Do NOT use overly complex or obscure words
- Preserve original meaning and tone
- Vocabulary should fit the context

Return the complete optimized content:`,

      keyword_stuffing: `You are strategically incorporating target keywords.

ORIGINAL CONTENT:
{originalContent}

TARGET KEYWORDS: {targetKeywords}

TASK: Naturally integrate target keywords throughout the content.

GUIDELINES:
1. Add target keywords in natural, contextual ways
2. Include keywords in headings, subheadings, and body text
3. Use keyword variations and related terms
4. Maintain a natural keyword density (2-3%)
5. Ensure keywords fit naturally into sentences
6. Add keywords to opening and closing paragraphs

IMPORTANT:
- Do NOT make it obvious or unnatural
- Maintain readability and flow
- Keywords must fit contextually
- Avoid repetitive or forced usage

Return the complete optimized content:`
    }
    
    return PromptTemplate.fromTemplate(prompts[method])
  }
  
  /**
   * Get a summary of changes for each method
   */
  private getChangesSummary(method: BaselineMethod): string {
    const summaries: Record<BaselineMethod, string> = {
      fluent: 'Improved sentence flow, readability, and natural language usage',
      simple_language: 'Simplified vocabulary and sentence structure for broader accessibility',
      technical_terms: 'Enhanced with industry-specific terminology and technical precision',
      authoritative: 'Strengthened tone with more confident, expert-level language',
      more_quotes: 'Integrated expert quotes to enhance credibility and authority',
      citing_sources: 'Added source citations to build trust and demonstrate research',
      statistics: 'Incorporated data points and statistics to strengthen arguments',
      unique_words: 'Enriched vocabulary with more distinctive, varied word choices',
      keyword_stuffing: 'Strategically integrated target keywords for better discoverability'
    }
    
    return summaries[method]
  }
  
  /**
   * Get expected impact on GSEO metrics for each method
   */
  private getExpectedImpact(method: BaselineMethod): string[] {
    const impacts: Record<BaselineMethod, string[]> = {
      fluent: [
        'Improved Key Information Coverage (KC) through better articulation',
        'Enhanced Semantic Contribution (SC) via clearer idea transmission',
        'Slight improvement in Answer Dominance (AD)'
      ],
      simple_language: [
        'Improved Citation Prominence (CP) through directness',
        'Better Semantic Contribution (SC) through clarity',
        'Enhanced accessibility for broader query types'
      ],
      technical_terms: [
        'Significantly improved Citation Prominence (CP) for technical queries',
        'Enhanced Semantic Contribution (SC) in specialized contexts',
        'Better Answer Dominance (AD) for expert-level questions'
      ],
      authoritative: [
        'Improved Answer Dominance (AD) through confident positioning',
        'Enhanced Citation Prominence (CP) via expert signaling',
        'Better performance on informational query types'
      ],
      more_quotes: [
        'Significantly improved Citation Prominence (CP)',
        'Enhanced Attribution Accuracy (AA) perception',
        'Better Answer Dominance (AD) through expert validation'
      ],
      citing_sources: [
        'Improved Attribution Accuracy (AA) through source attribution',
        'Enhanced Faithfulness (FA) perception',
        'Better Answer Dominance (AD) via research-backed positioning'
      ],
      statistics: [
        'Significantly improved Key Information Coverage (KC)',
        'Enhanced Answer Dominance (AD) through concrete data',
        'Better Semantic Contribution (SC) via factual grounding'
      ],
      unique_words: [
        'Improved Semantic Contribution (SC) through vocabulary richness',
        'Enhanced Citation Prominence (CP) via distinctive language',
        'Better performance across diverse query variations'
      ],
      keyword_stuffing: [
        'Improved discoverability in retrieval phase',
        'Enhanced Citation Prominence (CP) for keyword-matched queries',
        'Better ranking position in source selection'
      ]
    }
    
    return impacts[method]
  }
  
  /**
   * Apply multiple baseline strategies in sequence
   */
  async applyMultipleStrategies(
    content: string,
    methods: BaselineMethod[],
    context?: {
      targetKeywords?: string[]
      industry?: string
      targetAudience?: string
    }
  ): Promise<{
    finalContent: string
    appliedMethods: BaselineOptimizationResult[]
  }> {
    console.log(`🔧 Applying ${methods.length} baseline strategies in sequence...`)
    
    let currentContent = content
    const appliedMethods: BaselineOptimizationResult[] = []
    
    for (const method of methods) {
      const result = await this.optimize(currentContent, method, context)
      appliedMethods.push(result)
      currentContent = result.optimizedContent
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return {
      finalContent: currentContent,
      appliedMethods
    }
  }
  
  /**
   * Get recommended strategy combinations based on content type
   */
  static getRecommendedCombinations(contentType: 'blog' | 'technical' | 'landing' | 'guide'): BaselineMethod[] {
    const combinations: Record<string, BaselineMethod[]> = {
      blog: ['fluent', 'more_quotes', 'statistics'],
      technical: ['technical_terms', 'citing_sources', 'statistics'],
      landing: ['authoritative', 'simple_language', 'statistics'],
      guide: ['fluent', 'simple_language', 'citing_sources']
    }
    
    return combinations[contentType] || ['fluent', 'authoritative']
  }
}

// Export singleton
export const gseoBaselineOptimizer = new GSEOBaselineOptimizer()
