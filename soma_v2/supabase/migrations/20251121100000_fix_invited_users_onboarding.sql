-- Fix onboarding status for all invited users
-- Ensure all users who are members (not owners) have completed onboarding status

-- Update profiles for all users who are members of accounts (invited users)
UPDATE public.profiles p
SET 
  onboarding_status = 'completed',
  onboarding_completed_at = COALESCE(p.onboarding_completed_at, now()),
  onboarding_step = 6,
  updated_at = now()
FROM public.account_users au
WHERE p.user_id = au.user_id
  AND au.invited_by IS NOT NULL
  AND au.is_active = true
  AND (p.onboarding_status != 'completed' OR p.onboarding_step IS NULL OR p.onboarding_step < 6);

-- Add comment
COMMENT ON COLUMN profiles.onboarding_status IS 'Status of user onboarding: never_started, in_progress, completed. Invited users should always be completed.';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in onboarding process (0-6). Step 6 means fully completed.';

-- Create index to speed up invited user checks
CREATE INDEX IF NOT EXISTS idx_account_users_invited_by ON public.account_users(user_id, invited_by) WHERE invited_by IS NOT NULL;
