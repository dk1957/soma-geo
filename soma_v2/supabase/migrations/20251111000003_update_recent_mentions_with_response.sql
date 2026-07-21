-- Update recent brand mentions to include response snippet and proper data structure
-- This supports the "Recent Chats" view with prompt, response snippet, models, sources, and date

DROP FUNCTION IF EXISTS get_recent_brand_mentions(UUID, DATE, DATE, INTEGER);

CREATE OR REPLACE FUNCTION get_recent_brand_mentions(
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  prompt_text TEXT,
  response_snippet TEXT,
  brand_position INTEGER,
  mentioned_brands JSONB,
  model_name VARCHAR(255),
  model_provider VARCHAR(255),
  sources_cited JSONB,
  analysis_date DATE,
  response_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_responses AS (
    SELECT 
      ra.prompt_text,
      ra.response_id,
      ra.brand_first_position,
      ra.competitors_mentioned,
      ra.brand_name,
      ra.model_name,
      ra.model_provider,
      ra.sources_cited,
      ra.analysis_date,
      -- Rank by date to get most recent
      ROW_NUMBER() OVER (ORDER BY ra.analysis_date DESC, ra.created_at DESC) as rn
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = true
      AND ra.brand_mentioned = true
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
  ),
  brands_with_details AS (
    SELECT 
      rr.*,
      -- Build array of all mentioned brands (primary + competitors)
      jsonb_build_array(
        jsonb_build_object(
          'name', rr.brand_name,
          'isPrimary', true,
          'logo', (SELECT logo_url FROM brands WHERE id = p_brand_id)
        )
      ) || 
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'name', comp_name,
              'isPrimary', false,
              'logo', NULL
            )
          )
          FROM unnest(rr.competitors_mentioned) AS comp_name
        ),
        '[]'::jsonb
      ) as all_brands
    FROM recent_responses rr
  )
  SELECT 
    bd.prompt_text,
    -- Get response snippet from llm_simulation_responses (first 200 chars)
    CASE 
      WHEN lsr.raw_response IS NOT NULL 
      THEN LEFT(lsr.raw_response, 200)
      ELSE NULL 
    END as response_snippet,
    bd.brand_first_position as brand_position,
    bd.all_brands as mentioned_brands,
    bd.model_name::VARCHAR(255),
    bd.model_provider::VARCHAR(255),
    bd.sources_cited,
    bd.analysis_date,
    bd.response_id
  FROM brands_with_details bd
  LEFT JOIN llm_simulation_responses lsr 
    ON lsr.id::text = bd.response_id
  WHERE bd.rn <= p_limit
  ORDER BY bd.analysis_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO service_role;

-- Comment
COMMENT ON FUNCTION get_recent_brand_mentions IS 'Returns recent AI chat responses with prompt, response snippet, brand position, all mentioned brands with logos, model info, sources, and date. Supports Recent Chats view in reports.';
