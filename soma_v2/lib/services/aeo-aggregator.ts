/**
 * AEO Aggregator Service
 * =======================
 * Layer 3 of the AEO pipeline: rolls up response_data into daily metrics.
 *
 * Responsibilities:
 * - Reads response_data + aeo_citations for a given run_date
 * - Computes daily_brand_metrics (one row per brand × run_date)
 * - Computes daily_prompt_metrics (one row per prompt × brand × run_date)
 * - Fetches LVI weights from lvi_config per account
 * - All writes are UPSERTs on unique constraints (idempotent)
 *
 * LVI Formula:
 *   LVI = (visibility_rate × w_vis) + (normalised_rank × w_rank)
 *       + (citation_rate × w_cit) + (normalised_sentiment × w_sent)
 *
 *   normalised_rank = max(0, (1 - (avg_rank - 1) / 9)) × 100
 *   normalised_sentiment = ((avg_sentiment + 1) / 2) × 100
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { getDateInTimezone, getUTCBoundsForDate, DEFAULT_TIMEZONE } from '@/lib/utils/timezone'

// ─── Types ──────────────────────────────────────────────────

interface LVIWeights {
  visibility_weight: number
  rank_weight: number
  citation_weight: number
  sentiment_weight: number
}

const DEFAULT_WEIGHTS: LVIWeights = {
  visibility_weight: 0.35,
  rank_weight: 0.30,
  citation_weight: 0.15,
  sentiment_weight: 0.20,
}

interface ResponseDataRow {
  response_id: string
  brand_id: string
  account_id: string
  competitor_id: string | null
  mentioned: boolean
  brand_rank: number | null
  brand_mention_count: number
  co_mentioned_brands: string[]
  competitive_density: number
  raw_sentiment: number | null
  citation_count: number
  total_response_citations: number
  is_primary_recommendation: boolean
  // Joined fields
  prompt_id: string | null
  model_name: string
  word_count: number
  run_date: string // from runs.created_at::date
}

interface BrandMetrics {
  brand_id: string
  account_id: string
  run_date: string
  total_responses: number
  responses_with_mention: number
  total_models_run: number
  visibility_rate: number
  share_of_voice: number | null
  avg_brand_rank: number | null
  avg_sentiment: number
  citation_rate: number
  lvi_score: number
  recommendation_rate: number
  total_citations: number
  unique_citing_domains: number
  avg_competitive_density: number
  total_brand_mentions: number
  metric_version: number
}

interface PromptMetrics {
  prompt_id: string
  brand_id: string
  account_id: string
  run_date: string
  total_responses: number
  visibility_rate: number
  share_of_voice: number | null
  avg_brand_rank: number | null
  avg_sentiment: number
  citation_rate: number
  lvi_score: number
  model_consistency: number
  best_performing_model: string | null
  avg_response_word_count: number
  metric_version: number
}

interface ModelMetrics {
  brand_id: string
  account_id: string
  model_name: string
  run_date: string
  total_responses: number
  responses_with_mention: number
  visibility_rate: number
  citation_rate: number
  recommendation_rate: number
  avg_brand_rank: number | null
  avg_sentiment: number
  lvi_score: number
  share_of_voice: number | null
  total_citations: number
  total_brand_mentions: number
  metric_version: number
}

interface CompetitorMetrics {
  competitor_id: string
  brand_id: string
  account_id: string
  competitor_name: string
  run_date: string
  total_responses: number
  responses_with_mention: number
  visibility_rate: number
  citation_rate: number
  recommendation_rate: number
  avg_brand_rank: number | null
  avg_sentiment: number
  lvi_score: number
  share_of_voice: number | null
  total_citations: number
  total_brand_mentions: number
  metric_version: number
}

// ─── Service ──────────────────────────────────────────────

const METRIC_VERSION = 1

export class AEOAggregatorService {
  private supabase: SupabaseClient
  private timezone: string = DEFAULT_TIMEZONE

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient()
  }

  /**
   * Main entry point: aggregate metrics for a specific date.
   * If no date provided, aggregates today in the account's timezone.
   *
   * @param options.timezone  IANA timezone string (e.g. 'Africa/Nairobi').
   *                          When omitted, falls back to UTC.
   */
  async aggregateForDate(
    runDate?: string,
    options?: { accountId?: string; brandId?: string; timezone?: string }
  ): Promise<{ brandMetrics: number; promptMetrics: number; modelMetrics: number }> {
    this.timezone = options?.timezone || DEFAULT_TIMEZONE
    const date = runDate || getDateInTimezone(this.timezone)
    console.log(`[Aggregator] Starting aggregation for ${date}`)

    // Load response data with joined fields
    const responseData = await this.loadResponseData(date, options?.accountId, options?.brandId)
    if (responseData.length === 0) {
      console.log(`[Aggregator] No response data found for ${date}`)
      return { brandMetrics: 0, promptMetrics: 0, modelMetrics: 0 }
    }

    console.log(`[Aggregator] Loaded ${responseData.length} response_data rows for ${date}`)

    // Separate primary brand rows from competitor rows
    const primaryData = responseData.filter(r => !r.competitor_id)
    const competitorData = responseData.filter(r => !!r.competitor_id)

    // Group by account for LVI weight lookup
    const accountIds = [...new Set(responseData.map(r => r.account_id))]
    const weightsMap = await this.loadLVIWeights(accountIds)

    // Compute brand metrics (primary brands only — not competitor rows)
    // Pass allData so SOV can be computed against full market (primary + competitors)
    const brandMetrics = await this.computeBrandMetrics(primaryData, date, weightsMap, responseData)
    await this.storeBrandMetrics(brandMetrics)

    // Compute prompt metrics (primary brands only)
    // Pass allData so SOV can be computed against full market
    const promptMetrics = await this.computePromptMetrics(primaryData, date, weightsMap, responseData)
    await this.storePromptMetrics(promptMetrics)

    // Compute per-model metrics (primary brands only)
    // Pass allData so SOV can be computed against full market
    const modelMetrics = this.computeModelMetrics(primaryData, date, weightsMap, responseData)
    await this.storeModelMetrics(modelMetrics)

    // Compute competitor metrics from competitor rows
    // Pass allData so SOV can be computed against full market
    let competitorMetricsCount = 0
    if (competitorData.length > 0) {
      const compMetrics = this.computeCompetitorMetrics(competitorData, date, weightsMap, responseData)
      await this.storeCompetitorMetrics(compMetrics)
      competitorMetricsCount = compMetrics.length
    }

    // Update domain running totals
    await this.updateDomainStats()

    console.log(`[Aggregator] Done: ${brandMetrics.length} brand, ${promptMetrics.length} prompt, ${modelMetrics.length} model, ${competitorMetricsCount} competitor metrics`)
    return { brandMetrics: brandMetrics.length, promptMetrics: promptMetrics.length, modelMetrics: modelMetrics.length }
  }

  // ─── Data Loading ─────────────────────────────────────────

  /**
   * Load response_data with joined run date, prompt_id, model, word_count.
   */
  private async loadResponseData(
    date: string,
    accountId?: string,
    brandId?: string
  ): Promise<ResponseDataRow[]> {
    // We need to join response_data → llm_response_files → runs
    // to get run_date, prompt_id, model_name, word_count
    // Supabase doesn't support double joins well, so we use RPC or two queries

    // First get response_ids for this date
    let responseQuery = this.supabase
      .from('llm_response_files')
      .select('id, prompt_id, model_name, word_count, run_id')
      .eq('extraction_status', 'complete')
      .eq('success', true)

    if (accountId) responseQuery = responseQuery.eq('account_id', accountId)
    if (brandId) responseQuery = responseQuery.eq('brand_id', brandId)

    // Filter by date using created_at — bounds are timezone-adjusted so
    // that "April 13 in Africa/Nairobi" maps to the correct UTC window.
    const dateBounds = getUTCBoundsForDate(date, this.timezone)
    responseQuery = responseQuery
      .gte('created_at', dateBounds.start)
      .lt('created_at', dateBounds.end)

    const { data: responseFiles, error: rfError } = await responseQuery

    if (rfError || !responseFiles || responseFiles.length === 0) {
      if (rfError) console.error('[Aggregator] Error loading response files:', rfError)
      return []
    }

    // Build a map of response_id → file info
    const fileMap = new Map(responseFiles.map(f => [f.id, f]))
    const responseIds = responseFiles.map(f => f.id)

    // Load response_data for these responses (batch by 500)
    const allData: ResponseDataRow[] = []
    for (let i = 0; i < responseIds.length; i += 500) {
      const batch = responseIds.slice(i, i + 500)
      const { data, error } = await this.supabase
        .from('response_data')
        .select('*')
        .in('response_id', batch)

      if (error) {
        console.error('[Aggregator] Error loading response_data batch:', error)
        continue
      }

      if (data) {
        for (const row of data) {
          const file = fileMap.get(row.response_id)
          allData.push({
            ...row,
            prompt_id: file?.prompt_id || null,
            model_name: file?.model_name || 'unknown',
            word_count: file?.word_count || 0,
            run_date: date,
          })
        }
      }
    }

    return allData
  }

  /**
   * Load LVI weights for each account. Falls back to defaults.
   */
  private async loadLVIWeights(accountIds: string[]): Promise<Map<string, LVIWeights>> {
    const map = new Map<string, LVIWeights>()

    if (accountIds.length === 0) return map

    const { data } = await this.supabase
      .from('lvi_config')
      .select('account_id, visibility_weight, rank_weight, citation_weight, sentiment_weight')
      .in('account_id', accountIds)

    if (data) {
      for (const row of data) {
        map.set(row.account_id, {
          visibility_weight: row.visibility_weight,
          rank_weight: row.rank_weight,
          citation_weight: row.citation_weight,
          sentiment_weight: row.sentiment_weight,
        })
      }
    }

    return map
  }

  // ─── Brand Metrics Computation ────────────────────────────

  private async computeBrandMetrics(
    data: ResponseDataRow[],
    date: string,
    weightsMap: Map<string, LVIWeights>,
    allData: ResponseDataRow[]
  ): Promise<BrandMetrics[]> {
    // Group by brand_id
    const brandGroups = new Map<string, ResponseDataRow[]>()
    for (const row of data) {
      const key = row.brand_id
      if (!brandGroups.has(key)) brandGroups.set(key, [])
      brandGroups.get(key)!.push(row)
    }

    // Batch-load citation stats for ALL brands in one query (avoids N+1)
    const allBrandIds = [...brandGroups.keys()]
    const allAccountIds = [...new Set(data.map(r => r.account_id))]
    const citationStatsMap = await this.batchLoadCitationStats(allBrandIds, allAccountIds, date)

    const metrics: BrandMetrics[] = []

    for (const [brandId, rows] of brandGroups) {
      const accountId = rows[0].account_id
      const weights = weightsMap.get(accountId) || DEFAULT_WEIGHTS

      // Deduplicate by response_id for total unique responses
      const uniqueResponseIds = new Set(rows.map(r => r.response_id))
      const totalResponses = uniqueResponseIds.size

      const mentionedRows = rows.filter(r => r.mentioned)
      const responsesWithMention = new Set(mentionedRows.map(r => r.response_id)).size

      // Models
      const uniqueModels = new Set(rows.map(r => r.model_name))
      const totalModelsRun = uniqueModels.size

      // Visibility
      const visibilityRate = totalResponses > 0
        ? (responsesWithMention / totalResponses) * 100
        : 0

      // Share of Voice — presence-based, using competitive_density as denominator
      // Per response: SOV = (1 / total_brands_mentioned) × 100 if brand is mentioned, else 0
      // Daily SOV = average across ALL responses (combines visibility × market density)
      // Not mentioned in any response → null
      let sov: number | null = null
      if (totalResponses > 0) {
        let sovSum = 0
        // Build a map of response_id → competitive_density from allData (one entry per response)
        const responseCD = new Map<string, number>()
        for (const row of allData) {
          if (!responseCD.has(row.response_id) && row.competitive_density > 0) {
            responseCD.set(row.response_id, row.competitive_density)
          }
        }
        for (const row of rows) {
          if (row.mentioned) {
            const cd = responseCD.get(row.response_id) || row.competitive_density
            if (cd > 0) sovSum += (1 / cd) * 100
          }
        }
        sov = mentionedRows.length > 0 ? sovSum / totalResponses : null
      }

      // Avg Rank — include ALL responses, not just mentioned ones
      // Non-mentioned responses count as rank 10 (worst/last position)
      // This prevents misleading 100% position when brand is only mentioned in branded queries
      const PENALTY_RANK = 10
      const mentionedRanks = mentionedRows
        .map(r => r.brand_rank)
        .filter((r): r is number => r !== null && r > 0)
      const nonMentionedCount = totalResponses - responsesWithMention
      let avgBrandRank: number | null = null
      if (mentionedRanks.length > 0) {
        const totalRankSum = mentionedRanks.reduce((a, b) => a + b, 0) + (nonMentionedCount * PENALTY_RANK)
        avgBrandRank = totalRankSum / totalResponses
      }

      // Avg Sentiment (only where mentioned — null if never mentioned)
      const sentiments = mentionedRows
        .map(r => r.raw_sentiment)
        .filter((s): s is number => s !== null)
      const avgSentiment: number | null = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

      // Citation Rate
      const responsesWithCitation = mentionedRows.filter(r => r.citation_count > 0).length
      const citationRate = responsesWithMention > 0
        ? (responsesWithCitation / responsesWithMention) * 100
        : 0

      // Recommendation Rate
      const recommendations = mentionedRows.filter(r => r.is_primary_recommendation).length
      const recommendationRate = totalResponses > 0
        ? (recommendations / totalResponses) * 100
        : 0

      // Citation totals (from pre-loaded batch)
      const citationStats = citationStatsMap.get(brandId) || { totalCitations: 0, uniqueDomains: 0 }

      // Total brand mentions (raw sum — SOV numerator, auditable)
      const totalBrandMentions = mentionedRows.reduce((sum, r) => sum + r.brand_mention_count, 0)

      // Competitive Density
      const avgCompetitiveDensity = rows.length > 0
        ? rows.reduce((sum, r) => sum + r.competitive_density, 0) / rows.length
        : 0

      // LVI Score
      const lviScore = this.computeLVI(
        visibilityRate, avgBrandRank, citationRate, avgSentiment ?? 0, weights
      )

      metrics.push({
        brand_id: brandId,
        account_id: accountId,
        run_date: date,
        total_responses: totalResponses,
        responses_with_mention: responsesWithMention,
        total_models_run: totalModelsRun,
        visibility_rate: round2(visibilityRate),
        share_of_voice: sov !== null ? round2(sov) : null,
        avg_brand_rank: avgBrandRank ? round2(avgBrandRank) : null,
        avg_sentiment: avgSentiment !== null ? round3(avgSentiment) : null,
        citation_rate: round2(citationRate),
        lvi_score: round2(lviScore),
        recommendation_rate: round2(recommendationRate),
        total_citations: citationStats.totalCitations,
        unique_citing_domains: citationStats.uniqueDomains,
        avg_competitive_density: round2(avgCompetitiveDensity),
        total_brand_mentions: totalBrandMentions,
        metric_version: METRIC_VERSION,
      })
    }

    return metrics
  }

  // ─── Prompt Metrics Computation ───────────────────────────

  private async computePromptMetrics(
    data: ResponseDataRow[],
    date: string,
    weightsMap: Map<string, LVIWeights>,
    allData: ResponseDataRow[]
  ): Promise<PromptMetrics[]> {
    // Group by prompt_id × brand_id
    const promptGroups = new Map<string, ResponseDataRow[]>()
    for (const row of data) {
      if (!row.prompt_id) continue
      const key = `${row.prompt_id}::${row.brand_id}`
      if (!promptGroups.has(key)) promptGroups.set(key, [])
      promptGroups.get(key)!.push(row)
    }

    const metrics: PromptMetrics[] = []

    for (const [, rows] of promptGroups) {
      const accountId = rows[0].account_id
      const brandId = rows[0].brand_id
      const promptId = rows[0].prompt_id!
      const weights = weightsMap.get(accountId) || DEFAULT_WEIGHTS

      const totalResponses = rows.length
      const mentionedRows = rows.filter(r => r.mentioned)

      // Visibility
      const visibilityRate = totalResponses > 0
        ? (mentionedRows.length / totalResponses) * 100
        : 0

      // SOV within this prompt — presence-based using competitive_density
      // Per response: 1/competitive_density if mentioned, 0 if not
      // Averaged across all responses for this prompt
      let sov: number | null = null
      if (totalResponses > 0) {
        let sovSum = 0
        for (const row of rows) {
          if (row.mentioned && row.competitive_density > 0) {
            sovSum += (1 / row.competitive_density) * 100
          }
        }
        sov = mentionedRows.length > 0 ? sovSum / totalResponses : null
      }

      // Avg Rank — include ALL responses, not just mentioned ones
      // Non-mentioned responses count as rank 10 (worst/last position)
      const PENALTY_RANK = 10
      const mentionedRanks = mentionedRows
        .map(r => r.brand_rank)
        .filter((r): r is number => r !== null && r > 0)
      const nonMentionedCount = totalResponses - mentionedRows.length
      let avgBrandRank: number | null = null
      if (mentionedRanks.length > 0) {
        const totalRankSum = mentionedRanks.reduce((a, b) => a + b, 0) + (nonMentionedCount * PENALTY_RANK)
        avgBrandRank = totalRankSum / totalResponses
      }

      // Avg Sentiment (null if never mentioned)
      const sentiments = mentionedRows
        .map(r => r.raw_sentiment)
        .filter((s): s is number => s !== null)
      const avgSentiment: number | null = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

      // Citation Rate
      const withCitation = mentionedRows.filter(r => r.citation_count > 0).length
      const citationRate = mentionedRows.length > 0
        ? (withCitation / mentionedRows.length) * 100
        : 0

      // LVI
      const lviScore = this.computeLVI(
        visibilityRate, avgBrandRank, citationRate, avgSentiment ?? 0, weights
      )

      // Model consistency — % of models that mentioned the brand
      const modelsRun = new Set(rows.map(r => r.model_name))
      const modelsMentioned = new Set(mentionedRows.map(r => r.model_name))
      const modelConsistency = modelsRun.size > 0
        ? (modelsMentioned.size / modelsRun.size) * 100
        : 0

      // Best performing model — highest mention count
      const modelMentionCounts = new Map<string, number>()
      for (const row of mentionedRows) {
        modelMentionCounts.set(
          row.model_name,
          (modelMentionCounts.get(row.model_name) || 0) + row.brand_mention_count
        )
      }
      const bestModel = modelMentionCounts.size > 0
        ? [...modelMentionCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : null

      // Avg word count
      const avgWordCount = rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.word_count, 0) / rows.length)
        : 0

      metrics.push({
        prompt_id: promptId,
        brand_id: brandId,
        account_id: accountId,
        run_date: date,
        total_responses: totalResponses,
        visibility_rate: round2(visibilityRate),
        share_of_voice: sov !== null ? round2(sov) : null,
        avg_brand_rank: avgBrandRank ? round2(avgBrandRank) : null,
        avg_sentiment: avgSentiment !== null ? round3(avgSentiment) : null,
        citation_rate: round2(citationRate),
        lvi_score: round2(lviScore),
        model_consistency: round2(modelConsistency),
        best_performing_model: bestModel,
        avg_response_word_count: avgWordCount,
        metric_version: METRIC_VERSION,
      })
    }

    return metrics
  }

  // ─── LVI Computation ─────────────────────────────────────

  /**
   * LVI = (visibility_rate × w_vis) + (normalised_rank × w_rank)
   *     + (citation_rate × w_cit) + (normalised_sentiment × w_sent)
   *
   * normalised_rank = max(0, (1 - (avg_rank - 1) / 9)) × 100
   *   rank 1 → 100, rank 10 → 0
   *
   * normalised_sentiment = ((avg_sentiment + 1) / 2) × 100
   *   -1 → 0, 0 → 50, +1 → 100
   */
  private computeLVI(
    visibilityRate: number,
    avgBrandRank: number | null,
    citationRate: number,
    avgSentiment: number,
    weights: LVIWeights
  ): number {
    // If brand was never mentioned, all components should be 0
    // (avoids giving invisible brands free points from neutral defaults)
    if (visibilityRate === 0) return 0

    const normRank = avgBrandRank !== null
      ? Math.max(0, (1 - (avgBrandRank - 1) / 9)) * 100
      : 0 // no rank data = 0 (not neutral 50)

    const normSentiment = ((avgSentiment + 1) / 2) * 100

    // Normalize weights to sum to 1.0 to guarantee LVI stays in 0-100
    const wSum = weights.visibility_weight + weights.rank_weight +
                 weights.citation_weight + weights.sentiment_weight
    const norm = wSum > 0 ? wSum : 1

    const raw = (
      visibilityRate * (weights.visibility_weight / norm) +
      normRank * (weights.rank_weight / norm) +
      citationRate * (weights.citation_weight / norm) +
      normSentiment * (weights.sentiment_weight / norm)
    )

    // Clamp to valid range
    return Math.max(0, Math.min(100, raw))
  }

  // ─── Model Metrics Computation ─────────────────────────────

  /**
   * Compute per-model metrics for each brand × model × date.
   * This enables platform-level comparison (ChatGPT vs Gemini vs Claude etc.)
   */
  private computeModelMetrics(
    data: ResponseDataRow[],
    date: string,
    weightsMap: Map<string, LVIWeights>,
    allData: ResponseDataRow[]
  ): ModelMetrics[] {
    // Group by brand_id × model_name
    const groups = new Map<string, ResponseDataRow[]>()
    for (const row of data) {
      const key = `${row.brand_id}::${row.model_name}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }

    const metrics: ModelMetrics[] = []

    for (const [, rows] of groups) {
      const brandId = rows[0].brand_id
      const accountId = rows[0].account_id
      const modelName = rows[0].model_name
      const weights = weightsMap.get(accountId) || DEFAULT_WEIGHTS

      const totalResponses = rows.length
      const mentionedRows = rows.filter(r => r.mentioned)
      const responsesWithMention = mentionedRows.length

      const visibilityRate = totalResponses > 0
        ? (responsesWithMention / totalResponses) * 100
        : 0

      // Avg Rank — include ALL responses, not just mentioned ones
      // Non-mentioned responses count as rank 10 (worst/last position)
      const PENALTY_RANK = 10
      const mentionedRanks = mentionedRows
        .map(r => r.brand_rank)
        .filter((r): r is number => r !== null && r > 0)
      const nonMentionedCount = totalResponses - responsesWithMention
      let avgBrandRank: number | null = null
      if (mentionedRanks.length > 0) {
        const totalRankSum = mentionedRanks.reduce((a, b) => a + b, 0) + (nonMentionedCount * PENALTY_RANK)
        avgBrandRank = totalRankSum / totalResponses
      }

      const sentiments = mentionedRows
        .map(r => r.raw_sentiment)
        .filter((s): s is number => s !== null)
      const avgSentiment: number | null = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

      const responsesWithCitation = mentionedRows.filter(r => r.citation_count > 0).length
      const citationRate = responsesWithMention > 0
        ? (responsesWithCitation / responsesWithMention) * 100
        : 0

      const recommendations = mentionedRows.filter(r => r.is_primary_recommendation).length
      const recommendationRate = totalResponses > 0
        ? (recommendations / totalResponses) * 100
        : 0

      const totalBrandMentions = mentionedRows.reduce((sum, r) => sum + r.brand_mention_count, 0)
      const totalCitations = mentionedRows.reduce((sum, r) => sum + r.citation_count, 0)

      // SOV within this model — presence-based using competitive_density
      // Per response: 1/competitive_density if mentioned, 0 if not
      // Averaged across all responses for this model
      let sov: number | null = null
      if (totalResponses > 0) {
        let sovSum = 0
        for (const row of rows) {
          if (row.mentioned && row.competitive_density > 0) {
            sovSum += (1 / row.competitive_density) * 100
          }
        }
        sov = mentionedRows.length > 0 ? sovSum / totalResponses : null
      }

      const lviScore = this.computeLVI(
        visibilityRate, avgBrandRank, citationRate, avgSentiment ?? 0, weights
      )

      metrics.push({
        brand_id: brandId,
        account_id: accountId,
        model_name: modelName,
        run_date: date,
        total_responses: totalResponses,
        responses_with_mention: responsesWithMention,
        visibility_rate: round2(visibilityRate),
        citation_rate: round2(citationRate),
        recommendation_rate: round2(recommendationRate),
        avg_brand_rank: avgBrandRank ? round2(avgBrandRank) : null,
        avg_sentiment: avgSentiment !== null ? round3(avgSentiment) : null,
        lvi_score: round2(lviScore),
        share_of_voice: sov !== null ? round2(sov) : null,
        total_citations: totalCitations,
        total_brand_mentions: totalBrandMentions,
        metric_version: METRIC_VERSION,
      })
    }

    return metrics
  }

  // ─── Competitor Metrics Computation ────────────────────────

  /**
   * Compute daily metrics for each competitor from response_data rows
   * where competitor_id IS NOT NULL. Groups by competitor_id.
   */
  private computeCompetitorMetrics(
    data: ResponseDataRow[],
    date: string,
    weightsMap: Map<string, LVIWeights>,
    allData: ResponseDataRow[]
  ): CompetitorMetrics[] {
    // Group by competitor_id
    const groups = new Map<string, ResponseDataRow[]>()
    for (const row of data) {
      if (!row.competitor_id) continue
      if (!groups.has(row.competitor_id)) groups.set(row.competitor_id, [])
      groups.get(row.competitor_id)!.push(row)
    }

    const metrics: CompetitorMetrics[] = []

    for (const [competitorId, rows] of groups) {
      const brandId = rows[0].brand_id
      const accountId = rows[0].account_id
      const weights = weightsMap.get(accountId) || DEFAULT_WEIGHTS

      const totalResponses = rows.length
      const mentionedRows = rows.filter(r => r.mentioned)
      const responsesWithMention = mentionedRows.length

      const visibilityRate = totalResponses > 0
        ? (responsesWithMention / totalResponses) * 100
        : 0

      // Avg Rank — include ALL responses, not just mentioned ones
      // Non-mentioned responses count as rank 10 (worst/last position)
      const PENALTY_RANK = 10
      const mentionedRanks = mentionedRows
        .map(r => r.brand_rank)
        .filter((r): r is number => r !== null && r > 0)
      const nonMentionedCount = totalResponses - responsesWithMention
      let avgBrandRank: number | null = null
      if (mentionedRanks.length > 0) {
        const totalRankSum = mentionedRanks.reduce((a, b) => a + b, 0) + (nonMentionedCount * PENALTY_RANK)
        avgBrandRank = totalRankSum / totalResponses
      }

      const sentiments = mentionedRows
        .map(r => r.raw_sentiment)
        .filter((s): s is number => s !== null)
      const avgSentiment: number | null = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

      const responsesWithCitation = mentionedRows.filter(r => r.citation_count > 0).length
      const citationRate = responsesWithMention > 0
        ? (responsesWithCitation / responsesWithMention) * 100
        : 0

      const recommendations = mentionedRows.filter(r => r.is_primary_recommendation).length
      const recommendationRate = totalResponses > 0
        ? (recommendations / totalResponses) * 100
        : 0

      const totalBrandMentions = mentionedRows.reduce((sum, r) => sum + r.brand_mention_count, 0)
      const totalCitations = mentionedRows.reduce((sum, r) => sum + r.citation_count, 0)

      // SOV — presence-based using competitive_density
      // Per response: 1/competitive_density if mentioned, 0 if not
      // Averaged across all responses for this competitor
      let sov: number | null = null
      if (totalResponses > 0) {
        let sovSum = 0
        for (const row of rows) {
          if (row.mentioned && row.competitive_density > 0) {
            sovSum += (1 / row.competitive_density) * 100
          }
        }
        sov = mentionedRows.length > 0 ? sovSum / totalResponses : null
      }

      const lviScore = this.computeLVI(
        visibilityRate, avgBrandRank, citationRate, avgSentiment ?? 0, weights
      )

      // Resolve competitor name from first row's co_mentioned_brands or use 'Unknown'
      // The actual name will come from the competitors table but we can grab it from the row
      const competitorName = '' // populated from DB during storage

      metrics.push({
        competitor_id: competitorId,
        brand_id: brandId,
        account_id: accountId,
        competitor_name: competitorName,
        run_date: date,
        total_responses: totalResponses,
        responses_with_mention: responsesWithMention,
        visibility_rate: round2(visibilityRate),
        citation_rate: round2(citationRate),
        recommendation_rate: round2(recommendationRate),
        avg_brand_rank: avgBrandRank ? round2(avgBrandRank) : null,
        avg_sentiment: avgSentiment !== null ? round3(avgSentiment) : null,
        lvi_score: round2(lviScore),
        share_of_voice: sov !== null ? round2(sov) : null,
        total_citations: totalCitations,
        total_brand_mentions: totalBrandMentions,
        metric_version: METRIC_VERSION,
      })
    }

    return metrics
  }

  // ─── Citation Stats ───────────────────────────────────────

  /**
   * Batch-load citation stats for ALL brands in a single query.
   * Returns a Map<brandId, { totalCitations, uniqueDomains }>.
   */
  private async batchLoadCitationStats(
    brandIds: string[],
    accountIds: string[],
    date: string
  ): Promise<Map<string, { totalCitations: number; uniqueDomains: number }>> {
    const result = new Map<string, { totalCitations: number; uniqueDomains: number }>()

    if (brandIds.length === 0) return result

    const citBounds = getUTCBoundsForDate(date, this.timezone)
    const { data, error } = await this.supabase
      .from('aeo_citations')
      .select('benefits_brand_id, domain')
      .in('account_id', accountIds)
      .in('benefits_brand_id', brandIds)
      .gte('created_at', citBounds.start)
      .lt('created_at', citBounds.end)

    if (error || !data) {
      if (error) console.error('[Aggregator] Batch citation stats error:', error)
      return result
    }

    // Group by brand_id
    const grouped = new Map<string, string[]>()
    for (const row of data) {
      if (!row.benefits_brand_id) continue
      if (!grouped.has(row.benefits_brand_id)) grouped.set(row.benefits_brand_id, [])
      grouped.get(row.benefits_brand_id)!.push(row.domain)
    }

    for (const [brandId, domains] of grouped) {
      result.set(brandId, {
        totalCitations: domains.length,
        uniqueDomains: new Set(domains).size,
      })
    }

    return result
  }

  private async loadCitationStats(
    brandId: string,
    accountId: string,
    date: string
  ): Promise<{ totalCitations: number; uniqueDomains: number }> {
    // Get citations for responses that belong to this brand on this date
    const singleCitBounds = getUTCBoundsForDate(date, this.timezone)
    const { data, error } = await this.supabase
      .from('aeo_citations')
      .select('domain')
      .eq('account_id', accountId)
      .eq('benefits_brand_id', brandId)
      .gte('created_at', singleCitBounds.start)
      .lt('created_at', singleCitBounds.end)

    if (error || !data) {
      return { totalCitations: 0, uniqueDomains: 0 }
    }

    return {
      totalCitations: data.length,
      uniqueDomains: new Set(data.map(d => d.domain)).size,
    }
  }

  // ─── Storage ──────────────────────────────────────────────

  private async storeBrandMetrics(metrics: BrandMetrics[]): Promise<void> {
    if (metrics.length === 0) return

    const { error } = await this.supabase
      .from('daily_brand_metrics')
      .upsert(metrics, { onConflict: 'brand_id,run_date' })

    if (error) {
      console.error('[Aggregator] Error storing brand metrics:', error)
      throw new Error(`Failed to store daily_brand_metrics: ${error.message}`)
    }
  }

  private async storePromptMetrics(metrics: PromptMetrics[]): Promise<void> {
    if (metrics.length === 0) return

    // Batch upsert (500 at a time)
    for (let i = 0; i < metrics.length; i += 500) {
      const batch = metrics.slice(i, i + 500)
      const { error } = await this.supabase
        .from('daily_prompt_metrics')
        .upsert(batch, { onConflict: 'prompt_id,brand_id,run_date' })

      if (error) {
        console.error('[Aggregator] Error storing prompt metrics batch:', error)
        throw new Error(`Failed to store daily_prompt_metrics: ${error.message}`)
      }
    }
  }

  private async storeModelMetrics(metrics: ModelMetrics[]): Promise<void> {
    if (metrics.length === 0) return

    for (let i = 0; i < metrics.length; i += 500) {
      const batch = metrics.slice(i, i + 500)
      const { error } = await this.supabase
        .from('daily_model_metrics')
        .upsert(batch, { onConflict: 'brand_id,model_name,run_date' })

      if (error) {
        console.error('[Aggregator] Error storing model metrics batch:', error)
        throw new Error(`Failed to store daily_model_metrics: ${error.message}`)
      }
    }
  }

  private async storeCompetitorMetrics(metrics: CompetitorMetrics[]): Promise<void> {
    if (metrics.length === 0) return

    // Resolve competitor names from the competitors table
    const competitorIds = [...new Set(metrics.map(m => m.competitor_id))]
    const { data: competitors } = await this.supabase
      .from('competitors')
      .select('id, competitor_name')
      .in('id', competitorIds)

    const nameMap = new Map<string, string>()
    if (competitors) {
      for (const c of competitors) nameMap.set(c.id, c.competitor_name)
    }

    // Fill in competitor names
    for (const m of metrics) {
      m.competitor_name = nameMap.get(m.competitor_id) || 'Unknown'
    }

    for (let i = 0; i < metrics.length; i += 500) {
      const batch = metrics.slice(i, i + 500)
      const { error } = await this.supabase
        .from('daily_competitor_metrics')
        .upsert(batch, { onConflict: 'competitor_id,run_date' })

      if (error) {
        console.error('[Aggregator] Error storing competitor metrics batch:', error)
        throw new Error(`Failed to store daily_competitor_metrics: ${error.message}`)
      }
    }
  }

  /**
   * Update domain running totals (total_citations, last_cited_at).
   * Runs once per aggregation — updates all domains that have citations.
   */
  private async updateDomainStats(): Promise<void> {
    try {
      // Get citation counts grouped by domain_id
      const { data: stats, error } = await this.supabase
        .from('aeo_citations')
        .select('domain_id, created_at')
        .not('domain_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error || !stats || stats.length === 0) return

      // Group by domain_id
      const grouped = new Map<string, { count: number; lastCited: string }>()
      for (const row of stats) {
        if (!row.domain_id) continue
        const existing = grouped.get(row.domain_id)
        if (!existing) {
          grouped.set(row.domain_id, { count: 1, lastCited: row.created_at })
        } else {
          existing.count++
        }
      }

      // Batch update domains (50 at a time)
      const entries = [...grouped.entries()]
      for (let i = 0; i < entries.length; i += 50) {
        const batch = entries.slice(i, i + 50)
        await Promise.all(batch.map(([domainId, info]) =>
          this.supabase
            .from('domains')
            .update({
              total_citations: info.count,
              last_cited_at: info.lastCited,
              updated_at: new Date().toISOString(),
            })
            .eq('id', domainId)
        ))
      }

      console.log(`[Aggregator] Updated stats for ${grouped.size} domains`)
    } catch (err) {
      // Non-fatal: domain stats are denormalized convenience data
      console.error('[Aggregator] Error updating domain stats:', err)
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}
