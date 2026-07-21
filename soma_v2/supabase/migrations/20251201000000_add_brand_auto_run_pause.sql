-- Add auto_run_paused column to brands table
-- This allows admins to pause automatic simulation runs for specific brands

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS auto_run_paused BOOLEAN DEFAULT false;

-- Add paused_at timestamp to track when it was paused
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS auto_run_paused_at TIMESTAMP WITH TIME ZONE;

-- Add paused_by to track who paused it
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS auto_run_paused_by UUID REFERENCES auth.users(id);

-- Add pause reason for admin notes
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS auto_run_pause_reason TEXT;

-- Create an index for faster filtering of paused brands
CREATE INDEX IF NOT EXISTS idx_brands_auto_run_paused ON public.brands(auto_run_paused) WHERE auto_run_paused = true;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.auto_run_paused IS 'When true, automatic daily simulation runs are paused for this brand';
COMMENT ON COLUMN public.brands.auto_run_paused_at IS 'Timestamp when auto-run was paused';
COMMENT ON COLUMN public.brands.auto_run_paused_by IS 'Admin user who paused the auto-run';
COMMENT ON COLUMN public.brands.auto_run_pause_reason IS 'Optional reason for pausing auto-runs';
