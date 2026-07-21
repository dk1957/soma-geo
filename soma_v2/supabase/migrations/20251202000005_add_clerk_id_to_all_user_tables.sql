-- Migration: Add clerk_id columns to all tables that have user_id
-- This enables Clerk authentication across the entire application

-- 1. audit_results
ALTER TABLE public.audit_results
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_audit_results_clerk_id ON public.audit_results (clerk_id);

-- 2. brand_contexts
ALTER TABLE public.brand_contexts
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_brand_contexts_clerk_id ON public.brand_contexts (clerk_id);

-- 3. brand_reports
ALTER TABLE public.brand_reports
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_brand_reports_clerk_id ON public.brand_reports (clerk_id);

-- 4. external_brand_reports
ALTER TABLE public.external_brand_reports
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_external_brand_reports_clerk_id ON public.external_brand_reports (clerk_id);

-- 5. ground_truth_collections
ALTER TABLE public.ground_truth_collections
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_clerk_id ON public.ground_truth_collections (clerk_id);

-- 6. ground_truth_collections_with_context (if it's a table, not a view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ground_truth_collections_with_context' 
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.ground_truth_collections_with_context
    ADD COLUMN IF NOT EXISTS clerk_id text;
    
    CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_with_context_clerk_id 
    ON public.ground_truth_collections_with_context (clerk_id);
  END IF;
END;
$$;

-- 7. gseo_content
ALTER TABLE public.gseo_content
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_gseo_content_clerk_id ON public.gseo_content (clerk_id);

-- 8. invite_link_usage
ALTER TABLE public.invite_link_usage
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_invite_link_usage_clerk_id ON public.invite_link_usage (clerk_id);

-- 9. user_notifications
ALTER TABLE public.user_notifications
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_user_notifications_clerk_id ON public.user_notifications (clerk_id);

-- 10. Also add to other tables that might store user references
-- user_prompts
ALTER TABLE public.user_prompts
ADD COLUMN IF NOT EXISTS clerk_id text;

CREATE INDEX IF NOT EXISTS idx_user_prompts_clerk_id ON public.user_prompts (clerk_id);

-- llm_simulation_results
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'llm_simulation_results' 
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.llm_simulation_results
    ADD COLUMN IF NOT EXISTS clerk_id text;
    
    CREATE INDEX IF NOT EXISTS idx_llm_simulation_results_clerk_id 
    ON public.llm_simulation_results (clerk_id);
  END IF;
END;
$$;

-- notification_preferences
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_preferences' 
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN IF NOT EXISTS clerk_id text;
    
    CREATE INDEX IF NOT EXISTS idx_notification_preferences_clerk_id 
    ON public.notification_preferences (clerk_id);
  END IF;
END;
$$;

-- usage_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'usage_logs' 
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.usage_logs
    ADD COLUMN IF NOT EXISTS clerk_id text;
    
    CREATE INDEX IF NOT EXISTS idx_usage_logs_clerk_id 
    ON public.usage_logs (clerk_id);
  END IF;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
