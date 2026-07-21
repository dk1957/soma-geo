-- Migration: Fix avg_position to return NULL instead of 0 when no position data
-- Date: 2025-12-05
-- Description: Updates get_lvi_timeseries to return NULL for avg_position when there's no data
--              This allows frontend to distinguish between "no position data" (NULL) and "position 0" (never happens)
--              Position values are always >= 1 (1st position, 2nd position, etc.)

-- ============================================================================
-- FUNCTION: Get LVI Timeseries (Updated)
-- ============================================================================
-- Changed: avg_position now returns NULL instead of 0 when no data

DROP FUNCTION IF EXISTS get_lvi_timeseries(UUID, UUID, DATE, DATE, TEXT, BOOLEAN) CASCADE;

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
        -- Only include sentiment component if brand was mentioned, otherwise 0
        (CASE WHEN dm.mentions > 0 THEN ((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.2 ELSE 0 END) +
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
    -- Sentiment: return 0 if no mentions (for LVI calculation), but position uses NULL
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    -- Position: return NULL if no position data (allows frontend to show "—" vs actual position)
    -- Position values are always >= 1, so NULL means "no data"
    dm.avg_pos::NUMERIC(5,2) as avg_position,
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

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI timeseries data with share_of_voice for charts. avg_position returns NULL when no position data.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;
