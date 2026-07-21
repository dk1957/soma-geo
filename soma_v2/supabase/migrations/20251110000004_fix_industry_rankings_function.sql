-- Fix get_industry_rankings to use analysis_date and pull ALL brands (primary + competitors)
-- This function aggregates brand performance metrics for industry rankings

DROP FUNCTION IF EXISTS get_industry_rankings(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER);
DROP FUNCTION IF EXISTS get_industry_rankings(UUID, UUID, DATE, DATE, INTEGER);

CREATE OR REPLACE FUNCTION get_industry_rankings(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 10
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
  -- Get ALL brands mentioned in responses for this primary brand
  all_brands AS (
    SELECT DISTINCT ra.brand_name
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
  ),
  -- Current period metrics
  current_metrics AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      
      -- Response counts
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      
      -- Mention rate (percentage of responses where brand was mentioned)
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      
      -- Position metrics (only for mentioned responses)
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
          THEN ra.brand_avg_position END) AS avg_position,
      COUNT(CASE WHEN ra.brand_avg_position <= 1.5 THEN 1 END) AS first_position_count,
      
      -- Sentiment (only for mentioned responses)
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END) AS avg_sentiment,
      
      -- Share of Voice (average across responses)
      AVG(CASE WHEN ra.share_of_voice IS NOT NULL THEN ra.share_of_voice ELSE 0 END) AS avg_share_of_voice,
      
      -- Citations
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 AS citation_rate,
      
      -- LVI Score calculation: (Visibility*30) + (Citation*30) + (Sentiment*20) + (Position*20)
      (
        -- Visibility component (mentions / total_responses)
        ((COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 30) +
        
        -- Citation component (citations / mentions)
        ((COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 30) +
        
        -- Sentiment component (normalize -1 to 1 → 0 to 20)
        (((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 20) +
        
        -- Position component (10 / avg_position * 2, capped at 20)
        LEAST(20, (10.0 / NULLIF(AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
          THEN ra.brand_avg_position END), 0)) * 2)
      ) AS lvi_score
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.brand_name IN (SELECT ab.brand_name FROM all_brands ab)
      AND ra.analysis_date >= (SELECT current_start FROM date_ranges)
      AND ra.analysis_date <= (SELECT current_end FROM date_ranges)
    GROUP BY ra.brand_name, ra.is_primary_brand
  ),
  -- Previous day metrics for day-by-day comparison
  previous_metrics AS (
    SELECT 
      ra.brand_name,
      
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
          THEN ra.brand_avg_position END) AS avg_position,
      
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END) AS avg_sentiment,
      
      AVG(CASE WHEN ra.share_of_voice IS NOT NULL THEN ra.share_of_voice ELSE 0 END) AS avg_share_of_voice,
      
      (
        ((COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 30) +
        ((COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 30) +
        (((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 20) +
        LEAST(20, (10.0 / NULLIF(AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
          THEN ra.brand_avg_position END), 0)) * 2)
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
      -- Calculate absolute changes
      COALESCE(cm.lvi_score - pm.lvi_score, 0) AS lvi_change,
      COALESCE(cm.mention_rate - pm.mention_rate, 0) AS mention_rate_change,
      COALESCE(cm.avg_sentiment - pm.avg_sentiment, 0) AS sentiment_change,
      COALESCE(cm.avg_position - pm.avg_position, 0) AS avg_position_change,
      COALESCE(cm.avg_share_of_voice - pm.avg_share_of_voice, 0) AS share_of_voice_change,
      -- Calculate percentage changes
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

GRANT EXECUTE ON FUNCTION get_industry_rankings TO authenticated;

COMMENT ON FUNCTION get_industry_rankings IS 'Get industry rankings with LVI scores for primary brand and ALL competing brands mentioned. Includes day-by-day change metrics.';

-- Example usage:
-- SELECT * FROM get_industry_rankings(
--   'account-uuid'::UUID, 
--   'brand-uuid'::UUID, 
--   CURRENT_DATE - INTERVAL '30 days', 
--   CURRENT_DATE, 
--   10
-- );
