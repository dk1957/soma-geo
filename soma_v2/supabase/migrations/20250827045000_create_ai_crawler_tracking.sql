-- Create AI Crawler Detection and Tracking Tables
-- This migration creates tables for advanced AI crawler tracking and content discoverability
-- Compatible with existing soma-geo platform schema

-- AI Crawlers registry with detailed specifications
CREATE TABLE IF NOT EXISTS public.ai_crawlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  user_agent_pattern TEXT NOT NULL,
  company TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'training', 'search', 'user_request'
  renders_javascript BOOLEAN DEFAULT false,
  official_ips JSONB DEFAULT '[]'::jsonb,
  robots_txt_token TEXT,
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawler visit logs with detailed tracking
CREATE TABLE IF NOT EXISTS public.crawler_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  crawler_id UUID REFERENCES public.ai_crawlers(id),
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,
  referer TEXT,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  response_size BIGINT,
  response_time_ms INTEGER,
  content_type TEXT,
  is_verified_crawler BOOLEAN DEFAULT false,
  geolocation JSONB, -- {country, region, city, lat, lng}
  request_headers JSONB DEFAULT '{}'::jsonb,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content fingerprints for tracking content usage
CREATE TABLE IF NOT EXISTS public.content_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL, -- unique identifier for the content
  url TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'article', 'product', 'documentation', etc.
  title TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- SHA-256 hash of content
  semantic_hash TEXT NOT NULL, -- embedding-based semantic fingerprint
  keywords TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '[]'::jsonb, -- extracted entities
  content_length INTEGER,
  language TEXT DEFAULT 'en',
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI model mentions tracking
CREATE TABLE IF NOT EXISTS public.ai_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  content_fingerprint_id UUID REFERENCES public.content_fingerprints(id),
  ai_model TEXT NOT NULL, -- 'gpt-4', 'claude-3', 'gemini-pro', etc.
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  mention_context TEXT, -- extracted context around the mention
  mention_type TEXT NOT NULL, -- 'direct_citation', 'paraphrase', 'reference'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  position_in_response INTEGER,
  source_attribution TEXT, -- if the AI attributed the source
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content optimization recommendations
CREATE TABLE IF NOT EXISTS public.content_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  content_fingerprint_id UUID REFERENCES public.content_fingerprints(id),
  optimization_type TEXT NOT NULL, -- 'ssr_missing', 'meta_incomplete', 'structured_data_missing'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  issue_description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  implementation_code TEXT, -- suggested code changes
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawler analytics aggregations
CREATE TABLE IF NOT EXISTS public.crawler_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  crawler_id UUID REFERENCES public.ai_crawlers(id),
  date DATE NOT NULL,
  total_visits INTEGER DEFAULT 0,
  unique_pages INTEGER DEFAULT 0,
  total_bytes BIGINT DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  status_codes JSONB DEFAULT '{}'::jsonb, -- {200: count, 404: count, etc}
  content_types JSONB DEFAULT '{}'::jsonb, -- {'text/html': count, etc}
  top_pages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, crawler_id, date)
);

-- Content submission tracking
CREATE TABLE IF NOT EXISTS public.content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  content_fingerprint_id UUID REFERENCES public.content_fingerprints(id),
  submission_type TEXT NOT NULL, -- 'sitemap', 'indexnow', 'direct_ping'
  target_crawler TEXT NOT NULL,
  submission_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  response_data JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crawler_visits_brand_crawler ON public.crawler_visits(brand_id, crawler_id);
CREATE INDEX IF NOT EXISTS idx_crawler_visits_url ON public.crawler_visits(url);
CREATE INDEX IF NOT EXISTS idx_crawler_visits_visited_at ON public.crawler_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_crawler_visits_ip ON public.crawler_visits(ip_address);

CREATE INDEX IF NOT EXISTS idx_content_fingerprints_brand ON public.content_fingerprints(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_hash ON public.content_fingerprints(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_semantic ON public.content_fingerprints(semantic_hash);

CREATE INDEX IF NOT EXISTS idx_ai_mentions_brand ON public.ai_mentions(brand_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentions_model ON public.ai_mentions(ai_model);
CREATE INDEX IF NOT EXISTS idx_ai_mentions_detected_at ON public.ai_mentions(detected_at);

CREATE INDEX IF NOT EXISTS idx_crawler_analytics_brand_date ON public.crawler_analytics(brand_id, date);
CREATE INDEX IF NOT EXISTS idx_content_optimizations_brand ON public.content_optimizations(brand_id);

-- Insert known AI crawlers (only if they don't exist)
INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'GPTBot', 'GPTBot/1\\.\\d+', 'OpenAI', 'training', false, 'GPTBot', 'https://openai.com/gptbot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'GPTBot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'OAI-SearchBot', 'OAI-SearchBot/1\\.\\d+', 'OpenAI', 'search', false, 'OAI-SearchBot', 'https://openai.com/searchbot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'OAI-SearchBot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'ChatGPT-User', 'ChatGPT-User/1\\.\\d+', 'OpenAI', 'user_request', false, 'ChatGPT-User', 'https://openai.com/bot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'ChatGPT-User');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'ClaudeBot', 'ClaudeBot/1\\.\\d+', 'Anthropic', 'training', false, 'ClaudeBot', 'https://support.anthropic.com/en/articles/8896518'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'ClaudeBot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Claude-Web', 'Claude-Web/1\\.\\d+', 'Anthropic', 'user_request', false, 'Claude-Web', 'https://support.anthropic.com/en/articles/8896518'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Claude-Web');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'PerplexityBot', 'PerplexityBot/1\\.\\d+', 'Perplexity', 'search', false, 'PerplexityBot', 'https://docs.perplexity.ai/docs/perplexitybot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'PerplexityBot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Bytespider', 'Bytespider/1\\.\\d+', 'ByteDance', 'training', false, 'Bytespider', 'https://zhanzhang.toutiao.com/page/robot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Bytespider');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Meta-ExternalAgent', 'Meta-ExternalAgent/1\\.\\d+', 'Meta', 'training', false, 'Meta-ExternalAgent', 'https://developers.facebook.com/docs/sharing/bot/'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Meta-ExternalAgent');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'CCBot', 'CCBot/2\\.\\d+', 'Common Crawl', 'training', false, 'CCBot', 'https://commoncrawl.org/ccbot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'CCBot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Applebot', 'Applebot/\\d+\\.\\d+', 'Apple', 'search', true, 'Applebot', 'https://support.apple.com/en-us/HT204683'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Applebot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Googlebot', 'Googlebot/2\\.1', 'Google', 'search', true, 'Googlebot', 'https://developers.google.com/search/docs/crawling-indexing/googlebot'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Googlebot');

INSERT INTO public.ai_crawlers (name, user_agent_pattern, company, purpose, renders_javascript, robots_txt_token, documentation_url) 
SELECT 'Bingbot', 'bingbot/2\\.\\d+', 'Microsoft', 'search', true, 'Bingbot', 'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_crawlers WHERE name = 'Bingbot');

-- Enable RLS (only if not already enabled)
DO $$ 
BEGIN
  -- Check and enable RLS on tables if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ai_crawlers' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ai_crawlers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'crawler_visits' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.crawler_visits ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'content_fingerprints' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.content_fingerprints ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ai_mentions' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ai_mentions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'content_optimizations' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.content_optimizations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'crawler_analytics' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.crawler_analytics ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'content_submissions' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies (only create if they don't exist)
DO $$
BEGIN
  -- ai_crawlers policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'ai_crawlers_select' 
    AND tablename = 'ai_crawlers'
  ) THEN
    CREATE POLICY "ai_crawlers_select" ON public.ai_crawlers FOR SELECT USING (true);
  END IF;

  -- crawler_visits policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'crawler_visits_select' 
    AND tablename = 'crawler_visits'
  ) THEN
    CREATE POLICY "crawler_visits_select" ON public.crawler_visits FOR SELECT 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'crawler_visits_insert' 
    AND tablename = 'crawler_visits'
  ) THEN
    CREATE POLICY "crawler_visits_insert" ON public.crawler_visits FOR INSERT 
    WITH CHECK (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  -- content_fingerprints policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'content_fingerprints_all' 
    AND tablename = 'content_fingerprints'
  ) THEN
    CREATE POLICY "content_fingerprints_all" ON public.content_fingerprints FOR ALL 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  -- ai_mentions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'ai_mentions_all' 
    AND tablename = 'ai_mentions'
  ) THEN
    CREATE POLICY "ai_mentions_all" ON public.ai_mentions FOR ALL 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  -- content_optimizations policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'content_optimizations_all' 
    AND tablename = 'content_optimizations'
  ) THEN
    CREATE POLICY "content_optimizations_all" ON public.content_optimizations FOR ALL 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  -- crawler_analytics policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'crawler_analytics_all' 
    AND tablename = 'crawler_analytics'
  ) THEN
    CREATE POLICY "crawler_analytics_all" ON public.crawler_analytics FOR ALL 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;

  -- content_submissions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'content_submissions_all' 
    AND tablename = 'content_submissions'
  ) THEN
    CREATE POLICY "content_submissions_all" ON public.content_submissions FOR ALL 
    USING (
      brand_id IN (
        SELECT bm.brand_id FROM public.brand_managers bm WHERE bm.user_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b 
        JOIN public.accounts a ON b.account_id = a.id 
        WHERE a.owner_id = auth.uid()
        UNION
        SELECT b.id FROM public.brands b
        JOIN public.account_users au ON b.account_id = au.account_id
        WHERE au.user_id = auth.uid() AND au.is_active = true
      )
    );
  END IF;
END $$;