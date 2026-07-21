-- Migration: Add Share of Voice to Report Functions
-- Date: 2025-11-30
-- Description: Updates get_brand_stats and get_lvi_timeseries to include share_of_voice
--              Share of Voice = Brand Mentions / (Brand Mentions + Competitor Mentions) × 100
--              This is distinct from mention_rate which is Brand Mentions / Total Responses × 100

-- ============================================================================
-- FUNCTION: Get LVI Timeseries (Updated)
-- ============================================================================
-- Added: share_of_voice column

DROP FUNCTION IF EXISTS get_lvi_timeseries(UUID, UUID, DATE, DATE, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS get_lvi_timeseries(UUID, UUID, DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_lvi_timeseries(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_model_name TEXT DEFAULT NULL,
  p_include_competitors BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  metric_date DATE,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  citation_rate NUMERIC,
  share_of_voice NUMERIC,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  total_responses BIGINT,
  mention_count BIGINT,
  citation_count BIGINT,
  brand_name VARCHAR(255),
  is_primary BOOLEAN,
  model_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_metrics AS (
    SELECT
      DATE(ra.analyzed_at) as analysis_date,
      ra.brand_name,
      ra.is_primary_brand,
      ra.model_name as mdl_name,
      
      COUNT(*) as response_count,
      SUM(CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END) as mentions,
      SUM(CASE WHEN ra.brand_cited THEN 1 ELSE 0 END) as citations,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as avg_sent,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE NULL END) as avg_pos,
      -- For share of voice calculation
      SUM(ra.brand_mention_count) as brand_mention_sum,
      SUM(ra.total_brand_mentions) as total_brand_mention_sum
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.analyzed_at) BETWEEN p_start_date AND p_end_date
      AND (p_model_name IS NULL OR ra.model_name = p_model_name)
      AND (p_include_competitors OR ra.is_primary_brand = TRUE)
    GROUP BY DATE(ra.analyzed_at), ra.brand_name, ra.is_primary_brand, ra.model_name
  )
  SELECT
    dm.analysis_date as metric_date,
    -- LVI Calculation: (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)
    ROUND(
      (
        -- Visibility component (mention_rate * 0.3)
        (COALESCE(CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.3) +
        -- Citation component (citation_rate * 0.3)
        (COALESCE(CASE WHEN dm.response_count > 0 THEN dm.citations::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.3) +
        -- Sentiment component (normalized 0-100 * 0.2)
        (((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.2) +
        -- Position component (inverted, lower is better * 0.2)
        (CASE 
          WHEN dm.avg_pos IS NULL OR dm.mentions = 0 THEN 0
          WHEN dm.avg_pos <= 1 THEN 100
          WHEN dm.avg_pos >= 20 THEN 0
          ELSE 100 - ((dm.avg_pos - 1) * 5.26)
        END * 0.2)
      ),
      2
    ) as lvi_score,
    
    (CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    (CASE WHEN dm.response_count > 0 THEN (dm.citations::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    -- Share of Voice: Brand Mentions / Total Brand Mentions (all brands) × 100
    ROUND(
      CASE 
        WHEN dm.total_brand_mention_sum > 0 THEN (dm.brand_mention_sum::numeric / dm.total_brand_mention_sum * 100)
        ELSE 0 
      END,
      2
    )::NUMERIC(5,2) as share_of_voice,
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    COALESCE(dm.avg_pos, 0)::NUMERIC(5,2) as avg_position,
    dm.response_count as total_responses,
    dm.mentions as mention_count,
    dm.citations as citation_count,
    dm.brand_name,
    dm.is_primary_brand as is_primary,
    dm.mdl_name as model_name
  FROM daily_metrics dm
  ORDER BY dm.analysis_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI timeseries data with share_of_voice for charts and trend analysis';


-- ============================================================================
-- FUNCTION: Get Brand Stats (Updated)
-- ============================================================================
-- Added: share_of_voice column, first_position_count, top_3_count

DROP FUNCTION IF EXISTS get_brand_stats(UUID, UUID, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_brand_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  brand_id UUID,
  brand_name VARCHAR(255),
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  citation_rate NUMERIC,
  share_of_voice NUMERIC,
  citation_count BIGINT,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  total_responses BIGINT,
  total_mentions BIGINT,
  first_position_count BIGINT,
  top_3_count BIGINT,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_end_date := CURRENT_DATE;
  v_start_date := CASE
    WHEN p_period = '7d' THEN v_end_date - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_end_date - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_end_date - INTERVAL '90 days'
    WHEN p_period = 'all' THEN '1970-01-01'::DATE
    ELSE v_end_date - INTERVAL '30 days'
  END;

  RETURN QUERY
  WITH brand_metrics AS (
    SELECT
      ra.brand_id as b_id,
      ra.brand_name as b_name,
      ra.is_primary_brand as is_prim,
      
      COUNT(*) as response_cnt,
      SUM(CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END) as mention_cnt,
      SUM(CASE WHEN ra.brand_cited THEN 1 ELSE 0 END) as citation_cnt,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as avg_sent,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE NULL END) as avg_pos,
      -- For share of voice calculation
      SUM(ra.brand_mention_count) as brand_mention_sum,
      SUM(ra.total_brand_mentions) as total_brand_mention_sum,
      -- Position counts
      SUM(CASE WHEN ra.brand_first_position = 1 THEN 1 ELSE 0 END) as first_pos_cnt,
      SUM(CASE WHEN ra.brand_first_position IS NOT NULL AND ra.brand_first_position <= 3 THEN 1 ELSE 0 END) as top_3_cnt
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.analyzed_at) BETWEEN v_start_date AND v_end_date
    GROUP BY ra.brand_id, ra.brand_name, ra.is_primary_brand
  )
  SELECT
    bm.b_id as brand_id,
    bm.b_name as brand_name,
    bm.is_prim as is_primary,
    
    -- LVI Score using standard formula
    ROUND(
      (
        -- Visibility component (mention_rate * 0.3)
        (COALESCE(CASE WHEN bm.response_cnt > 0 THEN bm.mention_cnt::numeric / bm.response_cnt * 100 ELSE 0 END, 0) * 0.3) +
        -- Citation component (citation_rate * 0.3)
        (COALESCE(CASE WHEN bm.response_cnt > 0 THEN bm.citation_cnt::numeric / bm.response_cnt * 100 ELSE 0 END, 0) * 0.3) +
        -- Sentiment component (normalized 0-100 * 0.2)
        (((COALESCE(bm.avg_sent, 0) + 1) / 2 * 100) * 0.2) +
        -- Position component (inverted, lower is better * 0.2)
        (CASE 
          WHEN bm.avg_pos IS NULL OR bm.mention_cnt = 0 THEN 0
          WHEN bm.avg_pos <= 1 THEN 100
          WHEN bm.avg_pos >= 20 THEN 0
          ELSE 100 - ((bm.avg_pos - 1) * 5.26)
        END * 0.2)
      ),
      2
    ) as lvi_score,
    
    (CASE WHEN bm.response_cnt > 0 THEN (bm.mention_cnt::numeric / bm.response_cnt * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    (CASE WHEN bm.response_cnt > 0 THEN (bm.citation_cnt::numeric / bm.response_cnt * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    -- Share of Voice: Brand Mentions / Total Brand Mentions (all brands) × 100
    ROUND(
      CASE 
        WHEN bm.total_brand_mention_sum > 0 THEN (bm.brand_mention_sum::numeric / bm.total_brand_mention_sum * 100)
        ELSE 0 
      END,
      2
    )::NUMERIC(5,2) as share_of_voice,
    bm.citation_cnt as citation_count,
    COALESCE(bm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    COALESCE(bm.avg_pos, 0)::NUMERIC(5,2) as avg_position,
    bm.response_cnt as total_responses,
    bm.mention_cnt as total_mentions,
    bm.first_pos_cnt as first_position_count,
    bm.top_3_cnt as top_3_count,
    v_start_date as period_start,
    v_end_date as period_end
  FROM brand_metrics bm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_brand_stats IS 'Get aggregated brand statistics with share_of_voice for a time period';


-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated, service_role;

