-- Migration: Add missing columns to brand_reports table
-- Date: 2025-09-07

-- Add missing columns to brand_reports table
ALTER TABLE brand_reports 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_brand_reports_workspace_id ON brand_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_brand_reports_source ON brand_reports(source);
CREATE INDEX IF NOT EXISTS idx_brand_reports_auto_generated ON brand_reports(auto_generated);

-- Add comments
COMMENT ON COLUMN brand_reports.workspace_id IS 'Reference to the workspace this report belongs to';
COMMENT ON COLUMN brand_reports.source IS 'Source of the report: manual, onboarding_audit, api, etc.';
COMMENT ON COLUMN brand_reports.auto_generated IS 'Whether this report was automatically generated';