-- ============================================================================
-- Helper Functions and Views for External Report Analytics
-- ============================================================================
-- Aggregation functions to populate the analytics tables from raw data
-- These can be called via cron jobs or triggers
-- ============================================================================

-- ============================================================================
-- Function: Calculate Brand Performance Metrics
-- ============================================================================
-- Aggregates data from response_analysis and competitor_response_analysis
-- to populate brand_performance_metrics table
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_brand_performance_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_simulation_id UUID DEFAULT NULL,
  p_period VARCHAR(20) DEFAULT '30d'
)
RETURNS void AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_total_responses INTEGER;
  v_brand_name VARCHAR(255);
BEGIN
  -- Calculate period dates
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years' -- 'all'
  END;

  -- Get brand name
  SELECT name INTO v_brand_name FROM brands WHERE id = p_brand_id;

  -- Count total responses
  SELECT COUNT(*) INTO v_total_responses
  FROM response_analysis
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR simulation_id = p_simulation_id)
    AND analyzed_at >= v_period_start;

  -- Insert/Update primary brand metrics
  INSERT INTO brand_performance_metrics (
    brand_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    metric_period,
    period_start_date,
    period_end_date,
    total_prompts_analyzed,
    total_responses_analyzed,
    total_mentions,
    mention_rate,
    avg_ranking_position,
    top_3_mentions,
    first_position_count,
    avg_sentiment_score,
    positive_mentions,
    neutral_mentions,
    negative_mentions,
    total_citations,
    citation_rate,
    lvi_score,
    sample_size
  )
  SELECT
    p_brand_id,
    p_account_id,
    p_simulation_id,
    v_brand_name,
    true, -- is_primary_brand
    p_period,
    v_period_start,
    v_period_end,
    COUNT(DISTINCT prompt_id),
    COUNT(*),
    SUM(primary_brand_mentions),
    ROUND((SUM(CASE WHEN primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(primary_brand_avg_position), 2),
    SUM(CASE WHEN primary_brand_first_position <= 3 AND primary_brand_first_position IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position = 1 THEN 1 ELSE 0 END),
    ROUND(AVG(primary_brand_sentiment), 2),
    SUM(CASE WHEN primary_brand_sentiment > 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment >= 0.3 AND primary_brand_sentiment <= 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment < 0.3 THEN 1 ELSE 0 END),
    SUM(primary_brand_sources),
    ROUND((SUM(primary_brand_sources)::NUMERIC / NULLIF(SUM(primary_brand_mentions), 0) * 100), 2),
    ROUND(AVG(llm_visibility_index), 2),
    COUNT(*)
  FROM response_analysis
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR simulation_id = p_simulation_id)
    AND analyzed_at >= v_period_start
  ON CONFLICT (brand_id, metric_period, simulation_id, competitor_id)
  DO UPDATE SET
    total_prompts_analyzed = EXCLUDED.total_prompts_analyzed,
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    total_mentions = EXCLUDED.total_mentions,
    mention_rate = EXCLUDED.mention_rate,
    avg_ranking_position = EXCLUDED.avg_ranking_position,
    top_3_mentions = EXCLUDED.top_3_mentions,
    first_position_count = EXCLUDED.first_position_count,
    avg_sentiment_score = EXCLUDED.avg_sentiment_score,
    positive_mentions = EXCLUDED.positive_mentions,
    neutral_mentions = EXCLUDED.neutral_mentions,
    negative_mentions = EXCLUDED.negative_mentions,
    total_citations = EXCLUDED.total_citations,
    citation_rate = EXCLUDED.citation_rate,
    lvi_score = EXCLUDED.lvi_score,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();

  -- Calculate competitor metrics
  INSERT INTO brand_performance_metrics (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    metric_period,
    period_start_date,
    period_end_date,
    total_responses_analyzed,
    total_mentions,
    mention_rate,
    avg_ranking_position,
    avg_sentiment_score,
    total_citations,
    citation_rate,
    sample_size
  )
  SELECT
    p_brand_id,
    cra.competitor_id,
    p_account_id,
    p_simulation_id,
    c.competitor_name,
    false, -- is_primary_brand
    p_period,
    v_period_start,
    v_period_end,
    COUNT(*),
    SUM(cra.competitor_mentions),
    ROUND((SUM(CASE WHEN cra.competitor_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(cra.avg_position), 2),
    ROUND(AVG(cra.sentiment), 2),
    SUM(cra.competitor_sources),
    ROUND((SUM(cra.competitor_sources)::NUMERIC / NULLIF(SUM(cra.competitor_mentions), 0) * 100), 2),
    COUNT(*)
  FROM competitor_response_analysis cra
  JOIN competitors c ON c.id = cra.competitor_id
  WHERE cra.account_id = p_account_id
    AND c.brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR cra.simulation_id = p_simulation_id)
    AND cra.analyzed_at >= v_period_start
  GROUP BY cra.competitor_id, c.competitor_name
  ON CONFLICT (brand_id, metric_period, simulation_id, competitor_id)
  DO UPDATE SET
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    total_mentions = EXCLUDED.total_mentions,
    mention_rate = EXCLUDED.mention_rate,
    avg_ranking_position = EXCLUDED.avg_ranking_position,
    avg_sentiment_score = EXCLUDED.avg_sentiment_score,
    total_citations = EXCLUDED.total_citations,
    citation_rate = EXCLUDED.citation_rate,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_brand_performance_metrics IS 'Aggregates response analysis data into brand performance metrics table';

-- ============================================================================
-- Function: Calculate Topic-Brand Associations
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_topic_brand_associations(
  p_account_id UUID,
  p_brand_id UUID,
  p_simulation_id UUID DEFAULT NULL,
  p_period VARCHAR(20) DEFAULT '30d'
)
RETURNS void AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate period dates
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  -- Aggregate topics for primary brand
  INSERT INTO topic_brand_associations (
    account_id,
    simulation_id,
    brand_id,
    brand_name,
    is_primary_brand,
    topic_name,
    mention_count,
    co_occurrence_rate,
    relevance_score,
    metric_period,
    period_start_date,
    period_end_date,
    total_responses_analyzed
  )
  SELECT
    p_account_id,
    p_simulation_id,
    p_brand_id,
    b.name,
    true,
    ti.topic_name,
    COUNT(*),
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM response_analysis WHERE brand_id = p_brand_id AND analyzed_at >= v_period_start), 0) * 100), 2),
    ROUND(AVG(ti.relevance_score) * 100, 2),
    p_period,
    v_period_start,
    v_period_end,
    (SELECT COUNT(*) FROM response_analysis WHERE brand_id = p_brand_id AND analyzed_at >= v_period_start)
  FROM topic_insights ti
  JOIN brands b ON b.id = p_brand_id
  WHERE ti.brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR ti.simulation_id = p_simulation_id)
    AND ti.created_at >= v_period_start
  GROUP BY ti.topic_name, b.name
  ON CONFLICT (brand_name, topic_name, metric_period, simulation_id)
  DO UPDATE SET
    mention_count = EXCLUDED.mention_count,
    co_occurrence_rate = EXCLUDED.co_occurrence_rate,
    relevance_score = EXCLUDED.relevance_score,
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    updated_at = NOW();

  -- TODO: Add competitor topic associations when competitor topic data is available

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_topic_brand_associations IS 'Aggregates topic insights into brand-topic association metrics';

-- ============================================================================
-- Function: Calculate Prompt Performance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_prompt_performance(
  p_account_id UUID,
  p_brand_id UUID,
  p_simulation_id UUID DEFAULT NULL,
  p_period VARCHAR(20) DEFAULT '30d'
)
RETURNS void AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  INSERT INTO prompt_performance_analysis (
    prompt_id,
    account_id,
    simulation_id,
    prompt_text,
    prompt_category,
    metric_period,
    period_start_date,
    period_end_date,
    total_responses,
    primary_brand_id,
    primary_brand_name,
    primary_brand_mentioned,
    primary_brand_mention_count,
    primary_brand_mention_rate,
    primary_brand_avg_position,
    primary_brand_sentiment,
    primary_brand_citations,
    primary_brand_lvi,
    total_brands_mentioned,
    competitor_mention_count
  )
  SELECT
    ra.prompt_id,
    p_account_id,
    p_simulation_id,
    up.prompt_text,
    up.category,
    p_period,
    v_period_start,
    v_period_end,
    COUNT(*),
    p_brand_id,
    b.name,
    BOOL_OR(ra.primary_brand_mentions > 0),
    SUM(ra.primary_brand_mentions),
    ROUND((SUM(CASE WHEN ra.primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(ra.primary_brand_avg_position), 2),
    ROUND(AVG(ra.primary_brand_sentiment), 2),
    SUM(ra.primary_brand_sources),
    ROUND(AVG(ra.llm_visibility_index), 2),
    SUM(ra.unique_brands_mentioned),
    SUM(ra.total_brand_mentions) - SUM(ra.primary_brand_mentions)
  FROM response_analysis ra
  JOIN user_prompts up ON up.id = ra.prompt_id
  JOIN brands b ON b.id = p_brand_id
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    AND ra.analyzed_at >= v_period_start
  GROUP BY ra.prompt_id, up.prompt_text, up.category, b.name
  ON CONFLICT (prompt_id, metric_period, simulation_id)
  DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    primary_brand_mentioned = EXCLUDED.primary_brand_mentioned,
    primary_brand_mention_count = EXCLUDED.primary_brand_mention_count,
    primary_brand_mention_rate = EXCLUDED.primary_brand_mention_rate,
    primary_brand_avg_position = EXCLUDED.primary_brand_avg_position,
    primary_brand_sentiment = EXCLUDED.primary_brand_sentiment,
    primary_brand_citations = EXCLUDED.primary_brand_citations,
    primary_brand_lvi = EXCLUDED.primary_brand_lvi,
    total_brands_mentioned = EXCLUDED.total_brands_mentioned,
    competitor_mention_count = EXCLUDED.competitor_mention_count,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_prompt_performance IS 'Aggregates per-prompt performance metrics for brand and competitors';

-- ============================================================================
-- Function: Calculate Citation Domain Analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_citation_domain_analysis(
  p_account_id UUID,
  p_simulation_id UUID DEFAULT NULL,
  p_period VARCHAR(20) DEFAULT '30d'
)
RETURNS void AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_total_responses INTEGER;
BEGIN
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  -- Get total responses for percentage calculation
  SELECT COUNT(DISTINCT response_id) INTO v_total_responses
  FROM response_citations
  WHERE account_id = p_account_id
    AND (p_simulation_id IS NULL OR simulation_id = p_simulation_id)
    AND created_at >= v_period_start;

  INSERT INTO citation_domain_analysis (
    account_id,
    simulation_id,
    domain,
    brand_id,
    competitor_id,
    total_citations,
    unique_responses_citing,
    used_percentage,
    avg_citations_per_response,
    avg_citation_position,
    first_citation_count,
    trust_score,
    is_authoritative,
    metric_period,
    period_start_date,
    period_end_date
  )
  SELECT
    p_account_id,
    p_simulation_id,
    rc.source_domain,
    rc.brand_id,
    rc.competitor_id,
    COUNT(*),
    COUNT(DISTINCT rc.response_id),
    ROUND((COUNT(DISTINCT rc.response_id)::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT rc.response_id), 0), 2),
    ROUND(AVG(rc.position_in_response), 0),
    SUM(CASE WHEN rc.position_in_response = 1 THEN 1 ELSE 0 END),
    AVG(rc.trust_score),
    BOOL_OR(rc.is_authoritative),
    p_period,
    v_period_start,
    v_period_end
  FROM response_citations rc
  WHERE rc.account_id = p_account_id
    AND rc.source_domain IS NOT NULL
    AND (p_simulation_id IS NULL OR rc.simulation_id = p_simulation_id)
    AND rc.created_at >= v_period_start
  GROUP BY rc.source_domain, rc.brand_id, rc.competitor_id
  ON CONFLICT (domain, metric_period, simulation_id)
  DO UPDATE SET
    total_citations = EXCLUDED.total_citations,
    unique_responses_citing = EXCLUDED.unique_responses_citing,
    used_percentage = EXCLUDED.used_percentage,
    avg_citations_per_response = EXCLUDED.avg_citations_per_response,
    avg_citation_position = EXCLUDED.avg_citation_position,
    first_citation_count = EXCLUDED.first_citation_count,
    trust_score = EXCLUDED.trust_score,
    is_authoritative = EXCLUDED.is_authoritative,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_citation_domain_analysis IS 'Aggregates citation data by domain for source analysis';

-- ============================================================================
-- Function: Refresh All External Report Metrics
-- ============================================================================
-- Master function to refresh all analytics tables for a brand
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_external_report_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_simulation_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Refresh all metric periods
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '7d');
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '90d');
  
  PERFORM calculate_topic_brand_associations(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_prompt_performance(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_citation_domain_analysis(p_account_id, p_simulation_id, '30d');
  
  -- Refresh materialized view
  PERFORM refresh_brand_metrics_latest();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_external_report_metrics IS 'Refreshes all external report analytics tables for a brand';
