-- Rename simulation_config → run_config
-- Global configuration for batch runs (concurrency, timeout, temperature, etc.)

BEGIN;

DROP INDEX IF EXISTS idx_simulation_config_active;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON simulation_config;

ALTER TABLE simulation_config RENAME TO run_config;

ALTER TABLE run_config RENAME CONSTRAINT simulation_config_pkey TO run_config_pkey;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_concurrency_limit_check TO run_config_concurrency_limit_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_default_period_days_check TO run_config_default_period_days_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_max_tokens_check TO run_config_max_tokens_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_rate_limit_rpm_check TO run_config_rate_limit_rpm_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_retry_attempts_check TO run_config_retry_attempts_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_retry_delay_ms_check TO run_config_retry_delay_ms_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_temperature_check TO run_config_temperature_check;
ALTER TABLE run_config RENAME CONSTRAINT simulation_config_timeout_ms_check TO run_config_timeout_ms_check;

CREATE UNIQUE INDEX idx_run_config_active ON run_config(is_active) WHERE is_active = true;

CREATE POLICY "Allow read access for authenticated users" ON run_config
  FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE run_config IS 'Global configuration for batch runs (concurrency, timeout, temperature, tokens, retries)';

COMMIT;
