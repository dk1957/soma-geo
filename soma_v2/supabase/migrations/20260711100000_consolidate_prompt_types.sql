-- Migration: Consolidate prompt types
-- Merges all prompt_generation_* variants into single `prompt_generation` (sys+usr)
-- Renames consumer_simulation → query_run and adds user prompt
-- Removes all dead/unused prompt types

BEGIN;

-- ============================================================
-- 1. Rename consumer_simulation → query_run
-- ============================================================
UPDATE system_prompts
SET prompt_type = 'query_run',
    name = 'Query Run',
    description = 'System prompt that instructs LLMs how to respond as their consumer-facing versions during query simulation runs.'
WHERE prompt_type = 'consumer_simulation' AND role = 'system';

-- Add user prompt for query_run (did not exist before)
INSERT INTO system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'query_run',
  'user',
  'Query Run User Template',
  'User prompt template sent alongside each query to the LLM during simulation runs.',
  '{query}',
  '["query"]'::jsonb,
  true,
  1
)
ON CONFLICT (prompt_type, role) DO NOTHING;

-- ============================================================
-- 2. Consolidate prompt_generation_* → prompt_generation
-- ============================================================

-- Keep the best system prompt content: use prompt_generation_dashboard sys (it's the most refined)
-- First, delete any existing standalone prompt_generation sys row so we can insert fresh
DELETE FROM system_prompts WHERE prompt_type = 'prompt_generation' AND role = 'system';

INSERT INTO system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
SELECT
  'prompt_generation',
  'system',
  'Query Generation',
  'System prompt for generating realistic consumer search queries across all flows (onboarding, dashboard, full runs).',
  content,
  variables,
  true,
  1
FROM system_prompts
WHERE prompt_type = 'prompt_generation_dashboard' AND role = 'system'
LIMIT 1;

-- If prompt_generation_dashboard didn't exist, fall back to prompt_generation_onboarding
INSERT INTO system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
SELECT
  'prompt_generation',
  'system',
  'Query Generation',
  'System prompt for generating realistic consumer search queries across all flows (onboarding, dashboard, full runs).',
  content,
  variables,
  true,
  1
FROM system_prompts
WHERE prompt_type = 'prompt_generation_onboarding' AND role = 'system'
  AND NOT EXISTS (SELECT 1 FROM system_prompts WHERE prompt_type = 'prompt_generation' AND role = 'system')
LIMIT 1;

-- Keep the best user prompt content: use prompt_generation_dashboard usr
DELETE FROM system_prompts WHERE prompt_type = 'prompt_generation' AND role = 'user';

INSERT INTO system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
SELECT
  'prompt_generation',
  'user',
  'Query Generation User Template',
  'User prompt template with variable placeholders for brand context, filled at runtime for all generation flows.',
  content,
  variables,
  true,
  1
FROM system_prompts
WHERE prompt_type = 'prompt_generation_dashboard' AND role = 'user'
LIMIT 1;

-- If prompt_generation_dashboard user didn't exist, fall back to prompt_generation_onboarding
INSERT INTO system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
SELECT
  'prompt_generation',
  'user',
  'Query Generation User Template',
  'User prompt template with variable placeholders for brand context, filled at runtime for all generation flows.',
  content,
  variables,
  true,
  1
FROM system_prompts
WHERE prompt_type = 'prompt_generation_onboarding' AND role = 'user'
  AND NOT EXISTS (SELECT 1 FROM system_prompts WHERE prompt_type = 'prompt_generation' AND role = 'user')
LIMIT 1;

-- ============================================================
-- 3. Delete all old variant rows
-- ============================================================
DELETE FROM system_prompts WHERE prompt_type IN (
  'consumer_simulation',
  'prompt_generation_onboarding',
  'prompt_generation_dashboard',
  'prompt_generation_full',
  'prompt_generation_legacy'
);

-- ============================================================
-- 4. Delete all dead/unused prompt types
-- ============================================================
DELETE FROM system_prompts WHERE prompt_type IN (
  'response_analysis',
  'nlp_text_analysis',
  'brand_research',
  'content_generation',
  'content_optimization',
  'insights_analysis',
  'gsc_analysis'
);

-- ============================================================
-- 5. Update prompt_scoring names for consistency
-- ============================================================
UPDATE system_prompts
SET name = 'Query Scoring',
    description = 'System prompt for scoring generated queries on intent strength, naturalness, market relevance, and conversion potential.'
WHERE prompt_type = 'prompt_scoring' AND role = 'system';

UPDATE system_prompts
SET name = 'Query Scoring User Template',
    description = 'User prompt template listing queries to be scored.'
WHERE prompt_type = 'prompt_scoring' AND role = 'user';

-- ============================================================
-- 6. Update brand_intelligence names for consistency
-- ============================================================
UPDATE system_prompts
SET name = 'Brand Intelligence',
    description = 'System prompt for classifying brand industry, sector, business model, and competitive landscape.'
WHERE prompt_type = 'brand_intelligence' AND role = 'system';

UPDATE system_prompts
SET name = 'Brand Intelligence User Template',
    description = 'User prompt template for brand analysis with variable placeholders.'
WHERE prompt_type = 'brand_intelligence' AND role = 'user';

COMMIT;
