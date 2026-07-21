-- Fix LLM Simulations RLS Policies and Authentication
-- Created: 2025-09-03
-- Purpose: Fix RLS policy violations and ensure proper data isolation

-- Ensure account_id and brand_id columns exist on llm_simulations
ALTER TABLE llm_simulations 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Update existing simulation records to populate account_id and brand_id
-- This needs to be done based on user_id to account relationship
UPDATE llm_simulations 
SET account_id = a.id
FROM accounts a
WHERE llm_simulations.user_id = a.owner_id 
AND llm_simulations.account_id IS NULL;

-- For brand_id, we'll try to match based on brand_name or set to the first brand in the account
UPDATE llm_simulations 
SET brand_id = b.id
FROM brands b
WHERE llm_simulations.account_id = b.account_id 
AND LOWER(COALESCE(llm_simulations.brand_name, '')) = LOWER(b.name)
AND llm_simulations.brand_id IS NULL;

-- If still no brand_id, set to the first brand in the account
UPDATE llm_simulations 
SET brand_id = (
  SELECT b.id 
  FROM brands b 
  WHERE b.account_id = llm_simulations.account_id 
  LIMIT 1
)
WHERE llm_simulations.brand_id IS NULL 
AND llm_simulations.account_id IS NOT NULL;

-- Create comprehensive RLS policy for llm_simulations that works with authentication
DROP POLICY IF EXISTS "Users can only access their own simulations" ON llm_simulations;

CREATE POLICY "Users can access simulations from their accounts" ON llm_simulations
    FOR ALL USING (
        -- Direct user ownership
        auth.uid() = user_id 
        OR 
        -- Account membership
        (account_id IS NOT NULL AND account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true
        ))
    );

-- Also create a more permissive policy for service operations
CREATE POLICY "Service can access all simulations" ON llm_simulations
    FOR ALL USING (
        -- Allow service role to access all records
        auth.role() = 'service_role'
    );

-- Update llm_analysis_results policy as well
DROP POLICY IF EXISTS "Users can only access analysis from their simulations" ON llm_analysis_results;

CREATE POLICY "Users can access analysis from their accounts" ON llm_analysis_results
    FOR ALL USING (
        simulation_id IN (
            SELECT id FROM llm_simulations 
            WHERE auth.uid() = user_id 
            OR (account_id IS NOT NULL AND account_id IN (
                SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true
            ))
        )
    );

-- Add indexes for the new foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_llm_simulations_account_id ON llm_simulations(account_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_brand_id ON llm_simulations(brand_id);

-- Grant necessary permissions to service role
GRANT ALL ON llm_simulations TO service_role;
GRANT ALL ON llm_responses TO service_role;
GRANT ALL ON llm_prompts TO service_role;
GRANT ALL ON llm_analysis_results TO service_role;

-- Also ensure authenticated users can still access their data
GRANT ALL ON llm_simulations TO authenticated;
GRANT ALL ON llm_responses TO authenticated;
GRANT ALL ON llm_prompts TO authenticated;
GRANT ALL ON llm_analysis_results TO authenticated;