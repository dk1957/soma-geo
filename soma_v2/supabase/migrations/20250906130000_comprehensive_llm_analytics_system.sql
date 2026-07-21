-- Comprehensive LLM Analytics System for GEO Platform
-- This migration creates the foundation for tracking LLM Discoverability and Visibility

-- Create enum types for structured data
DO $$
BEGIN
    -- LLM Platform types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'llm_platform') THEN
        CREATE TYPE llm_platform AS ENUM (
            'chatgpt', 'claude', 'gemini', 'perplexity', 'copilot', 
            'bard', 'llama', 'cohere', 'palm', 'gpt4', 'other'
        );
    END IF;

    -- Search Engine types for crawling
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'search_engine') THEN
        CREATE TYPE search_engine AS ENUM (
            'google', 'bing', 'duckduckgo', 'yandex', 'baidu', 
            'openai_crawler', 'anthropic_crawler', 'google_ai_crawler'
        );
    END IF;

    -- Content types that can be crawled/cited
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM (
            'article', 'blog_post', 'research_paper', 'whitepaper', 
            'case_study', 'press_release', 'product_page', 'about_page',
            'news', 'interview', 'podcast', 'video', 'infographic', 'other'
        );
    END IF;

    -- Sentiment analysis results
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_score') THEN
        CREATE TYPE sentiment_score AS ENUM ('very_negative', 'negative', 'neutral', 'positive', 'very_positive');
    END IF;
END
$$;

-- ========== CORE BRAND TRACKING TABLES ==========

-- Brand monitoring configuration and baselines
CREATE TABLE IF NOT EXISTS brand_monitoring_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Monitoring settings
    monitoring_keywords text[] NOT NULL, -- Primary brand terms, products, executives
    competitor_keywords text[] DEFAULT '{}', -- Competitor terms to track against
    geographic_focus text[] DEFAULT '{}', -- African regions/countries to focus on
    languages text[] DEFAULT ARRAY['en'], -- Languages to monitor
    
    -- Baseline measurements (from onboarding)
    baseline_ldi_score numeric(5,2) DEFAULT 0, -- LLM Discoverability Index baseline
    baseline_lvi_score numeric(5,2) DEFAULT 0, -- LLM Visibility Index baseline
    baseline_measured_at timestamptz,
    
    -- Monitoring configuration
    crawl_frequency_hours integer DEFAULT 24,
    llm_query_frequency_hours integer DEFAULT 6,
    alert_thresholds jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

-- Website and content source tracking for crawlability
CREATE TABLE IF NOT EXISTS brand_content_sources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Content source details
    domain text NOT NULL,
    url text NOT NULL,
    content_type content_type NOT NULL,
    title text,
    description text,
    
    -- SEO and discoverability metrics
    page_authority_score numeric(3,1), -- Moz/Ahrefs PA
    domain_authority_score numeric(3,1), -- Moz/Ahrefs DA
    backlink_count integer DEFAULT 0,
    internal_links_count integer DEFAULT 0,
    word_count integer DEFAULT 0,
    
    -- Technical SEO factors
    load_time_ms integer,
    mobile_friendly boolean DEFAULT false,
    https_enabled boolean DEFAULT false,
    structured_data_score numeric(3,1), -- Schema.org implementation quality
    
    -- Content freshness and updates
    content_last_updated timestamptz,
    crawl_last_attempted timestamptz,
    crawl_last_successful timestamptz,
    crawl_error_count integer DEFAULT 0,
    
    -- LLM crawler accessibility
    robots_txt_allows jsonb DEFAULT '{}', -- Per-crawler robots.txt analysis
    ai_crawler_friendly boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    
    UNIQUE(brand_id, url)
);

-- ========== DISCOVERABILITY TRACKING ==========

-- Track how well content is discoverable by search engines and LLM crawlers
CREATE TABLE IF NOT EXISTS llm_discoverability_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content_source_id uuid REFERENCES brand_content_sources(id) ON DELETE SET NULL,
    
    -- Measurement details
    measured_at timestamptz DEFAULT now(),
    measurement_period_hours integer DEFAULT 24,
    
    -- Search engine discoverability
    google_indexed boolean DEFAULT false,
    bing_indexed boolean DEFAULT false,
    google_ranking_position integer, -- For brand terms
    bing_ranking_position integer,
    
    -- LLM crawler accessibility scores (0-100)
    openai_crawl_score numeric(5,2) DEFAULT 0, -- GPT crawler accessibility
    anthropic_crawl_score numeric(5,2) DEFAULT 0, -- Claude crawler
    google_ai_crawl_score numeric(5,2) DEFAULT 0, -- Gemini/Bard crawler
    
    -- Technical discoverability factors
    sitemap_inclusion boolean DEFAULT false,
    rss_feed_inclusion boolean DEFAULT false,
    meta_tags_quality_score numeric(3,1),
    header_structure_score numeric(3,1), -- H1-H6 structure quality
    image_alt_text_score numeric(3,1),
    
    -- Content quality indicators
    readability_score numeric(3,1), -- Flesch-Kincaid or similar
    keyword_density_score numeric(3,1),
    content_uniqueness_score numeric(3,1), -- Plagiarism/duplicate detection
    
    -- Social and sharing signals
    social_shares_count integer DEFAULT 0,
    social_mentions_count integer DEFAULT 0,
    
    created_at timestamptz DEFAULT now()
);

-- ========== VISIBILITY TRACKING ==========

-- Track brand mentions and citations in LLM responses
CREATE TABLE IF NOT EXISTS llm_visibility_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Query and response details
    llm_platform llm_platform NOT NULL,
    query_text text NOT NULL,
    query_category text, -- e.g., 'product_comparison', 'company_info', 'industry_analysis'
    query_intent text, -- e.g., 'informational', 'commercial', 'navigational'
    
    -- Response analysis
    response_text text NOT NULL,
    brand_mentioned boolean DEFAULT false,
    mention_position integer, -- Position in response (1st, 2nd, etc.)
    mention_context text, -- Surrounding context of the mention
    citation_included boolean DEFAULT false,
    citation_url text, -- If LLM provided source link
    
    -- Sentiment and context analysis
    mention_sentiment sentiment_score DEFAULT 'neutral',
    mention_prominence numeric(3,1), -- How prominently featured (0-10)
    competitive_context text[], -- Other brands mentioned in same response
    
    -- Geographic and demographic context
    query_region text, -- African region if identifiable
    query_language text DEFAULT 'en',
    user_intent_commercial boolean, -- Commercial vs informational intent
    
    -- Metadata
    response_generated_at timestamptz,
    tracked_at timestamptz DEFAULT now(),
    session_id text, -- For grouping related queries
    
    created_at timestamptz DEFAULT now()
);

-- ========== COMPETITIVE ANALYSIS ==========

-- Track brand performance against competitors
CREATE TABLE IF NOT EXISTS competitive_visibility_analysis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_date date DEFAULT CURRENT_DATE,
    query_sample_size integer NOT NULL,
    
    -- Competitive metrics
    competitor_brand text NOT NULL,
    brand_mention_frequency numeric(5,2), -- Percentage of queries where brand appears
    competitor_mention_frequency numeric(5,2), -- Percentage for competitor
    
    -- Relative positioning
    brand_avg_position numeric(3,1), -- Average position when mentioned
    competitor_avg_position numeric(3,1),
    head_to_head_wins integer DEFAULT 0, -- Times brand ranked higher than competitor
    head_to_head_losses integer DEFAULT 0,
    
    -- Sentiment comparison
    brand_avg_sentiment numeric(3,1), -- Average sentiment score
    competitor_avg_sentiment numeric(3,1),
    
    -- Platform-specific breakdown
    platform_breakdown jsonb DEFAULT '{}', -- Per-LLM platform comparison
    
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(brand_id, competitor_brand, analysis_date)
);

-- ========== CALCULATED INDICES ==========

-- Pre-calculated LDI and LVI scores for fast dashboard queries
CREATE TABLE IF NOT EXISTS brand_llm_indices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Time period
    calculation_date date DEFAULT CURRENT_DATE,
    calculation_period_days integer DEFAULT 7,
    
    -- LLM Discoverability Index (0-100)
    ldi_score numeric(5,2) NOT NULL,
    ldi_components jsonb NOT NULL, -- Breakdown of score components
    ldi_trend_7d numeric(5,2), -- 7-day trend
    ldi_trend_30d numeric(5,2), -- 30-day trend
    
    -- LLM Visibility Index (0-100)
    lvi_score numeric(5,2) NOT NULL,
    lvi_components jsonb NOT NULL,
    lvi_trend_7d numeric(5,2),
    lvi_trend_30d numeric(5,2),
    
    -- Supporting metrics
    total_content_sources integer,
    crawlable_sources integer,
    indexed_sources integer,
    total_llm_queries_analyzed integer,
    mention_frequency_percentage numeric(5,2),
    
    -- Competitive position
    competitive_rank integer, -- Rank among monitored competitors
    market_share_percentage numeric(5,2), -- Share of voice in LLM responses
    
    calculated_at timestamptz DEFAULT now(),
    
    UNIQUE(brand_id, calculation_date)
);

-- ========== OPTIMIZATION RECOMMENDATIONS ==========

-- AI-generated recommendations for improving discoverability and visibility
CREATE TABLE IF NOT EXISTS llm_optimization_recommendations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type text NOT NULL, -- 'discoverability', 'visibility', 'content', 'technical'
    priority text NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title text NOT NULL,
    description text NOT NULL,
    
    -- Implementation details
    estimated_impact_ldi numeric(3,1), -- Expected LDI improvement
    estimated_impact_lvi numeric(3,1), -- Expected LVI improvement
    implementation_effort text, -- 'low', 'medium', 'high'
    estimated_timeline_weeks integer,
    
    -- Supporting data
    related_content_sources uuid[], -- Related content source IDs
    related_keywords text[],
    evidence_data jsonb, -- Supporting analysis data
    
    -- Status tracking
    status text DEFAULT 'pending', -- 'pending', 'accepted', 'implementing', 'completed', 'rejected'
    implemented_at timestamptz,
    impact_measured boolean DEFAULT false,
    actual_impact_ldi numeric(3,1),
    actual_impact_lvi numeric(3,1),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ========== INDEXES FOR PERFORMANCE ==========

-- Brand monitoring indexes
CREATE INDEX IF NOT EXISTS idx_brand_monitoring_brand_active ON brand_monitoring_config(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_brand_content_sources_brand_domain ON brand_content_sources(brand_id, domain);
CREATE INDEX IF NOT EXISTS idx_brand_content_sources_active_updated ON brand_content_sources(is_active, updated_at);

-- Discoverability metrics indexes
CREATE INDEX IF NOT EXISTS idx_discoverability_brand_measured ON llm_discoverability_metrics(brand_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_discoverability_content_source ON llm_discoverability_metrics(content_source_id, measured_at DESC);

-- Visibility tracking indexes
CREATE INDEX IF NOT EXISTS idx_visibility_brand_platform ON llm_visibility_tracking(brand_id, llm_platform, tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_mentioned_sentiment ON llm_visibility_tracking(brand_mentioned, mention_sentiment, tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_region_lang ON llm_visibility_tracking(query_region, query_language, tracked_at DESC);

-- Competitive analysis indexes
CREATE INDEX IF NOT EXISTS idx_competitive_brand_date ON competitive_visibility_analysis(brand_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_competitor ON competitive_visibility_analysis(competitor_brand, analysis_date DESC);

-- LLM indices indexes
CREATE INDEX IF NOT EXISTS idx_brand_indices_brand_date ON brand_llm_indices(brand_id, calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_brand_indices_ldi_score ON brand_llm_indices(ldi_score DESC, calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_brand_indices_lvi_score ON brand_llm_indices(lvi_score DESC, calculation_date DESC);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_brand_priority ON llm_optimization_recommendations(brand_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_type_status ON llm_optimization_recommendations(recommendation_type, status, created_at DESC);

-- ========== ROW LEVEL SECURITY ==========

-- Enable RLS on all tables
ALTER TABLE brand_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_discoverability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_visibility_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_visibility_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_llm_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own brand data
CREATE POLICY "Users can access their brand monitoring config"
    ON brand_monitoring_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM brands b 
            WHERE b.id = brand_monitoring_config.brand_id 
            AND b.account_id IN (
                SELECT account_id FROM user_accounts WHERE user_id = auth.uid()
            )
        )
    );

-- Apply similar policy pattern to all tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'brand_content_sources',
            'llm_discoverability_metrics', 
            'llm_visibility_tracking',
            'competitive_visibility_analysis',
            'brand_llm_indices',
            'llm_optimization_recommendations'
        ])
    LOOP
        EXECUTE format('
            CREATE POLICY "Users can access their own brand data"
                ON %I FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM brands b 
                        WHERE b.id = %I.brand_id 
                        AND b.account_id IN (
                            SELECT account_id FROM user_accounts WHERE user_id = auth.uid()
                        )
                    )
                );
        ', table_name, table_name);
    END LOOP;
END
$$;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;