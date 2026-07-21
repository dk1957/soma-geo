-- =====================================================
-- System Configuration Tables
-- =====================================================
-- Purpose: Enable dynamic configuration of LLM models and system settings
-- without requiring code changes. Allows admin to manage models, agents,
-- and plan limits through the admin UI.

-- System-wide configuration key-value store
CREATE TABLE IF NOT EXISTS public.system_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL, -- 'models', 'features', 'limits', etc.
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- LLM Model configurations (replaces hardcoded AVAILABLE_MODELS)
CREATE TABLE IF NOT EXISTS public.llm_model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text UNIQUE NOT NULL, -- e.g., 'grok', 'gemini'
  name text NOT NULL,
  provider text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('growth', 'pro', 'enterprise')),
  openrouter_id text NOT NULL,
  description text,
  max_tokens integer NOT NULL DEFAULT 4000,
  temperature numeric(3,2) NOT NULL DEFAULT 0.0,
  supports_search boolean DEFAULT true,
  supports_reasoning boolean DEFAULT true,
  supports_citations boolean DEFAULT true,
  rate_limit_rpm integer NOT NULL DEFAULT 30,
  timeout_ms integer NOT NULL DEFAULT 30000,
  cost_per_token numeric(10,8) NOT NULL DEFAULT 0.000001,
  consumer_behavior text NOT NULL DEFAULT 'direct_and_factual',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent model configurations (for MACO, research agent, etc.)
CREATE TABLE IF NOT EXISTS public.agent_model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text NOT NULL, -- 'maco_evaluator', 'maco_analyst', 'research_primary', etc.
  model_id text NOT NULL, -- OpenRouter model ID
  provider text NOT NULL CHECK (provider IN ('openai', 'groq', 'openrouter')),
  temperature numeric(3,2) NOT NULL DEFAULT 0.1,
  max_tokens integer DEFAULT 2000,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_type)
);

-- Plan limits configuration
CREATE TABLE IF NOT EXISTS public.plan_model_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_slug text NOT NULL, -- 'growth', 'pro', 'enterprise'
  max_models integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON public.system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_active ON public.system_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_tier ON public.llm_model_configs(tier);
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_active ON public.llm_model_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_sort ON public.llm_model_configs(sort_order);
CREATE INDEX IF NOT EXISTS idx_agent_model_configs_type ON public.agent_model_configs(agent_type);

-- Enable RLS
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_model_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only write, public read for active configs)
CREATE POLICY "Public read access for active system configs"
  ON public.system_configurations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for active LLM models"
  ON public.llm_model_configs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for agent configs"
  ON public.agent_model_configs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for plan limits"
  ON public.plan_model_limits FOR SELECT
  USING (true);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access to system configs"
  ON public.system_configurations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to LLM models"
  ON public.llm_model_configs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to agent configs"
  ON public.agent_model_configs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to plan limits"
  ON public.plan_model_limits FOR ALL
  USING (auth.role() = 'service_role');

-- Seed data: LLM Model Configurations (from hardcoded AVAILABLE_MODELS)
INSERT INTO public.llm_model_configs (model_id, name, provider, tier, openrouter_id, description, max_tokens, temperature, supports_search, supports_reasoning, supports_citations, rate_limit_rpm, timeout_ms, cost_per_token, consumer_behavior, sort_order) VALUES
  ('grok', 'X AI (Grok)', 'x-ai', 'growth', 'x-ai/grok-2-vision-1212', 'High-speed model with real-time X platform access', 4000, 0.0, true, true, true, 20, 30000, 0.000005, 'direct_and_factual', 1),
  ('gemini', 'Google (Gemini)', 'google', 'growth', 'google/gemini-flash-1.5', 'Fast, multimodal model with Google Search integration', 4000, 0.0, true, true, true, 40, 30000, 0.0000003, 'comprehensive_with_sources', 2),
  ('gpt', 'OpenAI (GPT)', 'openai', 'growth', 'openai/gpt-4o', 'Advanced reasoning and general knowledge', 4000, 0.0, true, false, true, 30, 30000, 0.0000025, 'search_and_synthesize', 3),
  ('sonar', 'Perplexity (Sonar)', 'perplexity', 'pro', 'perplexity/sonar-reasoning', 'Specialized for deep research and citations', 4000, 0.0, true, true, true, 30, 45000, 0.000001, 'detailed_analysis', 4),
  ('llama', 'Meta (Llama)', 'meta', 'enterprise', 'meta-llama/llama-3.3-70b-instruct', 'Open-source leader with strong reasoning', 4000, 0.0, true, true, true, 30, 30000, 0.0000004, 'detailed_analysis', 5),
  ('claude', 'Anthropic (Claude)', 'anthropic', 'enterprise', 'anthropic/claude-3.5-sonnet', 'Nuanced understanding and high-quality writing', 4000, 0.0, true, true, true, 30, 30000, 0.000003, 'detailed_analysis', 6)
ON CONFLICT (model_id) DO NOTHING;

-- Seed data: Agent Model Configurations
INSERT INTO public.agent_model_configs (agent_type, model_id, provider, temperature, max_tokens) VALUES
  ('maco_evaluator', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.1, 2000),
  ('maco_analyst', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.6, 2000),
  ('maco_editor', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.3, 2000),
  ('maco_selector', 'meta-llama/llama-3.3-70b-instruct', 'openrouter', 0.2, 2000),
  ('research_primary', 'anthropic/claude-3-haiku', 'openrouter', 0.7, 2000),
  ('research_cheap', 'google/gemini-flash-1.5', 'openrouter', 0.9, 1500),
  ('prompt_generation', 'google/gemini-flash-1.5', 'openrouter', 0.9, 1500)
ON CONFLICT (agent_type) DO NOTHING;

-- Seed data: Plan Model Limits
INSERT INTO public.plan_model_limits (plan_slug, max_models) VALUES
  ('growth', 3),
  ('pro', 4),
  ('enterprise', 6)
ON CONFLICT (plan_slug) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON public.system_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_llm_model_configs_updated_at BEFORE UPDATE ON public.llm_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_model_configs_updated_at BEFORE UPDATE ON public.agent_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plan_model_limits_updated_at BEFORE UPDATE ON public.plan_model_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
