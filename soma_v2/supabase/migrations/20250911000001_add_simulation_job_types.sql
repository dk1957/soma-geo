-- Add new job types for simulation functionality
-- This migration adds support for prompt_analysis and simulation_data_transfer job types

-- Drop the existing constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;

-- Add the new constraint with additional job types
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check 
  CHECK (job_type IN (
    'prompt_generation', 
    'routine_monitoring', 
    'brand_audit', 
    'prompt_analysis',
    'simulation_data_transfer',
    'other'
  ));

-- Add comment to document the new job types
COMMENT ON CONSTRAINT jobs_job_type_check ON jobs IS 
  'Allowed job types: prompt_generation (for ground truth prompts), routine_monitoring (scheduled checks), brand_audit (comprehensive analysis), prompt_analysis (LLM simulation runs), simulation_data_transfer (importing simulation results), other (catch-all)';