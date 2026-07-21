-- Fix Onboarding Audits Trigger to Work with NOT NULL Constraints
-- Created: 2025-09-08 15:30:00
-- Purpose: Update trigger to properly handle required account_id, brand_id, user_id

-- Drop the existing trigger that was trying to populate NULL values
DROP TRIGGER IF EXISTS populate_onboarding_audit_relationships_trigger ON onboarding_audits;
DROP FUNCTION IF EXISTS populate_onboarding_audit_relationships();

-- Create a new trigger that validates and ensures relationships exist before insert
CREATE OR REPLACE FUNCTION validate_onboarding_audit_relationships()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_brand_id UUID;
BEGIN
  -- Ensure user_id is provided
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null for onboarding audits';
  END IF;
  
  -- If account_id is not provided, try to find it from user's active account
  IF NEW.account_id IS NULL THEN
    SELECT au.account_id INTO v_account_id
    FROM account_users au 
    WHERE au.user_id = NEW.user_id 
    AND au.is_active = true
    ORDER BY au.created_at ASC
    LIMIT 1;
    
    IF v_account_id IS NULL THEN
      RAISE EXCEPTION 'No active account found for user_id %. User must be associated with an account before creating onboarding audits.', NEW.user_id;
    END IF;
    
    NEW.account_id := v_account_id;
  END IF;
  
  -- If brand_id is not provided, try to find or suggest creation
  IF NEW.brand_id IS NULL THEN
    -- First try exact brand name match in the user's account
    SELECT b.id INTO v_brand_id
    FROM brands b 
    WHERE b.account_id = NEW.account_id 
    AND LOWER(b.name) = LOWER(NEW.brand_name)
    LIMIT 1;
    
    -- If no exact match, try partial match
    IF v_brand_id IS NULL THEN
      SELECT b.id INTO v_brand_id
      FROM brands b 
      WHERE b.account_id = NEW.account_id 
      AND LOWER(b.name) ILIKE '%' || LOWER(NEW.brand_name) || '%'
      LIMIT 1;
    END IF;
    
    -- If still no match, we need to create a brand or require one to be created first
    IF v_brand_id IS NULL THEN
      RAISE EXCEPTION 'No brand found for brand_name "%" in account %. Brand must be created first before onboarding audits.', NEW.brand_name, NEW.account_id;
    END IF;
    
    NEW.brand_id := v_brand_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the validation trigger
CREATE TRIGGER validate_onboarding_audit_relationships_trigger
  BEFORE INSERT OR UPDATE ON onboarding_audits
  FOR EACH ROW
  EXECUTE FUNCTION validate_onboarding_audit_relationships();

-- Create a helper function to create onboarding audits with proper relationships
CREATE OR REPLACE FUNCTION create_onboarding_audit_with_brand(
  p_user_id UUID,
  p_brand_name TEXT,
  p_website TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_target_markets TEXT[] DEFAULT NULL,
  p_audit_results JSONB DEFAULT '{}',
  p_extracted_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
  v_brand_id UUID;
  v_audit_id UUID;
BEGIN
  -- Get user's active account
  SELECT au.account_id INTO v_account_id
  FROM account_users au 
  WHERE au.user_id = p_user_id 
  AND au.is_active = true
  ORDER BY au.created_at ASC
  LIMIT 1;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'User % has no active account. Account must be created first.', p_user_id;
  END IF;
  
  -- Try to find existing brand
  SELECT b.id INTO v_brand_id
  FROM brands b 
  WHERE b.account_id = v_account_id 
  AND LOWER(b.name) = LOWER(p_brand_name)
  LIMIT 1;
  
  -- If no brand exists, create one
  IF v_brand_id IS NULL THEN
    INSERT INTO brands (
      account_id,
      name,
      slug,
      brand_website,
      industry,
      brand_category,
      target_markets,
      created_at,
      updated_at
    ) VALUES (
      v_account_id,
      p_brand_name,
      LOWER(REPLACE(p_brand_name, ' ', '-')),
      p_website,
      p_industry,
      COALESCE(p_industry, 'Technology'),
      COALESCE(p_target_markets, '{}'),
      NOW(),
      NOW()
    ) RETURNING id INTO v_brand_id;
    
    -- Create default workspace for the brand
    INSERT INTO workspaces (
      brand_id,
      account_id,
      name,
      slug,
      is_default,
      created_at,
      updated_at
    ) VALUES (
      v_brand_id,
      v_account_id,
      p_brand_name || ' Workspace',
      LOWER(REPLACE(p_brand_name, ' ', '-')) || '-workspace',
      true,
      NOW(),
      NOW()
    );
  END IF;
  
  -- Create the onboarding audit with proper relationships
  INSERT INTO onboarding_audits (
    user_id,
    account_id,
    brand_id,
    brand_name,
    website,
    industry,
    target_markets,
    audit_results,
    extracted_data,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_account_id,
    v_brand_id,
    p_brand_name,
    p_website,
    p_industry,
    COALESCE(p_target_markets, '{}'),
    p_audit_results,
    p_extracted_data,
    NOW(),
    NOW()
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_onboarding_audit_relationships() TO authenticated;
GRANT EXECUTE ON FUNCTION create_onboarding_audit_with_brand(UUID, TEXT, TEXT, TEXT, TEXT[], JSONB, JSONB) TO authenticated;

-- Add comments
COMMENT ON FUNCTION validate_onboarding_audit_relationships IS 'Validates and ensures proper account/brand relationships exist before creating onboarding audits';
COMMENT ON FUNCTION create_onboarding_audit_with_brand IS 'Helper function to create onboarding audits with automatic brand creation and proper relationships';