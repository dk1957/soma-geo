-- ============================================================================
-- AEO Analysis Agents Setup
-- ============================================================================
-- Activates and seeds agent_model_configs for the 4 analysis agents.
-- Adds agent_run_metrics table for tracking agent performance.
-- ============================================================================

-- ─── 1. Update/Insert analysis agent configs ─────────────────────────────

-- Brand Detection Agent (already exists, just activate + update)
UPDATE agent_model_configs
SET is_active = true,
    model_id = 'meta-llama/llama-3.3-70b-instruct',
    provider = 'openrouter',
    temperature = 0.10,
    max_tokens = 2000,
    updated_at = now()
WHERE agent_type = 'analysis_brand_detector';

-- Sentiment Agent (new)
INSERT INTO agent_model_configs (agent_type, model_id, provider, temperature, max_tokens, is_active)
VALUES ('analysis_sentiment', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.10, 1500, true)
ON CONFLICT (agent_type) DO UPDATE SET
  is_active = true,
  model_id = EXCLUDED.model_id,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  updated_at = now();

-- Citation Agent (new)
INSERT INTO agent_model_configs (agent_type, model_id, provider, temperature, max_tokens, is_active)
VALUES ('analysis_citation', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.10, 2000, true)
ON CONFLICT (agent_type) DO UPDATE SET
  is_active = true,
  model_id = EXCLUDED.model_id,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  updated_at = now();

-- Topic Agent (new)
INSERT INTO agent_model_configs (agent_type, model_id, provider, temperature, max_tokens, is_active)
VALUES ('analysis_topic', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.20, 1500, true)
ON CONFLICT (agent_type) DO UPDATE SET
  is_active = true,
  model_id = EXCLUDED.model_id,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  updated_at = now();

-- Deactivate old combined agents that are now replaced
UPDATE agent_model_configs
SET is_active = false, updated_at = now()
WHERE agent_type IN ('analysis_parser', 'analysis_scorer', 'analysis_reporter')
  AND is_active = true;


-- ─── 2. Agent Run Metrics table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_run_metrics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    text NOT NULL,
  model_id      text NOT NULL,
  response_id   uuid NOT NULL REFERENCES llm_response_files(id) ON DELETE CASCADE,
  duration_ms   integer NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  success       boolean NOT NULL DEFAULT true,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_agent_run_metrics_agent_type
  ON agent_run_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_run_metrics_created_at
  ON agent_run_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_run_metrics_response
  ON agent_run_metrics(response_id);

-- RLS: only service role can write, admin can read
ALTER TABLE agent_run_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to agent_run_metrics"
  ON agent_run_metrics
  USING (auth.role() = 'service_role');

CREATE POLICY "Public read access for agent_run_metrics"
  ON agent_run_metrics
  FOR SELECT
  USING (true);


-- ─── 3. Verify ──────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE 'Analysis agent configs activated: %',
    (SELECT count(*) FROM agent_model_configs WHERE agent_type LIKE 'analysis_%' AND is_active);
  RAISE NOTICE 'agent_run_metrics table created: %',
    (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_run_metrics'));
END
$$;
