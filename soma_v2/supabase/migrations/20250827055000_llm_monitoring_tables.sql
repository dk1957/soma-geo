-- Migration for LLM Monitoring System
-- This adds tables to store LLM query results and LDI snapshots

-- Table for storing individual LLM query results
CREATE TABLE IF NOT EXISTS public.llm_query_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  query text NOT NULL,
  response text NOT NULL,
  brand_mentions text[] DEFAULT '{}',
  competitor_mentions text[] DEFAULT '{}',
  citations text[] DEFAULT '{}',
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence decimal(4,3) DEFAULT 0,
  tokens_used integer DEFAULT 0,
  cost decimal(10,6) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for storing LDI snapshots over time
CREATE TABLE IF NOT EXISTS public.ldi_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0,
  provider_scores jsonb DEFAULT '{}',
  mention_count integer DEFAULT 0,
  citation_count integer DEFAULT 0,
  sentiment_breakdown jsonb DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
  competitive_analysis jsonb DEFAULT '{}',
  trend_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_query_results_brand_id ON public.llm_query_results(brand_id);
CREATE INDEX IF NOT EXISTS idx_llm_query_results_provider ON public.llm_query_results(provider);
CREATE INDEX IF NOT EXISTS idx_llm_query_results_created_at ON public.llm_query_results(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_query_results_sentiment ON public.llm_query_results(sentiment);

CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_brand_id ON public.ldi_snapshots(brand_id);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_created_at ON public.ldi_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_overall_score ON public.ldi_snapshots(overall_score);

-- Row Level Security (RLS) policies
ALTER TABLE public.llm_query_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldi_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy for llm_query_results
CREATE POLICY "Users can access their brand's LLM query results" ON public.llm_query_results
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM public.brands b
      JOIN public.accounts a ON b.account_id = a.id
      JOIN public.account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy for ldi_snapshots
CREATE POLICY "Users can access their brand's LDI snapshots" ON public.ldi_snapshots
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM public.brands b
      JOIN public.accounts a ON b.account_id = a.id
      JOIN public.account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Function to calculate LDI trends
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
  FROM public.ldi_snapshots s
  WHERE s.brand_id = brand_uuid
  AND s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get competitor comparison data
CREATE OR REPLACE FUNCTION public.get_competitor_analysis(
  brand_uuid uuid,
  days_back integer DEFAULT 7
)
RETURNS TABLE (
  competitor_name text,
  mention_count bigint,
  avg_sentiment_score decimal,
  citation_count bigint,
  visibility_score decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    UNNEST(qr.competitor_mentions) as competitor_name,
    COUNT(*) as mention_count,
    AVG(CASE 
      WHEN qr.sentiment = 'positive' THEN 1.0
      WHEN qr.sentiment = 'neutral' THEN 0.5
      ELSE 0.0
    END) as avg_sentiment_score,
    SUM(array_length(qr.citations, 1)) as citation_count,
    (COUNT(*) * 100.0 / (
      SELECT COUNT(*) FROM public.llm_query_results 
      WHERE brand_id = brand_uuid 
      AND created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    )) as visibility_score
  FROM public.llm_query_results qr
  WHERE qr.brand_id = brand_uuid
  AND qr.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  AND array_length(qr.competitor_mentions, 1) > 0
  GROUP BY UNNEST(qr.competitor_mentions)
  ORDER BY mention_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get LLM provider performance
CREATE OR REPLACE FUNCTION public.get_provider_performance(
  brand_uuid uuid,
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  provider text,
  total_queries bigint,
  brand_mentions bigint,
  mention_rate decimal,
  avg_confidence decimal,
  total_cost decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qr.provider,
    COUNT(*) as total_queries,
    COUNT(*) FILTER (WHERE array_length(qr.brand_mentions, 1) > 0) as brand_mentions,
    (COUNT(*) FILTER (WHERE array_length(qr.brand_mentions, 1) > 0) * 100.0 / COUNT(*)) as mention_rate,
    AVG(qr.confidence) as avg_confidence,
    SUM(qr.cost) as total_cost
  FROM public.llm_query_results qr
  WHERE qr.brand_id = brand_uuid
  AND qr.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY qr.provider
  ORDER BY mention_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_llm_query_results_updated_at
  BEFORE UPDATE ON public.llm_query_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ldi_snapshots_updated_at
  BEFORE UPDATE ON public.ldi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();