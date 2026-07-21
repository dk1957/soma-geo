-- Add execution status to user_prompts table
-- Migration: 20250919000000_add_prompt_execution_status.sql

-- Add status column to track prompt execution state
ALTER TABLE user_prompts 
ADD COLUMN execution_status VARCHAR(20) NOT NULL DEFAULT 'draft' 
CHECK (execution_status IN ('draft', 'running', 'completed', 'failed', 'stopped'));

-- Add execution metadata
ALTER TABLE user_prompts 
ADD COLUMN execution_metadata JSONB DEFAULT '{}';

-- Add index for status queries
CREATE INDEX idx_user_prompts_status ON user_prompts(account_id, execution_status);

-- Add comments for documentation
COMMENT ON COLUMN user_prompts.execution_status IS 'Tracks the execution state: draft, running, completed, failed, stopped';
COMMENT ON COLUMN user_prompts.execution_metadata IS 'Stores execution details like start_time, end_time, error_message, simulation_id, etc.';