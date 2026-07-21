-- Fix infinite loop between dashboard and onboarding by ensuring onboarding status consistency
-- This migration addresses the root cause where users have accounts+brands but incomplete onboarding status

-- 1. Identify users who should have completed onboarding but are stuck in incomplete status
-- These are users who:
-- - Have an account (accounts table)
-- - Have at least one brand (brands table) 
-- - Have audit results (indicating they completed report generation)
-- - BUT their onboarding_status is not 'completed' OR onboarding_completed_at is NULL

-- First, let's create a temporary view to identify affected users
CREATE OR REPLACE VIEW temp_onboarding_inconsistency AS
WITH user_completion_status AS (
  SELECT 
    p.user_id,
    p.onboarding_status,
    p.onboarding_completed_at,
    a.id as account_id,
    a.name as account_name,
    COUNT(b.id) as brand_count,
    COUNT(ar.id) as audit_results_count,
    -- Determine if user should be considered "completed"
    CASE 
      WHEN COUNT(b.id) > 0 AND COUNT(ar.id) > 0 THEN TRUE
      ELSE FALSE
    END as should_be_completed,
    -- Check current completion status
    CASE 
      WHEN p.onboarding_status = 'completed' AND p.onboarding_completed_at IS NOT NULL THEN TRUE
      ELSE FALSE
    END as is_currently_completed
  FROM profiles p
  LEFT JOIN accounts a ON a.owner_id = p.user_id
  LEFT JOIN brands b ON b.account_id = a.id
  LEFT JOIN audit_results ar ON ar.user_id = p.user_id AND ar.account_id = a.id
  GROUP BY p.user_id, p.onboarding_status, p.onboarding_completed_at, a.id, a.name
)
SELECT 
  user_id,
  onboarding_status,
  onboarding_completed_at,
  account_id,
  account_name,
  brand_count,
  audit_results_count,
  should_be_completed,
  is_currently_completed,
  -- This identifies the problematic users causing infinite loops
  CASE 
    WHEN should_be_completed = TRUE AND is_currently_completed = FALSE THEN TRUE
    ELSE FALSE
  END as causes_infinite_loop
FROM user_completion_status;

-- 2. Log the users we're about to fix (for audit purposes)
DO $$
DECLARE
  affected_count INTEGER;
  user_record RECORD;
BEGIN
  SELECT COUNT(*) INTO affected_count 
  FROM temp_onboarding_inconsistency 
  WHERE causes_infinite_loop = TRUE;
  
  RAISE NOTICE 'Found % users with onboarding inconsistency causing infinite loops', affected_count;
  
  -- Log each affected user
  FOR user_record IN 
    SELECT * FROM temp_onboarding_inconsistency WHERE causes_infinite_loop = TRUE
  LOOP
    RAISE NOTICE 'Fixing user %: account=%, brands=%, audits=%, current_status=%, completed_at=%', 
      user_record.user_id, 
      user_record.account_name,
      user_record.brand_count,
      user_record.audit_results_count,
      user_record.onboarding_status,
      user_record.onboarding_completed_at;
  END LOOP;
END $$;

-- 3. Fix the inconsistent records
-- Update users who should be completed but aren't marked as such
UPDATE profiles 
SET 
  onboarding_status = 'completed',
  onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at),
  onboarding_step = 100,
  onboarding_metadata = COALESCE(onboarding_metadata, '{}'::jsonb) || jsonb_build_object(
    'fixed_infinite_loop', true,
    'fixed_at', now(),
    'fix_reason', 'User had account+brands+audits but incomplete onboarding status'
  ),
  updated_at = now()
WHERE user_id IN (
  SELECT user_id 
  FROM temp_onboarding_inconsistency 
  WHERE causes_infinite_loop = TRUE
);

-- 4. Verify the fix
DO $$
DECLARE
  fixed_count INTEGER;
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM profiles p
  WHERE p.onboarding_status = 'completed' 
    AND p.onboarding_completed_at IS NOT NULL
    AND p.onboarding_metadata->>'fixed_infinite_loop' = 'true';
  
  SELECT COUNT(*) INTO remaining_issues
  FROM temp_onboarding_inconsistency 
  WHERE causes_infinite_loop = TRUE;
  
  RAISE NOTICE 'Fixed % user records. Remaining issues: %', fixed_count, remaining_issues;
END $$;

-- 5. Create a function to prevent future inconsistencies
-- This function ensures that onboarding completion is atomic and consistent
CREATE OR REPLACE FUNCTION public.complete_user_onboarding_atomic(
  p_user_id UUID,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_profile JSONB;
  current_status onboarding_status;
BEGIN
  -- Get current status
  SELECT onboarding_status INTO current_status
  FROM profiles WHERE user_id = p_user_id;
  
  -- Only update if not already completed (prevent overwriting completion)
  IF current_status != 'completed' THEN
    UPDATE profiles
    SET 
      onboarding_status = 'completed',
      onboarding_completed_at = now(),
      onboarding_step = 100,
      onboarding_metadata = COALESCE(onboarding_metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'completed_via', 'atomic_function',
        'completed_at', now()
      ),
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING to_jsonb(profiles.*) INTO result_profile;
    
    RAISE NOTICE 'Completed onboarding for user % (was %)', p_user_id, current_status;
  ELSE
    -- Return existing completed profile
    SELECT to_jsonb(profiles.*) INTO result_profile
    FROM profiles WHERE user_id = p_user_id;
    
    RAISE NOTICE 'User % already has completed onboarding', p_user_id;
  END IF;
  
  RETURN result_profile;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error completing onboarding for user %: %', p_user_id, SQLERRM;
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'user_id', p_user_id
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding_atomic(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding_atomic(UUID, JSONB) TO service_role;

-- 6. Add constraint to prevent future inconsistencies
-- Create a check constraint that ensures onboarding_completed_at is set when status is 'completed'
-- Note: PostgreSQL doesn't allow complex check constraints, so we'll use a trigger instead

CREATE OR REPLACE FUNCTION public.ensure_onboarding_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting status to 'completed', ensure completed_at is set
  IF NEW.onboarding_status = 'completed' AND NEW.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at = now();
  END IF;
  
  -- If setting completed_at but status is not 'completed', update status
  IF NEW.onboarding_completed_at IS NOT NULL AND NEW.onboarding_status != 'completed' THEN
    NEW.onboarding_status = 'completed';
    NEW.onboarding_step = GREATEST(NEW.onboarding_step, 100);
  END IF;
  
  -- If removing completed_at, reset status (unless explicitly keeping it)
  IF NEW.onboarding_completed_at IS NULL AND OLD.onboarding_completed_at IS NOT NULL 
     AND NEW.onboarding_status = 'completed' THEN
    NEW.onboarding_status = 'in_progress';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_onboarding_consistency ON profiles;

-- Create the trigger
CREATE TRIGGER trigger_onboarding_consistency
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_onboarding_consistency();

-- 7. Clean up temporary view
DROP VIEW IF EXISTS temp_onboarding_inconsistency;

-- 8. Create a monitoring function to detect future issues
CREATE OR REPLACE FUNCTION public.check_onboarding_consistency()
RETURNS TABLE (
  user_id UUID,
  onboarding_status onboarding_status,
  onboarding_completed_at TIMESTAMPTZ,
  has_account BOOLEAN,
  brand_count BIGINT,
  audit_count BIGINT,
  consistency_issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      p.user_id,
      p.onboarding_status,
      p.onboarding_completed_at,
      a.id IS NOT NULL as has_account,
      COUNT(b.id) as brand_count,
      COUNT(ar.id) as audit_count
    FROM profiles p
    LEFT JOIN accounts a ON a.owner_id = p.user_id
    LEFT JOIN brands b ON b.account_id = a.id
    LEFT JOIN audit_results ar ON ar.user_id = p.user_id
    GROUP BY p.user_id, p.onboarding_status, p.onboarding_completed_at, a.id
  )
  SELECT 
    ud.user_id,
    ud.onboarding_status,
    ud.onboarding_completed_at,
    ud.has_account,
    ud.brand_count,
    ud.audit_count,
    CASE 
      WHEN ud.onboarding_status = 'completed' AND ud.onboarding_completed_at IS NULL THEN 
        'Status completed but no timestamp'
      WHEN ud.onboarding_status != 'completed' AND ud.onboarding_completed_at IS NOT NULL THEN 
        'Has timestamp but status not completed'
      WHEN ud.has_account AND ud.brand_count > 0 AND ud.audit_count > 0 
           AND (ud.onboarding_status != 'completed' OR ud.onboarding_completed_at IS NULL) THEN
        'Should be completed but is not (infinite loop risk)'
      ELSE 'OK'
    END as consistency_issue
  FROM user_data ud
  WHERE NOT (
    -- These are the consistent states
    (ud.onboarding_status = 'completed' AND ud.onboarding_completed_at IS NOT NULL) OR
    (ud.onboarding_status != 'completed' AND ud.onboarding_completed_at IS NULL)
  ) OR (
    -- Also flag users who should be completed but aren't
    ud.has_account AND ud.brand_count > 0 AND ud.audit_count > 0 
    AND (ud.onboarding_status != 'completed' OR ud.onboarding_completed_at IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_onboarding_consistency() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.complete_user_onboarding_atomic IS 
  'Atomically marks a user as having completed onboarding with consistency checks';

COMMENT ON FUNCTION public.ensure_onboarding_consistency IS 
  'Trigger function to maintain consistency between onboarding_status and onboarding_completed_at';

COMMENT ON FUNCTION public.check_onboarding_consistency IS 
  'Diagnostic function to identify users with onboarding status inconsistencies';

-- Final verification
DO $$
DECLARE
  issue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO issue_count 
  FROM public.check_onboarding_consistency() 
  WHERE consistency_issue != 'OK';
  
  IF issue_count > 0 THEN
    RAISE WARNING 'Still found % onboarding consistency issues after fix', issue_count;
  ELSE
    RAISE NOTICE 'All onboarding status inconsistencies have been resolved';
  END IF;
END $$;