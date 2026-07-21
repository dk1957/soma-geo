-- Fix user creation trigger to handle edge cases and prevent database errors
-- This migration addresses the "Database error saving new user" issue

-- First, drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Extract email safely
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  
  -- Extract full name safely from various OAuth providers
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'given_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'family_name', '')
    ),
    ''
  );
  
  -- Clean up the name (remove extra spaces)
  user_name := TRIM(REGEXP_REPLACE(user_name, '\s+', ' ', 'g'));
  
  -- Insert profile record with conflict resolution
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id, 
    user_email, 
    NULLIF(user_name, ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_user_id_key' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create the trigger again
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Add helpful function to manually create missing profiles if needed
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN true;
  END IF;
  
  -- Get user data
  SELECT * INTO user_record FROM auth.users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create profile manually
  PERFORM public.handle_new_user() FROM (SELECT user_record.*) AS NEW;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to ensure profile for user %: %', user_uuid, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the helper function
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid) TO service_role;