-- Function to safely create brand_context with proper ownership
-- This will be used by the server-side API which has service role permissions
CREATE OR REPLACE FUNCTION create_brand_context_securely(
  p_user_id UUID,
  p_account_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_brand_name TEXT,
  p_context_text TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'::JSONB
) 
RETURNS TABLE (
  id UUID,
  user_id UUID,
  account_id UUID,
  brand_id UUID, 
  brand_name TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_context_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Insert with explicit owner (ignoring RLS)
  INSERT INTO brand_contexts (
    user_id, 
    account_id, 
    brand_id, 
    brand_name,
    context_text,
    metadata
  ) 
  VALUES (
    p_user_id,
    p_account_id,
    p_brand_id,
    p_brand_name,
    p_context_text,
    p_metadata
  )
  RETURNING 
    id,
    user_id,
    account_id,
    brand_id,
    brand_name,
    created_at
  INTO
    v_brand_context_id,
    p_user_id,
    p_account_id,
    p_brand_id,
    p_brand_name,
    v_created_at;
    
  RETURN QUERY SELECT 
    v_brand_context_id,
    p_user_id,
    p_account_id,
    p_brand_id,
    p_brand_name,
    v_created_at;
END;
$$;