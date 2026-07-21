-- Create user_notifications table for personal notifications
-- This table stores notifications for individual users (simulation completion, job alerts, etc.)

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  
  type text NOT NULL CHECK (type IN ('job', 'audit', 'optimization', 'mention', 'personal', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  
  -- Personal context
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  
  -- Actions
  action_url text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_account_id ON public.user_notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_brand_id ON public.user_notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_dismissed ON public.user_notifications(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);

-- Enable Row Level Security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read/dismissed)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications (for background jobs)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;
CREATE POLICY "Service role can insert notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Service role can update notifications
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.user_notifications;
CREATE POLICY "Service role can manage notifications" ON public.user_notifications
  FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE public.user_notifications IS 'Personal notifications for individual users (simulation completion, job alerts, etc.)';
