-- Update RPC functions to accept clerk_id (TEXT) instead of user_id (UUID)

-- 1. Update log_account_action to accept clerk_id
CREATE OR REPLACE FUNCTION public.log_account_action(
  p_account_id uuid,
  p_clerk_id text,
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO account_audit_logs (
    account_id,
    clerk_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    created_at
  )
  VALUES (
    p_account_id,
    p_clerk_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    NOW()
  );
END;
$$;

-- 2. Update create_account_notification to accept clerk_id
CREATE OR REPLACE FUNCTION public.create_account_notification(
  p_account_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_severity text DEFAULT 'info',
  p_target_roles text[] DEFAULT '{}',
  p_target_users text[] DEFAULT '{}',
  p_action_required boolean DEFAULT false,
  p_action_url text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO account_notifications (
    account_id,
    type,
    title,
    message,
    severity,
    target_roles,
    target_clerk_ids,
    action_required,
    action_url,
    created_by_clerk_id,
    created_at
  )
  VALUES (
    p_account_id,
    p_type,
    p_title,
    p_message,
    p_severity,
    p_target_roles,
    p_target_users,
    p_action_required,
    p_action_url,
    p_created_by,
    NOW()
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 3. Update create_external_brand_report to use clerk_id (the one with p_user_id)
CREATE OR REPLACE FUNCTION public.create_external_brand_report(
  p_source_report_id uuid,
  p_clerk_id text,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_requires_email_capture boolean DEFAULT true,
  p_preview_section_count integer DEFAULT 2
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_external_report_id uuid;
  v_share_token text;
  v_brand_id uuid;
  v_brand_name text;
  v_report_data jsonb;
BEGIN
  -- Generate unique share token
  v_share_token := encode(gen_random_bytes(32), 'hex');
  
  -- Get source report data
  SELECT brand_id, brand_name, report_data 
  INTO v_brand_id, v_brand_name, v_report_data
  FROM brand_reports 
  WHERE id = p_source_report_id;
  
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Source report not found';
  END IF;
  
  -- Create external report
  INSERT INTO external_brand_reports (
    source_report_id,
    brand_id,
    brand_name,
    clerk_id,
    share_token,
    title,
    description,
    report_data,
    requires_email_capture,
    preview_section_count,
    created_at
  )
  VALUES (
    p_source_report_id,
    v_brand_id,
    v_brand_name,
    p_clerk_id,
    v_share_token,
    COALESCE(p_title, 'Brand Visibility Report'),
    p_description,
    v_report_data,
    p_requires_email_capture,
    p_preview_section_count,
    NOW()
  )
  RETURNING id INTO v_external_report_id;
  
  RETURN v_external_report_id;
END;
$$;

-- 4. Add clerk_id column to account_audit_logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'account_audit_logs' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE account_audit_logs ADD COLUMN clerk_id text;
    CREATE INDEX IF NOT EXISTS idx_account_audit_logs_clerk_id ON account_audit_logs(clerk_id);
  END IF;
END $$;

-- 5. Add clerk_id columns to account_notifications if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'account_notifications' AND column_name = 'target_clerk_ids'
  ) THEN
    ALTER TABLE account_notifications ADD COLUMN target_clerk_ids text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'account_notifications' AND column_name = 'created_by_clerk_id'
  ) THEN
    ALTER TABLE account_notifications ADD COLUMN created_by_clerk_id text;
    CREATE INDEX IF NOT EXISTS idx_account_notifications_created_by_clerk_id ON account_notifications(created_by_clerk_id);
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
