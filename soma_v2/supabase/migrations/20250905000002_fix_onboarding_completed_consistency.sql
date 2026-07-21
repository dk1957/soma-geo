-- Fix onboarding_completed inconsistency 
-- onboarding_completed should only be true when onboarding_status is 'completed'

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
BEGIN
    -- current status (needed for transition logic)
    SELECT onboarding_status
      INTO current_status
      FROM public.profiles
     WHERE user_id = p_user_id;

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
                                        THEN now()
                                        WHEN p_status != 'completed'
                                        THEN NULL
                                        ELSE onboarding_completed_at
                                    END,
           onboarding_completed    = CASE
                                        WHEN p_status = 'completed'
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

-- Fix existing inconsistent records
-- Set onboarding_completed = false where status is not 'completed'
UPDATE public.profiles 
SET onboarding_completed = false,
    onboarding_completed_at = NULL,
    updated_at = now()
WHERE onboarding_completed = true 
  AND onboarding_status != 'completed';

-- Log the fix
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fixed_count
    FROM public.profiles 
    WHERE onboarding_completed = false 
      AND onboarding_status != 'completed';
    
    RAISE NOTICE 'Fixed % profiles with inconsistent onboarding_completed status', fixed_count;
END $$;