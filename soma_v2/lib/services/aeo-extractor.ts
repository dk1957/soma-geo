/**
 * AEO Extractor Agent Service
 * ============================
 * Layer 2 of the AEO pipeline: extracts structured facts from raw LLM responses.
 *
 * Responsibilities:
 * - Picks up llm_response_files WHERE extraction_status = 'pending'
 * - Downloads response text from Supabase Storage
 * - Resolves brand mentions against brands + competitors
 * - Writes one response_data row per brand found
 * - Writes aeo_citations rows for each cited source
 * - Sets extraction_status = 'complete' or 'failed'
 *
 * Design principles:
 * - Idempotent: re-running on the same response overwrites via UPSERT
 * - Atomic: each response is fully extracted or marked failed
 * - No computed scores: only objective facts
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { orchestrateAnalysis, type OrchestrationResult, type AgentBrandContext, type OrchestratedBrandFact, type OrchestratedCitation, type OrchestratedTopic, type OrchestratedBrandTopicAssociation } from '@/lib/agents'

// ─── Types ──────────────────────────────────────────────────

interface ResponseFile {
  id: string
  run_id: string
  prompt_id: string | null
  account_id: string
  brand_id: string
  model_name: string
  storage_path: string
  prompt_text: string
  word_count: number
  created_at: string
}

interface BrandRecord {
  id: string
  name: string
  entity_aliases: string[]
  primary_domain: string | null
}

interface CompetitorRecord {
  id: string
  brand_id: string // the brand that considers this a competitor
  name: string
  domain: string | null
  linked_brand_id: string | null // Legacy — no longer used for new analysis
}

interface ExtractedBrandFact {
  brand_id: string
  competitor_id?: string | null // Set for competitor analysis rows
  mentioned: boolean
  brand_rank: number | null
  brand_mention_count: number
  co_mentioned_brands: string[]
  competitive_density: number
  raw_sentiment: number | null
  sentiment_signals: string[]
  citation_count: number
  total_response_citations: number
  is_primary_recommendation: boolean
}

interface ExtractedCitation {
  domain: string
  url: string | null
  page_title: string | null
  anchor_text: string | null
  citation_rank: number
  times_referenced: number
  source_type: string
  content_category: string | null
  benefits_brand_id: string | null
  is_competitor_source: boolean
  domain_authority: number | null
}

interface ExtractionResult {
  brandFacts: ExtractedBrandFact[]
  citations: ExtractedCitation[]
  topics: ExtractedTopic[]
}

interface ExtractedTopic {
  name: string
  category: string | null
  relevance: number    // 0.0 to 1.0
  sentiment: number    // -1.0 to 1.0
}

// ─── Extraction Model ─────────────────────────────────────

const EXTRACTION_VERSION = 2
const EXTRACTION_MODEL_RULE_BASED = 'rule-based-v1'
const MAX_RETRIES = 2
const DEFAULT_USE_AI_AGENTS = process.env.ANALYSIS_ENABLE_AI_AGENTS === 'true'

// ─── Service ──────────────────────────────────────────────

export class AEOExtractorService {
  private supabase: SupabaseClient
  private useAIAgents: boolean

  constructor(supabase?: SupabaseClient, useAIAgents: boolean = DEFAULT_USE_AI_AGENTS) {
    this.supabase = supabase || createServiceClient()
    this.useAIAgents = useAIAgents
  }

  /**
   * Main entry point: process all pending responses.
   * Optionally scoped to a specific brand to prevent cross-brand processing.
   * Returns count of successfully processed responses.
   */
  async processPendingResponses(limit: number = 100, brandId?: string): Promise<{
    processed: number
    failed: number
    skipped: number
  }> {
    const stats = { processed: 0, failed: 0, skipped: 0 }

    // Fetch pending responses
    let query = this.supabase
      .from('llm_response_files')
      .select('id, run_id, prompt_id, account_id, brand_id, model_name, storage_path, prompt_text, word_count, created_at')
      .in('extraction_status', ['pending', 'failed'])
      .eq('success', true)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data: pending, error } = await query

    if (error) {
      console.error('[Extractor] Error fetching pending responses:', error)
      return stats
    }

    if (!pending || pending.length === 0) {
      console.log('[Extractor] No pending responses to process')
      return stats
    }

    console.log(`[Extractor] Processing ${pending.length} pending responses`)

    // Process in a stable order so the same input set yields the same extraction order.
    for (const response of pending) {
      await this.processResponse(response, stats)
    }

    console.log(`[Extractor] Done: ${stats.processed} processed, ${stats.failed} failed, ${stats.skipped} skipped`)
    return stats
  }

  /**
   * Process a single response: download → extract → store.
   */
  private async processResponse(
    response: ResponseFile,
    stats: { processed: number; failed: number; skipped: number }
  ): Promise<void> {
    try {
      // Mark as processing
      await this.supabase
        .from('llm_response_files')
        .update({ extraction_status: 'processing', extraction_error: null })
        .eq('id', response.id)

      // Download response text from Storage
      const responseText = await this.downloadResponseText(response.storage_path)
      if (!responseText) {
        await this.markFailed(response.id, 'Could not download response text from storage')
        stats.failed++
        return
      }

      // Load brand and competitor data for resolution
      const { primaryBrand, competitors, allBrands } = await this.loadBrandContext(
        response.account_id,
        response.brand_id
      )

      if (!primaryBrand) {
        await this.markFailed(response.id, `Primary brand ${response.brand_id} not found`)
        stats.failed++
        return
      }

      // Try AI agent extraction first, fall back to rule-based
      let extractionModel = EXTRACTION_MODEL_RULE_BASED

      if (this.useAIAgents) {
        try {
          const agentResult = await this.extractWithAgents(responseText, primaryBrand, competitors, response)
          if (agentResult) {
            extractionModel = agentResult.metadata.extraction_model
            await this.storeResponseDataWithModel(response, agentResult.brandFacts, extractionModel)
            await this.storeCitations(response, agentResult.citations)
            await this.storeTopics(response, agentResult.topics)
            // Store brand topic associations — if AI agent provided them, use those;
            // otherwise derive from rule-based approach using topics + mentioned brands
            if (agentResult.brandTopicAssociations.length > 0) {
              await this.storeBrandTopicAssociations(response, agentResult.brandTopicAssociations)
            } else if (agentResult.topics.length > 0) {
              const derivedAssociations = this.deriveBrandTopicAssociations(agentResult.brandFacts, agentResult.topics, primaryBrand, competitors)
              await this.storeBrandTopicAssociations(response, derivedAssociations)
            }
            // Skip rule-based extraction
            await this.supabase
              .from('llm_response_files')
              .update({ extraction_status: 'complete', extraction_error: null })
              .eq('id', response.id)
            stats.processed++
            return
          }
          console.warn(`[Extractor] AI agents returned no result for ${response.id}, falling back to rule-based`)
        } catch (agentErr) {
          const agentMsg = agentErr instanceof Error ? agentErr.message : 'Unknown agent error'
          console.warn(`[Extractor] AI agent extraction failed for ${response.id}, falling back to rule-based:`, agentMsg)
        }
      }

      // Rule-based fallback extraction
      const result = this.extractFacts(responseText, primaryBrand, competitors, allBrands)

      // Store response_data rows
      await this.storeResponseDataWithModel(response, result.brandFacts, extractionModel)

      // Store aeo_citations rows (resolves domains first)
      await this.storeCitations(response, result.citations)

      // Store topics
      await this.storeTopics(response, result.topics)

      // Derive brand topic associations from rule-based topics + mentioned brands
      const derivedAssociations = this.deriveBrandTopicAssociations(result.brandFacts, result.topics, primaryBrand, competitors)
      await this.storeBrandTopicAssociations(response, derivedAssociations)

      // Mark complete
      await this.supabase
        .from('llm_response_files')
        .update({ extraction_status: 'complete', extraction_error: null })
        .eq('id', response.id)

      stats.processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown extraction error'
      console.error(`[Extractor] Error processing response ${response.id}:`, message)
      await this.markFailed(response.id, message)
      stats.failed++
    }
  }

  // ─── AI Agent Extraction ──────────────────────────────────

  /**
   * Extract facts using AI analysis agents via the orchestrator.
   * Returns null if agent extraction fails (caller should fall back to rule-based).
   */
  private async extractWithAgents(
    responseText: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[],
    response: ResponseFile,
  ): Promise<OrchestrationResult | null> {
    // Build agent-compatible brand context
    const brandContext: AgentBrandContext = {
      primaryBrand: {
        id: primaryBrand.id,
        name: primaryBrand.name,
        aliases: primaryBrand.entity_aliases || [],
        domain: primaryBrand.primary_domain,
      },
      competitors: competitors
        .map(c => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          linked_brand_id: c.linked_brand_id, // Legacy field, not used for new logic
        })),
    }

    console.log(`[Extractor] Running AI agents for response ${response.id}`)
    const result = await orchestrateAnalysis(responseText, brandContext, response.id)

    // Validate we got meaningful data
    if (result.brandFacts.length === 0 && result.metadata.agents_failed.length > 0) {
      console.warn(`[Extractor] All agents failed for ${response.id}`)
      return null
    }

    return result
  }

  // ─── Brand Resolution & Extraction ────────────────────────

  /**
   * Core extraction: find brands, citations, and facts in the response text.
   */
  private extractFacts(
    text: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[],
    allBrands: BrandRecord[]
  ): ExtractionResult {
    const textLower = text.toLowerCase()

    // 1. Resolve all brand mentions
    const brandMentions = this.resolveBrandMentions(text, textLower, primaryBrand, competitors, allBrands)

    // 2. Rank brands by first appearance
    const rankedBrands = this.rankBrands(brandMentions, text)

    // 3. Extract citations
    const citations = this.extractCitations(text, primaryBrand, competitors, allBrands)

    // 4. Build brand facts
    const allMentionedBrandNames = rankedBrands
      .filter(b => b.mentioned)
      .map(b => b.name)

    const competitiveDensity = allMentionedBrandNames.length

    const brandFacts: ExtractedBrandFact[] = rankedBrands.map(brand => {
      const coMentioned = allMentionedBrandNames.filter(n => n !== brand.name)
      const brandCitationCount = citations.filter(c => c.benefits_brand_id === brand.brandId).length

      return {
        brand_id: brand.brandId,
        competitor_id: brand.competitorId || null,
        mentioned: brand.mentioned,
        brand_rank: brand.mentioned ? brand.rank : null,
        brand_mention_count: brand.mentionCount,
        co_mentioned_brands: coMentioned,
        competitive_density: competitiveDensity,
        raw_sentiment: brand.mentioned ? this.scoreSentiment(text, brand.name) : null,
        sentiment_signals: brand.mentioned ? this.extractSentimentSignals(text, brand.name) : [],
        citation_count: brandCitationCount,
        total_response_citations: citations.length,
        is_primary_recommendation: brand.mentioned ? this.isFirstRecommendation(text, brand.name) : false,
      }
    })

    return { brandFacts, citations, topics: this.extractTopics(text, primaryBrand, competitors, allBrands) }
  }

  /**
   * Resolve which brands are mentioned in the text.
   */
  private resolveBrandMentions(
    text: string,
    textLower: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[],
    allBrands: BrandRecord[]
  ): { brandId: string; competitorId?: string; name: string; mentioned: boolean; mentionCount: number; firstPosition: number }[] {
    const results: { brandId: string; competitorId?: string; name: string; mentioned: boolean; mentionCount: number; firstPosition: number }[] = []

    // Check primary brand
    const primaryResult = this.checkBrandMention(textLower, primaryBrand.name, primaryBrand.entity_aliases || [])
    results.push({
      brandId: primaryBrand.id,
      name: primaryBrand.name,
      mentioned: primaryResult.found,
      mentionCount: primaryResult.count,
      firstPosition: primaryResult.firstPosition
    })

    // Check competitors — use competitor.id from competitors table, store as competitor_id
    for (const comp of competitors) {
      const aliases: string[] = []
      if (comp.domain) aliases.push(comp.domain)

      const compResult = this.checkBrandMention(textLower, comp.name, aliases)

      // Use the primary brand's ID as brand_id (FK owner), competitor.id as competitor_id
      // Avoid duplicates by competitor id
      if (!results.find(r => r.competitorId === comp.id)) {
        results.push({
          brandId: primaryBrand.id, // Always the primary brand for FK
          competitorId: comp.id,    // Competitor table ID
          name: comp.name,
          mentioned: compResult.found,
          mentionCount: compResult.count,
          firstPosition: compResult.firstPosition
        })
      }
    }

    return results
  }

  /**
   * Check if a brand is mentioned in text, including aliases.
   */
  private checkBrandMention(
    textLower: string,
    brandName: string,
    aliases: string[]
  ): { found: boolean; count: number; firstPosition: number } {
    const searchTerms = [brandName, ...aliases].filter(Boolean)
    let totalCount = 0
    let firstPosition = Infinity

    for (const term of searchTerms) {
      const termLower = term.toLowerCase()
      if (termLower.length < 2) continue // skip very short aliases

      // Use word boundary matching for short names
      const regex = termLower.length < 5
        ? new RegExp(`\\b${this.escapeRegex(termLower)}\\b`, 'gi')
        : new RegExp(this.escapeRegex(termLower), 'gi')

      let match
      while ((match = regex.exec(textLower)) !== null) {
        totalCount++
        if (match.index < firstPosition) {
          firstPosition = match.index
        }
      }
    }

    return {
      found: totalCount > 0,
      count: totalCount,
      firstPosition: totalCount > 0 ? firstPosition : Infinity
    }
  }

  /**
   * Rank brands by their order of first appearance.
   */
  private rankBrands(
    mentions: { brandId: string; competitorId?: string; name: string; mentioned: boolean; mentionCount: number; firstPosition: number }[],
    _text: string
  ): (typeof mentions[0] & { rank: number })[] {
    const mentioned = mentions
      .filter(m => m.mentioned)
      .sort((a, b) => a.firstPosition - b.firstPosition)

    return mentions.map(m => ({
      ...m,
      rank: m.mentioned ? mentioned.findIndex(x => x.brandId === m.brandId && x.competitorId === m.competitorId) + 1 : 0
    }))
  }

  // ─── Citation Extraction ──────────────────────────────────

  /**
   * Extract citations (URLs, domains) from response text.
   */
  private extractCitations(
    text: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[],
    allBrands: BrandRecord[]
  ): ExtractedCitation[] {
    const citations: ExtractedCitation[] = []
    const seenUrls = new Set<string>()

    // Match URLs in text (markdown links, plain URLs, numbered references)
    const urlPatterns = [
      /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,       // [title](url)
      /(?<!\()(https?:\/\/[^\s)\]]+)/g,                // plain urls
      /\d+\.\s*(https?:\/\/[^\s]+)/g,                  // numbered: 1. https://...
    ]

    for (const pattern of urlPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        // Extract URL — it's in different capture groups depending on pattern
        const url = match[2] || match[1] || match[0]
        if (!url || !url.startsWith('http')) continue

        const cleanUrl = url.replace(/[.,;:!?)]+$/, '') // strip trailing punctuation

        if (seenUrls.has(cleanUrl)) {
          // Increment reference count for duplicate
          const existing = citations.find(c => c.url === cleanUrl)
          if (existing) existing.times_referenced++
          continue
        }
        seenUrls.add(cleanUrl)

        const domain = this.extractDomain(cleanUrl)
        if (!domain) continue

        // Determine anchor text
        const anchorText = match[1] && match[2] ? match[1] : null

        // Classify source
        const sourceType = this.classifySourceType(domain, cleanUrl, primaryBrand, competitors)
        const contentCategory = this.classifyContentCategory(cleanUrl, anchorText || '')
        const benefitsBrandId = this.determineBenefitsBrand(domain, cleanUrl, primaryBrand, competitors, allBrands)
        const isCompetitorSource = competitors.some(c =>
          c.domain && domain.includes(c.domain.replace(/^(www\.)?/, '').toLowerCase())
        )

        citations.push({
          domain,
          url: cleanUrl,
          page_title: anchorText, // Use anchor text as page title if available
          anchor_text: anchorText,
          citation_rank: citations.length + 1,
          times_referenced: 1,
          source_type: sourceType,
          content_category: contentCategory,
          benefits_brand_id: benefitsBrandId,
          is_competitor_source: isCompetitorSource,
          domain_authority: null, // Populated async later
        })
      }
    }

    return citations
  }

  /**
   * Extract domain from URL.
   */
  private extractDomain(url: string): string | null {
    try {
      const parsed = new URL(url)
      return parsed.hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  }

  /**
   * Classify source type: owned, competitor, news, etc.
   */
  private classifySourceType(
    domain: string,
    _url: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[]
  ): string {
    // Check if owned
    if (primaryBrand.primary_domain) {
      const ownedDomain = primaryBrand.primary_domain.replace(/^(www\.)?/, '').toLowerCase()
      if (domain.includes(ownedDomain)) return 'owned'
    }

    // Check if competitor
    for (const comp of competitors) {
      if (comp.domain) {
        const compDomain = comp.domain.replace(/^(www\.)?/, '').toLowerCase()
        if (domain.includes(compDomain)) return 'competitor'
      }
    }

    // Classify by domain patterns
    const newsPatterns = /reuters|apnews|bbc|cnn|nytimes|washingtonpost|theguardian|bloomberg|techcrunch|theverge|wired|arstechnica|zdnet|venturebeat/i
    const researchPatterns = /arxiv|scholar\.google|nature\.com|sciencedirect|pubmed|jstor|ieee|springer|wiley/i
    const govPatterns = /\.gov\b|\.gov\./i
    const academicPatterns = /\.edu\b|\.ac\./i
    const ugcPatterns = /reddit\.com|quora\.com|stackexchange|stackoverflow|forums?\./i

    if (newsPatterns.test(domain)) return 'news'
    if (researchPatterns.test(domain)) return 'research'
    if (govPatterns.test(domain)) return 'government'
    if (academicPatterns.test(domain)) return 'academic'
    if (ugcPatterns.test(domain)) return 'ugc'

    return 'earned'
  }

  /**
   * Classify content category from URL path and anchor text.
   */
  private classifyContentCategory(url: string, anchorText: string): string | null {
    const combined = (url + ' ' + anchorText).toLowerCase()

    if (/\/blog\/|\/articles?\/|\/post\//i.test(combined)) return 'blog'
    if (/\/review|\/rating|\/comparison/i.test(combined)) return 'review'
    if (/\/news\/|\/press/i.test(combined)) return 'news'
    if (/\/product|\/pricing|\/features/i.test(combined)) return 'product'
    if (/\/research|\/paper|\/study|\/report/i.test(combined)) return 'research'
    if (/reddit|twitter|facebook|linkedin/i.test(combined)) return 'social'
    if (/forum|community|discussion/i.test(combined)) return 'forum'
    if (/directory|listing|yelp|g2|capterra/i.test(combined)) return 'directory'

    return null
  }

  /**
   * Determine which brand a citation primarily benefits.
   */
  private determineBenefitsBrand(
    domain: string,
    _url: string,
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[],
    _allBrands: BrandRecord[]
  ): string | null {
    // Owned domain → benefits primary brand
    if (primaryBrand.primary_domain) {
      const ownedDomain = primaryBrand.primary_domain.replace(/^(www\.)?/, '').toLowerCase()
      if (domain.includes(ownedDomain)) return primaryBrand.id
    }

    // Competitor domain → benefits that competitor
    for (const comp of competitors) {
      if (comp.domain) {
        const compDomain = comp.domain.replace(/^(www\.)?/, '').toLowerCase()
        if (domain.includes(compDomain)) {
          return comp.linked_brand_id || null
        }
      }
    }

    return null // neutral/general source
  }

  // ─── Sentiment Analysis ───────────────────────────────────

  /**
   * Simple AFINN-style sentiment scoring for a brand's context.
   * Returns -1.0 to 1.0.
   */
  private scoreSentiment(text: string, brandName: string): number {
    // Extract sentences containing the brand
    const sentences = text.split(/[.!?\n]+/).filter(s =>
      s.toLowerCase().includes(brandName.toLowerCase())
    )
    if (sentences.length === 0) return 0

    const context = sentences.join(' ').toLowerCase()
    const contextWords = context.split(/\s+/).filter(w => w.length > 0)
    if (contextWords.length === 0) return 0

    let score = 0
    let matchCount = 0

    for (const word of Object.keys(SENTIMENT_LEXICON)) {
      // Use word boundary matching to avoid substring false positives
      // (e.g., "fast" matching "breakfast", "good" matching "goods")
      const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g')
      const matches = context.match(regex)
      if (matches) {
        score += SENTIMENT_LEXICON[word] * matches.length
        matchCount += matches.length
      }
    }

    if (matchCount === 0) return 0

    // Normalize by total context word count for better dynamic range
    // Scale factor: sentiment contribution relative to text length
    const rawScore = score / Math.max(contextWords.length, 1)
    // Scale up to use -1..1 range (typical texts have ~5-10% sentiment words)
    const scaled = rawScore * 10
    return Math.max(-1, Math.min(1, scaled))
  }

  /**
   * Extract top sentiment-driving words for a brand.
   */
  private extractSentimentSignals(text: string, brandName: string): string[] {
    const sentences = text.split(/[.!?\n]+/).filter(s =>
      s.toLowerCase().includes(brandName.toLowerCase())
    )
    const context = sentences.join(' ').toLowerCase()
    const signals: { word: string; score: number }[] = []

    for (const word of Object.keys(SENTIMENT_LEXICON)) {
      const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`)
      if (regex.test(context)) {
        signals.push({ word, score: Math.abs(SENTIMENT_LEXICON[word]) })
      }
    }

    return signals
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.word)
  }

  /**
   * Check if a brand is the first/primary recommendation.
   */
  private isFirstRecommendation(text: string, brandName: string): boolean {
    const lower = text.toLowerCase()
    const brandLower = brandName.toLowerCase()

    // Check recommendation patterns
    const patterns = [
      new RegExp(`(?:recommend|suggest|best|top|#1|number one|first choice)[^.]*${this.escapeRegex(brandLower)}`, 'i'),
      new RegExp(`${this.escapeRegex(brandLower)}[^.]*(?:is the best|is recommended|top pick|leading|stands out)`, 'i'),
      new RegExp(`^(?:1\\.|\\*\\*1\\.)\\s*(?:\\*\\*)?${this.escapeRegex(brandLower)}`, 'im'),
    ]

    return patterns.some(p => p.test(text))
  }

  // ─── Storage ──────────────────────────────────────────────

  /**
   * Download response text from Supabase Storage.
   */
  private async downloadResponseText(storagePath: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from('llm-responses')
        .download(storagePath)

      if (error || !data) {
        console.error('[Extractor] Storage download error:', error?.message)
        return null
      }

      return await data.text()
    } catch (err) {
      console.error('[Extractor] Error downloading response:', err)
      return null
    }
  }

  /**
   * Store extracted brand facts as response_data rows.
   */
  private async storeResponseData(
    response: ResponseFile,
    brandFacts: ExtractedBrandFact[]
  ): Promise<void> {
    return this.storeResponseDataWithModel(response, brandFacts, EXTRACTION_MODEL_RULE_BASED)
  }

  /**
   * Store extracted brand facts with a specific extraction model identifier.
   */
  private async storeResponseDataWithModel(
    response: ResponseFile,
    brandFacts: (ExtractedBrandFact | OrchestratedBrandFact)[],
    extractionModel: string,
  ): Promise<void> {
    if (brandFacts.length === 0) return

    // Separate primary brand rows (no competitor_id) from competitor rows
    const primaryRows = brandFacts
      .filter(fact => !('competitor_id' in fact) || !fact.competitor_id)
      .map(fact => ({
        response_id: response.id,
        brand_id: fact.brand_id,
        account_id: response.account_id,
        competitor_id: null,
        mentioned: fact.mentioned,
        brand_rank: fact.brand_rank,
        brand_mention_count: fact.brand_mention_count,
        co_mentioned_brands: fact.co_mentioned_brands,
        competitive_density: fact.competitive_density,
        raw_sentiment: fact.raw_sentiment,
        sentiment_signals: fact.sentiment_signals,
        citation_count: fact.citation_count,
        total_response_citations: fact.total_response_citations,
        is_primary_recommendation: fact.is_primary_recommendation,
        extraction_model: extractionModel,
        extraction_version: EXTRACTION_VERSION,
      }))

    const competitorRows = brandFacts
      .filter(fact => 'competitor_id' in fact && fact.competitor_id)
      .map(fact => ({
        response_id: response.id,
        brand_id: fact.brand_id, // Primary brand (FK owner)
        account_id: response.account_id,
        competitor_id: (fact as ExtractedBrandFact).competitor_id,
        mentioned: fact.mentioned,
        brand_rank: fact.brand_rank,
        brand_mention_count: fact.brand_mention_count,
        co_mentioned_brands: fact.co_mentioned_brands,
        competitive_density: fact.competitive_density,
        raw_sentiment: fact.raw_sentiment,
        sentiment_signals: fact.sentiment_signals,
        citation_count: fact.citation_count,
        total_response_citations: fact.total_response_citations,
        is_primary_recommendation: fact.is_primary_recommendation,
        extraction_model: extractionModel,
        extraction_version: EXTRACTION_VERSION,
      }))

    // Store primary brand rows (delete existing first to avoid partial index conflict)
    if (primaryRows.length > 0) {
      // Delete existing primary rows for this response
      await this.supabase
        .from('response_data')
        .delete()
        .eq('response_id', response.id)
        .is('competitor_id', null)

      const { error } = await this.supabase
        .from('response_data')
        .insert(primaryRows)

      if (error) {
        throw new Error(`Failed to store primary response_data: ${error.message}`)
      }
    }

    // Store competitor rows (delete existing first, then insert fresh)
    if (competitorRows.length > 0) {
      // Delete existing competitor rows for this response, then insert fresh
      await this.supabase
        .from('response_data')
        .delete()
        .eq('response_id', response.id)
        .not('competitor_id', 'is', null)

      const { error } = await this.supabase
        .from('response_data')
        .insert(competitorRows)

      if (error) {
        throw new Error(`Failed to store competitor response_data: ${error.message}`)
      }
    }
  }

  /**
   * Store extracted citations as aeo_citations rows.
   * Resolves or creates domain rows first, then UPSERTs citations.
   */
  private async storeCitations(
    response: ResponseFile,
    citations: (ExtractedCitation | OrchestratedCitation)[]
  ): Promise<void> {
    if (citations.length === 0) return

    // 1. Resolve/create domain rows for all unique domains in this batch
    const uniqueDomains = [...new Set(citations.map(c => c.domain))]
    const domainIdMap = await this.resolveDomains(uniqueDomains, citations)

    // 2. Build citation rows with domain_id, deduplicating by URL
    const seen = new Set<string>()
    const rows = citations
      .map(c => ({
        response_id: response.id,
        account_id: response.account_id,
        domain: c.domain,
        domain_id: domainIdMap.get(c.domain) || null,
        url: c.url,
        page_title: c.page_title,
        anchor_text: c.anchor_text,
        citation_rank: c.citation_rank,
        times_referenced: c.times_referenced,
        source_type: c.source_type,
        content_category: c.content_category,
        benefits_brand_id: c.benefits_brand_id,
        is_competitor_source: c.is_competitor_source,
        domain_authority: c.domain_authority,
      }))
      .filter(row => {
        const key = `${row.response_id}:${row.url || ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

    // 3. UPSERT using the UNIQUE index on (response_id, COALESCE(url, ''))
    // Delete-then-insert pattern is simpler and avoids COALESCE in onConflict
    await this.supabase
      .from('aeo_citations')
      .delete()
      .eq('response_id', response.id)

    const { error } = await this.supabase
      .from('aeo_citations')
      .insert(rows)

    if (error) {
      throw new Error(`Failed to store aeo_citations: ${error.message}`)
    }
  }

  /**
   * Resolve domain strings to domain IDs.
   * Creates new domain rows for unseen domains (INSERT ... ON CONFLICT DO NOTHING).
   * Returns Map<domain_string, domain_uuid>.
   */
  private async resolveDomains(
    domains: string[],
    citations: (ExtractedCitation | OrchestratedCitation)[]
  ): Promise<Map<string, string>> {
    const domainIdMap = new Map<string, string>()
    if (domains.length === 0) return domainIdMap

    // Check which domains already exist
    const { data: existing } = await this.supabase
      .from('domains')
      .select('id, domain')
      .in('domain', domains)

    for (const row of (existing || [])) {
      domainIdMap.set(row.domain, row.id)
    }

    // Create missing domains
    const missing = domains.filter(d => !domainIdMap.has(d))
    if (missing.length > 0) {
      // Build new domain rows with classification from the first citation that uses each domain
      const newDomains = missing.map(d => {
        const firstCitation = citations.find(c => c.domain === d)
        return {
          domain: d,
          source_type: firstCitation?.source_type || null,
          content_category: firstCitation?.content_category || null,
          domain_authority: firstCitation?.domain_authority || null,
          first_seen_at: new Date().toISOString(),
          last_cited_at: new Date().toISOString(),
          total_citations: 0, // Updated by aggregation job
        }
      })

      // INSERT ... ON CONFLICT(domain) DO NOTHING — safe for concurrent extractors
      const { data: inserted, error } = await this.supabase
        .from('domains')
        .upsert(newDomains, { onConflict: 'domain', ignoreDuplicates: true })
        .select('id, domain')

      if (error) {
        console.error('[Extractor] Error creating domains:', error)
        // Non-fatal: citations will have null domain_id
      }

      for (const row of (inserted || [])) {
        domainIdMap.set(row.domain, row.id)
      }

      // Re-fetch any that were created by a concurrent extractor
      const stillMissing = missing.filter(d => !domainIdMap.has(d))
      if (stillMissing.length > 0) {
        const { data: fetched } = await this.supabase
          .from('domains')
          .select('id, domain')
          .in('domain', stillMissing)

        for (const row of (fetched || [])) {
          domainIdMap.set(row.domain, row.id)
        }
      }
    }

    return domainIdMap
  }

  // ─── Topic Extraction ──────────────────────────────────────

  /**
   * Rule-based topic extraction v1.
   * Extracts key phrases/topics from structured LLM response text.
   * Looks for headers, numbered items, bold terms, and repeated noun phrases.
   */
  private extractTopics(
    text: string,
    primaryBrand?: BrandRecord,
    competitors?: CompetitorRecord[],
    allBrands?: BrandRecord[]
  ): ExtractedTopic[] {
    // Build a set of brand names to exclude from topics
    const brandNamesLower = new Set<string>()
    if (primaryBrand) {
      brandNamesLower.add(primaryBrand.name.toLowerCase())
      if (primaryBrand.primary_domain) brandNamesLower.add(primaryBrand.primary_domain.toLowerCase())
      for (const alias of (primaryBrand.entity_aliases || [])) {
        brandNamesLower.add(alias.toLowerCase())
      }
    }
    if (competitors) {
      for (const c of competitors) {
        brandNamesLower.add(c.name.toLowerCase())
        if (c.domain) brandNamesLower.add(c.domain.toLowerCase())
      }
    }
    if (allBrands) {
      for (const b of allBrands) {
        brandNamesLower.add(b.name.toLowerCase())
        for (const alias of (b.entity_aliases || [])) {
          brandNamesLower.add(alias.toLowerCase())
        }
      }
    }

    const topics = new Map<string, { count: number; sentiment: number }>()

    // 1. Extract from markdown headers (## Topic, ### Topic)
    const headerPattern = /^#{1,4}\s+(.+)$/gm
    let match
    while ((match = headerPattern.exec(text)) !== null) {
      const topic = match[1].replace(/\*\*/g, '').trim()
      if (topic.length >= 3 && topic.length <= 80) {
        const key = topic.toLowerCase()
        const existing = topics.get(key) || { count: 0, sentiment: 0 }
        existing.count++
        topics.set(key, existing)
      }
    }

    // 2. Extract from bold text (**topic**)
    const boldPattern = /\*\*([^*]+)\*\*/g
    while ((match = boldPattern.exec(text)) !== null) {
      const topic = match[1].trim()
      if (topic.length >= 3 && topic.length <= 60 && !topic.includes('\n')) {
        const key = topic.toLowerCase()
        const existing = topics.get(key) || { count: 0, sentiment: 0 }
        existing.count++
        topics.set(key, existing)
      }
    }

    // 3. Extract from numbered list items (1. Topic: description)
    const listPattern = /^\d+\.\s+\*?\*?([^:\n*]+)/gm
    while ((match = listPattern.exec(text)) !== null) {
      const topic = match[1].replace(/\*\*/g, '').trim()
      if (topic.length >= 3 && topic.length <= 60) {
        const key = topic.toLowerCase()
        const existing = topics.get(key) || { count: 0, sentiment: 0 }
        existing.count++
        topics.set(key, existing)
      }
    }

    // Score topics: relevance by frequency, sentiment from context
    const textLower = text.toLowerCase()
    const totalTopics = topics.size || 1

    const result: ExtractedTopic[] = []
    for (const [name, info] of topics) {
      // Skip generic/short topics
      if (name.length < 4 || /^(the|and|for|with|this|that|here|also|more)$/i.test(name)) continue

      // Skip brand/competitor names — these are entities, not topics
      const nameClean = name.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (brandNamesLower.has(name) || brandNamesLower.has(nameClean)) continue

      // Compute relevance: how often this topic appears relative to total
      const relevance = Math.min(1.0, info.count / Math.max(totalTopics * 0.5, 1))

      // Compute sentiment from surrounding context
      const topicSentiment = this.scoreSentiment(text, name)

      // Categorize topic
      const category = this.categorizeTopic(name, textLower)

      result.push({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Title case
        category,
        relevance: Math.round(relevance * 100) / 100,
        sentiment: topicSentiment,
      })
    }

    // Return top 15 most relevant topics
    return result
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15)
  }

  /**
   * Simple topic categorization based on keywords.
   */
  private categorizeTopic(topic: string, _textLower: string): string | null {
    const t = topic.toLowerCase()
    if (/price|cost|pricing|affordable|expensive|budget/i.test(t)) return 'pricing'
    if (/feature|capability|function|tool|integration/i.test(t)) return 'features'
    if (/security|privacy|compliance|gdpr|encryption/i.test(t)) return 'security'
    if (/performance|speed|fast|efficient|scalab/i.test(t)) return 'performance'
    if (/support|service|help|customer|documentation/i.test(t)) return 'support'
    if (/market|competitor|alternative|comparison|vs/i.test(t)) return 'market'
    if (/review|rating|reputation|trust|reliable/i.test(t)) return 'reputation'
    if (/use case|industry|sector|vertical|enterprise/i.test(t)) return 'use_case'
    if (/setup|install|deploy|onboard|getting started/i.test(t)) return 'onboarding'
    return null
  }

  /**
   * Store extracted topics.
   */
  private async storeTopics(
    response: ResponseFile,
    topics: (ExtractedTopic | OrchestratedTopic)[]
  ): Promise<void> {
    if (topics.length === 0) return

    // Delete existing topics for this response (idempotent)
    await this.supabase
      .from('topics')
      .delete()
      .eq('response_id', response.id)

    const rows = topics.map(t => ({
      response_id: response.id,
      account_id: response.account_id,
      name: t.name,
      category: t.category,
      relevance: t.relevance,
      sentiment: t.sentiment,
    }))

    const { error } = await this.supabase
      .from('topics')
      .insert(rows)

    if (error) {
      // Non-fatal: topic extraction failure shouldn't block the pipeline
      console.error('[Extractor] Error storing topics:', error)
    }
  }

  /**
   * Store per-brand topic associations from AI agent or rule-based extraction.
   */
  private async storeBrandTopicAssociations(
    response: ResponseFile,
    associations: OrchestratedBrandTopicAssociation[]
  ): Promise<void> {
    if (associations.length === 0) return

    // Delete existing associations for this response (idempotent)
    await this.supabase
      .from('topic_brand_associations')
      .delete()
      .eq('response_id', response.id)

    const rows = associations.map(a => ({
      response_id: response.id,
      account_id: response.account_id,
      brand_name: a.brand_name,
      brand_id: a.brand_id || null,
      competitor_id: a.competitor_id || null,
      topic_name: a.topic_name,
      topic_category: a.topic_category,
      sentiment: a.sentiment,
      relevance: a.relevance,
    }))

    const { error } = await this.supabase
      .from('topic_brand_associations')
      .insert(rows)

    if (error) {
      console.error('[Extractor] Error storing brand topic associations:', error)
    }
  }

  /**
   * Derive brand-topic associations from rule-based topics + brand facts.
   * For rule-based extraction, we attribute each response-level topic to every
   * mentioned brand using the topic's response-level sentiment as a proxy.
   */
  private deriveBrandTopicAssociations(
    brandFacts: ExtractedBrandFact[],
    topics: ExtractedTopic[],
    primaryBrand: BrandRecord,
    competitors: CompetitorRecord[]
  ): OrchestratedBrandTopicAssociation[] {
    if (topics.length === 0) return []

    const mentionedBrands = brandFacts.filter(bf => bf.mentioned)
    if (mentionedBrands.length === 0) return []

    // Build name lookup: brand_id/competitor_id → name
    const nameMap = new Map<string, string>()
    nameMap.set(primaryBrand.id, primaryBrand.name)
    for (const c of competitors) {
      nameMap.set(c.id, c.name)
    }

    const associations: OrchestratedBrandTopicAssociation[] = []

    for (const brand of mentionedBrands) {
      const brandName = brand.competitor_id
        ? nameMap.get(brand.competitor_id) || 'Unknown'
        : nameMap.get(brand.brand_id) || 'Unknown'

      for (const topic of topics) {
        associations.push({
          brand_name: brandName,
          brand_id: brand.brand_id,
          competitor_id: brand.competitor_id || null,
          topic_name: topic.name,
          topic_category: topic.category,
          sentiment: topic.sentiment,
          relevance: topic.relevance,
        })
      }
    }

    return associations
  }

  // ─── Brand Context Loading ────────────────────────────────

  /**
   * Load primary brand, all account brands, and competitors.
   * Competitors are analysed using their competitors table record — no brand entry needed.
   */
  private async loadBrandContext(accountId: string, brandId: string): Promise<{
    primaryBrand: BrandRecord | null
    competitors: CompetitorRecord[]
    allBrands: BrandRecord[]
  }> {
    // Load all brands for this account
    const { data: brands } = await this.supabase
      .from('brands')
      .select('id, name, entity_aliases, primary_domain, brand_category')
      .eq('account_id', accountId)
      .eq('is_active', true)

    const allBrands: BrandRecord[] = (brands || []).map(b => ({
      id: b.id,
      name: b.name,
      entity_aliases: b.entity_aliases || [],
      primary_domain: b.primary_domain
    })).sort((left, right) => left.name.localeCompare(right.name))

    const primaryBrand = allBrands.find(b => b.id === brandId) || null

    // Load competitors for this brand from the competitors table
    const { data: comps } = await this.supabase
      .from('competitors')
      .select('id, brand_id, name:competitor_name, domain:competitor_domain, linked_brand_id')
      .eq('brand_id', brandId)

    const competitors: CompetitorRecord[] = (comps || []).map(c => ({
      id: c.id,
      brand_id: c.brand_id,
      name: c.name || '',
      domain: c.domain,
      linked_brand_id: c.linked_brand_id
    })).sort((left, right) => left.name.localeCompare(right.name))

    return { primaryBrand, competitors, allBrands }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async markFailed(responseId: string, error: string): Promise<void> {
    await this.supabase
      .from('llm_response_files')
      .update({ extraction_status: 'failed', extraction_error: error })
      .eq('id', responseId)
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

// ─── Compact Sentiment Lexicon ────────────────────────────

const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive
  'excellent': 3, 'outstanding': 3, 'exceptional': 3, 'superior': 3,
  'best': 2, 'great': 2, 'reliable': 2, 'innovative': 2, 'leading': 2,
  'recommended': 2, 'trusted': 2, 'powerful': 2, 'impressive': 2,
  'good': 1, 'solid': 1, 'popular': 1, 'useful': 1, 'effective': 1,
  'competitive': 1, 'robust': 1, 'comprehensive': 1, 'fast': 1,
  'affordable': 1, 'user-friendly': 1, 'seamless': 1, 'intuitive': 1,
  'secure': 1, 'flexible': 1, 'scalable': 1, 'efficient': 1,
  // Negative
  'worst': -3, 'terrible': -3, 'awful': -3, 'horrible': -3,
  'poor': -2, 'slow': -2, 'expensive': -2, 'unreliable': -2, 'outdated': -2,
  'limited': -1, 'lacking': -1, 'complex': -1, 'confusing': -1,
  'difficult': -1, 'buggy': -1, 'clunky': -1, 'basic': -1,
  'disappointing': -2, 'frustrating': -2, 'mediocre': -1,
}
