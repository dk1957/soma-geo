-- Migration: Unify LVI calculations across all functions
-- Date: 2025-12-05
-- Description: Ensures consistent LVI calculation and metric display across:
--              - get_lvi_timeseries (used by main dashboard chart)
--              - get_industry_rankings (used by industry rankings table)
-- 
-- UNIFIED FORMULAS:
-- =================
-- 
-- LVI Score (0-100 scale):
--   (Visibility × 0.3) + (Citation × 0.3) + (Sentiment × 0.2) + (Position × 0.2)
--   
--   Where:
--   - Visibility = mention_rate (0-100%)
--   - Citation = citation_rate (0-100%)  
--   - Sentiment = ((avg_sentiment + 1) / 2) × 100 (converts -1..1 to 0-100)
--   - Position = 100 - ((avg_position - 1) × 5.26) (Position 1=100%, Position 20=0%)
--     Formula: 100 × (1 - (position - 1) / 19) ≈ 100 - ((position - 1) × 5.26)
--
-- Share of Voice (0-100%):
--   Brand Mentions / Total Brand Mentions × 100
--
-- Sentiment for DISPLAY:
--   Industry Rankings: 0-100 scale (showing as "77/100")
--   Main Chart: 0-10 scale (showing as "7.7")
--   Both derived from same -1 to 1 raw value
--
-- Position for DISPLAY:
--   Industry Rankings: Raw avg_position (e.g., 7.2)
--   Main Chart Position Score: 0-100% (e.g., 67.4%)

-- ============================================================================
-- FUNCTION: Get Industry Rankings (Updated with Unified LVI)
-- ============================================================================

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
      
      -- Sentiment (only for mentioned responses) - returns -1 to 1
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END) AS avg_sentiment,
      
      -- Share of Voice: brand mentions / total brand mentions × 100
      (SUM(ra.brand_mention_count)::NUMERIC / 
       NULLIF(SUM(ra.total_brand_mentions), 0)::NUMERIC) * 100 AS avg_share_of_voice,
      
      -- Citations
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      LEAST(100, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100) AS citation_rate,
      
      -- UNIFIED LVI Score: (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2), clamped 0-100
      LEAST(100,
        -- Visibility component: mention_rate × 0.3, capped at 30
        LEAST(30, (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.3) +
        
        -- Citation component: citation_rate × 0.3, capped at 30
        LEAST(30, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.3) +
        
        -- Sentiment component: normalize -1..1 to 0-100, then × 0.2 (0-20)
        (CASE 
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0 
          THEN ((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 100 * 0.2
          ELSE 0
        END) +
        
        -- Position component: (100 - ((pos - 1) × 5.26)) × 0.2 (0-20)
        (CASE 
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) IS NULL 
          THEN 0
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) <= 1 
          THEN 100 * 0.2
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) >= 20 
          THEN 0
          ELSE GREATEST(0, 100 - ((AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) - 1) * 5.26)) * 0.2
        END)
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
      
      (SUM(ra.brand_mention_count)::NUMERIC / 
       NULLIF(SUM(ra.total_brand_mentions), 0)::NUMERIC) * 100 AS avg_share_of_voice,
      
      -- Same unified LVI formula for previous period, with LEAST caps
      LEAST(100,
        LEAST(30, (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.3) +
        LEAST(30, (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.3) +
        (CASE 
          WHEN COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) > 0 
          THEN ((COALESCE(AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment END), 0) + 1) / 2) * 100 * 0.2
          ELSE 0
        END) +
        (CASE 
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) IS NULL 
          THEN 0
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) <= 1 
          THEN 100 * 0.2
          WHEN AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) >= 20 
          THEN 0
          ELSE GREATEST(0, 100 - ((AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL 
               THEN ra.brand_avg_position END) - 1) * 5.26)) * 0.2
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
    -- Return NULL for avg_position when no data (allows frontend to show "N/A")
    CASE WHEN rb.avg_position IS NULL OR rb.mention_count = 0 THEN NULL 
         ELSE ROUND(rb.avg_position, 2) END AS avg_position,
    ROUND(COALESCE(rb.avg_sentiment, 0), 3) AS avg_sentiment,
    ROUND(COALESCE(rb.avg_share_of_voice, 0), 2) AS share_of_voice,
    LEAST(100, ROUND(COALESCE(rb.citation_rate, 0), 2)) AS citation_rate,
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

COMMENT ON FUNCTION get_industry_rankings IS 'Get industry rankings with unified LVI calculation: (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2). Uses same formula as get_lvi_timeseries.';


-- ============================================================================
-- FUNCTION: Get LVI Timeseries (Updated - Aggregates across models per day)
-- ============================================================================
-- IMPORTANT: This version aggregates across all models for each day to match
-- the Industry Rankings calculation. It no longer returns per-model rows.
-- Instead, it returns one row per day per brand with properly aggregated LVI.

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
      -- No longer grouping by model - aggregate all models per day
      
      COUNT(*) as response_count,
      SUM(CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END) as mentions,
      SUM(CASE WHEN ra.brand_cited THEN 1 ELSE 0 END) as citations,
      AVG(CASE WHEN ra.brand_mentioned THEN ra.brand_sentiment ELSE NULL END) as avg_sent,
      AVG(CASE WHEN ra.brand_mentioned AND ra.brand_avg_position IS NOT NULL THEN ra.brand_avg_position ELSE NULL END) as avg_pos,
      -- For share of voice calculation
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
    
    -- UNIFIED LVI Calculation (same as get_industry_rankings)
    -- Formula: (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2)
    ROUND(
      (
        -- Visibility component: mention_rate × 0.3
        (COALESCE(CASE WHEN dm.response_count > 0 THEN dm.mentions::numeric / dm.response_count * 100 ELSE 0 END, 0) * 0.3) +
        
        -- Citation component: citation_rate × 0.3 (citations / mentions, not citations / responses)
        (COALESCE(CASE WHEN dm.mentions > 0 THEN dm.citations::numeric / dm.mentions * 100 ELSE 0 END, 0) * 0.3) +
        
        -- Sentiment component: normalize -1..1 to 0-100, then × 0.2
        (CASE 
          WHEN dm.mentions > 0 
          THEN ((COALESCE(dm.avg_sent, 0) + 1) / 2 * 100) * 0.2 
          ELSE 0 
        END) +
        
        -- Position component: (100 - ((pos - 1) × 5.26)) × 0.2
        -- Position 1 = 100%, Position 20 = 0%
        (CASE 
          WHEN dm.avg_pos IS NULL OR dm.mentions = 0 THEN 0
          WHEN dm.avg_pos <= 1 THEN 100 * 0.2
          WHEN dm.avg_pos >= 20 THEN 0
          ELSE GREATEST(0, 100 - ((dm.avg_pos - 1) * 5.26)) * 0.2
        END)
      ),
      2
    ) as lvi_score,
    
    -- Mention rate (visibility)
    (CASE WHEN dm.response_count > 0 THEN (dm.mentions::numeric / dm.response_count * 100) ELSE 0 END)::NUMERIC(5,2) as mention_rate,
    
    -- Citation rate (citations / mentions, not citations / responses)
    (CASE WHEN dm.mentions > 0 THEN (dm.citations::numeric / dm.mentions * 100) ELSE 0 END)::NUMERIC(5,2) as citation_rate,
    
    -- Share of Voice: Brand Mentions / Total Brand Mentions × 100
    ROUND(
      CASE 
        WHEN dm.total_brand_mention_sum > 0 THEN (dm.brand_mention_sum::numeric / dm.total_brand_mention_sum * 100)
        ELSE 0 
      END,
      2
    )::NUMERIC(5,2) as share_of_voice,
    
    -- Sentiment: raw -1 to 1 value (frontend converts for display)
    COALESCE(dm.avg_sent, 0)::NUMERIC(3,2) as avg_sentiment,
    
    -- Position: return NULL if no position data
    dm.avg_pos::NUMERIC(5,2) as avg_position,
    
    dm.response_count as total_responses,
    dm.mentions as mention_count,
    dm.citations as citation_count,
    dm.brand_name,
    dm.is_primary_brand as is_primary,
    -- Return NULL for model_name since we're aggregating across all models
    NULL::TEXT as model_name
  FROM daily_metrics dm
  ORDER BY dm.analysis_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_lvi_timeseries IS 'Get daily LVI timeseries data with unified calculation: (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2). Same formula as get_industry_rankings.';

GRANT EXECUTE ON FUNCTION get_lvi_timeseries TO authenticated, service_role;


-- ============================================================================
-- Documentation: Unified Metrics Reference
-- ============================================================================
/*

## UNIFIED METRIC CALCULATIONS
==============================

### LVI Score (0-100)
Formula: (Visibility × 0.3) + (Citation × 0.3) + (Sentiment × 0.2) + (Position × 0.2)

Components:
- Visibility: mention_rate (0-100%)
- Citation: citation_rate (0-100%)
- Sentiment: ((avg_sentiment + 1) / 2) × 100 (converts -1..1 to 0-100)
- Position: 100 - ((avg_position - 1) × 5.26) (Position 1=100%, Position 20=0%)

### Position Score for Charts
Formula: 100 × (1 - (position - 1) / 19)
- Position 1 → 100%
- Position 5 → 78.9%
- Position 10 → 52.6%
- Position 15 → 26.3%
- Position 20 → 0%

Simplified: 100 - ((position - 1) × 5.26)

### Sentiment Display
- Raw value from DB: -1 to 1
- Industry Rankings: ((sentiment + 1) × 50) = 0-100 scale (shows "77/100")
- Main Chart: ((sentiment + 1) × 5) = 0-10 scale (shows "7.7")

### Share of Voice
Formula: (Brand Mentions / Total Brand Mentions) × 100
- Calculated per response, then averaged across period

*/

