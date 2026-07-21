-- Migration: Clean and update geo_analyses table with model_name (safe version)
-- Date: 2025-09-14
-- Description: Safely add model_name column and ensure proper configuration

BEGIN;

-- Step 1: Ensure model_name column exists with proper constraints
DO $$ 
BEGIN
    -- Check if model_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'geo_analyses' 
        AND column_name = 'model_name'
    ) THEN
        ALTER TABLE geo_analyses 
        ADD COLUMN model_name VARCHAR(100);
        RAISE NOTICE 'Added model_name column to geo_analyses table';
    ELSE
        RAISE NOTICE 'model_name column already exists in geo_analyses table';
    END IF;
END $$;

-- Step 2: Add index on model_name for better query performance (safe)
DROP INDEX IF EXISTS idx_geo_analyses_model_name;
CREATE INDEX idx_geo_analyses_model_name ON geo_analyses(model_name);

-- Step 3: Add composite index for common queries (safe)
DROP INDEX IF EXISTS idx_geo_analyses_brand_model;
CREATE INDEX idx_geo_analyses_brand_model ON geo_analyses(brand_id, model_name);

-- Step 4: Update any existing records with NULL model_name to have a default value
UPDATE geo_analyses 
SET model_name = 'unknown' 
WHERE model_name IS NULL;

-- Step 5: Add helpful comment
COMMENT ON COLUMN geo_analyses.model_name IS 'Name of the LLM model used to generate the analyzed response (e.g., gpt-4, claude-3, etc.)';

COMMIT;