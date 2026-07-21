-- ============================================================================
-- Add Model and Prompt Links to Brand Analysis Tables
-- ============================================================================
-- Purpose: Link brand analysis tables to llm_simulation_responses and user_prompts
-- for full traceability of which models and prompts drove specific metrics
-- ============================================================================

-- ============================================================================
-- STEP 1: Add response_id column to brand_daily_analysis (model/prompt already exist)
-- ============================================================================

ALTER TABLE brand_daily_analysis 
  ADD COLUMN IF NOT EXISTS response_id UUID REFERENCES llm_simulation_responses(id) ON DELETE CASCADE;

-- Create index for foreign key lookup
CREATE INDEX IF NOT EXISTS idx_brand_daily_analysis_response ON brand_daily_analysis(response_id);

-- Add comment
COMMENT ON COLUMN brand_daily_analysis.response_id IS 'Links to specific LLM response that contributed to these metrics';

-- ============================================================================
-- STEP 2: Add response_id column to brand_topic_analysis
-- ============================================================================

ALTER TABLE brand_topic_analysis
  ADD COLUMN IF NOT EXISTS response_id UUID REFERENCES llm_simulation_responses(id) ON DELETE CASCADE;

-- Create index for foreign key lookup
CREATE INDEX IF NOT EXISTS idx_brand_topic_analysis_response ON brand_topic_analysis(response_id);

-- Add comment
COMMENT ON COLUMN brand_topic_analysis.response_id IS 'Links to specific LLM response that mentioned this topic with brand';

-- ============================================================================
-- STEP 3: Add response_id column to brand_source_analysis
-- ============================================================================

ALTER TABLE brand_source_analysis
  ADD COLUMN IF NOT EXISTS response_id UUID REFERENCES llm_simulation_responses(id) ON DELETE CASCADE;

-- Create index for foreign key lookup
CREATE INDEX IF NOT EXISTS idx_brand_source_analysis_response ON brand_source_analysis(response_id);

-- Add comment
COMMENT ON COLUMN brand_source_analysis.response_id IS 'Links to specific LLM response that cited this source';

-- ============================================================================
-- STEP 4: Update calculate_brand_daily_metrics function to populate new columns
-- ============================================================================

-- Drop old function signatures
DROP FUNCTION IF EXISTS calculate_brand_daily_metrics(UUID, UUID, DATE, UUID);
DROP FUNCTION IF EXISTS calculate_brand_daily_metrics(UUID, UUID, DATE, UUID, UUID);

CREATE OR REPLACE FUNCTION calculate_brand_daily_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_analysis_date DATE,
  p_simulation_id UUID DEFAULT NULL,
  p_analysis_batch_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
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
  INNER JOIN llm_simulation_responses lsr ON ra.response_id = lsr.id
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
    analysis_run_timestamp,
    analysis_batch_id,
    response_id,
    model_id,
    model_name,
    prompt_id,
    prompt_text,
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
    lvi_position_component
  )
  SELECT 
    p_brand_id,
    p_account_id,
    p_simulation_id,
    v_brand_name,
    true,
    p_analysis_date,
    NOW(),
    v_batch_id,
    ra.response_id,
    lsr.model_name,
    lsr.model_name,
    up.id,
    up.prompt_text,
    v_total_responses,
    COUNT(DISTINCT ra.prompt_id),
    SUM(ra.brand_mentions),
    ROUND((COUNT(DISTINCT CASE WHEN ra.brand_mentions > 0 THEN ra.response_id END)::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    ROUND(AVG(ra.brand_avg_position), 2),
    COUNT(CASE WHEN ra.brand_first_position = 1 THEN 1 END),
    COUNT(CASE WHEN ra.brand_first_position <= 3 THEN 1 END),
    COUNT(CASE WHEN ra.brand_first_position <= 5 THEN 1 END),
    array_agg(DISTINCT pos) FILTER (WHERE pos IS NOT NULL),
    ROUND(AVG(ra.brand_sentiment), 2),
    COUNT(CASE WHEN ra.brand_sentiment > 0.6 THEN 1 END),
    COUNT(CASE WHEN ra.brand_sentiment BETWEEN 0.3 AND 0.6 THEN 1 END),
    COUNT(CASE WHEN ra.brand_sentiment < 0.3 THEN 1 END),
    SUM(ra.brand_sources),
    ROUND((SUM(ra.brand_sources)::NUMERIC / NULLIF(SUM(ra.brand_mentions), 0) * 100), 2),
    ROUND(AVG(ra.brand_sources), 2),
    ROUND((COUNT(DISTINCT CASE WHEN ra.brand_mentions > 0 THEN ra.response_id END)::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    0, -- LVI score placeholder
    0, -- LVI visibility component
    0, -- LVI citation component
    0, -- LVI sentiment component
    0  -- LVI position component
  FROM response_analysis ra
  INNER JOIN llm_simulation_responses lsr ON ra.response_id = lsr.id
  LEFT JOIN user_prompts up ON lsr.prompt_id = up.id
  CROSS JOIN LATERAL unnest(ra.brand_positions) AS pos
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND ra.analyzed_brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
  GROUP BY ra.response_id, lsr.model_name, up.id, up.prompt_text;
  
  -- Calculate for competitors
  INSERT INTO brand_daily_analysis (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    analysis_run_timestamp,
    analysis_batch_id,
    response_id,
    model_id,
    model_name,
    prompt_id,
    prompt_text,
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
    visibility_score
  )
  SELECT 
    p_brand_id,
    comp.id,
    p_account_id,
    p_simulation_id,
    comp.name,
    false,
    p_analysis_date,
    NOW(),
    v_batch_id,
    ra.response_id,
    lsr.model_name,
    lsr.model_name,
    up.id,
    up.prompt_text,
    v_total_responses,
    COUNT(DISTINCT ra.prompt_id),
    SUM(ra.brand_mentions),
    ROUND((COUNT(DISTINCT CASE WHEN ra.brand_mentions > 0 THEN ra.response_id END)::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    ROUND(AVG(ra.brand_avg_position), 2),
    COUNT(CASE WHEN ra.brand_first_position = 1 THEN 1 END),
    COUNT(CASE WHEN ra.brand_first_position <= 3 THEN 1 END),
    COUNT(CASE WHEN ra.brand_first_position <= 5 THEN 1 END),
    array_agg(DISTINCT pos) FILTER (WHERE pos IS NOT NULL),
    ROUND(AVG(ra.brand_sentiment), 2),
    COUNT(CASE WHEN ra.brand_sentiment > 0.6 THEN 1 END),
    COUNT(CASE WHEN ra.brand_sentiment BETWEEN 0.3 AND 0.6 THEN 1 END),
    COUNT(CASE WHEN ra.brand_sentiment < 0.3 THEN 1 END),
    SUM(ra.brand_sources),
    ROUND((SUM(ra.brand_sources)::NUMERIC / NULLIF(SUM(ra.brand_mentions), 0) * 100), 2),
    ROUND(AVG(ra.brand_sources), 2),
    ROUND((COUNT(DISTINCT CASE WHEN ra.brand_mentions > 0 THEN ra.response_id END)::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2)
  FROM response_analysis ra
  INNER JOIN llm_simulation_responses lsr ON ra.response_id = lsr.id
  INNER JOIN competitors comp ON ra.analyzed_competitor_id = comp.id
  LEFT JOIN user_prompts up ON lsr.prompt_id = up.id
  CROSS JOIN LATERAL unnest(ra.brand_positions) AS pos
  LEFT JOIN user_prompts up ON lsr.prompt_id = up.prompt_id
  CROSS JOIN LATERAL unnest(ra.brand_positions) AS pos
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND ra.analyzed_competitor_id IS NOT NULL
    AND comp.brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
  GROUP BY comp.id, comp.name, ra.response_id, lsr.model_name, up.id, up.prompt_text;
  
  -- Populate brand_topic_analysis
  INSERT INTO brand_topic_analysis (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    analysis_run_timestamp,
    analysis_batch_id,
    response_id,
    model_id,
    model_name,
    prompt_id,
    prompt_text,
    topic_name,
    topic_category,
    times_mentioned_with_brand,
    mention_contexts
  )
  SELECT 
    p_brand_id,
    ra.analyzed_competitor_id,
    p_account_id,
    p_simulation_id,
    COALESCE(comp.name, v_brand_name),
    (ra.analyzed_competitor_id IS NULL),
    p_analysis_date,
    NOW(),
    v_batch_id,
    ra.response_id,
    lsr.model_name,
    lsr.model_name,
    up.id,
    up.prompt_text,
    topic->>'name',
    topic->>'category',
    (topic->>'mention_count')::INTEGER,
    ARRAY[topic->>'context']
  FROM response_analysis ra
  INNER JOIN llm_simulation_responses lsr ON ra.response_id = lsr.id
  LEFT JOIN user_prompts up ON lsr.prompt_id = up.id
  LEFT JOIN competitors comp ON ra.analyzed_competitor_id = comp.id
  CROSS JOIN LATERAL jsonb_array_elements(ra.topics_covered) AS topic
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    AND ra.brand_mentions > 0;
  
  -- Populate brand_source_analysis
  INSERT INTO brand_source_analysis (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    analysis_run_timestamp,
    analysis_batch_id,
    response_id,
    model_id,
    model_name,
    prompt_id,
    prompt_text,
    source_name,
    source_domain,
    source_url,
    source_type,
    times_cited_with_brand,
    citation_contexts
  )
  SELECT 
    p_brand_id,
    ra.analyzed_competitor_id,
    p_account_id,
    p_simulation_id,
    COALESCE(comp.name, v_brand_name),
    (ra.analyzed_competitor_id IS NULL),
    p_analysis_date,
    NOW(),
    v_batch_id,
    ra.response_id,
    lsr.model_name,
    lsr.model_name,
    up.id,
    up.prompt_text,
    source->>'name',
    source->>'domain',
    source->>'url',
    source->>'type',
    1,
    ARRAY[source->>'context']
  FROM response_analysis ra
  INNER JOIN llm_simulation_responses lsr ON ra.response_id = lsr.id
  LEFT JOIN user_prompts up ON lsr.prompt_id = up.id
  LEFT JOIN competitors comp ON ra.analyzed_competitor_id = comp.id
  CROSS JOIN LATERAL jsonb_array_elements(ra.sources_cited) AS source
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    AND ra.brand_mentions > 0;
  
  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_brand_daily_metrics IS 'Calculates daily brand metrics with full model and prompt traceability, returns batch UUID for grouping multiple runs';

-- ============================================================================
-- STEP 5: Update views to include model and prompt information
-- ============================================================================

-- Drop and recreate views with new columns
DROP VIEW IF EXISTS brand_daily_analysis_latest CASCADE;
DROP VIEW IF EXISTS brand_daily_analysis_aggregated CASCADE;
DROP VIEW IF EXISTS brand_topic_analysis_latest CASCADE;
DROP VIEW IF EXISTS brand_source_analysis_latest CASCADE;

-- Recreate latest analysis view
CREATE VIEW brand_daily_analysis_latest AS
SELECT DISTINCT ON (brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, simulation_id)
  *
FROM brand_daily_analysis
ORDER BY brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, simulation_id, analysis_run_timestamp DESC;

COMMENT ON VIEW brand_daily_analysis_latest IS 'Latest analysis run for each brand/competitor per day (includes model and prompt info)';

-- Recreate aggregated view with model breakdown
CREATE VIEW brand_daily_analysis_aggregated AS
SELECT 
  brand_id,
  competitor_id,
  account_id,
  simulation_id,
  brand_name,
  is_primary_brand,
  analysis_date,
  array_agg(DISTINCT model_name) FILTER (WHERE model_name IS NOT NULL) as models_used,
  array_agg(DISTINCT prompt_id) FILTER (WHERE prompt_id IS NOT NULL) as prompts_used,
  COUNT(DISTINCT analysis_batch_id) as total_runs,
  MAX(analysis_run_timestamp) as last_run_at,
  ROUND(AVG(total_responses_analyzed), 0)::INTEGER as avg_responses_analyzed,
  ROUND(AVG(total_mentions), 0)::INTEGER as avg_mentions,
  ROUND(AVG(mention_rate), 2) as avg_mention_rate,
  ROUND(AVG(avg_position), 2) as avg_position,
  ROUND(AVG(avg_sentiment), 2) as avg_sentiment,
  ROUND(AVG(visibility_score), 2) as avg_visibility_score,
  ROUND(AVG(citation_rate), 2) as avg_citation_rate,
  ROUND(AVG(lvi_score), 2) as avg_lvi_score
FROM brand_daily_analysis
GROUP BY brand_id, competitor_id, account_id, simulation_id, brand_name, is_primary_brand, analysis_date;

COMMENT ON VIEW brand_daily_analysis_aggregated IS 'Aggregated metrics across multiple runs per day with model/prompt tracking';

-- Recreate topic analysis latest view
CREATE VIEW brand_topic_analysis_latest AS
SELECT DISTINCT ON (brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, topic_name, topic_category)
  *
FROM brand_topic_analysis
ORDER BY brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, topic_name, topic_category, analysis_run_timestamp DESC;

COMMENT ON VIEW brand_topic_analysis_latest IS 'Latest topic analysis for each brand/topic per day (includes model and prompt info)';

-- Recreate source analysis latest view
CREATE VIEW brand_source_analysis_latest AS
SELECT DISTINCT ON (brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, source_domain)
  *
FROM brand_source_analysis
ORDER BY brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_date, source_domain, analysis_run_timestamp DESC;

COMMENT ON VIEW brand_source_analysis_latest IS 'Latest source analysis for each brand/source per day (includes model and prompt info)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All three tables now have:
-- - response_id: Links to llm_simulation_responses
-- - model_id & model_name: From llm_simulation_responses
-- - prompt_id: Links to user_prompts (UUID)
-- - prompt_text: Cached for performance
-- 
-- Views updated to show model/prompt tracking
-- Function updated to populate all new columns
-- ============================================================================
