-- Phase 5: Cleanup — make TEXT columns nullable and prepare for eventual removal
-- ================================================================================
-- Run AFTER the historical migration script (scripts/migrate-responses-to-storage.ts)
-- has successfully migrated all existing data to Supabase Storage.
--
-- This migration:
--   1. Makes raw_response, prompt_text, system_prompt columns nullable
--   2. Adds a migration_status column for tracking
--   3. Does NOT drop columns yet — that's a separate future migration after verification
-- ================================================================================

-- Step 1: Make TEXT columns nullable (they may already be, but ensure it)
ALTER TABLE llm_simulation_responses
  ALTER COLUMN raw_response DROP NOT NULL,
  ALTER COLUMN prompt_text DROP NOT NULL;

-- Step 2: Add migration status tracking
ALTER TABLE llm_simulation_responses
  ADD COLUMN IF NOT EXISTS storage_migrated boolean DEFAULT false;

-- Step 3: Mark all rows that have been migrated to file storage
UPDATE llm_simulation_responses r
SET storage_migrated = true
WHERE EXISTS (
  SELECT 1 FROM llm_response_files f
  WHERE f.simulation_id = r.simulation_id
    AND f.model_name = r.model_name
);

-- Step 4: Add index for finding non-migrated rows
CREATE INDEX IF NOT EXISTS idx_llm_responses_not_migrated
  ON llm_simulation_responses (created_at)
  WHERE storage_migrated = false AND success = true;

-- Step 5: Add a comment documenting the deprecation
COMMENT ON COLUMN llm_simulation_responses.raw_response IS
  'DEPRECATED: Full response text now stored in Supabase Storage via llm_response_files. This column will be dropped in a future migration.';

COMMENT ON COLUMN llm_simulation_responses.prompt_text IS
  'DEPRECATED: Prompt text now stored in Supabase Storage via llm_response_files. This column will be dropped in a future migration.';
