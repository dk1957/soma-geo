-- Migration: Create System Prompts and Simulation Config Tables
-- Purpose: Store configurable system prompts and simulation settings for admin management

-- ============================================
-- System Prompts Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_type VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_prompts_type ON public.system_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON public.system_prompts(is_active);

-- RLS Policies for system_prompts (admin only)
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Only allow read access (updates via service role in API)
CREATE POLICY "Allow read access for authenticated users"
    ON public.system_prompts
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- Simulation Config Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.simulation_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    concurrency_limit INTEGER DEFAULT 3 CHECK (concurrency_limit >= 1 AND concurrency_limit <= 20),
    timeout_ms INTEGER DEFAULT 120000 CHECK (timeout_ms >= 10000 AND timeout_ms <= 300000),
    temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 8000 CHECK (max_tokens >= 100 AND max_tokens <= 32000),
    default_period_days INTEGER DEFAULT 30 CHECK (default_period_days >= 1 AND default_period_days <= 365),
    retry_attempts INTEGER DEFAULT 3 CHECK (retry_attempts >= 0 AND retry_attempts <= 10),
    retry_delay_ms INTEGER DEFAULT 1000 CHECK (retry_delay_ms >= 100 AND retry_delay_ms <= 60000),
    rate_limit_rpm INTEGER DEFAULT 100 CHECK (rate_limit_rpm >= 1 AND rate_limit_rpm <= 1000),
    cost_tracking_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active config at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulation_config_active 
    ON public.simulation_config(is_active) 
    WHERE is_active = true;

-- RLS Policies for simulation_config (admin only)
ALTER TABLE public.simulation_config ENABLE ROW LEVEL SECURITY;

-- Only allow read access (updates via service role in API)
CREATE POLICY "Allow read access for authenticated users"
    ON public.simulation_config
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- Insert Default Prompts
-- ============================================
INSERT INTO public.system_prompts (prompt_type, name, description, content, variables, is_active, version)
VALUES 
(
    'consumer_simulation',
    'Consumer Simulation Prompt',
    'System prompt used when querying AI models to simulate consumer behavior. This prompt instructs models how to respond as their consumer-facing versions.',
    E'You are {model_name}. Respond exactly as you would in your consumer application.{location_context}\n\nCRITICAL INSTRUCTIONS:\n1. ANSWER DIRECTLY: Start with the answer immediately. No "Based on my search" or "Here is what I found".\n2. CITE EVERYTHING: Use inline citations [1], [2] for every fact.\n3. STRUCTURE: Use Markdown. ## Headings, **Bold** for key terms, and numbered lists.\n4. NO FLUFF: Be concise. No filler sentences.\n5. SOURCES: End with a "Sources" section listing full URLs.\n\nFORMAT:\n## Direct Answer\n[Concise direct answer to the query]\n\n## Key Insights\n1. **[Point 1]**: [Details] [1]\n2. **[Point 2]**: [Details] [2]\n\n## Sources\n[1] [Source Title](URL)\n[2] [Source Title](URL)',
    '["model_name", "location_context"]'::JSONB,
    true,
    1
),
(
    'response_analysis',
    'Response Analysis Prompt',
    'System prompt used to analyze LLM responses for brand mentions, sentiment, positioning, and competitor analysis.',
    E'You are an expert brand analyst. Analyze the following AI response for brand visibility metrics.\n\nANALYSIS TASKS:\n1. BRAND DETECTION: Identify all brand mentions (primary and competitors)\n2. POSITIONING: Determine where each brand appears (1st, 2nd, etc.)\n3. SENTIMENT: Rate sentiment toward each brand (-1 to +1)\n4. SOURCES: Extract all cited sources and URLs\n5. TOPICS: Identify main topics and themes\n\nOUTPUT FORMAT (JSON):\n{\n  "brands_mentioned": [\n    {"name": "", "position": 0, "sentiment": 0, "context": ""}\n  ],\n  "sources": [\n    {"url": "", "domain": "", "title": ""}\n  ],\n  "topics": [],\n  "overall_sentiment": 0,\n  "confidence": 0\n}',
    '[]'::JSONB,
    true,
    1
),
(
    'prompt_generation',
    'Smart Prompt Generation',
    'System prompt used to generate intelligent discovery prompts for brands based on their context and industry.',
    E'You are a consumer behavior expert specializing in AI search patterns. Generate realistic search prompts that consumers would ask AI assistants.\n\nBRAND CONTEXT:\n- Brand: {brand_name}\n- Industry: {industry}\n- Products/Services: {products_services}\n- Target Markets: {target_markets}\n- Competitors: {competitors}\n\nREQUIREMENTS:\n1. Generate {count} diverse prompts\n2. Mix of branded (mention brand) and discovery (don''t mention brand) prompts\n3. Include comparison, recommendation, and information-seeking queries\n4. Reflect real consumer search behavior\n5. Cover different stages of buyer journey\n\nOUTPUT FORMAT (JSON array):\n[\n  {"text": "", "type": "branded|discovery", "intent": "", "journey_stage": ""}\n]',
    '["brand_name", "industry", "products_services", "target_markets", "competitors", "count"]'::JSONB,
    true,
    1
),
(
    'brand_research',
    'Brand Research Prompt',
    'System prompt used for comprehensive brand research and competitive intelligence gathering.',
    E'You are a brand research specialist. Research and compile comprehensive information about the following brand.\n\nRESEARCH OBJECTIVES:\n1. Company overview and history\n2. Products/services offered\n3. Target audience and markets\n4. Key competitors\n5. Brand positioning and messaging\n6. Recent news and developments\n\nProvide factual, well-sourced information. Include URLs where available.',
    '[]'::JSONB,
    true,
    1
)
ON CONFLICT (prompt_type) DO NOTHING;

-- ============================================
-- Insert Default Simulation Config
-- ============================================
INSERT INTO public.simulation_config (
    concurrency_limit,
    timeout_ms,
    temperature,
    max_tokens,
    default_period_days,
    retry_attempts,
    retry_delay_ms,
    rate_limit_rpm,
    cost_tracking_enabled,
    is_active
)
VALUES (
    6,       -- concurrency_limit
    120000,  -- timeout_ms (2 minutes)
    0.2,     -- temperature
    400,     -- max_tokens
    30,      -- default_period_days
    2,       -- retry_attempts
    1000,    -- retry_delay_ms
    60,      -- rate_limit_rpm
    true,    -- cost_tracking_enabled
    true     -- is_active
)
ON CONFLICT DO NOTHING;

-- ============================================
-- Web Search Configuration Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_search_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    web_search_enabled BOOLEAN DEFAULT true,
    search_engine VARCHAR(50) DEFAULT 'auto' CHECK (search_engine IN ('auto', 'native', 'exa')),
    max_results INTEGER DEFAULT 5 CHECK (max_results >= 1 AND max_results <= 10),
    search_context_size VARCHAR(20) DEFAULT 'medium' CHECK (search_context_size IN ('low', 'medium', 'high')),
    use_online_suffix BOOLEAN DEFAULT false,
    use_responses_api BOOLEAN DEFAULT true,
    custom_search_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_web_search_config_model ON public.web_search_config(model_id);
CREATE INDEX IF NOT EXISTS idx_web_search_config_active ON public.web_search_config(is_active);

-- RLS Policies for web_search_config (admin only)
ALTER TABLE public.web_search_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
    ON public.web_search_config
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- Insert Default Web Search Configurations
-- ============================================
INSERT INTO public.web_search_config (model_id, provider, web_search_enabled, search_engine, max_results, search_context_size, use_online_suffix, use_responses_api, custom_search_prompt)
VALUES 
-- OpenAI models - native search support
('openai/gpt-4o', 'openai', true, 'native', 5, 'medium', false, true, NULL),
('openai/gpt-4o-mini', 'openai', true, 'native', 5, 'medium', false, true, NULL),
('openai/gpt-4-turbo', 'openai', true, 'native', 5, 'medium', false, true, NULL),

-- Anthropic models - native search support  
('anthropic/claude-3.5-sonnet', 'anthropic', true, 'native', 5, 'medium', false, true, NULL),
('anthropic/claude-3-opus', 'anthropic', true, 'native', 5, 'medium', false, true, NULL),
('anthropic/claude-3-sonnet', 'anthropic', true, 'native', 5, 'medium', false, true, NULL),

-- Perplexity models - native search (built-in)
('perplexity/sonar-reasoning', 'perplexity', true, 'native', 5, 'high', false, true, NULL),
('perplexity/sonar', 'perplexity', true, 'native', 5, 'high', false, true, NULL),
('perplexity/sonar-pro', 'perplexity', true, 'native', 5, 'high', false, true, NULL),

-- xAI (Grok) models - native search support
('x-ai/grok-2-vision-1212', 'x-ai', true, 'native', 5, 'medium', false, true, NULL),
('x-ai/grok-2', 'x-ai', true, 'native', 5, 'medium', false, true, NULL),

-- Google models - use Exa for search (no native support via OpenRouter)
('google/gemini-flash-1.5', 'google', true, 'exa', 5, 'medium', true, false, NULL),
('google/gemini-pro-1.5', 'google', true, 'exa', 5, 'medium', true, false, NULL),
('google/gemini-2.0-flash-exp', 'google', true, 'exa', 5, 'medium', true, false, NULL),

-- Meta Llama models - use Exa for search (no native support)
('meta-llama/llama-3.3-70b-instruct', 'meta', true, 'exa', 5, 'medium', true, false, NULL),
('meta-llama/llama-3.1-405b-instruct', 'meta', true, 'exa', 5, 'medium', true, false, NULL),

-- Mistral models - use Exa for search
('mistralai/mistral-large', 'mistral', true, 'exa', 5, 'medium', true, false, NULL)
ON CONFLICT (model_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.system_prompts IS 'Stores configurable system prompts for LLM simulations and analysis';
COMMENT ON TABLE public.simulation_config IS 'Stores global simulation configuration settings';
COMMENT ON TABLE public.web_search_config IS 'Stores web search configuration per LLM model for OpenRouter integration';
