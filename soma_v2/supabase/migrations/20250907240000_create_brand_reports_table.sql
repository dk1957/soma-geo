-- Create brand_reports table that the reporting API expects
CREATE TABLE IF NOT EXISTS brand_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL,
  workspace_id UUID,
  audit_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('brand-visibility', 'brand-discoverability', 'brand-audit', 'brand-mentions', 'brand-competitors', 'sources-citations')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  
  -- Scoring metrics
  overall_score DECIMAL(5,2) DEFAULT 0,
  visibility_score DECIMAL(5,2) DEFAULT 0,
  discoverability_score DECIMAL(5,2) DEFAULT 0,
  mention_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  competitor_count INTEGER DEFAULT 0,
  
  -- Analytics metadata
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),
  
  -- Filtering and date ranges
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  platforms_filter TEXT[] DEFAULT '{}',
  regions_filter TEXT[] DEFAULT '{}',
  languages_filter TEXT[] DEFAULT '{}',
  query_categories_filter TEXT[] DEFAULT '{}',
  
  -- Report content
  executive_summary TEXT DEFAULT '',
  key_findings JSONB DEFAULT '{}',
  metrics_data JSONB DEFAULT '{}',
  charts_data JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  
  -- Source and auto-generation flags
  source TEXT DEFAULT 'manual',
  auto_generated BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_sections table for modular report structure
CREATE TABLE IF NOT EXISTS report_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES brand_reports(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  charts_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_reports_brand_id ON brand_reports(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_reports_user_id ON brand_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_reports_workspace_id ON brand_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_brand_reports_report_type ON brand_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_brand_reports_status ON brand_reports(status);
CREATE INDEX IF NOT EXISTS idx_brand_reports_created_at ON brand_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_reports_source ON brand_reports(source);
CREATE INDEX IF NOT EXISTS idx_brand_reports_auto_generated ON brand_reports(auto_generated);

CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_type ON report_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_report_sections_order ON report_sections(section_order);

-- Enable RLS
ALTER TABLE brand_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_reports
CREATE POLICY "Users can view reports for their brands" ON brand_reports
  FOR SELECT USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can create reports for their brands" ON brand_reports
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can update their brand reports" ON brand_reports
  FOR UPDATE USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can delete their brand reports" ON brand_reports
  FOR DELETE USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- RLS policies for report_sections
CREATE POLICY "Users can view report sections for their reports" ON report_sections
  FOR SELECT USING (
    report_id IN (
      SELECT br.id FROM brand_reports br
      JOIN brands b ON br.brand_id = b.id
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can create report sections for their reports" ON report_sections
  FOR INSERT WITH CHECK (
    report_id IN (
      SELECT br.id FROM brand_reports br
      JOIN brands b ON br.brand_id = b.id
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can update report sections for their reports" ON report_sections
  FOR UPDATE USING (
    report_id IN (
      SELECT br.id FROM brand_reports br
      JOIN brands b ON br.brand_id = b.id
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can delete report sections for their reports" ON report_sections
  FOR DELETE USING (
    report_id IN (
      SELECT br.id FROM brand_reports br
      JOIN brands b ON br.brand_id = b.id
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- Add updated_at trigger for brand_reports
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_reports_updated_at 
    BEFORE UPDATE ON brand_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_sections_updated_at 
    BEFORE UPDATE ON report_sections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE brand_reports IS 'Primary reports table for storing all brand-related reports created via API or onboarding';
COMMENT ON TABLE report_sections IS 'Modular sections within each report for flexible report structure';

COMMENT ON COLUMN brand_reports.source IS 'Source of report creation: manual, onboarding_audit, api_generated';
COMMENT ON COLUMN brand_reports.auto_generated IS 'Whether this report was automatically generated during onboarding or other automated processes';
COMMENT ON COLUMN brand_reports.report_type IS 'Type of report: brand-visibility, brand-discoverability, brand-audit, brand-mentions, brand-competitors, sources-citations';