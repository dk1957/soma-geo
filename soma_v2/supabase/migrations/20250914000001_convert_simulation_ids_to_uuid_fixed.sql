-- Migration: Convert simulation IDs from TEXT to UUID
-- Date: 2025-09-14
-- Description: Convert llm_simulations.id and llm_simulation_responses.id, simulation_id, prompt_id from TEXT to UUID

BEGIN;

-- Step 1: Add new UUID columns to llm_simulations
ALTER TABLE llm_simulations ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Step 2: Add new UUID columns to llm_simulation_responses  
ALTER TABLE llm_simulation_responses ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE llm_simulation_responses ADD COLUMN simulation_id_new UUID;
ALTER TABLE llm_simulation_responses ADD COLUMN prompt_id_new UUID;

-- Step 3: Create temporary mapping table for simulation IDs
CREATE TEMP TABLE simulation_id_mapping AS
SELECT id as old_id, id_new as new_id 
FROM llm_simulations;

-- Step 4: Update llm_simulation_responses with new UUIDs from mapping
UPDATE llm_simulation_responses 
SET simulation_id_new = sim_map.new_id
FROM simulation_id_mapping sim_map
WHERE llm_simulation_responses.simulation_id = sim_map.old_id;

-- Step 5: Update prompt_id_new with UUIDs from user_prompts table
-- First, check if the prompt_id exists in user_prompts and update accordingly
UPDATE llm_simulation_responses 
SET prompt_id_new = up.id
FROM user_prompts up
WHERE llm_simulation_responses.prompt_id = up.prompt_id;

-- Step 6: Handle any responses that don't have matching prompts by creating minimal prompt records
-- Insert missing prompts with a default brand_id (get first available brand)
DO $$
DECLARE
    default_brand_id UUID;
    default_account_id UUID;
BEGIN
    -- Get the first available brand and account
    SELECT b.id, b.account_id INTO default_brand_id, default_account_id
    FROM brands b 
    LIMIT 1;
    
    -- If we have a default brand, create missing prompts
    IF default_brand_id IS NOT NULL THEN
        INSERT INTO user_prompts (id, account_id, brand_id, prompt_id, prompt_text, category, priority, is_selected)
        SELECT 
            gen_random_uuid(),
            default_account_id,
            default_brand_id,
            lsr.prompt_id,
            'Legacy simulation prompt - ' || lsr.prompt_id,
            'simulation',
            1,
            true
        FROM (SELECT DISTINCT prompt_id FROM llm_simulation_responses WHERE prompt_id NOT IN (SELECT prompt_id FROM user_prompts) AND prompt_id IS NOT NULL) lsr;
        
        -- Now update the remaining NULL prompt_id_new values
        UPDATE llm_simulation_responses 
        SET prompt_id_new = up.id
        FROM user_prompts up
        WHERE llm_simulation_responses.prompt_id = up.prompt_id
        AND llm_simulation_responses.prompt_id_new IS NULL;
    END IF;
END $$;

-- Step 7: Drop old columns and rename new ones for llm_simulations
ALTER TABLE llm_simulations DROP COLUMN id CASCADE;
ALTER TABLE llm_simulations RENAME COLUMN id_new TO id;

-- Step 8: Drop old columns and rename new ones for llm_simulation_responses
ALTER TABLE llm_simulation_responses DROP COLUMN id CASCADE;
ALTER TABLE llm_simulation_responses DROP COLUMN simulation_id CASCADE;
ALTER TABLE llm_simulation_responses DROP COLUMN prompt_id CASCADE;
ALTER TABLE llm_simulation_responses RENAME COLUMN id_new TO id;
ALTER TABLE llm_simulation_responses RENAME COLUMN simulation_id_new TO simulation_id;
ALTER TABLE llm_simulation_responses RENAME COLUMN prompt_id_new TO prompt_id;

-- Step 9: Add primary key constraints
ALTER TABLE llm_simulations ADD CONSTRAINT llm_simulations_pkey PRIMARY KEY (id);
ALTER TABLE llm_simulation_responses ADD CONSTRAINT llm_simulation_responses_pkey PRIMARY KEY (id);

-- Step 10: Add foreign key constraints
ALTER TABLE llm_simulation_responses 
ADD CONSTRAINT llm_simulation_responses_simulation_id_fkey 
FOREIGN KEY (simulation_id) REFERENCES llm_simulations(id) ON DELETE CASCADE;

ALTER TABLE llm_simulation_responses 
ADD CONSTRAINT llm_simulation_responses_prompt_id_fkey 
FOREIGN KEY (prompt_id) REFERENCES user_prompts(id) ON DELETE CASCADE;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_simulation_id ON llm_simulation_responses(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_prompt_id ON llm_simulation_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_created_at ON llm_simulation_responses(created_at DESC);

-- Clean up temp table
DROP TABLE IF EXISTS simulation_id_mapping;

COMMIT;

-- Add helpful comments
COMMENT ON TABLE llm_simulations IS 'LLM simulation configurations and results - UUID primary keys';
COMMENT ON TABLE llm_simulation_responses IS 'Individual LLM responses from simulations - UUID primary keys with proper foreign key relationships';
COMMENT ON COLUMN llm_simulation_responses.simulation_id IS 'References llm_simulations(id) - UUID foreign key';
COMMENT ON COLUMN llm_simulation_responses.prompt_id IS 'References user_prompts(id) - UUID foreign key';