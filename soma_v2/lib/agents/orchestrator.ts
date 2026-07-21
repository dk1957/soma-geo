/**
 * Analysis Agent Orchestrator
 * ===========================
 * Coordinates the execution of all analysis agents for a single LLM response.
 * Manages parallel execution, skill checks, and result aggregation.
 *
 * Pipeline:
 * 1. Brand Detection Agent → identifies brands
 * 2. Sentiment Agent + Citation Agent (parallel, depend on brand results)
 * 3. Topic Agent (independent, runs in parallel with step 2)
 *
 * Results are mapped to the same data structures as the rule-based extractor,
 * ensuring backward compatibility with the storage and aggregation layers.
 */

import { isSkillEnabled } from './core'
import { runBrandDetectionAgent } from './analysis/brand-detection-agent'
import { runSentimentAgent } from './analysis/sentiment-agent'
import { runCitationAgent } from './analysis/citation-agent'
import { runTopicAgent } from './analysis/topic-agent'
import type { AgentBrandContext } from './types'
import type { BrandDetectionOutput, SentimentOutput, CitationOutput, TopicOutput } from './schemas'

// ─── Output Types (compatible with extractor storage layer) ─────

export interface OrchestratedBrandFact {
  brand_id: string
  competitor_id?: string | null // Set for competitor rows
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

export interface OrchestratedCitation {
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

export interface OrchestratedTopic {
  name: string
  category: string | null
  relevance: number
  sentiment: number
}

export interface OrchestratedBrandTopicAssociation {
  brand_name: string
  brand_id: string | null
  competitor_id: string | null
  topic_name: string
  topic_category: string | null
  sentiment: number
  relevance: number
}

export interface OrchestrationResult {
  brandFacts: OrchestratedBrandFact[]
  citations: OrchestratedCitation[]
  topics: OrchestratedTopic[]
  brandTopicAssociations: OrchestratedBrandTopicAssociation[]
  metadata: {
    extraction_model: string
    agents_used: string[]
    total_duration_ms: number
    agents_skipped: string[]
    agents_failed: string[]
  }
}

// ─── Brand name → ID mapping ────────────────────────────────

interface BrandNameMap {
  [normalizedName: string]: { brandId: string; competitorId?: string }
}

function buildBrandNameMap(brandContext: AgentBrandContext): BrandNameMap {
  const map: BrandNameMap = {}

  // Primary brand
  map[brandContext.primaryBrand.name.toLowerCase()] = { brandId: brandContext.primaryBrand.id }
  for (const alias of brandContext.primaryBrand.aliases) {
    map[alias.toLowerCase()] = { brandId: brandContext.primaryBrand.id }
  }

  // Competitors — map to primary brand's ID with competitor_id
  for (const comp of brandContext.competitors) {
    map[comp.name.toLowerCase()] = {
      brandId: brandContext.primaryBrand.id, // FK owner is always the primary brand
      competitorId: comp.id,                 // competitors table ID
    }
  }

  return map
}

function resolveBrandId(name: string, map: BrandNameMap): string | null {
  return map[name.toLowerCase()]?.brandId ?? null
}

function resolveCompetitorId(name: string, map: BrandNameMap): string | null {
  return map[name.toLowerCase()]?.competitorId ?? null
}

// ─── Orchestrator ───────────────────────────────────────────

export async function orchestrateAnalysis(
  responseText: string,
  brandContext: AgentBrandContext,
  responseId: string,
): Promise<OrchestrationResult> {
  const startTime = Date.now()
  const agentsUsed: string[] = []
  const agentsSkipped: string[] = []
  const agentsFailed: string[] = []

  const brandNameMap = buildBrandNameMap(brandContext)

  // ── Check which skills are enabled ──
  const [brandDetectionEnabled, sentimentEnabled, citationEnabled, topicEnabled] = await Promise.all([
    isSkillEnabled('brand_mention_detection'),
    isSkillEnabled('sentiment_classification'),
    isSkillEnabled('source_extraction'),
    isSkillEnabled('fact_extraction'),
  ])

  // ── Step 1: Brand Detection (always runs first — other agents depend on it) ──
  let brandDetection: BrandDetectionOutput | null = null

  if (brandDetectionEnabled) {
    const brandResult = await runBrandDetectionAgent(responseText, brandContext, responseId)
    if (brandResult.success && brandResult.data) {
      brandDetection = brandResult.data
      agentsUsed.push('analysis_brand_detector')
    } else {
      agentsFailed.push('analysis_brand_detector')
      console.error(`[Orchestrator] Brand detection failed: ${brandResult.error}`)
    }
  } else {
    agentsSkipped.push('analysis_brand_detector')
  }

  // Build list of mentioned brands for downstream agents
  const mentionedBrandNames = brandDetection
    ? brandDetection.brands.filter(b => b.mentioned).map(b => b.brand_name)
    : []

  // ── Step 2: Parallel agents (sentiment + citation + topic) ──
  const parallelTasks: Promise<void>[] = []

  let sentimentData: SentimentOutput | null = null
  let citationData: CitationOutput | null = null
  let topicData: TopicOutput | null = null

  if (sentimentEnabled && mentionedBrandNames.length > 0) {
    parallelTasks.push(
      runSentimentAgent(responseText, mentionedBrandNames, responseId).then(result => {
        if (result.success && result.data) {
          sentimentData = result.data
          agentsUsed.push('analysis_sentiment')
        } else {
          agentsFailed.push('analysis_sentiment')
        }
      })
    )
  } else if (!sentimentEnabled) {
    agentsSkipped.push('analysis_sentiment')
  }

  if (citationEnabled) {
    parallelTasks.push(
      runCitationAgent(responseText, brandContext, responseId).then(result => {
        if (result.success && result.data) {
          citationData = result.data
          agentsUsed.push('analysis_citation')
        } else {
          agentsFailed.push('analysis_citation')
        }
      })
    )
  } else {
    agentsSkipped.push('analysis_citation')
  }

  if (topicEnabled) {
    // Collect all brand/competitor names to exclude from topics
    const allBrandNames = [
      brandContext.primaryBrand.name,
      ...brandContext.primaryBrand.aliases,
      ...brandContext.competitors.map(c => c.name),
    ]

    // Use standard topic agent — brand-topic associations are derived in the extractor
    // from response-level topics × mentioned brands (rule-based derivation).
    // The BrandTopicOutputSchema is too complex for gemini-flash-lite structured output.
    parallelTasks.push(
      runTopicAgent(responseText, responseId, allBrandNames).then(result => {
        if (result.success && result.data) {
          topicData = result.data
          agentsUsed.push('analysis_topic')
        } else {
          agentsFailed.push('analysis_topic')
        }
      })
    )
  } else {
    agentsSkipped.push('analysis_topic')
  }

  await Promise.all(parallelTasks)

  // ── Map results to extractor-compatible structures ──

  const brandFacts = mapBrandFacts(brandDetection, sentimentData, citationData, brandContext, brandNameMap)
  const citations = mapCitations(citationData, brandNameMap)
  const topics = mapTopics(topicData, brandNameMap)
  // Brand-topic associations are derived in the extractor from topics × mentioned brands
  const brandTopicAssociations: OrchestratedBrandTopicAssociation[] = []

  const totalDuration = Date.now() - startTime
  console.log(
    `[Orchestrator] Completed in ${totalDuration}ms | ` +
    `agents_used=${agentsUsed.join(',')} | ` +
    `skipped=${agentsSkipped.join(',') || 'none'} | ` +
    `failed=${agentsFailed.join(',') || 'none'}`
  )

  return {
    brandFacts,
    citations,
    topics,
    brandTopicAssociations,
    metadata: {
      extraction_model: `ai-agents-v1/${agentsUsed.join('+')}`,
      agents_used: agentsUsed,
      total_duration_ms: totalDuration,
      agents_skipped: agentsSkipped,
      agents_failed: agentsFailed,
    },
  }
}

// ─── Result Mappers ─────────────────────────────────────────

function mapBrandFacts(
  brandDetection: BrandDetectionOutput | null,
  sentimentData: SentimentOutput | null,
  citationData: CitationOutput | null,
  brandContext: AgentBrandContext,
  brandNameMap: BrandNameMap,
): OrchestratedBrandFact[] {
  if (!brandDetection) {
    // No brand detection data — return minimal facts for primary brand
    return [{
      brand_id: brandContext.primaryBrand.id,
      mentioned: false,
      brand_rank: null,
      brand_mention_count: 0,
      co_mentioned_brands: [],
      competitive_density: 0,
      raw_sentiment: null,
      sentiment_signals: [],
      citation_count: 0,
      total_response_citations: citationData?.total_citations ?? 0,
      is_primary_recommendation: false,
    }]
  }

  const totalCitations = citationData?.total_citations ?? 0

  // Build sentiment lookup by brand name
  const sentimentMap = new Map<string, { score: number; signals: string[] }>()
  if (sentimentData) {
    for (const bs of sentimentData.brand_sentiments) {
      sentimentMap.set(bs.brand_name.toLowerCase(), {
        score: bs.raw_sentiment,
        signals: bs.sentiment_signals,
      })
    }
  }

  // Build citation count per brand
  const brandCitationCounts = new Map<string, number>()
  if (citationData) {
    for (const c of citationData.citations) {
      if (c.benefits_brand) {
        const brandId = resolveBrandId(c.benefits_brand, brandNameMap)
        if (brandId) {
          brandCitationCounts.set(brandId, (brandCitationCounts.get(brandId) || 0) + 1)
        }
      }
    }
  }

  const allMentionedNames = brandDetection.brands
    .filter(b => b.mentioned)
    .map(b => b.brand_name)

  return brandDetection.brands
    .map(b => {
      const brandId = resolveBrandId(b.brand_name, brandNameMap)
      if (!brandId) return null

      const competitorId = resolveCompetitorId(b.brand_name, brandNameMap)
      const sentiment = sentimentMap.get(b.brand_name.toLowerCase())
      const coMentioned = allMentionedNames.filter(n => n.toLowerCase() !== b.brand_name.toLowerCase())

      return {
        brand_id: brandId,
        competitor_id: competitorId || null,
        mentioned: b.mentioned,
        brand_rank: b.brand_rank,
        brand_mention_count: b.mention_count,
        co_mentioned_brands: coMentioned,
        competitive_density: brandDetection.competitive_density,
        raw_sentiment: sentiment?.score ?? null,
        sentiment_signals: sentiment?.signals ?? [],
        citation_count: brandCitationCounts.get(brandId) ?? 0,
        total_response_citations: totalCitations,
        is_primary_recommendation: b.is_primary_recommendation,
      }
    })
    .filter((f): f is OrchestratedBrandFact => f !== null)
}

function mapCitations(
  citationData: CitationOutput | null,
  brandNameMap: BrandNameMap,
): OrchestratedCitation[] {
  if (!citationData) return []

  // Deduplicate citations by URL (or domain if no URL) — the model may repeat entries
  const seen = new Map<string, OrchestratedCitation>()
  for (const c of citationData.citations) {
    const key = (c.url || c.domain).toLowerCase()
    const existing = seen.get(key)
    if (existing) {
      // Merge: increment times_referenced
      existing.times_referenced += c.times_referenced
    } else {
      seen.set(key, {
        domain: c.domain,
        url: c.url,
        page_title: c.page_title,
        anchor_text: c.anchor_text,
        citation_rank: seen.size + 1, // Re-rank after dedup
        times_referenced: c.times_referenced,
        source_type: c.source_type,
        content_category: c.content_category,
        benefits_brand_id: c.benefits_brand ? resolveBrandId(c.benefits_brand, brandNameMap) : null,
        is_competitor_source: c.is_competitor_source,
        domain_authority: null,
      })
    }
  }

  return [...seen.values()]
}

function mapTopics(topicData: TopicOutput | null, brandNameMap: BrandNameMap): OrchestratedTopic[] {
  if (!topicData) return []

  // Filter out any topics whose names match known brand/competitor names
  const brandNamesLower = new Set(Object.keys(brandNameMap))

  return topicData.topics
    .filter(t => {
      const nameLower = t.name.toLowerCase().trim()
      // Exact match against brand names
      if (brandNamesLower.has(nameLower)) return false
      // Check if topic is just a brand name with a parenthetical (e.g. "Wise (TransferWise)")
      const baseName = nameLower.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (baseName && brandNamesLower.has(baseName)) return false
      return true
    })
    .map(t => ({
      name: t.name,
      category: t.category,
      relevance: Math.round(t.relevance * 100) / 100,
      sentiment: Math.round(t.sentiment * 100) / 100,
    }))
}
