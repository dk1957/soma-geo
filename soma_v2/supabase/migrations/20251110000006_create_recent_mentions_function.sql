-- Create function to get recent brand mentions
-- Returns latest AI responses that mentioned the primary brand

CREATE OR REPLACE FUNCTION get_recent_brand_mentions(
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  prompt_text TEXT,
  rank INTEGER,
  mentions INTEGER,
  date DATE,
  model_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.prompt_text,
    -- Get first position from brand_positions array (this is the primary rank)
    CASE 
      WHEN ra.brand_positions IS NOT NULL AND array_length(ra.brand_positions, 1) > 0 
      THEN ra.brand_positions[1]
      ELSE NULL 
    END as rank,
    ra.brand_mention_count as mentions,
    ra.analysis_date as date,
    ra.model_name::VARCHAR(255)
  FROM response_analysis ra
  WHERE ra.brand_id = p_brand_id
    AND ra.is_primary_brand = true
    AND ra.brand_mentioned = true
    AND ra.analysis_date >= p_start_date
    AND ra.analysis_date <= p_end_date
  ORDER BY ra.analysis_date DESC, ra.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO service_role;

-- Comment
COMMENT ON FUNCTION get_recent_brand_mentions IS 'Returns recent AI chat responses that mentioned the primary brand, ordered by date descending';
