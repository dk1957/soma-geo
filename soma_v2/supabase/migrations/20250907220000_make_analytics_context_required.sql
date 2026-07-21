-- Make brand_id and account_id required in analytics_events
-- Date: 2025-09-07
-- This ensures all future analytics events MUST have brand and account context

-- First, backfill any remaining NULL values (there should be very few after previous migration)
DO $$
DECLARE
    remaining_nulls INT;
BEGIN
    -- Count remaining NULL brand_id or account_id
    SELECT COUNT(*) INTO remaining_nulls 
    FROM analytics_events 
    WHERE brand_id IS NULL OR account_id IS NULL;
    
    IF remaining_nulls > 0 THEN
        RAISE NOTICE 'Found % events with NULL brand_id or account_id, attempting final backfill...', remaining_nulls;
        
        -- Final attempt to backfill using simpler logic
        WITH user_primary_context AS (
            SELECT DISTINCT ON (au.user_id) 
                au.user_id,
                au.account_id,
                b.id as brand_id
            FROM account_users au
            JOIN brands b ON b.account_id = au.account_id
            WHERE au.is_active = true
            ORDER BY au.user_id, au.created_at ASC, b.created_at ASC
        )
        UPDATE analytics_events ae
        SET 
            brand_id = COALESCE(ae.brand_id, upc.brand_id),
            account_id = COALESCE(ae.account_id, upc.account_id)
        FROM user_primary_context upc
        WHERE ae.user_id = upc.user_id
        AND (ae.brand_id IS NULL OR ae.account_id IS NULL);
        
        -- Count what's left
        SELECT COUNT(*) INTO remaining_nulls 
        FROM analytics_events 
        WHERE brand_id IS NULL OR account_id IS NULL;
        
        RAISE NOTICE 'After final backfill: % events still have NULL values', remaining_nulls;
    ELSE
        RAISE NOTICE 'All analytics events already have brand_id and account_id populated';
    END IF;
END $$;

-- Remove any events that still can't be associated with a brand/account
-- These are likely orphaned events from deleted users/accounts
DELETE FROM analytics_events 
WHERE brand_id IS NULL OR account_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE analytics_events 
ALTER COLUMN brand_id SET NOT NULL;

ALTER TABLE analytics_events 
ALTER COLUMN account_id SET NOT NULL;

-- Update the table comment to reflect the requirement
COMMENT ON TABLE analytics_events IS 'Append-only time series table for tracking all user interactions and system events. brand_id and account_id are required for proper multi-tenant data isolation.';

-- Update the analytics tracking function to ensure these fields are always provided
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_event_type text,
    p_event_category text,
    p_event_action text,
    p_brand_id uuid,  -- Now required
    p_account_id uuid,  -- Now required
    p_user_id uuid DEFAULT auth.uid(),
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
BEGIN
    -- Validate required parameters
    IF p_brand_id IS NULL THEN
        RAISE EXCEPTION 'brand_id is required for analytics events';
    END IF;
    
    IF p_account_id IS NULL THEN
        RAISE EXCEPTION 'account_id is required for analytics events';
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id is required for analytics events';
    END IF;
    
    -- Validate that the brand belongs to the account
    IF NOT EXISTS (
        SELECT 1 FROM brands 
        WHERE id = p_brand_id AND account_id = p_account_id
    ) THEN
        RAISE EXCEPTION 'brand_id % does not belong to account_id %', p_brand_id, p_account_id;
    END IF;
    
    -- Validate that the user has access to this account
    IF NOT EXISTS (
        SELECT 1 FROM account_users 
        WHERE user_id = p_user_id AND account_id = p_account_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'user_id % does not have access to account_id %', p_user_id, p_account_id;
    END IF;
    
    -- Insert the analytics event
    INSERT INTO analytics_events (
        event_type,
        event_category,
        event_action,
        brand_id,
        account_id,
        user_id,
        value,
        properties,
        session_id
    ) VALUES (
        p_event_type,
        p_event_category,
        p_event_action,
        p_brand_id,
        p_account_id,
        p_user_id,
        p_value,
        p_properties,
        p_session_id
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Create a helper function that auto-derives brand/account context for convenience
CREATE OR REPLACE FUNCTION track_analytics_event_auto_context(
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
    -- If context not provided, try to derive it
    IF p_brand_id IS NULL OR p_account_id IS NULL THEN
        -- Get user's primary account and brand
        SELECT 
            au.account_id,
            b.id as brand_id
        INTO v_derived_account_id, v_derived_brand_id
        FROM account_users au
        JOIN brands b ON b.account_id = au.account_id
        WHERE au.user_id = p_user_id 
        AND au.is_active = true
        ORDER BY au.created_at ASC, b.created_at ASC
        LIMIT 1;
        
        -- Use provided values or fallback to derived
        v_derived_brand_id := COALESCE(p_brand_id, v_derived_brand_id);
        v_derived_account_id := COALESCE(p_account_id, v_derived_account_id);
        
        -- If we still don't have context, fail
        IF v_derived_brand_id IS NULL OR v_derived_account_id IS NULL THEN
            RAISE EXCEPTION 'Cannot derive brand_id and account_id for user_id %. Please provide them explicitly.', p_user_id;
        END IF;
    ELSE
        v_derived_brand_id := p_brand_id;
        v_derived_account_id := p_account_id;
    END IF;
    
    -- Call the main tracking function
    SELECT track_analytics_event(
        p_event_type,
        p_event_category,
        p_event_action,
        v_derived_brand_id,
        v_derived_account_id,
        p_user_id,
        p_value,
        p_properties,
        p_session_id
    ) INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_analytics_event TO authenticated;
GRANT EXECUTE ON FUNCTION track_analytics_event_auto_context TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION track_analytics_event IS 'Track analytics events with required brand_id and account_id for proper multi-tenant isolation';
COMMENT ON FUNCTION track_analytics_event_auto_context IS 'Track analytics events with automatic brand/account context derivation as fallback';

-- Create a trigger to ensure analytics events always have brand/account context
CREATE OR REPLACE FUNCTION validate_analytics_event_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure brand_id and account_id are provided
    IF NEW.brand_id IS NULL THEN
        RAISE EXCEPTION 'brand_id cannot be NULL in analytics_events';
    END IF;
    
    IF NEW.account_id IS NULL THEN
        RAISE EXCEPTION 'account_id cannot be NULL in analytics_events';
    END IF;
    
    -- Validate that brand belongs to account
    IF NOT EXISTS (
        SELECT 1 FROM brands 
        WHERE id = NEW.brand_id AND account_id = NEW.account_id
    ) THEN
        RAISE EXCEPTION 'brand_id % does not belong to account_id %', NEW.brand_id, NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add the trigger
DROP TRIGGER IF EXISTS validate_analytics_context_trigger ON analytics_events;
CREATE TRIGGER validate_analytics_context_trigger
    BEFORE INSERT OR UPDATE ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION validate_analytics_event_context();

-- Log the completion
DO $$
DECLARE
    total_events INT;
    events_with_brand INT;
    events_with_account INT;
BEGIN
    SELECT COUNT(*) INTO total_events FROM analytics_events;
    SELECT COUNT(*) INTO events_with_brand FROM analytics_events WHERE brand_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_account FROM analytics_events WHERE account_id IS NOT NULL;
    
    RAISE NOTICE 'Analytics Events Schema Updated:';
    RAISE NOTICE '- Total events: %', total_events;
    RAISE NOTICE '- brand_id is now NOT NULL (% events)', events_with_brand;
    RAISE NOTICE '- account_id is now NOT NULL (% events)', events_with_account;
    RAISE NOTICE 'All future analytics events will require brand_id and account_id';
END $$;