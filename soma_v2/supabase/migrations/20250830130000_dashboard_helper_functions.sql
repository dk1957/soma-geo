-- Dashboard Helper Functions
-- Migration: 20250830130000_dashboard_helper_functions.sql
-- Purpose: Helper functions for dashboard data aggregation

-- Function to get audit counts for dashboard summary
CREATE OR REPLACE FUNCTION get_audit_counts(audit_uuid UUID)
RETURNS TABLE (
  competitor_count INTEGER,
  mention_count INTEGER,
  opportunity_count INTEGER,
  source_count INTEGER,
  query_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM competitor_intelligence WHERE audit_id = audit_uuid) as competitor_count,
    (SELECT COUNT(*)::INTEGER FROM llm_test_results WHERE audit_id = audit_uuid AND brand_mentioned = TRUE) as mention_count,
    (SELECT COUNT(*)::INTEGER FROM optimization_opportunities WHERE audit_id = audit_uuid) as opportunity_count,
    (SELECT COUNT(*)::INTEGER FROM source_analysis WHERE audit_id = audit_uuid) as source_count,
    (SELECT COUNT(*)::INTEGER FROM query_performance WHERE audit_id = audit_uuid) as query_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate real-time LDI score for a platform
CREATE OR REPLACE FUNCTION calculate_platform_ldi(audit_uuid UUID, platform_filter TEXT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_tests INTEGER;
  successful_mentions INTEGER;
  avg_relevance DECIMAL(5,2);
  avg_quality DECIMAL(5,2);
  positive_sentiment_rate DECIMAL(5,2);
  ldi_result DECIMAL(5,2);
BEGIN
  -- Get test statistics for specific platform
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE brand_mentioned = TRUE),
    AVG(relevance_score),
    AVG(response_quality_score),
    (COUNT(*) FILTER (WHERE sentiment = 'positive' AND brand_mentioned = TRUE)::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE brand_mentioned = TRUE), 0)) * 100
  INTO total_tests, successful_mentions, avg_relevance, avg_quality, positive_sentiment_rate
  FROM llm_test_results
  WHERE audit_id = audit_uuid
  AND (platform_filter IS NULL OR llm_name ILIKE '%' || platform_filter || '%');
  
  -- Calculate LDI score using weighted formula
  IF total_tests > 0 THEN
    ldi_result := (
      ((successful_mentions::DECIMAL / total_tests) * 40) +
      (COALESCE(avg_relevance, 0) * 0.25) +
      (COALESCE(avg_quality, 0) * 0.20) +
      (COALESCE(positive_sentiment_rate, 0) * 0.15)
    );
  ELSE
    ldi_result := 0;
  END IF;
  
  RETURN LEAST(ldi_result, 100.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get competitive position analysis
CREATE OR REPLACE FUNCTION get_competitive_position(audit_uuid UUID)
RETURNS TABLE (
  brand_avg_ldi DECIMAL(5,2),
  competitor_avg_ldi DECIMAL(5,2),
  competitive_advantage DECIMAL(5,2),
  market_position_rank INTEGER,
  improvement_potential DECIMAL(5,2)
) AS $$
DECLARE
  brand_ldi DECIMAL(5,2);
  comp_avg DECIMAL(5,2);
BEGIN
  -- Calculate brand's LDI score
  brand_ldi := calculate_ldi_score(audit_uuid);
  
  -- Calculate average competitor LDI
  SELECT AVG(visibility_score) INTO comp_avg
  FROM competitor_intelligence
  WHERE audit_id = audit_uuid;
  
  RETURN QUERY
  SELECT 
    brand_ldi as brand_avg_ldi,
    COALESCE(comp_avg, 0) as competitor_avg_ldi,
    GREATEST(brand_ldi - COALESCE(comp_avg, 0), 0) as competitive_advantage,
    CASE 
      WHEN brand_ldi > COALESCE(comp_avg, 0) + 20 THEN 1
      WHEN brand_ldi > COALESCE(comp_avg, 0) + 10 THEN 2  
      WHEN brand_ldi > COALESCE(comp_avg, 0) THEN 3
      ELSE 4
    END as market_position_rank,
    CASE 
      WHEN brand_ldi < 30 THEN 50.0
      WHEN brand_ldi < 50 THEN 35.0
      WHEN brand_ldi < 70 THEN 25.0
      ELSE 15.0
    END as improvement_potential;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform performance breakdown
CREATE OR REPLACE FUNCTION get_platform_performance(audit_uuid UUID)
RETURNS TABLE (
  platform_name TEXT,
  total_tests INTEGER,
  successful_mentions INTEGER,
  mention_rate DECIMAL(5,2),
  avg_mention_rank DECIMAL(5,2),
  positive_sentiment_count INTEGER,
  neutral_sentiment_count INTEGER,
  negative_sentiment_count INTEGER,
  platform_ldi_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ltr.llm_name as platform_name,
    COUNT(*)::INTEGER as total_tests,
    COUNT(*) FILTER (WHERE ltr.brand_mentioned = TRUE)::INTEGER as successful_mentions,
    (COUNT(*) FILTER (WHERE ltr.brand_mentioned = TRUE)::DECIMAL / COUNT(*)) * 100 as mention_rate,
    AVG(ltr.mention_rank) FILTER (WHERE ltr.mention_rank IS NOT NULL) as avg_mention_rank,
    COUNT(*) FILTER (WHERE ltr.sentiment = 'positive')::INTEGER as positive_sentiment_count,
    COUNT(*) FILTER (WHERE ltr.sentiment = 'neutral')::INTEGER as neutral_sentiment_count,
    COUNT(*) FILTER (WHERE ltr.sentiment = 'negative')::INTEGER as negative_sentiment_count,
    calculate_platform_ldi(audit_uuid, SPLIT_PART(ltr.llm_name, '-', 1)) as platform_ldi_score
  FROM llm_test_results ltr
  WHERE ltr.audit_id = audit_uuid
  GROUP BY ltr.llm_name
  ORDER BY mention_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing queries
CREATE OR REPLACE FUNCTION get_top_queries(audit_uuid UUID, query_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  query_text TEXT,
  overall_performance DECIMAL(5,2),
  mention_success_rate DECIMAL(5,2),
  best_platform TEXT,
  optimization_needed BOOLEAN,
  estimated_improvement DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qp.query_text,
    qp.overall_performance_score as overall_performance,
    qp.mention_success_rate,
    qp.best_performing_platform as best_platform,
    qp.optimization_needed,
    qp.estimated_improvement_potential as estimated_improvement
  FROM query_performance qp
  WHERE qp.audit_id = audit_uuid
  ORDER BY qp.overall_performance_score DESC
  LIMIT query_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get optimization opportunities ranked by impact
CREATE OR REPLACE FUNCTION get_optimization_opportunities(audit_uuid UUID, priority_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  opportunity_id UUID,
  opportunity_type TEXT,
  description TEXT,
  priority TEXT,
  impact_score DECIMAL(5,2),
  effort_required TEXT,
  category TEXT,
  estimated_roi DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oo.id as opportunity_id,
    oo.type as opportunity_type,
    oo.description,
    oo.priority,
    oo.impact_score,
    oo.effort_required,
    oo.category,
    -- Simple ROI calculation based on impact vs effort
    CASE 
      WHEN oo.effort_required = 'low' THEN oo.impact_score * 1.5
      WHEN oo.effort_required = 'medium' THEN oo.impact_score * 1.0
      WHEN oo.effort_required = 'high' THEN oo.impact_score * 0.5
      ELSE oo.impact_score
    END as estimated_roi
  FROM optimization_opportunities oo
  WHERE oo.audit_id = audit_uuid
  AND (priority_filter IS NULL OR oo.priority = priority_filter)
  ORDER BY 
    CASE oo.priority
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END DESC,
    oo.impact_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update foundational metrics (batch update)
CREATE OR REPLACE FUNCTION update_foundational_metrics(audit_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  calculated_visibility DECIMAL(5,2);
  calculated_ldi DECIMAL(5,2);
  calculated_authority DECIMAL(5,2);
  calculated_market_position DECIMAL(5,2);
  total_mentions INTEGER;
  positive_mentions INTEGER;
  neutral_mentions INTEGER;
  negative_mentions INTEGER;
BEGIN
  -- Calculate all metrics
  calculated_ldi := calculate_ldi_score(audit_uuid);
  calculated_visibility := calculate_visibility_score(audit_uuid);
  calculated_authority := (
    SELECT AVG(domain_authority) * 0.8 
    FROM source_analysis 
    WHERE audit_id = audit_uuid AND brand_citations > 0
  );
  
  -- Get mention counts
  SELECT 
    COUNT(*) FILTER (WHERE brand_mentioned = TRUE),
    COUNT(*) FILTER (WHERE brand_mentioned = TRUE AND sentiment = 'positive'),
    COUNT(*) FILTER (WHERE brand_mentioned = TRUE AND sentiment = 'neutral'),
    COUNT(*) FILTER (WHERE brand_mentioned = TRUE AND sentiment = 'negative')
  INTO total_mentions, positive_mentions, neutral_mentions, negative_mentions
  FROM llm_test_results
  WHERE audit_id = audit_uuid;
  
  -- Calculate market position (competitive advantage + visibility)
  calculated_market_position := (
    SELECT (calculated_ldi - COALESCE(AVG(visibility_score), 0)) * 0.6 + calculated_visibility * 0.4
    FROM competitor_intelligence
    WHERE audit_id = audit_uuid
  );
  
  -- Update or insert foundational metrics
  INSERT INTO foundational_metrics (
    audit_id, 
    brand_name,
    visibility_score,
    ldi_score,
    authority_index,
    market_position_score,
    total_mentions,
    positive_mentions,
    neutral_mentions,
    negative_mentions,
    mention_rate,
    chatgpt_ldi,
    claude_ldi,
    gemini_ldi,
    perplexity_ldi,
    updated_at
  ) 
  SELECT 
    audit_uuid,
    oa.brand_name,
    COALESCE(calculated_visibility, 0),
    calculated_ldi,
    COALESCE(calculated_authority, 0),
    COALESCE(calculated_market_position, calculated_ldi),
    total_mentions,
    positive_mentions,
    neutral_mentions,
    negative_mentions,
    CASE WHEN EXISTS(SELECT 1 FROM llm_test_results WHERE audit_id = audit_uuid) 
         THEN (total_mentions::DECIMAL / (SELECT COUNT(*) FROM llm_test_results WHERE audit_id = audit_uuid)) * 100
         ELSE 0 END,
    calculate_platform_ldi(audit_uuid, 'gpt'),
    calculate_platform_ldi(audit_uuid, 'claude'),  
    calculate_platform_ldi(audit_uuid, 'gemini'),
    calculate_platform_ldi(audit_uuid, 'llama'),
    NOW()
  FROM onboarding_audits oa 
  WHERE oa.id = audit_uuid
  ON CONFLICT (audit_id) 
  DO UPDATE SET
    visibility_score = EXCLUDED.visibility_score,
    ldi_score = EXCLUDED.ldi_score,
    authority_index = EXCLUDED.authority_index,
    market_position_score = EXCLUDED.market_position_score,
    total_mentions = EXCLUDED.total_mentions,
    positive_mentions = EXCLUDED.positive_mentions,
    neutral_mentions = EXCLUDED.neutral_mentions,
    negative_mentions = EXCLUDED.negative_mentions,
    mention_rate = EXCLUDED.mention_rate,
    chatgpt_ldi = EXCLUDED.chatgpt_ldi,
    claude_ldi = EXCLUDED.claude_ldi,
    gemini_ldi = EXCLUDED.gemini_ldi,
    perplexity_ldi = EXCLUDED.perplexity_ldi,
    updated_at = NOW();
    
  RETURN TRUE;
  
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_audit_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_platform_ldi(UUID, TEXT) TO authenticated;  
GRANT EXECUTE ON FUNCTION get_competitive_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_queries(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_optimization_opportunities(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_foundational_metrics(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_audit_counts IS 'Get summary counts for dashboard display';
COMMENT ON FUNCTION calculate_platform_ldi IS 'Calculate LDI score for specific platform';
COMMENT ON FUNCTION get_competitive_position IS 'Analyze competitive positioning and market rank';
COMMENT ON FUNCTION get_platform_performance IS 'Detailed performance breakdown by AI platform';
COMMENT ON FUNCTION get_top_queries IS 'Get top performing queries for optimization insights';
COMMENT ON FUNCTION get_optimization_opportunities IS 'Get prioritized optimization opportunities';
COMMENT ON FUNCTION update_foundational_metrics IS 'Batch update all foundational metrics for an audit';