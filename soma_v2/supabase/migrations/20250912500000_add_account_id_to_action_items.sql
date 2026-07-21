-- Add account_id column to action_items table
-- Migration: 20250912500000_add_account_id_to_action_items.sql

-- Check if the column exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_items' 
        AND column_name = 'account_id'
    ) THEN
        -- Add account_id column
        ALTER TABLE action_items
        ADD COLUMN account_id UUID REFERENCES accounts(id);
        
        -- Add index for better performance
        CREATE INDEX idx_action_items_account_id ON action_items(account_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN action_items.account_id IS 'Reference to the account that owns this action item';
    END IF;
END
$$;