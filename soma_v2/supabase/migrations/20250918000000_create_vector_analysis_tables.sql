-- Vector Analysis Tables for Enhanced GEO Analysis
-- =================================================
-- Creates tables to store embeddings and support vector-powered competitive analysis
-- Compatible with existing schema and enhanced extraction format

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "vector";

-- Response Embeddings Table
-- Stores semantic embeddings for entire LLM responses
CREATE TABLE public.response_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id uuid NOT NULL REFERENCES public.llm_simulation_responses(id) ON DELETE CASCADE,
  simulation_id uuid NOT NULL REFERENCES public.llm_simulations(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Embedding data
  embedding vector(1536) NOT NULL,
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  embedding_dimensions integer NOT NULL DEFAULT 1536,
  tokens_used integer NOT NULL DEFAULT 0,
  
  -- Response metadata
  response_length integer,
  total_brands_mentioned integer DEFAULT 0,
  primary_brand_mentions integer DEFAULT 0,
  lvi_score decimal,
  avg_sentiment decimal,
  
  -- Processing metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processing_time_ms integer,
  
  CONSTRAINT unique_response_embedding UNIQUE (response_id)
);

-- Brand Entity Vectors Table
-- Stores embeddings for specific brand mentions and contexts
CREATE TABLE public.brand_entity_vectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id uuid NOT NULL REFERENCES public.llm_simulation_responses(id) ON DELETE CASCADE,
  simulation_id uuid NOT NULL REFERENCES public.llm_simulations(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Brand mention data
  mentioned_brand_name text NOT NULL,
  is_primary_brand boolean NOT NULL DEFAULT false,
  mention_count integer NOT NULL DEFAULT 1,
  
  -- Embedding data
  embedding vector(1536) NOT NULL,
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  context_snippet text,
  
  -- Brand analysis metadata
  avg_sentiment decimal,
  first_mention_position integer,
  list_appearances integer DEFAULT 0,
  category text CHECK (category IN ('primary', 'competitor', 'discovered')) DEFAULT 'discovered',
  
  -- Processing metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tokens_used integer NOT NULL DEFAULT 0
);

-- Competitive Analysis Vectors Table
-- Stores embeddings for competitive landscape analysis and clustering
CREATE TABLE public.competitive_analysis_vectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id uuid NOT NULL REFERENCES public.llm_simulations(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Competitive context
  competitive_set jsonb NOT NULL, -- Array of brand names in this competitive context
  market_context text,
  query_theme text,
  
  -- Aggregated embedding representing competitive landscape
  embedding vector(1536) NOT NULL,
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  
  -- Competitive metrics
  total_responses_analyzed integer NOT NULL DEFAULT 1,
  share_of_voice decimal,
  avg_competitive_sentiment decimal,
  primary_brand_advantage decimal,
  
  -- Clustering and similarity
  cluster_id uuid, -- For grouping similar competitive contexts
  similarity_threshold decimal DEFAULT 0.8,
  
  -- Processing metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  tokens_used integer NOT NULL DEFAULT 0
);

-- Vector Similarity Search Logs
-- Track similarity searches for optimization and analytics
CREATE TABLE public.vector_similarity_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  
  -- Search parameters
  search_type text NOT NULL CHECK (search_type IN ('response_similarity', 'brand_similarity', 'competitive_clustering')),
  query_embedding vector(1536),
  similarity_threshold decimal NOT NULL DEFAULT 0.8,
  max_results integer NOT NULL DEFAULT 10,
  
  -- Search results
  results_found integer NOT NULL DEFAULT 0,
  avg_similarity decimal,
  max_similarity decimal,
  processing_time_ms integer,
  
  -- Search metadata
  search_params jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient vector operations
CREATE INDEX idx_response_embeddings_vector ON public.response_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_brand_entity_vectors_vector ON public.brand_entity_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_competitive_analysis_vectors_vector ON public.competitive_analysis_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for efficient querying
CREATE INDEX idx_response_embeddings_simulation ON public.response_embeddings (simulation_id);
CREATE INDEX idx_response_embeddings_brand ON public.response_embeddings (brand_id);
CREATE INDEX idx_response_embeddings_account ON public.response_embeddings (account_id);
CREATE INDEX idx_response_embeddings_lvi ON public.response_embeddings (lvi_score DESC);

CREATE INDEX idx_brand_entity_vectors_simulation ON public.brand_entity_vectors (simulation_id);
CREATE INDEX idx_brand_entity_vectors_brand ON public.brand_entity_vectors (brand_id);
CREATE INDEX idx_brand_entity_vectors_mentioned_brand ON public.brand_entity_vectors (mentioned_brand_name);
CREATE INDEX idx_brand_entity_vectors_primary ON public.brand_entity_vectors (is_primary_brand);
CREATE INDEX idx_brand_entity_vectors_sentiment ON public.brand_entity_vectors (avg_sentiment DESC);

CREATE INDEX idx_competitive_analysis_simulation ON public.competitive_analysis_vectors (simulation_id);
CREATE INDEX idx_competitive_analysis_brand ON public.competitive_analysis_vectors (brand_id);
CREATE INDEX idx_competitive_analysis_cluster ON public.competitive_analysis_vectors (cluster_id);
CREATE INDEX idx_competitive_analysis_advantage ON public.competitive_analysis_vectors (primary_brand_advantage DESC);

CREATE INDEX idx_vector_searches_account ON public.vector_similarity_searches (account_id);
CREATE INDEX idx_vector_searches_type ON public.vector_similarity_searches (search_type);
CREATE INDEX idx_vector_searches_created ON public.vector_similarity_searches (created_at DESC);

-- Function to calculate vector similarity
CREATE OR REPLACE FUNCTION calculate_vector_similarity(
  embedding1 vector(1536),
  embedding2 vector(1536)
) RETURNS decimal AS $$
BEGIN
  RETURN 1 - (embedding1 <=> embedding2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar responses
CREATE OR REPLACE FUNCTION find_similar_responses(
  target_embedding vector(1536),
  account_id_param uuid,
  similarity_threshold decimal DEFAULT 0.8,
  max_results integer DEFAULT 10
) RETURNS TABLE (
  response_id uuid,
  similarity decimal,
  lvi_score decimal,
  brand_mentions integer,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.response_id,
    calculate_vector_similarity(target_embedding, re.embedding) as similarity,
    re.lvi_score,
    re.primary_brand_mentions,
    re.created_at
  FROM public.response_embeddings re
  WHERE re.account_id = account_id_param
    AND calculate_vector_similarity(target_embedding, re.embedding) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to find competitive brand clusters
CREATE OR REPLACE FUNCTION find_competitive_clusters(
  brand_id_param uuid,
  account_id_param uuid,
  similarity_threshold decimal DEFAULT 0.8
) RETURNS TABLE (
  cluster_id uuid,
  competitive_set jsonb,
  avg_similarity decimal,
  response_count integer,
  share_of_voice decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.cluster_id,
    ca.competitive_set,
    AVG(calculate_vector_similarity(ca.embedding, ca2.embedding)) as avg_similarity,
    COUNT(*)::integer as response_count,
    AVG(ca.share_of_voice) as share_of_voice
  FROM public.competitive_analysis_vectors ca
  LEFT JOIN public.competitive_analysis_vectors ca2 ON ca.cluster_id = ca2.cluster_id
  WHERE ca.brand_id = brand_id_param 
    AND ca.account_id = account_id_param
    AND ca.cluster_id IS NOT NULL
  GROUP BY ca.cluster_id, ca.competitive_set
  HAVING AVG(calculate_vector_similarity(ca.embedding, ca2.embedding)) >= similarity_threshold
  ORDER BY response_count DESC, avg_similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE public.response_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_entity_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_analysis_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_similarity_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for response_embeddings
CREATE POLICY "response_embeddings_account_isolation" ON public.response_embeddings
  FOR ALL USING (
    account_id IN (
      SELECT ab.account_id 
      FROM public.account_brand_access ab 
      WHERE ab.user_id = auth.uid()
    )
  );

-- RLS Policies for brand_entity_vectors
CREATE POLICY "brand_entity_vectors_account_isolation" ON public.brand_entity_vectors
  FOR ALL USING (
    account_id IN (
      SELECT ab.account_id 
      FROM public.account_brand_access ab 
      WHERE ab.user_id = auth.uid()
    )
  );

-- RLS Policies for competitive_analysis_vectors
CREATE POLICY "competitive_analysis_vectors_account_isolation" ON public.competitive_analysis_vectors
  FOR ALL USING (
    account_id IN (
      SELECT ab.account_id 
      FROM public.account_brand_access ab 
      WHERE ab.user_id = auth.uid()
    )
  );

-- RLS Policies for vector_similarity_searches
CREATE POLICY "vector_similarity_searches_account_isolation" ON public.vector_similarity_searches
  FOR ALL USING (
    account_id IN (
      SELECT ab.account_id 
      FROM public.account_brand_access ab 
      WHERE ab.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.response_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_entity_vectors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitive_analysis_vectors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vector_similarity_searches TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_vector_similarity(vector, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_responses(vector, uuid, decimal, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION find_competitive_clusters(uuid, uuid, decimal) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.response_embeddings IS 'Stores semantic embeddings for entire LLM responses to enable similarity analysis and clustering';
COMMENT ON TABLE public.brand_entity_vectors IS 'Stores embeddings for specific brand mentions and contexts within responses';
COMMENT ON TABLE public.competitive_analysis_vectors IS 'Stores aggregated embeddings representing competitive landscapes for pattern detection';
COMMENT ON TABLE public.vector_similarity_searches IS 'Logs vector similarity searches for optimization and analytics';

COMMENT ON FUNCTION calculate_vector_similarity(vector, vector) IS 'Calculates cosine similarity between two embeddings, returning a value between 0 and 1';
COMMENT ON FUNCTION find_similar_responses(vector, uuid, decimal, integer) IS 'Finds responses with similar embeddings above the threshold, ordered by similarity';
COMMENT ON FUNCTION find_competitive_clusters(uuid, uuid, decimal) IS 'Identifies competitive brand clusters based on embedding similarity';