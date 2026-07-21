-- Fix citation storage: resolve function overload conflict and ensure unique constraint
--
-- Root cause: Two store_citation overloads exist in the database:
--   1. 14-param version (from 20250623) — uses WRONG column names (source_domain, source_url)
--      and ON CONFLICT referencing those columns, which don't match any unique constraint
--   2. 16-param version (from 20260218) — uses correct column names but the TypeScript code
--      only passes 14 params, so PostgreSQL resolves to the broken 14-param overload
--
-- Fix: Drop both overloads, create ONE function matching the 14 params the TypeScript sends,
-- using correct column names (domain, url) and proper ON CONFLICT clause.

-- ============================================================================
-- Step 1: Back-populate domain/url from source_domain/source_url where missing
-- ============================================================================
UPDATE response_citations 
SET 
  domain = source_domain,
  url = COALESCE(source_url, ''),
  title = COALESCE(title, source_title),
  context_text = COALESCE(context_text, citation_context)
WHERE domain IS NULL AND source_domain IS NOT NULL;

-- Also ensure url is never NULL for existing rows (needed for unique constraint)
UPDATE response_citations 
SET url = '' 
WHERE url IS NULL AND domain IS NOT NULL;

-- ============================================================================
-- Step 2: Ensure unique constraint exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'response_citations_unique'
  ) THEN
    -- Remove exact duplicates before adding constraint (keep the newest row)
    DELETE FROM response_citations a
    USING response_citations b
    WHERE a.ctid < b.ctid
      AND a.response_id = b.response_id
      AND a.domain IS NOT DISTINCT FROM b.domain
      AND a.url IS NOT DISTINCT FROM b.url
      AND a.citation_position IS NOT DISTINCT FROM b.citation_position;

    ALTER TABLE response_citations 
    ADD CONSTRAINT response_citations_unique 
    UNIQUE (response_id, domain, url, citation_position);
  END IF;
END $$;

-- ============================================================================
-- Step 3: Drop ALL store_citation overloads
-- ============================================================================

-- 16-param version (from 20260218 / 20260102 / 20251203)
DROP FUNCTION IF EXISTS store_citation(text, text, text, uuid, uuid, text, text, text, text, text, integer, text, text, text, text, jsonb);

-- 14-param version with defaults (from 20250623)
DROP FUNCTION IF EXISTS store_citation(text, text, text, uuid, uuid, text, text, text, text, text, integer, text, text, jsonb);

-- ============================================================================
-- Step 4: Create single clean function matching TypeScript caller (14 params)
-- ============================================================================
CREATE OR REPLACE FUNCTION store_citation(
  p_response_id TEXT,
  p_simulation_id TEXT,
  p_prompt_id TEXT,
  p_account_id UUID,
  p_brand_id UUID,
  p_model_name TEXT,
  p_model_provider TEXT,
  p_domain TEXT,
  p_url TEXT DEFAULT '',
  p_title TEXT DEFAULT NULL,
  p_citation_position INTEGER DEFAULT 0,
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
  v_safe_url TEXT;
BEGIN
  -- Cast text IDs to UUID
  v_response_uuid := p_response_id::uuid;
  v_simulation_uuid := p_simulation_id::uuid;
  
  -- Normalize domain
  v_normalized_domain := normalize_domain(p_domain);
  
  -- Ensure url is never NULL (unique constraint requires non-null for matching)
  v_safe_url := COALESCE(p_url, '');
  
  -- Get or create domain entry
  v_domain_id := get_or_create_source_domain(p_domain);
  
  -- Insert citation, writing to both column name sets for backward compatibility
  INSERT INTO response_citations (
    response_id,
    simulation_id,
    prompt_id,
    account_id,
    brand_id,
    model_name,
    model_provider,
    domain_id,
    -- Canonical columns (used by unique constraint)
    domain,
    url,
    title,
    citation_position,
    context_text,
    -- Legacy columns (read by some existing queries)
    source_domain,
    source_url,
    source_title,
    citation_context,
    -- Metadata
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
    v_normalized_domain,
    v_safe_url,
    p_title,
    COALESCE(p_citation_position, 0),
    p_context_text,
    v_normalized_domain,
    p_url,
    p_title,
    p_context_text,
    p_geo_target,
    p_raw_citation_data
  )
  ON CONFLICT (response_id, domain, url, citation_position)
  DO UPDATE SET
    title = COALESCE(EXCLUDED.title, response_citations.title),
    context_text = COALESCE(EXCLUDED.context_text, response_citations.context_text),
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
