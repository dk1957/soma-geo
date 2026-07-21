-- Migration: Update check constraints to support Clerk authentication
-- Constraints that required user_id now accept user_id OR clerk_id

-- ground_truth_collections - update constraint to accept either user_id or clerk_id
ALTER TABLE public.ground_truth_collections 
DROP CONSTRAINT IF EXISTS ground_truth_collections_require_user_and_brand;

ALTER TABLE public.ground_truth_collections 
ADD CONSTRAINT ground_truth_collections_require_user_and_brand 
CHECK (((user_id IS NOT NULL) OR (clerk_id IS NOT NULL)) AND (brand_name IS NOT NULL));

-- Check for and update any other similar constraints that might exist
-- brand_contexts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'brand_contexts'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%user_id IS NOT NULL%'
    AND pg_get_constraintdef(oid) NOT LIKE '%clerk_id%'
  ) THEN
    -- Get constraint name and drop it
    EXECUTE (
      SELECT 'ALTER TABLE brand_contexts DROP CONSTRAINT IF EXISTS ' || conname
      FROM pg_constraint 
      WHERE conrelid = 'brand_contexts'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%user_id IS NOT NULL%'
      LIMIT 1
    );
  END IF;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
