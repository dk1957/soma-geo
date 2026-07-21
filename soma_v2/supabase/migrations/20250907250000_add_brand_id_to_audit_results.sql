-- Add brand_id column to audit_results table and update existing data
-- This migration ensures audit_results table uses brand_id + account_id consistently

-- Step 1: Add brand_id column
ALTER TABLE audit_results 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_results_brand_id ON audit_results(brand_id);

-- Step 3: Update existing audit_results records to populate brand_id
-- Match by brand_name and account_id to get the correct brand_id
UPDATE audit_results 
SET brand_id = brands.id
FROM brands 
WHERE audit_results.brand_name = brands.name 
  AND audit_results.account_id = brands.account_id
  AND audit_results.brand_id IS NULL;

-- Step 4: Add constraint to ensure brand_id is not null for new records
-- (We'll keep brand_name for backward compatibility but brand_id becomes primary)
ALTER TABLE audit_results 
ADD CONSTRAINT check_brand_id_not_null 
CHECK (brand_id IS NOT NULL);

-- Step 5: Update RLS policies to work with brand_id
DROP POLICY IF EXISTS "Users can view their own audit results" ON audit_results;
DROP POLICY IF EXISTS "Users can insert audit results" ON audit_results;
DROP POLICY IF EXISTS "Users can update their audit results" ON audit_results;

-- Create new policies using brand_id
CREATE POLICY "Users can view their own audit results" ON audit_results
  FOR SELECT USING (
    auth.uid() = user_id OR 
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    ) OR
    brand_id IN (
      SELECT b.id FROM brands b 
      JOIN account_users au ON b.account_id = au.account_id 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit results" ON audit_results
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    ) OR
    brand_id IN (
      SELECT b.id FROM brands b 
      JOIN account_users au ON b.account_id = au.account_id 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their audit results" ON audit_results
  FOR UPDATE USING (
    auth.uid() = user_id OR
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    ) OR
    brand_id IN (
      SELECT b.id FROM brands b 
      JOIN account_users au ON b.account_id = au.account_id 
      WHERE au.user_id = auth.uid()
    )
  );

-- Step 6: Add helpful comment
COMMENT ON COLUMN audit_results.brand_id IS 'Foreign key to brands table - primary identifier for brand relationships';
COMMENT ON COLUMN audit_results.brand_name IS 'Brand name - kept for backward compatibility and display purposes';

-- Step 7: Verify data integrity
DO $$
BEGIN
  -- Check if any audit_results still have null brand_id
  IF EXISTS (SELECT 1 FROM audit_results WHERE brand_id IS NULL) THEN
    RAISE WARNING 'Some audit_results records could not be matched to brands and have null brand_id';
  ELSE
    RAISE NOTICE 'All audit_results records successfully updated with brand_id';
  END IF;
END $$;