-- Allow NULL brand_id in jobs table during onboarding flow
-- This enables job creation before brand setup is complete

-- Remove NOT NULL constraint from brand_id in jobs table
ALTER TABLE public.jobs 
ALTER COLUMN brand_id DROP NOT NULL;

-- Remove NOT NULL constraint from brand_id in responses table  
ALTER TABLE public.responses 
ALTER COLUMN brand_id DROP NOT NULL;

-- Add a check constraint to ensure either both account_id and brand_id are provided,
-- or it's a special onboarding case with just account_id
-- (We'll allow brand_id to be NULL temporarily during onboarding)

-- Update existing policies to handle NULL brand_id gracefully
DROP POLICY IF EXISTS "Jobs are viewable by brand members" ON public.jobs;
CREATE POLICY "Jobs are viewable by account and brand members" ON public.jobs
  FOR SELECT USING (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid()
    )
    AND (
      brand_id IS NULL -- Allow during onboarding
      OR brand_id IN (
        SELECT b.id 
        FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Responses are viewable by brand members" ON public.responses;
CREATE POLICY "Responses are viewable by account and brand members" ON public.responses
  FOR SELECT USING (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid()
    )
    AND (
      brand_id IS NULL -- Allow during onboarding
      OR brand_id IN (
        SELECT b.id 
        FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid()
      )
    )
  );

-- Create insert policies for jobs
DROP POLICY IF EXISTS "Jobs can be created by account members" ON public.jobs;
CREATE POLICY "Jobs can be created by account members" ON public.jobs
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create insert policies for responses
DROP POLICY IF EXISTS "Responses can be created by account members" ON public.responses;
CREATE POLICY "Responses can be created by account members" ON public.responses
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create update policies for jobs
DROP POLICY IF EXISTS "Jobs can be updated by account members" ON public.jobs;
CREATE POLICY "Jobs can be updated by account members" ON public.jobs
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Add index for queries filtering by account_id only (for onboarding cases)
CREATE INDEX IF NOT EXISTS idx_jobs_account_id_only ON public.jobs(account_id) 
WHERE brand_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_responses_account_id_only ON public.responses(account_id) 
WHERE brand_id IS NULL;

-- Add a function to backfill brand_id for onboarding jobs once brands are created
CREATE OR REPLACE FUNCTION public.backfill_onboarding_job_brand_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update jobs with NULL brand_id by matching account_id to the first brand in that account
  UPDATE public.jobs 
  SET brand_id = (
    SELECT id 
    FROM public.brands 
    WHERE account_id = jobs.account_id 
    ORDER BY created_at ASC 
    LIMIT 1
  )
  WHERE brand_id IS NULL 
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.brands 
      WHERE account_id = jobs.account_id
    );

  -- Update responses with NULL brand_id similarly
  UPDATE public.responses 
  SET brand_id = (
    SELECT id 
    FROM public.brands 
    WHERE account_id = responses.account_id 
    ORDER BY created_at ASC 
    LIMIT 1
  )
  WHERE brand_id IS NULL 
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.brands 
      WHERE account_id = responses.account_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.backfill_onboarding_job_brand_ids() TO authenticated;