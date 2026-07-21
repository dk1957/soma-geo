-- Fix store_citation: remove references to dropped source_urls table
-- The source_urls table was dropped in 20250621000000_schema_cleanup_and_fixes.sql
-- but these functions still referenced it, causing citation storage failures.

-- Drop the broken function first
DROP FUNCTION IF EXISTS get_or_create_source_url(UUID, TEXT, TEXT, TEXT);

-- Drop old overload with extra params (prompt_text, prompt_category) that also references source_urls
DROP FUNCTION IF EXISTS store_citation(text, text, text, uuid, uuid, text, text, text, text, text, integer, text, text, text, text, jsonb);

-- Rewrite store_citation to skip source_urls references
CREATE OR REPLACE FUNCTION store_citation(
  p_response_id TEXT,
  p_simulation_id TEXT,
  p_prompt_id TEXT,
  p_account_id UUID,
  p_brand_id UUID,
  p_model_name TEXT,
  p_model_provider TEXT,
  p_domain TEXT,
  p_url TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_citation_position INTEGER DEFAULT NULL,
  p_context_text TEXT DEFAULT NULL,
  p_geo_target TEXT DEFAULT NULL,
  p_raw_citation_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_citation_id UUID;
  v_domain_id UUID;
  v_normalized_domain TEXT;
  v_response_uuid UUID;
  v_simulation_uuid UUID;
BEGIN
  -- Cast text IDs to UUID
  v_response_uuid := p_response_id::uuid;
  v_simulation_uuid := p_simulation_id::uuid;
  
  -- Normalize the domain
  v_normalized_domain := normalize_domain(p_domain);
  
  -- Get or create domain
  v_domain_id := get_or_create_source_domain(p_domain);
  
  -- Insert citation (url_id set to NULL since source_urls table was removed)
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
    source_domain,
    source_url,
    source_title,
    citation_position,
    citation_context,
    geo_target,
    raw_citation_data
  ) VALUES (
    v_response_uuid,
    v_simulation_uuid,
    p_prompt_id,
    p_account_id,
    p_brand_id,
    p_model_name,
    p_model_provider,
    v_domain_id,
    NULL,
    v_normalized_domain,
    p_url,
    p_title,
    p_citation_position,
    p_context_text,
    p_geo_target,
    p_raw_citation_data
  )
  ON CONFLICT (response_id, source_domain, source_url, citation_position) 
  WHERE source_domain IS NOT NULL
  DO UPDATE SET
    source_title = COALESCE(EXCLUDED.source_title, response_citations.source_title),
    citation_context = COALESCE(EXCLUDED.citation_context, response_citations.citation_context),
    raw_citation_data = EXCLUDED.raw_citation_data
  RETURNING id INTO v_citation_id;
  
  -- Update domain aggregation
  UPDATE source_domains SET
    total_citations = total_citations + 1,
    last_cited_at = NOW()
  WHERE id = v_domain_id;
  
  RETURN v_citation_id;
END;
$$;
