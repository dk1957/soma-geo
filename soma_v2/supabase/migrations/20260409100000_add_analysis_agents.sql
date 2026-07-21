-- Add Analysis Agent sub-agents + ensure all runtime agents exist in agent_model_configs
-- The agent_model_configs table already has MACO agents from the initial seed.
-- This migration adds:
--   1. Analysis pipeline sub-agents (draft/inactive)
--   2. prompt_generation agent (if missing)

BEGIN;

-- Analysis Agent sub-agents (inactive by default — draft status)
INSERT INTO agent_model_configs (agent_type, model_id, provider, temperature, max_tokens, is_active)
VALUES
  ('analysis_parser', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.10, 2000, false),
  ('analysis_brand_detector', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.10, 2000, false),
  ('analysis_scorer', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.10, 2000, false),
  ('analysis_reporter', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.30, 3000, false)
ON CONFLICT (agent_type) DO NOTHING;

-- Ensure prompt_generation exists (used by runtime but may not have been seeded)
INSERT INTO agent_model_configs (agent_type, model_id, provider, temperature, max_tokens, is_active)
VALUES ('prompt_generation', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.70, 2000, true)
ON CONFLICT (agent_type) DO NOTHING;

COMMIT;
