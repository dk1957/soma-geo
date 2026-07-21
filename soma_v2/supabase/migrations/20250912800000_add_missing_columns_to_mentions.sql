-- Add missing columns to mentions table
-- Migration: 20250912800000_add_missing_columns_to_mentions.sql

-- This migration adds several columns that are referenced in the code but missing from the mentions table

DO $$
BEGIN
    -- Add context_before column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'context_before'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN context_before TEXT DEFAULT '';
        
        COMMENT ON COLUMN mentions.context_before IS 'Text context before the mention';
    END IF;

    -- Add context_after column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'context_after'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN context_after TEXT DEFAULT '';
        
        COMMENT ON COLUMN mentions.context_after IS 'Text context after the mention';
    END IF;

    -- Add full_context column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'full_context'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN full_context TEXT DEFAULT '';
        
        COMMENT ON COLUMN mentions.full_context IS 'Full context of the mention';
    END IF;

    -- Add mention_text column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_text'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN mention_text TEXT DEFAULT '';
        
        COMMENT ON COLUMN mentions.mention_text IS 'The text of the mention';
    END IF;

    -- Add mention_position column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_position'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN mention_position INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN mentions.mention_position IS 'Position of the mention in the text';
    END IF;

    -- Add sentence_index column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'sentence_index'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN sentence_index INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN mentions.sentence_index IS 'Index of the sentence containing the mention';
    END IF;

    -- Add prominence column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'prominence'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN prominence NUMERIC(5,2) DEFAULT 0;
        
        COMMENT ON COLUMN mentions.prominence IS 'Prominence score of the mention';
    END IF;

    -- Add mention_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'mention_type'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN mention_type TEXT DEFAULT 'direct';
        
        COMMENT ON COLUMN mentions.mention_type IS 'Type of mention (direct, indirect, etc)';
    END IF;

    -- Add response_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'response_id'
    ) THEN
        ALTER TABLE mentions
        ADD COLUMN response_id TEXT;
        
        COMMENT ON COLUMN mentions.response_id IS 'ID of the response containing this mention';
    END IF;
END
$$;