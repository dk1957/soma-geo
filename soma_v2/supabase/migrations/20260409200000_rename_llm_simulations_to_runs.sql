-- Rename llm_simulations → runs
-- This table is a daily batch trigger. Each run produces responses (one per prompt × model combination).

BEGIN;

-- Drop FK from llm_response_files
ALTER TABLE llm_response_files DROP CONSTRAINT llm_response_files_simulation_id_fkey;

-- Drop old indexes
DROP INDEX IF EXISTS idx_llm_simulations_account_brand;
DROP INDEX IF EXISTS idx_llm_simulations_created_at;
DROP INDEX IF EXISTS idx_llm_simulations_status;

-- Drop old RLS policy
DROP POLICY IF EXISTS "Users can access LLM simulations for their accounts" ON llm_simulations;

-- Rename table
ALTER TABLE llm_simulations RENAME TO runs;

-- Rename constraints
ALTER TABLE runs RENAME CONSTRAINT llm_simulations_pkey TO runs_pkey;
ALTER TABLE runs RENAME CONSTRAINT llm_simulations_account_id_fkey TO runs_account_id_fkey;
ALTER TABLE runs RENAME CONSTRAINT llm_simulations_brand_id_fkey TO runs_brand_id_fkey;
ALTER TABLE runs RENAME CONSTRAINT llm_simulations_profile_id_fkey TO runs_profile_id_fkey;

-- Recreate indexes
CREATE INDEX idx_runs_account_brand ON runs(account_id, brand_id);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX idx_runs_status ON runs(status);

-- Recreate FK from llm_response_files
ALTER TABLE llm_response_files
  ADD CONSTRAINT llm_response_files_simulation_id_fkey
  FOREIGN KEY (simulation_id) REFERENCES runs(id) ON DELETE CASCADE;

-- Recreate RLS policy
CREATE POLICY "Users can access runs for their accounts" ON runs
  FOR ALL USING (
    account_id IN (
      SELECT account_users.account_id
      FROM account_users
      WHERE account_users.user_id = auth.uid() AND account_users.is_active = true
    )
  );

COMMENT ON TABLE runs IS 'Daily batch runs: each run triggers prompts × models and produces responses';

COMMIT;
