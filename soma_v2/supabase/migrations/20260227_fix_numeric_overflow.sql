-- Fix numeric field overflow in get_brand_stats and get_lvi_timeseries
-- Root cause: citation_rate = citations/mentions*100 can exceed 999.99 (NUMERIC(5,2) max)
-- when a brand has more citation-marked responses than mention-marked responses.
-- Fix: Cap all rates at 100%, widen NUMERIC types, and cap LVI components.

-- ============================================================================
-- Fix get_brand_stats
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_brand_stats(
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
    
    -- LVI Score: (Visibility*30) + (Citation*30) + (Sentiment*20) + (Position*20) = MAX 100
    CASE WHEN bm.mention_cnt = 0 THEN 0.00
    ELSE ROUND(
      (
        -- Visibility component: mentions / total_responses * 30 (max 30)
        LEAST(30, CASE WHEN bm.response_cnt > 0 THEN bm.mention_cnt::numeric / bm.response_cnt ELSE 0 END * 30) +
        -- Citation component: citations / mentions * 30 (capped at 30)
        LEAST(30, CASE WHEN bm.mention_cnt > 0 THEN bm.citation_cnt::numeric / bm.mention_cnt ELSE 0 END * 30) +
        -- Sentiment component: normalized -1 to 1 → 0 to 20 (max 20)
        (((COALESCE(bm.avg_sent, 0) + 1) / 2) * 20) +
        -- Position component: 10/avg_pos * 2, capped at 20 (max 20)
        LEAST(20, CASE 
          WHEN bm.avg_pos IS NULL OR bm.avg_pos = 0 THEN 0
          ELSE (10.0 / bm.avg_pos) * 2
        END)
      ),
      2
    )
    END as lvi_score,
    
    -- mention_rate: capped at 100, wider NUMERIC
    LEAST(100, CASE WHEN bm.response_cnt > 0 THEN (bm.mention_cnt::numeric / bm.response_cnt * 100) ELSE 0 END)::NUMERIC(7,2) as mention_rate,
    -- citation_rate: capped at 100, wider NUMERIC (citations should logically not exceed mentions)
    LEAST(100, CASE WHEN bm.mention_cnt > 0 THEN (bm.citation_cnt::numeric / bm.mention_cnt * 100) ELSE 0 END)::NUMERIC(7,2) as citation_rate,
    -- Share of Voice
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
-- Fix get_lvi_timeseries
-- ============================================================================
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
  brand_name VARCHAR,
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
      
      COUNT(*) as response_count,
      SUM(CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END) as mentions,
      SUM(CASE WHEN ra.brand_cited THEN 1 ELSE 0 END) as citations,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as avg_sent,
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL THEN ra.brand_avg_position ELSE NULL END) as avg_pos,
      SUM(ra.brand_mention_count) as brand_mention_sum,
      SUM(ra.total_brand_mentions) as total_brand_mention_sum
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.analyzed_at) BETWEEN p_start_date AND p_end_date
      AND (p_model_name IS NULL OR ra.model_name = p_model_name)
      AND (p_include_competitors OR ra.is_primary_brand = TRUE)
    GROUP BY DATE(ra.analyzed_at), ra.brand_name, ra.is_primary_brand
  )
  SELECT
    dm.analysis_date as metric_date,
    
    -- LVI Score with capped components
    ROUND(
      (
        -- Visibility: mention_rate * 0.3 (capped at 30)
        LEAST(30, COALESCE(CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.3) +
        -- Citation: citation_rate * 0.3 (capped at 30)
        LEAST(30, COALESCE(CASE WHEN dm.mentions > 0 THEN dm.citations::numeric / dm.mentions * 100 ELSE 0 END, 0) * 0.3) +
        -- Sentiment: normalized 0-100 * 0.2 (capped at 20)
        (CASE 
          WHEN dm.mentions > 0 
          THEN ((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.2 
          ELSE 0 
        END) +
        -- Position component
        (CASE 
          WHEN dm.avg_pos IS NULL OR dm.mentions = 0 THEN 0
          WHEN dm.avg_pos <= 1 THEN 100 * 0.2
          WHEN dm.avg_pos >= 20 THEN 0
          ELSE GREATEST(0, 100 - ((dm.avg_pos - 1) * 5.26)) * 0.2
        END)
      ),
      2
    ) as lvi_score,
    
    -- Rates capped at 100 with wider NUMERIC
    LEAST(100, CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(7,2) as mention_rate,
    LEAST(100, CASE WHEN dm.mentions > 0 THEN (dm.citations::numeric / dm.mentions * 100) ELSE 0 END)::NUMERIC(7,2) as citation_rate,
    ROUND(
      CASE 
        WHEN dm.total_brand_mention_sum > 0 THEN (dm.brand_mention_sum::numeric / dm.total_brand_mention_sum * 100)
        ELSE 0 
      END,
      2
    )::NUMERIC(7,2) as share_of_voice,
    COALESCE(dm.avg_sent, 0)::NUMERIC(5,2) as avg_sentiment,
    dm.avg_pos::NUMERIC(7,2) as avg_position,
    dm.response_count as total_responses,
    dm.mentions as mention_count,
    dm.citations as citation_count,
    dm.brand_name,
    dm.is_primary_brand as is_primary,
    NULL::TEXT as model_name
  FROM daily_metrics dm
  ORDER BY dm.analysis_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================================
-- Re-grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;
