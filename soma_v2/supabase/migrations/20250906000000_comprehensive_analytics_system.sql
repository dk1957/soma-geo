-- =====================================================
-- COMPREHENSIVE ANALYTICS SYSTEM
-- Fast Analytics for Audit & Report Generation Tracking
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE EVENTS TABLE (Append-Only Time Series)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type text NOT NULL, -- onboarding_step, audit_start, audit_complete, prompt_test, etc.
  event_category text NOT NULL, -- onboarding, audit, report, prompt, navigation
  event_action text NOT NULL, -- start, complete, test, view, generate
  
  -- Metrics
  value numeric DEFAULT NULL, -- duration, score, count, etc.
  properties jsonb DEFAULT '{}', -- flexible metadata
  
  -- Context
  session_id text,
  user_agent text,
  ip_address inet,
  referrer text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Performance optimization
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'onboarding_step', 'onboarding_complete', 
    'audit_start', 'audit_progress', 'audit_complete',
    'prompt_create', 'prompt_test', 'prompt_edit',
    'report_generate', 'report_view', 'report_export',
    'dashboard_view', 'navigation_event',
    'user_action', 'system_event'
  )),
  CONSTRAINT valid_event_category CHECK (event_category IN (
    'onboarding', 'audit', 'report', 'prompt', 'dashboard', 'navigation', 'system'
  ))
);

-- Optimized indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_brand_time ON public.analytics_events(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_time ON public.analytics_events(event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_account_time ON public.analytics_events(account_id, created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_brand_type_time ON public.analytics_events(brand_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_category_time ON public.analytics_events(user_id, event_category, created_at DESC);

-- =====================================================
-- 2. PRE-AGGREGATED ANALYTICS VIEWS
-- =====================================================

-- Daily brand metrics (materialized view for fast dashboard queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_brand_analytics AS
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

-- Index for fast queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_brand_analytics_brand_day ON public.daily_brand_analytics(brand_id, day);
CREATE INDEX IF NOT EXISTS idx_daily_brand_analytics_account_day ON public.daily_brand_analytics(account_id, day);

-- Hourly analytics for real-time dashboards
CREATE MATERIALIZED VIEW IF NOT EXISTS public.hourly_brand_analytics AS
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

-- Index for fast queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_brand_analytics_brand_hour ON public.hourly_brand_analytics(brand_id, hour);

-- User journey analytics (tracks conversion funnel)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_journey_analytics AS
SELECT 
  user_id,
  account_id,
  brand_id,
  date_trunc('day', created_at)::date AS day,
  
  -- Journey stages
  MIN(created_at) FILTER (WHERE event_type = 'onboarding_step') AS onboarding_started_at,
  MAX(created_at) FILTER (WHERE event_type = 'onboarding_complete') AS onboarding_completed_at,
  MIN(created_at) FILTER (WHERE event_type = 'audit_start') AS first_audit_at,
  MAX(created_at) FILTER (WHERE event_type = 'audit_complete') AS last_audit_at,
  COUNT(*) FILTER (WHERE event_type = 'audit_complete') AS total_audits_completed,
  COUNT(*) FILTER (WHERE event_type = 'report_generate') AS total_reports_generated,
  
  -- Time to completion metrics
  EXTRACT(EPOCH FROM (
    MAX(created_at) FILTER (WHERE event_type = 'onboarding_complete') - 
    MIN(created_at) FILTER (WHERE event_type = 'onboarding_step')
  )) / 60 AS onboarding_duration_minutes,
  
  -- Engagement metrics
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_type) AS unique_event_types,
  
  now() AS computed_at

FROM public.analytics_events
WHERE created_at >= now() - INTERVAL '30 days' -- Keep recent journey data
GROUP BY user_id, account_id, brand_id, date_trunc('day', created_at)::date;

-- Index for user journey queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_journey_analytics_user_day ON public.user_journey_analytics(user_id, day);
CREATE INDEX IF NOT EXISTS idx_user_journey_analytics_brand_day ON public.user_journey_analytics(brand_id, day);

-- =====================================================
-- 3. AUDIT PERFORMANCE ANALYTICS
-- =====================================================

-- Audit performance metrics (for AI optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.audit_performance_analytics AS
SELECT 
  brand_id,
  account_id,
  date_trunc('day', created_at)::date AS day,
  
  -- Audit metrics
  COUNT(*) FILTER (WHERE event_type = 'audit_start') AS audits_started,
  COUNT(*) FILTER (WHERE event_type = 'audit_complete') AS audits_completed,
  
  -- Success rate
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'audit_start') > 0 
    THEN (COUNT(*) FILTER (WHERE event_type = 'audit_complete')::float / 
          COUNT(*) FILTER (WHERE event_type = 'audit_start')::float) * 100
    ELSE 0
  END AS completion_rate_percent,
  
  -- Performance metrics from properties
  AVG((properties->>'ldi_score')::numeric) FILTER (WHERE event_type = 'audit_complete' AND properties->>'ldi_score' IS NOT NULL) AS avg_ldi_score,
  AVG((properties->>'visibility_score')::numeric) FILTER (WHERE event_type = 'audit_complete' AND properties->>'visibility_score' IS NOT NULL) AS avg_visibility_score,
  AVG((properties->>'duration_seconds')::numeric) FILTER (WHERE event_type = 'audit_complete' AND properties->>'duration_seconds' IS NOT NULL) AS avg_audit_duration_seconds,
  
  -- Error tracking
  COUNT(*) FILTER (WHERE event_type = 'audit_start' AND properties->>'error' IS NOT NULL) AS audit_errors,
  
  now() AS computed_at

FROM public.analytics_events
WHERE event_category = 'audit'
GROUP BY brand_id, account_id, date_trunc('day', created_at)::date;

-- Index for audit performance queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_performance_analytics_brand_day ON public.audit_performance_analytics(brand_id, day);

-- =====================================================
-- 4. REFRESH FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh in order of dependency
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_brand_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.hourly_brand_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_journey_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.audit_performance_analytics;
  
  -- Log the refresh
  INSERT INTO public.analytics_events (
    event_type, event_category, event_action,
    properties, user_id, brand_id, account_id
  ) VALUES (
    'system_event', 'system', 'analytics_refresh',
    '{"refresh_type": "scheduled", "views_refreshed": 4}',
    NULL, NULL, NULL
  );
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics events policies
CREATE POLICY "Users can view analytics for their accounts" ON public.analytics_events
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Grant access to materialized views (RLS doesn't apply to views)
-- Access control will be handled at API level

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to track events easily from application code
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_brand_id uuid,
  p_user_id uuid,
  p_account_id uuid,
  p_event_type text,
  p_event_category text,
  p_event_action text,
  p_value numeric DEFAULT NULL,
  p_properties jsonb DEFAULT '{}',
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.analytics_events (
    brand_id, user_id, account_id,
    event_type, event_category, event_action,
    value, properties, session_id
  ) VALUES (
    p_brand_id, p_user_id, p_account_id,
    p_event_type, p_event_category, p_event_action,
    p_value, p_properties, p_session_id
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to get brand analytics summary
CREATE OR REPLACE FUNCTION get_brand_analytics_summary(
  p_brand_id uuid,
  p_days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COALESCE(SUM(total_events), 0),
    'unique_users', COALESCE(SUM(unique_users), 0),
    'onboarding_completions', COALESCE(SUM(onboarding_completions), 0),
    'audit_completions', COALESCE(SUM(audit_completions), 0),
    'report_generations', COALESCE(SUM(report_generations), 0),
    'avg_audit_duration', COALESCE(AVG(avg_audit_duration), 0),
    'period_start', MIN(day),
    'period_end', MAX(day)
  ) INTO result
  FROM public.daily_brand_analytics
  WHERE brand_id = p_brand_id 
    AND day >= CURRENT_DATE - INTERVAL '1 day' * p_days_back;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- =====================================================
-- 7. INITIAL DATA AND COMMENTS
-- =====================================================

-- Add helpful comments
COMMENT ON TABLE public.analytics_events IS 'Append-only time series table for tracking all user interactions and system events';
COMMENT ON MATERIALIZED VIEW public.daily_brand_analytics IS 'Pre-aggregated daily metrics for fast dashboard queries';
COMMENT ON MATERIALIZED VIEW public.hourly_brand_analytics IS 'Real-time hourly metrics for live dashboards';
COMMENT ON MATERIALIZED VIEW public.user_journey_analytics IS 'User conversion funnel and journey tracking';
COMMENT ON FUNCTION track_analytics_event IS 'Helper function to easily track events from application code';
COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all materialized views for updated analytics data';

-- Create initial system event
INSERT INTO public.analytics_events (
  event_type, event_category, event_action,
  properties, user_id, brand_id, account_id
) VALUES (
  'system_event', 'system', 'analytics_system_initialized',
  '{"version": "1.0", "created_tables": ["analytics_events"], "created_views": 4}',
  NULL, NULL, NULL
);