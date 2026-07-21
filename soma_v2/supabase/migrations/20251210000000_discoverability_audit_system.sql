-- Discoverability & Indexing Audit System
-- Migration: 20251210000000_discoverability_audit_system.sql
-- Purpose: Comprehensive system for tracking site discoverability, indexing, and optimization tasks

-- =============================================================================
-- CORE AUDIT SYSTEM
-- =============================================================================

-- Discoverability audit tracking (similar to webmaster tools but more comprehensive)
CREATE TABLE IF NOT EXISTS discoverability_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    site_url TEXT NOT NULL,
    
    -- Audit metadata
    audit_type TEXT NOT NULL DEFAULT 'full' CHECK (audit_type IN ('full', 'quick', 'scheduled', 'manual')),
    audit_status TEXT NOT NULL DEFAULT 'pending' CHECK (audit_status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- Overall scores (0-100)
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    crawlability_score INTEGER CHECK (crawlability_score >= 0 AND crawlability_score <= 100),
    schema_score INTEGER CHECK (schema_score >= 0 AND schema_score <= 100),
    indexability_score INTEGER CHECK (indexability_score >= 0 AND indexability_score <= 100),
    internationalization_score INTEGER CHECK (internationalization_score >= 0 AND internationalization_score <= 100),
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    
    -- Audit results summary
    total_pages_checked INTEGER DEFAULT 0,
    pages_with_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,
    recommendations INTEGER DEFAULT 0,
    
    -- Technical data
    audit_results JSONB DEFAULT '{}'::jsonb,
    error_log JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual audit tasks/checks
CREATE TABLE IF NOT EXISTS audit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Task definition
    task_category TEXT NOT NULL CHECK (task_category IN ('crawlability', 'indexability', 'schema', 'internationalization', 'performance', 'security')),
    task_name TEXT NOT NULL,
    task_description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- Task status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checking', 'passed', 'failed', 'warning', 'fixed', 'deferred')),
    
    -- Issue details
    issue_found BOOLEAN DEFAULT FALSE,
    issue_details TEXT,
    affected_urls TEXT[] DEFAULT '{}',
    affected_count INTEGER DEFAULT 0,
    
    -- Fix recommendations
    fix_suggestion TEXT,
    fix_code_snippet TEXT,
    fix_documentation_url TEXT,
    estimated_effort TEXT CHECK (estimated_effort IN ('trivial', 'easy', 'moderate', 'complex', 'expert')),
    
    -- Fix tracking
    fix_implemented BOOLEAN DEFAULT FALSE,
    fix_verified BOOLEAN DEFAULT FALSE,
    fix_notes TEXT,
    implemented_by UUID REFERENCES auth.users(id),
    implemented_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Auto-recheck settings
    auto_recheck BOOLEAN DEFAULT TRUE,
    recheck_frequency_hours INTEGER DEFAULT 24,
    last_checked_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROBOTS.TXT & CRAWLER CONTROL
-- =============================================================================

-- Robots.txt analysis and recommendations
CREATE TABLE IF NOT EXISTS robots_txt_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    site_url TEXT NOT NULL,
    
    -- Current robots.txt data
    robots_txt_exists BOOLEAN DEFAULT FALSE,
    robots_txt_url TEXT,
    robots_txt_content TEXT,
    robots_txt_size INTEGER,
    
    -- Analysis results
    allows_googlebot BOOLEAN DEFAULT TRUE,
    allows_gptbot BOOLEAN DEFAULT FALSE,
    allows_claudebot BOOLEAN DEFAULT FALSE,
    allows_perplexitybot BOOLEAN DEFAULT FALSE,
    allows_google_extended BOOLEAN DEFAULT FALSE,
    
    -- Sitemap references
    sitemap_declared BOOLEAN DEFAULT FALSE,
    sitemap_urls TEXT[] DEFAULT '{}',
    
    -- Issues and recommendations
    issues_found TEXT[] DEFAULT '{}',
    blocking_critical_content BOOLEAN DEFAULT FALSE,
    blocking_ai_crawlers BOOLEAN DEFAULT FALSE,
    
    -- Generated recommendations
    recommended_robots_txt TEXT,
    recommendation_reasoning JSONB DEFAULT '{}'::jsonb,
    
    -- Validation
    syntax_valid BOOLEAN DEFAULT TRUE,
    syntax_errors TEXT[] DEFAULT '{}',
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SITEMAP MANAGEMENT
-- =============================================================================

-- Sitemap tracking and validation
CREATE TABLE IF NOT EXISTS sitemap_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    site_url TEXT NOT NULL,
    
    -- Sitemap discovery
    sitemaps_found TEXT[] DEFAULT '{}',
    sitemap_index_exists BOOLEAN DEFAULT FALSE,
    sitemap_in_robots_txt BOOLEAN DEFAULT FALSE,
    
    -- Sitemap validation
    total_urls INTEGER DEFAULT 0,
    valid_urls INTEGER DEFAULT 0,
    invalid_urls INTEGER DEFAULT 0,
    duplicate_urls INTEGER DEFAULT 0,
    
    -- URL analysis
    urls_with_lastmod INTEGER DEFAULT 0,
    urls_with_priority INTEGER DEFAULT 0,
    urls_with_changefreq INTEGER DEFAULT 0,
    
    -- Issues
    missing_pages TEXT[] DEFAULT '{}',
    broken_urls TEXT[] DEFAULT '{}',
    redirect_urls TEXT[] DEFAULT '{}',
    
    -- Recommendations
    should_create_sitemap BOOLEAN DEFAULT FALSE,
    recommended_sitemap_structure JSONB DEFAULT '{}'::jsonb,
    
    -- GSC submission tracking
    submitted_to_gsc BOOLEAN DEFAULT FALSE,
    gsc_submission_date TIMESTAMPTZ,
    gsc_indexed_urls INTEGER DEFAULT 0,
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SCHEMA & STRUCTURED DATA
-- =============================================================================

-- Schema.org structured data analysis
CREATE TABLE IF NOT EXISTS schema_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Page details
    url TEXT NOT NULL,
    page_title TEXT,
    page_type TEXT CHECK (page_type IN ('homepage', 'article', 'product', 'service', 'about', 'contact', 'faq', 'blog')),
    
    -- Schema detection
    has_schema BOOLEAN DEFAULT FALSE,
    schema_format TEXT CHECK (schema_format IN ('json-ld', 'microdata', 'rdfa', 'none')),
    schema_types_found TEXT[] DEFAULT '{}',
    
    -- Validation
    schema_valid BOOLEAN DEFAULT TRUE,
    validation_errors TEXT[] DEFAULT '{}',
    validation_warnings TEXT[] DEFAULT '{}',
    
    -- Recommended schemas for this page type
    recommended_schemas TEXT[] DEFAULT '{}',
    missing_schemas TEXT[] DEFAULT '{}',
    
    -- Field completeness (for each schema type)
    schema_completeness JSONB DEFAULT '{}'::jsonb, -- {Organization: {required: 5, found: 3, ...}}
    
    -- Generated schema suggestions
    suggested_schema_jsonld TEXT,
    
    -- Rich results eligibility
    rich_results_eligible BOOLEAN DEFAULT FALSE,
    eligible_rich_results TEXT[] DEFAULT '{}',
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema templates library
CREATE TABLE IF NOT EXISTS schema_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template metadata
    schema_type TEXT NOT NULL UNIQUE, -- 'Organization', 'Article', 'Product', etc.
    display_name TEXT NOT NULL,
    description TEXT,
    use_cases TEXT[] DEFAULT '{}',
    
    -- Template structure
    template_jsonld TEXT NOT NULL,
    required_fields JSONB NOT NULL, -- {fieldName: {type: 'string', description: '...'}}
    optional_fields JSONB NOT NULL,
    
    -- Validation rules
    validation_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Documentation
    google_docs_url TEXT,
    schema_org_url TEXT,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GOOGLE SEARCH CONSOLE INTEGRATION
-- =============================================================================

-- GSC connection tracking
CREATE TABLE IF NOT EXISTS gsc_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Connection details
    site_url TEXT NOT NULL,
    property_type TEXT CHECK (property_type IN ('domain', 'url_prefix')),
    
    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Connection status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'partial')),
    sync_error TEXT,
    
    -- Data sync settings
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency_hours INTEGER DEFAULT 24,
    
    -- Permissions
    scopes TEXT[] DEFAULT '{}',
    connected_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(brand_id, site_url)
);

-- GSC performance data (Search Analytics API)
CREATE TABLE IF NOT EXISTS gsc_performance_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gsc_connection_id UUID NOT NULL REFERENCES gsc_connections(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Dimensions
    date DATE NOT NULL,
    page_url TEXT,
    query TEXT,
    country TEXT,
    device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),
    
    -- Metrics
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    position DECIMAL(5,2) DEFAULT 0,
    
    -- Analysis
    click_trend TEXT CHECK (click_trend IN ('up', 'down', 'stable')),
    position_trend TEXT CHECK (position_trend IN ('improving', 'declining', 'stable')),
    
    -- Timestamps
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(gsc_connection_id, date, page_url, query, country, device)
);

-- GSC URL inspection results
CREATE TABLE IF NOT EXISTS gsc_url_inspection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gsc_connection_id UUID NOT NULL REFERENCES gsc_connections(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- URL details
    inspected_url TEXT NOT NULL,
    
    -- Indexing status
    coverage_state TEXT CHECK (coverage_state IN ('SUBMITTED_AND_INDEXED', 'CRAWLED_NOT_INDEXED', 'DISCOVERED_NOT_CRAWLED', 'PAGE_WITH_REDIRECT', 'EXCLUDED')),
    indexed BOOLEAN DEFAULT FALSE,
    index_status_reason TEXT,
    
    -- Crawl information
    last_crawl_time TIMESTAMPTZ,
    crawled_as TEXT CHECK (crawled_as IN ('desktop', 'mobile')),
    robots_txt_state TEXT CHECK (robots_txt_state IN ('ALLOWED', 'BLOCKED')),
    
    -- Mobile usability
    mobile_friendly BOOLEAN DEFAULT FALSE,
    mobile_issues TEXT[] DEFAULT '{}',
    
    -- Rich results
    rich_results_detected TEXT[] DEFAULT '{}',
    rich_results_issues TEXT[] DEFAULT '{}',
    
    -- Page experience
    core_web_vitals_passed BOOLEAN DEFAULT FALSE,
    lcp_score DECIMAL(5,2),
    fid_score DECIMAL(5,2),
    cls_score DECIMAL(5,2),
    
    -- AMP
    amp_url TEXT,
    amp_valid BOOLEAN DEFAULT FALSE,
    
    -- Full inspection data
    inspection_result JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INTERNATIONALIZATION & HREFLANG
-- =============================================================================

-- Internationalization audit
CREATE TABLE IF NOT EXISTS internationalization_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Site configuration
    primary_language TEXT NOT NULL DEFAULT 'en',
    supported_languages TEXT[] DEFAULT '{}',
    supported_regions TEXT[] DEFAULT '{}',
    
    -- Hreflang analysis
    hreflang_implemented BOOLEAN DEFAULT FALSE,
    hreflang_errors TEXT[] DEFAULT '{}',
    hreflang_warnings TEXT[] DEFAULT '{}',
    
    -- URL structure
    url_structure TEXT CHECK (url_structure IN ('subdomain', 'subdirectory', 'parameter', 'separate_domain', 'none')),
    url_structure_consistent BOOLEAN DEFAULT TRUE,
    
    -- Content analysis
    pages_with_translations INTEGER DEFAULT 0,
    pages_missing_translations INTEGER DEFAULT 0,
    translation_coverage_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- RTL support (for Arabic, Hebrew, etc.)
    rtl_languages_supported TEXT[] DEFAULT '{}',
    rtl_css_implemented BOOLEAN DEFAULT FALSE,
    
    -- Locale-specific content
    locale_specific_content JSONB DEFAULT '{}'::jsonb,
    
    -- Recommendations
    recommended_structure TEXT,
    implementation_guide TEXT,
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CONTENT FRESHNESS & QUALITY
-- =============================================================================

-- Content freshness tracking
CREATE TABLE IF NOT EXISTS content_freshness_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Page details
    url TEXT NOT NULL,
    page_title TEXT,
    content_type TEXT,
    
    -- Freshness metrics
    last_modified TIMESTAMPTZ,
    days_since_update INTEGER,
    update_frequency TEXT CHECK (update_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'rarely', 'never')),
    
    -- Content analysis
    word_count INTEGER DEFAULT 0,
    entity_coverage_score INTEGER CHECK (entity_coverage_score >= 0 AND entity_coverage_score <= 100),
    topical_authority_score INTEGER CHECK (topical_authority_score >= 0 AND topical_authority_score <= 100),
    
    -- Relevance to target prompts
    matches_target_prompts BOOLEAN DEFAULT FALSE,
    target_prompt_coverage TEXT[] DEFAULT '{}',
    missing_entities TEXT[] DEFAULT '{}',
    
    -- Recommendations
    needs_update BOOLEAN DEFAULT FALSE,
    update_priority TEXT CHECK (update_priority IN ('urgent', 'high', 'medium', 'low')),
    update_suggestions TEXT[] DEFAULT '{}',
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PAGE PERFORMANCE AUDIT
-- =============================================================================

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES discoverability_audits(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Page details
    url TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile')),
    
    -- Core Web Vitals
    lcp_score DECIMAL(6,2), -- Largest Contentful Paint (ms)
    fid_score DECIMAL(6,2), -- First Input Delay (ms)
    cls_score DECIMAL(4,3), -- Cumulative Layout Shift
    fcp_score DECIMAL(6,2), -- First Contentful Paint (ms)
    ttfb_score DECIMAL(6,2), -- Time to First Byte (ms)
    
    -- Overall performance
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    cwv_passed BOOLEAN DEFAULT FALSE,
    
    -- Resource analysis
    total_page_size_kb INTEGER,
    javascript_size_kb INTEGER,
    css_size_kb INTEGER,
    image_size_kb INTEGER,
    
    -- Optimization opportunities
    images_need_optimization BOOLEAN DEFAULT FALSE,
    scripts_not_minified BOOLEAN DEFAULT FALSE,
    render_blocking_resources INTEGER DEFAULT 0,
    unused_css_kb INTEGER DEFAULT 0,
    
    -- Recommendations
    optimization_suggestions JSONB DEFAULT '[]'::jsonb,
    estimated_improvement_seconds DECIMAL(4,2) DEFAULT 0,
    
    -- Timestamps
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CRAWLER VISIT ANALYTICS
-- =============================================================================

-- Enhanced crawler analytics (extends existing crawler_visits table)
CREATE TABLE IF NOT EXISTS crawler_behavior_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_period_start TIMESTAMPTZ NOT NULL,
    analysis_period_end TIMESTAMPTZ NOT NULL,
    
    -- Crawler identification
    crawler_name TEXT NOT NULL,
    crawler_type TEXT CHECK (crawler_type IN ('ai', 'search', 'social', 'other')),
    
    -- Behavior metrics
    total_visits INTEGER DEFAULT 0,
    unique_pages_visited INTEGER DEFAULT 0,
    avg_visit_frequency_hours DECIMAL(5,2),
    
    -- Crawl patterns
    most_visited_pages TEXT[] DEFAULT '{}',
    least_visited_pages TEXT[] DEFAULT '{}',
    crawl_depth_distribution JSONB DEFAULT '{}'::jsonb,
    
    -- Response analysis
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(5,2) DEFAULT 0,
    status_code_distribution JSONB DEFAULT '{}'::jsonb,
    
    -- Suspicious behavior detection
    potential_spoofing BOOLEAN DEFAULT FALSE,
    rate_limit_violations INTEGER DEFAULT 0,
    unusual_patterns TEXT[] DEFAULT '{}',
    
    -- Recommendations
    blocking_recommended BOOLEAN DEFAULT FALSE,
    rate_limiting_suggested BOOLEAN DEFAULT FALSE,
    recommendations TEXT[] DEFAULT '{}',
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discoverability_audits_brand_created ON discoverability_audits(brand_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discoverability_audits_status ON discoverability_audits(audit_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tasks_audit_id ON audit_tasks(audit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tasks_brand_status ON audit_tasks(brand_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tasks_category_priority ON audit_tasks(task_category, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tasks_next_check ON audit_tasks(next_check_at) WHERE auto_recheck = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_robots_txt_analysis_brand ON robots_txt_analysis(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sitemap_analysis_brand ON sitemap_analysis(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schema_analysis_audit_url ON schema_analysis(audit_id, url);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schema_analysis_brand ON schema_analysis(brand_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gsc_connections_brand ON gsc_connections(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gsc_connections_active ON gsc_connections(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gsc_performance_brand_date ON gsc_performance_data(brand_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gsc_performance_query ON gsc_performance_data(query);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gsc_url_inspection_brand ON gsc_url_inspection(brand_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intl_audit_brand ON internationalization_audit(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_freshness_brand ON content_freshness_audit(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_freshness_needs_update ON content_freshness_audit(needs_update) WHERE needs_update = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_audit_brand ON performance_audit(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crawler_behavior_brand_period ON crawler_behavior_analysis(brand_id, analysis_period_end DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE discoverability_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE robots_txt_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_performance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_url_inspection ENABLE ROW LEVEL SECURITY;
ALTER TABLE internationalization_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_freshness_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_behavior_analysis ENABLE ROW LEVEL SECURITY;

-- Standard brand-based RLS policies
CREATE POLICY "Users can access discoverability audits for their brands" ON discoverability_audits
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access audit tasks for their brands" ON audit_tasks
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access robots analysis for their brands" ON robots_txt_analysis
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access sitemap analysis for their brands" ON sitemap_analysis
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access schema analysis for their brands" ON schema_analysis
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

-- Schema templates are public (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read schema templates" ON schema_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can manage schema templates" ON schema_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can access GSC connections for their brands" ON gsc_connections
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access GSC performance data for their brands" ON gsc_performance_data
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access GSC URL inspection for their brands" ON gsc_url_inspection
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access intl audit for their brands" ON internationalization_audit
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access content freshness audit for their brands" ON content_freshness_audit
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access performance audit for their brands" ON performance_audit
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

CREATE POLICY "Users can access crawler behavior analysis for their brands" ON crawler_behavior_analysis
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = TRUE
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate overall audit score
CREATE OR REPLACE FUNCTION calculate_audit_overall_score(p_audit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_crawlability INTEGER;
    v_schema INTEGER;
    v_indexability INTEGER;
    v_intl INTEGER;
    v_performance INTEGER;
    v_overall INTEGER;
BEGIN
    SELECT 
        crawlability_score,
        schema_score,
        indexability_score,
        internationalization_score,
        performance_score
    INTO v_crawlability, v_schema, v_indexability, v_intl, v_performance
    FROM discoverability_audits
    WHERE id = p_audit_id;
    
    -- Weighted average: crawlability 30%, schema 25%, indexability 25%, intl 10%, performance 10%
    v_overall := (
        COALESCE(v_crawlability, 0) * 0.30 +
        COALESCE(v_schema, 0) * 0.25 +
        COALESCE(v_indexability, 0) * 0.25 +
        COALESCE(v_intl, 0) * 0.10 +
        COALESCE(v_performance, 0) * 0.10
    )::INTEGER;
    
    UPDATE discoverability_audits
    SET overall_score = v_overall,
        updated_at = NOW()
    WHERE id = p_audit_id;
    
    RETURN v_overall;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-schedule task rechecks
CREATE OR REPLACE FUNCTION schedule_task_recheck()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auto_recheck = TRUE AND NEW.recheck_frequency_hours IS NOT NULL THEN
        NEW.next_check_at := NOW() + (NEW.recheck_frequency_hours || ' hours')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_task_recheck
    BEFORE INSERT OR UPDATE OF auto_recheck, recheck_frequency_hours, last_checked_at
    ON audit_tasks
    FOR EACH ROW
    EXECUTE FUNCTION schedule_task_recheck();

-- =============================================================================
-- SEED DATA: Schema Templates
-- =============================================================================

-- Insert common schema templates
INSERT INTO schema_templates (schema_type, display_name, description, use_cases, template_jsonld, required_fields, optional_fields, google_docs_url, schema_org_url)
VALUES 
(
    'Organization',
    'Organization Schema',
    'Define your organization with structured data for better brand entity recognition',
    ARRAY['Homepage', 'About page', 'Contact page'],
    '{
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "{{organizationName}}",
        "url": "{{websiteUrl}}",
        "logo": "{{logoUrl}}",
        "description": "{{description}}",
        "sameAs": {{socialProfiles}},
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "{{contactEmail}}"
        }
    }',
    '{"name": {"type": "string", "description": "Organization name"}, "url": {"type": "string", "description": "Website URL"}}'::jsonb,
    '{"logo": {"type": "string", "description": "Logo URL"}, "description": {"type": "string", "description": "Organization description"}, "sameAs": {"type": "array", "description": "Social profile URLs"}, "contactEmail": {"type": "string", "description": "Contact email"}}'::jsonb,
    'https://developers.google.com/search/docs/appearance/structured-data/organization',
    'https://schema.org/Organization'
),
(
    'Article',
    'Article Schema',
    'Markup for blog posts and articles to appear in rich results',
    ARRAY['Blog posts', 'News articles', 'Editorial content'],
    '{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{{headline}}",
        "author": {
            "@type": "Person",
            "name": "{{authorName}}"
        },
        "datePublished": "{{publishDate}}",
        "dateModified": "{{modifiedDate}}",
        "image": "{{imageUrl}}",
        "publisher": {
            "@type": "Organization",
            "name": "{{publisherName}}",
            "logo": {
                "@type": "ImageObject",
                "url": "{{publisherLogo}}"
            }
        }
    }',
    '{"headline": {"type": "string", "description": "Article headline"}, "authorName": {"type": "string", "description": "Author name"}, "publishDate": {"type": "string", "description": "ISO 8601 date"}, "imageUrl": {"type": "string", "description": "Featured image URL"}}'::jsonb,
    '{"modifiedDate": {"type": "string", "description": "Last modified date"}, "publisherName": {"type": "string", "description": "Publisher name"}, "publisherLogo": {"type": "string", "description": "Publisher logo URL"}}'::jsonb,
    'https://developers.google.com/search/docs/appearance/structured-data/article',
    'https://schema.org/Article'
)
ON CONFLICT (schema_type) DO NOTHING;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE discoverability_audits IS 'Main audit tracking for site discoverability and indexing';
COMMENT ON TABLE audit_tasks IS 'Individual actionable tasks from audits with fix tracking';
COMMENT ON TABLE robots_txt_analysis IS 'Analysis of robots.txt files with AI crawler recommendations';
COMMENT ON TABLE sitemap_analysis IS 'Sitemap validation and tracking';
COMMENT ON TABLE schema_analysis IS 'Page-level schema.org structured data analysis';
COMMENT ON TABLE schema_templates IS 'Reusable schema.org templates for common page types';
COMMENT ON TABLE gsc_connections IS 'Google Search Console OAuth connections';
COMMENT ON TABLE gsc_performance_data IS 'Search performance data from GSC Search Analytics API';
COMMENT ON TABLE gsc_url_inspection IS 'URL inspection results from GSC URL Inspection API';
COMMENT ON TABLE internationalization_audit IS 'Hreflang and multi-language/region support audit';
COMMENT ON TABLE content_freshness_audit IS 'Content freshness and relevance tracking';
COMMENT ON TABLE performance_audit IS 'Page performance and Core Web Vitals tracking';
COMMENT ON TABLE crawler_behavior_analysis IS 'AI crawler behavior patterns and anomaly detection';
