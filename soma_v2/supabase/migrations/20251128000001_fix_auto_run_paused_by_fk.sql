-- Fix auto_run_paused_by foreign key constraint
-- The original migration references auth.users which doesn't work with Clerk
-- Change to TEXT to store Clerk user ID directly

-- Drop the existing foreign key constraint
ALTER TABLE public.brands 
DROP CONSTRAINT IF EXISTS brands_auto_run_paused_by_fkey;

-- Change column type from UUID to TEXT for Clerk user ID storage
ALTER TABLE public.brands 
ALTER COLUMN auto_run_paused_by TYPE TEXT;

-- Update comment
COMMENT ON COLUMN public.brands.auto_run_paused_by IS 'Clerk user ID of admin who paused the auto-run';
