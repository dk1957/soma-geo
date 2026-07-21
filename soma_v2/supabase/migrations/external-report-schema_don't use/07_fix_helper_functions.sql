-- ============================================================================
-- Fixed Helper Functions for External Report Analytics
-- ============================================================================
-- Updated to work with actual database schema (response_analysis, not competitor_response_analysis)
-- ============================================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS calculate_brand_performance_metrics(UUID, UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS calculate_topic_brand_associations(UUID, UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS calculate_prompt_performance(UUID, UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS calculate_citation_domain_analysis(UUID, UUID, UUID, VARCHAR);
DROP FUNCTION IF EXISTS refresh_external_report_metrics(UUID, UUID, UUID);

-- ============================================================================
-- Function: Calculate Brand Performance Metrics
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
  v_brand_name VARCHAR(255);
BEGIN
  -- Calculate period dates
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  -- Get brand name
  SELECT name INTO v_brand_name FROM brands WHERE id = p_brand_id;

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
    true,
    p_period,
    v_period_start,
    v_period_end,
    COUNT(DISTINCT prompt_id),
    COUNT(*),
    COALESCE(SUM(primary_brand_mentions), 0),
    ROUND((SUM(CASE WHEN primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(NULLIF(primary_brand_avg_position, 0)), 2),
    SUM(CASE WHEN primary_brand_first_position <= 3 AND primary_brand_first_position IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position = 1 THEN 1 ELSE 0 END),
    ROUND(AVG(primary_brand_sentiment), 2),
    SUM(CASE WHEN primary_brand_sentiment > 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment >= 0.3 AND primary_brand_sentiment <= 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment < 0.3 THEN 1 ELSE 0 END),
    COALESCE(SUM(primary_brand_sources), 0),
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

  -- Insert/Update competitor metrics (from brands_mentioned JSONB field)
  WITH competitor_stats AS (
    SELECT
      comp.competitor_name,
      comp.id as competitor_id,
      COUNT(DISTINCT ra.prompt_id) as unique_prompts,
      COUNT(*) as total_responses,
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
             (brand_elem->'positions'->0)::text::int <= 3
        THEN 1 ELSE 0 
      END) as top_3_count,
      SUM(CASE 
        WHEN jsonb_array_length(brand_elem->'positions') > 0 AND
             (brand_elem->'positions'->0)::text::int = 1
        THEN 1 ELSE 0 
      END) as first_position_count
    FROM response_analysis ra
    CROSS JOIN LATERAL jsonb_array_elements(ra.brands_mentioned) brand_elem
    JOIN competitors comp ON comp.competitor_name = brand_elem->>'name' AND comp.brand_id = p_brand_id
    WHERE ra.account_id = p_account_id
      AND ra.brand_id = p_brand_id
      AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
      AND ra.analyzed_at >= v_period_start
    GROUP BY comp.competitor_name, comp.id
  )
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
    total_prompts_analyzed,
    total_responses_analyzed,
    total_mentions,
    mention_rate,
    avg_ranking_position,
    top_3_mentions,
    first_position_count,
    lvi_score,
    sample_size
  )
  SELECT
    p_brand_id,
    cs.competitor_id,
    p_account_id,
    p_simulation_id,
    cs.competitor_name,
    false,
    p_period,
    v_period_start,
    v_period_end,
    cs.unique_prompts,
    cs.total_responses,
    cs.total_mentions,
    ROUND((cs.mention_count::NUMERIC / NULLIF(cs.total_responses, 0) * 100), 2),
    ROUND(cs.avg_position, 2),
    cs.top_3_count,
    cs.first_position_count,
    -- Simple LVI calculation for competitors: mention_rate * 0.6 + (100 - avg_position) * 0.4
    ROUND(
      (cs.mention_count::NUMERIC / NULLIF(cs.total_responses, 0) * 60) + 
      ((100 - COALESCE(cs.avg_position, 100)) * 0.4), 
      2
    ),
    cs.total_responses
  FROM competitor_stats cs
  ON CONFLICT (brand_id, metric_period, simulation_id, competitor_id)
  DO UPDATE SET
    total_prompts_analyzed = EXCLUDED.total_prompts_analyzed,
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    total_mentions = EXCLUDED.total_mentions,
    mention_rate = EXCLUDED.mention_rate,
    avg_ranking_position = EXCLUDED.avg_ranking_position,
    top_3_mentions = EXCLUDED.top_3_mentions,
    first_position_count = EXCLUDED.first_position_count,
    lvi_score = EXCLUDED.lvi_score,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Calculate Topic Brand Associations (Simplified)
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
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  -- Extract topics from prompts and calculate associations
  -- This is a placeholder - in production you'd use actual topic extraction
  INSERT INTO topic_brand_associations (
    account_id,
    brand_id,
    simulation_id,
    topic_name,
    brand_name,
    is_primary_brand,
    metric_period,
    period_start_date,
    period_end_date,
    relevance_score,
    co_occurrence_rate,
    mention_count,
    total_responses_analyzed
  )
  SELECT
    p_account_id,
    p_brand_id,
    p_simulation_id,
    'General Topic' as topic_name,  -- Placeholder
    b.name as brand_name,
    true as is_primary_brand,
    p_period,
    v_period_start,
    v_period_end,
    50.0 as relevance_score,
    ROUND((SUM(CASE WHEN ra.primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    SUM(ra.primary_brand_mentions),
    COUNT(*)
  FROM response_analysis ra
  JOIN brands b ON b.id = ra.brand_id
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    AND ra.analyzed_at >= v_period_start
  GROUP BY b.name
  ON CONFLICT (brand_name, topic_name, metric_period, simulation_id)
  DO UPDATE SET
    relevance_score = EXCLUDED.relevance_score,
    co_occurrence_rate = EXCLUDED.co_occurrence_rate,
    mention_count = EXCLUDED.mention_count,
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Calculate Prompt Performance Analysis
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
  v_brand_name VARCHAR(255);
BEGIN
  v_period_end := NOW();
  v_period_start := CASE
    WHEN p_period = '7d' THEN v_period_end - INTERVAL '7 days'
    WHEN p_period = '30d' THEN v_period_end - INTERVAL '30 days'
    WHEN p_period = '90d' THEN v_period_end - INTERVAL '90 days'
    ELSE v_period_end - INTERVAL '10 years'
  END;

  SELECT name INTO v_brand_name FROM brands WHERE id = p_brand_id;

  INSERT INTO prompt_performance_analysis (
    account_id,
    primary_brand_id,
    primary_brand_name,
    prompt_id,
    simulation_id,
    prompt_text,
    metric_period,
    period_start_date,
    period_end_date,
    total_responses,
    primary_brand_lvi,
    primary_brand_mention_rate,
    primary_brand_avg_position,
    primary_brand_citations,
    is_opportunity,
    is_threat,
    is_strength,
    opportunity_score
  )
  SELECT
    ra.account_id,
    p_brand_id,
    v_brand_name,
    ra.prompt_id,
    ra.simulation_id,
    up.prompt_text,
    p_period,
    v_period_start,
    v_period_end,
    COUNT(*) as total_responses,
    ROUND(AVG(ra.llm_visibility_index), 2) as primary_lvi,
    ROUND((SUM(CASE WHEN ra.primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100), 2) as mention_rate,
    ROUND(AVG(NULLIF(ra.primary_brand_avg_position, 0)), 2) as avg_position,
    SUM(ra.primary_brand_sources) as citations,
    false as is_opportunity,
    false as is_threat,
    true as is_strength,
    50.0 as opportunity_score
  FROM response_analysis ra
  JOIN user_prompts up ON up.id = ra.prompt_id
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    AND ra.analyzed_at >= v_period_start
  GROUP BY ra.account_id, ra.prompt_id, ra.simulation_id, up.prompt_text
  ON CONFLICT (prompt_id, metric_period, simulation_id)
  DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    primary_brand_lvi = EXCLUDED.primary_brand_lvi,
    primary_brand_mention_rate = EXCLUDED.primary_brand_mention_rate,
    primary_brand_avg_position = EXCLUDED.primary_brand_avg_position,
    primary_brand_citations = EXCLUDED.primary_brand_citations,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Calculate Citation Domain Analysis
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_citation_domain_analysis(
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

  -- Extract domain data from sources_found JSONB
  WITH domain_stats AS (
    SELECT
      (source_elem->>'domain')::text as domain,
      COALESCE((source_elem->>'type')::text, 'unknown') as domain_type,
      COUNT(*) as total_citations,
      COUNT(DISTINCT ra.response_id) as unique_responses,
      SUM(CASE WHEN ra.primary_brand_mentions > 0 THEN 1 ELSE 0 END) as primary_brand_cites
    FROM response_analysis ra
    CROSS JOIN LATERAL jsonb_array_elements(ra.sources_found) source_elem
    WHERE ra.account_id = p_account_id
      AND ra.brand_id = p_brand_id
      AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
      AND ra.analyzed_at >= v_period_start
      AND (source_elem->>'domain') IS NOT NULL
    GROUP BY (source_elem->>'domain'), (source_elem->>'type')
  )
  INSERT INTO citation_domain_analysis (
    account_id,
    brand_id,
    simulation_id,
    domain,
    domain_type,
    metric_period,
    period_start_date,
    period_end_date,
    total_citations,
    unique_responses_citing,
    used_percentage,
    cites_primary_brand,
    is_target_publisher
  )
  SELECT
    p_account_id,
    p_brand_id,
    p_simulation_id,
    ds.domain,
    ds.domain_type,
    p_period,
    v_period_start,
    v_period_end,
    ds.total_citations,
    ds.unique_responses,
    ROUND((ds.unique_responses::NUMERIC / NULLIF(
      (SELECT COUNT(DISTINCT response_id) FROM response_analysis 
       WHERE account_id = p_account_id AND brand_id = p_brand_id 
       AND analyzed_at >= v_period_start), 0
    ) * 100), 2) as used_percentage,
    ds.primary_brand_cites > 0 as cites_primary_brand,
    false as is_target_publisher
  FROM domain_stats ds
  WHERE ds.total_citations >= 2  -- Filter out noise
  ON CONFLICT (domain, metric_period, simulation_id)
  DO UPDATE SET
    total_citations = EXCLUDED.total_citations,
    unique_responses_citing = EXCLUDED.unique_responses_citing,
    used_percentage = EXCLUDED.used_percentage,
    cites_primary_brand = EXCLUDED.cites_primary_brand,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Refresh All External Report Metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_external_report_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_simulation_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Refresh all metric tables for all periods
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '7d');
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, '90d');
  PERFORM calculate_brand_performance_metrics(p_account_id, p_brand_id, p_simulation_id, 'all');
  
  PERFORM calculate_topic_brand_associations(p_account_id, p_brand_id, p_simulation_id, '7d');
  PERFORM calculate_topic_brand_associations(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_topic_brand_associations(p_account_id, p_brand_id, p_simulation_id, '90d');
  PERFORM calculate_topic_brand_associations(p_account_id, p_brand_id, p_simulation_id, 'all');
  
  PERFORM calculate_prompt_performance(p_account_id, p_brand_id, p_simulation_id, '7d');
  PERFORM calculate_prompt_performance(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_prompt_performance(p_account_id, p_brand_id, p_simulation_id, '90d');
  PERFORM calculate_prompt_performance(p_account_id, p_brand_id, p_simulation_id, 'all');
  
  PERFORM calculate_citation_domain_analysis(p_account_id, p_brand_id, p_simulation_id, '7d');
  PERFORM calculate_citation_domain_analysis(p_account_id, p_brand_id, p_simulation_id, '30d');
  PERFORM calculate_citation_domain_analysis(p_account_id, p_brand_id, p_simulation_id, '90d');
  PERFORM calculate_citation_domain_analysis(p_account_id, p_brand_id, p_simulation_id, 'all');
  
  -- Refresh materialized view (non-concurrent since we don't have a unique index)
  REFRESH MATERIALIZED VIEW brand_metrics_latest;
  
  RAISE NOTICE 'External report metrics refreshed for brand % in account %', p_brand_id, p_account_id;
END;
$$ LANGUAGE plpgsql;
