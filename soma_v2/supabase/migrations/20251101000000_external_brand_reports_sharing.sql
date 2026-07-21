-- External Brand Reports Sharing Schema
-- Migration: 20251101000000_external_brand_reports_sharing.sql

-- Create external_brand_reports table for public sharing
CREATE TABLE IF NOT EXISTS external_brand_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Link to original report
    source_report_id UUID REFERENCES brand_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL,
    
    -- Public sharing configuration
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    title TEXT NOT NULL,
    description TEXT,
    brand_name TEXT NOT NULL,
    
    -- Report content (optimized for external sharing)
    preview_content JSONB NOT NULL DEFAULT '{}', -- Limited content shown before email capture
    full_content JSONB NOT NULL DEFAULT '{}',    -- Complete report data
    executive_summary TEXT,
    key_metrics JSONB DEFAULT '{}',
    
    -- Visibility and sharing settings
    is_active BOOLEAN DEFAULT true,
    requires_email_capture BOOLEAN DEFAULT true,
    preview_section_count INTEGER DEFAULT 2, -- Number of sections shown in preview
    
    -- Analytics and tracking
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    email_captures INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Lead qualification scoring
    lead_score_avg DECIMAL(5,2) DEFAULT 0,
    high_intent_leads INTEGER DEFAULT 0,
    
    -- BD-specific metadata
    target_audience TEXT[], -- ['agencies', 'brands', 'enterprises']
    industry_focus TEXT[],
    competitor_intel TEXT[], -- Competitor mentions for targeting
    
    -- Branding and customization
    custom_branding JSONB DEFAULT '{}',
    cover_image_url TEXT,
    company_logo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create external_report_leads table for capturing contact information
CREATE TABLE IF NOT EXISTS external_report_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Report and visitor tracking
    external_report_id UUID REFERENCES external_brand_reports(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL, -- Anonymous visitor tracking
    session_id TEXT,
    
    -- Contact information
    email TEXT NOT NULL,
    phone_number TEXT,
    full_name TEXT,
    company_name TEXT,
    job_title TEXT,
    company_size TEXT, -- 'startup', 'sme', 'enterprise'
    
    -- Lead qualification
    intent_level TEXT DEFAULT 'unknown' CHECK (intent_level IN ('low', 'medium', 'high', 'unknown')),
    lead_score INTEGER DEFAULT 0, -- 0-100 scoring
    source_utm TEXT, -- UTM tracking
    referrer_url TEXT,
    
    -- Engagement tracking
    time_on_report INTEGER DEFAULT 0, -- Seconds spent on report
    sections_viewed TEXT[], -- Which sections were accessed
    downloaded_report BOOLEAN DEFAULT false,
    
    -- BD follow-up tracking
    contacted_by_bd BOOLEAN DEFAULT false,
    bd_contact_date TIMESTAMP WITH TIME ZONE,
    bd_notes TEXT,
    lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'opportunity', 'closed-won', 'closed-lost')),
    
    -- Location and demographics
    ip_address TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create external_report_views table for detailed analytics
CREATE TABLE IF NOT EXISTS external_report_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    external_report_id UUID REFERENCES external_brand_reports(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    
    -- View details
    page_section TEXT, -- 'preview', 'full_report', 'lead_form'
    view_duration INTEGER DEFAULT 0, -- Seconds spent in this section
    scroll_depth DECIMAL(5,2) DEFAULT 0, -- Percentage of page scrolled
    
    -- Technical details
    ip_address TEXT,
    user_agent TEXT,
    referrer_url TEXT,
    device_type TEXT,
    browser TEXT,
    screen_resolution TEXT,
    
    -- Location
    country TEXT,
    city TEXT,
    timezone TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_share_token ON external_brand_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_source_report ON external_brand_reports(source_report_id);
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_brand_id ON external_brand_reports(brand_id);
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_user_id ON external_brand_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_active ON external_brand_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_external_brand_reports_created_at ON external_brand_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_report_leads_external_report ON external_report_leads(external_report_id);
CREATE INDEX IF NOT EXISTS idx_external_report_leads_email ON external_report_leads(email);
CREATE INDEX IF NOT EXISTS idx_external_report_leads_visitor_id ON external_report_leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_external_report_leads_intent_level ON external_report_leads(intent_level);
CREATE INDEX IF NOT EXISTS idx_external_report_leads_lead_status ON external_report_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_external_report_leads_created_at ON external_report_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_report_views_external_report ON external_report_views(external_report_id);
CREATE INDEX IF NOT EXISTS idx_external_report_views_visitor_id ON external_report_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_external_report_views_session_id ON external_report_views(session_id);
CREATE INDEX IF NOT EXISTS idx_external_report_views_created_at ON external_report_views(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE external_brand_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_report_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_report_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_brand_reports
-- Users can view/manage external reports for their brands
CREATE POLICY "Users can view external reports for their brands" ON external_brand_reports
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can create external reports for their brands" ON external_brand_reports
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can update their external reports" ON external_brand_reports
    FOR UPDATE USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Public access policy for anonymous users with valid share token
CREATE POLICY "Anonymous users can view active external reports with valid token" ON external_brand_reports
    FOR SELECT USING (is_active = true);

-- RLS Policies for external_report_leads
CREATE POLICY "Users can view leads for their external reports" ON external_report_leads
    FOR SELECT USING (
        external_report_id IN (
            SELECT ebr.id FROM external_brand_reports ebr
            JOIN brands b ON ebr.brand_id = b.id
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow anonymous users to create leads (for external form submissions)
CREATE POLICY "Anonymous users can create leads" ON external_report_leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update leads for their reports" ON external_report_leads
    FOR UPDATE USING (
        external_report_id IN (
            SELECT ebr.id FROM external_brand_reports ebr
            JOIN brands b ON ebr.brand_id = b.id
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- RLS Policies for external_report_views
CREATE POLICY "Users can view analytics for their external reports" ON external_report_views
    FOR SELECT USING (
        external_report_id IN (
            SELECT ebr.id FROM external_brand_reports ebr
            JOIN brands b ON ebr.brand_id = b.id
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow anonymous users to create view tracking
CREATE POLICY "Anonymous users can create view records" ON external_report_views
    FOR INSERT WITH CHECK (true);

-- Function to update analytics when leads are captured
CREATE OR REPLACE FUNCTION update_external_report_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update lead capture count and conversion rate
        UPDATE external_brand_reports 
        SET 
            email_captures = email_captures + 1,
            conversion_rate = ROUND(
                (email_captures + 1)::decimal / GREATEST(unique_visitors, 1) * 100, 
                2
            ),
            high_intent_leads = CASE 
                WHEN NEW.intent_level = 'high' THEN high_intent_leads + 1 
                ELSE high_intent_leads 
            END,
            lead_score_avg = (
                SELECT ROUND(AVG(lead_score), 2) 
                FROM external_report_leads 
                WHERE external_report_id = NEW.external_report_id
            )
        WHERE id = NEW.external_report_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics on lead capture
CREATE TRIGGER update_external_report_analytics_trigger
    AFTER INSERT OR UPDATE ON external_report_leads
    FOR EACH ROW EXECUTE FUNCTION update_external_report_analytics();

-- Function to create external report from existing brand report
CREATE OR REPLACE FUNCTION create_external_brand_report(
    p_source_report_id UUID,
    p_user_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_requires_email_capture BOOLEAN DEFAULT true,
    p_preview_section_count INTEGER DEFAULT 2
) RETURNS UUID AS $$
DECLARE
    external_report_id UUID;
    source_report RECORD;
    preview_content JSONB;
    full_content JSONB;
BEGIN
    -- Get source report data
    SELECT * INTO source_report 
    FROM brand_reports 
    WHERE id = p_source_report_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source report not found';
    END IF;
    
    -- Generate preview content (limited sections)
    preview_content := jsonb_build_object(
        'executive_summary', source_report.executive_summary,
        'key_metrics', jsonb_build_object(
            'overall_score', source_report.overall_score,
            'visibility_score', source_report.visibility_score,
            'mention_count', source_report.mention_count,
            'citation_count', source_report.citation_count
        ),
        'preview_note', 'This is a preview of the full brand visibility report. Enter your contact information below to access the complete analysis with detailed insights and recommendations.'
    );
    
    -- Full content includes everything
    full_content := jsonb_build_object(
        'executive_summary', source_report.executive_summary,
        'metrics_data', source_report.metrics_data,
        'key_findings', source_report.key_findings,
        'charts_data', source_report.charts_data,
        'recommendations', source_report.recommendations,
        'raw_data', source_report.raw_data
    );
    
    -- Create external report
    INSERT INTO external_brand_reports (
        source_report_id,
        user_id,
        brand_id,
        title,
        description,
        brand_name,
        preview_content,
        full_content,
        executive_summary,
        key_metrics,
        requires_email_capture,
        preview_section_count
    ) VALUES (
        p_source_report_id,
        p_user_id,
        source_report.brand_id,
        COALESCE(p_title, source_report.title || ' - Shared Report'),
        COALESCE(p_description, 'Comprehensive brand visibility analysis shared for business development purposes'),
        (SELECT name FROM brands WHERE id = source_report.brand_id),
        preview_content,
        full_content,
        source_report.executive_summary,
        jsonb_build_object(
            'overall_score', source_report.overall_score,
            'visibility_score', source_report.visibility_score,
            'mention_count', source_report.mention_count,
            'citation_count', source_report.citation_count
        ),
        p_requires_email_capture,
        p_preview_section_count
    ) RETURNING id INTO external_report_id;
    
    RETURN external_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track report views
CREATE OR REPLACE FUNCTION track_external_report_view(
    p_share_token TEXT,
    p_visitor_id TEXT,
    p_session_id TEXT DEFAULT NULL,
    p_page_section TEXT DEFAULT 'preview',
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    report_id UUID;
    is_unique_visitor BOOLEAN := false;
BEGIN
    -- Get report ID from share token
    SELECT id INTO report_id 
    FROM external_brand_reports 
    WHERE share_token = p_share_token AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if this is a unique visitor
    IF NOT EXISTS (
        SELECT 1 FROM external_report_views 
        WHERE external_report_id = report_id AND visitor_id = p_visitor_id
    ) THEN
        is_unique_visitor := true;
    END IF;
    
    -- Insert view record
    INSERT INTO external_report_views (
        external_report_id,
        visitor_id,
        session_id,
        page_section,
        ip_address,
        user_agent,
        referrer_url
    ) VALUES (
        report_id,
        p_visitor_id,
        p_session_id,
        p_page_section,
        p_ip_address,
        p_user_agent,
        p_referrer_url
    );
    
    -- Update report analytics
    UPDATE external_brand_reports 
    SET 
        total_views = total_views + 1,
        unique_visitors = CASE WHEN is_unique_visitor THEN unique_visitors + 1 ELSE unique_visitors END,
        last_viewed_at = NOW()
    WHERE id = report_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate lead intent score
CREATE OR REPLACE FUNCTION calculate_lead_intent_score(
    p_company_size TEXT,
    p_job_title TEXT,
    p_time_on_report INTEGER,
    p_sections_viewed TEXT[],
    p_referrer_url TEXT
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Base score
    score := 20;
    
    -- Company size scoring
    CASE p_company_size
        WHEN 'enterprise' THEN score := score + 30;
        WHEN 'sme' THEN score := score + 20;
        WHEN 'startup' THEN score := score + 10;
        ELSE score := score + 5;
    END CASE;
    
    -- Job title relevance
    IF p_job_title ILIKE ANY(ARRAY['%cmo%', '%chief marketing%', '%vp marketing%', '%marketing director%']) THEN
        score := score + 25;
    ELSIF p_job_title ILIKE ANY(ARRAY['%marketing manager%', '%digital marketing%', '%brand manager%']) THEN
        score := score + 20;
    ELSIF p_job_title ILIKE ANY(ARRAY['%ceo%', '%founder%', '%coo%']) THEN
        score := score + 30;
    ELSIF p_job_title ILIKE ANY(ARRAY['%agency%', '%consultant%']) THEN
        score := score + 15;
    END IF;
    
    -- Engagement scoring
    IF p_time_on_report > 300 THEN -- More than 5 minutes
        score := score + 20;
    ELSIF p_time_on_report > 120 THEN -- More than 2 minutes
        score := score + 10;
    END IF;
    
    -- Sections viewed (depth of interest)
    IF array_length(p_sections_viewed, 1) > 3 THEN
        score := score + 15;
    ELSIF array_length(p_sections_viewed, 1) > 1 THEN
        score := score + 10;
    END IF;
    
    -- Referrer context
    IF p_referrer_url ILIKE '%linkedin%' THEN
        score := score + 10;
    ELSIF p_referrer_url ILIKE '%google%' THEN
        score := score + 5;
    END IF;
    
    -- Cap the score at 100
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE TRIGGER update_external_brand_reports_updated_at
    BEFORE UPDATE ON external_brand_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_report_leads_updated_at
    BEFORE UPDATE ON external_report_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_external_brand_report(UUID, UUID, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION track_external_report_view(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_lead_intent_score(TEXT, TEXT, INTEGER, TEXT[], TEXT) TO anon, authenticated;

-- Table comments
COMMENT ON TABLE external_brand_reports IS 'External brand reports for public sharing with lead capture functionality';
COMMENT ON TABLE external_report_leads IS 'Contact information captured from external report viewers for BD purposes';
COMMENT ON TABLE external_report_views IS 'Detailed analytics tracking for external report engagement';

COMMENT ON COLUMN external_brand_reports.share_token IS 'Unique token for public access to the report';
COMMENT ON COLUMN external_brand_reports.preview_content IS 'Limited content shown before email capture';
COMMENT ON COLUMN external_brand_reports.full_content IS 'Complete report data shown after email capture';
COMMENT ON COLUMN external_report_leads.intent_level IS 'Assessed interest level based on engagement and profile';
COMMENT ON COLUMN external_report_leads.lead_score IS 'Calculated score (0-100) for lead qualification';