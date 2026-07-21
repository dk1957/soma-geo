-- Fix store_citation function to properly cast text parameters to UUID
-- This fixes the "column response_id is of type uuid but expression is of type text" error

CREATE OR REPLACE FUNCTION public.store_citation(
  p_response_id text, 
  p_simulation_id text, 
  p_prompt_id text, 
  p_account_id uuid, 
  p_brand_id uuid, 
  p_model_name text, 
  p_model_provider text, 
  p_domain text, 
  p_url text, 
  p_title text, 
  p_citation_position integer, 
  p_context_text text, 
  p_prompt_text text, 
  p_prompt_category text, 
  p_geo_target text, 
  p_raw_citation_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_citation_id UUID;
  v_domain_id UUID;
  v_url_id UUID;
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
  
  -- Get or create URL if provided
  IF p_url IS NOT NULL AND p_url != '' THEN
    v_url_id := get_or_create_source_url(v_domain_id, v_normalized_domain, p_url, p_title);
  END IF;
  
  -- Insert citation with properly typed UUIDs
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
    v_url_id,
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
  
  -- Update URL aggregation if we have a URL
  IF v_url_id IS NOT NULL THEN
    UPDATE source_urls SET
      total_citations = total_citations + 1,
      last_cited_at = NOW()
    WHERE id = v_url_id;
  END IF;
  
  RETURN v_citation_id;
END;
$$;
