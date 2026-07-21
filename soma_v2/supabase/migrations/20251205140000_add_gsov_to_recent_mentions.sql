-- Add gSoV (Share of Voice) to recent brand mentions function
-- This adds the primary brand's share of voice for each response to the Recent Chats view

DROP FUNCTION IF EXISTS get_recent_brand_mentions(UUID, DATE, DATE, INTEGER);

CREATE OR REPLACE FUNCTION get_recent_brand_mentions(
  p_brand_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  prompt_text TEXT,
  response_snippet TEXT,
  brand_position INTEGER,
  gsov NUMERIC,
  mentioned_brands JSONB,
  model_name TEXT,
  model_provider TEXT,
  sources_cited JSONB,
  analysis_date DATE,
  response_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH response_data AS (
    SELECT 
      ra.prompt_text,
      ra.response_id,
      ra.brand_first_position,
      ra.share_of_voice,
      ra.brand_name,
      ra.brand_mentioned,
      ra.competitors_mentioned,
      ra.model_name as model,
      ra.model_provider as provider,
      COALESCE(ra.sources_cited, '[]'::jsonb) as sources,
      ra.analysis_date as analysis_dt,
      ra.analyzed_at,
      ROW_NUMBER() OVER (ORDER BY ra.analyzed_at DESC) as rn
    FROM response_analysis ra
    WHERE ra.brand_id = p_brand_id
      AND ra.is_primary_brand = true
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
  )
  SELECT 
    rd.prompt_text,
    -- Get response snippet from llm_simulation_responses
    COALESCE(
      LEFT(lsr.raw_response, 200),
      ''
    ) as response_snippet,
    rd.brand_first_position as brand_position,
    ROUND(COALESCE(rd.share_of_voice, 0), 1) as gsov,
    -- Build mentioned_brands array
    CASE 
      WHEN rd.brand_mentioned THEN
        jsonb_build_array(
          jsonb_build_object(
            'name', rd.brand_name,
            'isPrimary', true,
            'logo', (SELECT logo_url FROM brands WHERE id = p_brand_id)
          )
        ) || COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', comp_name,
                'isPrimary', false,
                'logo', NULL
              )
            )
            FROM unnest(rd.competitors_mentioned) AS comp_name
          ),
          '[]'::jsonb
        )
      ELSE
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', comp_name,
                'isPrimary', false,
                'logo', NULL
              )
            )
            FROM unnest(rd.competitors_mentioned) AS comp_name
          ),
          '[]'::jsonb
        )
    END as mentioned_brands,
    rd.model as model_name,
    rd.provider as model_provider,
    rd.sources as sources_cited,
    rd.analysis_dt as analysis_date,
    rd.response_id
  FROM response_data rd
  LEFT JOIN llm_simulation_responses lsr 
    ON lsr.id::text = rd.response_id
  WHERE rd.rn <= p_limit
  ORDER BY rd.analyzed_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_brand_mentions(UUID, DATE, DATE, INTEGER) TO service_role;

COMMENT ON FUNCTION get_recent_brand_mentions IS 'Returns recent AI responses with prompt, response snippet, brand position (null if not mentioned), gSoV (share of voice), all mentioned brands with logos, model info, sources, and date. Shows all responses for the brand.';
