-- Brand Mentions System Migration
-- Creates tables for storing and analyzing brand mentions across AI platforms

-- Brand mentions table for storing discovered mentions
CREATE TABLE IF NOT EXISTS brand_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Source information
    source_url TEXT NOT NULL,
    source_platform TEXT NOT NULL, -- 'ChatGPT', 'Claude', 'Gemini', 'Perplexity', etc.
    source_type TEXT DEFAULT 'ai_response', -- 'ai_response', 'social_media', 'blog', 'forum'
    
    -- Mention content
    mention_text TEXT NOT NULL,
    context_before TEXT, -- Text before the mention for context
    context_after TEXT,  -- Text after the mention for context
    full_content TEXT,   -- Full content if available
    
    -- Analysis data
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 confidence in sentiment analysis
    context_type TEXT DEFAULT 'general', -- 'recommendation', 'comparison', 'tutorial', 'review', etc.
    
    -- Keywords and topics
    keywords JSONB DEFAULT '[]', -- Array of extracted keywords
    topics JSONB DEFAULT '[]',   -- Array of identified topics
    entities JSONB DEFAULT '[]', -- Named entities found in the mention
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Flexible metadata storage
    
    -- Timestamps
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE, -- When the mention was originally published
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing for performance
    CONSTRAINT brand_mentions_brand_id_idx FOREIGN KEY (brand_id) REFERENCES brands(id),
    CONSTRAINT brand_mentions_workspace_id_idx FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_brand_mentions_brand_id ON brand_mentions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_workspace_id ON brand_mentions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_platform ON brand_mentions(source_platform);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_sentiment ON brand_mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_discovered_at ON brand_mentions(discovered_at);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_published_at ON brand_mentions(published_at);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_context_type ON brand_mentions(context_type);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_brand_mentions_keywords ON brand_mentions USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_topics ON brand_mentions USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_metadata ON brand_mentions USING GIN(metadata);

-- Mention tracking table for duplicate detection and monitoring
CREATE TABLE IF NOT EXISTS mention_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- Hash of mention content for duplicate detection
    first_discovered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mention_count INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('new', 'processed', 'ignored', 'duplicate')) DEFAULT 'new',
    
    -- Ensure unique combination of brand, url, and content hash
    UNIQUE(brand_id, source_url, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_mention_tracking_brand_id ON mention_tracking(brand_id);
CREATE INDEX IF NOT EXISTS idx_mention_tracking_status ON mention_tracking(status);
CREATE INDEX IF NOT EXISTS idx_mention_tracking_content_hash ON mention_tracking(content_hash);

-- Mention analysis results for storing AI analysis outputs
CREATE TABLE IF NOT EXISTS mention_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mention_id UUID NOT NULL REFERENCES brand_mentions(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL, -- 'sentiment', 'topic', 'entity', 'summary'
    analyzer_version TEXT NOT NULL, -- Version of the analysis model used
    
    -- Analysis results
    results JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Analysis metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER, -- Time taken for analysis in milliseconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mention_analysis_mention_id ON mention_analysis(mention_id);
CREATE INDEX IF NOT EXISTS idx_mention_analysis_type ON mention_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_mention_analysis_processed_at ON mention_analysis(processed_at);
CREATE INDEX IF NOT EXISTS idx_mention_analysis_results ON mention_analysis USING GIN(results);

-- Mention alerts for monitoring significant mentions
CREATE TABLE IF NOT EXISTS mention_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    mention_id UUID REFERENCES brand_mentions(id) ON DELETE CASCADE,
    
    -- Alert configuration
    alert_type TEXT NOT NULL, -- 'negative_sentiment', 'high_visibility', 'competitor_comparison', 'trending_topic'
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Alert details
    title TEXT NOT NULL,
    description TEXT,
    alert_data JSONB DEFAULT '{}',
    
    -- Alert status
    status TEXT CHECK (status IN ('pending', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'pending',
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mention_alerts_brand_id ON mention_alerts(brand_id);
CREATE INDEX IF NOT EXISTS idx_mention_alerts_mention_id ON mention_alerts(mention_id);
CREATE INDEX IF NOT EXISTS idx_mention_alerts_type ON mention_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_mention_alerts_severity ON mention_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_mention_alerts_status ON mention_alerts(status);
CREATE INDEX IF NOT EXISTS idx_mention_alerts_triggered_at ON mention_alerts(triggered_at);

-- Materialized view for mention analytics aggregation (simplified)
CREATE MATERIALIZED VIEW IF NOT EXISTS mention_analytics_summary AS
SELECT 
    brand_id,
    workspace_id,
    source_platform,
    sentiment,
    context_type,
    DATE(discovered_at) as mention_date,
    COUNT(*) as mention_count,
    AVG(confidence_score) as avg_confidence,
    COUNT(DISTINCT source_url) as unique_sources,
    
    -- Sentiment breakdown
    COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
    
    -- Context breakdown
    COUNT(*) FILTER (WHERE context_type = 'recommendation') as recommendation_count,
    COUNT(*) FILTER (WHERE context_type = 'comparison') as comparison_count,
    COUNT(*) FILTER (WHERE context_type = 'tutorial') as tutorial_count,
    COUNT(*) FILTER (WHERE context_type = 'review') as review_count,
    
    MAX(discovered_at) as last_updated
FROM brand_mentions 
WHERE discovered_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY brand_id, workspace_id, source_platform, sentiment, context_type, DATE(discovered_at);

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mention_analytics_summary_unique 
ON mention_analytics_summary (brand_id, workspace_id, source_platform, sentiment, context_type, mention_date);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_mention_analytics_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mention_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_brand_mentions_updated_at ON brand_mentions;
CREATE TRIGGER update_brand_mentions_updated_at
    BEFORE UPDATE ON brand_mentions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mention_alerts_updated_at ON mention_alerts;
CREATE TRIGGER update_mention_alerts_updated_at
    BEFORE UPDATE ON mention_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for brand_mentions (simplified for now)
CREATE POLICY "Users can view mentions for their brands" ON brand_mentions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert mentions for their brands" ON brand_mentions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mentions for their brands" ON brand_mentions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policies for mention_tracking
CREATE POLICY "Users can view mention tracking for their brands" ON mention_tracking
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for mention_analysis
CREATE POLICY "Users can view mention analysis for their brands" ON mention_analysis
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for mention_alerts
CREATE POLICY "Users can view mention alerts for their brands" ON mention_alerts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mention alerts for their brands" ON mention_alerts
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT ON mention_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_mention_analytics_summary() TO authenticated;