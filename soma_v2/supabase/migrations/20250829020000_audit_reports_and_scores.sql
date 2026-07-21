-- Create audit_reports table for storing comprehensive audit reports
CREATE TABLE IF NOT EXISTS audit_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('comprehensive_audit', 'competitive_analysis', 'content_analysis', 'performance_report')),
    brand_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    brand_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'failed')),
    ldi_score NUMERIC DEFAULT 0,
    key_insights TEXT[] DEFAULT '{}',
    summary TEXT DEFAULT '',
    sharing_settings JSONB DEFAULT '{
        "is_public": false,
        "shared_with": [],
        "password_protected": false
    }'::jsonb,
    audit_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit_scores table for detailed scoring analytics
CREATE TABLE IF NOT EXISTS audit_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES audit_reports(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    platform_name TEXT NOT NULL,
    ldi_score NUMERIC DEFAULT 0,
    visibility_score NUMERIC DEFAULT 0,
    citation_score NUMERIC DEFAULT 0,
    freshness_score NUMERIC DEFAULT 0,
    authority_score NUMERIC DEFAULT 0,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_reports_brand_workspace ON audit_reports(brand_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_created_at ON audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON audit_reports(type);
CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON audit_reports(status);

CREATE INDEX IF NOT EXISTS idx_audit_scores_report ON audit_scores(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_scores_brand_workspace ON audit_scores(brand_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_scores_platform ON audit_scores(platform_name);
CREATE INDEX IF NOT EXISTS idx_audit_scores_created_at ON audit_scores(created_at DESC);

-- Add RLS policies
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_scores ENABLE ROW LEVEL SECURITY;

-- Policy for audit_reports: Users can access reports for their brands/workspaces
CREATE POLICY "Users can view their audit reports" ON audit_reports
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can create audit reports for their brands" ON audit_reports
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can update their audit reports" ON audit_reports
    FOR UPDATE USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can delete their audit reports" ON audit_reports
    FOR DELETE USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Policy for audit_scores: Same access pattern as reports
CREATE POLICY "Users can view their audit scores" ON audit_scores
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can create audit scores for their brands" ON audit_scores
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON b.account_id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Add updated_at trigger for audit_reports
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audit_reports_updated_at 
    BEFORE UPDATE ON audit_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE audit_reports IS 'Stores comprehensive AI visibility audit reports with sharing capabilities';
COMMENT ON TABLE audit_scores IS 'Stores detailed scoring data from audit reports for analytics and trend analysis';

COMMENT ON COLUMN audit_reports.type IS 'Type of report: comprehensive_audit, competitive_analysis, content_analysis, performance_report';
COMMENT ON COLUMN audit_reports.ldi_score IS 'Overall LLM Discoverability Index score (0-100)';
COMMENT ON COLUMN audit_reports.sharing_settings IS 'JSON object containing sharing configuration: is_public, shared_with, password_protected';
COMMENT ON COLUMN audit_reports.audit_data IS 'Complete audit results including platform analysis, insights, and recommendations';

COMMENT ON COLUMN audit_scores.ldi_score IS 'Platform-specific LDI score (0-100)';
COMMENT ON COLUMN audit_scores.visibility_score IS 'Platform visibility score (0-100)';
COMMENT ON COLUMN audit_scores.citation_score IS 'Citation quality score (0-100)';
COMMENT ON COLUMN audit_scores.freshness_score IS 'Content freshness score (0-100)';
COMMENT ON COLUMN audit_scores.authority_score IS 'Source authority score (0-100)';