-- Create tables for Rapid Discoverability Optimization feature
-- Migration: 20250829000001_rapid_discoverability_optimization.sql

-- Table for storing AI-optimized content
CREATE TABLE IF NOT EXISTS optimized_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content metadata
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('faq', 'guide', 'comparison', 'review', 'case-study', 'all')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'published', 'publishing_failed', 'archived')),
  
  -- Content data
  markdown_content TEXT NOT NULL,
  json_ld_schema JSONB,
  meta_tags JSONB,
  key_phrases TEXT[],
  co_occurrence_targets TEXT[],
  distribution_channels TEXT[],
  target_queries TEXT[],
  
  -- Publishing info
  published_at TIMESTAMPTZ,
  published_urls TEXT[],
  
  -- Performance metrics
  estimated_impact_score INTEGER DEFAULT 0 CHECK (estimated_impact_score >= 0 AND estimated_impact_score <= 100),
  actual_performance_score INTEGER CHECK (actual_performance_score >= 0 AND actual_performance_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for tracking content publications/campaigns
CREATE TABLE IF NOT EXISTS content_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Publication metadata
  content_ids UUID[] NOT NULL,
  channels TEXT[] NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  
  -- Results data
  results JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for dynamic content endpoints
CREATE TABLE IF NOT EXISTS dynamic_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES optimized_content(id) ON DELETE CASCADE,
  
  -- Endpoint info
  path TEXT NOT NULL UNIQUE,
  markdown_content TEXT NOT NULL,
  json_ld_schema JSONB,
  meta_tags JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  last_crawled_at TIMESTAMPTZ,
  crawl_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for sitemap management
CREATE TABLE IF NOT EXISTS sitemap_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES optimized_content(id) ON DELETE CASCADE,
  
  -- Sitemap data
  url TEXT NOT NULL UNIQUE,
  priority DECIMAL(2,1) NOT NULL DEFAULT 0.5 CHECK (priority >= 0.0 AND priority <= 1.0),
  changefreq TEXT NOT NULL DEFAULT 'weekly' CHECK (changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
  lastmod TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- AI crawling metadata
  ai_crawl_priority TEXT DEFAULT 'medium' CHECK (ai_crawl_priority IN ('high', 'medium', 'low')),
  ai_indexed BOOLEAN DEFAULT FALSE,
  ai_last_crawled TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_optimized_content_brand_id ON optimized_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_optimized_content_user_id ON optimized_content(user_id);
CREATE INDEX IF NOT EXISTS idx_optimized_content_status ON optimized_content(status);
CREATE INDEX IF NOT EXISTS idx_optimized_content_priority ON optimized_content(priority);
CREATE INDEX IF NOT EXISTS idx_optimized_content_created_at ON optimized_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_publications_user_id ON content_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_content_publications_status ON content_publications(status);
CREATE INDEX IF NOT EXISTS idx_content_publications_created_at ON content_publications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dynamic_endpoints_content_id ON dynamic_endpoints(content_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_endpoints_path ON dynamic_endpoints(path);
CREATE INDEX IF NOT EXISTS idx_dynamic_endpoints_status ON dynamic_endpoints(status);

CREATE INDEX IF NOT EXISTS idx_sitemap_entries_content_id ON sitemap_entries(content_id);
CREATE INDEX IF NOT EXISTS idx_sitemap_entries_url ON sitemap_entries(url);
CREATE INDEX IF NOT EXISTS idx_sitemap_entries_priority ON sitemap_entries(priority DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE optimized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_entries ENABLE ROW LEVEL SECURITY;

-- Policies for optimized_content
CREATE POLICY "Users can view their own optimized content" ON optimized_content
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own optimized content" ON optimized_content
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own optimized content" ON optimized_content
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own optimized content" ON optimized_content
  FOR DELETE USING (user_id = auth.uid());

-- Policies for content_publications
CREATE POLICY "Users can view their own publications" ON content_publications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own publications" ON content_publications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own publications" ON content_publications
  FOR UPDATE USING (user_id = auth.uid());

-- Policies for dynamic_endpoints (linked to content ownership)
CREATE POLICY "Users can view endpoints for their content" ON dynamic_endpoints
  FOR SELECT USING (
    content_id IN (
      SELECT id FROM optimized_content WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create endpoints for their content" ON dynamic_endpoints
  FOR INSERT WITH CHECK (
    content_id IN (
      SELECT id FROM optimized_content WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update endpoints for their content" ON dynamic_endpoints
  FOR UPDATE USING (
    content_id IN (
      SELECT id FROM optimized_content WHERE user_id = auth.uid()
    )
  );

-- Policies for sitemap_entries (linked to content ownership)
CREATE POLICY "Users can view sitemap entries for their content" ON sitemap_entries
  FOR SELECT USING (
    content_id IN (
      SELECT id FROM optimized_content WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sitemap entries for their content" ON sitemap_entries
  FOR INSERT WITH CHECK (
    content_id IN (
      SELECT id FROM optimized_content WHERE user_id = auth.uid()
    )
  );

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_optimized_content_updated_at BEFORE UPDATE ON optimized_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_publications_updated_at BEFORE UPDATE ON content_publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_endpoints_updated_at BEFORE UPDATE ON dynamic_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sitemap_entries_updated_at BEFORE UPDATE ON sitemap_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();