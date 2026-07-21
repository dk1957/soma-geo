-- ============================================================================
-- Setup Cron Jobs for Materialized Views Refresh
-- ============================================================================
-- Date: 2025-11-09
-- Purpose: Configure pg_cron to automatically refresh materialized views
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- CRON JOB: Refresh Materialized Views Hourly
-- ============================================================================
-- Runs every hour at minute 5 to refresh all report materialized views
-- ============================================================================

SELECT cron.schedule(
  'refresh-report-views-hourly',
  '5 * * * *', -- Every hour at minute 5
  $$SELECT refresh_all_report_views();$$
);

-- ============================================================================
-- CRON JOB: Refresh Daily Metrics at Midnight
-- ============================================================================
-- Runs daily at 00:10 to ensure daily metrics are calculated
-- ============================================================================

SELECT cron.schedule(
  'refresh-daily-metrics',
  '10 0 * * *', -- Every day at 00:10
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_brand_metrics;$$
);

-- ============================================================================
-- CRON JOB: Refresh Performance Summary Every 6 Hours
-- ============================================================================
-- Runs every 6 hours to update rolling period metrics
-- ============================================================================

SELECT cron.schedule(
  'refresh-performance-summary',
  '0 */6 * * *', -- Every 6 hours
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY brand_performance_summary;$$
);

-- ============================================================================
-- View Active Cron Jobs
-- ============================================================================
-- Query to see all scheduled jobs
-- ============================================================================

COMMENT ON EXTENSION pg_cron IS 'Cron jobs configured for materialized view refreshes';

-- To view all cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
