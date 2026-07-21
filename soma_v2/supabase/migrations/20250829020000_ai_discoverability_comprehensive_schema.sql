-- Comprehensive AI Discoverability Platform Schema
-- Migration: 20250829020000_ai_discoverability_comprehensive_schema.sql

-- STEP 1: LDI Scoring & Multi-Platform Visibility Tracking

-- Table for LDI score tracking across AI platforms
CREATE TABLE IF NOT EXISTS ldi_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Platform and query data
    platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'copilot', 'all')),
    query_text TEXT NOT NULL,
    query_category TEXT,
    query_intent TEXT CHECK (query_intent IN ('informational', 'commercial', 'navigational', 'transactional')),
    
    -- Scoring data
    ldi_score INTEGER NOT NULL CHECK (ldi_score >= 0 AND ldi_score <= 100),
    mention_count INTEGER DEFAULT 0,
    competitor_mention_count INTEGER DEFAULT 0,
    visibility_rank INTEGER,
    citation_quality TEXT CHECK (citation_quality IN ('primary', 'secondary', 'tertiary', 'none')),
    
    -- Context data
    response_context TEXT,
    co_mentions TEXT[], -- brands/entities mentioned alongside
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    
    -- Timestamps
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for competitor benchmarking
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    competitor_brand_name TEXT NOT NULL,
    
    -- Platform performance comparison
    platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'copilot')),
    brand_ldi_score INTEGER NOT NULL CHECK (brand_ldi_score >= 0 AND brand_ldi_score <= 100),
    competitor_ldi_score INTEGER NOT NULL CHECK (competitor_ldi_score >= 0 AND competitor_ldi_score <= 100),
    
    -- Query context
    query_category TEXT NOT NULL,
    total_queries_tested INTEGER NOT NULL DEFAULT 0,
    brand_wins INTEGER DEFAULT 0,
    competitor_wins INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    
    -- Analysis period
    analysis_period_start TIMESTAMPTZ NOT NULL,
    analysis_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for query synthesis and testing
CREATE TABLE IF NOT EXISTS query_synthesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Query generation data
    source_type TEXT NOT NULL CHECK (source_type IN ('trending', 'autocomplete', 'social_signals', 'competitor_analysis', 'semantic_clustering')),
    original_query TEXT,
    synthesized_queries TEXT[] NOT NULL,
    
    -- Analysis metadata
    industry_context TEXT,
    seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
    predicted_search_volume INTEGER DEFAULT 0,
    intent_distribution JSONB, -- {informational: 0.4, commercial: 0.3, etc}
    
    -- Performance data
    queries_tested INTEGER DEFAULT 0,
    avg_ldi_score DECIMAL(5,2),
    top_performing_query TEXT,
    
    -- Timestamps
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_tested_at TIMESTAMPTZ
);

-- STEP 2: Crawler Detection & Content Analysis

-- Enhanced crawler detection table
CREATE TABLE IF NOT EXISTS ai_crawler_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Visit data
    crawler_type TEXT NOT NULL CHECK (crawler_type IN ('openai', 'anthropic', 'google', 'microsoft', 'meta', 'unknown')),
    user_agent TEXT NOT NULL,
    ip_address INET,
    url_path TEXT NOT NULL,
    
    -- Content analysis
    page_content_hash TEXT,
    structured_data_present BOOLEAN DEFAULT FALSE,
    schema_types TEXT[],
    meta_tags_optimized BOOLEAN DEFAULT FALSE,
    readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
    
    -- Technical data
    response_status INTEGER,
    response_time_ms INTEGER,
    content_length INTEGER,
    last_modified TIMESTAMPTZ,
    
    -- Visit metadata
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Content optimization opportunities
CREATE TABLE IF NOT EXISTS content_optimization_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Page data
    url TEXT NOT NULL,
    page_title TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('webpage', 'blog', 'product', 'about', 'faq', 'case_study')),
    
    -- Optimization recommendations
    missing_schema_types TEXT[],
    meta_tag_improvements JSONB,
    content_gaps TEXT[],
    ssr_issues TEXT[],
    
    -- Priority scoring
    optimization_priority TEXT NOT NULL DEFAULT 'medium' CHECK (optimization_priority IN ('critical', 'high', 'medium', 'low')),
    estimated_impact_score INTEGER CHECK (estimated_impact_score >= 0 AND estimated_impact_score <= 100),
    
    -- Implementation status
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'completed', 'deferred')),
    implementation_notes TEXT,
    
    -- Timestamps
    identified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 3: Predictive Query Engine (PAVSE)

-- Predictive query patterns
CREATE TABLE IF NOT EXISTS predictive_query_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Pattern data
    query_pattern TEXT NOT NULL,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('trending', 'seasonal', 'spike', 'emerging', 'declining')),
    industry_vertical TEXT,
    
    -- Prediction data
    predicted_volume INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_horizon_days INTEGER DEFAULT 1,
    
    -- Historical data
    historical_data JSONB, -- time series data
    seasonal_patterns JSONB,
    
    -- ARIMA model parameters
    arima_params JSONB,
    model_accuracy DECIMAL(5,2),
    
    -- Timestamps
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL
);

-- Bi-directional probing results
CREATE TABLE IF NOT EXISTS bidirectional_probing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Probe data
    probe_type TEXT NOT NULL CHECK (probe_type IN ('brand_to_entity', 'entity_to_brand')),
    query_text TEXT NOT NULL,
    target_entity TEXT,
    
    -- Results
    mention_found BOOLEAN NOT NULL DEFAULT FALSE,
    mention_rank INTEGER,
    mention_context TEXT,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    
    -- Platform data
    platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'claude', 'gemini', 'perplexity')),
    response_id TEXT,
    
    -- Analysis
    discrepancy_score DECIMAL(3,2) DEFAULT 0,
    optimization_opportunity TEXT,
    
    -- Timestamps
    probed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analyzed_at TIMESTAMPTZ
);

-- STEP 4: Indirect Signal Harvesting (ISHN)

-- Social signal harvesting
CREATE TABLE IF NOT EXISTS social_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Signal source
    platform TEXT NOT NULL CHECK (platform IN ('reddit', 'hackernews', 'twitter', 'linkedin', 'discord')),
    source_url TEXT,
    content TEXT NOT NULL,
    
    -- Signal analysis
    signal_type TEXT NOT NULL CHECK (signal_type IN ('trending_query', 'emerging_topic', 'competitor_mention', 'industry_shift')),
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    sentiment DECIMAL(3,2) CHECK (sentiment >= -1 AND sentiment <= 1),
    
    -- Co-occurrence data
    mentioned_entities TEXT[],
    co_occurrence_strength DECIMAL(3,2) DEFAULT 0,
    viral_probability DECIMAL(3,2) DEFAULT 0,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    actionable BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Semantic co-occurrence mapping
CREATE TABLE IF NOT EXISTS semantic_cooccurrence_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Entity relationship data
    entity_a TEXT NOT NULL,
    entity_b TEXT NOT NULL,
    relationship_type TEXT CHECK (relationship_type IN ('competitor', 'partner', 'supplier', 'alternative', 'complementary')),
    
    -- Co-occurrence metrics
    frequency_score INTEGER DEFAULT 0,
    context_similarity DECIMAL(3,2) CHECK (context_similarity >= 0 AND context_similarity <= 1),
    temporal_pattern JSONB, -- time-based patterns
    
    -- Sources
    source_contexts TEXT[],
    discovery_platforms TEXT[],
    
    -- Analysis
    strategic_importance TEXT CHECK (strategic_importance IN ('critical', 'high', 'medium', 'low')),
    optimization_potential INTEGER CHECK (optimization_potential >= 0 AND optimization_potential <= 100),
    
    -- Timestamps
    mapped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 5: Real-time Monitoring & Performance Tracking

-- Real-time visibility alerts
CREATE TABLE IF NOT EXISTS visibility_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Alert data
    alert_type TEXT NOT NULL CHECK (alert_type IN ('ldi_drop', 'competitor_surge', 'new_opportunity', 'technical_issue', 'trend_spike')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Trigger data
    trigger_threshold DECIMAL(5,2),
    current_value DECIMAL(5,2),
    previous_value DECIMAL(5,2),
    
    -- Context
    related_query TEXT,
    related_platform TEXT,
    affected_urls TEXT[],
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    resolution_notes TEXT,
    
    -- Timestamps
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- Performance attribution tracking
CREATE TABLE IF NOT EXISTS performance_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Attribution data
    optimization_id UUID, -- references various optimization tables
    optimization_type TEXT NOT NULL CHECK (optimization_type IN ('content_creation', 'schema_optimization', 'crawler_submission', 'social_seeding')),
    
    -- Performance metrics
    baseline_ldi_score INTEGER,
    current_ldi_score INTEGER,
    ldi_improvement INTEGER,
    citation_increase INTEGER DEFAULT 0,
    
    -- ROI calculation
    investment_cost DECIMAL(10,2) DEFAULT 0,
    estimated_value DECIMAL(10,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2),
    
    -- Time tracking
    implementation_date TIMESTAMPTZ NOT NULL,
    measurement_date TIMESTAMPTZ NOT NULL,
    attribution_confidence DECIMAL(3,2) CHECK (attribution_confidence >= 0 AND attribution_confidence <= 1)
);

-- Executive dashboard metrics
CREATE TABLE IF NOT EXISTS executive_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Metric period
    metric_period TEXT NOT NULL CHECK (metric_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Key metrics
    overall_ldi_score DECIMAL(5,2) NOT NULL,
    ldi_score_change DECIMAL(5,2) DEFAULT 0,
    total_mentions INTEGER DEFAULT 0,
    competitor_comparison_rank INTEGER,
    
    -- Financial metrics
    estimated_brand_value_impact DECIMAL(12,2) DEFAULT 0,
    optimization_spend DECIMAL(10,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2),
    
    -- Operational metrics
    content_pieces_created INTEGER DEFAULT 0,
    optimizations_implemented INTEGER DEFAULT 0,
    crawler_submissions INTEGER DEFAULT 0,
    
    -- Calculated timestamp
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 6: Memory Injection & Adaptive Testing

-- Memory injection tests (for robustness testing)
CREATE TABLE IF NOT EXISTS memory_injection_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Test configuration
    test_type TEXT NOT NULL CHECK (test_type IN ('reputation_stress', 'competitor_association', 'negative_context', 'bias_detection')),
    test_prompt TEXT NOT NULL,
    expected_outcome TEXT,
    
    -- Results
    actual_outcome TEXT,
    test_passed BOOLEAN,
    risk_level TEXT CHECK (risk_level IN ('critical', 'high', 'medium', 'low', 'none')),
    
    -- Mitigation
    mitigation_strategy TEXT,
    mitigation_implemented BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mitigated_at TIMESTAMPTZ
);

-- Adaptive prompt optimization
CREATE TABLE IF NOT EXISTS adaptive_prompt_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Prompt evolution
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT NOT NULL,
    optimization_generation INTEGER DEFAULT 1,
    
    -- Performance comparison
    original_performance_score DECIMAL(5,2),
    optimized_performance_score DECIMAL(5,2),
    improvement_percentage DECIMAL(5,2),
    
    -- Optimization strategy
    optimization_strategy TEXT NOT NULL CHECK (optimization_strategy IN ('llm_critique', 'adversarial_testing', 'a_b_comparison', 'reinforcement_learning')),
    feedback_data JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    replaced_by UUID REFERENCES adaptive_prompt_optimization(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performance_measured_at TIMESTAMPTZ
);

-- Comprehensive indexing for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ldi_scores_brand_platform_time ON ldi_scores(brand_id, platform, measured_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ldi_scores_query_category ON ldi_scores(query_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_benchmarks_brand_time ON competitor_benchmarks(brand_id, analysis_period_end DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_synthesis_brand_generated ON query_synthesis(brand_id, generated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crawler_visits_brand_time ON ai_crawler_visits(brand_id, visited_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crawler_visits_type ON ai_crawler_visits(crawler_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_optimization_opportunities_priority ON content_optimization_opportunities(optimization_priority, estimated_impact_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_predictive_patterns_brand_valid ON predictive_query_patterns(brand_id, valid_until DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidirectional_probing_brand_platform ON bidirectional_probing_results(brand_id, platform, probed_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_signals_brand_detected ON social_signals(brand_id, detected_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_signals_platform_type ON social_signals(platform, signal_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cooccurrence_brand_importance ON semantic_cooccurrence_map(brand_id, strategic_importance);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_alerts_brand_severity ON visibility_alerts(brand_id, severity, triggered_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_attribution_brand_type ON performance_attribution(brand_id, optimization_type, measurement_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executive_metrics_brand_period ON executive_metrics(brand_id, period_end DESC);

-- Row Level Security for all new tables
ALTER TABLE ldi_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_crawler_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidirectional_probing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_cooccurrence_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_injection_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_prompt_optimization ENABLE ROW LEVEL SECURITY;

-- Standard RLS policies for brand-based access
CREATE POLICY "Users can access their brand data" ON ldi_scores
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

-- Apply similar policies to all tables
CREATE POLICY "Users can access competitor benchmarks for their brands" ON competitor_benchmarks
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access query synthesis for their brands" ON query_synthesis
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access crawler visits for their brands" ON ai_crawler_visits
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access optimization opportunities for their brands" ON content_optimization_opportunities
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access predictive patterns for their brands" ON predictive_query_patterns
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access probing results for their brands" ON bidirectional_probing_results
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access social signals for their brands" ON social_signals
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access cooccurrence map for their brands" ON semantic_cooccurrence_map
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access visibility alerts for their brands" ON visibility_alerts
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access performance attribution for their brands" ON performance_attribution
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access executive metrics for their brands" ON executive_metrics
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access memory injection tests for their brands" ON memory_injection_tests
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

CREATE POLICY "Users can access adaptive optimization for their brands" ON adaptive_prompt_optimization
    FOR ALL USING (brand_id IN (SELECT b.id FROM brands b JOIN accounts a ON b.account_id = a.id JOIN account_users au ON a.id = au.account_id WHERE au.user_id = auth.uid()));

-- Dashboard views for comprehensive analytics
CREATE OR REPLACE VIEW ai_discoverability_dashboard AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    
    -- Current LDI Performance
    COALESCE(AVG(ls.ldi_score) FILTER (WHERE ls.measured_at >= NOW() - INTERVAL '7 days'), 0) as current_avg_ldi_score,
    COALESCE(AVG(ls.ldi_score) FILTER (WHERE ls.measured_at >= NOW() - INTERVAL '14 days' AND ls.measured_at < NOW() - INTERVAL '7 days'), 0) as previous_avg_ldi_score,
    
    -- Mention tracking
    COUNT(DISTINCT ls.id) FILTER (WHERE ls.measured_at >= NOW() - INTERVAL '30 days') as total_mentions_30d,
    COUNT(DISTINCT ls.id) FILTER (WHERE ls.mention_count > 0 AND ls.measured_at >= NOW() - INTERVAL '30 days') as successful_mentions_30d,
    
    -- Competitor comparison
    COUNT(DISTINCT cb.id) FILTER (WHERE cb.created_at >= NOW() - INTERVAL '30 days') as competitor_analyses,
    AVG(cb.brand_ldi_score - cb.competitor_ldi_score) FILTER (WHERE cb.created_at >= NOW() - INTERVAL '30 days') as avg_competitor_advantage,
    
    -- Content optimization
    COUNT(DISTINCT coo.id) FILTER (WHERE coo.status = 'completed' AND coo.updated_at >= NOW() - INTERVAL '30 days') as optimizations_completed,
    AVG(coo.estimated_impact_score) FILTER (WHERE coo.status = 'completed') as avg_optimization_impact,
    
    -- Alert tracking
    COUNT(DISTINCT va.id) FILTER (WHERE va.status = 'active') as active_alerts,
    COUNT(DISTINCT va.id) FILTER (WHERE va.severity IN ('critical', 'high') AND va.status = 'active') as critical_alerts,
    
    -- ROI metrics
    COALESCE(AVG(pa.roi_percentage) FILTER (WHERE pa.measurement_date >= NOW() - INTERVAL '90 days'), 0) as avg_roi_90d
    
FROM brands b
LEFT JOIN ldi_scores ls ON b.id = ls.brand_id
LEFT JOIN competitor_benchmarks cb ON b.id = cb.brand_id
LEFT JOIN content_optimization_opportunities coo ON b.id = coo.brand_id
LEFT JOIN visibility_alerts va ON b.id = va.brand_id
LEFT JOIN performance_attribution pa ON b.id = pa.brand_id
GROUP BY b.id, b.name;

-- Comments for documentation
COMMENT ON TABLE ldi_scores IS 'Tracks LLM Discoverability Index scores across AI platforms';
COMMENT ON TABLE competitor_benchmarks IS 'Competitive intelligence and benchmarking data';
COMMENT ON TABLE query_synthesis IS 'AI-generated query variations for testing visibility';
COMMENT ON TABLE ai_crawler_visits IS 'Detailed tracking of AI crawler visits and content analysis';
COMMENT ON TABLE content_optimization_opportunities IS 'Identified opportunities for improving AI discoverability';
COMMENT ON TABLE predictive_query_patterns IS 'ARIMA-based predictive analytics for emerging queries';
COMMENT ON TABLE bidirectional_probing_results IS 'Results from forward/reverse brand-entity association probing';
COMMENT ON TABLE social_signals IS 'Harvested social signals for trend detection';
COMMENT ON TABLE semantic_cooccurrence_map IS 'Brand co-occurrence relationships and strategic mapping';
COMMENT ON TABLE visibility_alerts IS 'Real-time alerts for visibility changes and opportunities';
COMMENT ON TABLE performance_attribution IS 'ROI attribution for optimization efforts';
COMMENT ON TABLE executive_metrics IS 'High-level KPIs for executive reporting';