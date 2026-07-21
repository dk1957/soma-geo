-- Migration: Add prompt_id column to response_citations if it doesn't exist
-- This fixes the "column prompt_id does not exist" error when storing citations

-- Add prompt_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'response_citations' 
    AND column_name = 'prompt_id'
  ) THEN
    ALTER TABLE response_citations ADD COLUMN prompt_id TEXT;
    RAISE NOTICE 'Added prompt_id column to response_citations';
  ELSE
    RAISE NOTICE 'prompt_id column already exists in response_citations';
  END IF;
END $$;

-- Recreate the store_citation function with proper signature
CREATE OR REPLACE FUNCTION store_citation(
  p_response_id TEXT,
  p_simulation_id TEXT,
  p_prompt_id TEXT,
  p_account_id UUID,
  p_brand_id UUID,
  p_model_name TEXT,
  p_model_provider TEXT,
  p_domain TEXT,
  p_url TEXT,
  p_title TEXT,
  p_citation_position INTEGER,
  p_context_text TEXT,
  p_prompt_text TEXT,
  p_prompt_category TEXT,
  p_geo_target TEXT,
  p_raw_citation_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_citation_id UUID;
  v_domain_id UUID;
  v_url_id UUID;
  v_normalized_domain TEXT;
BEGIN
  -- Normalize the domain
  v_normalized_domain := normalize_domain(p_domain);
  
  -- Get or create domain
  v_domain_id := get_or_create_source_domain(p_domain);
  
  -- Get or create URL if provided
  IF p_url IS NOT NULL AND p_url != '' THEN
    v_url_id := get_or_create_source_url(v_domain_id, v_normalized_domain, p_url, p_title);
  END IF;
  
  -- Insert citation
  INSERT INTO response_citations (
    response_id,
    simulation_id,
    prompt_id,
    account_id,
    brand_id,
    model_name,
    model_provider,
    domain_id,
    url_id,
    domain,
    url,
    title,
    citation_position,
    context_text,
    prompt_text,
    prompt_category,
    geo_target,
    raw_citation_data
  ) VALUES (
    p_response_id,
    p_simulation_id,
    p_prompt_id,
    p_account_id,
    p_brand_id,
    p_model_name,
    p_model_provider,
    v_domain_id,
    v_url_id,
    v_normalized_domain,
    p_url,
    p_title,
    p_citation_position,
    p_context_text,
    p_prompt_text,
    p_prompt_category,
    p_geo_target,
    p_raw_citation_data
  )
  ON CONFLICT (response_id, domain, url, citation_position) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, response_citations.title),
    context_text = COALESCE(EXCLUDED.context_text, response_citations.context_text),
    raw_citation_data = EXCLUDED.raw_citation_data
  RETURNING id INTO v_citation_id;
  
  -- Update domain aggregation
  UPDATE source_domains SET
    total_citations = total_citations + 1,
    last_cited_at = NOW()
  WHERE id = v_domain_id;
  
  -- Update URL aggregation if we have a URL
  IF v_url_id IS NOT NULL THEN
    UPDATE source_urls SET
      total_citations = total_citations + 1,
      last_cited_at = NOW()
    WHERE id = v_url_id;
  END IF;
  
  RETURN v_citation_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION store_citation TO authenticated;
GRANT EXECUTE ON FUNCTION store_citation TO service_role;

COMMENT ON FUNCTION store_citation IS 'Store a citation from an LLM response and update all related aggregations';
