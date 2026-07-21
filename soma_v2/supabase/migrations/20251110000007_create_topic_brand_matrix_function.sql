-- Create function to generate topic-brand matrix from topics_covered JSONB
-- Returns a matrix showing which brands are associated with which topics
-- Filters to only include topics with relevance > 0.5

CREATE OR REPLACE FUNCTION get_topic_brand_matrix(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_min_relevance NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
  topic_name VARCHAR(255),
  brand_name VARCHAR(255),
  mention_count INTEGER,
  avg_relevance NUMERIC,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_data AS (
    -- Extract individual topics from JSONB array
    SELECT 
      ra.brand_name,
      topic->>'name' as topic,
      (topic->>'relevance')::NUMERIC as relevance,
      (topic->>'sentiment')::NUMERIC as sentiment
    FROM response_analysis ra,
    LATERAL jsonb_array_elements(ra.topics_covered) AS topic
    WHERE ra.account_id = p_account_id
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
      AND ra.topics_covered IS NOT NULL
      AND jsonb_array_length(ra.topics_covered) > 0
      AND (topic->>'relevance')::NUMERIC > p_min_relevance
  )
  SELECT 
    td.topic::VARCHAR(255) as topic_name,
    td.brand_name::VARCHAR(255),
    COUNT(*)::INTEGER as mention_count,
    ROUND(AVG(td.relevance), 2) as avg_relevance,
    ROUND(AVG(td.sentiment), 2) as avg_sentiment
  FROM topic_data td
  GROUP BY td.topic, td.brand_name
  HAVING COUNT(*) > 0
  ORDER BY td.topic, mention_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_topic_brand_matrix(UUID, UUID, DATE, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_brand_matrix(UUID, UUID, DATE, DATE, NUMERIC) TO service_role;

-- Comment
COMMENT ON FUNCTION get_topic_brand_matrix IS 'Generates topic-brand matrix from response_analysis.topics_covered JSONB, showing which brands are associated with which topics. Filters to relevance > 0.5 by default.';
