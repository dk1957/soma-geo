-- Fix prominence column type in mentions table
-- Migration: 20250913200000_fix_prominence_type_in_mentions.sql

-- This migration changes the prominence column in the mentions table from numeric to text
-- to match the expected enum values: 'title', 'first_paragraph', 'body', 'conclusion'

DO $$
BEGIN
    -- Change prominence column type from numeric to text
    ALTER TABLE mentions
    ALTER COLUMN prominence TYPE TEXT USING prominence::TEXT;
    
    -- Set default value
    ALTER TABLE mentions
    ALTER COLUMN prominence SET DEFAULT 'body';
    
    -- Add comment explaining valid values
    COMMENT ON COLUMN mentions.prominence IS 'Position prominence: title, first_paragraph, body, conclusion';
END
$$;