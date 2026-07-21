-- Add missing brand_mentions column to geo_analyses table
-- Migration: 20250912100000_add_brand_mentions_column.sql

-- Check if the column exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'geo_analyses' 
        AND column_name = 'brand_mentions'
    ) THEN
        -- Add brand_mentions column
        ALTER TABLE geo_analyses
        ADD COLUMN brand_mentions JSONB DEFAULT '[]'::jsonb;
        
        -- Add comment for documentation
        COMMENT ON COLUMN geo_analyses.brand_mentions IS 'JSON array of brand mentions detected in the response';
    END IF;
END
$$;