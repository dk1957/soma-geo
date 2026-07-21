-- =====================================================
-- IMPROVED BRAND METRICS SYSTEM
-- =====================================================
-- This migration creates:
-- 1. Improved LVI calculation function with accurate formula
-- 2. New materialized view for brand metrics by model/date
-- 3. Functions for aggregated metrics by time period
-- 4. Support for filtering by brand, model, and date
-- =====================================================

-- Drop existing materialized views to recreate with better structure
DROP MATERIALIZED VIEW IF EXISTS daily_brand_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_analysis_daily CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_analysis_weekly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_analysis_monthly CASCADE;

-- =====================================================
-- 1. IMPROVED LVI CALCULATION FUNCTION
-- =====================================================
-- Formula: LVI = (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)
-- All components normalized to 0-100 scale

CREATE OR REPLACE FUNCTION calculate_lvi_score_v2(
  p_visibility_score NUMERIC,  -- 0-1 (1 = mentioned, 0 = not mentioned)
  p_citation_rate NUMERIC,     -- 0-1 (citations / total_sources)
  p_sentiment_score NUMERIC,   -- -1 to 1
  p_position_score NUMERIC     -- 0-1 (1 = first position, 0 = last/not mentioned)
) RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_visibility_component NUMERIC;
  v_citation_component NUMERIC;
  v_sentiment_component NUMERIC;
  v_position_component NUMERIC;
BEGIN
  -- Normalize all components to 0-100 scale
  
  -- Visibility: 0-1 → 0-100
  v_visibility_component := COALESCE(p_visibility_score, 0) * 100;
  
  -- Citation: 0-1 → 0-100
  v_citation_component := COALESCE(p_citation_rate, 0) * 100;
  
  -- Sentiment: -1 to 1 → 0 to 100
  v_sentiment_component := ((COALESCE(p_sentiment_score, 0) + 1) / 2) * 100;
  
  -- Position: 0-1 → 0-100
  v_position_component := COALESCE(p_position_score, 0) * 100;
  
  -- Calculate weighted LVI
  RETURN ROUND(
    (v_visibility_component * 0.3) +
    (v_citation_component * 0.3) +
    (v_sentiment_component * 0.2) +
    (v_position_component * 0.2),
    2
  );
END;
$$;

-- =====================================================
-- 2. HELPER FUNCTION: Calculate position score
-- =====================================================
-- Converts raw position (1, 2, 3...) to normalized score (1 = first = best)

CREATE OR REPLACE FUNCTION calculate_position_score(
  p_first_position INTEGER,
  p_total_brands INTEGER
) RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_first_position IS NULL OR p_total_brands IS NULL OR p_total_brands = 0 THEN
    RETURN 0;
  END IF;
  
  -- Position 1 = score 1.0, last position = score approaching 0
  -- Formula: 1 - ((position - 1) / total_brands)
  RETURN GREATEST(0, 1 - ((p_first_position - 1)::NUMERIC / GREATEST(p_total_brands, 1)));
END;
$$;

-- =====================================================
-- 3. MAIN MATERIALIZED VIEW: Brand Metrics Per Response
-- =====================================================
-- Granular view at response level for maximum flexibility

CREATE MATERIALIZED VIEW mv_brand_response_metrics AS
WITH response_totals AS (
  -- Get total sources per response for citation rate calculation
  SELECT 
    response_id,
    MAX(COALESCE(jsonb_array_length(all_sources_in_response), 0)) as total_sources_in_response
  FROM response_analysis
  GROUP BY response_id
)
SELECT 
  ra.id as analysis_id,
  ra.response_id,
  ra.simulation_id,
  ra.account_id,
  ra.brand_id,
  ra.primary_brand_id,
  ra.competitor_id,
  ra.brand_name,
  ra.is_primary_brand,
  ra.prompt_id,
  ra.model_name,
  ra.model_provider,
  ra.analysis_date,
  DATE_TRUNC('week', ra.analyzed_at)::DATE as analysis_week,
  DATE_TRUNC('month', ra.analyzed_at)::DATE as analysis_month,
  ra.analyzed_at,
  
  -- Core metrics (raw)
  ra.brand_mentioned,
  ra.brand_mention_count,
  ra.total_brand_mentions,
  ra.total_brands_mentioned,
  ra.brand_first_position,
  ra.brand_avg_position,
  ra.brand_sentiment,
  ra.sentiment_category,
  ra.brand_cited,
  ra.brand_citation_count,
  ra.share_of_voice,
  COALESCE(rt.total_sources_in_response, 0) as total_sources_in_response,
  
  -- Calculated scores (0-1 scale)
  CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END::NUMERIC as visibility_score,
  
  CASE 
    WHEN rt.total_sources_in_response > 0 
    THEN COALESCE(ra.brand_citation_count, 0)::NUMERIC / rt.total_sources_in_response
    ELSE 0 
  END as citation_rate,
  
  COALESCE(ra.brand_sentiment, 0) as sentiment_score,
  
  calculate_position_score(
    ra.brand_first_position,
    ra.total_brands_mentioned
  ) as position_score,
  
  -- LVI Score (0-100)
  calculate_lvi_score_v2(
    CASE WHEN ra.brand_mentioned THEN 1 ELSE 0 END,
    CASE 
      WHEN rt.total_sources_in_response > 0 
      THEN COALESCE(ra.brand_citation_count, 0)::NUMERIC / rt.total_sources_in_response
      ELSE 0 
    END,
    COALESCE(ra.brand_sentiment, 0),
    calculate_position_score(ra.brand_first_position, ra.total_brands_mentioned)
  ) as lvi_score,
  
  -- Additional metrics
  ra.factual_claims_made,
  ra.factual_claims_correct,
  ra.factual_accuracy_rate,
  ra.response_completeness,
  ra.response_word_count,
  ra.competitive_positioning

FROM response_analysis ra
LEFT JOIN response_totals rt ON ra.response_id = rt.response_id;

-- Indexes for the response-level view
CREATE UNIQUE INDEX idx_mv_brand_response_unique ON mv_brand_response_metrics(analysis_id);
CREATE INDEX idx_mv_brand_response_account_date ON mv_brand_response_metrics(account_id, analysis_date DESC);
CREATE INDEX idx_mv_brand_response_brand ON mv_brand_response_metrics(brand_id, analysis_date DESC);
CREATE INDEX idx_mv_brand_response_model ON mv_brand_response_metrics(model_name, analysis_date DESC);
CREATE INDEX idx_mv_brand_response_primary ON mv_brand_response_metrics(primary_brand_id, is_primary_brand, analysis_date DESC);

-- =====================================================
-- 4. AGGREGATED VIEW: Daily Metrics by Brand and Model
-- =====================================================
-- This is the main view for dashboard queries
-- IMPORTANT: Uses brand_id (not primary_brand_id) as the link between primary and competitors

CREATE MATERIALIZED VIEW mv_daily_brand_model_metrics AS
SELECT 
  -- Identifiers
  CASE 
    WHEN is_primary_brand = true THEN brand_id
    ELSE competitor_id
  END as entity_id,  -- Unique brand identifier
  brand_id as primary_brand_id,  -- Link to primary brand for BOTH primary and competitors
  competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  brand_id,
  model_name,
  analysis_date,
  
  -- Response counts
  COUNT(DISTINCT response_id) as total_responses,
  COUNT(DISTINCT prompt_id) as total_prompts,
  
  -- Visibility metrics
  SUM(CASE WHEN brand_mentioned THEN 1 ELSE 0 END) as mention_count,
  COUNT(*) as total_analyses,
  ROUND(AVG(visibility_score), 4) as avg_visibility_score,
  
  -- Citation metrics
  SUM(CASE WHEN brand_cited THEN 1 ELSE 0 END) as citation_count,
  SUM(brand_citation_count) as total_citations,
  ROUND(AVG(citation_rate), 4) as avg_citation_rate,
  
  -- Sentiment metrics
  ROUND(AVG(CASE WHEN brand_mentioned THEN sentiment_score END), 4) as avg_sentiment_score,
  SUM(CASE WHEN sentiment_category = 'positive' THEN 1 ELSE 0 END) as positive_count,
  SUM(CASE WHEN sentiment_category = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
  SUM(CASE WHEN sentiment_category = 'negative' THEN 1 ELSE 0 END) as negative_count,
  
  -- Position metrics
  ROUND(AVG(CASE WHEN brand_mentioned AND brand_first_position IS NOT NULL THEN position_score END), 4) as avg_position_score,
  MIN(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL) as best_position,
  MAX(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL) as worst_position,
  ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2) as avg_raw_position,
  
  -- Share of Voice
  ROUND(AVG(COALESCE(share_of_voice, 0)), 2) as avg_share_of_voice,
  
  -- LVI Score (averaged)
  ROUND(AVG(lvi_score), 2) as avg_lvi_score,
  MIN(lvi_score) as min_lvi_score,
  MAX(lvi_score) as max_lvi_score,
  
  -- Factual accuracy
  SUM(factual_claims_made) as total_factual_claims,
  SUM(factual_claims_correct) as correct_factual_claims,
  ROUND(
    CASE 
      WHEN SUM(factual_claims_made) > 0 
      THEN SUM(factual_claims_correct)::NUMERIC / SUM(factual_claims_made) * 100
      ELSE 0 
    END, 2
  ) as factual_accuracy_pct,
  
  -- Metadata
  MAX(analyzed_at) as last_analyzed,
  NOW() as materialized_at

FROM mv_brand_response_metrics
GROUP BY 
  COALESCE(competitor_id, primary_brand_id),
  primary_brand_id,
  competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  brand_id,
  model_name,
  analysis_date;

-- Indexes for daily metrics
CREATE UNIQUE INDEX idx_mv_daily_unique ON mv_daily_brand_model_metrics(entity_id, model_name, analysis_date, account_id);
CREATE INDEX idx_mv_daily_account ON mv_daily_brand_model_metrics(account_id, analysis_date DESC);
CREATE INDEX idx_mv_daily_primary_brand ON mv_daily_brand_model_metrics(primary_brand_id, analysis_date DESC);
CREATE INDEX idx_mv_daily_model ON mv_daily_brand_model_metrics(model_name, analysis_date DESC);
CREATE INDEX idx_mv_daily_brand_name ON mv_daily_brand_model_metrics(brand_name, analysis_date DESC);

-- =====================================================
-- 5. AGGREGATED VIEW: Daily Metrics by Brand (All Models)
-- =====================================================
-- For when user wants to see all models combined

CREATE MATERIALIZED VIEW mv_daily_brand_metrics_all_models AS
SELECT 
  entity_id,
  primary_brand_id,
  competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  brand_id,
  'all_models' as model_name,
  analysis_date,
  
  -- Aggregated counts
  SUM(total_responses) as total_responses,
  SUM(total_prompts) as total_prompts,
  SUM(mention_count) as mention_count,
  SUM(total_analyses) as total_analyses,
  
  -- Weighted averages
  ROUND(
    SUM(avg_visibility_score * total_analyses) / NULLIF(SUM(total_analyses), 0),
    4
  ) as avg_visibility_score,
  
  SUM(citation_count) as citation_count,
  SUM(total_citations) as total_citations,
  ROUND(
    SUM(avg_citation_rate * total_analyses) / NULLIF(SUM(total_analyses), 0),
    4
  ) as avg_citation_rate,
  
  ROUND(
    SUM(avg_sentiment_score * mention_count) / NULLIF(SUM(mention_count), 0),
    4
  ) as avg_sentiment_score,
  SUM(positive_count) as positive_count,
  SUM(neutral_count) as neutral_count,
  SUM(negative_count) as negative_count,
  
  ROUND(
    SUM(avg_position_score * mention_count) / NULLIF(SUM(mention_count), 0),
    4
  ) as avg_position_score,
  MIN(best_position) as best_position,
  MAX(worst_position) as worst_position,
  ROUND(
    SUM(avg_raw_position * mention_count) / NULLIF(SUM(mention_count), 0),
    2
  ) as avg_raw_position,
  
  ROUND(
    SUM(avg_share_of_voice * total_analyses) / NULLIF(SUM(total_analyses), 0),
    2
  ) as avg_share_of_voice,
  
  -- LVI Score (weighted by total_analyses)
  ROUND(
    SUM(avg_lvi_score * total_analyses) / NULLIF(SUM(total_analyses), 0),
    2
  ) as avg_lvi_score,
  MIN(min_lvi_score) as min_lvi_score,
  MAX(max_lvi_score) as max_lvi_score,
  
  SUM(total_factual_claims) as total_factual_claims,
  SUM(correct_factual_claims) as correct_factual_claims,
  ROUND(
    CASE 
      WHEN SUM(total_factual_claims) > 0 
      THEN SUM(correct_factual_claims)::NUMERIC / SUM(total_factual_claims) * 100
      ELSE 0 
    END, 2
  ) as factual_accuracy_pct,
  
  MAX(last_analyzed) as last_analyzed,
  NOW() as materialized_at

FROM mv_daily_brand_model_metrics
GROUP BY 
  entity_id,
  primary_brand_id,
  competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  brand_id,
  analysis_date;

CREATE UNIQUE INDEX idx_mv_daily_all_models_unique ON mv_daily_brand_metrics_all_models(entity_id, analysis_date, account_id);
CREATE INDEX idx_mv_daily_all_models_primary ON mv_daily_brand_metrics_all_models(primary_brand_id, analysis_date DESC);

-- =====================================================
-- 6. FUNCTION: Get Brand Metrics with Flexible Aggregation
-- =====================================================

CREATE OR REPLACE FUNCTION get_brand_metrics(
  p_account_id UUID,
  p_primary_brand_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_model_name TEXT DEFAULT NULL,
  p_aggregation TEXT DEFAULT 'daily',  -- 'daily', 'weekly', 'monthly', 'all'
  p_brand_filter TEXT DEFAULT 'all'    -- 'all', 'primary', 'competitors', or specific brand_name
)
RETURNS TABLE (
  period_date DATE,
  entity_id UUID,
  brand_name TEXT,
  is_primary_brand BOOLEAN,
  model_name TEXT,
  
  -- Core metrics
  total_responses BIGINT,
  total_analyses BIGINT,
  
  -- 5 Key Scores (0-1 or 0-100 scale)
  visibility_score NUMERIC,
  citation_rate NUMERIC,
  sentiment_score NUMERIC,
  position_score NUMERIC,
  share_of_voice NUMERIC,
  lvi_score NUMERIC,
  
  -- Supporting metrics
  mention_count BIGINT,
  citation_count BIGINT,
  avg_raw_position NUMERIC,
  positive_sentiment_count BIGINT,
  negative_sentiment_count BIGINT,
  
  -- Changes (for trends)
  lvi_change NUMERIC,
  visibility_change NUMERIC,
  sentiment_change NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_trunc TEXT;
BEGIN
  -- Determine date truncation based on aggregation
  v_date_trunc := CASE p_aggregation
    WHEN 'weekly' THEN 'week'
    WHEN 'monthly' THEN 'month'
    WHEN 'all' THEN 'year'  -- Will aggregate all
    ELSE 'day'
  END;

  RETURN QUERY
  WITH base_metrics AS (
    SELECT 
      DATE_TRUNC(v_date_trunc, m.analysis_date)::DATE as period_date,
      m.entity_id,
      m.brand_name,
      m.is_primary_brand,
      CASE WHEN p_model_name IS NULL THEN 'all_models' ELSE m.model_name END as model_name,
      
      SUM(m.total_responses) as total_responses,
      SUM(m.total_analyses) as total_analyses,
      SUM(m.mention_count) as mention_count,
      SUM(m.citation_count) as citation_count,
      
      -- Weighted averages
      ROUND(SUM(m.avg_visibility_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as visibility_score,
      ROUND(SUM(m.avg_citation_rate * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as citation_rate,
      ROUND(SUM(m.avg_sentiment_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as sentiment_score,
      ROUND(SUM(m.avg_position_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as position_score,
      ROUND(SUM(m.avg_share_of_voice * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as share_of_voice,
      ROUND(SUM(m.avg_lvi_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as lvi_score,
      
      ROUND(SUM(m.avg_raw_position * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 2) as avg_raw_position,
      SUM(m.positive_count) as positive_sentiment_count,
      SUM(m.negative_count) as negative_sentiment_count
      
    FROM mv_daily_brand_model_metrics m
    WHERE m.account_id = p_account_id
      AND m.primary_brand_id = p_primary_brand_id
      AND (p_start_date IS NULL OR m.analysis_date >= p_start_date)
      AND (p_end_date IS NULL OR m.analysis_date <= p_end_date)
      AND (p_model_name IS NULL OR m.model_name = p_model_name)
      AND (
        p_brand_filter = 'all' 
        OR (p_brand_filter = 'primary' AND m.is_primary_brand = true)
        OR (p_brand_filter = 'competitors' AND m.is_primary_brand = false)
        OR m.brand_name = p_brand_filter
      )
    GROUP BY 
      DATE_TRUNC(v_date_trunc, m.analysis_date)::DATE,
      m.entity_id,
      m.brand_name,
      m.is_primary_brand,
      CASE WHEN p_model_name IS NULL THEN 'all_models' ELSE m.model_name END
  ),
  with_changes AS (
    SELECT 
      b.*,
      b.lvi_score - LAG(b.lvi_score) OVER (PARTITION BY b.entity_id, b.model_name ORDER BY b.period_date) as lvi_change,
      b.visibility_score - LAG(b.visibility_score) OVER (PARTITION BY b.entity_id, b.model_name ORDER BY b.period_date) as visibility_change,
      b.sentiment_score - LAG(b.sentiment_score) OVER (PARTITION BY b.entity_id, b.model_name ORDER BY b.period_date) as sentiment_change
    FROM base_metrics b
  )
  SELECT 
    wc.period_date,
    wc.entity_id,
    wc.brand_name,
    wc.is_primary_brand,
    wc.model_name,
    wc.total_responses,
    wc.total_analyses,
    wc.visibility_score,
    wc.citation_rate,
    wc.sentiment_score,
    wc.position_score,
    wc.share_of_voice,
    wc.lvi_score,
    wc.mention_count,
    wc.citation_count,
    wc.avg_raw_position,
    wc.positive_sentiment_count,
    wc.negative_sentiment_count,
    wc.lvi_change,
    wc.visibility_change,
    wc.sentiment_change
  FROM with_changes wc
  ORDER BY wc.period_date DESC, wc.is_primary_brand DESC, wc.brand_name;
END;
$$;

-- =====================================================
-- 7. FUNCTION: Get Latest Metrics Summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_brand_metrics_summary(
  p_account_id UUID,
  p_primary_brand_id UUID,
  p_model_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  brand_name TEXT,
  is_primary_brand BOOLEAN,
  entity_id UUID,
  
  -- Latest scores
  lvi_score NUMERIC,
  visibility_score NUMERIC,
  citation_rate NUMERIC,
  sentiment_score NUMERIC,
  position_score NUMERIC,
  share_of_voice NUMERIC,
  
  -- Trends (vs previous period)
  lvi_trend TEXT,
  lvi_change NUMERIC,
  visibility_trend TEXT,
  sentiment_trend TEXT,
  
  -- Counts
  total_responses BIGINT,
  mention_count BIGINT,
  citation_count BIGINT,
  
  last_analyzed TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_date AS (
    SELECT MAX(analysis_date) as max_date
    FROM mv_daily_brand_model_metrics
    WHERE account_id = p_account_id
      AND primary_brand_id = p_primary_brand_id
      AND (p_model_name IS NULL OR model_name = p_model_name)
  ),
  previous_date AS (
    SELECT MAX(analysis_date) as prev_date
    FROM mv_daily_brand_model_metrics m, latest_date ld
    WHERE m.account_id = p_account_id
      AND m.primary_brand_id = p_primary_brand_id
      AND (p_model_name IS NULL OR m.model_name = p_model_name)
      AND m.analysis_date < ld.max_date
  ),
  current_metrics AS (
    SELECT 
      m.brand_name,
      m.is_primary_brand,
      m.entity_id,
      ROUND(SUM(m.avg_lvi_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as lvi_score,
      ROUND(SUM(m.avg_visibility_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as visibility_score,
      ROUND(SUM(m.avg_citation_rate * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as citation_rate,
      ROUND(SUM(m.avg_sentiment_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as sentiment_score,
      ROUND(SUM(m.avg_position_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as position_score,
      ROUND(SUM(m.avg_share_of_voice * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as share_of_voice,
      SUM(m.total_responses) as total_responses,
      SUM(m.mention_count) as mention_count,
      SUM(m.citation_count) as citation_count,
      MAX(m.last_analyzed) as last_analyzed
    FROM mv_daily_brand_model_metrics m, latest_date ld
    WHERE m.account_id = p_account_id
      AND m.primary_brand_id = p_primary_brand_id
      AND m.analysis_date = ld.max_date
      AND (p_model_name IS NULL OR m.model_name = p_model_name)
    GROUP BY m.brand_name, m.is_primary_brand, m.entity_id
  ),
  previous_metrics AS (
    SELECT 
      m.brand_name,
      ROUND(SUM(m.avg_lvi_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as lvi_score,
      ROUND(SUM(m.avg_visibility_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as visibility_score,
      ROUND(SUM(m.avg_sentiment_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as sentiment_score
    FROM mv_daily_brand_model_metrics m, previous_date pd
    WHERE m.account_id = p_account_id
      AND m.primary_brand_id = p_primary_brand_id
      AND m.analysis_date = pd.prev_date
      AND (p_model_name IS NULL OR m.model_name = p_model_name)
    GROUP BY m.brand_name
  )
  SELECT 
    c.brand_name,
    c.is_primary_brand,
    c.entity_id,
    c.lvi_score,
    c.visibility_score,
    c.citation_rate,
    c.sentiment_score,
    c.position_score,
    c.share_of_voice,
    CASE 
      WHEN p.lvi_score IS NULL THEN 'new'
      WHEN c.lvi_score > p.lvi_score THEN 'up'
      WHEN c.lvi_score < p.lvi_score THEN 'down'
      ELSE 'stable'
    END as lvi_trend,
    c.lvi_score - COALESCE(p.lvi_score, c.lvi_score) as lvi_change,
    CASE 
      WHEN p.visibility_score IS NULL THEN 'new'
      WHEN c.visibility_score > p.visibility_score THEN 'up'
      WHEN c.visibility_score < p.visibility_score THEN 'down'
      ELSE 'stable'
    END as visibility_trend,
    CASE 
      WHEN p.sentiment_score IS NULL THEN 'new'
      WHEN c.sentiment_score > p.sentiment_score THEN 'up'
      WHEN c.sentiment_score < p.sentiment_score THEN 'down'
      ELSE 'stable'
    END as sentiment_trend,
    c.total_responses,
    c.mention_count,
    c.citation_count,
    c.last_analyzed
  FROM current_metrics c
  LEFT JOIN previous_metrics p ON c.brand_name = p.brand_name
  ORDER BY c.is_primary_brand DESC, c.brand_name;
END;
$$;

-- =====================================================
-- 8. FUNCTION: Get Model Comparison
-- =====================================================

CREATE OR REPLACE FUNCTION get_model_comparison(
  p_account_id UUID,
  p_primary_brand_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_brand_name TEXT DEFAULT NULL  -- NULL for all brands
)
RETURNS TABLE (
  model_name TEXT,
  brand_name TEXT,
  is_primary_brand BOOLEAN,
  total_responses BIGINT,
  avg_lvi_score NUMERIC,
  avg_visibility_score NUMERIC,
  avg_citation_rate NUMERIC,
  avg_sentiment_score NUMERIC,
  avg_position_score NUMERIC,
  avg_share_of_voice NUMERIC,
  mention_count BIGINT,
  citation_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.model_name,
    m.brand_name,
    m.is_primary_brand,
    SUM(m.total_responses)::BIGINT as total_responses,
    ROUND(SUM(m.avg_lvi_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as avg_lvi_score,
    ROUND(SUM(m.avg_visibility_score * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as avg_visibility_score,
    ROUND(SUM(m.avg_citation_rate * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 4) as avg_citation_rate,
    ROUND(SUM(m.avg_sentiment_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as avg_sentiment_score,
    ROUND(SUM(m.avg_position_score * NULLIF(m.mention_count, 0)) / NULLIF(SUM(NULLIF(m.mention_count, 0)), 0), 4) as avg_position_score,
    ROUND(SUM(m.avg_share_of_voice * m.total_analyses) / NULLIF(SUM(m.total_analyses), 0), 2) as avg_share_of_voice,
    SUM(m.mention_count)::BIGINT as mention_count,
    SUM(m.citation_count)::BIGINT as citation_count
  FROM mv_daily_brand_model_metrics m
  WHERE m.account_id = p_account_id
    AND m.primary_brand_id = p_primary_brand_id
    AND (p_start_date IS NULL OR m.analysis_date >= p_start_date)
    AND (p_end_date IS NULL OR m.analysis_date <= p_end_date)
    AND (p_brand_name IS NULL OR m.brand_name = p_brand_name)
  GROUP BY m.model_name, m.brand_name, m.is_primary_brand
  ORDER BY m.is_primary_brand DESC, m.brand_name, m.model_name;
END;
$$;

-- =====================================================
-- 9. REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_brand_metrics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh in dependency order
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_brand_response_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_brand_model_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_brand_metrics_all_models;
  
  -- Log refresh
  INSERT INTO analytics_refresh_log (view_name, refreshed_at, success)
  VALUES ('brand_metrics_views', NOW(), true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON mv_brand_response_metrics TO authenticated;
GRANT SELECT ON mv_daily_brand_model_metrics TO authenticated;
GRANT SELECT ON mv_daily_brand_metrics_all_models TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_brand_metrics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_model_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_brand_metrics_views TO service_role;

-- =====================================================
-- 11. INITIAL REFRESH
-- =====================================================

-- Refresh the views with initial data
REFRESH MATERIALIZED VIEW mv_brand_response_metrics;
REFRESH MATERIALIZED VIEW mv_daily_brand_model_metrics;
REFRESH MATERIALIZED VIEW mv_daily_brand_metrics_all_models;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON MATERIALIZED VIEW mv_brand_response_metrics IS 
'Granular brand metrics at response level. Refresh after new analysis data.';

COMMENT ON MATERIALIZED VIEW mv_daily_brand_model_metrics IS 
'Daily aggregated brand metrics per model. Main view for dashboard queries.';

COMMENT ON FUNCTION get_brand_metrics IS 
'Flexible function to get brand metrics with time aggregation (daily/weekly/monthly) and filtering by model/brand.';

COMMENT ON FUNCTION get_latest_brand_metrics_summary IS 
'Get the most recent metrics summary for all brands with trend indicators.';
