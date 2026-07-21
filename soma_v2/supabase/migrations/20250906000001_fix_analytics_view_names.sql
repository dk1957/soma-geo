-- Fix analytics materialized view names to match API expectations
-- This migration aligns the table names with what the API endpoints expect

-- Drop existing materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS public.hourly_brand_analytics;
DROP MATERIALIZED VIEW IF EXISTS public.daily_brand_analytics;

-- Create analytics_hourly materialized view (matches API expectation)
CREATE MATERIALIZED VIEW public.analytics_hourly AS
SELECT 
  brand_id,
  account_id,
  date_trunc('hour', created_at) AS hour,
  
  -- Real-time metrics
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE event_type = 'audit_start') AS audits_started,
  COUNT(*) FILTER (WHERE event_type = 'audit_complete') AS audits_completed,
  COUNT(*) FILTER (WHERE event_type = 'prompt_test') AS prompts_tested,
  COUNT(*) FILTER (WHERE event_type = 'report_generate') AS reports_generated,
  
  -- Performance metrics
  AVG(value) FILTER (WHERE properties->>'metric_type' = 'duration' AND value IS NOT NULL) AS avg_duration_seconds,
  AVG(value) FILTER (WHERE properties->>'metric_type' = 'ldi_score' AND value IS NOT NULL) AS avg_ldi_score,
  
  now() AS computed_at

FROM public.analytics_events
WHERE created_at >= now() - INTERVAL '7 days' -- Keep only recent data for performance
GROUP BY brand_id, account_id, date_trunc('hour', created_at);

-- Create analytics_daily materialized view (matches API expectation)
CREATE MATERIALIZED VIEW public.analytics_daily AS
SELECT 
  brand_id,
  account_id,
  date_trunc('day', created_at)::date AS day,
  
  -- Event counts by category
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE event_category = 'onboarding') AS onboarding_events,
  COUNT(*) FILTER (WHERE event_category = 'audit') AS audit_events,
  COUNT(*) FILTER (WHERE event_category = 'report') AS report_events,
  COUNT(*) FILTER (WHERE event_category = 'prompt') AS prompt_events,
  COUNT(*) FILTER (WHERE event_category = 'dashboard') AS dashboard_events,
  
  -- Unique users
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT user_id) FILTER (WHERE event_category = 'onboarding') AS onboarding_users,
  COUNT(DISTINCT user_id) FILTER (WHERE event_category = 'audit') AS audit_users,
  
  -- Completion events
  COUNT(*) FILTER (WHERE event_type = 'onboarding_complete') AS onboarding_completions,
  COUNT(*) FILTER (WHERE event_type = 'audit_complete') AS audit_completions,
  COUNT(*) FILTER (WHERE event_type = 'report_generate') AS report_generations,
  
  -- Average values (durations, scores, etc.)
  AVG(value) FILTER (WHERE event_type = 'audit_complete' AND value IS NOT NULL) AS avg_audit_duration,
  AVG(value) FILTER (WHERE event_type = 'onboarding_complete' AND value IS NOT NULL) AS avg_onboarding_duration,
  
  -- Timestamps for tracking
  MIN(created_at) AS first_event_at,
  MAX(created_at) AS last_event_at,
  now() AS computed_at

FROM public.analytics_events
GROUP BY brand_id, account_id, date_trunc('day', created_at)::date;

-- Create analytics_weekly materialized view for longer-term trends
CREATE MATERIALIZED VIEW public.analytics_weekly AS
SELECT 
  brand_id,
  account_id,
  date_trunc('week', created_at) AS week,
  
  -- Weekly aggregations
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE event_type = 'audit_complete') AS audits_completed,
  COUNT(*) FILTER (WHERE event_type = 'onboarding_complete') AS onboarding_completions,
  COUNT(*) FILTER (WHERE event_type = 'report_generate') AS reports_generated,
  
  -- Weekly averages
  AVG(value) FILTER (WHERE event_type = 'audit_complete' AND value IS NOT NULL) AS avg_audit_duration,
  AVG(value) FILTER (WHERE properties->>'ldi_score' IS NOT NULL) AS avg_ldi_score,
  
  now() AS computed_at

FROM public.analytics_events
WHERE created_at >= now() - INTERVAL '12 weeks' -- Keep 3 months of weekly data
GROUP BY brand_id, account_id, date_trunc('week', created_at);

-- Create indexes for fast queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_hourly_brand_hour ON public.analytics_hourly(brand_id, hour);
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_account_hour ON public.analytics_hourly(account_id, hour);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_brand_day ON public.analytics_daily(brand_id, day);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_account_day ON public.analytics_daily(account_id, day);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_weekly_brand_week ON public.analytics_weekly(brand_id, week);
CREATE INDEX IF NOT EXISTS idx_analytics_weekly_account_week ON public.analytics_weekly(account_id, week);

-- Update the refresh function to use the correct view names
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh in order of dependency
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_weekly;
  
  -- If concurrent refresh fails, try regular refresh
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      REFRESH MATERIALIZED VIEW public.analytics_daily;
      REFRESH MATERIALIZED VIEW public.analytics_hourly;
      REFRESH MATERIALIZED VIEW public.analytics_weekly;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail
        RAISE NOTICE 'Failed to refresh analytics views: %', SQLERRM;
    END;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.analytics_hourly TO authenticated;
GRANT SELECT ON public.analytics_daily TO authenticated;
GRANT SELECT ON public.analytics_weekly TO authenticated;

-- Add helpful comments
COMMENT ON MATERIALIZED VIEW public.analytics_hourly IS 'Hourly aggregated analytics data for real-time dashboards';
COMMENT ON MATERIALIZED VIEW public.analytics_daily IS 'Daily aggregated analytics data for historical analysis';
COMMENT ON MATERIALIZED VIEW public.analytics_weekly IS 'Weekly aggregated analytics data for trend analysis';

-- Initial refresh of views
SELECT refresh_analytics_views();