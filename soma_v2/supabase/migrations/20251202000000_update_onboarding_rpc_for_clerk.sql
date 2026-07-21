-- Migration: Update onboarding RPC functions to use clerk_id instead of user_id
-- This aligns the database functions with the Clerk authentication migration

-- Drop the old function first
DROP FUNCTION IF EXISTS public.update_onboarding_status(UUID, TEXT, INTEGER, JSONB);

-- Create the new function that accepts clerk_id
CREATE OR REPLACE FUNCTION public.update_onboarding_status(
    p_clerk_id   TEXT,
    p_status     TEXT,
    p_step       INTEGER DEFAULT NULL,
    p_metadata   JSONB DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
    v_profile_id UUID;
    v_current_status TEXT;
    v_current_completed_at TIMESTAMPTZ;
BEGIN
    -- Get the profile ID and current status
    SELECT id, onboarding_status, onboarding_completed_at 
    INTO v_profile_id, v_current_status, v_current_completed_at
    FROM profiles 
    WHERE clerk_id = p_clerk_id;
    
    IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profile not found for clerk_id: ' || p_clerk_id
        );
    END IF;

    -- Don't allow changing from completed to another status if completed via report generation
    -- This preserves the completion state
    IF v_current_status = 'completed' AND v_current_completed_at IS NOT NULL AND p_status != 'completed' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot change status from completed - user has already completed onboarding',
            'user_id', v_profile_id,
            'current_status', v_current_status
        );
    END IF;

    -- Update the profile with new onboarding status
    UPDATE profiles
    SET 
        onboarding_status = p_status,
        onboarding_step = COALESCE(p_step, onboarding_step),
        onboarding_started_at = CASE 
            WHEN p_status = 'in_progress' AND onboarding_started_at IS NULL 
            THEN NOW() 
            ELSE onboarding_started_at 
        END,
        onboarding_completed_at = CASE 
            WHEN p_status = 'completed' 
            THEN COALESCE(onboarding_completed_at, NOW()) 
            ELSE onboarding_completed_at 
        END,
        onboarding_metadata = COALESCE(
            p_metadata || COALESCE(onboarding_metadata, '{}'::jsonb),
            onboarding_metadata
        ),
        updated_at = NOW()
    WHERE clerk_id = p_clerk_id
    RETURNING jsonb_build_object(
        'success', true,
        'user_id', id,
        'clerk_id', clerk_id,
        'status', onboarding_status,
        'step', onboarding_step,
        'started_at', onboarding_started_at,
        'completed_at', onboarding_completed_at
    ) INTO v_result;

    RETURN COALESCE(v_result, jsonb_build_object(
        'success', false,
        'error', 'Failed to update onboarding status'
    ));
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_onboarding_status(TEXT, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_onboarding_status(TEXT, TEXT, INTEGER, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.update_onboarding_status(TEXT, TEXT, INTEGER, JSONB) TO service_role;

-- Update complete_user_onboarding function to use clerk_id
DROP FUNCTION IF EXISTS public.complete_user_onboarding(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    clerk_user_id TEXT,
    completion_metadata JSONB DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
    v_profile_id UUID;
    v_current_status TEXT;
    v_current_completed_at TIMESTAMPTZ;
BEGIN
    -- Get current profile state
    SELECT id, onboarding_status, onboarding_completed_at 
    INTO v_profile_id, v_current_status, v_current_completed_at
    FROM profiles 
    WHERE clerk_id = clerk_user_id;
    
    IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profile not found for clerk_id: ' || clerk_user_id
        );
    END IF;

    -- If already completed with a timestamp, preserve the original completion
    IF v_current_status = 'completed' AND v_current_completed_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User already completed onboarding',
            'user_id', v_profile_id,
            'clerk_id', clerk_user_id,
            'status', v_current_status,
            'completed_at', v_current_completed_at,
            'already_completed', true
        );
    END IF;

    -- Mark as completed atomically
    UPDATE profiles
    SET 
        onboarding_status = 'completed',
        onboarding_step = 100,
        onboarding_completed_at = NOW(),
        onboarding_metadata = COALESCE(
            completion_metadata || COALESCE(onboarding_metadata, '{}'::jsonb),
            onboarding_metadata,
            completion_metadata
        ),
        updated_at = NOW()
    WHERE clerk_id = clerk_user_id
    RETURNING jsonb_build_object(
        'success', true,
        'user_id', id,
        'clerk_id', clerk_id,
        'status', onboarding_status,
        'step', onboarding_step,
        'completed_at', onboarding_completed_at
    ) INTO v_result;

    RETURN COALESCE(v_result, jsonb_build_object(
        'success', false,
        'error', 'Failed to complete onboarding'
    ));
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(TEXT, JSONB) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION public.update_onboarding_status(TEXT, TEXT, INTEGER, JSONB) IS 
'Update user onboarding status. Uses clerk_id instead of user_id for Clerk authentication integration.';

COMMENT ON FUNCTION public.complete_user_onboarding(TEXT, JSONB) IS 
'Atomically complete user onboarding. Uses clerk_id instead of user_uuid for Clerk authentication integration.';
