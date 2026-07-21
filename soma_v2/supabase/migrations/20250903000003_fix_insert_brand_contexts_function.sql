-- Fix Insert Brand Contexts Function
-- Created: 2025-09-03
-- Purpose: Create a server-side function to safely insert brand contexts bypassing RLS

-- Create a function to insert brand contexts safely (bypassing RLS)
CREATE OR REPLACE FUNCTION insert_brand_context(
  p_brand_name TEXT,
  p_context_text TEXT,
  p_user_id UUID,
  p_account_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_similarity_score FLOAT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run as the function owner (superuser)
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- First try to find matching account_id if not provided
  IF p_account_id IS NULL AND p_user_id IS NOT NULL THEN
    SELECT account_id INTO p_account_id
    FROM account_users
    WHERE user_id = p_user_id
    AND is_active = true
    LIMIT 1;
  END IF;

  -- Then try to find matching brand_id if not provided but have account_id
  IF p_brand_id IS NULL AND p_account_id IS NOT NULL THEN
    SELECT id INTO p_brand_id
    FROM brands
    WHERE account_id = p_account_id
    AND LOWER(name) = LOWER(p_brand_name)
    LIMIT 1;
  END IF;

  -- If still no brand_id but have account_id, use the first brand
  IF p_brand_id IS NULL AND p_account_id IS NOT NULL THEN
    SELECT id INTO p_brand_id
    FROM brands
    WHERE account_id = p_account_id
    LIMIT 1;
  END IF;

  -- Insert the record
  INSERT INTO brand_contexts(
    brand_name,
    context_text,
    user_id,
    account_id,
    brand_id,
    similarity_score,
    metadata
  ) VALUES (
    p_brand_name,
    p_context_text,
    p_user_id,
    p_account_id,
    p_brand_id,
    p_similarity_score,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Create a function to insert LLM simulation safely (bypassing RLS)
CREATE OR REPLACE FUNCTION insert_llm_simulation(
  p_simulation_id TEXT,
  p_user_id UUID,
  p_account_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_brand_context_id UUID DEFAULT NULL,
  p_brand_name TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'running',
  p_total_jobs INTEGER DEFAULT 0,
  p_completed_jobs INTEGER DEFAULT 0,
  p_failed_jobs INTEGER DEFAULT 0,
  p_running_jobs INTEGER DEFAULT 0,
  p_progress_percentage INTEGER DEFAULT 0,
  p_options JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run as the function owner (superuser)
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- First try to find matching account_id if not provided
  IF p_account_id IS NULL AND p_user_id IS NOT NULL THEN
    SELECT account_id INTO p_account_id
    FROM account_users
    WHERE user_id = p_user_id
    AND is_active = true
    LIMIT 1;
  END IF;

  -- Then try to find matching brand_id if not provided but have account_id and brand_name
  IF p_brand_id IS NULL AND p_account_id IS NOT NULL AND p_brand_name IS NOT NULL THEN
    SELECT id INTO p_brand_id
    FROM brands
    WHERE account_id = p_account_id
    AND LOWER(name) = LOWER(p_brand_name)
    LIMIT 1;
  END IF;

  -- If still no brand_id but have account_id, use the first brand
  IF p_brand_id IS NULL AND p_account_id IS NOT NULL THEN
    SELECT id INTO p_brand_id
    FROM brands
    WHERE account_id = p_account_id
    LIMIT 1;
  END IF;

  -- Insert the record
  INSERT INTO llm_simulations(
    simulation_id,
    user_id,
    account_id,
    brand_id,
    brand_context_id,
    brand_name,
    status,
    total_jobs,
    completed_jobs,
    failed_jobs,
    running_jobs,
    progress_percentage,
    options
  ) VALUES (
    p_simulation_id,
    p_user_id,
    p_account_id,
    p_brand_id,
    p_brand_context_id,
    p_brand_name,
    p_status,
    p_total_jobs,
    p_completed_jobs,
    p_failed_jobs,
    p_running_jobs,
    p_progress_percentage,
    p_options
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION insert_brand_context TO authenticated;
GRANT EXECUTE ON FUNCTION insert_brand_context TO service_role;
GRANT EXECUTE ON FUNCTION insert_llm_simulation TO authenticated;
GRANT EXECUTE ON FUNCTION insert_llm_simulation TO service_role;