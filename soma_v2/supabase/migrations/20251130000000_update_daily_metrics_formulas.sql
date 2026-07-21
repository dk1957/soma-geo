-- Migration: Update Daily Brand Metrics with Corrected Formulas
-- Date: 2025-11-30
-- Description: Updates daily_brand_metrics to use correct formulas for LVI, Citation Rate, and Share of Voice.
--              Also adds model_name to the grouping to support filtering by model.

-- ============================================================================
-- MATERIALIZED VIEW: daily_brand_metrics
-- ============================================================================

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
    ra.model_name, -- Added model_name for filtering
    
    -- Response counts
    COUNT(DISTINCT ra.response_id) as total_responses,
    COUNT(DISTINCT ra.prompt_id) as total_prompts,
    
    -- Mention metrics
    COUNT(*) FILTER (WHERE ra.brand_mentioned) as mention_count,
    ROUND(
      COUNT(*) FILTER (WHERE ra.brand_mentioned)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 
      2
    ) as mention_rate, -- Visibility Score
    
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
      NULLIF(COUNT(*), 0)::numeric * 100, 
      2
    ) as citation_rate, -- Corrected: Denominator is Total Responses
    SUM(COALESCE(ra.brand_citation_count, 0)) as total_citations,
    
    -- Share of voice (gSOV)
    -- Formula: (Number of primary brand mentions in responses / Total mentions) * 100
    ROUND(
        SUM(ra.brand_mention_count)::numeric / NULLIF(SUM(ra.total_brand_mentions), 0)::numeric * 100,
        2
    ) as avg_share_of_voice,
    
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
        (COALESCE(COUNT(*) FILTER (WHERE ra.brand_cited)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 0) * 0.3) +
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
    DATE(ra.analyzed_at),
    ra.model_name
)
SELECT * FROM brand_metrics
ORDER BY metric_date DESC, is_primary_brand DESC, brand_name;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON daily_brand_metrics (unique_brand_id, metric_date, model_name, account_id);

-- Grant permissions
GRANT SELECT ON daily_brand_metrics TO authenticated, service_role, anon;

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
'Daily aggregated metrics for each brand (primary and competitors) per model. Includes LVI Score calculated as:
(Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2).
Refreshed hourly via pg_cron. Use unique_brand_id for joining.';
