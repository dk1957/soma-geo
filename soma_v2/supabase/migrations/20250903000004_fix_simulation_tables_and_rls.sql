-- Fix simulation tables and RLS policies
-- Created: 2025-09-03
-- Purpose: Add missing columns and fix RLS policy issues

-- Add missing columns to llm_simulations table
ALTER TABLE IF EXISTS llm_simulations 
  ADD COLUMN IF NOT EXISTS brand_website TEXT,
  ADD COLUMN IF NOT EXISTS brand_category TEXT,
  ADD COLUMN IF NOT EXISTS target_markets TEXT[],
  ADD COLUMN IF NOT EXISTS products_services TEXT;

-- Update RLS policies for brand_contexts
-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS brand_contexts_select ON brand_contexts;
DROP POLICY IF EXISTS brand_contexts_insert ON brand_contexts;
DROP POLICY IF EXISTS brand_contexts_update ON brand_contexts;
DROP POLICY IF EXISTS brand_contexts_delete ON brand_contexts;

-- Make sure RLS is enabled
ALTER TABLE brand_contexts ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper conditions
CREATE POLICY brand_contexts_select ON brand_contexts 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = brand_contexts.account_id
    )
  );

CREATE POLICY brand_contexts_insert ON brand_contexts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = brand_contexts.account_id
    )
  );

CREATE POLICY brand_contexts_update ON brand_contexts 
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = brand_contexts.account_id
    )
  );

-- Update RLS policies for llm_simulations
-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS llm_simulations_select ON llm_simulations;
DROP POLICY IF EXISTS llm_simulations_insert ON llm_simulations;
DROP POLICY IF EXISTS llm_simulations_update ON llm_simulations;
DROP POLICY IF EXISTS llm_simulations_delete ON llm_simulations;

-- Make sure RLS is enabled
ALTER TABLE llm_simulations ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper conditions
CREATE POLICY llm_simulations_select ON llm_simulations 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = llm_simulations.account_id
    )
  );

CREATE POLICY llm_simulations_insert ON llm_simulations 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = llm_simulations.account_id
    )
  );

CREATE POLICY llm_simulations_update ON llm_simulations 
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM account_users 
      WHERE account_users.user_id = auth.uid() 
      AND account_users.account_id = llm_simulations.account_id
    )
  );

-- Special bypass policy for service role
-- This allows the service_role to bypass RLS completely
ALTER TABLE brand_contexts FORCE ROW LEVEL SECURITY;
ALTER TABLE llm_simulations FORCE ROW LEVEL SECURITY;

-- Let's modify our service functions to use these new columns
CREATE OR REPLACE FUNCTION insert_llm_simulation(
  p_simulation_id TEXT,
  p_user_id UUID,
  p_account_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_brand_context_id UUID DEFAULT NULL,
  p_brand_name TEXT DEFAULT NULL,
  p_brand_website TEXT DEFAULT NULL,
  p_brand_category TEXT DEFAULT NULL,
  p_target_markets TEXT[] DEFAULT NULL,
  p_products_services TEXT DEFAULT NULL,
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
    brand_website,
    brand_category,
    target_markets,
    products_services,
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
    p_brand_website,
    p_brand_category,
    p_target_markets,
    p_products_services,
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