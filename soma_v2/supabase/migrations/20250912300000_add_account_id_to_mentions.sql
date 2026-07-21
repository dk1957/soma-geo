-- Add account_id column to mentions table
-- Migration: 20250912300000_add_account_id_to_mentions.sql

-- Check if the column exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentions' 
        AND column_name = 'account_id'
    ) THEN
        -- Add account_id column
        ALTER TABLE mentions
        ADD COLUMN account_id UUID REFERENCES accounts(id);
        
        -- Add index for better performance
        CREATE INDEX idx_mentions_account_id ON mentions(account_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN mentions.account_id IS 'Reference to the account that owns this mention';
    END IF;
END
$$;