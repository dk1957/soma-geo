-- Update LDI snapshots table to include additional columns for our LLM monitoring system
-- This migration adds the missing columns while preserving existing data

-- Add missing columns to ldi_snapshots table
ALTER TABLE public.ldi_snapshots 
ADD COLUMN IF NOT EXISTS overall_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS provider_scores jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mention_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS citation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentiment_breakdown jsonb DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
ADD COLUMN IF NOT EXISTS competitive_analysis jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trend_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_created_at ON public.ldi_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_overall_score ON public.ldi_snapshots(overall_score);

-- Update existing records to have the new created_at/updated_at values based on recorded_at
UPDATE public.ldi_snapshots 
SET 
  created_at = COALESCE(created_at, recorded_at),
  updated_at = COALESCE(updated_at, recorded_at)
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create a view that maps our new schema to the existing one for compatibility
CREATE OR REPLACE VIEW public.ldi_snapshots_unified AS
SELECT 
  id,
  brand_id,
  site_id,
  locale,
  platform,
  COALESCE(overall_score, score::integer) as overall_score,
  score as legacy_score,
  coverage_score,
  position_score,
  citation_score,
  answer_presence_score,
  provider_scores,
  mention_count,
  citation_count,
  sentiment_breakdown,
  competitive_analysis,
  trend_data,
  queries_tested,
  queries_found,
  metadata,
  COALESCE(created_at, recorded_at) as created_at,
  COALESCE(updated_at, recorded_at) as updated_at,
  recorded_at
FROM public.ldi_snapshots;

-- Update the get_ldi_trends function to work with the unified view
CREATE OR REPLACE FUNCTION public.get_ldi_trends(
  brand_uuid uuid,
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  score integer,
  provider_scores jsonb,
  mention_count integer,
  citation_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.created_at::date as date,
    s.overall_score as score,
    s.provider_scores,
    s.mention_count,
    s.citation_count
  FROM public.ldi_snapshots_unified s
  WHERE s.brand_id = brand_uuid
  AND s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new LDI snapshot with our schema
CREATE OR REPLACE FUNCTION public.create_ldi_snapshot(
  brand_uuid uuid,
  overall_score_val integer,
  provider_scores_val jsonb DEFAULT '{}',
  mention_count_val integer DEFAULT 0,
  citation_count_val integer DEFAULT 0,
  sentiment_breakdown_val jsonb DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
  competitive_analysis_val jsonb DEFAULT '{}',
  trend_data_val jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.ldi_snapshots (
    brand_id,
    score,
    overall_score,
    provider_scores,
    mention_count,
    citation_count,
    sentiment_breakdown,
    competitive_analysis,
    trend_data,
    queries_tested,
    queries_found,
    created_at,
    updated_at
  ) VALUES (
    brand_uuid,
    overall_score_val::numeric,
    overall_score_val,
    provider_scores_val,
    mention_count_val,
    citation_count_val,
    sentiment_breakdown_val,
    competitive_analysis_val,
    trend_data_val,
    0, -- queries_tested (will be updated)
    0, -- queries_found (will be updated)
    now(),
    now()
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.ldi_snapshots_unified TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ldi_snapshot TO authenticated;