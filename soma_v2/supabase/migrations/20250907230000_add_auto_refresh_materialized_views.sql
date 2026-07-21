-- Add automatic refresh triggers for analytics materialized views
-- Date: 2025-09-07
-- This ensures materialized views stay current with new analytics events

-- First, let's create a more efficient refresh function that only refreshes if needed
CREATE OR REPLACE FUNCTION refresh_analytics_views_if_needed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_refresh_time timestamptz;
    latest_event_time timestamptz;
    should_refresh boolean := false;
BEGIN
    -- Get the last time we refreshed views (stored in a tracking table)
    SELECT last_refreshed INTO last_refresh_time 
    FROM analytics_refresh_log 
    ORDER BY last_refreshed DESC 
    LIMIT 1;
    
    -- Get the latest analytics event time
    SELECT MAX(created_at) INTO latest_event_time 
    FROM analytics_events;
    
    -- If no refresh log or new events since last refresh, we should refresh
    IF last_refresh_time IS NULL OR latest_event_time > last_refresh_time THEN
        should_refresh := true;
    END IF;
    
    -- Only refresh if needed
    IF should_refresh THEN
        RAISE NOTICE 'Refreshing analytics materialized views...';
        
        -- Refresh views (use regular refresh if concurrent fails)
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_hourly;
            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily;
            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_weekly;
        EXCEPTION
            WHEN OTHERS THEN
                -- Fallback to regular refresh
                REFRESH MATERIALIZED VIEW analytics_hourly;
                REFRESH MATERIALIZED VIEW analytics_daily;
                REFRESH MATERIALIZED VIEW analytics_weekly;
        END;
        
        -- Log the refresh
        INSERT INTO analytics_refresh_log (last_refreshed, events_processed)
        VALUES (now(), (SELECT COUNT(*) FROM analytics_events));
        
        RAISE NOTICE 'Analytics views refreshed successfully';
    ELSE
        RAISE NOTICE 'Analytics views are up to date, skipping refresh';
    END IF;
END;
$$;

-- Create a log table to track when we last refreshed
CREATE TABLE IF NOT EXISTS analytics_refresh_log (
    id SERIAL PRIMARY KEY,
    last_refreshed timestamptz NOT NULL DEFAULT now(),
    events_processed integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create a trigger function that schedules a refresh after analytics events
CREATE OR REPLACE FUNCTION trigger_analytics_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only refresh if it's been more than 5 minutes since last refresh
    -- This prevents too frequent refreshes on high-volume systems
    IF NOT EXISTS (
        SELECT 1 FROM analytics_refresh_log 
        WHERE last_refreshed > now() - INTERVAL '5 minutes'
    ) THEN
        -- Schedule an async refresh (won't block the insert)
        PERFORM pg_notify('analytics_refresh_needed', NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add the trigger to analytics_events
CREATE TRIGGER analytics_events_refresh_trigger
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_analytics_refresh();

-- Create a function to manually refresh views (for API calls)
CREATE OR REPLACE FUNCTION refresh_analytics_views_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time timestamptz;
    end_time timestamptz;
    events_count integer;
    result jsonb;
BEGIN
    start_time := now();
    
    -- Get current event count
    SELECT COUNT(*) INTO events_count FROM analytics_events;
    
    -- Refresh all materialized views
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_hourly;
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily;
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_weekly;
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback to regular refresh
            REFRESH MATERIALIZED VIEW analytics_hourly;
            REFRESH MATERIALIZED VIEW analytics_daily;
            REFRESH MATERIALIZED VIEW analytics_weekly;
    END;
    
    end_time := now();
    
    -- Log the refresh
    INSERT INTO analytics_refresh_log (last_refreshed, events_processed)
    VALUES (end_time, events_count);
    
    -- Return success info
    result := jsonb_build_object(
        'success', true,
        'refreshed_at', end_time,
        'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time)),
        'events_processed', events_count,
        'views_refreshed', ARRAY['analytics_hourly', 'analytics_daily', 'analytics_weekly']
    );
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_analytics_views_if_needed TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views_now TO authenticated;
GRANT SELECT, INSERT ON analytics_refresh_log TO authenticated;

-- Create an API endpoint helper function
CREATE OR REPLACE FUNCTION get_analytics_refresh_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_refresh timestamptz;
    total_events integer;
    hourly_rows integer;
    daily_rows integer;
    weekly_rows integer;
    result jsonb;
BEGIN
    -- Get refresh status
    SELECT MAX(last_refreshed) INTO last_refresh FROM analytics_refresh_log;
    SELECT COUNT(*) INTO total_events FROM analytics_events;
    SELECT COUNT(*) INTO hourly_rows FROM analytics_hourly;
    SELECT COUNT(*) INTO daily_rows FROM analytics_daily;
    SELECT COUNT(*) INTO weekly_rows FROM analytics_weekly;
    
    result := jsonb_build_object(
        'last_refresh', last_refresh,
        'total_events', total_events,
        'materialized_views', jsonb_build_object(
            'analytics_hourly', hourly_rows,
            'analytics_daily', daily_rows,
            'analytics_weekly', weekly_rows
        ),
        'needs_refresh', CASE 
            WHEN last_refresh IS NULL THEN true
            WHEN EXISTS (SELECT 1 FROM analytics_events WHERE created_at > last_refresh) THEN true
            ELSE false
        END
    );
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_analytics_refresh_status TO authenticated;

-- Test the new refresh system
SELECT refresh_analytics_views_now();

-- Show the current status
SELECT get_analytics_refresh_status();

-- Add helpful comments
COMMENT ON FUNCTION refresh_analytics_views_if_needed IS 'Refreshes analytics materialized views only if new events have been added since last refresh';
COMMENT ON FUNCTION refresh_analytics_views_now IS 'Immediately refreshes all analytics materialized views and returns status';
COMMENT ON FUNCTION get_analytics_refresh_status IS 'Returns current status of analytics materialized views and refresh needs';
COMMENT ON TABLE analytics_refresh_log IS 'Tracks when analytics materialized views were last refreshed';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Analytics auto-refresh system installed successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '1. Trigger on analytics_events that schedules refreshes';
    RAISE NOTICE '2. Smart refresh function that only refreshes when needed';
    RAISE NOTICE '3. Manual refresh function for API calls';
    RAISE NOTICE '4. Status checking function for monitoring';
    RAISE NOTICE '5. Refresh rate limiting (5 minute minimum interval)';
END $$;