-- Update more RPC functions to accept clerk_id (TEXT) instead of user_id (UUID)

-- 1. Update track_analytics_event to accept clerk_id
CREATE OR REPLACE FUNCTION public.track_analytics_event(
  p_brand_id uuid,
  p_clerk_id text,
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
  v_event_id uuid;
BEGIN
  INSERT INTO analytics_events (
    brand_id,
    clerk_id,
    account_id,
    event_type,
    event_category,
    event_action,
    value,
    properties,
    session_id,
    created_at
  )
  VALUES (
    p_brand_id,
    p_clerk_id,
    p_account_id,
    p_event_type,
    p_event_category,
    p_event_action,
    p_value,
    p_properties,
    p_session_id,
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 2. Update create_user_notification to accept clerk_id
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_clerk_id text,
  p_type text,
  p_title text,
  p_message text,
  p_account_id uuid DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO user_notifications (
    clerk_id,
    type,
    title,
    message,
    account_id,
    brand_id,
    action_url,
    metadata,
    created_at
  )
  VALUES (
    p_clerk_id,
    p_type,
    p_title,
    p_message,
    p_account_id,
    p_brand_id,
    p_action_url,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- 3. Add clerk_id column to analytics_events if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'analytics_events'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'analytics_events' AND column_name = 'clerk_id'
    ) THEN
      ALTER TABLE analytics_events ADD COLUMN clerk_id text;
      CREATE INDEX IF NOT EXISTS idx_analytics_events_clerk_id ON analytics_events(clerk_id);
    END IF;
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
