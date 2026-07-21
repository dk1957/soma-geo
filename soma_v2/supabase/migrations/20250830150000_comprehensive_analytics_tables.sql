-- Comprehensive Analytics Tables for Enhanced AI Research
-- Migration: 20250830150000_comprehensive_analytics_tables.sql
-- Purpose: Store detailed citation, sentiment, and competitor mention analytics

-- Enhanced Citation Analysis Table
-- Stores detailed citation data with positioning and context analysis
CREATE TABLE IF NOT EXISTS ai_citation_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL, -- Links to specific LLM test
    
    -- Citation identification
    url TEXT,
    source TEXT,
    title TEXT,
    domain TEXT,
    
    -- Positioning analysis
    position INTEGER NOT NULL, -- Position in response (1-based)
    context TEXT NOT NULL, -- Surrounding text context
    mention_type TEXT NOT NULL CHECK (mention_type IN ('direct_link', 'source_attribution', 'reference', 'embedded')),
    
    -- Authority and quality metrics
    authority_indicators TEXT[] DEFAULT '{}',
    surrounding_brands TEXT[] DEFAULT '{}',
    citation_strength TEXT NOT NULL CHECK (citation_strength IN ('strong', 'medium', 'weak')),
    
    -- Test metadata
    platform TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    tested_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Sentiment Analysis Table
-- Comprehensive sentiment analysis with multi-dimensional scoring
CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    
    -- Brand identification
    brand_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    
    -- Overall sentiment metrics
    overall_sentiment TEXT NOT NULL CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_confidence DECIMAL(3,2) NOT NULL CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
    
    -- Sentiment indicators
    positive_phrases TEXT[] DEFAULT '{}',
    negative_phrases TEXT[] DEFAULT '{}',
    neutral_phrases TEXT[] DEFAULT '{}',
    
    -- Brand positioning analysis
    brand_positioning TEXT CHECK (brand_positioning IN ('leader', 'challenger', 'follower', 'niche', 'unspecified')),
    
    -- Context-specific sentiment scores
    features_sentiment TEXT CHECK (features_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned')),
    pricing_sentiment TEXT CHECK (pricing_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned')),
    usability_sentiment TEXT CHECK (usability_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned')),
    support_sentiment TEXT CHECK (support_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned')),
    reputation_sentiment TEXT CHECK (reputation_sentiment IN ('positive', 'neutral', 'negative', 'not_mentioned')),
    
    -- ROI monitoring value
    monitoring_value INTEGER NOT NULL CHECK (monitoring_value >= 1 AND monitoring_value <= 100),
    
    -- Reference data
    response_text TEXT, -- First 1000 chars for reference
    tested_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor Mentions Analysis Table
-- Detailed tracking of competitor mentions with hierarchy analysis
CREATE TABLE IF NOT EXISTS ai_competitor_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    
    -- Brand and competitor identification
    brand_name TEXT NOT NULL,
    competitor_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    
    -- Positioning analysis
    position INTEGER NOT NULL, -- Position in response where competitor was mentioned
    context TEXT NOT NULL, -- Context surrounding the competitor mention
    mention_type TEXT NOT NULL CHECK (mention_type IN ('direct_comparison', 'alternative_list', 'similar_solution', 'competitor_reference', 'market_leader')),
    relative_positioning TEXT CHECK (relative_positioning IN ('above', 'below', 'peer', 'alternative', 'unspecified')),
    
    -- Frequency and significance
    frequency INTEGER DEFAULT 1,
    sentiment_context TEXT CHECK (sentiment_context IN ('positive', 'neutral', 'negative')),
    
    -- Competitive intelligence
    competitive_indicators TEXT[] DEFAULT '{}',
    market_context TEXT,
    
    tested_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citation_analysis_audit_id ON ai_citation_analysis(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citation_analysis_test_id ON ai_citation_analysis(test_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citation_analysis_platform ON ai_citation_analysis(platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_citation_analysis_strength ON ai_citation_analysis(citation_strength);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sentiment_analysis_audit_id ON ai_sentiment_analysis(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sentiment_analysis_brand ON ai_sentiment_analysis(brand_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sentiment_analysis_sentiment ON ai_sentiment_analysis(overall_sentiment, sentiment_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sentiment_analysis_monitoring_value ON ai_sentiment_analysis(monitoring_value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_competitor_mentions_audit_id ON ai_competitor_mentions(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_competitor_mentions_brand ON ai_competitor_mentions(brand_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_competitor_mentions_competitor ON ai_competitor_mentions(competitor_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_competitor_mentions_positioning ON ai_competitor_mentions(relative_positioning);

-- Enable Row Level Security
ALTER TABLE ai_citation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_competitor_mentions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (temporary - will be restricted to brand ownership)
CREATE POLICY "Users can access citation analysis" ON ai_citation_analysis
    FOR ALL USING (true);

CREATE POLICY "Users can access sentiment analysis" ON ai_sentiment_analysis
    FOR ALL USING (true);

CREATE POLICY "Users can access competitor mentions" ON ai_competitor_mentions
    FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE ai_citation_analysis IS 'Detailed citation analysis with positioning and context from AI responses';
COMMENT ON TABLE ai_sentiment_analysis IS 'Comprehensive brand sentiment analysis with multi-dimensional scoring';
COMMENT ON TABLE ai_competitor_mentions IS 'Competitor mention tracking with hierarchy and positioning analysis';

-- Create materialized view for comprehensive analytics dashboard
CREATE OR REPLACE VIEW comprehensive_analytics_summary AS
SELECT 
    aca.audit_id,
    
    -- Citation Analytics
    COUNT(DISTINCT aca.id) as total_citations,
    COUNT(DISTINCT aca.id) FILTER (WHERE aca.citation_strength = 'strong') as strong_citations,
    COUNT(DISTINCT aca.domain) as unique_domains_citing,
    AVG(aca.position) as avg_citation_position,
    
    -- Sentiment Analytics
    COUNT(DISTINCT asa.id) as total_sentiment_analyses,
    AVG(asa.sentiment_score) as avg_sentiment_score,
    AVG(asa.monitoring_value) as avg_monitoring_value,
    COUNT(DISTINCT asa.id) FILTER (WHERE asa.overall_sentiment = 'positive') as positive_sentiment_count,
    COUNT(DISTINCT asa.id) FILTER (WHERE asa.brand_positioning IN ('leader', 'challenger')) as strong_positioning_count,
    
    -- Competitor Analytics
    COUNT(DISTINCT acm.id) as total_competitor_mentions,
    COUNT(DISTINCT acm.competitor_name) as unique_competitors_mentioned,
    COUNT(DISTINCT acm.id) FILTER (WHERE acm.relative_positioning = 'above') as competitors_ranked_above,
    AVG(acm.position) as avg_competitor_mention_position,
    
    -- Platform Coverage
    COUNT(DISTINCT aca.platform) as platforms_with_citations,
    COUNT(DISTINCT asa.platform) as platforms_with_sentiment,
    COUNT(DISTINCT acm.platform) as platforms_with_competitors
    
FROM ai_citation_analysis aca
FULL OUTER JOIN ai_sentiment_analysis asa ON aca.audit_id = asa.audit_id
FULL OUTER JOIN ai_competitor_mentions acm ON aca.audit_id = acm.audit_id
GROUP BY aca.audit_id;

COMMENT ON VIEW comprehensive_analytics_summary IS 'Aggregated view of comprehensive analytics for dashboard display';