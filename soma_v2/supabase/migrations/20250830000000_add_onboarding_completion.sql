-- Add onboarding completion tracking to profiles table
-- This tracks when users have fully completed the onboarding flow

-- First, ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles access
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add onboarding_completed_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz NULL;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed_at);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(user_id);

-- Add a helper function to mark onboarding as complete
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Insert profile if it doesn't exist, then update onboarding completion
  INSERT INTO public.profiles (user_id, onboarding_completed_at, created_at, updated_at)
  VALUES (user_uuid, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  WHERE profiles.onboarding_completed_at IS NULL; -- Only update if not already completed
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(uuid) TO service_role;

-- Add helper function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION public.has_completed_onboarding(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  completion_time timestamptz;
BEGIN
  SELECT onboarding_completed_at INTO completion_time
  FROM public.profiles 
  WHERE user_id = user_uuid;
  
  RETURN completion_time IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_completed_onboarding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_completed_onboarding(uuid) TO service_role;

-- Add function to get onboarding status with profile info
CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(user_uuid uuid)
RETURNS json AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  result json;
BEGIN
  SELECT * INTO profile_record
  FROM public.profiles 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'exists', false,
      'completed', false,
      'completed_at', null
    );
  END IF;
  
  RETURN json_build_object(
    'exists', true,
    'completed', profile_record.onboarding_completed_at IS NOT NULL,
    'completed_at', profile_record.onboarding_completed_at,
    'user_id', profile_record.user_id,
    'email', profile_record.email,
    'full_name', profile_record.full_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_onboarding_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_onboarding_status(uuid) TO service_role;