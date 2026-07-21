-- ============================================================================
-- Database Functions and Materialized Views for Report Data APIs
-- ============================================================================
-- Purpose: Create PostgreSQL functions and materialized views for efficient
--          aggregation of response_analysis data for dashboards and reports
-- ============================================================================

-- ============================================================================
-- FUNCTION: Get LVI Timeseries Data
-- ============================================================================
-- Returns daily LVI scores and components for charting
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lvi_timeseries(
  p_account_id UUID,
  p_brand_id UUID,
  p_competitor_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_model_name TEXT DEFAULT NULL,
  p_prompt_category TEXT DEFAULT NULL,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
  metric_date DATE,
  lvi_score NUMERIC,
  visibility_component NUMERIC,
  citation_component NUMERIC,
  sentiment_component NUMERIC,
  position_component NUMERIC,
  mention_rate NUMERIC,
  citation_rate NUMERIC,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  total_responses BIGINT,
  total_mentions BIGINT,
  is_primary BOOLEAN,
  brand_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_metrics AS (
    SELECT
      DATE(ra.analyzed_at) as analysis_date,
      ra.brand_name,
      ra.is_primary_brand,
      
      -- Count metrics
      COUNT(*) as response_count,
      COUNT(*) FILTER (WHERE ra.brand_mentioned) as mention_count,
      COUNT(*) FILTER (WHERE ra.brand_cited) as citation_count,
      SUM(ra.brand_mention_count) as total_brand_mentions,
      
      -- Average metrics
      AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned) as avg_brand_sentiment,
      AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL) as avg_brand_position
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (
        (p_competitor_id IS NULL AND ra.primary_brand_id = p_brand_id) OR
        (p_competitor_id IS NOT NULL AND ra.brand_competitor_id = p_competitor_id)
      )
      AND (p_start_date IS NULL OR DATE(ra.analyzed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(ra.analyzed_at) <= p_end_date)
      AND (p_model_name IS NULL OR ra.model_name = p_model_name)
      AND (p_prompt_category IS NULL OR ra.prompt_category = p_prompt_category)
    GROUP BY DATE(ra.analyzed_at), ra.brand_name, ra.is_primary_brand
  )
  SELECT
    dm.analysis_date::DATE as metric_date,
    
    -- Calculate LVI score
    ROUND(
      (((dm.mention_count::NUMERIC / NULLIF(dm.response_count, 0)) * 100) * 0.3) +
      (((dm.citation_count::NUMERIC / NULLIF(dm.mention_count, 0)) * 100) * 0.3) +
      ((((COALESCE(dm.avg_brand_sentiment, 0) + 1) / 2) * 100) * 0.2) +
      ((GREATEST(0, 100 - ((COALESCE(dm.avg_brand_position, 100) - 1) * 10))) * 0.2),
      2
    ) as lvi_score,
    
    -- Components
    ROUND((dm.mention_count::NUMERIC / NULLIF(dm.response_count, 0)) * 100, 2) as visibility_component,
    ROUND((dm.citation_count::NUMERIC / NULLIF(dm.mention_count, 0)) * 100, 2) as citation_component,
    ROUND(((COALESCE(dm.avg_brand_sentiment, 0) + 1) / 2) * 100, 2) as sentiment_component,
    ROUND(GREATEST(0, 100 - ((COALESCE(dm.avg_brand_position, 100) - 1) * 10)), 2) as position_component,
    
    -- Base metrics
    ROUND((dm.mention_count::NUMERIC / NULLIF(dm.response_count, 0)) * 100, 2) as mention_rate,
    ROUND((dm.citation_count::NUMERIC / NULLIF(dm.mention_count, 0)) * 100, 2) as citation_rate,
    ROUND(COALESCE(dm.avg_brand_sentiment, 0), 2) as avg_sentiment,
    ROUND(COALESCE(dm.avg_brand_position, 0), 2) as avg_position,
    
    dm.response_count as total_responses,
    COALESCE(dm.total_brand_mentions, 0) as total_mentions,
    dm.is_primary_brand as is_primary,
    dm.brand_name::TEXT
  FROM daily_metrics dm
  ORDER BY dm.analysis_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI scores and metrics for timeseries charts';

-- ============================================================================
-- FUNCTION: Get Aggregated Brand Stats
-- ============================================================================
-- Returns current aggregated stats for a brand/competitor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_brand_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_competitor_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_model_name TEXT DEFAULT NULL,
  p_prompt_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  brand_name TEXT,
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  citation_rate NUMERIC,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  share_of_voice NUMERIC,
  total_responses BIGINT,
  total_mentions BIGINT,
  first_position_count BIGINT,
  top_3_count BIGINT,
  citation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      ra.brand_name,
      ra.is_primary_brand,
      
      -- Counts
      COUNT(*) as response_count,
      COUNT(*) FILTER (WHERE ra.brand_mentioned) as mention_count,
      COUNT(*) FILTER (WHERE ra.brand_cited) as cite_count,
      SUM(ra.brand_mention_count) as total_brand_mentions,
      COUNT(*) FILTER (WHERE ra.brand_first_position = 1) as first_pos_count,
      COUNT(*) FILTER (WHERE ra.brand_first_position <= 3) as top3_count,
      SUM(ra.brand_citation_count) as total_citations,
      
      -- Averages
      AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned) as avg_sentiment_val,
      AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL) as avg_position_val,
      
      -- Share of voice calculation
      SUM(ra.brand_mention_count)::NUMERIC / NULLIF(SUM(ra.total_brands_mentioned), 0) as sov
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (
        (p_competitor_id IS NULL AND ra.primary_brand_id = p_brand_id) OR
        (p_competitor_id IS NOT NULL AND ra.brand_competitor_id = p_competitor_id)
      )
      AND (p_start_date IS NULL OR DATE(ra.analyzed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(ra.analyzed_at) <= p_end_date)
      AND (p_model_name IS NULL OR ra.model_name = p_model_name)
      AND (p_prompt_category IS NULL OR ra.prompt_category = p_prompt_category)
    GROUP BY ra.brand_name, ra.is_primary_brand
  )
  SELECT
    s.brand_name::TEXT,
    s.is_primary_brand as is_primary,
    
    -- LVI Score
    ROUND(
      (((s.mention_count::NUMERIC / NULLIF(s.response_count, 0)) * 100) * 0.3) +
      (((s.cite_count::NUMERIC / NULLIF(s.mention_count, 0)) * 100) * 0.3) +
      ((((COALESCE(s.avg_sentiment_val, 0) + 1) / 2) * 100) * 0.2) +
      ((GREATEST(0, 100 - ((COALESCE(s.avg_position_val, 100) - 1) * 10))) * 0.2),
      2
    ) as lvi_score,
    
    -- Metrics
    ROUND((s.mention_count::NUMERIC / NULLIF(s.response_count, 0)) * 100, 2) as mention_rate,
    ROUND((s.cite_count::NUMERIC / NULLIF(s.mention_count, 0)) * 100, 2) as citation_rate,
    ROUND(COALESCE(s.avg_sentiment_val, 0), 2) as avg_sentiment,
    ROUND(COALESCE(s.avg_position_val, 0), 2) as avg_position,
    ROUND(COALESCE(s.sov, 0) * 100, 2) as share_of_voice,
    
    -- Counts
    s.response_count as total_responses,
    COALESCE(s.total_brand_mentions, 0) as total_mentions,
    s.first_pos_count as first_position_count,
    s.top3_count as top_3_count,
    COALESCE(s.total_citations, 0) as citation_count
  FROM stats s;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_brand_stats IS 'Get aggregated stats for a brand or competitor';

-- ============================================================================
-- FUNCTION: Get Prompt Performance Analysis
-- ============================================================================
-- Returns prompt-level performance for opportunities/threats analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION get_prompt_performance(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_min_responses INTEGER DEFAULT 2
)
RETURNS TABLE (
  prompt_id TEXT,
  prompt_text TEXT,
  prompt_category TEXT,
  prompt_intent TEXT,
  
  -- Primary brand metrics
  primary_mention_count BIGINT,
  primary_avg_position NUMERIC,
  primary_avg_sentiment NUMERIC,
  primary_sov NUMERIC,
  
  -- Competitor metrics
  competitor_mention_count BIGINT,
  competitor_avg_position NUMERIC,
  competitors_mentioned TEXT[],
  
  -- Classification
  performance_type TEXT, -- 'strength', 'opportunity', 'threat'
  opportunity_score NUMERIC,
  
  total_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH prompt_stats AS (
    SELECT
      ra.prompt_id,
      ra.prompt_text,
      ra.prompt_category,
      ra.prompt_intent,
      
      -- Primary brand
      COUNT(*) FILTER (WHERE ra.is_primary_brand AND ra.brand_mentioned) as primary_mentions,
      AVG(ra.brand_first_position) FILTER (WHERE ra.is_primary_brand AND ra.brand_first_position IS NOT NULL) as primary_avg_pos,
      AVG(ra.brand_sentiment) FILTER (WHERE ra.is_primary_brand AND ra.brand_mentioned) as primary_sentiment,
      AVG(ra.share_of_voice) FILTER (WHERE ra.is_primary_brand) as primary_share,
      
      -- Competitors
      COUNT(*) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_mentioned) as competitor_mentions,
      AVG(ra.brand_first_position) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_first_position IS NOT NULL) as competitor_avg_pos,
      array_agg(DISTINCT ra.brand_name) FILTER (WHERE NOT ra.is_primary_brand AND ra.brand_mentioned) as competitors,
      
      COUNT(DISTINCT ra.response_id) as response_count
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.primary_brand_id = p_brand_id OR EXISTS (
        SELECT 1 FROM competitors c 
        WHERE c.brand_id = p_brand_id AND c.id = ra.brand_competitor_id
      ))
      AND (p_start_date IS NULL OR DATE(ra.analyzed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(ra.analyzed_at) <= p_end_date)
    GROUP BY ra.prompt_id, ra.prompt_text, ra.prompt_category, ra.prompt_intent
    HAVING COUNT(DISTINCT ra.response_id) >= p_min_responses
  )
  SELECT
    ps.prompt_id::TEXT,
    ps.prompt_text::TEXT,
    COALESCE(ps.prompt_category, 'uncategorized')::TEXT,
    COALESCE(ps.prompt_intent, 'unknown')::TEXT,
    
    ps.primary_mentions,
    ROUND(COALESCE(ps.primary_avg_pos, 0), 2) as primary_avg_position,
    ROUND(COALESCE(ps.primary_sentiment, 0), 2) as primary_avg_sentiment,
    ROUND(COALESCE(ps.primary_share, 0), 2) as primary_sov,
    
    ps.competitor_mentions,
    ROUND(COALESCE(ps.competitor_avg_pos, 0), 2) as competitor_avg_position,
    COALESCE(ps.competitors, ARRAY[]::TEXT[]) as competitors_mentioned,
    
    -- Classify performance
    CASE
      WHEN ps.primary_mentions > ps.competitor_mentions AND ps.primary_share > 50 THEN 'strength'
      WHEN ps.primary_mentions = 0 AND ps.competitor_mentions > 0 THEN 'opportunity'
      WHEN ps.competitor_mentions > ps.primary_mentions THEN 'threat'
      ELSE 'neutral'
    END::TEXT as performance_type,
    
    -- Calculate opportunity score (higher = bigger opportunity)
    ROUND(
      CASE
        WHEN ps.primary_mentions = 0 AND ps.competitor_mentions > 0 THEN
          (ps.competitor_mentions::NUMERIC / ps.response_count * 50) + 
          (GREATEST(0, 100 - ((ps.competitor_avg_pos - 1) * 10)) * 0.5)
        ELSE 0
      END,
      2
    ) as opportunity_score,
    
    ps.response_count as total_responses
  FROM prompt_stats ps
  ORDER BY 
    CASE
      WHEN ps.primary_mentions = 0 AND ps.competitor_mentions > 0 THEN 1
      WHEN ps.competitor_mentions > ps.primary_mentions THEN 2
      WHEN ps.primary_mentions > ps.competitor_mentions THEN 3
      ELSE 4
    END,
    ps.response_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_prompt_performance IS 'Analyze prompt-level performance for opportunities and threats';

-- ============================================================================
-- MATERIALIZED VIEW: Brand Metrics Latest
-- ============================================================================
-- Pre-aggregated metrics for fast dashboard loading
-- Refresh this view daily or on-demand
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS brand_metrics_latest AS
WITH latest_data AS (
  SELECT
    ra.account_id,
    ra.primary_brand_id as brand_id,
    ra.brand_competitor_id as competitor_id,
    ra.brand_name,
    ra.is_primary_brand,
    MAX(DATE(ra.analyzed_at)) as last_analysis_date,
    
    -- Last 30 days
    COUNT(*) FILTER (WHERE ra.analyzed_at >= CURRENT_DATE - INTERVAL '30 days') as responses_30d,
    COUNT(*) FILTER (WHERE ra.brand_mentioned AND ra.analyzed_at >= CURRENT_DATE - INTERVAL '30 days') as mentions_30d,
    
    -- Last 7 days
    COUNT(*) FILTER (WHERE ra.analyzed_at >= CURRENT_DATE - INTERVAL '7 days') as responses_7d,
    COUNT(*) FILTER (WHERE ra.brand_mentioned AND ra.analyzed_at >= CURRENT_DATE - INTERVAL '7 days') as mentions_7d,
    
    -- All time
    COUNT(*) as responses_all,
    COUNT(*) FILTER (WHERE ra.brand_mentioned) as mentions_all,
    
    -- Metrics (30d)
    AVG(ra.brand_sentiment) FILTER (WHERE ra.brand_mentioned AND ra.analyzed_at >= CURRENT_DATE - INTERVAL '30 days') as avg_sentiment_30d,
    AVG(ra.brand_first_position) FILTER (WHERE ra.brand_first_position IS NOT NULL AND ra.analyzed_at >= CURRENT_DATE - INTERVAL '30 days') as avg_position_30d
    
  FROM response_analysis ra
  WHERE ra.analyzed_at >= CURRENT_DATE - INTERVAL '90 days' -- Keep last 90 days in view
  GROUP BY ra.account_id, ra.primary_brand_id, ra.brand_competitor_id, ra.brand_name, ra.is_primary_brand
)
SELECT
  ld.account_id,
  ld.brand_id,
  ld.competitor_id,
  ld.brand_name,
  ld.is_primary_brand,
  ld.last_analysis_date,
  
  -- 30 day metrics
  ld.responses_30d,
  ld.mentions_30d,
  ROUND((ld.mentions_30d::NUMERIC / NULLIF(ld.responses_30d, 0)) * 100, 2) as mention_rate_30d,
  
  -- 7 day metrics
  ld.responses_7d,
  ld.mentions_7d,
  ROUND((ld.mentions_7d::NUMERIC / NULLIF(ld.responses_7d, 0)) * 100, 2) as mention_rate_7d,
  
  -- All time
  ld.responses_all,
  ld.mentions_all,
  
  -- Sentiment and position
  ROUND(COALESCE(ld.avg_sentiment_30d, 0), 2) as avg_sentiment_30d,
  ROUND(COALESCE(ld.avg_position_30d, 0), 2) as avg_position_30d,
  
  -- LVI Score (30d)
  ROUND(
    (((ld.mentions_30d::NUMERIC / NULLIF(ld.responses_30d, 0)) * 100) * 0.3) +
    (50 * 0.3) + -- Placeholder for citation rate
    ((((COALESCE(ld.avg_sentiment_30d, 0) + 1) / 2) * 100) * 0.2) +
    ((GREATEST(0, 100 - ((COALESCE(ld.avg_position_30d, 100) - 1) * 10))) * 0.2),
    2
  ) as lvi_score_30d,
  
  NOW() as refreshed_at
FROM latest_data ld;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_brand_metrics_latest_unique 
  ON brand_metrics_latest(account_id, COALESCE(brand_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX idx_brand_metrics_latest_account ON brand_metrics_latest(account_id);
CREATE INDEX idx_brand_metrics_latest_brand ON brand_metrics_latest(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX idx_brand_metrics_latest_primary ON brand_metrics_latest(is_primary_brand, account_id);
CREATE INDEX idx_brand_metrics_latest_lvi ON brand_metrics_latest(lvi_score_30d DESC);

COMMENT ON MATERIALIZED VIEW brand_metrics_latest IS 'Pre-aggregated brand metrics for fast dashboard loading. Refresh daily.';

-- ============================================================================
-- FUNCTION: Refresh Materialized View
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_brand_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY brand_metrics_latest;
  RAISE NOTICE 'Materialized view brand_metrics_latest refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_brand_metrics IS 'Refresh the brand_metrics_latest materialized view';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_prompt_performance TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_brand_metrics TO service_role;
GRANT SELECT ON brand_metrics_latest TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  Report Data API Functions Created Successfully
  ============================================================================
  
  Functions:
  - get_lvi_timeseries: Daily LVI scores for charts
  - get_brand_stats: Aggregated brand statistics
  - get_prompt_performance: Prompt-level analysis
  - refresh_brand_metrics: Refresh materialized view
  
  Materialized Views:
  - brand_metrics_latest: Pre-aggregated metrics (refresh daily)
  
  Usage:
  SELECT * FROM get_lvi_timeseries(account_id, brand_id);
  SELECT * FROM get_brand_stats(account_id, brand_id);
  SELECT * FROM get_prompt_performance(account_id, brand_id);
  SELECT refresh_brand_metrics();
  
  ============================================================================
  ';
END $$;
