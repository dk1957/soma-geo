-- Fix complete_user_onboarding function to only update existing profiles
-- Date: 2025-01-08

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.complete_user_onboarding(uuid, jsonb);

-- Create the complete_user_onboarding function that only updates existing profiles
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    user_uuid uuid, 
    completion_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    default_metadata jsonb;
    profile_exists boolean;
    rows_affected integer;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE LOG 'complete_user_onboarding: Profile does not exist for user_uuid=%', user_uuid;
        RETURN FALSE;
    END IF;

    -- Set default metadata if none provided
    default_metadata := COALESCE(
        completion_metadata, 
        jsonb_build_object(
            'completed_via', 'application_flow', 
            'completed_at', NOW()
        )
    );

    -- Update existing profile to mark onboarding as complete
    UPDATE public.profiles
    SET 
        onboarding_status = 'completed',
        onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
        onboarding_metadata = COALESCE(onboarding_metadata, '{}'::jsonb) || default_metadata,
        updated_at = NOW()
    WHERE user_id = user_uuid;

    -- Get the number of rows affected
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Log the operation for debugging
    RAISE LOG 'complete_user_onboarding: user_uuid=%, rows_affected=%, metadata=%', user_uuid, rows_affected, default_metadata;

    RETURN rows_affected > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in complete_user_onboarding: % (SQLSTATE: %), user_uuid=%', SQLERRM, SQLSTATE, user_uuid;
        RETURN FALSE;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding TO authenticated;