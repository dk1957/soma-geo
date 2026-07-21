-- Create Supabase Storage bucket and metadata table for LLM response files
-- Migration: 20260406100000_create_llm_response_storage.sql
-- Purpose: Move LLM response text from Postgres TEXT columns to file storage
--          Keep lightweight metadata in DB for fast queries and analysis triggers

BEGIN;

-- ============================================================
-- 1. Create Storage Bucket for LLM response files
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'llm-responses',
  'llm-responses',
  false,  -- private bucket
  1048576, -- 1MB max per file (responses are typically 5-50KB)
  ARRAY['text/markdown', 'text/plain', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access files under their account's path
CREATE POLICY "Users can read their account response files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'llm-responses'
  AND (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM public.account_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Service role can manage all response files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'llm-responses'
  AND auth.role() = 'service_role'
);

-- ============================================================
-- 2. Create llm_response_files metadata table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.llm_response_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  simulation_id UUID NOT NULL REFERENCES public.llm_simulations(id) ON DELETE CASCADE,
  prompt_id UUID,
  profile_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,

  -- Model info
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL DEFAULT 'OpenRouter',

  -- Storage references (no raw text stored here)
  storage_path TEXT NOT NULL,
  meta_storage_path TEXT,
  file_size_bytes INTEGER,
  content_hash TEXT,             -- SHA-256 for dedup & integrity

  -- Lightweight queryable fields for list views
  prompt_text TEXT NOT NULL,     -- Full prompt (short, needed for dedup)
  response_preview TEXT,         -- First 500 chars for list display
  word_count INTEGER,

  -- Performance metrics (small, highly queryable)
  response_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}',
  cost_estimate DECIMAL(10, 6) DEFAULT 0,

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Analysis tracking
  last_analysed TIMESTAMPTZ,

  -- Context
  consumer_behavior TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate responses per simulation run
  UNIQUE(simulation_id, prompt_id, model_name)
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX idx_lrf_simulation_id ON public.llm_response_files(simulation_id);
CREATE INDEX idx_lrf_account_brand ON public.llm_response_files(account_id, brand_id);
CREATE INDEX idx_lrf_model ON public.llm_response_files(model_name);
CREATE INDEX idx_lrf_success ON public.llm_response_files(success);
CREATE INDEX idx_lrf_created_at ON public.llm_response_files(created_at DESC);
CREATE INDEX idx_lrf_content_hash ON public.llm_response_files(content_hash);

-- Partial index: only unanalysed successful responses (most common query in analysis engine)
CREATE INDEX idx_lrf_unanalysed ON public.llm_response_files(brand_id, account_id)
  WHERE last_analysed IS NULL AND success = true;

-- ============================================================
-- 4. Row Level Security
-- ============================================================
ALTER TABLE public.llm_response_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access response files for their accounts"
ON public.llm_response_files
FOR ALL USING (
  account_id IN (
    SELECT account_id FROM public.account_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Service role bypass for background tasks (cron, analysis engine)
CREATE POLICY "Service role full access to response files"
ON public.llm_response_files
FOR ALL USING (
  auth.role() = 'service_role'
);

COMMIT;
