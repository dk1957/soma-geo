-- Rapid Discoverability Optimization Tables
CREATE TABLE IF NOT EXISTS visibility_gap_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    industry_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_analysis_id UUID REFERENCES visibility_gap_analyses(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content_data JSONB NOT NULL,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'published', 'archived')),
    publish_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dynamic_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES generated_content(id) ON DELETE CASCADE,
    endpoint_type TEXT NOT NULL CHECK (endpoint_type IN ('markdown', 'json_ld', 'sitemap')),
    path TEXT NOT NULL,
    content_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Publishing & Submission Tables
CREATE TABLE IF NOT EXISTS quotable_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content_data JSONB NOT NULL,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'scheduled', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawler_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('indexnow', 'common_crawl_proxy', 'sitemap_update')),
    urls TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
    response_data JSONB,
    audit_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audited_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS content_seeding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'hackernews')),
    content TEXT NOT NULL,
    hashtags TEXT[],
    timing_strategy TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sitemaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    sitemap_type TEXT NOT NULL CHECK (sitemap_type IN ('standard', 'ai_optimized', 'news', 'images')),
    sitemap_content TEXT NOT NULL,
    urls_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced content submissions table (extending existing)
CREATE TABLE IF NOT EXISTS content_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('indexnow', 'sitemap', 'rss', 'social', 'directory')),
    urls TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
    response_data JSONB,
    feedback_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback_updated_at TIMESTAMP WITH TIME ZONE
);

-- Rapid Discoverability Dashboard Views
CREATE OR REPLACE VIEW rapid_discoverability_stats AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    COUNT(DISTINCT vga.id) as total_gap_analyses,
    COUNT(DISTINCT gc.id) as total_generated_content,
    COUNT(DISTINCT cs.id) as total_submissions,
    COUNT(DISTINCT gc.id) FILTER (WHERE gc.status = 'published') as published_content,
    COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'success') as successful_submissions,
    AVG(CASE 
        WHEN cs.feedback_data->>'feedback_score' IS NOT NULL 
        THEN (cs.feedback_data->>'feedback_score')::NUMERIC 
        ELSE NULL 
    END) as avg_feedback_score
FROM brands b
LEFT JOIN visibility_gap_analyses vga ON b.id = vga.brand_id
LEFT JOIN generated_content gc ON b.id = gc.brand_id
LEFT JOIN content_submissions cs ON b.id = cs.brand_id
GROUP BY b.id, b.name;

-- Content Publishing Dashboard Views
CREATE OR REPLACE VIEW content_publishing_stats AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    COUNT(DISTINCT qc.id) as quotable_content_created,
    COUNT(DISTINCT crs.id) as crawler_submissions,
    COUNT(DISTINCT cst.id) as seeding_tasks,
    COUNT(DISTINCT s.id) as sitemaps_generated,
    SUM(array_length(crs.urls, 1)) as total_urls_submitted,
    COUNT(DISTINCT crs.id) FILTER (WHERE crs.status = 'success') as successful_crawler_submissions,
    COUNT(DISTINCT cst.id) FILTER (WHERE cst.status = 'posted') as successful_seeding_tasks
FROM brands b
LEFT JOIN quotable_content qc ON b.id = qc.brand_id
LEFT JOIN crawler_submissions crs ON b.id = crs.brand_id
LEFT JOIN content_seeding_tasks cst ON b.id = cst.brand_id
LEFT JOIN sitemaps s ON b.id = s.brand_id
GROUP BY b.id, b.name;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visibility_gap_analyses_brand_id ON visibility_gap_analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_visibility_gap_analyses_created_at ON visibility_gap_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_content_brand_id ON generated_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_quotable_content_brand_id ON quotable_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_crawler_submissions_brand_id ON crawler_submissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_crawler_submissions_submitted_at ON crawler_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_content_seeding_tasks_brand_id ON content_seeding_tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_seeding_tasks_platform ON content_seeding_tasks(platform);
CREATE INDEX IF NOT EXISTS idx_content_submissions_brand_id ON content_submissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_submissions_submitted_at ON content_submissions(submitted_at);

-- Add IndexNow key to brands table if it doesn't exist
ALTER TABLE brands ADD COLUMN IF NOT EXISTS indexnow_key TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS domain TEXT;

-- RLS Policies
ALTER TABLE visibility_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotable_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_seeding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for visibility_gap_analyses
CREATE POLICY "Users can view their brand's gap analyses" ON visibility_gap_analyses
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create gap analyses for their brands" ON visibility_gap_analyses
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

-- Similar policies for other tables (generated_content, quotable_content, etc.)
CREATE POLICY "Users can view their brand's generated content" ON generated_content
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create content for their brands" ON generated_content
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

-- Apply similar patterns for all other tables
CREATE POLICY "Users can view quotable content for their brands" ON quotable_content
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage crawler submissions for their brands" ON crawler_submissions
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage seeding tasks for their brands" ON content_seeding_tasks
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage sitemaps for their brands" ON sitemaps
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage content submissions for their brands" ON content_submissions
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid()
        )
    );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_visibility_gap_analyses_updated_at BEFORE UPDATE ON visibility_gap_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotable_content_updated_at BEFORE UPDATE ON quotable_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE visibility_gap_analyses IS 'Stores AI visibility gap analysis results for brands';
COMMENT ON TABLE generated_content IS 'AI-generated content to close visibility gaps';
COMMENT ON TABLE quotable_content IS 'Quotable content for social media seeding';
COMMENT ON TABLE crawler_submissions IS 'Tracks submissions to various AI crawlers';
COMMENT ON TABLE content_seeding_tasks IS 'Social media content seeding tasks';
COMMENT ON TABLE sitemaps IS 'AI-optimized sitemaps for brands';
COMMENT ON TABLE content_submissions IS 'Enhanced content submission tracking with feedback loops';