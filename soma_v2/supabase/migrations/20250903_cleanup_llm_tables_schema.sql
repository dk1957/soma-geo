-- LLM Tables Schema Cleanup
-- Created: 2025-09-03
-- Purpose: Add proper foreign key relationships and remove redundant columns

-- Add account_id and brand_id to llm_responses table
ALTER TABLE llm_responses 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Add account_id and brand_id to llm_prompts table  
ALTER TABLE llm_prompts
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Update existing records to populate account_id and brand_id from simulation records
UPDATE llm_responses 
SET account_id = s.account_id, brand_id = s.brand_id
FROM llm_simulations s 
WHERE llm_responses.simulation_id = s.id 
AND (llm_responses.account_id IS NULL OR llm_responses.brand_id IS NULL);

UPDATE llm_prompts 
SET account_id = s.account_id, brand_id = s.brand_id  
FROM llm_simulations s
WHERE llm_prompts.simulation_id = s.id
AND (llm_prompts.account_id IS NULL OR llm_prompts.brand_id IS NULL);

-- Remove redundant columns from llm_simulations that duplicate brand information
-- Keep essential columns: brand_name for display, remove redundant brand data
ALTER TABLE llm_simulations 
DROP COLUMN IF EXISTS brand_website,
DROP COLUMN IF EXISTS brand_category,
DROP COLUMN IF EXISTS target_markets,
DROP COLUMN IF EXISTS products_services;

-- Remove old/unused columns from llm_simulations if they exist  
ALTER TABLE llm_simulations
DROP COLUMN IF EXISTS old_text_id,
DROP COLUMN IF EXISTS cached_responses,
DROP COLUMN IF EXISTS models,
DROP COLUMN IF EXISTS prompt_count,
DROP COLUMN IF EXISTS options,
DROP COLUMN IF EXISTS actual_completion_time,
DROP COLUMN IF EXISTS total_cost_estimate,
DROP COLUMN IF EXISTS total_tokens_used,
DROP COLUMN IF EXISTS error_message;

-- Update RLS policies to include account_id and brand_id for proper data isolation

-- Update RLS policy for llm_responses
DROP POLICY IF EXISTS "Users can only access responses from their simulations" ON llm_responses;
CREATE POLICY "Users can access responses from their accounts" ON llm_responses
    FOR ALL USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Update RLS policy for llm_prompts  
DROP POLICY IF EXISTS "Users can only access prompts from their simulations" ON llm_prompts;
CREATE POLICY "Users can access prompts from their accounts" ON llm_prompts
    FOR ALL USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Add indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_llm_responses_account_id ON llm_responses(account_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_brand_id ON llm_responses(brand_id);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_account_id ON llm_prompts(account_id);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_brand_id ON llm_prompts(brand_id);

-- Add constraints to ensure data consistency (optional - can be enabled later)
-- ALTER TABLE llm_responses ALTER COLUMN account_id SET NOT NULL;
-- ALTER TABLE llm_responses ALTER COLUMN brand_id SET NOT NULL;
-- ALTER TABLE llm_prompts ALTER COLUMN account_id SET NOT NULL;
-- ALTER TABLE llm_prompts ALTER COLUMN brand_id SET NOT NULL;