-- Fix Analytics Events Missing Brand and Account Context
-- Date: 2025-09-07
-- Issue: Most analytics events are missing brand_id and account_id, causing materialized views to aggregate incorrectly

-- First, let's understand the current data state
DO $$
DECLARE
    total_events INT;
    events_with_brand INT;
    events_with_account INT;
    events_with_user INT;
BEGIN
    SELECT COUNT(*) INTO total_events FROM analytics_events;
    SELECT COUNT(*) INTO events_with_brand FROM analytics_events WHERE brand_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_account FROM analytics_events WHERE account_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_user FROM analytics_events WHERE user_id IS NOT NULL;
    
    RAISE NOTICE 'Analytics Events Status:';
    RAISE NOTICE '- Total events: %', total_events;
    RAISE NOTICE '- With brand_id: % (%.1f%%)', events_with_brand, (events_with_brand::FLOAT / total_events * 100);
    RAISE NOTICE '- With account_id: % (%.1f%%)', events_with_account, (events_with_account::FLOAT / total_events * 100);
    RAISE NOTICE '- With user_id: % (%.1f%%)', events_with_user, (events_with_user::FLOAT / total_events * 100);
END $$;

-- Step 1: Create a function to backfill missing brand_id and account_id
-- This function will try to derive brand and account context from user relationships
CREATE OR REPLACE FUNCTION backfill_analytics_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INT := 0;
    events_cursor CURSOR FOR 
        SELECT ae.id, ae.user_id, ae.created_at
        FROM analytics_events ae
        WHERE ae.user_id IS NOT NULL 
        AND (ae.brand_id IS NULL OR ae.account_id IS NULL);
    
    event_record RECORD;
    derived_brand_id UUID;
    derived_account_id UUID;
BEGIN
    RAISE NOTICE 'Starting backfill of analytics events missing brand/account context...';
    
    -- Loop through events that need context
    FOR event_record IN events_cursor LOOP
        -- Try to derive brand_id and account_id from user's account relationships
        -- Use the most recent brand the user was associated with at the time of the event
        SELECT 
            au.account_id,
            COALESCE(
                -- Try to get brand from user's current brand context
                (SELECT brand_id FROM user_brand_contexts ubc 
                 WHERE ubc.user_id = event_record.user_id 
                 AND ubc.created_at <= event_record.created_at 
                 ORDER BY ubc.created_at DESC LIMIT 1),
                -- Fallback to the first brand in the user's primary account
                (SELECT b.id FROM brands b 
                 JOIN account_users au2 ON au2.account_id = b.account_id 
                 WHERE au2.user_id = event_record.user_id 
                 AND au2.is_active = true 
                 ORDER BY b.created_at ASC LIMIT 1)
            ) as brand_id
        INTO derived_account_id, derived_brand_id
        FROM account_users au
        WHERE au.user_id = event_record.user_id 
        AND au.is_active = true
        ORDER BY au.created_at ASC
        LIMIT 1;
        
        -- Update the event if we found context
        IF derived_account_id IS NOT NULL THEN
            UPDATE analytics_events 
            SET 
                account_id = COALESCE(account_id, derived_account_id),
                brand_id = COALESCE(brand_id, derived_brand_id)
            WHERE id = event_record.id;
            
            updated_count := updated_count + 1;
            
            -- Log progress every 100 updates
            IF updated_count % 100 = 0 THEN
                RAISE NOTICE 'Updated % events...', updated_count;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Backfill completed. Updated % events with missing context.', updated_count;
END;
$$;

-- Step 2: Create a more targeted backfill for recent events
-- Focus on dashboard and navigation events that are most likely to have brand context
CREATE OR REPLACE FUNCTION backfill_dashboard_navigation_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INT := 0;
BEGIN
    RAISE NOTICE 'Backfilling dashboard and navigation events with brand context...';
    
    -- Update dashboard_view events that are missing brand context
    -- These should inherit the brand context from the user's current session
    WITH user_primary_brand AS (
        SELECT DISTINCT ON (au.user_id) 
            au.user_id,
            au.account_id,
            b.id as brand_id
        FROM account_users au
        JOIN brands b ON b.account_id = au.account_id
        WHERE au.is_active = true
        ORDER BY au.user_id, b.created_at ASC
    )
    UPDATE analytics_events ae
    SET 
        account_id = upb.account_id,
        brand_id = upb.brand_id
    FROM user_primary_brand upb
    WHERE ae.user_id = upb.user_id
    AND ae.event_type IN ('dashboard_view', 'navigation_event')
    AND (ae.account_id IS NULL OR ae.brand_id IS NULL)
    AND ae.created_at >= NOW() - INTERVAL '7 days'; -- Only recent events
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % dashboard/navigation events with brand context', updated_count;
END;
$$;

-- Step 3: Run the backfill operations
SELECT backfill_dashboard_navigation_context();
SELECT backfill_analytics_context();

-- Step 4: Analyze the results
DO $$
DECLARE
    total_events INT;
    events_with_brand INT;
    events_with_account INT;
    improvement_brand FLOAT;
    improvement_account FLOAT;
BEGIN
    SELECT COUNT(*) INTO total_events FROM analytics_events;
    SELECT COUNT(*) INTO events_with_brand FROM analytics_events WHERE brand_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_account FROM analytics_events WHERE account_id IS NOT NULL;
    
    improvement_brand := (events_with_brand::FLOAT / total_events * 100);
    improvement_account := (events_with_account::FLOAT / total_events * 100);
    
    RAISE NOTICE 'Post-Backfill Analytics Events Status:';
    RAISE NOTICE '- Total events: %', total_events;
    RAISE NOTICE '- With brand_id: % (%.1f%%)', events_with_brand, improvement_brand;
    RAISE NOTICE '- With account_id: % (%.1f%%)', events_with_account, improvement_account;
END $$;

-- Step 5: Refresh materialized views with the corrected data
SELECT refresh_analytics_views();

-- Step 6: Create improved analytics tracking function for future events
-- This ensures new events always have proper brand/account context
CREATE OR REPLACE FUNCTION track_analytics_event_with_context(
    p_event_type text,
    p_event_category text,
    p_event_action text,
    p_user_id uuid DEFAULT auth.uid(),
    p_brand_id uuid DEFAULT NULL,
    p_account_id uuid DEFAULT NULL,
    p_value numeric DEFAULT NULL,
    p_properties jsonb DEFAULT '{}',
    p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id uuid;
    v_derived_brand_id uuid;
    v_derived_account_id uuid;
BEGIN
    -- If brand_id or account_id not provided, try to derive from user context
    IF p_brand_id IS NULL OR p_account_id IS NULL THEN
        -- Get user's current brand and account context
        SELECT 
            COALESCE(p_account_id, au.account_id),
            COALESCE(p_brand_id, 
                -- Try to get from user's current brand context
                (SELECT brand_id FROM user_brand_contexts ubc 
                 WHERE ubc.user_id = p_user_id 
                 ORDER BY ubc.created_at DESC LIMIT 1),
                -- Fallback to first brand in user's account
                (SELECT b.id FROM brands b 
                 WHERE b.account_id = au.account_id 
                 ORDER BY b.created_at ASC LIMIT 1)
            )
        INTO v_derived_account_id, v_derived_brand_id
        FROM account_users au
        WHERE au.user_id = p_user_id 
        AND au.is_active = true
        ORDER BY au.created_at ASC
        LIMIT 1;
    ELSE
        v_derived_account_id := p_account_id;
        v_derived_brand_id := p_brand_id;
    END IF;
    
    -- Insert the analytics event with proper context
    INSERT INTO analytics_events (
        event_type,
        event_category,
        event_action,
        user_id,
        brand_id,
        account_id,
        value,
        properties,
        session_id
    ) VALUES (
        p_event_type,
        p_event_category,
        p_event_action,
        p_user_id,
        v_derived_brand_id,
        v_derived_account_id,
        p_value,
        p_properties,
        p_session_id
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_analytics_event_with_context TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_analytics_context TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_dashboard_navigation_context TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION track_analytics_event_with_context IS 'Enhanced analytics tracking that ensures proper brand and account context';
COMMENT ON FUNCTION backfill_analytics_context IS 'Backfills missing brand_id and account_id for existing analytics events';

-- Final verification
DO $$
DECLARE
    hourly_count INT;
    daily_count INT;
    weekly_count INT;
BEGIN
    SELECT COUNT(*) INTO hourly_count FROM analytics_hourly WHERE brand_id IS NOT NULL;
    SELECT COUNT(*) INTO daily_count FROM analytics_daily WHERE brand_id IS NOT NULL;
    SELECT COUNT(*) INTO weekly_count FROM analytics_weekly WHERE brand_id IS NOT NULL;
    
    RAISE NOTICE 'Materialized Views with Brand Context:';
    RAISE NOTICE '- analytics_hourly: % rows with brand_id', hourly_count;
    RAISE NOTICE '- analytics_daily: % rows with brand_id', daily_count;
    RAISE NOTICE '- analytics_weekly: % rows with brand_id', weekly_count;
END $$;

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Fixed analytics events missing brand and account context';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update frontend analytics tracking to use track_analytics_event_with_context()';
    RAISE NOTICE '2. Ensure brand context is passed in analytics tracking calls';
    RAISE NOTICE '3. Set up automated refresh of materialized views';
END $$;