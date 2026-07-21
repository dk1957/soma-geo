-- Convert simulation tables to use UUIDs instead of TEXT IDs
-- Migration: 20250914000000_convert_simulation_ids_to_uuid.sql

BEGIN;

-- Step 1: Add new UUID columns to llm_simulations table
ALTER TABLE public.llm_simulations 
ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid();

-- Step 2: Add new UUID columns to llm_simulation_responses table
ALTER TABLE public.llm_simulation_responses 
ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS simulation_id_new UUID,
ADD COLUMN IF NOT EXISTS prompt_id_new UUID;

-- Step 3: Create mapping table to track old TEXT IDs to new UUIDs
CREATE TEMP TABLE simulation_id_mapping AS
SELECT id as old_id, id_new as new_id 
FROM public.llm_simulations;

-- Step 4: Update simulation_id_new in responses table using the mapping
UPDATE public.llm_simulation_responses 
SET simulation_id_new = mapping.new_id
FROM simulation_id_mapping mapping
WHERE public.llm_simulation_responses.simulation_id = mapping.old_id;

-- Step 5: Try to link prompt_id to user_prompts table where possible
-- First, let's see if we can find matching prompts by prompt_id
UPDATE public.llm_simulation_responses 
SET prompt_id_new = up.id
FROM public.user_prompts up
WHERE public.llm_simulation_responses.prompt_id = up.prompt_id;

-- Step 6: For any responses that don't have matching user_prompts, create them
-- Insert missing prompts into user_prompts table
INSERT INTO public.user_prompts (
  id,
  account_id, 
  prompt_id,
  prompt_text,
  category,
  priority,
  is_selected,
  created_at
)
SELECT 
  gen_random_uuid() as id,
  lsr.account_id,
  lsr.prompt_id,
  COALESCE(lsr.prompt_text, 'Simulation prompt') as prompt_text,
  'simulation' as category,
  1 as priority,
  true as is_selected,
  lsr.created_at
FROM public.llm_simulation_responses lsr
LEFT JOIN public.user_prompts up ON lsr.prompt_id = up.prompt_id
WHERE up.id IS NULL 
  AND lsr.prompt_id_new IS NULL
  AND lsr.prompt_id IS NOT NULL
GROUP BY lsr.account_id, lsr.prompt_id, lsr.prompt_text, lsr.created_at;

-- Step 7: Update prompt_id_new for the newly created prompts
UPDATE public.llm_simulation_responses 
SET prompt_id_new = up.id
FROM public.user_prompts up
WHERE public.llm_simulation_responses.prompt_id = up.prompt_id
  AND public.llm_simulation_responses.prompt_id_new IS NULL;

-- Step 8: Drop old columns and rename new ones for llm_simulations
ALTER TABLE public.llm_simulations 
DROP COLUMN IF EXISTS id CASCADE;

ALTER TABLE public.llm_simulations 
RENAME COLUMN id_new TO id;

-- Step 9: Drop old columns and rename new ones for llm_simulation_responses
ALTER TABLE public.llm_simulation_responses 
DROP COLUMN IF EXISTS id CASCADE,
DROP COLUMN IF EXISTS simulation_id CASCADE,
DROP COLUMN IF EXISTS prompt_id CASCADE;

ALTER TABLE public.llm_simulation_responses 
RENAME COLUMN id_new TO id,
RENAME COLUMN simulation_id_new TO simulation_id,
RENAME COLUMN prompt_id_new TO prompt_id;

-- Step 10: Add constraints back
ALTER TABLE public.llm_simulations 
ADD CONSTRAINT llm_simulations_pkey PRIMARY KEY (id);

ALTER TABLE public.llm_simulation_responses 
ADD CONSTRAINT llm_simulation_responses_pkey PRIMARY KEY (id),
ADD CONSTRAINT llm_simulation_responses_simulation_id_fkey 
  FOREIGN KEY (simulation_id) REFERENCES public.llm_simulations(id) ON DELETE CASCADE,
ADD CONSTRAINT llm_simulation_responses_prompt_id_fkey 
  FOREIGN KEY (prompt_id) REFERENCES public.user_prompts(id) ON DELETE SET NULL;

-- Step 11: Recreate indexes
DROP INDEX IF EXISTS idx_llm_simulations_account_brand;
DROP INDEX IF EXISTS idx_llm_simulations_status;
DROP INDEX IF EXISTS idx_llm_simulations_created_at;
DROP INDEX IF EXISTS idx_llm_simulation_responses_simulation_id;
DROP INDEX IF EXISTS idx_llm_simulation_responses_account_brand;
DROP INDEX IF EXISTS idx_llm_simulation_responses_model;
DROP INDEX IF EXISTS idx_llm_simulation_responses_success;
DROP INDEX IF EXISTS idx_llm_simulation_responses_created_at;

CREATE INDEX idx_llm_simulations_account_brand ON public.llm_simulations(account_id, brand_id);
CREATE INDEX idx_llm_simulations_status ON public.llm_simulations(status);
CREATE INDEX idx_llm_simulations_created_at ON public.llm_simulations(created_at DESC);
CREATE INDEX idx_llm_simulation_responses_simulation_id ON public.llm_simulation_responses(simulation_id);
CREATE INDEX idx_llm_simulation_responses_account_brand ON public.llm_simulation_responses(account_id, brand_id);
CREATE INDEX idx_llm_simulation_responses_model ON public.llm_simulation_responses(model_name);
CREATE INDEX idx_llm_simulation_responses_success ON public.llm_simulation_responses(success);
CREATE INDEX idx_llm_simulation_responses_created_at ON public.llm_simulation_responses(created_at DESC);
CREATE INDEX idx_llm_simulation_responses_prompt_id ON public.llm_simulation_responses(prompt_id);

-- Step 12: Update the trigger function to work with UUIDs
CREATE OR REPLACE FUNCTION update_simulation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completed/failed job counts and metrics
  UPDATE public.llm_simulations 
  SET 
    completed_jobs = (
      SELECT COUNT(*) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND success = true
    ),
    failed_jobs = (
      SELECT COUNT(*) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND success = false
    ),
    total_cost = (
      SELECT COALESCE(SUM(cost_estimate), 0) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id
    ),
    average_response_time_ms = (
      SELECT COALESCE(AVG(response_time_ms), 0)::INTEGER FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND response_time_ms IS NOT NULL
    ),
    status = CASE 
      WHEN (
        SELECT COUNT(*) FROM public.llm_simulation_responses 
        WHERE simulation_id = NEW.simulation_id
      ) >= total_jobs THEN 'completed'
      ELSE status
    END,
    completed_at = CASE 
      WHEN (
        SELECT COUNT(*) FROM public.llm_simulation_responses 
        WHERE simulation_id = NEW.simulation_id
      ) >= total_jobs THEN NOW()
      ELSE completed_at
    END
  WHERE id = NEW.simulation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Update default values for new records
ALTER TABLE public.llm_simulations 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.llm_simulation_responses 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMIT;

-- Comments for documentation
COMMENT ON COLUMN public.llm_simulations.id IS 'UUID primary key for simulation batches';
COMMENT ON COLUMN public.llm_simulation_responses.id IS 'UUID primary key for individual responses';
COMMENT ON COLUMN public.llm_simulation_responses.simulation_id IS 'UUID foreign key referencing llm_simulations.id';
COMMENT ON COLUMN public.llm_simulation_responses.prompt_id IS 'UUID foreign key referencing user_prompts.id';