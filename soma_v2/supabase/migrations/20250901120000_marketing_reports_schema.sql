-- Marketing Reports System Schema
-- Migration: 20250901120000_marketing_reports_schema.sql

-- Create marketing reports table
CREATE TABLE IF NOT EXISTS marketing_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    account_id UUID, -- Will be populated when account system is ready
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report Metadata
    title TEXT NOT NULL,
    description TEXT,
    brand_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('onboarding', 'monthly', 'quarterly', 'competitive', 'custom')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Report Content
    content JSONB NOT NULL DEFAULT '{}', -- Structured report data
    executive_summary TEXT,
    key_findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Performance Metrics (calculated from audit data)
    ldi_score DECIMAL(5,2),
    visibility_score DECIMAL(5,2),
    citation_count INTEGER DEFAULT 0,
    competitor_count INTEGER DEFAULT 0,
    platform_coverage INTEGER DEFAULT 0,
    mention_rate DECIMAL(5,2),
    
    -- Report Analytics
    views_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    shared_count INTEGER DEFAULT 0,
    export_count INTEGER DEFAULT 0,
    
    -- Template and Customization
    template_id TEXT DEFAULT 'default',
    custom_sections JSONB DEFAULT '[]',
    branding_config JSONB DEFAULT '{}',
    
    -- Collaboration
    is_shared BOOLEAN DEFAULT false,
    share_token TEXT UNIQUE,
    shared_with JSONB DEFAULT '[]', -- Array of user emails/IDs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Full-text search
    search_vector tsvector
);

-- Create report sections table for modular content
CREATE TABLE IF NOT EXISTS report_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES marketing_reports(id) ON DELETE CASCADE,
    
    -- Section Details
    section_type TEXT NOT NULL, -- 'executive_summary', 'performance_metrics', 'competitive_analysis', etc.
    section_order INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    
    -- Visualization Data
    charts_data JSONB DEFAULT '[]',
    tables_data JSONB DEFAULT '[]',
    insights JSONB DEFAULT '[]',
    
    -- Section Metadata
    is_visible BOOLEAN DEFAULT true,
    is_customizable BOOLEAN DEFAULT true,
    template_section BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'marketing', 'competitive', 'performance', etc.
    
    -- Template Structure
    sections_config JSONB NOT NULL DEFAULT '[]',
    default_content JSONB DEFAULT '{}',
    styling_config JSONB DEFAULT '{}',
    
    -- Template Settings
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    target_audience TEXT[], -- ['marketing_teams', 'agencies', 'executives']
    
    -- Usage Analytics
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report exports table for tracking downloads
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES marketing_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Export Details
    export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'html', 'docx', 'json')),
    export_url TEXT, -- Temporary download URL
    file_size INTEGER,
    
    -- Export Settings
    include_charts BOOLEAN DEFAULT true,
    include_raw_data BOOLEAN DEFAULT false,
    custom_branding BOOLEAN DEFAULT false,
    
    -- Status and Metadata
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_reports_user_id ON marketing_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_audit_id ON marketing_reports(audit_id);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_brand_name ON marketing_reports(brand_name);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_report_type ON marketing_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_created_at ON marketing_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_status ON marketing_reports(status);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_share_token ON marketing_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_search ON marketing_reports USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_type_order ON report_sections(section_type, section_order);

CREATE INDEX IF NOT EXISTS idx_report_exports_report_id ON report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_user_id ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_status ON report_exports(status);

-- RLS Policies
ALTER TABLE marketing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON marketing_reports
    FOR SELECT USING (user_id = auth.uid() OR is_shared = true);

-- Users can create reports
CREATE POLICY "Users can create reports" ON marketing_reports
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reports
CREATE POLICY "Users can update their own reports" ON marketing_reports
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own reports
CREATE POLICY "Users can delete their own reports" ON marketing_reports
    FOR DELETE USING (user_id = auth.uid());

-- Report sections policies
CREATE POLICY "Users can view report sections" ON report_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketing_reports mr 
            WHERE mr.id = report_sections.report_id 
            AND (mr.user_id = auth.uid() OR mr.is_shared = true)
        )
    );

CREATE POLICY "Users can manage their report sections" ON report_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM marketing_reports mr 
            WHERE mr.id = report_sections.report_id 
            AND mr.user_id = auth.uid()
        )
    );

-- Templates are readable by all authenticated users
CREATE POLICY "Templates are readable by authenticated users" ON report_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Export policies
CREATE POLICY "Users can view their own exports" ON report_exports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create exports" ON report_exports
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_report_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.brand_name, '') || ' ' ||
        COALESCE(NEW.executive_summary, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector updates
CREATE TRIGGER update_marketing_reports_search_vector
    BEFORE INSERT OR UPDATE ON marketing_reports
    FOR EACH ROW EXECUTE FUNCTION update_report_search_vector();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_marketing_reports_updated_at
    BEFORE UPDATE ON marketing_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_sections_updated_at
    BEFORE UPDATE ON report_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate comprehensive marketing report
CREATE OR REPLACE FUNCTION generate_marketing_report(
    p_audit_id UUID,
    p_user_id UUID,
    p_title TEXT DEFAULT NULL,
    p_template_id TEXT DEFAULT 'default'
) RETURNS UUID AS $$
DECLARE
    report_id UUID;
    audit_data RECORD;
    performance_metrics RECORD;
    competitor_data JSONB;
    citation_data JSONB;
    recommendations JSONB;
BEGIN
    -- Get audit data
    SELECT * INTO audit_data FROM onboarding_audits WHERE id = p_audit_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit not found';
    END IF;
    
    -- Get performance metrics
    SELECT * INTO performance_metrics FROM foundational_metrics WHERE audit_id = p_audit_id;
    
    -- Aggregate competitor data
    SELECT jsonb_agg(jsonb_build_object(
        'name', competitor_name,
        'visibility_score', visibility_score,
        'market_share', estimated_market_share,
        'threat_level', threat_level,
        'strengths', strengths,
        'weaknesses', weaknesses
    )) INTO competitor_data
    FROM competitor_intelligence
    WHERE audit_id = p_audit_id;
    
    -- Aggregate citation analysis
    SELECT jsonb_agg(jsonb_build_object(
        'url', citation_url,
        'title', citation_title,
        'domain', citation_domain,
        'authority_score', source_authority_score,
        'type', citation_type,
        'context', mention_context
    )) INTO citation_data
    FROM citation_analysis
    WHERE audit_id = p_audit_id;
    
    -- Generate AI-powered recommendations
    recommendations := jsonb_build_array(
        jsonb_build_object(
            'priority', 'high',
            'category', 'content_optimization',
            'title', 'Improve Citation Authority',
            'description', 'Focus on building relationships with high-authority domains',
            'impact', 'High',
            'effort', 'Medium'
        ),
        jsonb_build_object(
            'priority', 'medium',
            'category', 'competitive_analysis',
            'title', 'Monitor Competitor Performance',
            'description', 'Track competitor mention rates and positioning',
            'impact', 'Medium',
            'effort', 'Low'
        )
    );
    
    -- Create the report
    INSERT INTO marketing_reports (
        audit_id,
        user_id,
        title,
        description,
        brand_name,
        report_type,
        content,
        executive_summary,
        key_findings,
        recommendations,
        ldi_score,
        visibility_score,
        citation_count,
        competitor_count,
        platform_coverage,
        mention_rate,
        template_id,
        status
    ) VALUES (
        p_audit_id,
        p_user_id,
        COALESCE(p_title, 'AI Discoverability Report: ' || audit_data.brand_name),
        'Comprehensive analysis of ' || audit_data.brand_name || ' brand visibility across AI platforms',
        audit_data.brand_name,
        'onboarding',
        jsonb_build_object(
            'audit_data', row_to_json(audit_data),
            'performance_metrics', row_to_json(performance_metrics),
            'competitors', COALESCE(competitor_data, '[]'::jsonb),
            'citations', COALESCE(citation_data, '[]'::jsonb)
        ),
        'Brand performance analysis showing ' || 
        COALESCE(performance_metrics.ldi_score::text || '/100 LDI score', 'comprehensive insights') ||
        ' with strategic recommendations for improvement.',
        jsonb_build_array(
            'Strong performance in direct brand searches',
            'Opportunities in category-generic queries',
            'Competitive positioning advantages identified'
        ),
        recommendations,
        performance_metrics.ldi_score,
        performance_metrics.visibility_score,
        (SELECT COUNT(*) FROM citation_analysis WHERE audit_id = p_audit_id),
        (SELECT COUNT(*) FROM competitor_intelligence WHERE audit_id = p_audit_id),
        4, -- Number of AI platforms tested
        (SELECT COALESCE(AVG(CASE WHEN brand_mentioned THEN 1 ELSE 0 END) * 100, 0) 
         FROM llm_test_results WHERE audit_id = p_audit_id),
        p_template_id,
        'published'
    ) RETURNING id INTO report_id;
    
    -- Create default sections
    INSERT INTO report_sections (report_id, section_type, section_order, title, content) VALUES
    (report_id, 'executive_summary', 1, 'Executive Summary', 
     jsonb_build_object('type', 'text', 'content', 'Brand performance overview and key insights')),
    (report_id, 'performance_metrics', 2, 'Performance Metrics', 
     jsonb_build_object('type', 'metrics', 'data', row_to_json(performance_metrics))),
    (report_id, 'competitive_analysis', 3, 'Competitive Analysis', 
     jsonb_build_object('type', 'competitors', 'data', COALESCE(competitor_data, '[]'::jsonb))),
    (report_id, 'recommendations', 4, 'Strategic Recommendations', 
     jsonb_build_object('type', 'recommendations', 'data', recommendations));
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default templates
INSERT INTO report_templates (id, name, description, category, sections_config, target_audience) VALUES
('default', 'Standard Marketing Report', 'Comprehensive brand visibility and performance analysis', 'marketing',
 '[
   {"type": "executive_summary", "title": "Executive Summary", "required": true},
   {"type": "performance_metrics", "title": "Performance Metrics", "required": true},
   {"type": "competitive_analysis", "title": "Competitive Analysis", "required": false},
   {"type": "citation_analysis", "title": "Citation & Authority Analysis", "required": false},
   {"type": "recommendations", "title": "Strategic Recommendations", "required": true},
   {"type": "detailed_data", "title": "Detailed Performance Data", "required": false}
 ]'::jsonb,
 ARRAY['marketing_teams', 'agencies']
),
('executive', 'Executive Summary', 'High-level overview for C-suite and decision makers', 'executive',
 '[
   {"type": "executive_summary", "title": "Executive Summary", "required": true},
   {"type": "key_metrics", "title": "Key Performance Indicators", "required": true},
   {"type": "strategic_insights", "title": "Strategic Insights", "required": true},
   {"type": "roi_projections", "title": "ROI Projections", "required": false}
 ]'::jsonb,
 ARRAY['executives', 'decision_makers']
),
('competitive', 'Competitive Intelligence', 'Detailed competitor analysis and market positioning', 'competitive',
 '[
   {"type": "market_overview", "title": "Market Overview", "required": true},
   {"type": "competitive_landscape", "title": "Competitive Landscape", "required": true},
   {"type": "positioning_analysis", "title": "Positioning Analysis", "required": true},
   {"type": "opportunity_gaps", "title": "Opportunity Gaps", "required": true}
 ]'::jsonb,
 ARRAY['marketing_teams', 'strategy_teams']
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_marketing_report(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_report_search_vector() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE marketing_reports IS 'Comprehensive marketing reports generated from audit data';
COMMENT ON TABLE report_sections IS 'Modular sections within marketing reports for flexible content management';
COMMENT ON TABLE report_templates IS 'Template definitions for different types of marketing reports';
COMMENT ON TABLE report_exports IS 'Export tracking for reports in various formats';
COMMENT ON FUNCTION generate_marketing_report IS 'Automatically generates a comprehensive marketing report from audit data';