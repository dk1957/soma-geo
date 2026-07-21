-- Enhanced Onboarding Research Schema
-- Migration: 20250830120000_enhanced_onboarding_research_schema.sql
-- Purpose: Comprehensive data storage for onboarding research and foundational metrics

-- STEP 1: Enhanced Brand Research Storage

-- Comprehensive brand research data table
CREATE TABLE IF NOT EXISTS brand_research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    
    -- Brand profile data
    industry TEXT,
    business_type TEXT CHECK (business_type IN ('brand', 'business', 'product', 'organization')),
    business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'other')),
    target_markets TEXT[],
    value_proposition TEXT,
    key_products TEXT[],
    target_audience TEXT,
    business_stage TEXT CHECK (business_stage IN ('startup', 'growth', 'established', 'enterprise')),
    
    -- Market research findings
    market_trends TEXT[],
    emerging_technologies TEXT[],
    market_size TEXT,
    growth_factors TEXT[],
    content_gaps TEXT[],
    trending_topics TEXT[],
    
    -- Research metadata
    research_sources TEXT[], -- URLs, platforms, etc.
    research_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (research_confidence >= 0 AND research_confidence <= 1),
    research_method TEXT DEFAULT 'ai_agent_search',
    
    -- Timestamps
    researched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store detailed competitor intelligence
CREATE TABLE IF NOT EXISTS competitor_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    brand_research_id UUID REFERENCES brand_research_data(id) ON DELETE CASCADE,
    
    -- Competitor data
    competitor_name TEXT NOT NULL,
    competitor_domain TEXT,
    competitor_industry TEXT,
    
    -- Intelligence data
    visibility_score DECIMAL(5,2) DEFAULT 0,
    ai_mention_frequency INTEGER DEFAULT 0,
    strengths TEXT[],
    weaknesses TEXT[],
    gaps TEXT[],
    market_position TEXT,
    estimated_market_share DECIMAL(5,2),
    
    -- AI platform performance
    chatgpt_mentions INTEGER DEFAULT 0,
    claude_mentions INTEGER DEFAULT 0,
    gemini_mentions INTEGER DEFAULT 0,
    perplexity_mentions INTEGER DEFAULT 0,
    
    -- Competitive analysis
    brand_comparison_result JSONB,
    competitive_advantage TEXT,
    threat_level TEXT CHECK (threat_level IN ('critical', 'high', 'medium', 'low', 'minimal')),
    
    -- Research metadata
    data_sources TEXT[],
    analysis_confidence DECIMAL(3,2) DEFAULT 0.5,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 2: LLM Testing Results & Prompt Performance

-- Store all LLM testing results with detailed metadata
CREATE TABLE IF NOT EXISTS llm_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    
    -- Prompt data
    prompt_id TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    prompt_category TEXT,
    prompt_intent TEXT CHECK (prompt_intent IN ('informational', 'commercial', 'navigational', 'transactional')),
    prompt_priority INTEGER DEFAULT 5,
    estimated_volume INTEGER DEFAULT 0,
    competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
    
    -- LLM testing data
    llm_name TEXT NOT NULL,
    llm_provider TEXT NOT NULL,
    response_text TEXT,
    
    -- Analysis results
    brand_mentioned BOOLEAN DEFAULT FALSE,
    mention_rank INTEGER, -- position in response where brand was mentioned
    mention_context TEXT, -- surrounding context of the mention
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    relevance_score DECIMAL(5,2) DEFAULT 0,
    response_quality_score DECIMAL(5,2) DEFAULT 0,
    
    -- Citation and source analysis
    citations_found TEXT[], -- URLs or sources mentioned
    citation_quality TEXT CHECK (citation_quality IN ('primary', 'secondary', 'tertiary', 'none')),
    authoritative_sources TEXT[],
    
    -- Competitive context
    competitors_mentioned TEXT[],
    competitor_mentions_count INTEGER DEFAULT 0,
    brand_vs_competitors_rank INTEGER,
    
    -- Technical metadata
    response_time_ms INTEGER,
    test_success BOOLEAN DEFAULT TRUE,
    test_notes TEXT,
    was_mocked BOOLEAN DEFAULT FALSE,
    
    tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 3: Foundational Metrics and Scoring

-- Core visibility and discoverability metrics
CREATE TABLE IF NOT EXISTS foundational_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    
    -- Core Visibility Metrics
    visibility_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- Overall visibility across all AI platforms
    ldi_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- LLM Discoverability Index
    market_position_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- Position relative to competitors
    authority_index DECIMAL(5,2) NOT NULL DEFAULT 0, -- Authority and trustworthiness score
    
    -- Platform-specific LDI scores
    chatgpt_ldi DECIMAL(5,2) DEFAULT 0,
    claude_ldi DECIMAL(5,2) DEFAULT 0,
    gemini_ldi DECIMAL(5,2) DEFAULT 0,
    perplexity_ldi DECIMAL(5,2) DEFAULT 0,
    
    -- Mention Analysis
    total_mentions INTEGER DEFAULT 0,
    positive_mentions INTEGER DEFAULT 0,
    neutral_mentions INTEGER DEFAULT 0,
    negative_mentions INTEGER DEFAULT 0,
    mention_rate DECIMAL(5,2) DEFAULT 0, -- percentage of prompts that resulted in mentions
    
    -- Competitive Intelligence
    competitor_advantage_score DECIMAL(5,2) DEFAULT 0, -- how brand performs vs competitors
    market_share_estimate DECIMAL(5,2) DEFAULT 0,
    competitive_gaps_count INTEGER DEFAULT 0,
    
    -- Content & Authority Metrics
    content_quality_score DECIMAL(5,2) DEFAULT 0,
    citation_frequency INTEGER DEFAULT 0,
    authoritative_source_count INTEGER DEFAULT 0,
    content_gaps_identified INTEGER DEFAULT 0,
    
    -- Opportunity Metrics
    optimization_opportunities INTEGER DEFAULT 0,
    high_priority_opportunities INTEGER DEFAULT 0,
    estimated_improvement_potential DECIMAL(5,2) DEFAULT 0,
    
    -- Calculation metadata
    metrics_version TEXT DEFAULT 'v1.0',
    calculation_method TEXT DEFAULT 'weighted_aggregate',
    confidence_level DECIMAL(3,2) DEFAULT 0.5,
    
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 4: Source Analysis and Citation Tracking

-- Enhanced source and citation analysis
CREATE TABLE IF NOT EXISTS source_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    
    -- Source identification
    source_url TEXT,
    source_domain TEXT NOT NULL,
    source_title TEXT,
    source_type TEXT CHECK (source_type IN ('news', 'blog', 'academic', 'social', 'company', 'directory', 'other')),
    
    -- Authority metrics
    domain_authority INTEGER DEFAULT 0 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    page_authority INTEGER DEFAULT 0 CHECK (page_authority >= 0 AND page_authority <= 100),
    trust_score DECIMAL(5,2) DEFAULT 0,
    
    -- Citation analysis
    total_citations INTEGER DEFAULT 0,
    brand_citations INTEGER DEFAULT 0,
    competitor_citations INTEGER DEFAULT 0,
    citation_context TEXT,
    citation_sentiment TEXT CHECK (citation_sentiment IN ('positive', 'neutral', 'negative')),
    
    -- AI platform coverage
    cited_in_chatgpt BOOLEAN DEFAULT FALSE,
    cited_in_claude BOOLEAN DEFAULT FALSE,
    cited_in_gemini BOOLEAN DEFAULT FALSE,
    cited_in_perplexity BOOLEAN DEFAULT FALSE,
    platforms_citing TEXT[],
    
    -- Content analysis
    content_relevance DECIMAL(3,2) DEFAULT 0.5,
    content_quality TEXT CHECK (content_quality IN ('excellent', 'good', 'fair', 'poor')),
    content_freshness_days INTEGER,
    content_length_words INTEGER,
    
    -- Strategic importance
    strategic_value TEXT CHECK (strategic_value IN ('critical', 'high', 'medium', 'low')),
    optimization_opportunity TEXT,
    
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 5: Query Performance and Optimization Tracking

-- Track performance of individual queries and prompts
CREATE TABLE IF NOT EXISTS query_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    
    -- Query data
    query_text TEXT NOT NULL,
    query_category TEXT,
    query_intent TEXT CHECK (query_intent IN ('informational', 'commercial', 'navigational', 'transactional')),
    query_source TEXT CHECK (query_source IN ('generated', 'trending', 'competitor_analysis', 'user_provided')),
    
    -- Performance metrics
    overall_performance_score DECIMAL(5,2) DEFAULT 0,
    mention_success_rate DECIMAL(5,2) DEFAULT 0,
    average_mention_rank DECIMAL(5,2),
    best_performing_platform TEXT,
    worst_performing_platform TEXT,
    
    -- Platform-specific performance
    chatgpt_performance DECIMAL(5,2) DEFAULT 0,
    claude_performance DECIMAL(5,2) DEFAULT 0,
    gemini_performance DECIMAL(5,2) DEFAULT 0,
    perplexity_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Competitive analysis
    competitors_outranking INTEGER DEFAULT 0,
    competitive_advantage BOOLEAN DEFAULT FALSE,
    optimization_needed BOOLEAN DEFAULT FALSE,
    
    -- Optimization tracking
    optimization_priority TEXT CHECK (optimization_priority IN ('critical', 'high', 'medium', 'low')),
    optimization_strategy TEXT,
    estimated_improvement_potential DECIMAL(5,2),
    
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 6: Dashboard Data Aggregation Views

-- Create materialized view for dashboard performance
CREATE OR REPLACE VIEW onboarding_dashboard_data AS
SELECT 
    oa.id as audit_id,
    oa.brand_name,
    oa.industry,
    oa.created_at as audit_date,
    
    -- Foundational Metrics
    fm.visibility_score,
    fm.ldi_score,
    fm.market_position_score,
    fm.authority_index,
    fm.mention_rate,
    fm.competitor_advantage_score,
    
    -- Platform Performance
    fm.chatgpt_ldi,
    fm.claude_ldi,
    fm.gemini_ldi,
    fm.perplexity_ldi,
    
    -- Aggregated Mention Data
    fm.total_mentions,
    fm.positive_mentions,
    fm.neutral_mentions,
    fm.negative_mentions,
    
    -- Competitive Intelligence
    (SELECT COUNT(*) FROM competitor_intelligence ci WHERE ci.audit_id = oa.id) as competitors_analyzed,
    (SELECT AVG(ci.visibility_score) FROM competitor_intelligence ci WHERE ci.audit_id = oa.id) as avg_competitor_visibility,
    
    -- Content and Sources
    (SELECT COUNT(*) FROM source_analysis sa WHERE sa.audit_id = oa.id) as sources_analyzed,
    (SELECT COUNT(*) FROM source_analysis sa WHERE sa.audit_id = oa.id AND sa.strategic_value IN ('critical', 'high')) as high_value_sources,
    
    -- Query Performance
    (SELECT COUNT(*) FROM query_performance qp WHERE qp.audit_id = oa.id) as queries_tested,
    (SELECT AVG(qp.overall_performance_score) FROM query_performance qp WHERE qp.audit_id = oa.id) as avg_query_performance,
    
    -- Optimization Opportunities
    fm.optimization_opportunities,
    fm.high_priority_opportunities,
    fm.estimated_improvement_potential,
    
    -- LLM Testing Summary
    (SELECT COUNT(*) FROM llm_test_results ltr WHERE ltr.audit_id = oa.id) as total_llm_tests,
    (SELECT COUNT(*) FROM llm_test_results ltr WHERE ltr.audit_id = oa.id AND ltr.brand_mentioned = TRUE) as successful_mentions,
    (SELECT COUNT(*) FROM llm_test_results ltr WHERE ltr.audit_id = oa.id AND ltr.sentiment = 'positive') as positive_sentiment_responses
    
FROM onboarding_audits oa
LEFT JOIN foundational_metrics fm ON oa.id = fm.audit_id
ORDER BY oa.created_at DESC;

-- STEP 7: Indexes for Performance

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_research_audit_id ON brand_research_data(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_research_brand_name ON brand_research_data(brand_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_intelligence_audit_id ON competitor_intelligence(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_intelligence_threat_level ON competitor_intelligence(threat_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_llm_test_results_audit_id ON llm_test_results(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_llm_test_results_brand_mentioned ON llm_test_results(brand_mentioned, sentiment);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_llm_test_results_llm_provider ON llm_test_results(llm_provider, llm_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foundational_metrics_audit_id ON foundational_metrics(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foundational_metrics_scores ON foundational_metrics(visibility_score, ldi_score, market_position_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_analysis_audit_id ON source_analysis(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_analysis_strategic_value ON source_analysis(strategic_value, domain_authority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_audit_id ON query_performance(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_optimization ON query_performance(optimization_priority, estimated_improvement_potential);

-- STEP 8: Row Level Security

ALTER TABLE brand_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundational_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_performance ENABLE ROW LEVEL SECURITY;

-- Standard RLS policies
CREATE POLICY "Users can access brand research data" ON brand_research_data
    FOR ALL USING (true); -- Temporary - will be restricted to brand ownership

CREATE POLICY "Users can access competitor intelligence" ON competitor_intelligence
    FOR ALL USING (true);

CREATE POLICY "Users can access LLM test results" ON llm_test_results
    FOR ALL USING (true);

CREATE POLICY "Users can access foundational metrics" ON foundational_metrics
    FOR ALL USING (true);

CREATE POLICY "Users can access source analysis" ON source_analysis
    FOR ALL USING (true);

CREATE POLICY "Users can access query performance" ON query_performance
    FOR ALL USING (true);

-- STEP 9: Functions for Metric Calculations

-- Function to calculate LDI score based on test results
CREATE OR REPLACE FUNCTION calculate_ldi_score(audit_uuid UUID, platform_name TEXT DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_tests INTEGER;
    successful_mentions INTEGER;
    avg_relevance DECIMAL(5,2);
    avg_quality DECIMAL(5,2);
    positive_sentiment_rate DECIMAL(5,2);
    ldi_score DECIMAL(5,2);
BEGIN
    -- Get test statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE brand_mentioned = TRUE),
        AVG(relevance_score),
        AVG(response_quality_score),
        (COUNT(*) FILTER (WHERE sentiment = 'positive' AND brand_mentioned = TRUE)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned = TRUE), 0)) * 100
    INTO total_tests, successful_mentions, avg_relevance, avg_quality, positive_sentiment_rate
    FROM llm_test_results
    WHERE audit_id = audit_uuid
    AND (platform_name IS NULL OR llm_name ILIKE '%' || platform_name || '%');
    
    -- Calculate LDI score (weighted formula)
    -- 40% mention rate, 25% relevance, 20% quality, 15% sentiment
    IF total_tests > 0 THEN
        ldi_score := (
            ((successful_mentions::DECIMAL / total_tests) * 40) +
            (COALESCE(avg_relevance, 0) * 0.25) +
            (COALESCE(avg_quality, 0) * 0.20) +
            (COALESCE(positive_sentiment_rate, 0) * 0.15)
        );
    ELSE
        ldi_score := 0;
    END IF;
    
    RETURN LEAST(ldi_score, 100.0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate visibility score
CREATE OR REPLACE FUNCTION calculate_visibility_score(audit_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    overall_ldi DECIMAL(5,2);
    citation_score DECIMAL(5,2);
    authority_score DECIMAL(5,2);
    coverage_score DECIMAL(5,2);
    visibility_score DECIMAL(5,2);
BEGIN
    -- Get overall LDI score
    overall_ldi := calculate_ldi_score(audit_uuid);
    
    -- Calculate citation score (based on high-authority citations)
    SELECT 
        LEAST((
            (COUNT(*) FILTER (WHERE domain_authority >= 80) * 10) +
            (COUNT(*) FILTER (WHERE domain_authority >= 60 AND domain_authority < 80) * 5) +
            (COUNT(*) * 2)
        ), 100)
    INTO citation_score
    FROM source_analysis
    WHERE audit_id = audit_uuid AND brand_citations > 0;
    
    -- Calculate authority score (based on source quality)
    SELECT AVG(domain_authority) * 0.8
    INTO authority_score
    FROM source_analysis
    WHERE audit_id = audit_uuid AND brand_citations > 0;
    
    -- Calculate platform coverage score
    SELECT (
        (COUNT(*) FILTER (WHERE cited_in_chatgpt = TRUE) * 25) +
        (COUNT(*) FILTER (WHERE cited_in_claude = TRUE) * 25) +
        (COUNT(*) FILTER (WHERE cited_in_gemini = TRUE) * 25) +
        (COUNT(*) FILTER (WHERE cited_in_perplexity = TRUE) * 25)
    ) / GREATEST(COUNT(*), 1)
    INTO coverage_score
    FROM source_analysis
    WHERE audit_id = audit_uuid;
    
    -- Combine scores (weighted)
    visibility_score := (
        (COALESCE(overall_ldi, 0) * 0.4) +
        (COALESCE(citation_score, 0) * 0.3) +
        (COALESCE(authority_score, 0) * 0.2) +
        (COALESCE(coverage_score, 0) * 0.1)
    );
    
    RETURN LEAST(visibility_score, 100.0);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE brand_research_data IS 'Comprehensive brand research findings from AI agent analysis';
COMMENT ON TABLE competitor_intelligence IS 'Detailed competitor analysis and benchmarking data';
COMMENT ON TABLE llm_test_results IS 'Individual LLM testing results with detailed performance metrics';
COMMENT ON TABLE foundational_metrics IS 'Core visibility and discoverability metrics for dashboard display';
COMMENT ON TABLE source_analysis IS 'Citation source analysis and authority scoring';
COMMENT ON TABLE query_performance IS 'Query-level performance tracking and optimization recommendations';
COMMENT ON VIEW onboarding_dashboard_data IS 'Aggregated view for dashboard consumption with pre-calculated metrics';
COMMENT ON FUNCTION calculate_ldi_score IS 'Calculate LLM Discoverability Index score based on test results';
COMMENT ON FUNCTION calculate_visibility_score IS 'Calculate overall brand visibility score across all factors';
