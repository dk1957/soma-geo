-- ============================================================================
-- FIX: Increase prompt_type column size in suggested_prompts
-- ============================================================================
-- The original migration had VARCHAR(20) which is too small for some prompt types
-- This increases it to VARCHAR(50) to accommodate longer values

-- Alter the prompt_type column to be larger
ALTER TABLE IF EXISTS suggested_prompts 
    ALTER COLUMN prompt_type TYPE VARCHAR(50);

-- Also update user_prompts prompt_type if it exists
ALTER TABLE IF EXISTS user_prompts 
    ALTER COLUMN prompt_type TYPE VARCHAR(50);

-- Add comment
COMMENT ON COLUMN suggested_prompts.prompt_type IS 'Question type: what, who, how, why, compare, best, general';
