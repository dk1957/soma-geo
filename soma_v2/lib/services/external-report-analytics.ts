/**
 * External Report Analytics Service
 * 
 * Provides data access layer for external brand visibility reports
 * Uses the new aggregated metrics tables for fast, efficient queries
 */

import { createServiceClient } from '@/lib/supabase/server'

export type MetricPeriod = '7d' | '30d' | '90d' | 'all'

function periodStartDate(period: MetricPeriod): string {
  const d = new Date()
  switch (period) {
    case '7d': d.setDate(d.getDate() - 7); break
    case '30d': d.setDate(d.getDate() - 30); break
    case '90d': d.setDate(d.getDate() - 90); break
    default: d.setFullYear(d.getFullYear() - 10)
  }
  return d.toISOString().split('T')[0]
}

export interface BrandPerformanceMetrics {
  brand_id: string
  brand_name: string
  is_primary_brand: boolean
  metric_period: MetricPeriod
  
  // Core metrics
  mention_rate: number
  avg_sentiment_score: number
  avg_ranking_position: number | null
  total_citations: number
  lvi_score: number
  share_of_voice: number
  
  // Ranking
  industry_rank: number | null
  rank_change: number
  
  // Trends
  mention_rate_change: number
  sentiment_change: number
  lvi_change: number
  ranking_change: number
  trend_direction: string | null
  
  // Counts
  total_prompts_analyzed: number
  total_responses_analyzed: number
  total_mentions: number
  top_3_mentions: number
  first_position_count: number
  
  // Sentiment breakdown
  positive_mentions: number
  neutral_mentions: number
  negative_mentions: number
  
  // Quality
  data_quality_score: number
  sample_size: number
}

export interface TopicBrandAssociation {
  brand_name: string
  is_primary_brand: boolean
  topic_name: string
  mention_count: number
  co_occurrence_rate: number
  relevance_score: number
  avg_sentiment_when_mentioned: number
  competitive_advantage_score: number
  sample_contexts?: any[]
}

export interface BrandMetricsTimeseries {
  snapshot_date: string
  lvi_score: number
  mention_rate: number
  avg_sentiment: number
  avg_ranking: number | null
  citation_rate: number
  share_of_voice: number
  
  // Deltas
  lvi_delta: number
  mention_rate_delta: number
  sentiment_delta: number
}

export interface PromptPerformance {
  prompt_id: string
  prompt_text: string
  prompt_category: string | null
  prompt_intent: string | null
  
  total_responses: number
  total_models_tested: number
  models_list: string[]
  
  // Primary brand
  primary_brand_mentioned: boolean
  primary_brand_mention_rate: number
  primary_brand_avg_position: number | null
  primary_brand_sentiment: number
  primary_brand_citations: number
  primary_brand_lvi: number
  
  // Competition
  top_competitor_name: string | null
  top_competitor_mentions: number
  visibility_gap: number
  
  // Classification
  is_opportunity: boolean
  is_strength: boolean
  is_threat: boolean
  opportunity_score: number
  strategic_priority: string | null
  action_required: string | null
  
  // Model breakdown
  model_performance: any
}

export interface CitationDomain {
  domain: string
  domain_type: string | null  // owned, earned, competitor
  source_category: string | null  // news, editorial, blog, ugc, social, reference, academic, government, institutional, corporate, own, competitor, other
  total_citations: number
  unique_responses_citing: number
  used_percentage: number
  avg_citations_per_response: number
  trust_score: number | null
  is_authoritative: boolean
  is_target_publisher: boolean
  is_competitor: boolean
  is_inferred_competitor: boolean  // true if competitor was inferred from AI co-mentions, not from DB
  competitor_name: string | null  // name of the competitor brand if domain_type === 'competitor'
  partnership_opportunity_score: number
  associated_topics: string[]
  associated_brands: string[]
  brands_mentioned_in_sources: string[]  // brands mentioned across all sources from this domain
  citing_models: string[]
  sample_contexts?: Array<{ url: string; title: string; context: string }> | string[]
  avg_citation_position?: number | null
  first_citation_count?: number
  citation_share?: number
}

export class ExternalReportAnalyticsService {
  private supabase: any
  
  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createServiceClient()
  }

  /**
   * Get response IDs belonging to a specific brand (for scoping queries to brand, not account)
   */
  private async getBrandResponseIds(brandId: string, startDate: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('llm_response_files')
      .select('id')
      .eq('brand_id', brandId)
      .gte('created_at', `${startDate}T00:00:00Z`)
    return (data || []).map((r: any) => r.id)
  }

  /**
   * Fetch aeo_citations scoped to a brand's responses (not account-wide)
   */
  private async fetchBrandCitations(brandId: string, startDate: string, selectFields: string, limit = 5000): Promise<any[]> {
    const responseIds = await this.getBrandResponseIds(brandId, startDate)
    if (responseIds.length === 0) return []

    const citations: any[] = []
    const batchSize = 200
    for (let i = 0; i < responseIds.length; i += batchSize) {
      const batch = responseIds.slice(i, i + batchSize)
      const { data, error } = await this.supabase
        .from('aeo_citations')
        .select(selectFields)
        .in('response_id', batch)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) {
        console.error('Error fetching brand citations:', error)
        continue
      }
      citations.push(...(data || []))
    }
    return citations
  }

  /**
   * Domain classification rules — regex patterns for well-known site types.
   * Shared between classifyDomainCategory and competitor inference.
   * Order matters: more specific patterns first.
   */
  private static readonly DOMAIN_RULES: [string, RegExp][] = [
    // Government & regulatory (check before .org catch-all)
    ['government', /\.gov(?:\.|$)|centralbank|treasury|reserve[\.\-]?bank|bou\.or|cbk\.or|cbn\.gov|bog\.gov|sarb\.co|fca\.org|bis\.org|kenyalaw|odpc\.go|ca\.go|opendata\.go|nimc\.gov/],
    // News & media
    ['news', /reuters|bbc|cnn|bloomberg|nytimes|theguardian|washingtonpost|aljazeera|techcrunch|theverge|wired|cnbc|apnews|ft\.com|economist|businessinsider|zdnet|venturebeat|newsroom|dailymail|telegraph|skynews|africanews|citinewsroom|pulse\.ng|premiumtimes|thecable|punchng|dailyguide|myjoyonline|ghanaweb|nation\.co\.ke|standardmedia|businessdaily|news24|nairametrics|techcabal|disrupt-africa|weetracker|benjamindada|tuko\.co|capitalfm|pulse\.co|kenyanvibe|nairobionline|searchengineland|searchenginejournal/],
    // Editorial / opinion publications
    ['editorial', /forbes|fortune|inc\.com|entrepreneur|hbr\.org|fastcompany|theatlantic|newyorker|slate|salon|theconversation|project-syndicate/],
    // Reference (before academic — Wikipedia is reference, not academic)
    ['reference', /wikipedia|wikimedia|britannica|merriam-webster|dictionary/],
    // UGC (reviews, comparison, forums, Q&A, app stores, beer/travel ratings)
    ['ugc', /trustpilot|g2\.com|capterra|yelp|tripadvisor|glassdoor|producthunt|stackexchange|stackoverflow|quora|play\.google|apps\.apple|untappd|beeradvocate|ratebeer|nerdwallet|pcmag|techradar|cnet|finder\.|bankrate|investopedia|compare|moneywise|wirecutter|consumerreports|which\.co|monito\.com|remitanalyst|exiap|selectra|comparetransfer|exchangerates|fxcompared|expatcom|expatica|expat\.com|compareremit|tomsguide|remitfinder|statrys|transfergo\.com|remitbee|benchmark\.exchange/],
    // Academic & research
    ['academic', /\.edu(?:\.|$)|scholar\.google|arxiv|pubmed|researchgate|academia\.edu|springer|wiley|ieee|jstor|sciencedirect|nature\.com|science\.org|nih\.gov|ssrn/],
    // Social media platforms
    ['social', /(?:^|\.)twitter\.com|(?:^|\.)x\.com|linkedin\.com|facebook\.com|(?:^|\.)reddit\.com|instagram\.com|tiktok\.com|youtube\.com|pinterest\.com|threads\.net/],
    // Blogs & newsletters (platforms only — not company blogs)
    ['blog', /medium\.com|substack|wordpress|blogger|hashnode|dev\.to|ghost\.io|tumblr|steemit/],
    // Institutional (specific international organizations — NOT a generic .org catch-all)
    ['institutional', /who\.int|un\.org|undp\.org|unicef\.org|worldbank\.org|blogs\.worldbank|remittanceprices\.worldbank|europa\.eu|imf\.org|weforum|webfoundation|gsma\.com|cgap\.org|itu\.int|migrationpolicy\.org|fsdkenya|wto\.org|oecd\.org|iom\.int|unhcr\.org/],
    // Corporate (consulting, enterprise, big tech — large companies unlikely to be direct competitors)
    ['corporate', /mckinsey|gartner|forrester|deloitte|pwc|kpmg|ey\.com|bcg\.com|statista|idc\.com|accenture|bain\.com|capgemini|nielsen|kantar|euromonitor|frost\.com|amazon|shopify|ebay|walmart|alibaba|jumia|hubspot|google\.com|azure|cloud\.google|aws\.amazon|microsoft\.com/],
  ]

  /**
   * Check if a domain matches any of the well-known non-competitor regex rules.
   * Returns the matched category or null if no regex matched.
   * Used to determine if a domain is eligible for competitor inference.
   */
  private classifyDomainByRegex(domain: string): string | null {
    if (!domain) return null
    const d = domain.toLowerCase()
    if (/\s/.test(d) || !d.includes('.')) return null
    const knownShortDomains = ['t.co', 'x.com', 'g.co', 'fb.com']
    if (d.split('.')[0].length <= 1 && !knownShortDomains.includes(d)) return null

    for (const [category, pattern] of ExternalReportAnalyticsService.DOMAIN_RULES) {
      if (pattern.test(d)) return category
    }
    return null
  }

  /**
   * Classify a domain into a source category.
   * Uses regex rules first, then falls back to stored category if valid.
   */
  private classifyDomainCategory(domain: string, existingCategory?: string | null): string {
    if (!domain) return 'other'

    // Try regex rules first
    const regexResult = this.classifyDomainByRegex(domain)
    if (regexResult) return regexResult

    // Hallucination filter (same checks as classifyDomainByRegex but returns 'other' not null)
    const d = domain.toLowerCase()
    if (/\s/.test(d) || !d.includes('.')) return 'other'
    const knownShortDomains = ['t.co', 'x.com', 'g.co', 'fb.com']
    if (d.split('.')[0].length <= 1 && !knownShortDomains.includes(d)) return 'other'

    // ── Fallback to existing category if valid ──
    // Only used when no query-time rule matched — handles niche domains that
    // were correctly classified by the LLM at analysis time
    const validCategories = ['news', 'editorial', 'blog', 'ugc', 'social', 'reference', 'academic', 'government', 'institutional', 'corporate']
    if (existingCategory) {
      const normalized = existingCategory.toLowerCase()
      // Map legacy categories
      const legacyMap: Record<string, string> = {
        'fintech': 'corporate', 'telecom': 'corporate', 'industry': 'corporate', 'e-commerce': 'corporate',
        'official': 'institutional', 'user-generated': 'ugc', 'comparison': 'ugc',
      }
      const mapped = legacyMap[normalized] || normalized
      if (validCategories.includes(mapped)) return mapped
    }

    return 'other'
  }
  
  /**
   * Helper to calculate LVI score — canonical formula
   * LVI = Visibility*0.35 + Position*0.30 + Citation*0.15 + Sentiment*0.20
   */
  private calculateLVI(mentionRate: number, citationRate: number, sentiment: number, position: number | null): number {
    const visibility = mentionRate || 0
    const citation = citationRate || 0
    const sentimentScore = ((sentiment || 0) + 1) / 2 * 100
    
    // Position: ordinal rank 1=100, rank 10=0
    const positionScore = (position !== null && position > 0)
      ? Math.max(0, (1 - (position - 1) / 9)) * 100
      : 0
    
    // Zero-visibility rule
    if (visibility === 0) return 0
    
    return Math.round(
      Math.min(100, Math.max(0,
        (visibility * 0.35) +
        (positionScore * 0.30) +
        (citation * 0.15) +
        (sentimentScore * 0.20)
      ))
    )
  }

  /**
   * Get overall brand performance metrics from daily_brand_metrics
   */
  async getBrandPerformanceMetrics(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    runId?: string,
    model?: string
  ): Promise<BrandPerformanceMetrics | null> {
    const startDate = periodStartDate(period)

    const { data, error } = await this.supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('account_id', accountId)
      .eq('brand_id', brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: false })

    if (error || !data || data.length === 0) {
      if (error) console.error('Error fetching brand performance metrics:', error)
      return null
    }

    // Get brand name
    const { data: brandInfo } = await this.supabase
      .from('brands')
      .select('name')
      .eq('id', brandId)
      .single()

    // Aggregate across all dates in this period
    const totalResponses = data.reduce((s: number, r: any) => s + r.total_responses, 0)
    const totalMentions = data.reduce((s: number, r: any) => s + r.responses_with_mention, 0)
    const totalCitations = data.reduce((s: number, r: any) => s + r.total_citations, 0)
    const avgVisibility = totalResponses > 0
      ? data.reduce((s: number, r: any) => s + r.visibility_rate * r.total_responses, 0) / totalResponses
      : 0
    const avgSentiment = totalMentions > 0
      ? data.reduce((s: number, r: any) => s + (r.avg_sentiment || 0) * r.responses_with_mention, 0) / totalMentions
      : 0
    const avgRank = totalMentions > 0
      ? data.reduce((s: number, r: any) => s + (r.avg_brand_rank || 0) * r.responses_with_mention, 0) / totalMentions
      : null
    const avgCitRate = totalResponses > 0
      ? data.reduce((s: number, r: any) => s + (r.citation_rate || 0) * r.total_responses, 0) / totalResponses
      : 0
    const avgSoV = totalResponses > 0
      ? data.reduce((s: number, r: any) => s + (r.share_of_voice || 0) * r.total_responses, 0) / totalResponses
      : 0
    const avgRecRate = totalResponses > 0
      ? data.reduce((s: number, r: any) => s + (r.recommendation_rate || 0) * r.total_responses, 0) / totalResponses
      : 0

    const latest = data[0]
    const previous = data.length > 1 ? data[1] : null

    return {
      brand_id: brandId,
      brand_name: brandInfo?.name || 'Unknown',
      is_primary_brand: true,
      metric_period: period,
      mention_rate: avgVisibility,
      avg_sentiment_score: avgSentiment,
      avg_ranking_position: avgRank,
      total_citations: totalCitations,
      lvi_score: latest?.lvi_score || 0,
      share_of_voice: avgSoV,
      industry_rank: null,
      rank_change: 0,
      mention_rate_change: previous ? (latest.visibility_rate - previous.visibility_rate) : 0,
      sentiment_change: previous ? (latest.avg_sentiment - previous.avg_sentiment) : 0,
      lvi_change: previous ? (latest.lvi_score - previous.lvi_score) : 0,
      ranking_change: 0,
      trend_direction: previous
        ? (latest.lvi_score > previous.lvi_score ? 'up' : latest.lvi_score < previous.lvi_score ? 'down' : 'stable')
        : null,
      total_prompts_analyzed: 0,
      total_responses_analyzed: totalResponses,
      total_mentions: totalMentions,
      top_3_mentions: 0,
      first_position_count: Math.round(avgRecRate * totalResponses / 100),
      positive_mentions: 0,
      neutral_mentions: 0,
      negative_mentions: 0,
      data_quality_score: 85,
      sample_size: totalResponses,
    }
  }
  
  /**
   * Get industry rankings (all brands in account) from daily_brand_metrics
   */
  async getIndustryRankings(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    limit: number = 10,
    model?: string
  ): Promise<BrandPerformanceMetrics[]> {
    const startDate = periodStartDate(period)

    // Get latest daily_brand_metrics for all brands in this account
    const { data, error } = await this.supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('account_id', accountId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: false })

    if (error || !data || data.length === 0) {
      if (error) console.error('Error fetching industry rankings:', error)
      return []
    }

    // Get brand names
    const brandIds = [...new Set(data.map((d: any) => d.brand_id))]
    const { data: brands } = await this.supabase
      .from('brands')
      .select('id, name')
      .in('id', brandIds)

    const brandNameMap = new Map((brands || []).map((b: any) => [b.id, b.name]))

    // Aggregate per brand (latest entry)
    const latestByBrand = new Map<string, any>()
    for (const row of data) {
      if (!latestByBrand.has(row.brand_id)) {
        latestByBrand.set(row.brand_id, row)
      }
    }

    const ranked = [...latestByBrand.values()]
      .sort((a: any, b: any) => (b.lvi_score || 0) - (a.lvi_score || 0))
      .slice(0, limit)

    return ranked.map((item: any, index: number) => {
      // Zero-visibility enforcement: no mentions = LVI 0, sentiment meaningless
      const isInvisible = (item.visibility_rate || 0) === 0 && (item.responses_with_mention || 0) === 0
      return {
        brand_id: item.brand_id,
        brand_name: brandNameMap.get(item.brand_id) || 'Unknown',
        is_primary_brand: item.brand_id === brandId,
        metric_period: period,
        mention_rate: item.visibility_rate || 0,
        avg_sentiment_score: isInvisible ? 0 : (item.avg_sentiment || 0),
        avg_ranking_position: isInvisible ? null : (item.avg_brand_rank || null),
        total_citations: item.total_citations || 0,
        lvi_score: isInvisible ? 0 : (item.lvi_score || 0),
        share_of_voice: isInvisible ? 0 : (item.share_of_voice || 0),
        industry_rank: index + 1,
        rank_change: 0,
        mention_rate_change: 0,
        sentiment_change: 0,
        lvi_change: 0,
        ranking_change: 0,
        trend_direction: null,
        total_prompts_analyzed: 0,
        total_responses_analyzed: item.total_responses || 0,
        total_mentions: item.responses_with_mention || 0,
        top_3_mentions: 0,
        first_position_count: 0,
        positive_mentions: 0,
        neutral_mentions: 0,
        negative_mentions: 0,
        data_quality_score: 100,
        sample_size: item.total_responses || 0,
      } as BrandPerformanceMetrics
    })
  }
  
  /**
   * Get topic-brand associations from the topic_brand_associations table.
   * Returns per-brand topic data with sentiment for heatmap visualization.
   */
  async getTopicBrandAssociations(
    accountId: string,
    period: MetricPeriod = 'all',
    model?: string
  ): Promise<{ brands: string[], topics: string[], data: any[] }> {
    // Query topic_brand_associations for this account
    const { data: rows, error } = await this.supabase
      .from('topic_brand_associations')
      .select('topic_name, topic_category, brand_name, brand_id, competitor_id, sentiment, relevance')
      .eq('account_id', accountId)

    if (error || !rows || rows.length === 0) {
      return { brands: [], topics: [], data: [] }
    }

    // Aggregate: group by (topic_name, brand_name) → count, avg sentiment, avg relevance
    const aggMap = new Map<string, Map<string, { count: number; sentSum: number; relSum: number; brandId: string | null; competitorId: string | null }>>()
    for (const row of rows) {
      if (!aggMap.has(row.topic_name)) aggMap.set(row.topic_name, new Map())
      const brandMap = aggMap.get(row.topic_name)!
      if (!brandMap.has(row.brand_name)) {
        brandMap.set(row.brand_name, { count: 0, sentSum: 0, relSum: 0, brandId: row.brand_id, competitorId: row.competitor_id })
      }
      const entry = brandMap.get(row.brand_name)!
      entry.count++
      entry.sentSum += row.sentiment || 0
      entry.relSum += row.relevance || 0
    }

    const topics = [...aggMap.keys()]
    const brands = [...new Set(rows.map(r => r.brand_name))]

    const data = [...aggMap.entries()].flatMap(([topicName, brandMap]) =>
      [...brandMap.entries()].map(([brandName, stats]) => ({
        topic_name: topicName,
        brand_name: brandName,
        mention_count: stats.count,
        avg_sentiment: stats.count > 0 ? Math.round((stats.sentSum / stats.count) * 100) / 100 : 0,
        avg_relevance: stats.count > 0 ? Math.round((stats.relSum / stats.count) * 100) / 100 : 0,
        is_primary_brand: !stats.competitorId,
      }))
    )

    return { brands, topics, data }
  }
  
  /**
   * Get brand-topic matrix (formatted for heatmap)
   */
  async getTopicBrandMatrix(
    accountId: string,
    period: MetricPeriod = 'all',
    maxTopics: number = 8,
    model?: string
  ) {
    const { brands, topics, data } = await this.getTopicBrandAssociations(accountId, period, model)
    
    const topicMentions = new Map<string, number>()
    data.forEach((d: any) => {
      const current = topicMentions.get(d.topic_name) || 0
      topicMentions.set(d.topic_name, current + (d.mention_count || 0))
    })
    
    let filteredTopics = topics
    if (maxTopics > 0 && topics.length > maxTopics) {
      filteredTopics = [...topics]
        .sort((a, b) => (topicMentions.get(b) || 0) - (topicMentions.get(a) || 0))
        .slice(0, maxTopics)
    }
    
    const matrix = brands.map(brand => {
      const brandData = data.filter((d: any) => d.brand_name === brand)
      const isPrimary = brandData[0]?.is_primary_brand || false
      
      const topicsMap: any = {}
      filteredTopics.forEach(topic => {
        const association = brandData.find((d: any) => d.topic_name === topic)
        topicsMap[topic] = association?.mention_count || 0
      })
      
      return {
        brand,
        isYourBrand: isPrimary,
        topics: topicsMap
      }
    })
    
    return { allTopics: filteredTopics, brandTopicData: matrix }
  }
  
  /**
   * Get time-series metrics for trend charts from daily_brand_metrics
   */
  async getBrandMetricsTimeseries(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    granularity: 'daily' | 'hourly' = 'daily',
    model?: string
  ): Promise<BrandMetricsTimeseries[]> {
    const startDate = periodStartDate(period)

    const { data, error } = await this.supabase
      .from('daily_brand_metrics')
      .select('run_date, lvi_score, visibility_rate, avg_sentiment, avg_brand_rank, citation_rate, share_of_voice')
      .eq('account_id', accountId)
      .eq('brand_id', brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: true })

    if (error || !data) {
      if (error) console.error('Error fetching timeseries:', error)
      return []
    }

    return data.map((row: any, idx: number) => {
      const prev = idx > 0 ? data[idx - 1] : null
      return {
        snapshot_date: row.run_date,
        lvi_score: row.lvi_score || 0,
        mention_rate: row.visibility_rate || 0,
        avg_sentiment: row.avg_sentiment || 0,
        avg_ranking: row.avg_brand_rank,
        citation_rate: row.citation_rate || 0,
        share_of_voice: row.share_of_voice || 0,
        lvi_delta: prev ? (row.lvi_score || 0) - (prev.lvi_score || 0) : 0,
        mention_rate_delta: prev ? (row.visibility_rate || 0) - (prev.visibility_rate || 0) : 0,
        sentiment_delta: prev ? (row.avg_sentiment || 0) - (prev.avg_sentiment || 0) : 0,
      }
    })
  }
  
  /**
   * Get prompt-by-prompt performance analysis from daily_prompt_metrics
   */
  async getPromptPerformance(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    options: {
      onlyOpportunities?: boolean
      onlyThreats?: boolean
      onlyStrengths?: boolean
      limit?: number
    } = {},
    model?: string
  ): Promise<PromptPerformance[]> {
    const startDate = periodStartDate(period)

    const { data, error } = await this.supabase
      .from('daily_prompt_metrics')
      .select('*')
      .eq('account_id', accountId)
      .eq('brand_id', brandId)
      .gte('run_date', startDate)
      .order('run_date', { ascending: false })

    if (error || !data) {
      if (error) console.error('Error fetching prompt performance:', error)
      return []
    }

    // Aggregate latest per prompt
    const latestByPrompt = new Map<string, any>()
    for (const row of data) {
      if (!latestByPrompt.has(row.prompt_id)) {
        latestByPrompt.set(row.prompt_id, row)
      }
    }

    // Get prompt texts
    const promptIds = [...latestByPrompt.keys()]
    const { data: prompts } = await this.supabase
      .from('user_prompts')
      .select('id, prompt_text, prompt_category, prompt_intent')
      .in('id', promptIds)

    const promptMap = new Map((prompts || []).map((p: any) => [p.id, p]))

    let results = [...latestByPrompt.values()].map((m: any) => {
      const prompt: any = promptMap.get(m.prompt_id)
      const visRate = m.visibility_rate || 0
      const isStrength = visRate >= 70
      const isThreat = visRate > 0 && visRate < 30
      const isOpportunity = visRate === 0

      return {
        prompt_id: m.prompt_id,
        prompt_text: prompt?.prompt_text || '',
        prompt_category: prompt?.prompt_category || null,
        prompt_intent: prompt?.prompt_intent || null,
        total_responses: m.total_responses || 0,
        total_models_tested: 0,
        models_list: m.best_performing_model ? [m.best_performing_model] : [],
        primary_brand_mentioned: visRate > 0,
        primary_brand_mention_rate: visRate,
        primary_brand_avg_position: m.avg_brand_rank || null,
        primary_brand_sentiment: m.avg_sentiment || 0,
        primary_brand_citations: 0,
        primary_brand_lvi: m.lvi_score || 0,
        top_competitor_name: null,
        top_competitor_mentions: 0,
        visibility_gap: 0,
        is_opportunity: isOpportunity,
        is_strength: isStrength,
        is_threat: isThreat,
        opportunity_score: isOpportunity ? 100 : isThreat ? 50 : 0,
        strategic_priority: isOpportunity ? 'high' : isThreat ? 'medium' : 'low',
        action_required: isOpportunity ? 'Create content' : isThreat ? 'Improve content' : null,
        model_performance: null,
        model_consistency: m.model_consistency || 0,
        best_performing_model: m.best_performing_model,
      } as PromptPerformance
    })

    if (options.onlyOpportunities) results = results.filter(r => r.is_opportunity)
    if (options.onlyThreats) results = results.filter(r => r.is_threat)
    if (options.onlyStrengths) results = results.filter(r => r.is_strength)

    results.sort((a, b) => b.opportunity_score - a.opportunity_score)
    if (options.limit) results = results.slice(0, options.limit)

    return results
  }
  
  /**
   * Get detailed responses for a specific prompt
   */
  async getPromptResponses(
    promptId: string,
    brandId: string
  ) {
    // brand_appearances table dropped — return empty
    return []
  }
  
  /**
   * Get citation/source analysis from aeo_citations table
   */
  async getCitationDomains(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    options: {
      domainType?: string
      onlyTargetPublishers?: boolean
      limit?: number
    } = {},
    model?: string
  ): Promise<CitationDomain[]> {
    const startDate = periodStartDate(period)

    // Load the brand's own domains + name/slug for robust owned-domain detection
    const { data: brandRow } = await this.supabase
      .from('brands')
      .select('name, slug, primary_domain, domain, brand_website, company_website, known_competitors, products_services, industry, industry_category')
      .eq('id', brandId)
      .single()

    // Load competitors from DB for proper competitor classification
    const { data: dbCompetitors } = await this.supabase
      .from('competitors')
      .select('competitor_name, competitor_domain')
      .eq('brand_id', brandId)

    const normalizeDomain = (d: string | null | undefined): string | null => {
      if (!d) return null
      return d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
    }
    const ownedDomains = new Set(
      [brandRow?.primary_domain, brandRow?.domain, brandRow?.brand_website, brandRow?.company_website]
        .map(normalizeDomain)
        .filter((d): d is string => !!d)
    )

    // Build competitor domain lookup: normalized domain → competitor name
    const competitorDomainMap = new Map<string, string>()
    for (const comp of dbCompetitors || []) {
      const d = normalizeDomain(comp.competitor_domain)
      if (d) competitorDomainMap.set(d, comp.competitor_name || d)
    }

    // Brand name/slug for fuzzy owned-domain matching
    const brandNameClean = (brandRow?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const brandSlug = (brandRow?.slug || '').toLowerCase()

    // Common prefixes brands use (withsoma.ai → soma, getsoma.com → soma)
    const BRAND_PREFIXES = ['with', 'get', 'try', 'go', 'use', 'my', 'the', 'hey', 'join']
    const stripBrandPrefixes = (s: string) => {
      for (const prefix of BRAND_PREFIXES) {
        if (s.startsWith(prefix) && s.length > prefix.length) return s.slice(prefix.length)
      }
      return s
    }

    /** Check if a cited domain belongs to the brand */
    const isOwnedDomain = (domain: string): boolean => {
      const d = domain.toLowerCase().replace(/^www\./, '')
      // 1. Direct match against stored domains
      if (ownedDomains.has(d)) return true
      // 2. Subdomain relationship (blog.soma.ai → soma.ai)
      for (const owned of ownedDomains) {
        if (d.endsWith('.' + owned) || owned.endsWith('.' + d)) return true
        // 3. Core domain match after stripping common prefixes
        //    e.g. "withsoma.ai" → "soma" === "soma" ← "soma.ai"
        const dBase = d.split('.')[0]
        const ownedBase = owned.split('.')[0]
        if (stripBrandPrefixes(dBase) === stripBrandPrefixes(ownedBase)) return true
      }
      // 4. Brand name/slug appears as the core of the domain
      //    e.g. brand "Soma AI" / slug "soma" → matches "soma.ai", "soma.com"
      const domainBase = d.split('.')[0]
      const strippedBase = stripBrandPrefixes(domainBase)
      if (brandNameClean.length >= 3 && (strippedBase === brandNameClean || domainBase === brandNameClean)) return true
      if (brandSlug.length >= 3 && (strippedBase === brandSlug || domainBase === brandSlug)) return true
      return false
    }

    // ── Load co-mentioned brands for competitor inference ──
    // Brands co-mentioned with the primary brand in AI responses are likely competitors
    // IF they do similar work (filtered by excluding known non-competitor domain types in matchCompetitor).
    const inferredCompetitorNames = new Map<string, string>() // normalized name → original name
    const normalizeName = (n: string): string => n.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Add known_competitors from brand onboarding
    const knownCompetitors = (brandRow?.known_competitors || []) as string[]
    for (const name of knownCompetitors) {
      if (name && name.trim().length > 1) {
        inferredCompetitorNames.set(normalizeName(name), name.trim())
      }
    }

    // Add DB competitor names (for name-based matching when domain doesn't match)
    for (const comp of dbCompetitors || []) {
      if (comp.competitor_name) {
        inferredCompetitorNames.set(normalizeName(comp.competitor_name), comp.competitor_name)
      }
    }

    // Load co-mentioned brands from response_data
    {
      const responseIds = await this.getBrandResponseIds(brandId, startDate)
      if (responseIds.length > 0) {
        const batchSize = 200
        for (let i = 0; i < responseIds.length; i += batchSize) {
          const batch = responseIds.slice(i, i + batchSize)
          const { data: rdRows } = await this.supabase
            .from('response_data')
            .select('co_mentioned_brands')
            .in('response_id', batch)
          for (const r of rdRows || []) {
            for (const name of r.co_mentioned_brands || []) {
              const n = name.trim()
              if (n.length > 1) {
                const normalized = normalizeName(n)
                // Exclude the primary brand itself
                if (normalized !== brandNameClean && normalized !== brandSlug) {
                  inferredCompetitorNames.set(normalized, n)
                }
              }
            }
          }
        }
      }
    }

    /** Check if a cited domain belongs to a known competitor */
    const matchCompetitor = (domain: string): { match: boolean; name: string | null; inferred: boolean } => {
      const d = domain.toLowerCase().replace(/^www\./, '')
      // Check stored competitors (have explicit domains)
      for (const [compDomain, compName] of competitorDomainMap) {
        if (d === compDomain || d.endsWith('.' + compDomain) || compDomain.endsWith('.' + d)) {
          return { match: true, name: compName, inferred: false }
        }
        // Strip prefixes for competitors too
        const dBase = d.split('.')[0]
        const compBase = compDomain.split('.')[0]
        if (stripBrandPrefixes(dBase) === stripBrandPrefixes(compBase)) {
          return { match: true, name: compName, inferred: false }
        }
      }

      // ── Inferred competitor matching ──
      // Check if domain matches a co-mentioned brand or known competitor name.
      // Only infer competitor status if the domain is NOT a well-known non-competitor type
      // (news, editorial, reference, academic, government, social, ugc, institutional, corporate/big-tech).
      // This ensures only brands doing similar work get classified as competitors.
      const regexCategory = this.classifyDomainByRegex(d)
      if (!regexCategory) {
        // No regex matched → domain is likely a company website, not a media/platform site
        const domainBase = d.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
        const strippedDomainBase = stripBrandPrefixes(d.split('.')[0]).toLowerCase().replace(/[^a-z0-9]/g, '')

        for (const [normName, originalName] of inferredCompetitorNames) {
          if (normName.length < 3) continue
          if (domainBase === normName || strippedDomainBase === normName) {
            return { match: true, name: originalName, inferred: true }
          }
          // Check if competitor name is contained in domain (e.g. "seranking" contains "seranking")
          if (normName.length >= 5 && domainBase.includes(normName)) {
            return { match: true, name: originalName, inferred: true }
          }
        }
      }

      return { match: false, name: null, inferred: false }
    }

    const citations = await this.fetchBrandCitations(brandId, startDate,
      'domain, url, source_type, content_category, benefits_brand_id, is_competitor_source, domain_authority, is_high_authority, times_referenced, created_at, response_id')

    if (citations.length === 0) return []

    // Aggregate by domain
    const domainMap = new Map<string, {
      domain: string
      totalCitations: number
      timesReferenced: number
      sourceType: string
      contentCategories: Set<string>
      benefitsBrand: boolean
      isCompetitor: boolean
      domainAuthority: number | null
      isHighAuthority: boolean
      urls: Set<string>
      uniqueResponses: number
      responseIds: Set<string>
    }>()

    for (const c of citations) {
      const existing = domainMap.get(c.domain)
      if (existing) {
        existing.totalCitations++
        existing.timesReferenced += c.times_referenced || 1
        if (c.content_category) existing.contentCategories.add(c.content_category)
        if (c.url) existing.urls.add(c.url)
        if (c.benefits_brand_id === brandId) existing.benefitsBrand = true
        if (c.is_competitor_source) existing.isCompetitor = true
        if (c.domain_authority && (!existing.domainAuthority || c.domain_authority > existing.domainAuthority)) {
          existing.domainAuthority = c.domain_authority
        }
        if (c.is_high_authority) existing.isHighAuthority = true
        if (c.response_id) existing.responseIds.add(c.response_id)
      } else {
        domainMap.set(c.domain, {
          domain: c.domain,
          totalCitations: 1,
          timesReferenced: c.times_referenced || 1,
          sourceType: c.source_type || 'earned',
          contentCategories: new Set(c.content_category ? [c.content_category] : []),
          benefitsBrand: c.benefits_brand_id === brandId,
          isCompetitor: c.is_competitor_source || false,
          domainAuthority: c.domain_authority,
          isHighAuthority: c.is_high_authority || false,
          urls: new Set(c.url ? [c.url] : []),
          uniqueResponses: 1,
          responseIds: new Set(c.response_id ? [c.response_id] : []),
        })
      }
    }

    let results = [...domainMap.values()]
      .sort((a, b) => b.totalCitations - a.totalCitations)

    if (options.domainType) {
      results = results.filter(r => r.sourceType === options.domainType)
    }
    if (options.onlyTargetPublishers) {
      results = results.filter(r => isOwnedDomain(r.domain))
    }

    const limit = options.limit || 20
    const sliced = results.slice(0, limit)

    // Resolve citing models: collect all response IDs from sliced domains
    const allResponseIds = new Set<string>()
    for (const s of sliced) {
      for (const rid of s.responseIds) allResponseIds.add(rid)
    }
    const responseModelMap = new Map<string, string>()
    if (allResponseIds.size > 0) {
      const ridArr = [...allResponseIds]
      const batchSize = 200
      for (let i = 0; i < ridArr.length; i += batchSize) {
        const batch = ridArr.slice(i, i + batchSize)
        const { data: fileRows } = await this.supabase
          .from('llm_response_files')
          .select('id, model_name')
          .in('id', batch)
        for (const f of fileRows || []) {
          if (f.model_name) responseModelMap.set(f.id, f.model_name)
        }
      }
    }

    // Compute total citations across all domains for citation share
    const totalAllCitations = results.reduce((sum, r) => sum + r.totalCitations, 0)

    return sliced.map(s => {
      const classifiedCategory = this.classifyDomainCategory(s.domain, [...s.contentCategories][0] || null)
      const isOwned = isOwnedDomain(s.domain)
      const compMatch = matchCompetitor(s.domain)
      // Competitor if: DB match, known competitor name match, or inferred from co-mentions
      const isComp = isOwned ? false : compMatch.match

      // Collect unique model names for this domain
      const domainModels = new Set<string>()
      for (const rid of s.responseIds) {
        const m = responseModelMap.get(rid)
        if (m) domainModels.add(m)
      }

      return {
        domain: s.domain,
        domain_type: isOwned ? 'owned' : isComp ? 'competitor' : 'earned',
        source_category: isOwned ? 'own' : isComp ? 'competitor' : classifiedCategory,
        total_citations: s.totalCitations,
        unique_responses_citing: s.urls.size,
        used_percentage: citations.length > 0 ? (s.totalCitations / citations.length) * 100 : 0,
        avg_citations_per_response: s.urls.size > 0 ? s.totalCitations / s.urls.size : 0,
        trust_score: s.domainAuthority,
        is_authoritative: s.isHighAuthority,
        is_target_publisher: isOwned,
        is_competitor: isComp,
        is_inferred_competitor: compMatch.inferred,
        competitor_name: compMatch.name || (isComp ? s.domain.split('.')[0].charAt(0).toUpperCase() + s.domain.split('.')[0].slice(1) : null),
        partnership_opportunity_score: s.isHighAuthority && !s.benefitsBrand ? 80 : 0,
        associated_topics: [],
        associated_brands: [],
        brands_mentioned_in_sources: [],
        citing_models: [...domainModels],
        citation_share: totalAllCitations > 0 ? (s.totalCitations / totalAllCitations) * 100 : 0,
      } as CitationDomain
    })
  }

  /**
   * Get top cited URLs from aeo_citations
   */
  async getTopCitedUrls(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    limit = 20
  ): Promise<{ url: string; title: string; domain: string; citations: number; domain_type: string | null; snippet?: string; prompt_text?: string; model_name?: string; models?: string[]; brand_mentioned: boolean; prompts?: Array<{ prompt_id: string; prompt_text: string; model_name: string }> }[]> {
    const startDate = periodStartDate(period)

    const data = await this.fetchBrandCitations(brandId, startDate,
      'url, page_title, domain, source_type, benefits_brand_id, times_referenced, anchor_text, response_id', 500)

    if (data.length === 0) return []

    // Aggregate by URL
    const urlMap = new Map<string, { url: string; title: string; domain: string; type: string | null; citations: number; benefitsBrand: boolean; snippets: string[]; responseIds: Set<string> }>()
    for (const c of data) {
      if (!c.url) continue
      const existing = urlMap.get(c.url)
      if (existing) {
        existing.citations += c.times_referenced || 1
        if (c.anchor_text && c.anchor_text.length > 3) existing.snippets.push(c.anchor_text)
        if (c.response_id) existing.responseIds.add(c.response_id)
      } else {
        urlMap.set(c.url, {
          url: c.url,
          title: c.page_title || c.domain,
          domain: c.domain,
          type: c.source_type,
          citations: c.times_referenced || 1,
          benefitsBrand: c.benefits_brand_id === brandId,
          snippets: c.anchor_text && c.anchor_text.length > 3 ? [c.anchor_text] : [],
          responseIds: new Set(c.response_id ? [c.response_id] : []),
        })
      }
    }

    const sliced = [...urlMap.values()]
      .sort((a, b) => b.citations - a.citations)
      .slice(0, limit)

    // Resolve models and prompts from response files
    const allRids = new Set<string>()
    for (const u of sliced) {
      for (const rid of u.responseIds) allRids.add(rid)
    }
    const responseFileMap = new Map<string, { model_name: string; prompt_text: string; prompt_id: string }>()
    if (allRids.size > 0) {
      const ridArr = [...allRids]
      const batchSize = 200
      for (let i = 0; i < ridArr.length; i += batchSize) {
        const batch = ridArr.slice(i, i + batchSize)
        const { data: fileRows } = await this.supabase
          .from('llm_response_files')
          .select('id, model_name, prompt_text, prompt_id')
          .in('id', batch)
        for (const f of fileRows || []) {
          responseFileMap.set(f.id, { model_name: f.model_name, prompt_text: f.prompt_text, prompt_id: f.prompt_id })
        }
      }
    }

    return sliced.map(u => {
      // Pick the longest snippet as representative
      const bestSnippet = u.snippets.length > 0
        ? u.snippets.sort((a, b) => b.length - a.length)[0]
        : undefined

      // Collect unique models and prompts for this URL
      const models = new Set<string>()
      const prompts: Array<{ prompt_id: string; prompt_text: string; model_name: string }> = []
      const seenPromptIds = new Set<string>()
      for (const rid of u.responseIds) {
        const rf = responseFileMap.get(rid)
        if (!rf) continue
        if (rf.model_name) models.add(rf.model_name)
        if (rf.prompt_id && !seenPromptIds.has(rf.prompt_id)) {
          seenPromptIds.add(rf.prompt_id)
          prompts.push({ prompt_id: rf.prompt_id, prompt_text: rf.prompt_text, model_name: rf.model_name })
        }
      }

      return {
        url: u.url,
        title: u.title,
        domain: u.domain,
        citations: u.citations,
        domain_type: u.type,
        brand_mentioned: u.benefitsBrand,
        snippet: bestSnippet,
        models: [...models],
        model_name: [...models][0],
        prompts,
        prompt_text: prompts[0]?.prompt_text,
      }
    })
  }

  /**
   * Helper to extract domain from URL
   */
  private extractDomainFromUrl(url: string | undefined): string | null {
    if (!url) return null
    try {
      const parsed = new URL(url)
      return parsed.hostname.replace('www.', '')
    } catch {
      return null
    }
  }
  
  /**
   * Get content type distribution from aeo_citations
   */
  async getContentTypeDistribution(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    model?: string
  ): Promise<Record<string, number>> {
    const startDate = periodStartDate(period)

    const data = await this.fetchBrandCitations(brandId, startDate,
      'source_type, content_category, domain')

    if (data.length === 0) return {}

    const distribution: Record<string, number> = {}
    for (const c of data) {
      const category = this.classifyDomainCategory(c.domain, c.content_category || c.source_type)
      distribution[category] = (distribution[category] || 0) + 1
    }

    return distribution
  }

  /**
   * Get competitive gap — domains competitors are cited on but brand is not
   */
  async getCompetitiveGap(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    limit: number = 3,
    model?: string
  ): Promise<any[]> {
    const startDate = periodStartDate(period)

    const data = await this.fetchBrandCitations(brandId, startDate,
      'domain, benefits_brand_id, is_competitor_source, domain_authority')

    if (data.length === 0) return []

    // Domains where competitors are cited
    const competitorDomains = new Set<string>()
    const brandDomains = new Set<string>()

    for (const c of data) {
      if (c.benefits_brand_id === brandId) {
        brandDomains.add(c.domain)
      }
      if (c.is_competitor_source || (c.benefits_brand_id && c.benefits_brand_id !== brandId)) {
        competitorDomains.add(c.domain)
      }
    }

    // Gap = competitor domains not in brand domains
    const gap = [...competitorDomains]
      .filter(d => !brandDomains.has(d))
      .map(domain => {
        const citations = data.filter(c => c.domain === domain)
        const maxAuthority = Math.max(...citations.map(c => c.domain_authority || 0))
        return {
          domain,
          competitor_citations: citations.length,
          domain_authority: maxAuthority > 0 ? maxAuthority : null,
          opportunity: 'Get content published on this domain',
        }
      })
      .sort((a, b) => b.competitor_citations - a.competitor_citations)
      .slice(0, limit)

    return gap
  }
  
  /**
   * Refresh metrics for a brand by triggering the AEO pipeline
   */
  async refreshMetrics(
    accountId: string,
    brandId: string,
    runId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { AEOExtractorService } = await import('@/lib/services/aeo-extractor')
      const { AEOAggregatorService } = await import('@/lib/services/aeo-aggregator')

      const extractor = new AEOExtractorService(this.supabase)
      await extractor.processPendingResponses(200, brandId)

      const aggregator = new AEOAggregatorService(this.supabase)
      await aggregator.aggregateForDate(undefined, { accountId, brandId })

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error refreshing metrics:', message)
      return { success: false, error: message }
    }
  }
  
  /**
   * Get complete report data in single call
   */
  async getCompleteReportData(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    runId?: string,
    model?: string
  ) {
    const [
      stats,
      rankings,
      topicMatrix,
      timeseries,
      promptPerformance,
      citations
    ] = await Promise.all([
      this.getBrandPerformanceMetrics(accountId, brandId, period, runId, model),
      this.getIndustryRankings(accountId, brandId, period, 10, model),
      this.getTopicBrandMatrix(accountId, period, 8, model),
      this.getBrandMetricsTimeseries(accountId, brandId, period, 'daily', model),
      this.getPromptPerformance(accountId, brandId, period, {}, model),
      this.getCitationDomains(accountId, brandId, period, { limit: 20 }, model)
    ])
    
    return {
      stats,
      rankings,
      topicMatrix,
      timeseries,
      promptPerformance,
      citations,
      metadata: {
        period,
        generatedAt: new Date().toISOString(),
        accountId,
        brandId,
        runId,
        model
      }
    }
  }
  
  /**
   * Get insights and recommendations
   */
  async getInsightsAndRecommendations(
    accountId: string,
    brandId: string,
    period: MetricPeriod = 'all',
    model?: string
  ) {
    const [
      stats,
      rankings,
      opportunities,
      threats,
      strengths,
      targetPublishers
    ] = await Promise.all([
      this.getBrandPerformanceMetrics(accountId, brandId, period, undefined, model),
      this.getIndustryRankings(accountId, brandId, period, 10, model),
      this.getPromptPerformance(accountId, brandId, period, { onlyOpportunities: true, limit: 5 }, model),
      this.getPromptPerformance(accountId, brandId, period, { onlyThreats: true, limit: 5 }, model),
      this.getPromptPerformance(accountId, brandId, period, { onlyStrengths: true, limit: 5 }, model),
      this.getCitationDomains(accountId, brandId, period, { onlyTargetPublishers: true, limit: 5 }, model)
    ])
    
    const yourBrand = rankings.find(r => r.is_primary_brand)
    const topCompetitor = rankings.find(r => !r.is_primary_brand)
    
    const insights = []
    const recommendations = []
    
    // Performance insight
    if (yourBrand) {
      insights.push({
        category: 'performance',
        title: yourBrand.rank_change < 0 ? 'Strong Upward Momentum' : 
               yourBrand.rank_change > 0 ? '   ition Decline Detected' : 
               'Stable Market Position',
        description: `You rank #${yourBrand.industry_rank} with ${yourBrand.mention_rate.toFixed(1)}% visibility and ${Math.round(yourBrand.avg_sentiment_score * 100)} sentiment.`,
        impact: yourBrand.rank_change !== 0 ? 'high' : 'medium',
        metricValue: `#${yourBrand.industry_rank}`,
        metric: 'Industry Rank'
      })
    }
    
    // Opportunity insights
    if (opportunities.length > 0) {
      const totalOpportunityValue = opportunities.reduce((sum, o) => sum + o.opportunity_score, 0)
      insights.push({
        category: 'opportunity',
        title: '💰 Missed Revenue Opportunities',
        description: `${opportunities.length} high-intent queries don't mention your brand. Estimated value: $${(totalOpportunityValue * 50).toFixed(0)}K`,
        impact: 'high',
        metricValue: opportunities.length,
        metric: 'opportunities'
      })
      
      recommendations.push({
        title: `Capture $${(totalOpportunityValue * 50).toFixed(0)}K in Lost Revenue`,
        description: `Create content addressing ${opportunities.length} missed prompts to capture potential customers.`,
        impact: 'high',
        effort: 'medium',
        actions: [
          `Create ${opportunities.length} targeted content pieces`,
          'Publish on high-authority platforms',
          'Focus on buyer-intent keywords',
          'Target 60-80% coverage in 60 days'
        ]
      })
    }
    
    // Publisher opportunities
    if (targetPublishers.length > 0) {
      recommendations.push({
        title: `🚀 Fast-Track: Publish on ${targetPublishers[0].domain}`,
        description: `AI models cite ${targetPublishers[0].domain} ${targetPublishers[0].used_percentage.toFixed(0)}% of the time.`,
        impact: 'high',
        effort: 'low',
        actions: [
          `Publish 3-5 articles on ${targetPublishers.slice(0, 2).map(p => p.domain).join(', ')}`,
          'Focus on underperforming prompts',
          'Include data and expert quotes',
          'Track improvements weekly'
        ]
      })
    }
    
    // Competitive threats
    if (threats.length > 0) {
      recommendations.push({
        title: '⚔️ Address Competitive Threats',
        description: `${threats.length} prompts where competitors outperform you significantly.`,
        impact: 'high',
        effort: 'medium',
        actions: [
          'Analyze competitor content patterns',
          'Create superior alternatives',
          'Publish on authoritative platforms',
          'Monitor weekly for changes'
        ]
      })
    }
    
    return { insights, recommendations }
  }
}

export default ExternalReportAnalyticsService
