-- ============================================================================
-- Fix Unique Constraints for Multiple Daily Runs
-- ============================================================================
-- Purpose: Allow multiple analysis runs per day by removing overly restrictive
-- unique constraints and relying on UUID primary keys + timestamp tracking
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing unique constraints
-- ============================================================================

ALTER TABLE brand_daily_analysis 
  DROP CONSTRAINT IF EXISTS unique_brand_daily_analysis;

ALTER TABLE brand_topic_analysis 
  DROP CONSTRAINT IF EXISTS unique_brand_topic_daily;

ALTER TABLE brand_source_analysis 
  DROP CONSTRAINT IF EXISTS unique_brand_source_daily;

-- ============================================================================
-- STEP 2: Add analysis_run_timestamp to track when each analysis was performed
-- ============================================================================

ALTER TABLE brand_daily_analysis 
  ADD COLUMN IF NOT EXISTS analysis_run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE brand_topic_analysis 
  ADD COLUMN IF NOT EXISTS analysis_run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE brand_source_analysis 
  ADD COLUMN IF NOT EXISTS analysis_run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- STEP 3: Add analysis_batch_id to group analyses that ran together
-- ============================================================================

ALTER TABLE brand_daily_analysis 
  ADD COLUMN IF NOT EXISTS analysis_batch_id UUID;

ALTER TABLE brand_topic_analysis 
  ADD COLUMN IF NOT EXISTS analysis_batch_id UUID;

ALTER TABLE brand_source_analysis 
  ADD COLUMN IF NOT EXISTS analysis_batch_id UUID;

-- ============================================================================
-- STEP 4: Create indexes for efficient querying
-- ============================================================================

-- Index on analysis_run_timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_brand_daily_analysis_run_timestamp 
  ON brand_daily_analysis(analysis_run_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_brand_topic_analysis_run_timestamp 
  ON brand_topic_analysis(analysis_run_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_brand_source_analysis_run_timestamp 
  ON brand_source_analysis(analysis_run_timestamp DESC);

-- Index on analysis_batch_id for grouping
CREATE INDEX IF NOT EXISTS idx_brand_daily_analysis_batch 
  ON brand_daily_analysis(analysis_batch_id);

CREATE INDEX IF NOT EXISTS idx_brand_topic_analysis_batch 
  ON brand_topic_analysis(analysis_batch_id);

CREATE INDEX IF NOT EXISTS idx_brand_source_analysis_batch 
  ON brand_source_analysis(analysis_batch_id);

-- Composite index for efficient latest-per-date queries
CREATE INDEX IF NOT EXISTS idx_brand_daily_brand_date_timestamp 
  ON brand_daily_analysis(brand_id, analysis_date, analysis_run_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_brand_topic_brand_date_timestamp 
  ON brand_topic_analysis(brand_id, analysis_date, analysis_run_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_brand_source_brand_date_timestamp 
  ON brand_source_analysis(brand_id, analysis_date, analysis_run_timestamp DESC);

-- ============================================================================
-- STEP 5: Create views to get latest analysis per date
-- ============================================================================

-- View: Latest brand daily analysis per date
CREATE OR REPLACE VIEW brand_daily_analysis_latest AS
SELECT DISTINCT ON (brand_id, competitor_id, analysis_date, simulation_id)
  *
FROM brand_daily_analysis
ORDER BY brand_id, competitor_id, analysis_date, simulation_id, analysis_run_timestamp DESC;

-- View: Latest brand topic analysis per date
CREATE OR REPLACE VIEW brand_topic_analysis_latest AS
SELECT DISTINCT ON (brand_id, competitor_id, topic_name, analysis_date, simulation_id)
  *
FROM brand_topic_analysis
ORDER BY brand_id, competitor_id, topic_name, analysis_date, simulation_id, analysis_run_timestamp DESC;

-- View: Latest brand source analysis per date
CREATE OR REPLACE VIEW brand_source_analysis_latest AS
SELECT DISTINCT ON (brand_id, competitor_id, source_domain, analysis_date, simulation_id)
  *
FROM brand_source_analysis
ORDER BY brand_id, competitor_id, source_domain, analysis_date, simulation_id, analysis_run_timestamp DESC;

-- ============================================================================
-- STEP 6: Create aggregation views for cumulative time series
-- ============================================================================

-- View: Aggregated daily metrics (average of all runs per day)
CREATE OR REPLACE VIEW brand_daily_analysis_aggregated AS
SELECT 
  brand_id,
  competitor_id,
  account_id,
  simulation_id,
  brand_name,
  is_primary_brand,
  analysis_date,
  analysis_period,
  
  -- Aggregated volume metrics (use MAX to get cumulative)
  MAX(total_responses_analyzed) as total_responses_analyzed,
  MAX(total_prompts_analyzed) as total_prompts_analyzed,
  MAX(total_models_tested) as total_models_tested,
  
  -- Average metrics across all runs
  ROUND(AVG(total_mentions), 0)::INTEGER as avg_total_mentions,
  ROUND(AVG(mention_rate), 2) as avg_mention_rate,
  ROUND(AVG(avg_position), 2) as avg_position,
  ROUND(AVG(first_position_count), 0)::INTEGER as avg_first_position_count,
  ROUND(AVG(top_3_count), 0)::INTEGER as avg_top_3_count,
  ROUND(AVG(top_5_count), 0)::INTEGER as avg_top_5_count,
  
  -- Sentiment metrics
  ROUND(AVG(avg_sentiment), 2) as avg_sentiment,
  ROUND(AVG(positive_mention_count), 0)::INTEGER as avg_positive_mentions,
  ROUND(AVG(neutral_mention_count), 0)::INTEGER as avg_neutral_mentions,
  ROUND(AVG(negative_mention_count), 0)::INTEGER as avg_negative_mentions,
  
  -- Share of voice and visibility
  ROUND(AVG(share_of_voice), 2) as avg_share_of_voice,
  ROUND(AVG(sov_vs_top_competitor), 2) as avg_sov_vs_competitor,
  ROUND(AVG(visibility_score), 2) as avg_visibility_score,
  
  -- Citation metrics
  ROUND(AVG(total_citations), 0)::INTEGER as avg_total_citations,
  ROUND(AVG(citation_rate), 2) as avg_citation_rate,
  ROUND(AVG(direct_citations), 0)::INTEGER as avg_direct_citations,
  ROUND(AVG(formal_citations), 0)::INTEGER as avg_formal_citations,
  ROUND(AVG(avg_citations_per_mention), 2) as avg_citations_per_mention,
  
  -- Factual accuracy
  ROUND(AVG(factual_accuracy_score), 2) as avg_factual_accuracy,
  ROUND(AVG(total_factual_claims), 0)::INTEGER as avg_factual_claims,
  ROUND(AVG(correct_factual_claims), 0)::INTEGER as avg_correct_claims,
  
  -- LVI components
  ROUND(AVG(lvi_score), 2) as avg_lvi_score,
  ROUND(AVG(lvi_visibility_component), 2) as avg_lvi_visibility,
  ROUND(AVG(lvi_citation_component), 2) as avg_lvi_citation,
  ROUND(AVG(lvi_sentiment_component), 2) as avg_lvi_sentiment,
  ROUND(AVG(lvi_position_component), 2) as avg_lvi_position,
  
  -- Response quality
  ROUND(AVG(avg_response_completeness), 2) as avg_completeness,
  ROUND(AVG(avg_response_length), 0)::INTEGER as avg_response_length,
  
  -- Competitive context
  ROUND(AVG(industry_rank), 0)::INTEGER as avg_industry_rank,
  
  -- Metadata
  ROUND(AVG(data_quality_score), 2) as avg_data_quality,
  MAX(sample_size) as max_sample_size,
  COUNT(*) as analysis_run_count,
  MIN(analysis_run_timestamp) as first_run_at,
  MAX(analysis_run_timestamp) as latest_run_at,
  MAX(created_at) as created_at,
  MAX(updated_at) as updated_at
  
FROM brand_daily_analysis
GROUP BY 
  brand_id, competitor_id, account_id, simulation_id,
  brand_name, is_primary_brand, analysis_date, analysis_period;

-- ============================================================================
-- STEP 7: Update calculate_brand_daily_metrics function
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_brand_daily_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_analysis_date DATE,
  p_simulation_id UUID DEFAULT NULL,
  p_analysis_batch_id UUID DEFAULT NULL  -- New parameter for batch tracking
)
RETURNS UUID AS $$  -- Now returns the batch_id
DECLARE
  v_brand_name VARCHAR(255);
  v_total_responses INTEGER;
  v_batch_id UUID;
BEGIN
  -- Generate batch ID if not provided
  v_batch_id := COALESCE(p_analysis_batch_id, gen_random_uuid());
  
  -- Get brand name
  SELECT name INTO v_brand_name FROM brands WHERE id = p_brand_id;
  
  IF v_brand_name IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', p_brand_id;
  END IF;
  
  -- Get total responses for the day
  SELECT COUNT(DISTINCT ra.response_id) INTO v_total_responses
  FROM response_analysis ra
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id);
  
  IF v_total_responses = 0 THEN
    RAISE NOTICE 'No responses found for date %', p_analysis_date;
    RETURN v_batch_id;
  END IF;
  
  -- Calculate and insert daily metrics for primary brand
  INSERT INTO brand_daily_analysis (
    brand_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    analysis_batch_id,
    analysis_run_timestamp,
    total_responses_analyzed,
    total_prompts_analyzed,
    total_mentions,
    mention_rate,
    avg_position,
    first_position_count,
    top_3_count,
    top_5_count,
    positions_array,
    avg_sentiment,
    positive_mention_count,
    neutral_mention_count,
    negative_mention_count,
    total_citations,
    citation_rate,
    avg_citations_per_mention,
    visibility_score,
    lvi_score,
    lvi_visibility_component,
    lvi_citation_component,
    lvi_sentiment_component,
    lvi_position_component,
    sample_size
  )
  SELECT
    p_brand_id,
    p_account_id,
    p_simulation_id,
    v_brand_name,
    true,
    p_analysis_date,
    v_batch_id,
    NOW(),
    COUNT(*),
    COUNT(DISTINCT prompt_id),
    SUM(COALESCE(primary_brand_mentions, 0)),
    ROUND((SUM(CASE WHEN COALESCE(primary_brand_mentions, 0) > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(NULLIF(primary_brand_avg_position, 0)), 2),
    SUM(CASE WHEN primary_brand_first_position = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position <= 3 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position <= 5 THEN 1 ELSE 0 END),
    ARRAY_AGG(primary_brand_first_position) FILTER (WHERE primary_brand_first_position IS NOT NULL),
    ROUND(AVG(primary_brand_sentiment), 2),
    SUM(CASE WHEN primary_brand_sentiment > 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment >= 0.3 AND primary_brand_sentiment <= 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment < 0.3 THEN 1 ELSE 0 END),
    SUM(COALESCE(primary_brand_sources, 0)),
    ROUND((SUM(primary_brand_sources)::NUMERIC / NULLIF(SUM(primary_brand_mentions), 0) * 100), 2),
    ROUND(AVG(primary_brand_sources::NUMERIC / NULLIF(primary_brand_mentions, 1)), 2),
    ROUND((SUM(CASE WHEN primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(llm_visibility_index), 2),
    ROUND(AVG(lvi_component_visibility), 2),
    ROUND(AVG(lvi_component_citation), 2),
    ROUND(AVG(lvi_component_sentiment), 2),
    ROUND(AVG(lvi_component_position), 2),
    COUNT(*)
  FROM response_analysis
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND DATE(analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR simulation_id = p_simulation_id);
  
  -- Calculate metrics for each competitor from brands_mentioned JSONB
  WITH competitor_daily_stats AS (
    SELECT
      comp.id as competitor_id,
      comp.competitor_name,
      COUNT(DISTINCT ra.response_id) as total_responses,
      COUNT(DISTINCT ra.prompt_id) as total_prompts,
      SUM((brand_elem->>'mentions')::int) as total_mentions,
      SUM(CASE WHEN (brand_elem->>'mentions')::int > 0 THEN 1 ELSE 0 END) as mention_count,
      AVG(
        CASE 
          WHEN jsonb_array_length(brand_elem->'positions') > 0 
          THEN (
            SELECT AVG(pos::text::int) 
            FROM jsonb_array_elements(brand_elem->'positions') pos
          )
          ELSE NULL
        END
      ) as avg_position,
      SUM(CASE 
        WHEN jsonb_array_length(brand_elem->'positions') > 0 AND
             (brand_elem->'positions'->0)::text::int = 1
        THEN 1 ELSE 0 
      END) as first_position_count,
      SUM(CASE 
        WHEN jsonb_array_length(brand_elem->'positions') > 0 AND
             (brand_elem->'positions'->0)::text::int <= 3
        THEN 1 ELSE 0 
      END) as top_3_count
    FROM response_analysis ra
    CROSS JOIN LATERAL jsonb_array_elements(ra.brands_mentioned) brand_elem
    JOIN competitors comp ON comp.competitor_name = brand_elem->>'name' AND comp.brand_id = p_brand_id
    WHERE ra.account_id = p_account_id
      AND ra.brand_id = p_brand_id
      AND DATE(ra.analyzed_at) = p_analysis_date
      AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    GROUP BY comp.id, comp.competitor_name
  )
  INSERT INTO brand_daily_analysis (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    analysis_batch_id,
    analysis_run_timestamp,
    total_responses_analyzed,
    total_prompts_analyzed,
    total_mentions,
    mention_rate,
    avg_position,
    first_position_count,
    top_3_count,
    visibility_score,
    lvi_score,
    sample_size
  )
  SELECT
    p_brand_id,
    cds.competitor_id,
    p_account_id,
    p_simulation_id,
    cds.competitor_name,
    false,
    p_analysis_date,
    v_batch_id,
    NOW(),
    cds.total_responses,
    cds.total_prompts,
    cds.total_mentions,
    ROUND((cds.mention_count::NUMERIC / NULLIF(cds.total_responses, 0) * 100), 2),
    ROUND(cds.avg_position, 2),
    cds.first_position_count,
    cds.top_3_count,
    ROUND((cds.mention_count::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    ROUND((cds.mention_count::NUMERIC / NULLIF(v_total_responses, 0) * 60) + 
          ((100 - COALESCE(cds.avg_position, 100)) * 0.4), 2),
    cds.total_responses
  FROM competitor_daily_stats cds;
    
  RAISE NOTICE 'Daily metrics calculated for brand % on date % (batch_id: %)', v_brand_name, p_analysis_date, v_batch_id;
  
  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_brand_daily_metrics IS 'Calculate daily GEO metrics for primary brand and all competitors. Returns batch_id for tracking.';

-- ============================================================================
-- STEP 8: Create helper functions for querying
-- ============================================================================

-- Function to get latest metrics for a specific date
CREATE OR REPLACE FUNCTION get_latest_brand_metrics(
  p_brand_id UUID,
  p_analysis_date DATE,
  p_simulation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  brand_name VARCHAR(255),
  is_primary_brand BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  share_of_voice NUMERIC,
  citation_rate NUMERIC,
  analysis_run_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (bda.brand_id, bda.competitor_id)
    bda.brand_name,
    bda.is_primary_brand,
    bda.lvi_score,
    bda.mention_rate,
    bda.avg_position,
    bda.avg_sentiment,
    bda.share_of_voice,
    bda.citation_rate,
    bda.analysis_run_timestamp
  FROM brand_daily_analysis bda
  WHERE bda.brand_id = p_brand_id
    AND bda.analysis_date = p_analysis_date
    AND (p_simulation_id IS NULL OR bda.simulation_id = p_simulation_id)
  ORDER BY bda.brand_id, bda.competitor_id, bda.analysis_run_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregated metrics over time range
CREATE OR REPLACE FUNCTION get_aggregated_brand_metrics(
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_simulation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  analysis_date DATE,
  brand_name VARCHAR(255),
  is_primary_brand BOOLEAN,
  avg_lvi_score NUMERIC,
  avg_mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  analysis_run_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bda.analysis_date,
    bda.brand_name,
    bda.is_primary_brand,
    ROUND(AVG(bda.lvi_score), 2) as avg_lvi_score,
    ROUND(AVG(bda.mention_rate), 2) as avg_mention_rate,
    ROUND(AVG(bda.avg_position), 2) as avg_position,
    ROUND(AVG(bda.avg_sentiment), 2) as avg_sentiment,
    COUNT(*) as analysis_run_count
  FROM brand_daily_analysis bda
  WHERE bda.brand_id = p_brand_id
    AND bda.analysis_date BETWEEN p_start_date AND p_end_date
    AND (p_simulation_id IS NULL OR bda.simulation_id = p_simulation_id)
  GROUP BY bda.analysis_date, bda.brand_name, bda.is_primary_brand, bda.brand_id, bda.competitor_id
  ORDER BY bda.analysis_date DESC, bda.is_primary_brand DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Add comments explaining the new approach
-- ============================================================================

COMMENT ON COLUMN brand_daily_analysis.analysis_run_timestamp IS 'Timestamp when this specific analysis run was performed. Allows multiple runs per day.';
COMMENT ON COLUMN brand_daily_analysis.analysis_batch_id IS 'Groups analyses that ran together. Use to identify which data came from the same run.';

COMMENT ON COLUMN brand_topic_analysis.analysis_run_timestamp IS 'Timestamp when this specific analysis run was performed. Allows multiple runs per day.';
COMMENT ON COLUMN brand_topic_analysis.analysis_batch_id IS 'Groups analyses that ran together. Use to identify which data came from the same run.';

COMMENT ON COLUMN brand_source_analysis.analysis_run_timestamp IS 'Timestamp when this specific analysis run was performed. Allows multiple runs per day.';
COMMENT ON COLUMN brand_source_analysis.analysis_batch_id IS 'Groups analyses that ran together. Use to identify which data came from the same run.';

COMMENT ON VIEW brand_daily_analysis_latest IS 'Returns the most recent analysis run for each brand/date combination. Use this for reports showing "current" data.';
COMMENT ON VIEW brand_daily_analysis_aggregated IS 'Returns aggregated metrics averaging all runs per day. Use this for time series showing daily trends.';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  Multiple Daily Runs Support - Implementation Complete
  ============================================================================
  
  Changes:
  1. ✅ Removed restrictive unique constraints
  2. ✅ Added analysis_run_timestamp to track each run
  3. ✅ Added analysis_batch_id to group related analyses
  4. ✅ Created views for latest and aggregated data
  5. ✅ Updated calculate_brand_daily_metrics() to return batch_id
  6. ✅ Added helper functions for querying
  
  You can now:
  - Run analysis multiple times per day ✓
  - Store cumulative time series data ✓
  - Query latest results per date ✓
  - Query aggregated results per date ✓
  - Track which analyses ran together ✓
  
  Usage:
  -- Run analysis and get batch_id
  SELECT calculate_brand_daily_metrics(account_id, brand_id, CURRENT_DATE);
  
  -- Get latest metrics for today
  SELECT * FROM get_latest_brand_metrics(brand_id, CURRENT_DATE);
  
  -- Get aggregated metrics for last 30 days
  SELECT * FROM get_aggregated_brand_metrics(
    brand_id, 
    CURRENT_DATE - 30, 
    CURRENT_DATE
  );
  
  -- Or use views directly
  SELECT * FROM brand_daily_analysis_latest 
  WHERE brand_id = ''uuid'' AND analysis_date = CURRENT_DATE;
  
  SELECT * FROM brand_daily_analysis_aggregated
  WHERE brand_id = ''uuid'' AND analysis_date >= CURRENT_DATE - 30;
  
  ============================================================================
  ';
END $$;
