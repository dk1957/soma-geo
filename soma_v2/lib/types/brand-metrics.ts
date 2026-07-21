/**
 * Brand Metrics API Types
 * =======================
 * 
 * TypeScript types for the brand metrics system.
 * These types match the database schema and API responses.
 */

// =====================================================
// Core Score Types
// =====================================================

/**
 * The 5 key metrics + LVI composite score
 */
export interface BrandScores {
  /** 0-100: percentage of responses mentioning the brand */
  visibility_score: number
  /** 0-100: percentage of mentioned responses with citations */
  citation_rate: number
  /** -1 to 1: sentiment towards the brand */
  sentiment_score: number
  /** 0-100: normalized position score (100 = rank 1, 0 = rank 10+) */
  position_score: number
  /** 0-100: average share per response (1/competitive_density if mentioned, 0 if not) */
  share_of_voice: number
  /** 0-100: LVI composite score */
  lvi_score: number
}

/**
 * Extended scores with trends
 */
export interface BrandScoresWithTrends extends BrandScores {
  /** Change in LVI from previous period */
  lvi_change: number | null
  /** Change in visibility from previous period */
  visibility_change: number | null
  /** Change in sentiment from previous period */
  sentiment_change: number | null
  /** Trend direction for LVI */
  lvi_trend?: 'up' | 'down' | 'stable' | 'new'
  /** Trend direction for visibility */
  visibility_trend?: 'up' | 'down' | 'stable' | 'new'
  /** Trend direction for sentiment */
  sentiment_trend?: 'up' | 'down' | 'stable' | 'new'
}

// =====================================================
// Metric Data Types
// =====================================================

/**
 * Daily brand metrics for a specific model
 */
export interface DailyBrandMetrics {
  period_date: string
  entity_id: string
  brand_name: string
  is_primary_brand: boolean
  model_name: string
  
  // Counts
  total_responses: number
  total_analyses: number
  mention_count: number
  citation_count: number
  
  // Scores
  visibility_score: number
  citation_rate: number
  sentiment_score: number | null
  position_score: number | null
  share_of_voice: number
  lvi_score: number
  
  // Additional metrics
  avg_raw_position: number | null
  positive_sentiment_count: number
  negative_sentiment_count: number
  
  // Changes
  lvi_change: number | null
  visibility_change: number | null
  sentiment_change: number | null

  // Moving averages (computed in query layer, not stored)
  lvi_ma7?: number | null
  lvi_ma30?: number | null
}

/**
 * Brand summary with latest metrics and trends
 */
export interface BrandMetricsSummary {
  brand_name: string
  is_primary_brand: boolean
  entity_id: string
  
  // Latest scores
  lvi_score: number
  visibility_score: number
  citation_rate: number
  sentiment_score: number | null
  position_score: number | null
  share_of_voice: number
  
  // Trends
  lvi_trend: 'up' | 'down' | 'stable' | 'new'
  lvi_change: number
  visibility_trend: 'up' | 'down' | 'stable' | 'new'
  sentiment_trend: 'up' | 'down' | 'stable' | 'new'

  // Moving averages
  lvi_ma7?: number | null
  lvi_ma30?: number | null
  trend_momentum?: number | null // linear regression slope over recent LVI values
  
  // Counts
  total_responses: number
  mention_count: number
  citation_count: number
  
  last_analyzed: string
}

/**
 * Model comparison data
 */
export interface ModelComparison {
  model_name: string
  brand_name: string
  is_primary_brand: boolean
  total_responses: number
  avg_lvi_score: number
  avg_visibility_score: number
  avg_citation_rate: number
  avg_sentiment_score: number | null
  avg_position_score: number | null
  avg_share_of_voice: number
  mention_count: number
  citation_count: number
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Query parameters for metrics API
 */
export interface MetricsQueryParams {
  /** Primary brand ID (required) */
  brand_id: string
  /** Start date (YYYY-MM-DD) */
  start_date?: string
  /** End date (YYYY-MM-DD) */
  end_date?: string
  /** Filter by specific model */
  model?: string
  /** Time aggregation: 'daily' | 'weekly' | 'monthly' | 'all' */
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'all'
  /** Brand filter: 'all' | 'primary' | 'competitors' | specific brand name */
  brand_filter?: string
}

/**
 * Response from /api/v1/metrics/summary
 */
export interface MetricsSummaryResponse {
  success: boolean
  data: {
    primary_brand: BrandMetricsSummary
    competitors: BrandMetricsSummary[]
    last_updated: string
  }
}

/**
 * Response from /api/v1/metrics/timeseries
 */
export interface MetricsTimeseriesResponse {
  success: boolean
  data: {
    metrics: DailyBrandMetrics[]
    period: {
      start_date: string
      end_date: string
      aggregation: string
    }
  }
}

/**
 * Response from /api/v1/metrics/models
 */
export interface MetricsModelComparisonResponse {
  success: boolean
  data: {
    comparisons: ModelComparison[]
    models: string[]
  }
}

/**
 * Combined dashboard response
 */
export interface MetricsDashboardResponse {
  success: boolean
  data: {
    summary: {
      primary_brand: BrandMetricsSummary
      competitors: BrandMetricsSummary[]
    }
    trends: DailyBrandMetrics[]
    model_comparison: ModelComparison[]
    metadata: {
      total_responses: number
      total_prompts: number
      date_range: {
        start: string
        end: string
      }
      models_analyzed: string[]
      last_updated: string
    }
  }
}

// =====================================================
// Chart Data Types
// =====================================================

/**
 * Data point for LVI trend chart
 */
export interface LVITrendDataPoint {
  date: string
  lvi: number
  visibility: number
  citation: number
  sentiment: number
  position: number
}

/**
 * Data for brand comparison chart
 */
export interface BrandComparisonData {
  brand_name: string
  is_primary: boolean
  lvi_score: number
  share_of_voice: number
  sentiment_score: number
  mention_count: number
}

/**
 * Data for model performance chart
 */
export interface ModelPerformanceData {
  model_name: string
  lvi_score: number
  visibility_score: number
  citation_rate: number
  sentiment_score: number
}

// =====================================================
// Utility Types
// =====================================================

export type AggregationType = 'daily' | 'weekly' | 'monthly' | 'all'
export type TrendDirection = 'up' | 'down' | 'stable' | 'new'
export type BrandFilterType = 'all' | 'primary' | 'competitors' | string

/**
 * Score thresholds for categorization
 */
export const SCORE_THRESHOLDS = {
  lvi: {
    excellent: 70,
    good: 40,
    poor: 0
  },
  visibility: {
    excellent: 0.8,
    good: 0.5,
    poor: 0
  },
  sentiment: {
    positive: 0.2,
    neutral: -0.2,
    negative: -1
  },
  position: {
    excellent: 0.8,  // Top 20%
    good: 0.5,       // Top 50%
    poor: 0
  }
} as const

/**
 * Get rating category for a score
 */
export function getScoreRating(
  score: number,
  metric: keyof typeof SCORE_THRESHOLDS
): 'excellent' | 'good' | 'poor' {
  const thresholds = SCORE_THRESHOLDS[metric]
  if (score >= thresholds.excellent) return 'excellent'
  if (score >= thresholds.good) return 'good'
  return 'poor'
}

/**
 * Get sentiment category
 */
export function getSentimentCategory(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= SCORE_THRESHOLDS.sentiment.positive) return 'positive'
  if (score >= SCORE_THRESHOLDS.sentiment.neutral) return 'neutral'
  return 'negative'
}
