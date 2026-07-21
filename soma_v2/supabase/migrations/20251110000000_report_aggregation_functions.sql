-- ============================================================================
-- REPORT AGGREGATION QUERIES
-- ============================================================================
-- Comprehensive SQL queries for aggregating response_analysis data
-- to power external brand visibility reports and dashboards
-- ============================================================================

-- ============================================================================
-- 1. LVI SCORE CALCULATION
-- ============================================================================
-- Composite score (0-100) combining:
-- - Visibility Score (30%): Mention rate across all responses
-- - Citation Rate (30%): % of mentions with citations
-- - Sentiment Score (20%): Average sentiment normalized to 0-100
-- - Position Score (20%): Average first mention position (inverted)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_lvi_score(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_model_names TEXT[] DEFAULT NULL,
  p_prompt_categories TEXT[] DEFAULT NULL,
  p_is_primary_brand BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  brand_name TEXT,
  is_primary_brand BOOLEAN,
  visibility_score NUMERIC,
  citation_rate NUMERIC,
  sentiment_score NUMERIC,
  position_score NUMERIC,
  lvi_score NUMERIC,
  total_responses BIGINT,
  mention_count BIGINT,
  citation_count BIGINT,
  avg_position NUMERIC,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      
      -- Counts
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      
      -- Visibility Score (0-100): Mention rate
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS visibility_score,
      
      -- Citation Rate (0-100): % of mentions with citations
      (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 AS citation_rate,
      
      -- Average sentiment and position for score calculation
      AVG(ra.brand_sentiment) AS avg_sentiment,
      AVG(ra.brand_first_position) AS avg_position
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = p_is_primary_brand
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
      AND (p_model_names IS NULL OR ra.model_name = ANY(p_model_names))
      AND (p_prompt_categories IS NULL OR ra.prompt_category = ANY(p_prompt_categories))
    GROUP BY ra.brand_name, ra.is_primary_brand
  )
  SELECT 
    m.brand_name,
    m.is_primary_brand,
    m.visibility_score,
    m.citation_rate,
    
    -- Sentiment Score (0-100): Convert -1 to 1 scale to 0-100
    ((COALESCE(m.avg_sentiment, 0) + 1) / 2) * 100 AS sentiment_score,
    
    -- Position Score (0-100): Lower position = higher score
    -- Position 1 = 100, Position 10 = 10
    LEAST(100, (1.0 / NULLIF(m.avg_position, 0)) * 100) AS position_score,
    
    -- LVI Score: Weighted average
    (
      (COALESCE(m.visibility_score, 0) * 0.3) +
      (COALESCE(m.citation_rate, 0) * 0.3) +
      (COALESCE(((m.avg_sentiment + 1) / 2) * 100, 0) * 0.2) +
      (COALESCE(LEAST(100, (1.0 / NULLIF(m.avg_position, 0)) * 100), 0) * 0.2)
    ) AS lvi_score,
    
    m.total_responses,
    m.mention_count,
    m.citation_count,
    m.avg_position,
    m.avg_sentiment
  FROM metrics m;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM calculate_lvi_score('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW());


-- ============================================================================
-- 2. INDUSTRY RANKINGS
-- ============================================================================
-- Aggregate metrics for all brands (primary + competitors)
-- Used for competitive benchmarking in rankings table
-- ============================================================================

CREATE OR REPLACE FUNCTION get_industry_rankings(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  brand_name TEXT,
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  avg_share_of_voice NUMERIC,
  citation_rate NUMERIC,
  mention_count BIGINT,
  first_position_count BIGINT,
  total_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH brand_metrics AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      
      -- Response counts
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      
      -- Mention rate
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      
      -- Position metrics
      AVG(ra.brand_first_position) AS avg_position,
      COUNT(CASE WHEN ra.brand_first_position = 1 THEN 1 END) AS first_position_count,
      
      -- Sentiment
      AVG(ra.brand_sentiment) AS avg_sentiment,
      
      -- Share of Voice
      AVG(ra.share_of_voice) AS avg_share_of_voice,
      
      -- Citations
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 AS citation_rate,
      
      -- LVI Score calculation
      (
        ((COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.3) +
        ((COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.3) +
        (((AVG(ra.brand_sentiment) + 1) / 2) * 100 * 0.2) +
        (LEAST(100, (1.0 / NULLIF(AVG(ra.brand_first_position), 0)) * 100) * 0.2)
      ) AS lvi_score
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
    GROUP BY ra.brand_name, ra.is_primary_brand
  ),
  ranked_brands AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY bm.lvi_score DESC)::INTEGER AS rank,
      bm.*
    FROM brand_metrics bm
  )
  SELECT 
    rb.rank,
    rb.brand_name,
    rb.is_primary_brand AS is_primary,
    rb.lvi_score,
    rb.mention_rate,
    rb.avg_position,
    rb.avg_sentiment,
    rb.avg_share_of_voice,
    rb.citation_rate,
    rb.mention_count,
    rb.first_position_count,
    rb.total_responses
  FROM ranked_brands rb
  ORDER BY rb.rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_industry_rankings('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW(), 10);


-- ============================================================================
-- 3. TIME SERIES DATA
-- ============================================================================
-- Daily aggregated metrics for trend charts
-- Returns data for primary brand and optionally competitors
-- ============================================================================

CREATE OR REPLACE FUNCTION get_timeseries_metrics(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_include_competitors BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  metric_date DATE,
  brand_name TEXT,
  is_primary BOOLEAN,
  total_responses BIGINT,
  mention_count BIGINT,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  citation_count BIGINT,
  citation_rate NUMERIC,
  lvi_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_metrics AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      DATE(ra.analyzed_at) AS metric_date,
      
      -- Daily counts
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      
      -- Mention rate
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      
      -- Position
      AVG(ra.brand_first_position) AS avg_position,
      
      -- Sentiment
      AVG(ra.brand_sentiment) AS avg_sentiment,
      
      -- Citations
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 AS citation_rate
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
      AND (p_include_competitors OR ra.is_primary_brand = TRUE)
    GROUP BY ra.brand_name, ra.is_primary_brand, DATE(ra.analyzed_at)
  )
  SELECT 
    dm.metric_date,
    dm.brand_name,
    dm.is_primary_brand AS is_primary,
    dm.total_responses,
    dm.mention_count,
    dm.mention_rate,
    dm.avg_position,
    dm.avg_sentiment,
    dm.citation_count,
    dm.citation_rate,
    
    -- Daily LVI Score
    (
      (COALESCE(dm.mention_rate, 0) * 0.3) +
      (COALESCE(dm.citation_rate, 0) * 0.3) +
      (COALESCE(((dm.avg_sentiment + 1) / 2) * 100, 0) * 0.2) +
      (COALESCE(LEAST(100, (1.0 / NULLIF(dm.avg_position, 0)) * 100), 0) * 0.2)
    ) AS lvi_score
    
  FROM daily_metrics dm
  ORDER BY dm.metric_date ASC, dm.is_primary_brand DESC, dm.brand_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_timeseries_metrics('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW(), TRUE);


-- ============================================================================
-- 4. BRAND-TOPIC MATRIX (HEATMAP DATA)
-- ============================================================================
-- Competitive topic analysis showing mention frequency across brands and topics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_topic_brand_matrix(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  brand_name TEXT,
  is_primary BOOLEAN,
  topic_name TEXT,
  topic_category TEXT,
  mention_count BIGINT,
  avg_relevance NUMERIC,
  avg_sentiment NUMERIC,
  occurrence_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_mentions AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      ra.response_id,
      jsonb_array_elements(ra.topics_covered) AS topic_data
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
      AND jsonb_array_length(ra.topics_covered) > 0
  ),
  topic_analysis AS (
    SELECT 
      tm.brand_name,
      tm.is_primary_brand,
      tm.topic_data->>'name' AS topic_name,
      tm.topic_data->>'category' AS topic_category,
      COUNT(*) AS mention_count,
      AVG((tm.topic_data->>'relevance')::NUMERIC) AS avg_relevance,
      AVG((tm.topic_data->>'sentiment')::NUMERIC) AS avg_sentiment
    FROM topic_mentions tm
    GROUP BY tm.brand_name, tm.is_primary_brand, tm.topic_data->>'name', tm.topic_data->>'category'
  ),
  brand_response_counts AS (
    SELECT 
      ra.brand_name,
      COUNT(DISTINCT ra.response_id) AS total_responses
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
    GROUP BY ra.brand_name
  )
  SELECT 
    ta.brand_name,
    ta.is_primary_brand AS is_primary,
    ta.topic_name,
    ta.topic_category,
    ta.mention_count,
    ta.avg_relevance,
    ta.avg_sentiment,
    -- Occurrence rate: % of brand's responses that mention this topic
    (ta.mention_count::NUMERIC / NULLIF(brc.total_responses, 0)::NUMERIC) * 100 AS occurrence_rate
  FROM topic_analysis ta
  JOIN brand_response_counts brc ON ta.brand_name = brc.brand_name
  ORDER BY ta.brand_name, ta.mention_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_topic_brand_matrix('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW());


-- ============================================================================
-- 5. SOURCES & CITATIONS ANALYSIS
-- ============================================================================
-- Analyze which domains are being cited and how frequently
-- ============================================================================

CREATE OR REPLACE FUNCTION get_source_citation_analysis(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  domain TEXT,
  source_type TEXT,
  citation_count BIGINT,
  brands_citing BIGINT,
  avg_citation_position NUMERIC,
  first_citation_count BIGINT,
  usage_frequency NUMERIC,
  cites_brand_exclusively BOOLEAN,
  sample_contexts TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH citation_sources AS (
    SELECT 
      ra.brand_name,
      ra.is_primary_brand,
      ra.response_id,
      jsonb_array_elements(ra.sources_cited) AS source_data
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.brand_cited = TRUE
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
      AND jsonb_array_length(ra.sources_cited) > 0
  ),
  source_analysis AS (
    SELECT 
      cs.brand_name,
      cs.is_primary_brand,
      cs.source_data->>'domain' AS domain,
      cs.source_data->>'type' AS source_type,
      (cs.source_data->>'position')::INTEGER AS citation_position,
      cs.source_data->>'context' AS context
    FROM citation_sources cs
  ),
  total_response_count AS (
    SELECT COUNT(DISTINCT response_id) AS total
    FROM response_analysis
    WHERE brand_id = p_brand_id
      AND analyzed_at >= p_start_date
      AND analyzed_at <= p_end_date
  )
  SELECT 
    sa.domain,
    sa.source_type,
    COUNT(*)::BIGINT AS citation_count,
    COUNT(DISTINCT sa.brand_name)::BIGINT AS brands_citing,
    AVG(sa.citation_position) AS avg_citation_position,
    COUNT(CASE WHEN sa.citation_position = 1 THEN 1 END)::BIGINT AS first_citation_count,
    
    -- Usage frequency: % of all responses that cite this domain
    (COUNT(*)::NUMERIC / (SELECT total FROM total_response_count)::NUMERIC) * 100 AS usage_frequency,
    
    -- Check if domain exclusively cites primary brand
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN sa.is_primary_brand THEN sa.brand_name END) > 0 
           AND COUNT(DISTINCT CASE WHEN NOT sa.is_primary_brand THEN sa.brand_name END) = 0
      THEN TRUE
      ELSE FALSE
    END AS cites_brand_exclusively,
    
    -- Sample contexts (up to 3)
    ARRAY_AGG(DISTINCT sa.context ORDER BY sa.context) 
      FILTER (WHERE sa.context IS NOT NULL)
      [1:3] AS sample_contexts
    
  FROM source_analysis sa
  GROUP BY sa.domain, sa.source_type
  ORDER BY citation_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_source_citation_analysis('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW(), 20);


-- ============================================================================
-- 6. PROMPT-BY-PROMPT ANALYSIS
-- ============================================================================
-- Detailed breakdown of each prompt with responses from all models
-- ============================================================================

CREATE OR REPLACE FUNCTION get_prompt_analysis(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  prompt_id TEXT,
  prompt_text TEXT,
  prompt_category TEXT,
  prompt_intent TEXT,
  analyses JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH prompt_responses AS (
    SELECT 
      ra.prompt_id,
      ra.prompt_text,
      ra.prompt_category,
      ra.prompt_intent,
      ra.model_name,
      ra.model_provider,
      ra.response_id,
      ra.brand_mentioned,
      ra.brand_mention_count,
      ra.brand_first_position,
      ra.brand_sentiment,
      ra.brand_citation_count,
      ra.competitors_mentioned,
      ra.analyzed_at
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = TRUE
      AND ra.analyzed_at >= p_start_date
      AND ra.analyzed_at <= p_end_date
  )
  SELECT 
    pr.prompt_id,
    pr.prompt_text,
    pr.prompt_category,
    pr.prompt_intent,
    jsonb_agg(
      jsonb_build_object(
        'model', pr.model_name,
        'model_provider', pr.model_provider,
        'response_id', pr.response_id,
        'brand_mentioned', pr.brand_mentioned,
        'mention_count', pr.brand_mention_count,
        'position', pr.brand_first_position,
        'sentiment', pr.brand_sentiment,
        'citations', pr.brand_citation_count,
        'competitors_mentioned', pr.competitors_mentioned,
        'date', pr.analyzed_at
      ) ORDER BY pr.model_name
    ) AS analyses
  FROM prompt_responses pr
  GROUP BY pr.prompt_id, pr.prompt_text, pr.prompt_category, pr.prompt_intent
  ORDER BY pr.prompt_text;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_prompt_analysis('brand-uuid-here'::UUID, NOW() - INTERVAL '30 days', NOW());


-- ============================================================================
-- 7. STATS CARDS WITH TRENDS
-- ============================================================================
-- Top-level metrics with change from previous period
-- ============================================================================

CREATE OR REPLACE FUNCTION get_stats_with_trends(
  p_brand_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  brand_name TEXT,
  mention_rate NUMERIC,
  mention_rate_change NUMERIC,
  avg_sentiment NUMERIC,
  sentiment_change NUMERIC,
  avg_position NUMERIC,
  position_change NUMERIC,
  citation_count BIGINT,
  citation_change BIGINT,
  lvi_score NUMERIC,
  lvi_score_change NUMERIC,
  total_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      ra.brand_name,
      COUNT(*) AS total_responses,
      COUNT(CASE WHEN ra.brand_mentioned THEN 1 END) AS mention_count,
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      AVG(ra.brand_sentiment) AS avg_sentiment,
      AVG(ra.brand_first_position) AS avg_position,
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      (COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 AS citation_rate,
      
      -- LVI Score
      (
        ((COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.3) +
        ((COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.3) +
        (((AVG(ra.brand_sentiment) + 1) / 2) * 100 * 0.2) +
        (LEAST(100, (1.0 / NULLIF(AVG(ra.brand_first_position), 0)) * 100) * 0.2)
      ) AS lvi_score
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = TRUE
      AND ra.analyzed_at >= NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY ra.brand_name
  ),
  previous_period AS (
    SELECT 
      ra.brand_name,
      (COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100 AS mention_rate,
      AVG(ra.brand_sentiment) AS avg_sentiment,
      AVG(ra.brand_first_position) AS avg_position,
      COUNT(CASE WHEN ra.brand_cited THEN 1 END) AS citation_count,
      
      -- LVI Score
      (
        ((COUNT(CASE WHEN ra.brand_mentioned THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100 * 0.3) +
        ((COUNT(CASE WHEN ra.brand_cited THEN 1 END)::NUMERIC / NULLIF(COUNT(CASE WHEN ra.brand_mentioned THEN 1 END), 0)::NUMERIC) * 100 * 0.3) +
        (((AVG(ra.brand_sentiment) + 1) / 2) * 100 * 0.2) +
        (LEAST(100, (1.0 / NULLIF(AVG(ra.brand_first_position), 0)) * 100) * 0.2)
      ) AS lvi_score
      
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = TRUE
      AND ra.analyzed_at >= NOW() - INTERVAL '1 day' * (p_period_days * 2)
      AND ra.analyzed_at < NOW() - INTERVAL '1 day' * p_period_days
    GROUP BY ra.brand_name
  )
  SELECT 
    c.brand_name,
    c.mention_rate,
    c.mention_rate - COALESCE(p.mention_rate, 0) AS mention_rate_change,
    c.avg_sentiment,
    c.avg_sentiment - COALESCE(p.avg_sentiment, 0) AS sentiment_change,
    c.avg_position,
    c.avg_position - COALESCE(p.avg_position, 0) AS position_change,
    c.citation_count,
    c.citation_count - COALESCE(p.citation_count, 0) AS citation_change,
    c.lvi_score,
    c.lvi_score - COALESCE(p.lvi_score, 0) AS lvi_score_change,
    c.total_responses
  FROM current_period c
  LEFT JOIN previous_period p ON c.brand_name = p.brand_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT * FROM get_stats_with_trends('brand-uuid-here'::UUID, 30);


-- ============================================================================
-- 8. COMPREHENSIVE REPORT DATA (ALL IN ONE)
-- ============================================================================
-- Returns all report sections in a single query for efficiency
-- ============================================================================

CREATE OR REPLACE FUNCTION get_comprehensive_report(
  p_brand_id UUID,
  p_period_days INTEGER DEFAULT 30,
  p_include_competitors BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_stats JSONB;
  v_rankings JSONB;
  v_timeseries JSONB;
  v_topics JSONB;
  v_sources JSONB;
  v_prompts JSONB;
  v_metadata JSONB;
BEGIN
  -- Get stats with trends
  SELECT jsonb_agg(row_to_json(s))
  INTO v_stats
  FROM get_stats_with_trends(p_brand_id, p_period_days) s;
  
  -- Get industry rankings
  SELECT jsonb_agg(row_to_json(r))
  INTO v_rankings
  FROM get_industry_rankings(p_brand_id, NOW() - INTERVAL '1 day' * p_period_days, NOW(), 10) r;
  
  -- Get timeseries data
  SELECT jsonb_agg(row_to_json(t))
  INTO v_timeseries
  FROM get_timeseries_metrics(p_brand_id, NOW() - INTERVAL '1 day' * p_period_days, NOW(), p_include_competitors) t;
  
  -- Get topic matrix
  SELECT jsonb_agg(row_to_json(tm))
  INTO v_topics
  FROM get_topic_brand_matrix(p_brand_id, NOW() - INTERVAL '1 day' * p_period_days, NOW()) tm;
  
  -- Get sources
  SELECT jsonb_agg(row_to_json(sc))
  INTO v_sources
  FROM get_source_citation_analysis(p_brand_id, NOW() - INTERVAL '1 day' * p_period_days, NOW(), 20) sc;
  
  -- Get prompt analysis
  SELECT jsonb_agg(row_to_json(pa))
  INTO v_prompts
  FROM get_prompt_analysis(p_brand_id, NOW() - INTERVAL '1 day' * p_period_days, NOW()) pa;
  
  -- Get metadata
  SELECT jsonb_build_object(
    'total_responses', COUNT(DISTINCT response_id),
    'total_prompts', COUNT(DISTINCT prompt_id),
    'total_models', COUNT(DISTINCT model_name),
    'period', p_period_days || 'd',
    'last_updated', NOW()
  )
  INTO v_metadata
  FROM response_analysis
  WHERE brand_id = p_brand_id
    AND analyzed_at >= NOW() - INTERVAL '1 day' * p_period_days;
  
  -- Combine all data
  v_result := jsonb_build_object(
    'stats', COALESCE(v_stats, '[]'::jsonb),
    'rankings', COALESCE(v_rankings, '[]'::jsonb),
    'timeseries', COALESCE(v_timeseries, '[]'::jsonb),
    'topicMatrix', COALESCE(v_topics, '[]'::jsonb),
    'sources', COALESCE(v_sources, '[]'::jsonb),
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'metadata', v_metadata
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage:
-- SELECT get_comprehensive_report('brand-uuid-here'::UUID, 30, TRUE);


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_lvi_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_industry_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION get_timeseries_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_brand_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_citation_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_prompt_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_stats_with_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_report TO authenticated;
