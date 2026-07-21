-- Fix complete_user_onboarding function to accept metadata parameter
-- Date: 2025-01-08

-- Drop the existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS public.complete_user_onboarding(uuid);

-- Create the updated complete_user_onboarding function to accept metadata parameter
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
        updated_at = NOW()
    WHERE profiles.onboarding_status != 'completed' OR profiles.onboarding_completed_at IS NULL;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in complete_user_onboarding: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RETURN FALSE;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding TO authenticated;