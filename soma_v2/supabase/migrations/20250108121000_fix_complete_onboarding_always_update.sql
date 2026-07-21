-- Fix complete_user_onboarding function to always update metadata
-- Date: 2025-01-08

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.complete_user_onboarding(uuid, jsonb);

-- Create the improved complete_user_onboarding function
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
    rows_affected integer;
BEGIN
    -- Set default metadata if none provided
    default_metadata := COALESCE(
        completion_metadata, 
        jsonb_build_object(
            'completed_via', 'application_flow', 
            'completed_at', NOW()
        )
    );

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
        default_metadata,
        NOW(), 
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        onboarding_status = 'completed',
        onboarding_completed_at = COALESCE(profiles.onboarding_completed_at, NOW()),
        onboarding_metadata = COALESCE(profiles.onboarding_metadata, '{}'::jsonb) || default_metadata,
        updated_at = NOW();

    -- Get the number of rows affected
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Log the operation for debugging
    RAISE LOG 'complete_user_onboarding: user_uuid=%, rows_affected=%, metadata=%', user_uuid, rows_affected, default_metadata;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in complete_user_onboarding: % (SQLSTATE: %), user_uuid=%', SQLERRM, SQLSTATE, user_uuid;
        RETURN FALSE;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding TO authenticated;