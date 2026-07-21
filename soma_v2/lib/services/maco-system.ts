/**
 * GSEO Multi-Agent Content Optimization (MACO) System
 * ===================================================
 * 
 * Implementation of the framework from:
 * "Beyond Keywords: Driving Generative Search Engine Optimization with Content-Centric Agents"
 * 
 * This system uses 5 specialized agents to iteratively optimize content
 * for maximum influence in AI-generated answers.
 * 
 * Agents:
 * 1. QueryAgent - Generates benchmark corpus of relevant queries
 * 2. EvaluatorAgent - Scores content across 6 dimensions
 * 3. AnalystAgent - Diagnoses weaknesses and provides suggestions
 * 4. EditorAgent - Implements content improvements
 * 5. SelectorAgent - Chooses the best version from optimization trajectory
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { z } from 'zod'
import { getAgentModelConfig } from '@/lib/services/config-service'

// ========================================
// Type Definitions
// ========================================

export interface GSEOContent {
  id: string
  title: string
  content: string
  format: 'markdown' | 'html' | 'plain_text'
  brandId: string
  targetAudience?: string
  contentGoals?: string[]
  targetKeywords?: string[]
  targetPlatforms?: string[]
  brandVoice?: {
    tone: string
    styleGuidelines: string[]
    keyMessages: string[]
    avoidTerms?: string[]
  }
}

export interface BenchmarkQuery {
  query: string
  intent: 'learning' | 'research' | 'entertainment' | 'comparison' | 'purchase'
  answerType: 'fact' | 'explanation' | 'list' | 'comparison' | 'guide'
  relevanceScore: number
  difficultyScore: number
  expectedTopics: string[]
}

export interface EvaluationScore {
  // Attribution Mechanics (1 dimension)
  citationProminence: number // 0-10
  citationProminenceJustification: string
  
  // Content Fidelity (2 dimensions)
  attributionAccuracy: number // 0-10
  attributionAccuracyJustification: string
  faithfulness: number // 0-10
  faithfulnessJustification: string
  
  // Semantic Dominance (3 dimensions)
  keyInfoCoverage: number // 0-10
  keyInfoCoverageJustification: string
  semanticContribution: number // 0-10
  semanticContributionJustification: string
  answerDominance: number // 0-10
  answerDominanceJustification: string
  
  // Aggregates
  overallScore: number
  attributionMechanicsScore: number
  contentFidelityScore: number
  semanticDominanceScore: number
  
  generatedAnswer: string
  sourcesCited: string[]
}

export interface OptimizationSuggestion {
  category: 'structure' | 'clarity' | 'authority' | 'seo' | 'citations' | 'technical'
  priority: 'high' | 'medium' | 'low'
  issue: string
  recommendation: string
  expectedImpact: string
  affectedSections?: string[]
}

export interface ContentRevision {
  version: number
  content: string
  changeSummary: string
  changeRationale: string
  suggestionsApplied: string[]
  preOptimizationScore: number
  postOptimizationScore: number
}

export interface OptimizationTrajectory {
  contentId: string
  versions: ContentRevision[]
  evaluations: Map<number, EvaluationScore[]> // version -> evaluations
  selectedVersion: number
  selectionReason: string
}

// ========================================
// MACO System Configuration
// ========================================

interface MACOConfig {
  maxIterations: number
  convergenceThreshold: number
  plateauDetectionWindow: number
  modelConfig: {
    provider: 'openai' | 'groq' | 'openrouter'
    evaluatorModel: string
    analystModel: string
    editorModel: string
    selectorModel: string
    temperature: {
      evaluation: number
      analysis: number
      editing: number
      selection: number
    }
  }
}

const DEFAULT_CONFIG: MACOConfig = {
  maxIterations: 10,
  convergenceThreshold: 0.5,
  plateauDetectionWindow: 3,
  modelConfig: {
    provider: 'openrouter',
    evaluatorModel: 'meta-llama/llama-3.3-70b-instruct',
    analystModel: 'meta-llama/llama-3.3-70b-instruct',
    editorModel: 'meta-llama/llama-3.3-70b-instruct',
    selectorModel: 'meta-llama/llama-3.3-70b-instruct',
    temperature: {
      evaluation: 0.1,
      analysis: 0.6,
      editing: 0.3,
      selection: 0.2
    }
  }
}

// ========================================
// MACO System Class
// ========================================

export class MACOSystem {
  private config: MACOConfig
  private evaluatorLLM?: ChatOpenAI
  private analystLLM?: ChatOpenAI
  private editorLLM?: ChatOpenAI
  private selectorLLM?: ChatOpenAI
  private modelsInitialized = false
  
  constructor(config: Partial<MACOConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    // Don't initialize models in constructor - do it lazily when needed
  }

  /**
   * Create a MACOSystem using agent configs from the database.
   * Falls back to DEFAULT_CONFIG for any agents not configured.
   */
  static async fromDatabase(): Promise<MACOSystem> {
    try {
      const [evaluator, analyst, editor, selector] = await Promise.all([
        getAgentModelConfig('maco_evaluator'),
        getAgentModelConfig('maco_analyst'),
        getAgentModelConfig('maco_editor'),
        getAgentModelConfig('maco_selector'),
      ])

      const dbConfig: Partial<MACOConfig> = {
        modelConfig: {
          provider: evaluator?.provider || DEFAULT_CONFIG.modelConfig.provider,
          evaluatorModel: evaluator?.model_id || DEFAULT_CONFIG.modelConfig.evaluatorModel,
          analystModel: analyst?.model_id || DEFAULT_CONFIG.modelConfig.analystModel,
          editorModel: editor?.model_id || DEFAULT_CONFIG.modelConfig.editorModel,
          selectorModel: selector?.model_id || DEFAULT_CONFIG.modelConfig.selectorModel,
          temperature: {
            evaluation: evaluator?.temperature ?? DEFAULT_CONFIG.modelConfig.temperature.evaluation,
            analysis: analyst?.temperature ?? DEFAULT_CONFIG.modelConfig.temperature.analysis,
            editing: editor?.temperature ?? DEFAULT_CONFIG.modelConfig.temperature.editing,
            selection: selector?.temperature ?? DEFAULT_CONFIG.modelConfig.temperature.selection,
          }
        }
      }

      console.log('🤖 MACO System: Loaded configs from database')
      return new MACOSystem(dbConfig)
    } catch (error) {
      console.warn('⚠️ MACO System: Failed to load DB configs, using defaults:', error)
      return new MACOSystem()
    }
  }
  
  private initializeModels() {
    if (this.modelsInitialized) return // Already initialized
    
    this.modelsInitialized = true
    const apiKey = this.config.modelConfig.provider === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : process.env.OPENAI_API_KEY
    
    const baseURL = this.config.modelConfig.provider === 'openrouter'
      ? process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1'
      : undefined
    
    console.log(`🤖 MACO System: Initializing with ${this.config.modelConfig.provider}`)
    console.log(`   Models: ${this.config.modelConfig.evaluatorModel}`)
    console.log(`   Base URL: ${baseURL || 'default'}`)
    console.log(`   API Key present: ${!!apiKey}`)
    console.log(`   API Key length: ${apiKey?.length || 0}`)
    
    if (!apiKey) {
      console.error('❌ API key not found. Environment variables:', {
        OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      })
      throw new Error(`${this.config.modelConfig.provider.toUpperCase()} API key not configured. Check your .env file.`)
    }
    
    // OpenRouter uses ChatOpenAI with custom base URL
    // Important: LangChain OpenAI client needs explicit configuration for custom endpoints
    const config = {
      openAIApiKey: apiKey,
      ...(baseURL && {
        configuration: { 
          baseURL,
          defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://soma-ai.com',
            'X-Title': 'Soma AI - GSEO Platform',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      })
    }
    
    console.log('   Config:', { 
      hasApiKey: !!config.openAIApiKey,
      hasBaseURL: !!baseURL,
      hasConfig: !!config.configuration
    })
    
    this.evaluatorLLM = new ChatOpenAI({
      modelName: this.config.modelConfig.evaluatorModel,
      temperature: this.config.modelConfig.temperature.evaluation,
      ...config
    })
    
    this.analystLLM = new ChatOpenAI({
      modelName: this.config.modelConfig.analystModel,
      temperature: this.config.modelConfig.temperature.analysis,
      ...config
    })
    
    this.editorLLM = new ChatOpenAI({
      modelName: this.config.modelConfig.editorModel,
      temperature: this.config.modelConfig.temperature.editing,
      ...config
    })
    
    this.selectorLLM = new ChatOpenAI({
      modelName: this.config.modelConfig.selectorModel,
      temperature: this.config.modelConfig.temperature.selection,
      ...config
    })
    
    console.log(`✅ MACO System: All 5 agents initialized successfully`)
    console.log(`   - EvaluatorAgent: ${this.config.modelConfig.evaluatorModel} (temp: ${this.config.modelConfig.temperature.evaluation})`)
    console.log(`   - AnalystAgent: ${this.config.modelConfig.analystModel} (temp: ${this.config.modelConfig.temperature.analysis})`)
    console.log(`   - EditorAgent: ${this.config.modelConfig.editorModel} (temp: ${this.config.modelConfig.temperature.editing})`)
    console.log(`   - SelectorAgent: ${this.config.modelConfig.selectorModel} (temp: ${this.config.modelConfig.temperature.selection})`)
  }
  
  private ensureModelsInitialized() {
    if (!this.modelsInitialized) {
      this.initializeModels()
    }
    if (!this.evaluatorLLM || !this.analystLLM || !this.editorLLM || !this.selectorLLM) {
      throw new Error('Models failed to initialize')
    }
  }
  
  // ========================================
  // Agent 1: Query Agent
  // ========================================
  
  /**
   * Generate benchmark corpus of queries for content-centric evaluation
   */
  async generateBenchmarkQueries(
    content: GSEOContent,
    numQueries: number = 10
  ): Promise<BenchmarkQuery[]> {
    this.ensureModelsInitialized()
    console.log(`🔍 QueryAgent: Generating ${numQueries} benchmark queries...`)
    
    const querySchema = z.object({
      queries: z.array(z.object({
        query: z.string(),
        intent: z.enum(['learning', 'research', 'entertainment', 'comparison', 'purchase']),
        answerType: z.enum(['fact', 'explanation', 'list', 'comparison', 'guide']),
        relevanceScore: z.number().min(0).max(10),
        difficultyScore: z.number().min(0).max(10),
        expectedTopics: z.array(z.string())
      }))
    })
    
    const parser = StructuredOutputParser.fromZodSchema(querySchema)
    
    const prompt = PromptTemplate.fromTemplate(`
You are a Strategic Query Generation Agent for AI Search Optimization (AISO).
Your role is to identify the most valuable questions potential customers are asking AI assistants 
(ChatGPT, Claude, Gemini, Perplexity) where this content should be the primary answer.

CONTENT PROFILE:
Title: {title}
Content Preview: {contentPreview}
Target Audience: {targetAudience}
Content Goals: {contentGoals}

YOUR OBJECTIVE:
Generate {numQueries} high-value queries that represent the "Customer Journey" for this topic.

STRATEGY:
1. **Discovery Queries:** Broad questions where users are learning about the problem/topic.
2. **Comparison Queries:** "Best X for Y" or "X vs Y" where this brand should win.
3. **High-Intent Queries:** Specific questions about features, pricing, or implementation.
4. **Long-Tail Queries:** Niche, specific questions that show deep interest.

FOR EACH QUERY ASSESS:
- Relevance Score (0-10): Is this content actually the *best* answer?
- Difficulty Score (0-10): How crowded is this space in AI answers?
- Expected Topics: What *must* be covered to win the answer?

GUIDELINES:
- Think like a potential customer, not an SEO tool.
- Focus on natural language questions, not keyword strings.
- Prioritize queries that lead to conversion or brand affinity.

{formatInstructions}
`)
    
    const chain = prompt.pipe(this.evaluatorLLM!).pipe(parser)
    
    const result = await chain.invoke({
      title: content.title,
      contentPreview: content.content.substring(0, 1000),
      targetAudience: content.targetAudience || 'General audience',
      contentGoals: content.contentGoals?.join(', ') || 'Inform and educate',
      numQueries: numQueries.toString(),
      formatInstructions: parser.getFormatInstructions()
    })
    
    console.log(`✅ QueryAgent: Generated ${result.queries.length} queries`)
    return result.queries
  }
  
  // ========================================
  // Agent 2: Evaluator Agent
  // ========================================
  
  /**
   * Evaluate content across 6 GSEO dimensions for a specific query
   */
  async evaluateContent(
    content: GSEOContent,
    query: BenchmarkQuery,
    retrievedDocs: string[] = []
  ): Promise<EvaluationScore> {
    this.ensureModelsInitialized()
    console.log(`📊 EvaluatorAgent: Evaluating content for query: "${query.query}"`)
    
    // First, simulate RAG to generate an answer
    const generatedAnswer = await this.simulateRAG(content, query, retrievedDocs)
    
    // Then evaluate the answer
    const evaluationSchema = z.object({
      citationProminence: z.number().min(0).max(10),
      citationProminenceJustification: z.string(),
      attributionAccuracy: z.number().min(0).max(10),
      attributionAccuracyJustification: z.string(),
      faithfulness: z.number().min(0).max(10),
      faithfulnessJustification: z.string(),
      keyInfoCoverage: z.number().min(0).max(10),
      keyInfoCoverageJustification: z.string(),
      semanticContribution: z.number().min(0).max(10),
      semanticContributionJustification: z.string(),
      answerDominance: z.number().min(0).max(10),
      answerDominanceJustification: z.string(),
      sourcesCited: z.array(z.string())
    })
    
    const parser = StructuredOutputParser.fromZodSchema(evaluationSchema)
    
    // Helper function to clean LLM output before parsing
    const cleanJsonOutput = (text: string): string => {
      // Remove markdown code blocks
      let cleaned = text.replace(/```json\n?/gi, '').replace(/\n?```$/g, '').trim()
      
      // Fix common JSON issues
      // 1. Fix missing quotes in arrays: sourcesCited: [text] -> sourcesCited: ["text"]
      cleaned = cleaned.replace(/"sourcesCited:\s*\[([^\]]+)\]"/g, (match, content) => {
        if (!content.includes('"')) {
          return `"sourcesCited": ["${content.trim()}"]`
        }
        return match
      })
      
      // 2. Fix sourcesCited without quotes around key
      cleaned = cleaned.replace(/sourcesCited:\s*\[/g, '"sourcesCited": [')
      
      return cleaned
    }
    
    const prompt = PromptTemplate.fromTemplate(`
You are an AI Visibility Evaluator.
Your job is to assess how well the source content "won" the AI's answer.

QUERY: {query}
GENERATED ANSWER: {generatedAnswer}
SOURCE CONTENT: {sourceContent}

EVALUATION FRAMEWORK (Score 0-10):

**1. VISIBILITY & CITATIONS** (Attribution Mechanics)
- Citation Prominence (CP): Is the brand/source clearly cited?
  * 0-3: Invisible (not cited)
  * 4-6: Visible (cited in footer or generic list)
  * 7-10: Prominent (cited in-text, "According to X...")

**2. TRUST & ACCURACY** (Content Fidelity)
- Attribution Accuracy (AA): Did the AI get the facts right?
  * 0-3: Hallucinated or misattributed
  * 7-10: Perfect attribution of claims
  
- Fact Accuracy (FA): Is the core meaning preserved?
  * 0-3: Distorted meaning
  * 7-10: Perfectly faithful to source

**3. INFLUENCE & DOMINANCE** (Semantic Dominance)
- Key Info Coverage (KC): Did the AI use your key selling points?
  * 0-3: Missed your best points
  * 7-10: Included all your key differentiators

- Idea Influence (SC): Did your unique perspective shape the answer?
  * 0-3: Generic answer
  * 7-10: Your unique framework/data framed the answer

- Share of Voice (AD): How much of the answer is "yours"?
  * 0-3: You are a footnote
  * 4-6: You are one of many
  * 7-10: You are the primary authority

For each dimension, provide:
1. A numeric score (0-10, allow decimals like 7.5)
2. A brief, non-technical justification (e.g., "Great job getting cited in the first paragraph" vs "High citation prominence")

Also list all sources cited in the generated answer.

{formatInstructions}
`)
    
    const chain = prompt.pipe(this.evaluatorLLM!)
    
    let evaluation
    try {
      const rawResponse = await chain.invoke({
        query: query.query,
        generatedAnswer,
        sourceContent: content.content.substring(0, 2000),
        formatInstructions: parser.getFormatInstructions()
      })
      
      // Clean the output before parsing
      const cleanedText = cleanJsonOutput(rawResponse.content as string)
      
      // Parse the cleaned JSON
      evaluation = await parser.parse(cleanedText)
    } catch (parseError: any) {
      console.error('⚠️ Parse error, attempting recovery:', parseError.message)
      
      // Try to extract JSON from the error's llmOutput if available
      if (parseError.llmOutput) {
        try {
          const cleanedText = cleanJsonOutput(parseError.llmOutput)
          evaluation = JSON.parse(cleanedText)
          console.log('✅ Successfully recovered from parse error')
        } catch (recoveryError) {
          console.error('❌ Recovery failed, using default scores')
          // Return default scores if all else fails
          evaluation = {
            citationProminence: 5,
            citationProminenceJustification: 'Unable to evaluate due to parsing error',
            attributionAccuracy: 5,
            attributionAccuracyJustification: 'Unable to evaluate due to parsing error',
            faithfulness: 5,
            faithfulnessJustification: 'Unable to evaluate due to parsing error',
            keyInfoCoverage: 5,
            keyInfoCoverageJustification: 'Unable to evaluate due to parsing error',
            semanticContribution: 5,
            semanticContributionJustification: 'Unable to evaluate due to parsing error',
            answerDominance: 5,
            answerDominanceJustification: 'Unable to evaluate due to parsing error',
            sourcesCited: []
          }
        }
      } else {
        throw parseError
      }
    }
    
    // Calculate aggregate scores
    const overallScore = (
      evaluation.citationProminence +
      evaluation.attributionAccuracy +
      evaluation.faithfulness +
      evaluation.keyInfoCoverage +
      evaluation.semanticContribution +
      evaluation.answerDominance
    ) / 6
    
    const scores: EvaluationScore = {
      ...evaluation,
      overallScore,
      attributionMechanicsScore: evaluation.citationProminence,
      contentFidelityScore: (evaluation.attributionAccuracy + evaluation.faithfulness) / 2,
      semanticDominanceScore: (evaluation.keyInfoCoverage + evaluation.semanticContribution + evaluation.answerDominance) / 3,
      generatedAnswer
    }
    
    console.log(`✅ EvaluatorAgent: Overall score ${scores.overallScore.toFixed(2)}/10`)
    return scores
  }
  
  /**
   * Simulate RAG process to generate an answer using the content
   */
  private async simulateRAG(
    content: GSEOContent,
    query: BenchmarkQuery,
    retrievedDocs: string[]
  ): Promise<string> {
    const ragPrompt = PromptTemplate.fromTemplate(`
You are simulating a generative search engine (like ChatGPT, Claude, or Perplexity).
Generate a comprehensive answer to the user's query using the retrieved sources.

USER QUERY: {query}

RETRIEVED SOURCES:
{sources}

INSTRUCTIONS:
1. Synthesize information from all sources
2. Cite sources using [1], [2], etc.
3. Provide a clear, direct answer
4. Be comprehensive but concise (200-400 words)
5. Use natural, conversational tone

Generate the answer now:
`)
    
    const sources = [
      `[Source 1 - Primary Content]\n${content.content.substring(0, 1500)}`,
      ...retrievedDocs.map((doc, i) => `[Source ${i + 2}]\n${doc.substring(0, 800)}`)
    ].join('\n\n')
    
    const chain = ragPrompt.pipe(this.evaluatorLLM!)
    const response = await chain.invoke({
      query: query.query,
      sources
    })
    
    return response.content.toString()
  }
  
  // ========================================
  // Agent 3: Analyst Agent
  // ========================================
  
  /**
   * Analyze evaluation results and provide optimization suggestions
   */
  async analyzeContent(
    content: GSEOContent,
    evaluations: EvaluationScore[]
  ): Promise<OptimizationSuggestion[]> {
    this.ensureModelsInitialized()
    console.log(`🔬 AnalystAgent: Analyzing ${evaluations.length} evaluations...`)
    
    // Calculate aggregate metrics
    const avgScores = {
      citationProminence: this.average(evaluations.map(e => e.citationProminence)),
      attributionAccuracy: this.average(evaluations.map(e => e.attributionAccuracy)),
      faithfulness: this.average(evaluations.map(e => e.faithfulness)),
      keyInfoCoverage: this.average(evaluations.map(e => e.keyInfoCoverage)),
      semanticContribution: this.average(evaluations.map(e => e.semanticContribution)),
      answerDominance: this.average(evaluations.map(e => e.answerDominance)),
      overall: this.average(evaluations.map(e => e.overallScore))
    }
    
    // Identify weak dimensions
    const weakDimensions = Object.entries(avgScores)
      .filter(([_, score]) => score < 7.0)
      .sort(([_, a], [__, b]) => a - b)
      .map(([dim]) => dim)
    
    const suggestionSchema = z.object({
      suggestions: z.array(z.object({
        category: z.enum(['structure', 'clarity', 'authority', 'seo', 'citations', 'technical']),
        priority: z.enum(['high', 'medium', 'low']),
        issue: z.string(),
        recommendation: z.string(),
        expectedImpact: z.string(),
        affectedSections: z.array(z.string()).optional()
      }))
    })
    
    const parser = StructuredOutputParser.fromZodSchema(suggestionSchema)
    
    const prompt = PromptTemplate.fromTemplate(`
You are a Lead Content Strategist for AI Optimization.
Your goal is to turn "good content" into "the only answer AI trusts".

CONTENT PREVIEW:
{contentPreview}

PERFORMANCE SCORECARD:
Overall Score: {overallScore}/10
Visibility (CP): {cp}/10
Accuracy (AA): {aa}/10
Faithfulness (FA): {fa}/10
Key Points (KC): {kc}/10
Influence (SC): {sc}/10
Dominance (AD): {ad}/10

WEAKEST AREAS: {weakDimensions}

LOW-PERFORMING EXAMPLES:
{lowPerformingExamples}

YOUR MISSION:
1. Diagnose WHY the content isn't winning the AI answer.
2. Prescribe 3-5 specific, high-impact fixes.
3. Prioritize by "Effort vs. Impact".

SUGGESTION CATEGORIES:
- Structure: Formatting for AI readability (lists, bolding, headers).
- Clarity: Simplifying complex ideas for better AI ingestion.
- Authority: Adding data, quotes, or specific claims to boost trust.
- SEO: Keyword/Entity optimization for retrieval.
- Citations: Making it easier for AI to cite (e.g., "According to Brand X...").
- Technical: Schema, metadata, or length adjustments.

GUIDELINES:
- Be specific. Don't say "improve clarity", say "Turn paragraph 2 into a bulleted list".
- Focus on "winning the snippet" - getting the AI to quote you directly.

{formatInstructions}
`)
    
    // Get examples of low-scoring evaluations
    const lowScoring = evaluations
      .filter(e => e.overallScore < 6.0)
      .slice(0, 3)
      .map(e => `Query: "${e.generatedAnswer.substring(0, 100)}..."\nIssues: ${e.citationProminenceJustification}`)
      .join('\n\n')
    
    const chain = prompt.pipe(this.analystLLM!).pipe(parser)
    
    const result = await chain.invoke({
      contentPreview: content.content.substring(0, 1500),
      overallScore: avgScores.overall.toFixed(2),
      cp: avgScores.citationProminence.toFixed(2),
      aa: avgScores.attributionAccuracy.toFixed(2),
      fa: avgScores.faithfulness.toFixed(2),
      kc: avgScores.keyInfoCoverage.toFixed(2),
      sc: avgScores.semanticContribution.toFixed(2),
      ad: avgScores.answerDominance.toFixed(2),
      weakDimensions: weakDimensions.join(', '),
      lowPerformingExamples: lowScoring || 'None - all queries performed well',
      formatInstructions: parser.getFormatInstructions()
    })
    
    console.log(`✅ AnalystAgent: Generated ${result.suggestions.length} suggestions`)
    return result.suggestions
  }
  
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
  }
  
  // ========================================
  // Agent 4: Editor Agent
  // ========================================
  
  /**
   * Apply optimization suggestions to improve content
   */
  async editContent(
    content: GSEOContent,
    suggestions: OptimizationSuggestion[]
  ): Promise<{content: string, changeSummary: string, changeRationale: string}> {
    this.ensureModelsInitialized()
    console.log(`✏️  EditorAgent: Applying ${suggestions.length} suggestions...`)
    
    // Select top suggestion to implement
    const topSuggestion = suggestions.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 }
      return priorityScore[b.priority] - priorityScore[a.priority]
    })[0]
    
    if (!topSuggestion) {
      throw new Error('No suggestions provided to Editor Agent')
    }
    
    const editorSchema = z.object({
      optimizedContent: z.string(),
      changeSummary: z.string(),
      changeRationale: z.string(),
      modificationsApplied: z.array(z.string())
    })
    
    const parser = StructuredOutputParser.fromZodSchema(editorSchema)
    
    const prompt = PromptTemplate.fromTemplate(`
You are a World-Class Copywriter & AI Optimization Specialist.
Your task is to rewrite the content to implement a specific improvement.

ORIGINAL CONTENT:
{originalContent}

MISSION: Implement this specific improvement:
Category: {category}
Priority: {priority}
Issue: {issue}
Recommendation: {recommendation}
Expected Impact: {expectedImpact}

BRAND VOICE:
{brandVoice}

EXECUTION RULES:
1. **Surgical Precision:** Change ONLY what is needed to address the recommendation.
2. **Win the Snippet:** Write in a way that makes it easy for AI to quote (clear definitions, strong lists).
3. **Preserve Voice:** Keep the brand's tone, but make it more authoritative.
4. **No Fluff:** Remove filler words. Be direct and high-signal.

OUTPUT:
- optimizedContent: The full, rewritten content.
- changeSummary: What you did (e.g., "Restructured section 2 into a list").
- changeRationale: Why this helps (e.g., "Increases likelihood of being picked up as a featured snippet").

{formatInstructions}
`)
    
    const chain = prompt.pipe(this.editorLLM!).pipe(parser)
    
    const result = await chain.invoke({
      originalContent: content.content,
      category: topSuggestion.category,
      priority: topSuggestion.priority,
      issue: topSuggestion.issue,
      recommendation: topSuggestion.recommendation,
      expectedImpact: topSuggestion.expectedImpact,
      brandVoice: JSON.stringify(content.brandVoice || { tone: 'professional', styleGuidelines: [] }),
      formatInstructions: parser.getFormatInstructions()
    })
    
    console.log(`✅ EditorAgent: Content revised`)
    return {
      content: result.optimizedContent,
      changeSummary: result.changeSummary,
      changeRationale: result.changeRationale
    }
  }
  
  // ========================================
  // Agent 5: Selector Agent
  // ========================================
  
  /**
   * Select the best version from the optimization trajectory
   */
  async selectBestVersion(
    trajectory: OptimizationTrajectory
  ): Promise<{ version: number; reason: string }> {
    this.ensureModelsInitialized()
    console.log(`🎯 SelectorAgent: Analyzing ${trajectory.versions.length} versions...`)
    
    const selectorSchema = z.object({
      selectedVersion: z.number(),
      selectionReason: z.string(),
      keyFactors: z.array(z.string())
    })
    
    const parser = StructuredOutputParser.fromZodSchema(selectorSchema)
    
    // Prepare trajectory summary
    const versionSummaries = trajectory.versions.map((v, idx) => {
      const evals = trajectory.evaluations.get(idx) || []
      const avgScore = evals.length > 0 
        ? evals.reduce((sum, e) => sum + e.overallScore, 0) / evals.length 
        : 0
      
      return `Version ${idx}:
  Score: ${avgScore.toFixed(2)}/10
  Changes: ${v.changeSummary}
  Suggestions Applied: ${v.suggestionsApplied.join(', ')}`
    }).join('\n\n')
    
    const prompt = PromptTemplate.fromTemplate(`
You are a Selector Agent for GSEO optimization.
Review the entire optimization trajectory and select the best version.

OPTIMIZATION TRAJECTORY:
{versionSummaries}

SELECTION CRITERIA:
1. Highest overall score across all evaluations
2. Consistency of performance (low variance)
3. Balance across all 6 GSEO dimensions
4. Avoid over-optimization (later versions may plateau or regress)
5. Consider score improvements vs. content changes

TASK:
Select the version number (0 to {maxVersion}) that represents the best 
trade-off of performance, stability, and content quality.

Provide:
- selectedVersion: The version number to use
- selectionReason: Detailed explanation of why this version is best
- keyFactors: Top 3 factors that influenced your decision

{formatInstructions}
`)
    
    const chain = prompt.pipe(this.selectorLLM!).pipe(parser)
    
    const result = await chain.invoke({
      versionSummaries,
      maxVersion: trajectory.versions.length - 1,
      formatInstructions: parser.getFormatInstructions()
    })
    
    console.log(`✅ SelectorAgent: Selected version ${result.selectedVersion}`)
    console.log(`   Reason: ${result.selectionReason}`)
    
    return {
      version: result.selectedVersion,
      reason: result.selectionReason
    }
  }
  
  // ========================================
  // Main Optimization Loop
  // ========================================
  
  /**
   * Run complete MACO optimization process
   */
  async optimizeContent(
    content: GSEOContent,
    options: {
      numQueries?: number
      maxIterations?: number
      onIteration?: (iteration: number, score: number) => void
      onComplete?: (trajectory: OptimizationTrajectory) => void
    } = {}
  ): Promise<OptimizationTrajectory> {
    this.ensureModelsInitialized()
    
    // Override maxIterations if provided
    const maxIterations = options.maxIterations ?? this.config.maxIterations
    
    console.log(`\n🚀 Starting MACO optimization for: "${content.title}"`)
    console.log(`   Max iterations: ${maxIterations}`)
    
    const { numQueries = 10, onIteration, onComplete } = options
    
    // Step 1: Generate benchmark corpus
    const benchmarkQueries = await this.generateBenchmarkQueries(content, numQueries)
    
    // Initialize trajectory
    const trajectory: OptimizationTrajectory = {
      contentId: content.id,
      versions: [],
      evaluations: new Map(),
      selectedVersion: 0,
      selectionReason: ''
    }
    
    let currentContent = { ...content }
    let iteration = 0
    let plateauCount = 0
    let lastScores: number[] = []
    
    // Optimization loop
    while (iteration < maxIterations) {
      console.log(`\n--- Iteration ${iteration + 1}/${maxIterations} ---`)
      
      // Evaluate current content
      const evaluations: EvaluationScore[] = []
      for (const query of benchmarkQueries.slice(0, 5)) { // Evaluate on subset for speed
        const evaluation = await this.evaluateContent(currentContent, query)
        evaluations.push(evaluation)
      }
      
      const avgScore = this.average(evaluations.map(e => e.overallScore))
      console.log(`   Current score: ${avgScore.toFixed(2)}/10`)
      
      trajectory.evaluations.set(iteration, evaluations)
      
      if (onIteration) {
        onIteration(iteration, avgScore)
      }
      
      // Check for plateau
      lastScores.push(avgScore)
      if (lastScores.length > this.config.plateauDetectionWindow) {
        lastScores.shift()
        const scoreVariance = this.variance(lastScores)
        if (scoreVariance < this.config.convergenceThreshold) {
          plateauCount++
          console.log(`   ⚠️ Plateau detected (variance: ${scoreVariance.toFixed(3)})`)
          
          if (plateauCount >= 2) {
            console.log(`   Stopping early due to convergence`)
            break
          }
        } else {
          plateauCount = 0
        }
      }
      
      // Analyze and generate suggestions
      const suggestions = await this.analyzeContent(currentContent, evaluations)
      
      if (suggestions.length === 0) {
        console.log(`   No more improvements suggested`)
        break
      }
      
      // Edit content
      const revision = await this.editContent(currentContent, suggestions)
      
      // Store version
      trajectory.versions.push({
        version: iteration,
        content: revision.content,
        changeSummary: revision.changeSummary,
        changeRationale: revision.changeRationale,
        suggestionsApplied: suggestions.map(s => s.recommendation),
        preOptimizationScore: avgScore,
        postOptimizationScore: 0 // Will be filled in next iteration
      })
      
      // Update content for next iteration
      currentContent.content = revision.content
      iteration++
    }
    
    // Final evaluation on all queries
    console.log(`\n📊 Running final evaluation on all queries...`)
    const finalEvaluations: EvaluationScore[] = []
    for (const query of benchmarkQueries) {
      const evaluation = await this.evaluateContent(currentContent, query)
      finalEvaluations.push(evaluation)
    }
    trajectory.evaluations.set(iteration, finalEvaluations)
    
    // Select best version
    const selection = await this.selectBestVersion(trajectory)
    trajectory.selectedVersion = selection.version
    trajectory.selectionReason = selection.reason
    
    console.log(`\n✨ Optimization complete!`)
    console.log(`   Total iterations: ${iteration}`)
    console.log(`   Selected version: ${selection.version}`)
    console.log(`   Final score: ${this.average(finalEvaluations.map(e => e.overallScore)).toFixed(2)}/10`)
    
    if (onComplete) {
      onComplete(trajectory)
    }
    
    return trajectory
  }
  
  private variance(numbers: number[]): number {
    const avg = this.average(numbers)
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2))
    return this.average(squareDiffs)
  }
}

// Lazy singleton that loads config from database on first use
let _macoInstance: MACOSystem | null = null

export async function getMACOSystem(): Promise<MACOSystem> {
  if (!_macoInstance) {
    _macoInstance = await MACOSystem.fromDatabase()
  }
  return _macoInstance
}
