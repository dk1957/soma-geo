-- Fix database schema issues
-- Migration: 20250913600000_fix_schema_issues.sql

-- This migration fixes several schema issues causing analysis failures:
-- 1. Add missing brand_name column to geo_analyses if needed
-- 2. Fix position data type in mentions table
-- 3. Fix action_items table constraints

DO $$
BEGIN
    -- 1. Check if brand_name column is expected in geo_analyses and add if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'geo_analyses' 
        AND column_name = 'brand_name'
    ) THEN
        -- Add brand_name column as a computed field from brands table
        ALTER TABLE geo_analyses
        ADD COLUMN brand_name TEXT;
        
        -- Create a trigger to automatically populate brand_name from brand_id
        CREATE OR REPLACE FUNCTION set_brand_name_from_id()
        RETURNS TRIGGER AS $$
        BEGIN
            SELECT name INTO NEW.brand_name 
            FROM brands 
            WHERE id = NEW.brand_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_set_brand_name
            BEFORE INSERT OR UPDATE ON geo_analyses
            FOR EACH ROW
            EXECUTE FUNCTION set_brand_name_from_id();
            
        -- Populate existing records
        UPDATE geo_analyses 
        SET brand_name = b.name 
        FROM brands b 
        WHERE geo_analyses.brand_id = b.id 
        AND geo_analyses.brand_name IS NULL;
    END IF;

    -- 2. Fix mentions table position column type
    -- Check current data type of mention_position
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_position'
        AND data_type = 'integer'
    ) THEN
        -- Change mention_position from integer to jsonb to store position objects
        ALTER TABLE mentions 
        ALTER COLUMN mention_position TYPE jsonb USING mention_position::text::jsonb;
        
        COMMENT ON COLUMN mentions.mention_position IS 'JSON object containing start and end positions: {"start": number, "end": number}';
    END IF;

    -- 3. Fix action_items table to allow null titles temporarily and add default
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'title'
        AND is_nullable = 'NO'
    ) THEN
        -- Make title nullable temporarily
        ALTER TABLE action_items 
        ALTER COLUMN title DROP NOT NULL;
        
        -- Update any existing null titles with a default
        UPDATE action_items 
        SET title = COALESCE(title, 'Action Item - ' || category)
        WHERE title IS NULL;
        
        -- Add back the NOT NULL constraint
        ALTER TABLE action_items 
        ALTER COLUMN title SET NOT NULL;
        
        -- Add a default value for future inserts
        ALTER TABLE action_items 
        ALTER COLUMN title SET DEFAULT 'General Action Item';
    END IF;

    -- 4. Ensure mentions table has all required columns with proper types
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_text'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN mention_text TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'sentence_index'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN sentence_index INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'context_before'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN context_before TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'context_after'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN context_after TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'full_context'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN full_context TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_type'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN mention_type TEXT DEFAULT 'direct';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'confidence_score'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.5;
    END IF;

    -- 5. Refresh schema cache
    NOTIFY pgrst, 'reload schema';

END
$$;

-- Add helpful comments
COMMENT ON TABLE geo_analyses IS 'Comprehensive analysis results for AI responses with brand intelligence';
COMMENT ON TABLE mentions IS 'Individual brand mentions extracted from responses with position and context data';
COMMENT ON TABLE action_items IS 'Actionable recommendations generated from analysis results';