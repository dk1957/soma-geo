-- ============================================================================
-- Database Functions for Report Data APIs (FIXED for actual schema)
-- ============================================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_lvi_timeseries CASCADE;
DROP FUNCTION IF EXISTS get_brand_stats CASCADE;
DROP FUNCTION IF EXISTS get_prompt_performance CASCADE;
DROP FUNCTION IF EXISTS refresh_brand_metrics CASCADE;

-- ============================================================================
-- FUNCTION: Get LVI Timeseries Data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lvi_timeseries(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  metric_date DATE,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  citation_rate NUMERIC,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  total_responses BIGINT,
  mention_count BIGINT,
  citation_count BIGINT,
  brand_name TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_metrics AS (
    SELECT
      DATE(ra.created_at) as analysis_date,
      ra.brand_name,
      ra.is_primary_brand,
      
      COUNT(*) as response_count,
      SUM(CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END) as mentions,
      SUM(CASE WHEN ra.brand_cited THEN 1 ELSE 0 END) as citations,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as avg_sent,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE NULL END) as avg_pos
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(ra.created_at), ra.brand_name, ra.is_primary_brand
  )
  SELECT
    dm.analysis_date as metric_date,
    -- LVI Calculation: (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)
    (
      ((CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count ELSE 0 END) * 30) +
      ((CASE WHEN dm.response_count > 0 THEN dm.citations::numeric / dm.response_count ELSE 0 END) * 30) +
      (((COALESCE(dm.avg_sent, 0) + 1) / 2) * 20) +  -- Convert -1,1 to 0,1 then to 0-20
      ((CASE WHEN COALESCE(dm.avg_pos, 0) > 0 THEN (10.0 / dm.avg_pos) * 2 ELSE 0 END)) -- Position score
    )::NUMERIC(5,2) as lvi_score,
    
    (CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    (CASE WHEN dm.response_count > 0 THEN (dm.citations::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    COALESCE(dm.avg_pos, 0)::NUMERIC(5,2) as avg_position,
    dm.response_count as total_responses,
    dm.mentions as mention_count,
    dm.citations as citation_count,
    dm.brand_name,
    dm.is_primary_brand as is_primary
  FROM daily_metrics dm
  ORDER BY dm.analysis_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI timeseries data for charts and trend analysis';

-- ============================================================================
-- FUNCTION: Get Brand Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_brand_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  citation_count BIGINT,
  avg_sentiment NUMERIC,
  avg_position NUMERIC,
  total_responses BIGINT,
  mention_count BIGINT,
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
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_avg_position ELSE NULL END) as avg_pos
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.created_at) BETWEEN v_start_date AND v_end_date
    GROUP BY ra.brand_id, ra.brand_name, ra.is_primary_brand
  )
  SELECT
    bm.b_id as brand_id,
    bm.b_name as brand_name,
    bm.is_prim as is_primary,
    
    -- LVI Score
    (
      ((CASE WHEN bm.response_cnt > 0 THEN bm.mention_cnt::numeric / bm.response_cnt ELSE 0 END) * 30) +
      ((CASE WHEN bm.response_cnt > 0 THEN bm.citation_cnt::numeric / bm.response_cnt ELSE 0 END) * 30) +
      (((COALESCE(bm.avg_sent, 0) + 1) / 2) * 20) +
      ((CASE WHEN COALESCE(bm.avg_pos, 0) > 0 THEN (10.0 / bm.avg_pos) * 2 ELSE 0 END))
    )::NUMERIC(5,2) as lvi_score,
    
    (CASE WHEN bm.response_cnt > 0 THEN (bm.mention_cnt::numeric / bm.response_cnt * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    bm.citation_cnt as citation_count,
    COALESCE(bm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    COALESCE(bm.avg_pos, 0)::NUMERIC(5,2) as avg_position,
    bm.response_cnt as total_responses,
    bm.mention_cnt as mention_count,
    v_start_date as period_start,
    v_end_date as period_end
  FROM brand_metrics bm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_brand_stats IS 'Get aggregated brand statistics for a time period';

-- ============================================================================
-- FUNCTION: Get Prompt Performance
-- ============================================================================

CREATE OR REPLACE FUNCTION get_prompt_performance(
  p_account_id UUID,
  p_brand_id UUID,
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  prompt_id TEXT,
  prompt_text TEXT,
  prompt_category TEXT,
  total_responses BIGINT,
  primary_mention_count BIGINT,
  primary_citation_count BIGINT,
  primary_avg_sentiment NUMERIC,
  primary_avg_position NUMERIC,
  competitor_mention_count BIGINT,
  opportunity_score NUMERIC
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
    ELSE v_end_date - INTERVAL '30 days'
  END;

  RETURN QUERY
  WITH prompt_metrics AS (
    SELECT
      ra.prompt_id as p_id,
      ra.prompt_text as p_text,
      'general'::TEXT as p_category, -- Can be enhanced with prompt categorization
      
      COUNT(*) as total_resp,
      SUM(CASE WHEN ra.is_primary_brand AND ra.brand_mentioned THEN 1 ELSE 0 END) as primary_mentions,
      SUM(CASE WHEN ra.is_primary_brand AND ra.brand_cited THEN 1 ELSE 0 END) as primary_citations,
      AVG(CASE WHEN ra.is_primary_brand AND ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as primary_sent,
      AVG(CASE WHEN ra.is_primary_brand AND ra.brand_mentioned THEN ra.brand_avg_position ELSE NULL END) as primary_pos,
      SUM(CASE WHEN NOT ra.is_primary_brand AND ra.brand_mentioned THEN 1 ELSE 0 END) as competitor_mentions
      
    FROM response_analysis ra
    WHERE ra.account_id = p_account_id
      AND (ra.brand_id = p_brand_id OR ra.primary_brand_id = p_brand_id)
      AND DATE(ra.created_at) BETWEEN v_start_date AND v_end_date
    GROUP BY ra.prompt_id, ra.prompt_text
  )
  SELECT
    pm.p_id as prompt_id,
    pm.p_text as prompt_text,
    pm.p_category as prompt_category,
    pm.total_resp as total_responses,
    pm.primary_mentions as primary_mention_count,
    pm.primary_citations as primary_citation_count,
    COALESCE(pm.primary_sent, 0)::NUMERIC(3,2) as primary_avg_sentiment,
    COALESCE(pm.primary_pos, 0)::NUMERIC(5,2) as primary_avg_position,
    pm.competitor_mentions as competitor_mention_count,
    
    -- Opportunity score: High competitor mentions + Low primary mentions = Opportunity
    (
      CASE 
        WHEN pm.competitor_mentions > 0 AND pm.primary_mentions = 0 THEN 100
        WHEN pm.competitor_mentions > pm.primary_mentions THEN 
          (pm.competitor_mentions::numeric / (pm.primary_mentions + 1) * 50)::NUMERIC(5,2)
        ELSE 0
      END
    ) as opportunity_score
  FROM prompt_metrics pm
  ORDER BY opportunity_score DESC, pm.total_resp DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_prompt_performance IS 'Get prompt-level performance metrics and opportunity analysis';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_brand_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_prompt_performance TO authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  Report Data API Functions Created Successfully (Fixed)
  ============================================================================
  
  Functions:
  - get_lvi_timeseries(account_id, brand_id, start_date, end_date)
  - get_brand_stats(account_id, brand_id, period)
  - get_prompt_performance(account_id, brand_id, period)
  
  Usage Examples:
  SELECT * FROM get_lvi_timeseries(''account-uuid''::uuid, ''brand-uuid''::uuid);
  SELECT * FROM get_brand_stats(''account-uuid''::uuid, ''brand-uuid''::uuid, ''30d'');
  SELECT * FROM get_prompt_performance(''account-uuid''::uuid, ''brand-uuid''::uuid, ''30d'');
  
  ============================================================================
  ';
END $$;
