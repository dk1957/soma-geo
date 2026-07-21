-- Migration: Add clerk_id columns to brand_managers and workspace_users
-- This allows Clerk user IDs to be stored alongside legacy UUID user_id

ALTER TABLE public.brand_managers
ADD COLUMN IF NOT EXISTS clerk_id text;

ALTER TABLE public.workspace_users
ADD COLUMN IF NOT EXISTS clerk_id text;

-- Add indexes for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='brand_managers' AND indexname='idx_brand_managers_clerk_id'
  ) THEN
    CREATE INDEX idx_brand_managers_clerk_id ON public.brand_managers (clerk_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='workspace_users' AND indexname='idx_workspace_users_clerk_id'
  ) THEN
    CREATE INDEX idx_workspace_users_clerk_id ON public.workspace_users (clerk_id);
  END IF;
END;
$$;

-- Optional: backfill clerk_id from profiles table where possible
-- This assumes profiles.clerk_id exists and maps to account_users.user_id
-- You can run a backfill manually if desired

-- Refresh PostgREST schema cache by updating an unrelated comment (workaround)
COMMENT ON SCHEMA public IS 'schema refreshed at ' || now();
