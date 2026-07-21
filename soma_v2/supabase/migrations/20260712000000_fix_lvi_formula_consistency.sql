-- Migration: Align SQL LVI formulas to canonical weights
-- Date: 2026-07-12
-- Description: Updates get_brand_stats and get_lvi_timeseries to use the canonical LVI formula:
--   LVI = Visibility*0.30 + Position*0.25 + Citation*0.25 + Sentiment*0.20
--   Position = GREATEST(0, (1 - (avg_pos - 1) / 9)) * 100  (rank 1=100, rank 10=0)
--   Citation = cited_responses / mentioned_responses * 100
--   Zero-visibility rule: if mention_rate = 0, LVI = 0

-- ============================================================================
-- Fix get_brand_stats — canonical LVI weights
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_brand_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_model_name TEXT DEFAULT NULL,
  p_include_competitors BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  brand_id UUID,
  brand_name VARCHAR,
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC(7,2),
  citation_rate NUMERIC(7,2),
  share_of_voice NUMERIC(7,2),
  citation_count BIGINT,
  avg_sentiment NUMERIC(5,2),
  avg_position NUMERIC(7,2),
  total_responses BIGINT,
  total_mentions BIGINT,
  first_position_count BIGINT,
  top_3_count BIGINT,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, (CURRENT_DATE - INTERVAL '30 days')::DATE);
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
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
      SUM(ra.brand_mention_count) as brand_mention_sum,
      SUM(ra.total_brand_mentions) as total_brand_mention_sum,
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

    -- Canonical LVI: Vis*0.30 + Pos*0.25 + Cit*0.25 + Sent*0.20
    CASE WHEN bm.mention_cnt = 0 THEN 0.00
    ELSE LEAST(100, GREATEST(0, ROUND(
      (
        -- Visibility: mentions / responses * 100 * 0.30
        (CASE WHEN bm.response_cnt > 0 THEN bm.mention_cnt::numeric / bm.response_cnt * 100 ELSE 0 END * 0.30) +
        -- Position: GREATEST(0, (1 - (pos - 1) / 9)) * 100 * 0.25
        (CASE
          WHEN bm.avg_pos IS NULL OR bm.avg_pos = 0 THEN 0
          ELSE GREATEST(0, (1.0 - (bm.avg_pos - 1.0) / 9.0)) * 100
        END * 0.25) +
        -- Citation: citations / mentions * 100 * 0.25
        (CASE WHEN bm.mention_cnt > 0 THEN bm.citation_cnt::numeric / bm.mention_cnt * 100 ELSE 0 END * 0.25) +
        -- Sentiment: ((sent + 1) / 2) * 100 * 0.20
        (((COALESCE(bm.avg_sent, 0) + 1) / 2) * 100 * 0.20)
      ),
      2
    )))
    END as lvi_score,

    LEAST(100, CASE WHEN bm.response_cnt > 0 THEN (bm.mention_cnt::numeric / bm.response_cnt * 100) ELSE 0 END)::NUMERIC(7,2) as mention_rate,
    LEAST(100, CASE WHEN bm.mention_cnt > 0 THEN (bm.citation_cnt::numeric / bm.mention_cnt * 100) ELSE 0 END)::NUMERIC(7,2) as citation_rate,
    ROUND(
      CASE
        WHEN bm.total_brand_mention_sum > 0 THEN (bm.brand_mention_sum::numeric / bm.total_brand_mention_sum * 100)
        ELSE 0
      END,
      2
    )::NUMERIC(7,2) as share_of_voice,
    bm.citation_cnt as citation_count,
    COALESCE(bm.avg_sent, 0)::NUMERIC(5,2) as avg_sentiment,
    COALESCE(bm.avg_pos, 0)::NUMERIC(7,2) as avg_position,
    bm.response_cnt as total_responses,
    bm.mention_cnt as total_mentions,
    bm.first_pos_cnt as first_position_count,
    bm.top_3_cnt as top_3_count,
    v_start_date as period_start,
    v_end_date as period_end
  FROM brand_metrics bm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================================
-- Fix get_lvi_timeseries — canonical LVI weights
-- ============================================================================
DROP FUNCTION IF EXISTS get_lvi_timeseries(UUID, UUID, DATE, DATE, TEXT, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION public.get_lvi_timeseries(
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

    -- Canonical LVI: Vis*0.30 + Pos*0.25 + Cit*0.25 + Sent*0.20
    CASE WHEN dm.mentions = 0 THEN 0::NUMERIC
    ELSE LEAST(100, GREATEST(0, ROUND(
      (
        -- Visibility: mentions / responses * 100 * 0.30
        (COALESCE(CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.30) +
        -- Position: GREATEST(0, (1 - (pos - 1) / 9)) * 100 * 0.25
        (CASE
          WHEN dm.avg_pos IS NULL THEN 0
          ELSE GREATEST(0, (1.0 - (dm.avg_pos - 1.0) / 9.0)) * 100
        END * 0.25) +
        -- Citation: citations / mentions * 100 * 0.25
        (COALESCE(CASE WHEN dm.mentions > 0 THEN dm.citations::numeric / dm.mentions * 100 ELSE 0 END, 0) * 0.25) +
        -- Sentiment: ((sent + 1) / 2) * 100 * 0.20
        (CASE WHEN dm.mentions > 0 THEN ((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.20 ELSE 0 END)
      ),
      2
    )))
    END as lvi_score,

    (CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    (CASE WHEN dm.mentions > 0 THEN (dm.citations::numeric / dm.mentions * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    ROUND(
      CASE
        WHEN dm.total_brand_mention_sum > 0 THEN (dm.brand_mention_sum::numeric / dm.total_brand_mention_sum * 100)
        ELSE 0
      END,
      2
    )::NUMERIC(5,2) as share_of_voice,
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
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

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI timeseries data using canonical LVI formula. avg_position returns NULL when no position data.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;
