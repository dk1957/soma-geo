/**
 * Strategic Insight Agent
 * =======================
 * LLM-powered deep analysis engine that cross-references ALL data sources
 * (visibility, discoverability, GSC, brand knowledge) to produce:
 *
 * 1. Executive summary with key findings
 * 2. Hidden opportunities & threats
 * 3. Content strategy recommendations with specific target publications
 * 4. Fact verification (what AI models get wrong about the brand)
 * 5. Competitive intelligence
 * 6. Trend signals
 *
 * Uses top-tier models (Gemini 2.5 Pro, GPT-4.1) via Vercel AI SDK + OpenRouter.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { getAgentModel } from '@/lib/agents/provider'
import { createServiceClient } from '@/lib/supabase/server'
import { BrandKnowledgeService } from './brand-knowledge-service'
import type { InsightEngineResult } from './insight-engine'

// ─── Output Schema ──────────────────────────────────────────────────────────

const KeyFindingSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.string().describe('critical, high, medium, or low'),
  category: z.string().describe('visibility, content, technical, competitive, sentiment, or citations'),
  evidence: z.string(),
  recommendation: z.string(),
})

const OpportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string().describe('high, medium, or low'),
  effort: z.string().describe('low, medium, or high'),
  expected_outcome: z.string(),
  target_queries: z.string().describe('Comma-separated list of specific queries or topics to target'),
})

const ThreatSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.string().describe('critical, high, or medium'),
  affected_area: z.string(),
  mitigation: z.string(),
})

const ContentStrategySchema = z.object({
  title: z.string(),
  target_topic: z.string(),
  content_type: z.string(),
  target_publications: z.string().describe('Comma-separated list of sites or publications'),
  rationale: z.string(),
  priority: z.string().describe('immediate, short_term, or medium_term'),
})

const FactVerificationSchema = z.object({
  claim: z.string(),
  source_model: z.string(),
  verdict: z.string().describe('accurate, inaccurate, outdated, misleading, or unverifiable'),
  evidence: z.string(),
  correction: z.string().describe('The correct information if claim is wrong, or empty string if accurate'),
  suggested_action: z.string(),
})

const CompetitorInsightSchema = z.object({
  competitor: z.string(),
  insight: z.string(),
  implication: z.string(),
  action: z.string(),
})

const TrendSignalSchema = z.object({
  signal: z.string(),
  direction: z.string().describe('improving, declining, emerging, or volatile'),
  confidence: z.string().describe('high, medium, or low'),
  timeframe: z.string(),
  implication: z.string(),
})

const StrategicAnalysisSchema = z.object({
  executive_summary: z.string().describe('2-3 paragraph executive summary for CMO/CEO. Be specific with numbers.'),
  key_findings: z.array(KeyFindingSchema).max(5),
  opportunities: z.array(OpportunitySchema).max(4),
  threats: z.array(ThreatSchema).max(3),
  content_strategy: z.array(ContentStrategySchema).max(5),
  fact_verification: z.array(FactVerificationSchema).max(5),
  competitive_intelligence: z.array(CompetitorInsightSchema).max(4),
  trend_signals: z.array(TrendSignalSchema).max(3),
})

export type StrategicAnalysis = z.infer<typeof StrategicAnalysisSchema>

// ─── Data Collection Types ──────────────────────────────────────────────────

interface BrandProfile {
  brand_name: string
  website_url: string | null
  industry: string | null
  description: string | null
  products: string | null
  value_proposition: string | null
  target_audience: string | null
  geographic_focus: string[] | null
  known_competitors: string[]
  entity_type: string | null
  location: string | null
  brand_voice: { tone?: string; key_messages?: string[]; avoid_terms?: string[] } | null
  brand_topics: string[]
}

interface VisibilityData {
  lvi_score: number
  visibility_rate: number
  avg_brand_rank: number
  avg_sentiment: number
  share_of_voice: number
  total_responses: number
  total_brand_mentions: number
  citation_rate: number
}

interface ModelBreakdown {
  model_name: string
  lvi_score: number
  visibility_rate: number
  avg_brand_rank: number
  avg_sentiment: number
  total_responses: number
  responses_with_mention: number
}

interface PromptPerformance {
  prompt_text: string
  visibility_rate: number
  avg_brand_rank: number | null
  share_of_voice: number | null
  lvi_score: number
  category: string | null
}

interface CompetitorPerformance {
  name: string
  visibility_rate: number
  avg_brand_rank: number | null
  lvi_score: number
  share_of_voice: number | null
}

interface LLMResponseSample {
  model_name: string
  prompt_text: string
  response_preview: string
  brand_mentioned: boolean
  brand_rank: number | null
  sentiment: number | null
}

interface CollectedData {
  brand: BrandProfile
  knowledgeFacts: string
  visibility: VisibilityData | null
  models: ModelBreakdown[]
  prompts: PromptPerformance[]
  competitors: CompetitorPerformance[]
  responseSamples: LLMResponseSample[]
  ruleBasedInsights: InsightEngineResult | null
  gscConnected: boolean
  gscSummary: {
    totalClicks: number
    totalImpressions: number
    avgCtr: number
    avgPosition: number
    totalQueries: number
    topQueries: Array<{ query: string; impressions: number; position: number }>
    questionQueries: Array<{ query: string; impressions: number }>
  } | null
  auditScore: number | null
  auditPillars: Array<{ name: string; score: number; maxScore: number }> | null
}

// ─── Primary model for strategic analysis ───────────────────────────────────
// Uses a high-capability model — reasoning is critical here.
const DEFAULT_PRIMARY_MODEL = 'google/gemini-2.5-flash'
const DEFAULT_FALLBACK_MODEL = 'openai/gpt-4o-mini'
const DEFAULT_FREE_FALLBACK = 'openrouter/free'

// ─── Settings loaded from admin feature flags ───────────────────────────

interface InsightAgentSettings {
  auto_generate: boolean
  generation_frequency: 'daily' | 'weekly' | 'on_run_complete'
  max_insights_per_brand: number
  include_gsc_data: boolean
  include_visibility_data: boolean
  include_competitor_data: boolean
  content_types: string[]
  min_confidence_threshold: number
  lookback_days: number
}

const DEFAULT_SETTINGS: InsightAgentSettings = {
  auto_generate: true,
  generation_frequency: 'on_run_complete',
  max_insights_per_brand: 10,
  include_gsc_data: true,
  include_visibility_data: true,
  include_competitor_data: true,
  content_types: ['visibility_trend', 'keyword_opportunity', 'competitor_gap', 'content_recommendation', 'sentiment_shift', 'citation_opportunity'],
  min_confidence_threshold: 0.7,
  lookback_days: 30,
}

// ─── Agent ──────────────────────────────────────────────────────────────────

export class StrategicInsightAgent {
  private supabase = createServiceClient()
  private knowledgeService = new BrandKnowledgeService()
  private settings: InsightAgentSettings = DEFAULT_SETTINGS

  /** Load settings from admin feature flags (insight_agent_settings) */
  private async loadSettings(): Promise<InsightAgentSettings> {
    try {
      const { data } = await this.supabase
        .from('feature_flags')
        .select('value')
        .eq('key', 'insight_agent_settings')
        .maybeSingle()

      if (data?.value) {
        this.settings = { ...DEFAULT_SETTINGS, ...data.value }
      }
    } catch {
      // Use defaults
    }
    return this.settings
  }

  /** Get the configured insight model (from admin models table) or fall back to defaults */
  private async getConfiguredModels(): Promise<{ primary: string; fallback: string }> {
    try {
      const { data: models } = await this.supabase
        .from('llm_models')
        .select('openrouter_id, sort_order')
        .eq('purpose', 'insights')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(2)

      if (models && models.length > 0) {
        return {
          primary: models[0].openrouter_id || DEFAULT_PRIMARY_MODEL,
          fallback: models[1]?.openrouter_id || DEFAULT_FALLBACK_MODEL,
        }
      }
    } catch {
      // Fall through
    }
    return { primary: DEFAULT_PRIMARY_MODEL, fallback: DEFAULT_FALLBACK_MODEL }
  }

  /** Get current settings (for admin UI display) */
  async getSettings(): Promise<InsightAgentSettings> {
    return this.loadSettings()
  }

  /**
   * Generate a full strategic analysis for a brand.
   * This is the main entry point — collects all data, sends to LLM, stores result.
   */
  async generateAnalysis(
    brandId: string,
    options?: {
      forceRefresh?: boolean
      triggerSource?: 'manual' | 'scheduled' | 'post_run' | 'on_demand'
    }
  ): Promise<StrategicAnalysis & { id: string; created_at: string; cached: boolean }> {
    const triggerSource = options?.triggerSource || 'manual'

    // Load admin-configured settings
    await this.loadSettings()
    const { primary: primaryModel, fallback: fallbackModel } = await this.getConfiguredModels()

    // Check cache first (1 hour TTL)
    if (!options?.forceRefresh) {
      const cached = await this.getCachedAnalysis(brandId)
      if (cached) {
        return { ...cached.analysis, id: cached.id, created_at: cached.created_at, cached: true }
      }
    }

    // 1. Collect all data (respecting settings toggles)
    const data = await this.collectData(brandId)

    // 2. Build the analysis prompt
    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(data)

    // 3. Call LLM with admin-configured model
    const startTime = Date.now()
    let analysis: StrategicAnalysis
    let modelUsed = primaryModel
    let tokenUsage = { promptTokens: 0, completionTokens: 0 }

    try {
      const result = await generateObject({
        model: getAgentModel(primaryModel),
        schema: StrategicAnalysisSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
        maxTokens: 8000,
      })

      analysis = result.object
      tokenUsage = {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
      }
    } catch (primaryError) {
      console.warn(`[StrategicInsight] Primary model failed, trying fallback:`, primaryError)
      modelUsed = fallbackModel

      try {
        const result = await generateObject({
          model: getAgentModel(fallbackModel),
          schema: StrategicAnalysisSchema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.3,
          maxTokens: 8000,
        })

        analysis = result.object
        tokenUsage = {
          promptTokens: result.usage?.inputTokens ?? 0,
          completionTokens: result.usage?.outputTokens ?? 0,
        }
      } catch (fallbackError) {
        console.warn(`[StrategicInsight] Fallback model failed, trying openrouter/free:`, fallbackError)
        modelUsed = DEFAULT_FREE_FALLBACK

        const result = await generateObject({
          model: getAgentModel(DEFAULT_FREE_FALLBACK),
          schema: StrategicAnalysisSchema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.3,
          maxTokens: 8000,
        })

        analysis = result.object
        tokenUsage = {
          promptTokens: result.usage?.inputTokens ?? 0,
          completionTokens: result.usage?.outputTokens ?? 0,
        }
      }
    }

    const durationMs = Date.now() - startTime

    // 4. Store result
    const { data: brand } = await this.supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    const { data: stored } = await this.supabase
      .from('strategic_insights')
      .insert({
        brand_id: brandId,
        account_id: brand?.account_id,
        model_used: modelUsed,
        generation_type: 'full_analysis',
        trigger_source: triggerSource,
        analysis,
        data_sources: {
          visibility: !!data.visibility,
          discoverability: !!data.auditScore,
          gsc: data.gscConnected,
          knowledge_base: data.knowledgeFacts.length > 0,
          response_count: data.responseSamples.length,
          prompt_count: data.prompts.length,
          competitor_count: data.competitors.length,
        },
        confidence_score: this.computeConfidence(data),
        prompt_tokens: tokenUsage.promptTokens,
        completion_tokens: tokenUsage.completionTokens,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour cache
      })
      .select('id, created_at')
      .single()

    console.log(
      `[StrategicInsight] Generated for ${data.brand.brand_name}: ` +
      `${analysis.key_findings.length} findings, ${analysis.opportunities.length} opportunities, ` +
      `${analysis.content_strategy.length} content recs in ${durationMs}ms (${modelUsed})`
    )

    return {
      ...analysis,
      id: stored?.id || '',
      created_at: stored?.created_at || new Date().toISOString(),
      cached: false,
    }
  }

  /** Get cached analysis if still valid (not expired) */
  private async getCachedAnalysis(brandId: string): Promise<{ id: string; analysis: StrategicAnalysis; created_at: string } | null> {
    const { data } = await this.supabase
      .from('strategic_insights')
      .select('id, analysis, created_at, expires_at')
      .eq('brand_id', brandId)
      .eq('generation_type', 'full_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return null

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null

    return { id: data.id, analysis: data.analysis as StrategicAnalysis, created_at: data.created_at }
  }

  /** Compute confidence score based on data availability */
  private computeConfidence(data: CollectedData): number {
    let score = 0.3 // base
    if (data.visibility) score += 0.2
    if (data.prompts.length > 0) score += 0.1
    if (data.responseSamples.length >= 5) score += 0.1
    if (data.competitors.length > 0) score += 0.1
    if (data.gscConnected) score += 0.1
    if (data.knowledgeFacts.length > 0) score += 0.1
    return Math.min(score, 1.0)
  }

  // ─── Data Collection ──────────────────────────────────────────────────

  private async collectData(brandId: string): Promise<CollectedData> {
    const s = this.settings

    // Fetch everything in parallel (skipping disabled sources)
    const [
      brandProfile,
      knowledgeFacts,
      brandMetrics,
      modelMetrics,
      promptMetrics,
      competitorMetrics,
      responseSamples,
      auditData,
      gscConnection,
    ] = await Promise.all([
      this.fetchBrandProfile(brandId),
      this.knowledgeService.getFactsAsContext(brandId),
      s.include_visibility_data ? this.fetchBrandMetrics(brandId) : Promise.resolve(null),
      s.include_visibility_data ? this.fetchModelMetrics(brandId) : Promise.resolve([]),
      this.fetchPromptMetrics(brandId),
      s.include_competitor_data ? this.fetchCompetitorMetrics(brandId) : Promise.resolve([]),
      this.fetchResponseSamples(brandId),
      this.fetchAuditData(brandId),
      s.include_gsc_data ? this.fetchGSCData(brandId) : Promise.resolve({ connected: false, summary: null } as { connected: boolean; summary: CollectedData['gscSummary'] }),
    ])

    // Also try generating rule-based insights for cross-reference
    let ruleBasedInsights: InsightEngineResult | null = null
    try {
      const { generateInsights } = await import('./insight-engine')
      ruleBasedInsights = await generateInsights(brandId)
    } catch { /* non-critical */ }

    return {
      brand: brandProfile,
      knowledgeFacts,
      visibility: brandMetrics,
      models: modelMetrics,
      prompts: promptMetrics,
      competitors: competitorMetrics,
      responseSamples,
      ruleBasedInsights,
      gscConnected: gscConnection.connected,
      gscSummary: gscConnection.summary,
      auditScore: auditData?.overallScore ?? null,
      auditPillars: auditData?.pillars ?? null,
    }
  }

  private async fetchBrandProfile(brandId: string): Promise<BrandProfile> {
    const { data } = await this.supabase
      .from('brands')
      .select('name, brand_website, primary_domain, company_website, industry, description, products_services, primary_value, target_audience, target_markets, known_competitors, entity_type, company_location, brand_voice, brand_topics')
      .eq('id', brandId)
      .single()

    return {
      brand_name: data?.name || 'Unknown',
      website_url: data?.brand_website || data?.primary_domain || data?.company_website || null,
      industry: data?.industry || null,
      description: data?.description || null,
      products: data?.products_services || null,
      value_proposition: data?.primary_value || null,
      target_audience: data?.target_audience || null,
      geographic_focus: data?.target_markets || null,
      known_competitors: data?.known_competitors || [],
      entity_type: data?.entity_type || null,
      location: data?.company_location || null,
      brand_voice: data?.brand_voice || null,
      brand_topics: data?.brand_topics || [],
    }
  }

  private async fetchBrandMetrics(brandId: string): Promise<VisibilityData | null> {
    const { data } = await this.supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return null
    return {
      lvi_score: data.lvi_score ?? 0,
      visibility_rate: data.visibility_rate ?? 0,
      avg_brand_rank: data.avg_brand_rank ?? 0,
      avg_sentiment: data.avg_sentiment ?? 0,
      share_of_voice: data.share_of_voice ?? 0,
      total_responses: data.total_responses ?? 0,
      total_brand_mentions: data.total_brand_mentions ?? 0,
      citation_rate: data.citation_rate ?? 0,
    }
  }

  private async fetchModelMetrics(brandId: string): Promise<ModelBreakdown[]> {
    const { data } = await this.supabase
      .from('daily_model_metrics')
      .select('model_name, lvi_score, visibility_rate, avg_brand_rank, avg_sentiment, total_responses, responses_with_mention')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false })
      .limit(20)

    // Deduplicate by model (keep the latest)
    const modelMap = new Map<string, ModelBreakdown>()
    for (const row of (data || [])) {
      if (!modelMap.has(row.model_name)) {
        modelMap.set(row.model_name, {
          model_name: row.model_name,
          lvi_score: row.lvi_score ?? 0,
          visibility_rate: row.visibility_rate ?? 0,
          avg_brand_rank: row.avg_brand_rank ?? 0,
          avg_sentiment: row.avg_sentiment ?? 0,
          total_responses: row.total_responses ?? 0,
          responses_with_mention: row.responses_with_mention ?? 0,
        })
      }
    }
    return Array.from(modelMap.values())
  }

  private async fetchPromptMetrics(brandId: string): Promise<PromptPerformance[]> {
    const { data } = await this.supabase
      .from('daily_prompt_metrics')
      .select('prompt_id, visibility_rate, avg_brand_rank, share_of_voice, lvi_score')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false })
      .limit(50)

    if (!data || data.length === 0) return []

    // Get prompt texts
    const promptIds = [...new Set(data.map(d => d.prompt_id))]
    const { data: prompts } = await this.supabase
      .from('user_prompts')
      .select('id, prompt_text, category')
      .in('id', promptIds)

    const promptMap = new Map<string, { text: string; category: string | null }>()
    for (const p of (prompts || [])) {
      promptMap.set(p.id, { text: p.prompt_text, category: p.category })
    }

    // Deduplicate by prompt_id
    const seen = new Set<string>()
    return data
      .filter(d => {
        if (seen.has(d.prompt_id)) return false
        seen.add(d.prompt_id)
        return true
      })
      .map(d => {
        const p = promptMap.get(d.prompt_id)
        return {
          prompt_text: p?.text || 'Unknown prompt',
          visibility_rate: d.visibility_rate ?? 0,
          avg_brand_rank: d.avg_brand_rank,
          share_of_voice: d.share_of_voice,
          lvi_score: d.lvi_score ?? 0,
          category: p?.category || null,
        }
      })
  }

  private async fetchCompetitorMetrics(brandId: string): Promise<CompetitorPerformance[]> {
    const { data: competitors } = await this.supabase
      .from('competitors')
      .select('id, competitor_name')
      .eq('brand_id', brandId)

    if (!competitors || competitors.length === 0) return []

    const { data: metrics } = await this.supabase
      .from('daily_competitor_metrics')
      .select('competitor_id, visibility_rate, avg_brand_rank, lvi_score, share_of_voice')
      .in('competitor_id', competitors.map(c => c.id))
      .order('run_date', { ascending: false })
      .limit(50)

    const compMap = new Map<string, any>()
    for (const d of (metrics || [])) {
      if (!compMap.has(d.competitor_id)) compMap.set(d.competitor_id, d)
    }

    const nameMap = new Map<string, string>()
    for (const c of competitors) nameMap.set(c.id, c.competitor_name)

    return Array.from(compMap.entries()).map(([id, d]) => ({
      name: nameMap.get(id) || 'Unknown',
      visibility_rate: d.visibility_rate ?? 0,
      avg_brand_rank: d.avg_brand_rank,
      lvi_score: d.lvi_score ?? 0,
      share_of_voice: d.share_of_voice,
    }))
  }

  private async fetchResponseSamples(brandId: string): Promise<LLMResponseSample[]> {
    // Get actual LLM responses for fact-checking
    const { data: responses } = await this.supabase
      .from('llm_response_files')
      .select('id, model_name, prompt_text, response_preview, storage_path')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(12)

    if (!responses || responses.length === 0) return []

    // Get response_data for each
    const responseIds = responses.map(r => r.id)
    const { data: rd } = await this.supabase
      .from('response_data')
      .select('response_id, mentioned, brand_rank, raw_sentiment')
      .eq('brand_id', brandId)
      .in('response_id', responseIds)

    const rdMap = new Map<string, any>()
    for (const r of (rd || [])) {
      rdMap.set(r.response_id, r)
    }

    return responses.map(r => {
      const d = rdMap.get(r.id)
      return {
        model_name: r.model_name,
        prompt_text: r.prompt_text?.substring(0, 200) || '',
        response_preview: r.response_preview?.substring(0, 500) || '',
        brand_mentioned: d?.mentioned ?? false,
        brand_rank: d?.brand_rank ?? null,
        sentiment: d?.raw_sentiment ?? null,
      }
    })
  }

  private async fetchAuditData(brandId: string): Promise<{ overallScore: number; pillars: Array<{ name: string; score: number; maxScore: number }> } | null> {
    const { data } = await this.supabase
      .from('discoverability_audits')
      .select('overall_score, audit_results')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return null

    const pillars = (data.audit_results?.pillars || []).map((p: any) => ({
      name: p.name,
      score: p.score,
      maxScore: p.maxScore,
    }))

    return { overallScore: data.overall_score ?? 0, pillars }
  }

  private async fetchGSCData(brandId: string): Promise<{
    connected: boolean
    summary: CollectedData['gscSummary']
  }> {
    const { data: connection } = await this.supabase
      .from('gsc_connections')
      .select('id, is_active, site_url')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .maybeSingle()

    if (!connection || connection.site_url === 'pending_selection') {
      return { connected: false, summary: null }
    }

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: rows } = await this.supabase
      .from('gsc_performance_data')
      .select('query, clicks, impressions, ctr, position')
      .eq('brand_id', brandId)
      .not('query', 'is', null)
      .gte('date', startDate)
      .order('impressions', { ascending: false })
      .limit(500)

    if (!rows || rows.length === 0) return { connected: true, summary: null }

    // Aggregate
    const queryMap = new Map<string, { clicks: number; impressions: number; position: number; count: number }>()
    for (const row of rows) {
      const e = queryMap.get(row.query) || { clicks: 0, impressions: 0, position: 0, count: 0 }
      queryMap.set(row.query, {
        clicks: e.clicks + row.clicks,
        impressions: e.impressions + row.impressions,
        position: e.position + row.position,
        count: e.count + 1,
      })
    }

    const queries = Array.from(queryMap.entries())
      .map(([query, d]) => ({
        query,
        clicks: d.clicks,
        impressions: d.impressions,
        position: d.count > 0 ? d.position / d.count : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)

    const totalClicks = queries.reduce((s, q) => s + q.clicks, 0)
    const totalImpressions = queries.reduce((s, q) => s + q.impressions, 0)
    const questionWords = /^(who|what|where|when|why|how|is|are|can|do|does|should|which)\b/i

    return {
      connected: true,
      summary: {
        totalClicks,
        totalImpressions,
        avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        avgPosition: queries.length > 0 ? queries.reduce((s, q) => s + q.position, 0) / queries.length : 0,
        totalQueries: queries.length,
        topQueries: queries.slice(0, 20).map(q => ({ query: q.query, impressions: q.impressions, position: q.position })),
        questionQueries: queries.filter(q => questionWords.test(q.query)).slice(0, 15).map(q => ({ query: q.query, impressions: q.impressions })),
      },
    }
  }

  // ─── Prompt Building ──────────────────────────────────────────────────

  private buildSystemPrompt(): string {
    return `You are a world-class AI Visibility Strategist working for Soma AI, a Generative Engine Optimization (GEO) platform. You analyze brand performance data across AI search engines (ChatGPT, Gemini, Grok, Perplexity, etc.) and traditional search (Google Search Console).

Your job is to produce a comprehensive strategic analysis that a CMO or Head of Marketing would find immediately actionable. You must:

1. ALWAYS cite specific numbers from the data. Never make vague statements like "improve visibility" — say exactly what the numbers show.
2. For fact verification, compare what AI models say about the brand against the VERIFIED BRAND FACTS provided. Flag any inaccuracies.
3. For content strategy, recommend SPECIFIC content pieces with SPECIFIC target publications relevant to the brand's industry.
4. For competitive intelligence, explain not just what competitors do better, but WHY and HOW to close the gap.
5. For opportunities, quantify the potential impact where possible (e.g., "capturing this query could increase visibility by ~15%").
6. Be direct and honest. If the data shows serious problems, say so clearly.

KEY METRICS EXPLAINED:
- LVI Score (0-100): Language Visibility Index. 100 = perfect visibility across all AI models. Components: Position (35%), Visibility Rate (30%), Citations (15%), Sentiment (20%).
- Visibility Rate: % of AI responses that mention the brand.
- Avg Brand Rank: Average position when mentioned (1 = first, lower is better). Non-mentions count as rank 10.
- Share of Voice: Brand's share of all mentions across competitive responses.
- Citation Rate: % of mentioned responses that cite the brand's sources.
- Position Score: Derived from avg_brand_rank. Formula: (1 - (rank - 1) / 9) * 100.

INDUSTRY CONTEXT:
- Generative Engine Optimization (GEO) is a nascent field. Most brands don't even know they should optimize for AI search.
- AI search engines are replacing or augmenting traditional search. Early movers get outsized advantages.
- Key ranking factors for AI visibility: authoritative content, third-party citations, structured data, community discussions, and brand consistency.`
  }

  private buildUserPrompt(data: CollectedData): string {
    const sections: string[] = []

    // Brand profile
    sections.push(`## BRAND PROFILE
- Name: ${data.brand.brand_name}
- Website: ${data.brand.website_url || 'N/A'}
- Industry: ${data.brand.industry || 'N/A'}
- Entity Type: ${data.brand.entity_type || 'brand'}
- Description: ${data.brand.description || 'N/A'}
- Products/Services: ${data.brand.products || 'N/A'}
- Value Proposition: ${data.brand.value_proposition || 'N/A'}
- Target Audience: ${data.brand.target_audience || 'N/A'}
- Geographic Focus: ${data.brand.geographic_focus?.join(', ') || 'N/A'}
- Location: ${data.brand.location || 'N/A'}
- Brand Topics: ${data.brand.brand_topics.length > 0 ? data.brand.brand_topics.join(', ') : 'N/A'}
- Known Competitors: ${data.brand.known_competitors.length > 0 ? data.brand.known_competitors.join(', ') : 'None listed'}`)

    // Knowledge facts
    if (data.knowledgeFacts) {
      sections.push(`## ${data.knowledgeFacts}`)
    }

    // Visibility data
    if (data.visibility) {
      const v = data.visibility
      const positionScore = v.avg_brand_rank > 0 ? Math.max(0, (1 - (v.avg_brand_rank - 1) / 9) * 100) : 0
      sections.push(`## CURRENT VISIBILITY METRICS
- LVI Score: ${v.lvi_score.toFixed(1)}/100
- Visibility Rate: ${v.visibility_rate.toFixed(1)}% (brand appears in ${v.total_brand_mentions}/${v.total_responses} AI responses)
- Average Position: ${v.avg_brand_rank.toFixed(1)} (Position Score: ${positionScore.toFixed(1)}%)
- Sentiment: ${v.avg_sentiment.toFixed(3)} (-1 to 1 scale, ${v.avg_sentiment > 0.1 ? 'positive' : v.avg_sentiment < -0.1 ? 'negative' : 'neutral'})
- Share of Voice: ${(v.share_of_voice * 100).toFixed(1)}%
- Citation Rate: ${v.citation_rate.toFixed(1)}%`)
    } else {
      sections.push(`## VISIBILITY DATA: No visibility data available yet.`)
    }

    // Model breakdown
    if (data.models.length > 0) {
      const modelLines = data.models.map(m => {
        const shortName = m.model_name.split('/').pop()?.split(':')[0] || m.model_name
        return `  - ${shortName}: LVI=${m.lvi_score.toFixed(1)}, Vis=${m.visibility_rate.toFixed(0)}%, Rank=${m.avg_brand_rank ? m.avg_brand_rank.toFixed(1) : 'N/A'}, Sentiment=${m.avg_sentiment.toFixed(2)}, Mentions=${m.responses_with_mention}/${m.total_responses}`
      })
      sections.push(`## PER-MODEL BREAKDOWN\n${modelLines.join('\n')}`)
    }

    // Prompt performance
    if (data.prompts.length > 0) {
      const promptLines = data.prompts.map(p => {
        const short = p.prompt_text.length > 80 ? p.prompt_text.substring(0, 80) + '...' : p.prompt_text
        return `  - "${short}" → Vis=${p.visibility_rate.toFixed(0)}%, Rank=${p.avg_brand_rank?.toFixed(1) ?? 'N/M'}, SOV=${p.share_of_voice ? (p.share_of_voice * 100).toFixed(0) + '%' : 'N/A'}, LVI=${p.lvi_score.toFixed(0)}`
      })
      sections.push(`## PROMPT PERFORMANCE\n${promptLines.join('\n')}`)
    }

    // Competitor performance
    if (data.competitors.length > 0) {
      const compLines = data.competitors.map(c =>
        `  - ${c.name}: Vis=${c.visibility_rate.toFixed(0)}%, Rank=${c.avg_brand_rank?.toFixed(1) ?? 'N/M'}, LVI=${c.lvi_score.toFixed(0)}, SOV=${c.share_of_voice ? (c.share_of_voice * 100).toFixed(0) + '%' : 'N/A'}`
      )
      sections.push(`## COMPETITOR PERFORMANCE\n${compLines.join('\n')}`)
    }

    // Response samples for fact-checking
    if (data.responseSamples.length > 0) {
      const sampleLines = data.responseSamples.slice(0, 8).map((s, i) => {
        const shortModel = s.model_name.split('/').pop()?.split(':')[0] || s.model_name
        return `[${i + 1}] Model: ${shortModel} | Prompt: "${s.prompt_text.substring(0, 100)}"
    Mentioned: ${s.brand_mentioned ? 'Yes' : 'No'} | Rank: ${s.brand_rank ?? 'N/A'} | Sentiment: ${s.sentiment?.toFixed(2) ?? 'N/A'}
    Response excerpt: "${s.response_preview.substring(0, 300)}"`
      })
      sections.push(`## AI RESPONSE SAMPLES (for fact verification)\n${sampleLines.join('\n\n')}`)
    }

    // GSC data
    if (data.gscConnected && data.gscSummary) {
      const g = data.gscSummary
      const topQLines = g.topQueries.slice(0, 10).map(q =>
        `  - "${q.query}" — ${q.impressions.toLocaleString()} imp, pos ${q.position.toFixed(1)}`
      )
      const questionLines = g.questionQueries.slice(0, 10).map(q =>
        `  - "${q.query}" — ${q.impressions.toLocaleString()} imp`
      )
      sections.push(`## GOOGLE SEARCH CONSOLE (last 30 days)
- Total Clicks: ${g.totalClicks.toLocaleString()}
- Total Impressions: ${g.totalImpressions.toLocaleString()}
- Avg CTR: ${(g.avgCtr * 100).toFixed(1)}%
- Avg Position: ${g.avgPosition.toFixed(1)}
- Unique Queries: ${g.totalQueries}

Top Queries:
${topQLines.join('\n')}

Question Queries (high AI overlap):
${questionLines.length > 0 ? questionLines.join('\n') : '  None detected'}`)
    }

    // Audit data
    if (data.auditScore !== null && data.auditPillars) {
      const pillarLines = data.auditPillars.map(p =>
        `  - ${p.name}: ${p.score}/${p.maxScore}`
      )
      sections.push(`## DISCOVERABILITY AUDIT
- Overall Score: ${data.auditScore}/100
${pillarLines.join('\n')}`)
    }

    // Rule-based insights (give the LLM the existing analysis to build on)
    if (data.ruleBasedInsights && data.ruleBasedInsights.insights.length > 0) {
      const insightLines = data.ruleBasedInsights.insights.map(i =>
        `  - [${i.impact.toUpperCase()}] ${i.action}: ${i.insight.substring(0, 200)}`
      )
      sections.push(`## PRE-COMPUTED INSIGHTS (rule-based, for your reference)
${insightLines.join('\n')}`)
    }

    sections.push(`\n## INSTRUCTIONS
Analyze ALL the data above and produce a comprehensive strategic analysis. Be specific, cite data points, and make actionable recommendations. For fact verification, compare every response sample against the verified brand facts and flag any inaccuracies. For content strategy, recommend specific content pieces with specific target publications relevant to the "${data.brand.industry || 'technology'}" industry.`)

    return sections.join('\n\n')
  }
}
