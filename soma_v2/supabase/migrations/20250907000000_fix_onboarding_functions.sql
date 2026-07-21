-- Fix onboarding functions and ensure proper error handling
-- Date: 2025-09-07

-- Ensure the onboarding_status enum includes all needed values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_status') THEN
        CREATE TYPE onboarding_status AS ENUM ('never_started', 'in_progress', 'completed', 'abandoned');
    END IF;
END $$;

-- Update the update_onboarding_status function to improve error handling
CREATE OR REPLACE FUNCTION public.update_onboarding_status(
    p_user_id uuid, 
    p_status onboarding_status, 
    p_step integer DEFAULT NULL, 
    p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result_profile   JSONB;
    current_status   onboarding_status;
    current_completed_at TIMESTAMPTZ;
    report_generated BOOLEAN := false;
BEGIN
    -- Get current status and completion details
    SELECT onboarding_status, onboarding_completed_at
      INTO current_status, current_completed_at
      FROM public.profiles
     WHERE user_id = p_user_id;

    -- If no profile exists, create one first
    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            user_id, 
            onboarding_status, 
            onboarding_step, 
            onboarding_metadata,
            onboarding_started_at,
            onboarding_completed_at,
            created_at, 
            updated_at
        ) VALUES (
            p_user_id, 
            p_status, 
            p_step, 
            p_metadata,
            CASE WHEN p_status = 'in_progress' THEN now() ELSE NULL END,
            CASE WHEN p_status = 'completed' THEN now() ELSE NULL END,
            now(), 
            now()
        )
        RETURNING to_jsonb(profiles.*) INTO result_profile;
        
        RETURN result_profile;
    END IF;

    -- Check if report was generated (completed_via = 'report_generation' or 'application_flow')
    SELECT CASE
        WHEN onboarding_metadata->>'completed_via' IN ('report_generation', 'application_flow')
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

    -- Update the profile
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
           updated_at              = now()
     WHERE user_id = p_user_id
  RETURNING to_jsonb(profiles.*) INTO result_profile;

    RETURN result_profile;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in update_onboarding_status: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RETURN jsonb_build_object(
            'error',   true,
            'message', SQLERRM,
            'code',    SQLSTATE,
            'user_id', p_user_id,
            'status',  p_status
        );
END;
$function$;

-- Create or update the complete_user_onboarding function
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert profile if it doesn't exist, then update onboarding completion
  INSERT INTO public.profiles (
    user_id, 
    onboarding_status,
    onboarding_completed_at, 
    onboarding_metadata,
    created_at, 
    updated_at
  )
  VALUES (
    user_uuid, 
    'completed',
    NOW(), 
    jsonb_build_object('completed_via', 'application_flow', 'completed_at', NOW()),
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(profiles.onboarding_completed_at, NOW()),
    onboarding_metadata = COALESCE(profiles.onboarding_metadata, '{}'::jsonb) || jsonb_build_object('completed_via', 'application_flow', 'completed_at', NOW()),
    updated_at = NOW()
  WHERE profiles.onboarding_status != 'completed' OR profiles.onboarding_completed_at IS NULL;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in complete_user_onboarding: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$function$;

-- Create function to check if user has actually completed onboarding (generated report)
CREATE OR REPLACE FUNCTION public.has_user_generated_report(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    report_count integer;
BEGIN
    -- Check if user has any audit results (indicating report generation)
    SELECT COUNT(*) INTO report_count
    FROM public.audit_results
    WHERE user_id = user_uuid;
    
    RETURN report_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_onboarding_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_generated_report TO authenticated;

-- Create index on onboarding_status for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status 
ON public.profiles (onboarding_status);

-- Create index on onboarding_completed_at for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at 
ON public.profiles (onboarding_completed_at);