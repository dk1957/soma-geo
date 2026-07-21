-- Migration: Fix Materialized Views for Correct Brand Grouping
-- Date: 2025-11-29
-- Description: Fixes the daily_brand_metrics, topic_brand_matrix, and source_citation_analysis
--              materialized views to properly group by unique brand identifier (competitor_id for
--              competitors, primary_brand_id for primary brand) instead of just brand_id.
--              Also adds LVI score calculation to daily_brand_metrics.

-- ============================================================================
-- CLEANUP: Drop orphaned tables and broken functions
-- ============================================================================

-- These tables were never populated and are replaced by materialized views
DROP TABLE IF EXISTS daily_topic_analysis CASCADE;
DROP TABLE IF EXISTS daily_source_citations CASCADE;

-- These functions reference non-existent columns in the current schema
DROP FUNCTION IF EXISTS calculate_daily_brand_metrics(date, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_daily_competitor_metrics(date, uuid, uuid) CASCADE;

-- ============================================================================
-- MATERIALIZED VIEW: daily_brand_metrics
-- ============================================================================
-- Provides daily aggregated metrics for each brand (primary and competitors)
-- Includes LVI Score calculation using the formula:
--   (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2)

DROP MATERIALIZED VIEW IF EXISTS daily_brand_metrics CASCADE;

CREATE MATERIALIZED VIEW daily_brand_metrics AS
WITH brand_metrics AS (
  SELECT 
    -- Unique identifier: use competitor_id for competitors, primary_brand_id for primary brand
    COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
    ra.primary_brand_id,
    ra.competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    ra.account_id,
    DATE(ra.analyzed_at) as metric_date,
    
    -- Response counts
    COUNT(DISTINCT ra.response_id) as total_responses,
    COUNT(DISTINCT ra.prompt_id) as total_prompts,
    COUNT(DISTINCT ra.model_name) as total_models,
    
    -- Mention metrics
    COUNT(*) FILTER (WHERE ra.brand_mentioned) as mention_count,
    ROUND(
      COUNT(*) FILTER (WHERE ra.brand_mentioned)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 
      2
    ) as mention_rate,
    
    -- Position metrics (only when mentioned)
    ROUND(AVG(ra.brand_first_position) FILTER (WHERE ra.brand_mentioned AND ra.brand_first_position IS NOT NULL), 2) as avg_position,
    COUNT(*) FILTER (WHERE ra.brand_first_position = 1) as first_position_count,
    COUNT(*) FILTER (WHERE ra.brand_first_position IS NOT NULL AND ra.brand_first_position <= 3) as top_3_count,
    COUNT(*) FILTER (WHERE ra.brand_first_position IS NOT NULL AND ra.brand_first_position <= 5) as top_5_count,
    MIN(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL) as best_position,
    MAX(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL) as worst_position,
    
    -- Sentiment metrics (only when mentioned)
    ROUND(AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned), 3) as avg_sentiment,
    COUNT(*) FILTER (WHERE ra.sentiment_category = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE ra.sentiment_category = 'neutral') as neutral_count,
    COUNT(*) FILTER (WHERE ra.sentiment_category = 'negative') as negative_count,
    
    -- Citation metrics
    COUNT(*) FILTER (WHERE ra.brand_cited) as citation_count,
    ROUND(
      COUNT(*) FILTER (WHERE ra.brand_cited)::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE ra.brand_mentioned), 0)::numeric * 100, 
      2
    ) as citation_rate,
    SUM(COALESCE(ra.brand_citation_count, 0)) as total_citations,
    
    -- Share of voice (only when mentioned)
    ROUND(AVG(ra.share_of_voice) FILTER (WHERE ra.brand_mentioned), 2) as avg_share_of_voice,
    
    -- Factual accuracy metrics
    ROUND(AVG(ra.factual_accuracy_rate) FILTER (WHERE ra.factual_claims_made > 0), 2) as avg_factual_accuracy,
    SUM(COALESCE(ra.factual_claims_made, 0)) as total_factual_claims,
    SUM(COALESCE(ra.factual_claims_correct, 0)) as correct_factual_claims,
    
    -- Response quality
    ROUND(AVG(ra.response_completeness), 2) as avg_completeness,
    ROUND(AVG(ra.response_word_count), 0)::integer as avg_word_count,
    
    -- Calculated LVI Score using the formula: (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2)
    ROUND(
      (
        -- Visibility component (mention_rate * 0.3)
        (COALESCE(COUNT(*) FILTER (WHERE ra.brand_mentioned)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 0) * 0.3) +
        -- Citation component (citation_rate * 0.3)
        (COALESCE(COUNT(*) FILTER (WHERE ra.brand_cited)::numeric / NULLIF(COUNT(*) FILTER (WHERE ra.brand_mentioned), 0)::numeric * 100, 0) * 0.3) +
        -- Sentiment component (normalized 0-100 * 0.2)
        (((COALESCE(AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned), 0) + 1) / 2 * 100) * 0.2) +
        -- Position component (inverted, lower is better * 0.2)
        (CASE 
          WHEN AVG(ra.brand_first_position) FILTER (WHERE ra.brand_mentioned AND ra.brand_first_position IS NOT NULL) IS NULL THEN 0
          WHEN AVG(ra.brand_first_position) FILTER (WHERE ra.brand_mentioned AND ra.brand_first_position IS NOT NULL) <= 1 THEN 100
          WHEN AVG(ra.brand_first_position) FILTER (WHERE ra.brand_mentioned AND ra.brand_first_position IS NOT NULL) >= 20 THEN 0
          ELSE 100 - ((AVG(ra.brand_first_position) FILTER (WHERE ra.brand_mentioned AND ra.brand_first_position IS NOT NULL) - 1) * 5.26)
        END * 0.2)
      ),
      2
    ) as lvi_score,
    
    MAX(ra.analyzed_at) as last_updated,
    NOW() as materialized_at
    
  FROM response_analysis ra
  GROUP BY 
    COALESCE(ra.competitor_id, ra.primary_brand_id),
    ra.primary_brand_id,
    ra.competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    ra.account_id,
    DATE(ra.analyzed_at)
)
SELECT * FROM brand_metrics
ORDER BY metric_date DESC, is_primary_brand DESC, brand_name;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON daily_brand_metrics (unique_brand_id, metric_date, account_id);

-- Grant permissions
GRANT SELECT ON daily_brand_metrics TO authenticated, service_role, anon;

-- ============================================================================
-- MATERIALIZED VIEW: topic_brand_matrix
-- ============================================================================
-- Shows topic associations for each brand extracted from response analysis

DROP MATERIALIZED VIEW IF EXISTS topic_brand_matrix CASCADE;

CREATE MATERIALIZED VIEW topic_brand_matrix AS
SELECT 
  COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  topic.value->>'name' as topic_name,
  topic.value->>'category' as topic_category,
  '30d' as period,
  COUNT(*) as mention_count,
  ROUND(AVG((topic.value->>'relevance')::numeric), 3) as avg_relevance,
  ROUND(AVG((topic.value->>'sentiment')::numeric), 3) as avg_sentiment,
  ROUND(
    COUNT(*)::numeric / 
    NULLIF((
      SELECT COUNT(*) FROM response_analysis ra2 
      WHERE COALESCE(ra2.competitor_id, ra2.primary_brand_id) = COALESCE(ra.competitor_id, ra.primary_brand_id)
        AND ra2.analyzed_at >= NOW() - INTERVAL '30 days'
    ), 0)::numeric * 100, 
    2
  ) as occurrence_rate,
  MAX(ra.analyzed_at) as last_seen,
  NOW() as materialized_at
FROM response_analysis ra
CROSS JOIN LATERAL jsonb_array_elements(ra.topics_covered) topic(value)
WHERE ra.analyzed_at >= NOW() - INTERVAL '30 days'
  AND ra.brand_mentioned = true
GROUP BY 
  COALESCE(ra.competitor_id, ra.primary_brand_id),
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  topic.value->>'name',
  topic.value->>'category';

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON topic_brand_matrix (unique_brand_id, topic_name, account_id);

-- Grant permissions
GRANT SELECT ON topic_brand_matrix TO authenticated, service_role, anon;

-- ============================================================================
-- MATERIALIZED VIEW: source_citation_analysis
-- ============================================================================
-- Shows source citation patterns for each brand

DROP MATERIALIZED VIEW IF EXISTS source_citation_analysis CASCADE;

CREATE MATERIALIZED VIEW source_citation_analysis AS
SELECT 
  COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  source.value->>'domain' as source_domain,
  source.value->>'type' as source_type,
  '30d' as period,
  COUNT(*) as citation_count,
  COUNT(DISTINCT ra.response_id) as responses_citing,
  ROUND(
    COUNT(DISTINCT ra.response_id)::numeric / 
    NULLIF((
      SELECT COUNT(DISTINCT ra2.response_id) FROM response_analysis ra2 
      WHERE COALESCE(ra2.competitor_id, ra2.primary_brand_id) = COALESCE(ra.competitor_id, ra.primary_brand_id)
        AND ra2.analyzed_at >= NOW() - INTERVAL '30 days'
    ), 0)::numeric * 100, 
    2
  ) as usage_frequency,
  ROUND(AVG((source.value->>'position')::integer), 2) as avg_citation_position,
  COUNT(*) FILTER (WHERE (source.value->>'position')::integer = 1) as first_citation_count,
  array_agg(DISTINCT source.value->>'context') FILTER (WHERE source.value->>'context' IS NOT NULL) as sample_contexts,
  MAX(ra.analyzed_at) as last_cited,
  NOW() as materialized_at
FROM response_analysis ra
CROSS JOIN LATERAL jsonb_array_elements(ra.sources_cited) source(value)
WHERE ra.analyzed_at >= NOW() - INTERVAL '30 days'
  AND ra.brand_cited = true
GROUP BY 
  COALESCE(ra.competitor_id, ra.primary_brand_id),
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  source.value->>'domain',
  source.value->>'type';

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON source_citation_analysis (unique_brand_id, source_domain, account_id);

-- Grant permissions
GRANT SELECT ON source_citation_analysis TO authenticated, service_role, anon;

-- ============================================================================
-- FUNCTION: refresh_all_report_views
-- ============================================================================
-- Updated to use CONCURRENTLY with unique indexes

CREATE OR REPLACE FUNCTION refresh_all_report_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_brand_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY topic_brand_matrix;
  REFRESH MATERIALIZED VIEW CONCURRENTLY source_citation_analysis;
  -- These may not have unique indexes, refresh without CONCURRENTLY
  REFRESH MATERIALIZED VIEW prompt_performance_analysis;
  REFRESH MATERIALIZED VIEW brand_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENT: Documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW daily_brand_metrics IS 
'Daily aggregated metrics for each brand (primary and competitors). Includes LVI Score calculated as:
(Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2).
Refreshed hourly via pg_cron. Use unique_brand_id for joining.';

COMMENT ON MATERIALIZED VIEW topic_brand_matrix IS 
'Topic associations for each brand from the last 30 days. Shows which topics are associated with each brand
and how frequently they appear. Refreshed hourly via pg_cron.';

COMMENT ON MATERIALIZED VIEW source_citation_analysis IS 
'Source citation patterns for each brand from the last 30 days. Shows which sources cite each brand
and citation quality metrics. Refreshed hourly via pg_cron.';
