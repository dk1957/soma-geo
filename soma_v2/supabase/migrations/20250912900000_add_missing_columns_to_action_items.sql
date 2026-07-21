-- Add missing columns to action_items table
-- Migration: 20250912900000_add_missing_columns_to_action_items.sql

-- This migration adds columns that are referenced in the code but missing from the action_items table

DO $$
BEGIN
    -- Add action_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'action_type'
    ) THEN
        ALTER TABLE action_items
        ADD COLUMN action_type TEXT DEFAULT 'general';
        
        COMMENT ON COLUMN action_items.action_type IS 'Type of action to be taken';
    END IF;

    -- Add expected_impact column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'expected_impact'
    ) THEN
        ALTER TABLE action_items
        ADD COLUMN expected_impact JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN action_items.expected_impact IS 'Expected impact of the action';
    END IF;

    -- Add effort_required column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'effort_required'
    ) THEN
        ALTER TABLE action_items
        ADD COLUMN effort_required TEXT DEFAULT 'medium';
        
        COMMENT ON COLUMN action_items.effort_required IS 'Effort required to implement the action';
    END IF;

    -- Add estimated_timeline column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'estimated_timeline'
    ) THEN
        ALTER TABLE action_items
        ADD COLUMN estimated_timeline TEXT DEFAULT '1-2 weeks';
        
        COMMENT ON COLUMN action_items.estimated_timeline IS 'Estimated timeline for completion';
    END IF;
END
$$;