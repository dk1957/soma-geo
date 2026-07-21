-- Fix circular relationship between geo_analyses and responses
-- Migration: 20250913000000_fix_circular_relationship.sql

-- This migration removes the circular reference between geo_analyses and responses tables
-- which is causing the "Could not embed because more than one relationship was found" error

DO $$
BEGIN
    -- Step 1: Drop the foreign key constraint from geo_analyses to responses
    ALTER TABLE geo_analyses
    DROP CONSTRAINT IF EXISTS geo_analyses_response_id_fkey;

    -- Step 2: Ensure response_id still has a unique constraint
    -- This maintains data integrity without creating a circular reference
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'geo_analyses_response_id_unique'
    ) THEN
        -- Add unique constraint to enforce one-to-one relationship
        ALTER TABLE geo_analyses
        ADD CONSTRAINT geo_analyses_response_id_unique UNIQUE (response_id);
    END IF;

    -- Step 3: Add a comment explaining this relationship
    COMMENT ON COLUMN geo_analyses.response_id IS 'Unique identifier linking to a response. No foreign key to avoid circular reference, but enforced with unique constraint';
END
$$;