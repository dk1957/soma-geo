-- ============================================================================
-- SOURCE AUTHORITY NETWORK (SAN) & CITATION TRACKING
-- ============================================================================
-- Date: 2025-11-29
-- Purpose: Create comprehensive source/citation tracking for AI visibility
-- 
-- Philosophy:
-- - Track EVERY citation from EVERY LLM response across ALL models
-- - Build a "Source Graph" of which domains AI models trust
-- - Enable Source Authority Potential (SAP) scoring to recommend where to publish
-- - Support multi-tenant (account/brand) data isolation
-- - Enable competitive analysis: "What sources do AI cite for competitors?"
-- ============================================================================

-- ============================================================================
-- TABLE 1: source_domains (Source Graph)
-- ============================================================================
-- Master registry of all domains ever cited by AI models.
-- This is the "Source Authority Network" - a curated network of sites.
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Domain identification
  domain VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'forbes.com', 'reddit.com'
  normalized_domain VARCHAR(255) NOT NULL, -- Stripped www., lowercase
  tld VARCHAR(50), -- Top-level domain: 'com', 'org', 'co.uk'
  
  -- Classification & Category
  source_type VARCHAR(50) NOT NULL DEFAULT 'other', 
  -- ENUM: 'editorial', 'ugc', 'reference', 'institutional', 'corporate', 'news', 'academic', 'government', 'social', 'forum', 'blog', 'ecommerce', 'other'
  
  category VARCHAR(100), -- e.g., 'technology', 'business', 'health', 'finance'
  subcategory VARCHAR(100), -- e.g., 'saas', 'fintech', 'healthcare_tech'
  
  -- Authority & Trust Metrics (Updated by cron/triggers)
  trust_score NUMERIC(5,2) DEFAULT 0, -- 0-100 composite score
  authority_score NUMERIC(5,2) DEFAULT 0, -- Domain authority estimate
  citation_velocity NUMERIC(8,2) DEFAULT 0, -- Citations per week
  ai_trust_index NUMERIC(5,2) DEFAULT 0, -- How much AI models "trust" this source
  
  -- Citation Statistics (Aggregated)
  total_citations INTEGER DEFAULT 0,
  unique_urls_cited INTEGER DEFAULT 0,
  unique_brands_citing INTEGER DEFAULT 0,
  unique_models_citing INTEGER DEFAULT 0,
  citations_last_7d INTEGER DEFAULT 0,
  citations_last_30d INTEGER DEFAULT 0,
  citations_last_90d INTEGER DEFAULT 0,
  
  -- Model-specific citation counts (which AI models cite this domain)
  model_citation_breakdown JSONB DEFAULT '{}'::jsonb,
  -- { "openai/gpt-4o": 150, "anthropic/claude-3.5": 120, "perplexity/sonar": 200 }
  
  -- Topic coverage (what topics does AI cite this domain for?)
  topic_coverage JSONB DEFAULT '[]'::jsonb,
  -- [{"topic": "pricing", "count": 50, "avg_position": 2.3}, ...]
  
  -- Geographic coverage
  geo_coverage TEXT[] DEFAULT '{}', -- ['US', 'UK', 'UAE', 'MENA']
  language_coverage TEXT[] DEFAULT '{}', -- ['en', 'ar', 'de']
  
  -- Policy & Technical flags
  has_robots_txt BOOLEAN DEFAULT true,
  allows_ai_crawling BOOLEAN DEFAULT true,
  has_google_extended_opt_out BOOLEAN DEFAULT false,
  has_training_opt_out BOOLEAN DEFAULT false,
  has_sitemap BOOLEAN,
  https_enabled BOOLEAN DEFAULT true,
  
  -- Submission pathways (for SAN curated network)
  accepts_guest_posts BOOLEAN DEFAULT false,
  accepts_press_releases BOOLEAN DEFAULT false,
  has_contributor_program BOOLEAN DEFAULT false,
  submission_url TEXT,
  editorial_contact TEXT,
  submission_guidelines JSONB DEFAULT '{}'::jsonb,
  
  -- Ownership & Relationship
  is_owned_by_brand BOOLEAN DEFAULT false, -- Does a tracked brand own this domain?
  owner_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  is_competitor_owned BOOLEAN DEFAULT false,
  competitor_brand_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
  
  -- Partnership status (for SAN growth strategy)
  partnership_status VARCHAR(50) DEFAULT 'none', -- 'none', 'prospect', 'contacted', 'negotiating', 'active', 'inactive'
  partnership_notes TEXT,
  
  -- Metadata
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_metrics_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for source_domains
CREATE INDEX idx_source_domains_domain ON source_domains(domain);
CREATE INDEX idx_source_domains_normalized ON source_domains(normalized_domain);
CREATE INDEX idx_source_domains_type ON source_domains(source_type);
CREATE INDEX idx_source_domains_category ON source_domains(category);
CREATE INDEX idx_source_domains_trust ON source_domains(trust_score DESC);
CREATE INDEX idx_source_domains_citations ON source_domains(total_citations DESC);
CREATE INDEX idx_source_domains_owner ON source_domains(owner_brand_id) WHERE owner_brand_id IS NOT NULL;
CREATE INDEX idx_source_domains_last_seen ON source_domains(last_seen DESC);
CREATE INDEX idx_source_domains_geo_gin ON source_domains USING gin(geo_coverage);
CREATE INDEX idx_source_domains_topic_gin ON source_domains USING gin(topic_coverage);
CREATE INDEX idx_source_domains_model_gin ON source_domains USING gin(model_citation_breakdown);

-- ============================================================================
-- TABLE 2: source_urls (Individual URL Tracking)
-- ============================================================================
-- Track individual URLs that have been cited.
-- Enables URL-level analysis: which specific articles/pages get cited?
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Domain relationship
  domain_id UUID NOT NULL REFERENCES source_domains(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL, -- Denormalized for query performance
  
  -- URL details
  url TEXT NOT NULL,
  url_hash VARCHAR(64) NOT NULL, -- SHA256 hash for uniqueness
  path TEXT, -- URL path without domain
  
  -- Content metadata
  title TEXT,
  description TEXT,
  content_type VARCHAR(50), -- 'article', 'product_page', 'blog_post', 'forum_post', 'documentation'
  publish_date TIMESTAMP WITH TIME ZONE,
  author VARCHAR(255),
  
  -- Citation statistics
  total_citations INTEGER DEFAULT 0,
  citations_by_model JSONB DEFAULT '{}'::jsonb,
  citations_by_brand JSONB DEFAULT '{}'::jsonb,
  avg_citation_position NUMERIC(5,2),
  
  -- Topic association
  topics TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Timestamps
  first_cited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_cited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT source_urls_url_hash_unique UNIQUE (url_hash)
);

-- Indexes for source_urls
CREATE INDEX idx_source_urls_domain ON source_urls(domain_id);
CREATE INDEX idx_source_urls_url_hash ON source_urls(url_hash);
CREATE INDEX idx_source_urls_citations ON source_urls(total_citations DESC);
CREATE INDEX idx_source_urls_last_cited ON source_urls(last_cited DESC);
CREATE INDEX idx_source_urls_topics_gin ON source_urls USING gin(topics);
CREATE INDEX idx_source_urls_keywords_gin ON source_urls USING gin(keywords);

-- ============================================================================
-- TABLE 3: response_citations (Citation Event Log)
-- ============================================================================
-- Every citation from every LLM response.
-- This is the raw citation data that feeds all aggregations.
-- Links to: llm_simulation_responses, source_domains, source_urls, brands
-- ============================================================================

CREATE TABLE IF NOT EXISTS response_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Response linkage
  response_id TEXT NOT NULL, -- References llm_simulation_responses(id)
  simulation_id TEXT,
  prompt_id TEXT,
  
  -- Multi-tenant context
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Model context
  model_name TEXT NOT NULL,
  model_provider TEXT,
  
  -- Source linkage (populated after domain/URL lookup/creation)
  domain_id UUID REFERENCES source_domains(id) ON DELETE SET NULL,
  url_id UUID REFERENCES source_urls(id) ON DELETE SET NULL,
  
  -- Citation details
  domain VARCHAR(255) NOT NULL,
  url TEXT,
  title TEXT,
  snippet TEXT, -- Content snippet around the citation
  
  -- Position & Context
  citation_position INTEGER, -- Position in response (1 = first cited)
  inline_position INTEGER, -- Character position in response text
  citation_format VARCHAR(50), -- 'numbered', 'inline_link', 'parenthetical', 'footnote', 'sources_section'
  context_text TEXT, -- Surrounding text where citation appeared
  
  -- Citation classification
  citation_type VARCHAR(50), -- 'primary_source', 'supporting', 'comparison', 'reference', 'fact_check'
  source_type VARCHAR(50), -- 'owned', 'competitor', 'industry', 'news', 'academic', 'ugc'
  
  -- Brand relevance
  is_brand_owned BOOLEAN DEFAULT false, -- Does the tracked brand own this source?
  is_competitor_owned BOOLEAN DEFAULT false,
  competitor_brand_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
  
  -- Topic/Query context
  prompt_text TEXT, -- The query that led to this citation
  prompt_category VARCHAR(100),
  prompt_intent VARCHAR(50), -- 'informational', 'transactional', 'navigational'
  topics TEXT[] DEFAULT '{}', -- Topics this citation is associated with
  
  -- Geographic context (from simulation settings)
  geo_target VARCHAR(50), -- Target geography for this query
  language VARCHAR(10), -- Language of query/response
  
  -- Raw metadata from API
  raw_citation_data JSONB DEFAULT '{}'::jsonb, -- Original annotation/citation object from API
  
  -- Timestamps
  cited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the response was generated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint to prevent exact duplicates
  CONSTRAINT response_citations_unique UNIQUE (response_id, domain, url, citation_position)
);

-- Indexes for response_citations
CREATE INDEX idx_response_citations_response ON response_citations(response_id);
CREATE INDEX idx_response_citations_simulation ON response_citations(simulation_id);
CREATE INDEX idx_response_citations_account ON response_citations(account_id);
CREATE INDEX idx_response_citations_brand ON response_citations(brand_id);
CREATE INDEX idx_response_citations_domain ON response_citations(domain_id);
CREATE INDEX idx_response_citations_url ON response_citations(url_id);
CREATE INDEX idx_response_citations_model ON response_citations(model_name);
CREATE INDEX idx_response_citations_cited_at ON response_citations(cited_at DESC);
CREATE INDEX idx_response_citations_brand_domain ON response_citations(brand_id, domain_id);
CREATE INDEX idx_response_citations_topics_gin ON response_citations USING gin(topics);
CREATE INDEX idx_response_citations_geo ON response_citations(geo_target);

-- Composite indexes for common queries
CREATE INDEX idx_response_citations_account_brand_date ON response_citations(account_id, brand_id, cited_at DESC);
CREATE INDEX idx_response_citations_model_domain ON response_citations(model_name, domain_id);

-- ============================================================================
-- TABLE 4: brand_source_relationships (Brand ↔ Source Mapping)
-- ============================================================================
-- Track relationship between brands and sources over time.
-- Enables: "Which sources cite this brand?" and "Which brands are cited from this source?"
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_source_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES source_domains(id) ON DELETE CASCADE,
  
  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'cited_for',
  -- 'owned' - Brand owns this domain
  -- 'cited_for' - AI cites this source when discussing brand
  -- 'competitor_source' - Competitor uses this source
  -- 'target_publisher' - Identified as publishing opportunity
  -- 'syndication_partner' - Content syndication agreement
  
  -- Citation statistics for this brand-source pair
  total_citations INTEGER DEFAULT 0,
  citations_last_7d INTEGER DEFAULT 0,
  citations_last_30d INTEGER DEFAULT 0,
  avg_citation_position NUMERIC(5,2),
  
  -- Source Authority Potential (SAP) for this brand-source combo
  sap_score NUMERIC(5,2) DEFAULT 0, -- 0-100
  sap_factors JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "current_citations": 50,
  --   "competitor_citations": 200,
  --   "topic_relevance": 0.85,
  --   "position_potential": 0.7,
  --   "submission_feasibility": 0.9
  -- }
  
  -- Topics this source is cited for this brand
  topics_coverage JSONB DEFAULT '[]'::jsonb,
  -- [{"topic": "pricing", "citations": 20, "avg_position": 2.5}]
  
  -- Action tracking
  status VARCHAR(50) DEFAULT 'discovered', -- 'discovered', 'evaluated', 'targeted', 'submitted', 'published', 'ignored'
  notes TEXT,
  assigned_to TEXT, -- Team member responsible
  
  -- Timestamps
  first_citation TIMESTAMP WITH TIME ZONE,
  last_citation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT brand_source_unique UNIQUE (brand_id, domain_id, relationship_type)
);

-- Indexes for brand_source_relationships
CREATE INDEX idx_brand_source_brand ON brand_source_relationships(brand_id);
CREATE INDEX idx_brand_source_domain ON brand_source_relationships(domain_id);
CREATE INDEX idx_brand_source_sap ON brand_source_relationships(sap_score DESC);
CREATE INDEX idx_brand_source_status ON brand_source_relationships(status);
CREATE INDEX idx_brand_source_type ON brand_source_relationships(relationship_type);

-- ============================================================================
-- TABLE 5: model_source_preferences (AI Model → Source Affinity)
-- ============================================================================
-- Track which sources each AI model "prefers" to cite.
-- Enables model-specific optimization strategies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_source_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model identification
  model_name TEXT NOT NULL, -- e.g., 'openai/gpt-4o', 'perplexity/sonar-pro'
  model_provider TEXT, -- 'openai', 'anthropic', 'google', 'perplexity'
  
  -- Source
  domain_id UUID NOT NULL REFERENCES source_domains(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL, -- Denormalized
  
  -- Preference metrics (computed from response_citations)
  total_citations INTEGER DEFAULT 0,
  avg_citation_position NUMERIC(5,2),
  citation_rate NUMERIC(5,4), -- % of responses that cite this source
  
  -- Topic-specific preferences
  topic_preferences JSONB DEFAULT '[]'::jsonb,
  -- [{"topic": "pricing", "citations": 100, "rate": 0.15, "avg_position": 2.1}]
  
  -- Time-based trends
  citations_last_7d INTEGER DEFAULT 0,
  citations_last_30d INTEGER DEFAULT 0,
  trend_direction VARCHAR(20) DEFAULT 'stable', -- 'increasing', 'decreasing', 'stable'
  
  -- Period for this record
  period_start DATE,
  period_end DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT model_source_prefs_unique UNIQUE (model_name, domain_id, period_start)
);

-- Indexes
CREATE INDEX idx_model_source_prefs_model ON model_source_preferences(model_name);
CREATE INDEX idx_model_source_prefs_domain ON model_source_preferences(domain_id);
CREATE INDEX idx_model_source_prefs_citations ON model_source_preferences(total_citations DESC);
CREATE INDEX idx_model_source_prefs_rate ON model_source_preferences(citation_rate DESC);

-- ============================================================================
-- FUNCTIONS: Source Management & SAP Calculation
-- ============================================================================

-- Function to normalize domain names
CREATE OR REPLACE FUNCTION normalize_domain(raw_domain TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(raw_domain, '^www\.', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract TLD from domain
CREATE OR REPLACE FUNCTION extract_tld(domain_name TEXT) 
RETURNS TEXT AS $$
DECLARE
  parts TEXT[];
BEGIN
  parts := STRING_TO_ARRAY(domain_name, '.');
  IF array_length(parts, 1) >= 2 THEN
    -- Handle compound TLDs like co.uk
    IF parts[array_length(parts, 1) - 1] IN ('co', 'com', 'org', 'net', 'gov', 'edu') THEN
      RETURN parts[array_length(parts, 1) - 1] || '.' || parts[array_length(parts, 1)];
    END IF;
    RETURN parts[array_length(parts, 1)];
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or create source domain
CREATE OR REPLACE FUNCTION get_or_create_source_domain(
  p_domain TEXT,
  p_source_type TEXT DEFAULT 'other'
) RETURNS UUID AS $$
DECLARE
  v_domain_id UUID;
  v_normalized_domain TEXT;
BEGIN
  v_normalized_domain := normalize_domain(p_domain);
  
  -- Try to find existing
  SELECT id INTO v_domain_id
  FROM source_domains
  WHERE normalized_domain = v_normalized_domain;
  
  IF v_domain_id IS NULL THEN
    -- Create new domain entry
    INSERT INTO source_domains (
      domain,
      normalized_domain,
      tld,
      source_type
    ) VALUES (
      p_domain,
      v_normalized_domain,
      extract_tld(v_normalized_domain),
      p_source_type
    )
    RETURNING id INTO v_domain_id;
  END IF;
  
  RETURN v_domain_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SHA256 hash for URL
CREATE OR REPLACE FUNCTION url_hash(url_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(url_text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or create source URL
CREATE OR REPLACE FUNCTION get_or_create_source_url(
  p_domain_id UUID,
  p_domain TEXT,
  p_url TEXT,
  p_title TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_url_id UUID;
  v_hash TEXT;
  v_path TEXT;
BEGIN
  v_hash := url_hash(p_url);
  
  -- Extract path from URL
  BEGIN
    v_path := regexp_replace(p_url, '^https?://[^/]+', '');
  EXCEPTION WHEN OTHERS THEN
    v_path := p_url;
  END;
  
  -- Try to find existing
  SELECT id INTO v_url_id
  FROM source_urls
  WHERE url_hash = v_hash;
  
  IF v_url_id IS NULL THEN
    -- Create new URL entry
    INSERT INTO source_urls (
      domain_id,
      domain,
      url,
      url_hash,
      path,
      title
    ) VALUES (
      p_domain_id,
      p_domain,
      p_url,
      v_hash,
      v_path,
      p_title
    )
    RETURNING id INTO v_url_id;
  ELSE
    -- Update title if provided and current is null
    IF p_title IS NOT NULL THEN
      UPDATE source_urls
      SET title = COALESCE(source_urls.title, p_title),
          last_cited = NOW(),
          updated_at = NOW()
      WHERE id = v_url_id AND title IS NULL;
    END IF;
  END IF;
  
  RETURN v_url_id;
END;
$$ LANGUAGE plpgsql;

-- Function to store a citation and update aggregations
CREATE OR REPLACE FUNCTION store_citation(
  p_response_id TEXT,
  p_simulation_id TEXT,
  p_prompt_id TEXT,
  p_account_id UUID,
  p_brand_id UUID,
  p_model_name TEXT,
  p_model_provider TEXT,
  p_domain TEXT,
  p_url TEXT,
  p_title TEXT,
  p_citation_position INTEGER,
  p_context_text TEXT,
  p_prompt_text TEXT,
  p_prompt_category TEXT,
  p_geo_target TEXT,
  p_raw_citation_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_citation_id UUID;
  v_domain_id UUID;
  v_url_id UUID;
  v_normalized_domain TEXT;
BEGIN
  v_normalized_domain := normalize_domain(p_domain);
  
  -- Get or create domain
  v_domain_id := get_or_create_source_domain(p_domain);
  
  -- Get or create URL if provided
  IF p_url IS NOT NULL AND p_url != '' THEN
    v_url_id := get_or_create_source_url(v_domain_id, v_normalized_domain, p_url, p_title);
  END IF;
  
  -- Insert citation
  INSERT INTO response_citations (
    response_id,
    simulation_id,
    prompt_id,
    account_id,
    brand_id,
    model_name,
    model_provider,
    domain_id,
    url_id,
    domain,
    url,
    title,
    citation_position,
    context_text,
    prompt_text,
    prompt_category,
    geo_target,
    raw_citation_data
  ) VALUES (
    p_response_id,
    p_simulation_id,
    p_prompt_id,
    p_account_id,
    p_brand_id,
    p_model_name,
    p_model_provider,
    v_domain_id,
    v_url_id,
    v_normalized_domain,
    p_url,
    p_title,
    p_citation_position,
    p_context_text,
    p_prompt_text,
    p_prompt_category,
    p_geo_target,
    p_raw_citation_data
  )
  ON CONFLICT (response_id, domain, url, citation_position) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, response_citations.title),
    context_text = COALESCE(EXCLUDED.context_text, response_citations.context_text),
    raw_citation_data = EXCLUDED.raw_citation_data
  RETURNING id INTO v_citation_id;
  
  -- Update domain statistics (async-safe increment)
  UPDATE source_domains
  SET 
    total_citations = total_citations + 1,
    last_seen = NOW(),
    updated_at = NOW()
  WHERE id = v_domain_id;
  
  -- Update URL statistics
  IF v_url_id IS NOT NULL THEN
    UPDATE source_urls
    SET 
      total_citations = total_citations + 1,
      last_cited = NOW(),
      updated_at = NOW()
    WHERE id = v_url_id;
  END IF;
  
  RETURN v_citation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Source Authority Potential (SAP) score
CREATE OR REPLACE FUNCTION calculate_sap_score(
  p_brand_id UUID,
  p_domain_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_brand_citations INTEGER;
  v_total_citations INTEGER;
  v_competitor_citations INTEGER;
  v_avg_position NUMERIC;
  v_topic_relevance NUMERIC;
  v_domain_trust NUMERIC;
  v_sap_score NUMERIC;
  v_factors JSONB;
BEGIN
  -- Get brand's citations from this domain
  SELECT 
    COUNT(*),
    AVG(citation_position)
  INTO v_brand_citations, v_avg_position
  FROM response_citations
  WHERE brand_id = p_brand_id AND domain_id = p_domain_id;
  
  -- Get total citations for this domain
  SELECT total_citations, trust_score 
  INTO v_total_citations, v_domain_trust
  FROM source_domains WHERE id = p_domain_id;
  
  -- Get competitor citations (simplified - all other brands)
  SELECT COUNT(*) INTO v_competitor_citations
  FROM response_citations
  WHERE domain_id = p_domain_id AND brand_id != p_brand_id;
  
  -- Calculate SAP factors
  -- 1. Citation potential: If competitors are cited here but we're not, high potential
  -- 2. Position potential: If we're cited but in lower positions, room to improve
  -- 3. Trust factor: Higher domain trust = higher SAP
  
  v_factors := jsonb_build_object(
    'brand_citations', COALESCE(v_brand_citations, 0),
    'competitor_citations', COALESCE(v_competitor_citations, 0),
    'total_domain_citations', COALESCE(v_total_citations, 0),
    'avg_position', COALESCE(v_avg_position, 0),
    'domain_trust_score', COALESCE(v_domain_trust, 0)
  );
  
  -- SAP Score calculation (0-100)
  -- High SAP = High opportunity to improve AI visibility
  v_sap_score := LEAST(100, GREATEST(0,
    -- Competitor advantage: If competitors are cited more, higher opportunity
    CASE WHEN v_competitor_citations > v_brand_citations 
         THEN LEAST(40, (v_competitor_citations - v_brand_citations) * 2)
         ELSE 0 END
    +
    -- Domain trust bonus
    COALESCE(v_domain_trust * 0.3, 0)
    +
    -- Position improvement potential (if avg position > 3, room to improve)
    CASE WHEN v_avg_position > 3 THEN LEAST(20, (v_avg_position - 3) * 4) ELSE 0 END
    +
    -- Volume potential (high-citation domains = more impact)
    CASE WHEN v_total_citations > 100 THEN 10
         WHEN v_total_citations > 50 THEN 5
         ELSE 0 END
  ));
  
  v_factors := v_factors || jsonb_build_object('sap_score', ROUND(v_sap_score, 2));
  
  RETURN v_factors;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to refresh domain statistics (run periodically)
CREATE OR REPLACE FUNCTION refresh_domain_statistics(p_domain_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE source_domains sd
  SET
    total_citations = sub.total_citations,
    unique_urls_cited = sub.unique_urls,
    unique_brands_citing = sub.unique_brands,
    unique_models_citing = sub.unique_models,
    citations_last_7d = sub.citations_7d,
    citations_last_30d = sub.citations_30d,
    citations_last_90d = sub.citations_90d,
    model_citation_breakdown = sub.model_breakdown,
    citation_velocity = sub.citations_7d::numeric / 7,
    last_metrics_update = NOW(),
    updated_at = NOW()
  FROM (
    SELECT
      rc.domain_id,
      COUNT(*) as total_citations,
      COUNT(DISTINCT rc.url) as unique_urls,
      COUNT(DISTINCT rc.brand_id) as unique_brands,
      COUNT(DISTINCT rc.model_name) as unique_models,
      COUNT(*) FILTER (WHERE rc.cited_at >= NOW() - INTERVAL '7 days') as citations_7d,
      COUNT(*) FILTER (WHERE rc.cited_at >= NOW() - INTERVAL '30 days') as citations_30d,
      COUNT(*) FILTER (WHERE rc.cited_at >= NOW() - INTERVAL '90 days') as citations_90d,
      jsonb_object_agg(rc.model_name, model_count) as model_breakdown
    FROM response_citations rc
    JOIN (
      SELECT domain_id, model_name, COUNT(*) as model_count
      FROM response_citations
      GROUP BY domain_id, model_name
    ) model_counts USING (domain_id, model_name)
    WHERE (p_domain_id IS NULL OR rc.domain_id = p_domain_id)
    GROUP BY rc.domain_id
  ) sub
  WHERE sd.id = sub.domain_id;
  
  -- Recalculate trust scores
  UPDATE source_domains
  SET trust_score = LEAST(100, 
    (total_citations::numeric / 10) * 0.3 +  -- Citation volume (max 30)
    (unique_brands_citing * 5) * 0.25 +       -- Brand diversity (max 25)
    (CASE WHEN unique_models_citing >= 5 THEN 25 
          ELSE unique_models_citing * 5 END) + -- Model diversity (max 25)
    (citations_last_30d::numeric / citations_last_90d::numeric * 20) -- Recency (max 20)
  )
  WHERE (p_domain_id IS NULL OR id = p_domain_id)
    AND citations_last_90d > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE source_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_source_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_source_preferences ENABLE ROW LEVEL SECURITY;

-- source_domains: Visible to all authenticated (shared knowledge base)
CREATE POLICY "Authenticated users can view source domains"
  ON source_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage source domains"
  ON source_domains FOR ALL
  TO service_role
  USING (true);

-- source_urls: Visible to all authenticated
CREATE POLICY "Authenticated users can view source URLs"
  ON source_urls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage source URLs"
  ON source_urls FOR ALL
  TO service_role
  USING (true);

-- response_citations: Account-scoped
CREATE POLICY "Users can view citations for their accounts"
  ON response_citations FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Service role can manage all citations"
  ON response_citations FOR ALL
  TO service_role
  USING (true);

-- brand_source_relationships: Brand-scoped
CREATE POLICY "Users can view brand source relationships for their brands"
  ON brand_source_relationships FOR SELECT
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON au.account_id = b.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage brand source relationships"
  ON brand_source_relationships FOR ALL
  TO service_role
  USING (true);

-- model_source_preferences: Visible to all (aggregated data)
CREATE POLICY "Authenticated users can view model source preferences"
  ON model_source_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage model source preferences"
  ON model_source_preferences FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON source_domains TO authenticated;
GRANT SELECT ON source_urls TO authenticated;
GRANT SELECT ON response_citations TO authenticated;
GRANT SELECT ON brand_source_relationships TO authenticated;
GRANT SELECT ON model_source_preferences TO authenticated;

GRANT ALL ON source_domains TO service_role;
GRANT ALL ON source_urls TO service_role;
GRANT ALL ON response_citations TO service_role;
GRANT ALL ON brand_source_relationships TO service_role;
GRANT ALL ON model_source_preferences TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION normalize_domain TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION extract_tld TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION url_hash TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_or_create_source_domain TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_source_url TO service_role;
GRANT EXECUTE ON FUNCTION store_citation TO service_role;
GRANT EXECUTE ON FUNCTION calculate_sap_score TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refresh_domain_statistics TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE source_domains IS 'Master registry of all domains cited by AI models - the Source Authority Network';
COMMENT ON TABLE source_urls IS 'Individual URLs that have been cited, linked to their parent domains';
COMMENT ON TABLE response_citations IS 'Every citation event from LLM responses - raw citation data';
COMMENT ON TABLE brand_source_relationships IS 'Relationship between brands and sources with SAP scores';
COMMENT ON TABLE model_source_preferences IS 'Which sources each AI model prefers to cite';

COMMENT ON FUNCTION store_citation IS 'Store a citation from an LLM response and update all related aggregations';
COMMENT ON FUNCTION calculate_sap_score IS 'Calculate Source Authority Potential for a brand-domain pair';
COMMENT ON FUNCTION refresh_domain_statistics IS 'Refresh aggregated statistics for source domains';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Created source_domains table (Source Authority Network)
-- ✅ Created source_urls table (Individual URL tracking)
-- ✅ Created response_citations table (Citation event log)
-- ✅ Created brand_source_relationships table (Brand ↔ Source mapping)
-- ✅ Created model_source_preferences table (Model → Source affinity)
-- ✅ Created helper functions for domain/URL management
-- ✅ Created SAP calculation function
-- ✅ Added proper RLS policies for multi-tenant access
-- ✅ Added comprehensive indexes for query performance
--
-- Next steps:
-- 1. Update llm-simulation-orchestrator.ts to extract and store citations
-- 2. Create API endpoints for source analysis
-- 3. Build admin UI for Source Authority Network management
-- 4. Set up cron job to refresh_domain_statistics periodically
