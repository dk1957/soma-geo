-- Add check constraint for valid prominence values in mentions table
-- Migration: 20250913400000_add_prominence_check_constraint.sql

-- This migration adds a check constraint to ensure only valid prominence values are accepted

DO $$
BEGIN
    -- First, check if we already have the constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'mentions_prominence_check'
    ) THEN
        -- Add check constraint to validate prominence values
        ALTER TABLE mentions
        ADD CONSTRAINT mentions_prominence_check
        CHECK (prominence IN ('title', 'first_paragraph', 'body', 'conclusion'));
        
        -- Add comment explaining valid values
        COMMENT ON CONSTRAINT mentions_prominence_check ON mentions IS 
        'Ensures prominence value is one of: title, first_paragraph, body, conclusion';
    END IF;
END
$$;