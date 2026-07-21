-- LLM Simulation System Schema
-- ==============================
-- 
-- Database schema for storing LLM simulation responses, metadata, and analytics.
-- Supports caching, deduplication, audit trails, and performance tracking.

-- Brand Contexts Table (stores brand information for simulations)
CREATE TABLE IF NOT EXISTS brand_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, brand_name)
);

-- LLM Simulations Table (tracks simulation batches)
CREATE TABLE IF NOT EXISTS llm_simulations (
  id TEXT PRIMARY KEY, -- Custom ID like "sim_1725123456_abc123def"
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_context_id UUID NOT NULL REFERENCES brand_contexts(id) ON DELETE CASCADE,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  cached_responses INTEGER NOT NULL DEFAULT 0,
  models TEXT[] NOT NULL DEFAULT '{}',
  prompt_count INTEGER NOT NULL DEFAULT 0,
  options JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  estimated_completion_time INTEGER, -- milliseconds
  actual_completion_time INTEGER, -- milliseconds
  total_cost_estimate DECIMAL(10, 6) DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM Responses Table (primary storage for all LLM outputs)
CREATE TABLE IF NOT EXISTS llm_responses (
  id TEXT PRIMARY KEY, -- Custom ID like "res_1725123456_xyz789"
  simulation_id TEXT REFERENCES llm_simulations(id) ON DELETE CASCADE,
  brand_context_id UUID NOT NULL REFERENCES brand_contexts(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  prompt_hash TEXT NOT NULL, -- SHA256 hash for deduplication
  prompt_id TEXT, -- Original prompt ID from request
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  search_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Core response data
  response_raw JSONB NOT NULL, -- Full raw response from LLM
  answer_text TEXT NOT NULL, -- Extracted human-readable answer
  citations JSONB NOT NULL DEFAULT '[]', -- Array of citation objects
  brand_mentions JSONB NOT NULL DEFAULT '[]', -- Array of brand mention objects
  summary_table JSONB NOT NULL DEFAULT '{}', -- Aggregated brand rankings
  confidence_estimate INTEGER NOT NULL DEFAULT 0 CHECK (confidence_estimate >= 0 AND confidence_estimate <= 100),
  raw_search_hits JSONB DEFAULT '[]', -- Optional search results from model
  
  -- Request metadata
  request_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('queued', 'running', 'success', 'failed')),
  worker_latency_ms INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10, 6) DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM Jobs Audit Table (for retry tracking and debugging)
CREATE TABLE IF NOT EXISTS llm_jobs_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL, -- Custom job ID
  simulation_id TEXT REFERENCES llm_simulations(id) ON DELETE CASCADE,
  response_id TEXT REFERENCES llm_responses(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cached', 'retried')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  worker_node TEXT, -- Identifier for processing node
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model Performance Metrics (for monitoring and optimization)
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Performance stats
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  cached_requests INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  avg_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Quality metrics
  avg_confidence_score INTEGER NOT NULL DEFAULT 0,
  avg_citations_count INTEGER NOT NULL DEFAULT 0,
  avg_brand_mentions_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(model_name, date)
);

-- Cache Hit Statistics (for cache optimization)
CREATE TABLE IF NOT EXISTS cache_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key_pattern TEXT NOT NULL, -- Pattern like "model_type" or "industry"
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hit_count INTEGER NOT NULL DEFAULT 0,
  miss_count INTEGER NOT NULL DEFAULT 0,
  total_size_kb INTEGER NOT NULL DEFAULT 0,
  avg_ttl_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cache_key_pattern, date)
);

-- Indexes for performance optimization
-- ===================================

-- Brand contexts indexes
CREATE INDEX IF NOT EXISTS idx_brand_contexts_user_id ON brand_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_contexts_created_at ON brand_contexts(created_at DESC);

-- LLM simulations indexes
CREATE INDEX IF NOT EXISTS idx_llm_simulations_user_id ON llm_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_status ON llm_simulations(status);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_created_at ON llm_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_brand_context ON llm_simulations(brand_context_id);

-- LLM responses indexes (critical for query performance)
CREATE INDEX IF NOT EXISTS idx_llm_responses_simulation_id ON llm_responses(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_brand_context_id ON llm_responses(brand_context_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_prompt_hash ON llm_responses(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_llm_responses_model_name ON llm_responses(model_name);
CREATE INDEX IF NOT EXISTS idx_llm_responses_created_at ON llm_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_responses_status ON llm_responses(status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_llm_responses_brand_model_date ON llm_responses(brand_context_id, model_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_responses_dedup ON llm_responses(prompt_hash, model_version, brand_context_id) WHERE status = 'success';

-- Audit table indexes
CREATE INDEX IF NOT EXISTS idx_llm_jobs_audit_simulation_id ON llm_jobs_audit(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_jobs_audit_job_id ON llm_jobs_audit(job_id);
CREATE INDEX IF NOT EXISTS idx_llm_jobs_audit_created_at ON llm_jobs_audit(created_at DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_model_performance_model_date ON model_performance_metrics(model_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_cache_stats_pattern_date ON cache_statistics(cache_key_pattern, date DESC);

-- Row Level Security (RLS) policies
-- =================================

-- Enable RLS on all tables
ALTER TABLE brand_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_jobs_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_statistics ENABLE ROW LEVEL SECURITY;

-- Brand contexts policies
CREATE POLICY "Users can manage their own brand contexts" ON brand_contexts
  FOR ALL USING (auth.uid() = user_id);

-- LLM simulations policies  
CREATE POLICY "Users can manage their own simulations" ON llm_simulations
  FOR ALL USING (auth.uid() = user_id);

-- LLM responses policies (join with brand_contexts for user check)
CREATE POLICY "Users can view their simulation responses" ON llm_responses
  FOR SELECT USING (
    brand_context_id IN (
      SELECT id FROM brand_contexts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert responses" ON llm_responses
  FOR INSERT WITH CHECK (true); -- Allow system inserts, user check happens at simulation level

-- Audit table policies (read-only for users, write for system)
CREATE POLICY "Users can view their job audits" ON llm_jobs_audit
  FOR SELECT USING (
    simulation_id IN (
      SELECT id FROM llm_simulations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit records" ON llm_jobs_audit
  FOR INSERT WITH CHECK (true);

-- Performance metrics (read-only for authenticated users)
CREATE POLICY "Authenticated users can view metrics" ON model_performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage metrics" ON model_performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Cache statistics (read-only for authenticated users)
CREATE POLICY "Authenticated users can view cache stats" ON cache_statistics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage cache stats" ON cache_statistics
  FOR ALL USING (auth.role() = 'service_role');

-- Triggers for updated_at timestamps
-- =================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_brand_contexts_updated_at 
  BEFORE UPDATE ON brand_contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_simulations_updated_at 
  BEFORE UPDATE ON llm_simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_responses_updated_at 
  BEFORE UPDATE ON llm_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_performance_metrics_updated_at 
  BEFORE UPDATE ON model_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_statistics_updated_at 
  BEFORE UPDATE ON cache_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utility functions
-- =================

-- Function to calculate simulation progress
CREATE OR REPLACE FUNCTION get_simulation_progress(sim_id TEXT)
RETURNS TABLE (
  total_jobs INTEGER,
  completed_jobs INTEGER,
  failed_jobs INTEGER,
  progress_percentage INTEGER,
  estimated_remaining_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.total_jobs,
    s.completed_jobs,
    s.failed_jobs,
    CASE 
      WHEN s.total_jobs > 0 THEN ((s.completed_jobs + s.failed_jobs) * 100 / s.total_jobs)
      ELSE 0
    END as progress_percentage,
    CASE 
      WHEN s.completed_jobs > 0 AND s.estimated_completion_time IS NOT NULL THEN
        s.estimated_completion_time * (s.total_jobs - s.completed_jobs - s.failed_jobs) / s.completed_jobs
      ELSE s.estimated_completion_time
    END as estimated_remaining_time
  FROM llm_simulations s
  WHERE s.id = sim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get model performance summary
CREATE OR REPLACE FUNCTION get_model_performance_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  model_name TEXT,
  avg_success_rate DECIMAL,
  avg_latency_ms INTEGER,
  total_requests INTEGER,
  avg_cost_per_request DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.model_name,
    AVG(CASE WHEN m.total_requests > 0 THEN (m.successful_requests::DECIMAL / m.total_requests) * 100 ELSE 0 END) as avg_success_rate,
    AVG(m.avg_latency_ms)::INTEGER as avg_latency_ms,
    SUM(m.total_requests)::INTEGER as total_requests,
    CASE 
      WHEN SUM(m.total_requests) > 0 THEN (SUM(m.total_cost) / SUM(m.total_requests))
      ELSE 0
    END as avg_cost_per_request
  FROM model_performance_metrics m
  WHERE m.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY m.model_name
  ORDER BY avg_success_rate DESC, total_requests DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
-- =========================

COMMENT ON TABLE brand_contexts IS 'Stores brand information and context for LLM simulations';
COMMENT ON TABLE llm_simulations IS 'Tracks simulation batches with metadata and progress';
COMMENT ON TABLE llm_responses IS 'Primary storage for all LLM responses with full metadata';
COMMENT ON TABLE llm_jobs_audit IS 'Audit trail for job execution, retries, and debugging';
COMMENT ON TABLE model_performance_metrics IS 'Daily performance metrics per model for monitoring';
COMMENT ON TABLE cache_statistics IS 'Cache hit/miss statistics for optimization';

COMMENT ON FUNCTION get_simulation_progress IS 'Returns real-time progress for a simulation';
COMMENT ON FUNCTION get_model_performance_summary IS 'Returns performance summary across models';

-- Initial data for testing/development
-- ====================================

-- Insert some sample model performance data (optional, for development)
-- INSERT INTO model_performance_metrics (model_name, total_requests, successful_requests, avg_latency_ms, total_cost) VALUES
-- ('chatgpt-4o-latest', 100, 95, 12000, 0.05),
-- ('claude-3.5-sonnet', 80, 78, 15000, 0.04),
-- ('gemini-2.5-flash', 120, 115, 8000, 0.02),
-- ('sonar', 60, 58, 10000, 0.03)
-- ON CONFLICT (model_name, date) DO NOTHING;