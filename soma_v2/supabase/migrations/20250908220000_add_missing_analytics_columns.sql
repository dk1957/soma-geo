-- Comprehensive Analytics Schema Alignment Migration
-- This migration adds all missing columns needed by analytics and reporting endpoints
-- Fixes schema mismatches discovered during testing

-- ========== BRAND MONITORING CONFIG UPDATES ==========

-- Add missing columns to brand_monitoring_config
ALTER TABLE brand_monitoring_config 
ADD COLUMN IF NOT EXISTS target_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS competitor_tracking_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS query_frequency_hours integer DEFAULT 24;

-- Update existing monitoring_keywords to target_keywords for backward compatibility
UPDATE brand_monitoring_config 
SET target_keywords = monitoring_keywords 
WHERE target_keywords = '{}' AND monitoring_keywords IS NOT NULL;

-- ========== COMPETITIVE VISIBILITY ANALYSIS UPDATES ==========

-- Add missing columns to competitive_visibility_analysis
ALTER TABLE competitive_visibility_analysis
ADD COLUMN IF NOT EXISTS analysis_type text DEFAULT 'onboarding_baseline',
ADD COLUMN IF NOT EXISTS brand_ranking_average numeric(3,1),
ADD COLUMN IF NOT EXISTS analysis_confidence numeric(3,1),
ADD COLUMN IF NOT EXISTS competitor_mention_counts jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_share_estimate numeric(5,2),
ADD COLUMN IF NOT EXISTS competitive_positioning text,
ADD COLUMN IF NOT EXISTS total_queries_analyzed integer,
ADD COLUMN IF NOT EXISTS sentiment_distribution jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS platform_performance jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS top_competitors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ========== BRAND LLM INDICES UPDATES ==========

-- Add missing columns to brand_llm_indices
ALTER TABLE brand_llm_indices
ADD COLUMN IF NOT EXISTS data_quality_score numeric(3,1),
ADD COLUMN IF NOT EXISTS confidence_interval text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ========== LLM VISIBILITY TRACKING ENHANCEMENTS ==========

-- Ensure all fields used by populate-analytics exist
ALTER TABLE llm_visibility_tracking
ADD COLUMN IF NOT EXISTS query_text text,
ADD COLUMN IF NOT EXISTS response_text text,
ADD COLUMN IF NOT EXISTS mention_context text,
ADD COLUMN IF NOT EXISTS citation_url text,
ADD COLUMN IF NOT EXISTS user_intent_commercial boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS query_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS query_region text,
ADD COLUMN IF NOT EXISTS response_generated_at timestamptz;

-- ========== ADDITIONAL ANALYTICS TABLES ==========

-- Ensure analytics_daily exists for summary endpoint
CREATE TABLE IF NOT EXISTS analytics_daily (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    date date NOT NULL,
    total_mentions integer DEFAULT 0,
    positive_mentions integer DEFAULT 0,
    negative_mentions integer DEFAULT 0,
    neutral_mentions integer DEFAULT 0,
    total_queries integer DEFAULT 0,
    visibility_score numeric(5,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(brand_id, date)
);

-- Ensure analytics_hourly exists for summary endpoint
CREATE TABLE IF NOT EXISTS analytics_hourly (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    hour timestamptz NOT NULL,
    mentions_count integer DEFAULT 0,
    queries_count integer DEFAULT 0,
    avg_sentiment numeric(3,1) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(brand_id, hour)
);

-- Ensure analytics_events exists for events endpoint
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Ensure usage_logs exists for recent activity endpoint
CREATE TABLE IF NOT EXISTS usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action text NOT NULL,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Ensure mentions table exists for mention analytics
CREATE TABLE IF NOT EXISTS mentions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    platform text NOT NULL,
    content text NOT NULL,
    sentiment sentiment_score DEFAULT 'neutral',
    mention_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Ensure audit_results exists for brand reporting
CREATE TABLE IF NOT EXISTS audit_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    audit_type text NOT NULL,
    results jsonb NOT NULL,
    score numeric(5,2),
    created_at timestamptz DEFAULT now()
);

-- Ensure source_analysis exists for brand reporting
CREATE TABLE IF NOT EXISTS source_analysis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    source_url text NOT NULL,
    analysis_data jsonb NOT NULL,
    score numeric(5,2),
    created_at timestamptz DEFAULT now()
);

-- Ensure analysis_batches exists for intelligence reporting
CREATE TABLE IF NOT EXISTS analysis_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    batch_name text NOT NULL,
    status text DEFAULT 'pending',
    results jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Ensure brand_intelligence_reports exists for intelligence reporting
CREATE TABLE IF NOT EXISTS brand_intelligence_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    report_type text NOT NULL,
    report_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Ensure audit_reports exists for report storage
CREATE TABLE IF NOT EXISTS audit_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    report_content jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Ensure audit_scores exists for report storage
CREATE TABLE IF NOT EXISTS audit_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_report_id uuid NOT NULL REFERENCES audit_reports(id) ON DELETE CASCADE,
    category text NOT NULL,
    score numeric(5,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ========== INDEXES FOR PERFORMANCE ==========

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_brand_monitoring_target_keywords ON brand_monitoring_config USING GIN (target_keywords);
CREATE INDEX IF NOT EXISTS idx_brand_monitoring_tracking_enabled ON brand_monitoring_config(tracking_enabled);

CREATE INDEX IF NOT EXISTS idx_competitive_analysis_type ON competitive_visibility_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_competitive_positioning ON competitive_visibility_analysis(competitive_positioning);
CREATE INDEX IF NOT EXISTS idx_competitive_created_at ON competitive_visibility_analysis(created_at);

CREATE INDEX IF NOT EXISTS idx_brand_indices_quality_score ON brand_llm_indices(data_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_brand_indices_confidence ON brand_llm_indices(confidence_interval);
CREATE INDEX IF NOT EXISTS idx_brand_indices_created_at ON brand_llm_indices(created_at);

CREATE INDEX IF NOT EXISTS idx_visibility_query_language ON llm_visibility_tracking(query_language);
CREATE INDEX IF NOT EXISTS idx_visibility_query_region ON llm_visibility_tracking(query_region);
CREATE INDEX IF NOT EXISTS idx_visibility_user_intent ON llm_visibility_tracking(user_intent_commercial);

-- Analytics performance indexes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(brand_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_hour ON analytics_hourly(brand_id, hour DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(brand_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action ON usage_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_platform_date ON mentions(brand_id, platform, mention_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_results_type ON audit_results(brand_id, audit_type, created_at DESC);

-- ========== ROW LEVEL SECURITY ==========

-- Enable RLS on new tables
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables (basic brand access)
CREATE POLICY "Users can access their brand analytics_daily" ON analytics_daily
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their brand analytics_hourly" ON analytics_hourly
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their brand analytics_events" ON analytics_events
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their usage_logs" ON usage_logs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access their brand mentions" ON mentions
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

-- ========== COLUMN COMMENTS ==========

-- Update column comments for documentation
COMMENT ON COLUMN brand_monitoring_config.target_keywords IS 'Primary keywords to monitor for brand mentions (replaces monitoring_keywords)';
COMMENT ON COLUMN brand_monitoring_config.tracking_enabled IS 'Whether monitoring is active for this brand';
COMMENT ON COLUMN brand_monitoring_config.competitor_tracking_enabled IS 'Whether competitor analysis is enabled';
COMMENT ON COLUMN brand_monitoring_config.query_frequency_hours IS 'How often to run LLM queries (hours)';

COMMENT ON COLUMN competitive_visibility_analysis.analysis_type IS 'Type of competitive analysis (onboarding_baseline, scheduled, manual)';
COMMENT ON COLUMN competitive_visibility_analysis.brand_ranking_average IS 'Average ranking position across all queries';
COMMENT ON COLUMN competitive_visibility_analysis.analysis_confidence IS 'Confidence score based on sample size (0-100)';
COMMENT ON COLUMN competitive_visibility_analysis.competitor_mention_counts IS 'JSON object with competitor mention frequencies';
COMMENT ON COLUMN competitive_visibility_analysis.competitive_positioning IS 'Overall competitive position (strong, moderate, weak)';
COMMENT ON COLUMN competitive_visibility_analysis.sentiment_distribution IS 'JSON breakdown of sentiment scores';
COMMENT ON COLUMN competitive_visibility_analysis.platform_performance IS 'JSON breakdown by LLM platform';
COMMENT ON COLUMN competitive_visibility_analysis.top_competitors IS 'Array of top competing brands identified';

COMMENT ON COLUMN brand_llm_indices.data_quality_score IS 'Quality score based on data completeness and freshness (0-100)';
COMMENT ON COLUMN brand_llm_indices.confidence_interval IS 'Statistical confidence level (very_low, low, medium, high, very_high)';
COMMENT ON COLUMN brand_llm_indices.created_at IS 'Timestamp when the indices were calculated';

COMMENT ON COLUMN llm_visibility_tracking.query_text IS 'The original query text sent to the LLM';
COMMENT ON COLUMN llm_visibility_tracking.response_text IS 'The complete response text from the LLM';
COMMENT ON COLUMN llm_visibility_tracking.mention_context IS 'Surrounding context where brand was mentioned';
COMMENT ON COLUMN llm_visibility_tracking.citation_url IS 'URL cited in the response (if any)';
COMMENT ON COLUMN llm_visibility_tracking.user_intent_commercial IS 'Whether the query had commercial intent';
COMMENT ON COLUMN llm_visibility_tracking.query_language IS 'Language of the original query';
COMMENT ON COLUMN llm_visibility_tracking.query_region IS 'Geographic region context of the query';
COMMENT ON COLUMN llm_visibility_tracking.response_generated_at IS 'When the LLM response was originally generated';