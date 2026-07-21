/**
 * Canonical Analytics Types
 * =========================
 * 
 * Single source of truth for all analytics data shapes.
 * These types map 1:1 to the database tables and API responses.
 * 
 * Table mapping:
 * - DailyBrandMetricsRow → daily_brand_metrics
 * - DailyPromptMetricsRow → daily_prompt_metrics
 * - DailyModelMetricsRow → daily_model_metrics
 * - ResponseDataRow → response_data
 * - AEOCitationRow → aeo_citations
 * - DomainRow → domains
 * - TopicRow → topics
 */

// ============================================================================
// Database Row Types (match DB columns exactly)
// ============================================================================

/** daily_brand_metrics — one row per brand × run_date */
export interface DailyBrandMetricsRow {
  id: string
  brand_id: string
  account_id: string
  run_date: string         // DATE as ISO string (YYYY-MM-DD)
  total_responses: number
  responses_with_mention: number
  total_models_run: number
  visibility_rate: number  // 0-100
  share_of_voice: number   // 0-100
  avg_brand_rank: number | null
  avg_sentiment: number    // -1 to 1
  citation_rate: number    // 0-100
  lvi_score: number        // 0-100
  recommendation_rate: number // 0-100
  total_citations: number
  unique_citing_domains: number
  avg_competitive_density: number
  total_brand_mentions: number
  metric_version: number
  created_at: string
  updated_at: string
}

/** daily_prompt_metrics — one row per prompt × brand × run_date */
export interface DailyPromptMetricsRow {
  id: string
  prompt_id: string
  brand_id: string
  account_id: string
  run_date: string
  total_responses: number
  visibility_rate: number
  share_of_voice: number
  avg_brand_rank: number | null
  avg_sentiment: number
  citation_rate: number
  lvi_score: number
  model_consistency: number
  best_performing_model: string | null
  avg_response_word_count: number
  metric_version: number
  created_at: string
  updated_at: string
}

/** daily_model_metrics — one row per brand × model × run_date */
export interface DailyModelMetricsRow {
  id: string
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
  share_of_voice: number
  total_citations: number
  total_brand_mentions: number
  metric_version: number
  created_at: string
  updated_at: string
}

/** response_data — one row per brand × response (Layer 2 fact) */
export interface ResponseDataRow {
  id: string
  response_id: string
  brand_id: string
  account_id: string
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
  created_at: string
}

/** aeo_citations — one row per cited source × response */
export interface AEOCitationRow {
  id: string
  response_id: string
  account_id: string
  domain_id: string | null
  domain: string
  url: string | null
  page_title: string | null
  anchor_text: string | null
  citation_rank: number | null
  times_referenced: number
  source_type: string       // owned, earned, competitor, news, etc.
  content_category: string
  benefits_brand_id: string | null
  is_competitor_source: boolean
  domain_authority: number | null
  is_high_authority: boolean
  created_at: string
}

/** domains — canonical domain registry */
export interface DomainRow {
  id: string
  domain: string
  display_name: string | null
  source_type: string | null
  content_category: string | null
  domain_authority: number | null
  is_high_authority: boolean
  is_known_aggregator: boolean
  is_social_platform: boolean
  total_citations: number
  first_seen_at: string
  last_cited_at: string | null
  created_at: string
  updated_at: string
}

/** topics — extracted topic per response */
export interface TopicRow {
  id: string
  response_id: string
  account_id: string
  name: string
  category: string | null
  relevance: number
  sentiment: number
  created_at: string
}

// ============================================================================
// API Response Types (what the frontend receives)
// ============================================================================

/** Common auth context resolved on every analytics request */
export interface AnalyticsContext {
  clerkUserId: string
  accountId: string
  brandId: string
  brandName: string
}

/** KPI overview — top-level dashboard cards */
export interface KPIOverview {
  lvi_score: number
  lvi_change: number
  visibility_rate: number
  visibility_change: number
  share_of_voice: number
  sov_change: number
  avg_sentiment: number
  sentiment_change: number
  citation_rate: number
  citation_change: number
  recommendation_rate: number
  recommendation_change: number
  total_responses: number
  total_mentions: number
  total_citations: number
  models_tracked: number
  prompts_monitored: number
  data_points: number
}

/** Model-level performance for platform comparison */
export interface ModelPerformance {
  model_name: string
  display_name: string
  total_responses: number
  visibility_rate: number
  lvi_score: number
  avg_sentiment: number
  citation_rate: number
  share_of_voice: number
  avg_brand_rank: number | null
  recommendation_rate: number
  trend: TrendDirection
  lvi_change: number
}

/** Platform ranking entry (per AI engine) */
export interface PlatformRanking {
  platform: string          // ChatGPT, Claude, Gemini, Perplexity, etc.
  display_name: string
  lvi_score: number
  visibility_rate: number
  citation_rate: number
  avg_sentiment: number
  share_of_voice: number
  total_responses: number
  trend: TrendDirection
  change: number
}

/** Timeseries data point for charts */
export interface TimeseriesPoint {
  date: string              // YYYY-MM-DD
  lvi_score: number
  visibility_rate: number
  citation_rate: number
  avg_sentiment: number
  share_of_voice: number
  recommendation_rate: number
  total_responses: number
  total_mentions: number
  total_citations: number
}

/** Competitor summary for benchmarking */
export interface CompetitorBenchmark {
  brand_id: string
  brand_name: string
  lvi_score: number
  visibility_rate: number
  citation_rate: number
  avg_sentiment: number
  share_of_voice: number
  lvi_change: number
  trend: TrendDirection
}

/** Mention entry for the mentions feed */
export interface MentionEntry {
  response_id: string
  prompt_text: string
  model_name: string
  brand_rank: number | null
  sentiment: number | null
  citation_count: number
  co_mentioned_brands: string[]
  is_primary_recommendation: boolean
  response_date: string
  word_count: number
}

/** Citation domain aggregate */
export interface CitationDomainSummary {
  domain: string
  source_type: string
  content_category: string
  total_citations: number
  unique_responses: number
  is_high_authority: boolean
  avg_citation_rank: number | null
  top_urls: Array<{ url: string; title: string | null; count: number }>
}

/** Data export metadata */
export interface DataExportRequest {
  export_type: 'brand_metrics' | 'prompt_metrics' | 'model_metrics' | 'citations' | 'responses' | 'full'
  format: 'csv' | 'json'
  brand_id: string
  start_date?: string
  end_date?: string
  models?: string[]
}

/** Data export column definition for BI documentation */
export interface DataDictionary {
  table_name: string
  description: string
  columns: Array<{
    name: string
    type: string
    description: string
    example: string
  }>
}

// ============================================================================
// Utility Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'stable' | 'new'
export type MetricPeriod = '7d' | '30d' | '90d' | 'all'

/** Maps model_name from DB to human-readable display name */
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'gpt-4o': 'ChatGPT',
  'gpt-4o-mini': 'ChatGPT',
  'gpt-4-turbo': 'ChatGPT',
  'openai/gpt-4o': 'ChatGPT',
  'openai/gpt-4o-mini': 'ChatGPT',
  'openai/gpt-4o-mini:online': 'ChatGPT',
  'claude-3.5-sonnet': 'Claude',
  'claude-3-sonnet': 'Claude',
  'anthropic/claude-3.5-sonnet': 'Claude',
  'anthropic/claude-sonnet-4': 'Claude',
  'gemini-2.0-flash': 'Gemini',
  'gemini-1.5-pro': 'Gemini',
  'gemini-2.5-flash': 'Gemini',
  'google/gemini-2.0-flash-001': 'Gemini',
  'google/gemini-2.0-flash-exp:free': 'Gemini',
  'google/gemini-2.5-flash:online': 'Gemini',
  'perplexity/sonar-pro': 'Perplexity',
  'perplexity/sonar': 'Perplexity',
  'meta-llama/llama-3.3-70b-instruct': 'Meta AI',
  'meta-llama/llama-4-8b-instruct:online': 'Meta AI',
  'x-ai/grok-3-mini-beta': 'Grok',
  'x-ai/grok-3-mini:online': 'Grok',
  'x-ai/grok-2-1212': 'Grok',
}

/** Normalize model_name to platform name */
export function getModelPlatform(modelName: string): string {
  return MODEL_DISPLAY_NAMES[modelName] || modelName.split('/').pop()?.split('-')[0] || modelName
}

/** Compute trend direction from current vs previous */
export function computeTrend(current: number | null | undefined, previous: number | null | undefined): TrendDirection {
  if (current == null || previous == null) return 'new'
  const diff = Number(current) - Number(previous)
  if (diff > 0.01) return 'up'
  if (diff < -0.01) return 'down'
  return 'stable'
}

/** Compute change between two values */
export function computeChange(current: number | null | undefined, previous: number | null | undefined): number {
  if (current == null || previous == null) return 0
  return Math.round((Number(current) - Number(previous)) * 100) / 100
}

/** Period to start date */
export function periodToStartDate(period: MetricPeriod): string {
  const d = new Date()
  switch (period) {
    case '7d': d.setDate(d.getDate() - 7); break
    case '30d': d.setDate(d.getDate() - 30); break
    case '90d': d.setDate(d.getDate() - 90); break
    default: d.setFullYear(d.getFullYear() - 10)
  }
  return d.toISOString().split('T')[0]
}
