-- Migration: Make user_id nullable on tables that need to support Clerk authentication
-- Since Clerk uses string IDs stored in clerk_id, the uuid user_id column should be optional

-- 1. ground_truth_collections
ALTER TABLE public.ground_truth_collections
ALTER COLUMN user_id DROP NOT NULL;

-- 2. brand_contexts - also has NOT NULL user_id
ALTER TABLE public.brand_contexts
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Check and update other tables that might have NOT NULL user_id constraints

-- audit_results
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_results' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.audit_results ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- brand_reports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brand_reports' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.brand_reports ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- external_brand_reports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_brand_reports' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.external_brand_reports ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- gseo_content
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gseo_content' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.gseo_content ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- user_notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notifications' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.user_notifications ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- user_prompts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_prompts' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.user_prompts ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- invite_link_usage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invite_link_usage' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.invite_link_usage ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
