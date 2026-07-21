-- Protect completed onboarding status from being changed
-- Once report is generated and onboarding is completed, it should never change

CREATE OR REPLACE FUNCTION public.update_onboarding_status(
    p_user_id   UUID,
    p_status    onboarding_status,
    p_step      INTEGER DEFAULT NULL,
    p_metadata  JSONB   DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile   JSONB;
    current_status   onboarding_status;
    current_completed_at TIMESTAMPTZ;
    report_generated BOOLEAN;
BEGIN
    -- Get current status and completion details
    SELECT onboarding_status, onboarding_completed_at
      INTO current_status, current_completed_at
      FROM public.profiles
     WHERE user_id = p_user_id;

    -- Check if report was generated (completed_via = 'report_generation')
    SELECT CASE 
        WHEN onboarding_metadata->>'completed_via' = 'report_generation' 
        THEN true 
        ELSE false 
    END INTO report_generated
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- PROTECTION: If user has completed onboarding with report generation, 
    -- prevent any status changes that would mark them as incomplete
    IF current_status = 'completed' 
       AND current_completed_at IS NOT NULL 
       AND report_generated = true 
       AND p_status != 'completed' THEN
        
        RAISE NOTICE 'Cannot change onboarding status from completed to % for user % - report already generated', p_status, p_user_id;
        
        -- Return current profile without changes
        SELECT to_jsonb(profiles.*) INTO result_profile
        FROM public.profiles
        WHERE user_id = p_user_id;
        
        RETURN result_profile;
    END IF;

    UPDATE public.profiles
       SET onboarding_status       = p_status,
           onboarding_step         = COALESCE(p_step, onboarding_step),
           onboarding_metadata     = COALESCE(p_metadata, onboarding_metadata),
           onboarding_started_at   = CASE
                                        WHEN p_status = 'in_progress'
                                         AND current_status = 'never_started'
                                        THEN now()
                                        ELSE onboarding_started_at
                                    END,
           onboarding_completed_at = CASE
                                        WHEN p_status = 'completed'
                                        THEN COALESCE(current_completed_at, now())
                                        -- PROTECTION: Never clear completion timestamp if report was generated
                                        WHEN current_status = 'completed' AND report_generated = true
                                        THEN current_completed_at
                                        WHEN p_status != 'completed'
                                        THEN NULL
                                        ELSE onboarding_completed_at
                                    END,
           onboarding_completed    = CASE
                                        WHEN p_status = 'completed'
                                        THEN true
                                        -- PROTECTION: Never mark as incomplete if report was generated
                                        WHEN current_status = 'completed' AND report_generated = true
                                        THEN true
                                        ELSE false
                                    END,
           updated_at              = now()
     WHERE user_id = p_user_id
  RETURNING to_jsonb(profiles.*) INTO result_profile;

    RETURN result_profile;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',   true,
            'message', SQLERRM,
            'code',    SQLSTATE
        );
END;
$$;

-- Add a database constraint to prevent direct updates that would violate the rule
-- This ensures no direct SQL can bypass the protection
CREATE OR REPLACE FUNCTION prevent_completed_onboarding_changes() 
RETURNS trigger AS $$
BEGIN
    -- Check if this is trying to change a completed onboarding with report generation
    IF OLD.onboarding_status = 'completed' 
       AND OLD.onboarding_completed_at IS NOT NULL
       AND OLD.onboarding_metadata->>'completed_via' = 'report_generation'
       AND (NEW.onboarding_status != 'completed' OR NEW.onboarding_completed != true) THEN
        
        RAISE EXCEPTION 'Cannot change completed onboarding status for user % - report already generated', OLD.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS protect_completed_onboarding ON public.profiles;
CREATE TRIGGER protect_completed_onboarding
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_completed_onboarding_changes();

-- Log the protection implementation
COMMENT ON FUNCTION public.update_onboarding_status IS 
'Updates onboarding status with protection: once report is generated and status is completed, it cannot be changed back to incomplete states.';

COMMENT ON FUNCTION prevent_completed_onboarding_changes IS 
'Trigger function that prevents direct database updates from changing completed onboarding status when report was generated.';

COMMENT ON TRIGGER protect_completed_onboarding ON public.profiles IS 
'Protects completed onboarding status from being changed when report was already generated.';