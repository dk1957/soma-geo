-- Create cron_logs table to track automated cron job runs
CREATE TABLE IF NOT EXISTS public.cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Summary data
    brands_checked INTEGER DEFAULT 0,
    brands_needed_simulation INTEGER DEFAULT 0,
    brands_processed INTEGER DEFAULT 0,
    brands_successful INTEGER DEFAULT 0,
    brands_failed INTEGER DEFAULT 0,
    brands_remaining INTEGER DEFAULT 0,
    
    -- Detailed results (JSON array of brand results)
    results JSONB DEFAULT '[]'::jsonb,
    
    -- Error information if failed
    error_message TEXT,
    error_details JSONB,
    
    -- Additional context
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying by job name and time
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON public.cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_started_at ON public.cron_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON public.cron_logs(status);

-- Add comment
COMMENT ON TABLE public.cron_logs IS 'Tracks automated cron job runs for monitoring and debugging';

-- Create RLS policy (admin only - service role bypass)
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for cron jobs)
CREATE POLICY "Service role has full access to cron_logs"
    ON public.cron_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
