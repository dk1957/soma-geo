-- Migration: Restore and Update Materialized Views with Model Filtering
-- Date: 2025-11-30
-- Description: Restores brand_performance_summary, topic_brand_matrix, source_citation_analysis, 
--              and prompt_performance_analysis which were dropped by CASCADE.
--              Updates them to include model_name for granular filtering.

-- ============================================================================
-- VIEW: Brand Performance Summary (Rolling Periods)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS brand_performance_summary CASCADE;

CREATE MATERIALIZED VIEW brand_performance_summary AS
WITH period_metrics AS (
  SELECT
    COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
    ra.primary_brand_id,
    ra.competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    ra.account_id,
    ra.model_name,
    
    '7d' as period,
    COUNT(DISTINCT ra.response_id) as total_responses,
    COUNT(DISTINCT ra.prompt_id) as total_prompts,
    
    ROUND((COUNT(*) FILTER (WHERE ra.brand_mentioned)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2) as mention_rate,
    ROUND(AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL), 2) as avg_position,
    ROUND(AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned), 3) as avg_sentiment,
    ROUND((COUNT(*) FILTER (WHERE ra.brand_cited)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2) as citation_rate, -- Corrected denominator
    ROUND(AVG(ra.share_of_voice) FILTER (WHERE ra.brand_mentioned), 2) as share_of_voice,
    
    COUNT(*) FILTER (WHERE ra.brand_mentioned) as mention_count,
    COUNT(*) FILTER (WHERE ra.brand_first_position = 1) as first_position_count,
    COUNT(*) FILTER (WHERE ra.brand_cited) as citation_count,
    
    MAX(ra.analyzed_at) as last_updated
    
  FROM response_analysis ra
  WHERE ra.analyzed_at >= NOW() - INTERVAL '7 days'
  GROUP BY 1,2,3,4,5,6,7
  
  UNION ALL
  
  SELECT
    COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
    ra.primary_brand_id,
    ra.competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    ra.account_id,
    ra.model_name,
    
    '30d' as period,
    COUNT(DISTINCT ra.response_id),
    COUNT(DISTINCT ra.prompt_id),
    ROUND((COUNT(*) FILTER (WHERE ra.brand_mentioned)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2),
    ROUND(AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL), 2),
    ROUND(AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned), 3),
    ROUND((COUNT(*) FILTER (WHERE ra.brand_cited)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2),
    ROUND(AVG(ra.share_of_voice) FILTER (WHERE ra.brand_mentioned), 2),
    COUNT(*) FILTER (WHERE ra.brand_mentioned),
    COUNT(*) FILTER (WHERE ra.brand_first_position = 1),
    COUNT(*) FILTER (WHERE ra.brand_cited),
    MAX(ra.analyzed_at)
  FROM response_analysis ra
  WHERE ra.analyzed_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1,2,3,4,5,6,7
  
  UNION ALL
  
  SELECT
    COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
    ra.primary_brand_id,
    ra.competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    ra.account_id,
    ra.model_name,
    
    '90d' as period,
    COUNT(DISTINCT ra.response_id),
    COUNT(DISTINCT ra.prompt_id),
    ROUND((COUNT(*) FILTER (WHERE ra.brand_mentioned)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2),
    ROUND(AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL), 2),
    ROUND(AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned), 3),
    ROUND((COUNT(*) FILTER (WHERE ra.brand_cited)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100), 2),
    ROUND(AVG(ra.share_of_voice) FILTER (WHERE ra.brand_mentioned), 2),
    COUNT(*) FILTER (WHERE ra.brand_mentioned),
    COUNT(*) FILTER (WHERE ra.brand_first_position = 1),
    COUNT(*) FILTER (WHERE ra.brand_cited),
    MAX(ra.analyzed_at)
  FROM response_analysis ra
  WHERE ra.analyzed_at >= NOW() - INTERVAL '90 days'
  GROUP BY 1,2,3,4,5,6,7
)
SELECT
  *,
  calculate_lvi_score(mention_rate, citation_rate, avg_sentiment, avg_position) as lvi_score,
  NOW() as materialized_at
FROM period_metrics;

CREATE UNIQUE INDEX ON brand_performance_summary (unique_brand_id, period, model_name, account_id);
GRANT SELECT ON brand_performance_summary TO authenticated, service_role, anon;

-- ============================================================================
-- VIEW: Topic Brand Matrix
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS topic_brand_matrix CASCADE;

CREATE MATERIALIZED VIEW topic_brand_matrix AS
SELECT 
  COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  ra.model_name, -- Added
  
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
        AND ra2.model_name = ra.model_name -- Match model
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
  ra.model_name,
  topic.value->>'name',
  topic.value->>'category';

CREATE UNIQUE INDEX ON topic_brand_matrix (unique_brand_id, topic_name, model_name, account_id);
GRANT SELECT ON topic_brand_matrix TO authenticated, service_role, anon;

-- ============================================================================
-- VIEW: Source Citation Analysis
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS source_citation_analysis CASCADE;

CREATE MATERIALIZED VIEW source_citation_analysis AS
SELECT 
  COALESCE(ra.competitor_id, ra.primary_brand_id) as unique_brand_id,
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.account_id,
  ra.model_name, -- Added
  
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
        AND ra2.model_name = ra.model_name -- Match model
    ), 0)::numeric * 100, 
    2
  ) as usage_frequency,
  ROUND(AVG((source.value->>'position')::integer), 2) as avg_citation_position,
  COUNT(*) FILTER (WHERE (source.value->>'position')::integer = 1) as first_citation_count,
  array_agg(DISTINCT source.value->>'context') FILTER (WHERE source.value->>'context' IS NOT NULL) as sample_contexts,
  
  -- Competitive analysis (simplified for per-model view)
  BOOL_OR(
    NOT EXISTS (
      SELECT 1 FROM response_analysis ra3
      WHERE ra3.response_id = ra.response_id
      AND ra3.id != ra.id
      AND ra3.sources_cited @> jsonb_build_array(source.value)
    )
  ) as cites_brand_exclusively,

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
  ra.model_name,
  source.value->>'domain',
  source.value->>'type';

CREATE UNIQUE INDEX ON source_citation_analysis (unique_brand_id, source_domain, model_name, account_id);
GRANT SELECT ON source_citation_analysis TO authenticated, service_role, anon;

-- ============================================================================
-- VIEW: Prompt Performance Analysis
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS prompt_performance_analysis CASCADE;

CREATE MATERIALIZED VIEW prompt_performance_analysis AS
WITH prompt_brands AS (
  SELECT
    ra.prompt_id,
    ra.prompt_text,
    up.category as prompt_category,
    up.intent_category as prompt_intent,
    ra.primary_brand_id as account_brand_id, -- Using primary_brand_id as grouping key for the account's perspective
    ra.account_id,
    ra.model_name, -- Added
    
    -- Primary brand metrics
    MAX(CASE WHEN ra.is_primary_brand THEN ra.brand_name END) as primary_brand_name,
    COUNT(*) FILTER (WHERE ra.is_primary_brand) as primary_responses,
    BOOL_OR(ra.brand_mentioned AND ra.is_primary_brand) as primary_mentioned,
    ROUND(AVG(ra.brand_first_position) FILTER (WHERE ra.is_primary_brand AND ra.brand_mentioned), 2) as primary_avg_position,
    ROUND(AVG(ra.brand_sentiment) FILTER (WHERE ra.is_primary_brand AND ra.brand_mentioned), 3) as primary_sentiment,
    ROUND(AVG(ra.share_of_voice) FILTER (WHERE ra.is_primary_brand AND ra.brand_mentioned), 2) as primary_sov,
    
    -- Competitor metrics
    COUNT(DISTINCT ra.competitor_id) as competitors_count,
    array_agg(DISTINCT ra.brand_name) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_mentioned) as competitors_mentioned,
    MIN(ra.brand_first_position) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_mentioned) as best_competitor_position,
    
    -- Strategic classification
    CASE
      WHEN NOT BOOL_OR(ra.brand_mentioned AND ra.is_primary_brand) 
           AND COUNT(*) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_mentioned) > 0
        THEN 'opportunity'
      WHEN BOOL_OR(ra.brand_mentioned AND ra.is_primary_brand)
           AND (SELECT AVG(ra_sub.brand_first_position) FROM response_analysis ra_sub 
                WHERE ra_sub.prompt_id = ra.prompt_id 
                AND ra_sub.model_name = ra.model_name -- Match model
                AND ra_sub.is_primary_brand AND ra_sub.brand_mentioned) <= 3
        THEN 'strength'
      WHEN BOOL_OR(ra.brand_mentioned AND ra.is_primary_brand)
        THEN 'threat'
      ELSE 'neutral'
    END as strategic_classification,
    
    MAX(ra.analyzed_at) as last_analyzed
    
  FROM response_analysis ra
  LEFT JOIN user_prompts up ON ra.prompt_id::uuid = up.id
  WHERE ra.analyzed_at >= NOW() - INTERVAL '30 days'
  GROUP BY ra.prompt_id, ra.prompt_text, up.category, up.intent_category, ra.primary_brand_id, ra.account_id, ra.model_name
)
SELECT
  *,
  CASE
    WHEN strategic_classification = 'opportunity' THEN 
      LEAST(100, 50 + (competitors_count * 10))
    WHEN strategic_classification = 'threat' THEN
      GREATEST(0, 50 - (primary_avg_position * 5))
    WHEN strategic_classification = 'strength' THEN
      GREATEST(70, 100 - (primary_avg_position * 10))
    ELSE 30
  END as opportunity_score,
  
  '30d' as period,
  NOW() as materialized_at
FROM prompt_brands;

CREATE INDEX ON prompt_performance_analysis (account_brand_id, model_name);
GRANT SELECT ON prompt_performance_analysis TO authenticated, service_role, anon;

-- ============================================================================
-- FUNCTION: Refresh All Views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_report_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_brand_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY brand_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY topic_brand_matrix;
  REFRESH MATERIALIZED VIEW CONCURRENTLY source_citation_analysis;
  -- prompt_performance_analysis doesn't have unique index yet, so no CONCURRENTLY
  REFRESH MATERIALIZED VIEW prompt_performance_analysis;
END;
$$ LANGUAGE plpgsql;
