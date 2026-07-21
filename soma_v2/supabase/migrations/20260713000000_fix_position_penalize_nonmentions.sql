-- Migration: Fix avg_position to penalize non-mentioned responses
-- Date: 2025-07-13
-- Description: Changes AVG position calculation in all three functions to use
--   ELSE 10 (worst rank) instead of ELSE NULL for responses where the brand is
--   NOT mentioned. This prevents misleading 100% position scores when the brand
--   is only mentioned in branded queries (e.g., rank 1 in 6/12 responses showed
--   as 100% because the other 6 non-mentioned responses were ignored).
--
-- Affected functions: get_lvi_timeseries, get_brand_stats, get_industry_rankings

-- ============================================================================
-- FUNCTION 1: get_lvi_timeseries (fix avg_pos)
-- ============================================================================

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
      -- FIXED: Non-mentioned responses count as rank 10 (worst position)
      -- Previously used ELSE NULL which ignored non-mentions entirely
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE 10 END) as avg_pos,
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

    -- LVI: Vis*0.35 + Pos*0.30 + Cit*0.15 + Sent*0.20
    CASE WHEN dm.mentions = 0 THEN 0::NUMERIC
    ELSE LEAST(100, GREATEST(0, ROUND(
      (
        (COALESCE(CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.35) +
        (CASE
          WHEN dm.avg_pos IS NULL THEN 0
          ELSE GREATEST(0, (1.0 - (dm.avg_pos - 1.0) / 9.0)) * 100
        END * 0.30) +
        (COALESCE(CASE WHEN dm.mentions > 0 THEN dm.citations::numeric / dm.mentions * 100 ELSE 0 END, 0) * 0.15) +
        (CASE WHEN dm.mentions > 0 THEN ((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.20 ELSE 0 END)
      ),
      2
    )))
    END as lvi_score,

    (CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    (CASE WHEN dm.response_count > 0 THEN (dm.citations::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    ROUND(
      CASE
        WHEN dm.total_brand_mention_sum > 0 THEN (dm.brand_mention_sum::numeric / dm.total_brand_mention_sum * 100)
        ELSE 0
      END,
      2
    )::NUMERIC(5,2) as share_of_voice,
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    -- Position: includes penalty for non-mentions (rank 10)
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

GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;


-- ============================================================================
-- FUNCTION 2: get_brand_stats (fix avg_pos)
-- ============================================================================

-- Drop ALL overloaded versions first
DROP FUNCTION IF EXISTS get_brand_stats(UUID, UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_brand_stats(UUID, UUID, DATE, DATE, TEXT, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION get_brand_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
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
      -- FIXED: Non-mentioned responses count as rank 10 (worst position)
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE 10 END) as avg_pos,
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

    -- LVI: Vis*0.35 + Pos*0.30 + Cit*0.15 + Sent*0.20
    CASE WHEN bm.mention_cnt = 0 THEN 0.00
    ELSE LEAST(100, GREATEST(0, ROUND(
      (
        (CASE WHEN bm.response_cnt > 0 THEN bm.mention_cnt::numeric / bm.response_cnt * 100 ELSE 0 END * 0.35) +
        (CASE
          WHEN bm.avg_pos IS NULL OR bm.avg_pos = 0 THEN 0
          ELSE GREATEST(0, (1.0 - (bm.avg_pos - 1.0) / 9.0)) * 100
        END * 0.30) +
        (CASE WHEN bm.mention_cnt > 0 THEN bm.citation_cnt::numeric / bm.mention_cnt * 100 ELSE 0 END * 0.15) +
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

GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated, service_role;


-- ============================================================================
-- FUNCTION 3: get_industry_rankings (fix avg_position in current & previous)
-- ============================================================================
-- Note: get_industry_rankings has inline AVG position calculations in both
-- current_metrics and previous_metrics CTEs, plus in LVI calculation.
-- All are updated to use ELSE 10 for non-mentioned responses.

-- Drop ALL overloaded versions first
DROP FUNCTION IF EXISTS get_industry_rankings(UUID, DATE, DATE, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_industry_rankings(UUID, UUID, DATE, DATE, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_industry_rankings(
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  rank INTEGER,
  brand_name VARCHAR(255),
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  share_of_voice NUMERIC,
  citation_rate NUMERIC,
  mention_count BIGINT,
  first_position_count BIGINT,
  total_responses BIGINT,
  lvi_change NUMERIC,
  lvi_change_pct NUMERIC,
  mention_rate_change NUMERIC,
  mention_rate_change_pct NUMERIC,
  sentiment_change NUMERIC,
  sentiment_change_pct NUMERIC,
  avg_position_change NUMERIC,
  avg_position_change_pct NUMERIC,
  share_of_voice_change NUMERIC,
  share_of_voice_change_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_ranges AS (
    SELECT
      p_start_date AS current_start,
      p_end_date AS current_end,
      p_end_date - INTERVAL '1 day' AS previous_day
  ),
  all_brands AS (
    SELECT DISTINCT ra.brand_name
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
  ),
  current_metrics AS (
    SELECT
      ra.brand_name,
      ra.is_primary_brand,
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC /
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      -- FIXED: Non-mentioned responses count as rank 10
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
          THEN ra.brand_avg_position ELSE 10 END) AS avg_position,
      COUNT(CASE WHEN ra.brand_avg_position <= 1.5 THEN 1 END) AS first_position_count,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END) AS avg_sentiment,
      (SUM(ra.brand_mention_count)::NUMERIC /
       NULLIF(SUM(ra.total_brand_mentions), 0)::NUMERIC) * 100 AS avg_share_of_voice,
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      LEAST(100, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC /
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100) AS citation_rate,

      -- LVI: Vis*0.35 + Pos*0.30 + Cit*0.15 + Sent*0.20
      LEAST(100,
        LEAST(35, (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC /
         NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.35) +
        (CASE
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0
            AND AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
                 THEN ra.brand_avg_position ELSE 10 END) IS NOT NULL
          THEN GREATEST(0, (1.0 - (AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
               THEN ra.brand_avg_position ELSE 10 END) - 1.0) / 9.0)) * 100 * 0.30
          ELSE 0
        END) +
        LEAST(15, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC /
         NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.15) +
        (CASE
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0
          THEN ((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 100 * 0.20
          ELSE 0
        END)
      ) AS lvi_score

    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.brand_name IN (SELECT ab.brand_name FROM all_brands ab)
      AND ra.analysis_date >= (SELECT current_start FROM date_ranges)
      AND ra.analysis_date <= (SELECT current_end FROM date_ranges)
    GROUP BY ra.brand_name, ra.is_primary_brand
  ),
  previous_metrics AS (
    SELECT
      ra.brand_name,
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC /
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      -- FIXED: Non-mentioned responses count as rank 10
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
          THEN ra.brand_avg_position ELSE 10 END) AS avg_position,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END) AS avg_sentiment,
      (SUM(ra.brand_mention_count)::NUMERIC /
       NULLIF(SUM(ra.total_brand_mentions), 0)::NUMERIC) * 100 AS avg_share_of_voice,

      -- Same LVI formula for previous period (with ELSE 10 fix)
      LEAST(100,
        LEAST(35, (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC /
         NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.35) +
        (CASE
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0
            AND AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
                 THEN ra.brand_avg_position ELSE 10 END) IS NOT NULL
          THEN GREATEST(0, (1.0 - (AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL
               THEN ra.brand_avg_position ELSE 10 END) - 1.0) / 9.0)) * 100 * 0.30
          ELSE 0
        END) +
        LEAST(15, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC /
         NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.15) +
        (CASE
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0
          THEN ((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 100 * 0.20
          ELSE 0
        END)
      ) AS lvi_score

    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.brand_name IN (SELECT ab.brand_name FROM all_brands ab)
      AND ra.analysis_date = (SELECT previous_day FROM date_ranges)
    GROUP BY ra.brand_name
  ),
  ranked_brands AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY cm.lvi_score DESC NULLS LAST)::INTEGER AS rank,
      cm.*,
      COALESCE(cm.lvi_score - pm.lvi_score, 0) AS lvi_change,
      COALESCE(cm.mention_rate - pm.mention_rate, 0) AS mention_rate_change,
      COALESCE(cm.avg_sentiment - pm.avg_sentiment, 0) AS sentiment_change,
      COALESCE(cm.avg_position - pm.avg_position, 0) AS avg_position_change,
      COALESCE(cm.avg_share_of_voice - pm.avg_share_of_voice, 0) AS share_of_voice_change,
      CASE WHEN pm.lvi_score > 0
        THEN ((cm.lvi_score - pm.lvi_score) / pm.lvi_score) * 100
        ELSE 0
      END AS lvi_change_pct,
      CASE WHEN pm.mention_rate > 0
        THEN ((cm.mention_rate - pm.mention_rate) / pm.mention_rate) * 100
        ELSE 0
      END AS mention_rate_change_pct,
      CASE WHEN pm.avg_sentiment <> 0
        THEN ((cm.avg_sentiment - pm.avg_sentiment) / NULLIF(ABS(pm.avg_sentiment), 0)) * 100
        ELSE 0
      END AS sentiment_change_pct,
      CASE WHEN pm.avg_position > 0
        THEN ((pm.avg_position - cm.avg_position) / pm.avg_position) * 100
        ELSE 0
      END AS avg_position_change_pct,
      CASE WHEN pm.avg_share_of_voice > 0
        THEN ((cm.avg_share_of_voice - pm.avg_share_of_voice) / pm.avg_share_of_voice) * 100
        ELSE 0
      END AS share_of_voice_change_pct
    FROM current_metrics cm
    LEFT JOIN previous_metrics pm ON cm.brand_name = pm.brand_name
  )
  SELECT
    rb.rank,
    rb.brand_name,
    rb.is_primary_brand AS is_primary,
    ROUND(COALESCE(rb.lvi_score, 0), 2) AS lvi_score,
    ROUND(COALESCE(rb.mention_rate, 0), 2) AS mention_rate,
    ROUND(COALESCE(rb.avg_position, 0), 2) AS avg_position,
    ROUND(COALESCE(rb.avg_sentiment, 0), 3) AS avg_sentiment,
    ROUND(COALESCE(rb.avg_share_of_voice, 0), 2) AS share_of_voice,
    ROUND(COALESCE(rb.citation_rate, 0), 2) AS citation_rate,
    rb.mention_count,
    rb.first_position_count,
    rb.total_responses,
    ROUND(COALESCE(rb.lvi_change, 0), 2) AS lvi_change,
    ROUND(COALESCE(rb.lvi_change_pct, 0), 2) AS lvi_change_pct,
    ROUND(COALESCE(rb.mention_rate_change, 0), 2) AS mention_rate_change,
    ROUND(COALESCE(rb.mention_rate_change_pct, 0), 2) AS mention_rate_change_pct,
    ROUND(COALESCE(rb.sentiment_change, 0), 3) AS sentiment_change,
    ROUND(COALESCE(rb.sentiment_change_pct, 0), 2) AS sentiment_change_pct,
    ROUND(COALESCE(rb.avg_position_change, 0), 2) AS avg_position_change,
    ROUND(COALESCE(rb.avg_position_change_pct, 0), 2) AS avg_position_change_pct,
    ROUND(COALESCE(rb.share_of_voice_change, 0), 2) AS share_of_voice_change,
    ROUND(COALESCE(rb.share_of_voice_change_pct, 0), 2) AS share_of_voice_change_pct
  FROM ranked_brands rb
  ORDER BY rb.rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_industry_rankings TO authenticated, service_role;
