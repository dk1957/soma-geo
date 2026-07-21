-- Migration: Rename all remaining "simulation" references to "run"
-- Context: Follows the llm_simulations → runs table rename.
--          This migration renames columns, constraints, indexes,
--          and drops stale functions that still used the old naming.

BEGIN;

-- ============================================================
-- 1. Drop unused DB functions (confirmed zero code references)
-- ============================================================
DROP FUNCTION IF EXISTS get_simulation_progress(text);
DROP FUNCTION IF EXISTS insert_llm_simulation(text, text, integer, integer, integer);
DROP FUNCTION IF EXISTS insert_llm_simulation(text, text, text, integer, integer, integer);
DROP FUNCTION IF EXISTS update_simulation_stats();

-- ============================================================
-- 2. Rename leftover constraint on "runs" table
-- ============================================================
ALTER TABLE runs
  RENAME CONSTRAINT llm_simulations_status_check TO runs_status_check;

-- ============================================================
-- 3. brand_appearances: simulation_id → run_id
-- ============================================================
ALTER TABLE brand_appearances
  RENAME COLUMN simulation_id TO run_id;

DROP INDEX IF EXISTS idx_appearances_simulation;
CREATE INDEX idx_appearances_run ON brand_appearances (run_id);

-- ============================================================
-- 4. llm_response_files: simulation_id → run_id
-- ============================================================
-- Drop old FK, unique constraint, and index
ALTER TABLE llm_response_files
  DROP CONSTRAINT IF EXISTS llm_response_files_simulation_id_fkey;

ALTER TABLE llm_response_files
  DROP CONSTRAINT IF EXISTS llm_response_files_simulation_id_prompt_id_model_name_key;

DROP INDEX IF EXISTS idx_lrf_simulation_id;

-- Rename column
ALTER TABLE llm_response_files
  RENAME COLUMN simulation_id TO run_id;

-- Recreate FK, unique constraint, and index with new names
ALTER TABLE llm_response_files
  ADD CONSTRAINT llm_response_files_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE;

ALTER TABLE llm_response_files
  ADD CONSTRAINT llm_response_files_run_id_prompt_id_model_name_key
    UNIQUE (run_id, prompt_id, model_name);

CREATE INDEX idx_lrf_run_id ON llm_response_files (run_id);

-- ============================================================
-- 5. cron_logs: brands_needed_simulation → brands_needed_run
-- ============================================================
ALTER TABLE cron_logs
  RENAME COLUMN brands_needed_simulation TO brands_needed_run;

-- ============================================================
-- 6. subscription_plans: monthly_simulation_limit → monthly_run_limit
-- ============================================================
ALTER TABLE subscription_plans
  RENAME COLUMN monthly_simulation_limit TO monthly_run_limit;

COMMIT;
