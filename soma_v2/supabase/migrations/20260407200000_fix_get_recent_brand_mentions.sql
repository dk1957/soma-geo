-- Fix get_recent_brand_mentions to:
-- 1. Use llm_response_files.response_preview for response snippets (file-storage-primary)
-- 2. Sanitize sources_cited to only return {url, domain, title} (fixes React child error)
-- 3. 3-tier fallback: direct ID match → attribute match → legacy table

CREATE OR REPLACE FUNCTION public.get_recent_brand_mentions(
  p_brand_id uuid,
  p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  p_end_date date DEFAULT CURRENT_DATE,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  prompt_text text,
  response_snippet text,
  brand_position integer,
  gsov numeric,
  mentioned_brands jsonb,
  model_name text,
  model_provider text,
  sources_cited jsonb,
  analysis_date date,
  response_id text
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH response_data AS (
    SELECT
      ra.prompt_text,
      ra.response_id,
      ra.simulation_id,
      ra.model_name as model,
      ra.brand_first_position,
      ra.share_of_voice,
      ra.brand_name,
      ra.brand_mentioned,
      ra.competitors_mentioned,
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
    COALESCE(
      lrf_direct.response_preview,
      lrf_attr.response_preview,
      LEFT(lsr.raw_response, 200),
      ''
    ) as response_snippet,
    rd.brand_first_position as brand_position,
    ROUND(COALESCE(rd.share_of_voice, 0), 1) as gsov,
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
    -- Sanitize sources_cited: extract only url, domain, title
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'url', COALESCE(s->>'url', ''),
            'domain', COALESCE(s->>'domain', ''),
            'title', COALESCE(s->>'title', s->>'source_name', '')
          )
        )
        FROM jsonb_array_elements(rd.sources) AS s
      ),
      '[]'::jsonb
    ) as sources_cited,
    rd.analysis_dt as analysis_date,
    rd.response_id
  FROM response_data rd
  -- Tier 1: Direct ID match on llm_response_files
  LEFT JOIN llm_response_files lrf_direct
    ON lrf_direct.id = rd.response_id::uuid
  -- Tier 2: Attribute match when response_id references llm_simulation_responses
  LEFT JOIN LATERAL (
    SELECT lrf2.response_preview
    FROM llm_response_files lrf2
    WHERE lrf2.brand_id = p_brand_id
      AND lrf2.simulation_id = rd.simulation_id::uuid
      AND lrf2.model_name = rd.model
      AND lrf2.prompt_text = rd.prompt_text
    ORDER BY lrf2.created_at DESC
    LIMIT 1
  ) lrf_attr ON lrf_direct.id IS NULL
  -- Tier 3: Legacy table fallback
  LEFT JOIN llm_simulation_responses lsr 
    ON lsr.id::text = rd.response_id
  WHERE rd.rn <= p_limit
  ORDER BY rd.analyzed_at DESC;
END;
$function$;
