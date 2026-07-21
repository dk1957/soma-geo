-- Migration: Add Web Search Configuration
-- Purpose: Store web search settings for each LLM model

-- ============================================
-- Web Search Config Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_search_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL UNIQUE,
    model_name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    engine VARCHAR(50) DEFAULT 'auto' CHECK (engine IN ('auto', 'native', 'exa')),
    max_results INTEGER DEFAULT 5 CHECK (max_results >= 1 AND max_results <= 10),
    search_context_size VARCHAR(20) DEFAULT 'medium' CHECK (search_context_size IN ('low', 'medium', 'high')),
    search_prompt TEXT,
    use_online_suffix BOOLEAN DEFAULT false,
    supports_native_search BOOLEAN DEFAULT false,
    cost_per_search NUMERIC(10,6) DEFAULT 0.02,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_web_search_config_model_id ON public.web_search_config(model_id);
CREATE INDEX IF NOT EXISTS idx_web_search_config_enabled ON public.web_search_config(enabled);
CREATE INDEX IF NOT EXISTS idx_web_search_config_active ON public.web_search_config(is_active);

-- RLS Policies for web_search_config (admin only)
ALTER TABLE public.web_search_config ENABLE ROW LEVEL SECURITY;

-- Only allow read access (updates via service role in API)
CREATE POLICY "Allow read access for authenticated users"
    ON public.web_search_config
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- Insert Default Web Search Configurations
-- ============================================

-- Growth Plan Models
INSERT INTO public.web_search_config (
    model_id, model_name, enabled, engine, max_results, search_context_size, 
    use_online_suffix, supports_native_search, cost_per_search, notes
) VALUES 
(
    'x-ai/grok-2-vision-1212',
    'X AI (Grok)',
    true,
    'native',
    5,
    'medium',
    false,
    true,
    0.02,
    'xAI Grok supports native web search with real-time X platform access'
),
(
    'google/gemini-flash-1.5',
    'Google (Gemini)',
    true,
    'native',
    5,
    'medium',
    false,
    true,
    0.02,
    'Google Gemini has built-in Google Search integration'
),
(
    'openai/gpt-4o',
    'OpenAI (GPT)',
    true,
    'native',
    5,
    'medium',
    true,
    true,
    0.05,
    'OpenAI GPT-4o supports web search via :online suffix or native search'
),

-- Pro Plan Models
(
    'perplexity/sonar-reasoning',
    'Perplexity (Sonar)',
    true,
    'native',
    5,
    'high',
    false,
    true,
    0.02,
    'Perplexity Sonar is specialized for deep research with built-in search'
),

-- Enterprise Plan Models
(
    'meta-llama/llama-3.3-70b-instruct',
    'Meta (Llama)',
    true,
    'exa',
    5,
    'medium',
    false,
    false,
    0.02,
    'Meta Llama uses Exa search for web results'
),
(
    'anthropic/claude-3.5-sonnet',
    'Anthropic (Claude)',
    true,
    'native',
    5,
    'medium',
    false,
    true,
    0.03,
    'Claude 3.5 Sonnet supports native web search'
)
ON CONFLICT (model_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.web_search_config IS 'Stores web search configuration for each LLM model including engine, max_results, and search_context_size';
