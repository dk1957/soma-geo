-- Migration: Make user_id nullable on membership tables to support Clerk migration
-- This makes it possible to store Clerk string IDs in clerk_id while leaving user_id optional.

BEGIN;

-- account_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'account_users' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.account_users ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- brand_managers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_managers' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.brand_managers ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- workspace_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_users' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.workspace_users ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

-- Ensure clerk_id columns exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'account_users' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE public.account_users ADD COLUMN clerk_id text;
    CREATE INDEX IF NOT EXISTS idx_account_users_clerk_id ON public.account_users (clerk_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_managers' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE public.brand_managers ADD COLUMN clerk_id text;
    CREATE INDEX IF NOT EXISTS idx_brand_managers_clerk_id ON public.brand_managers (clerk_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_users' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE public.workspace_users ADD COLUMN clerk_id text;
    CREATE INDEX IF NOT EXISTS idx_workspace_users_clerk_id ON public.workspace_users (clerk_id);
  END IF;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
