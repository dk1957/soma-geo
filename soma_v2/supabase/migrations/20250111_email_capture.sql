-- Create table for storing email captures from external reports
CREATE TABLE IF NOT EXISTS external_report_email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_report_id UUID NOT NULL REFERENCES external_brand_reports(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  access_token TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_captures_report_id ON external_report_email_captures(external_report_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON external_report_email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_access_token ON external_report_email_captures(access_token);
CREATE INDEX IF NOT EXISTS idx_email_captures_captured_at ON external_report_email_captures(captured_at DESC);

-- Enable RLS
ALTER TABLE external_report_email_captures ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything
CREATE POLICY "Service role full access" ON external_report_email_captures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view email captures for their own reports
CREATE POLICY "Users can view their report email captures" ON external_report_email_captures
  FOR SELECT
  TO authenticated
  USING (
    external_report_id IN (
      SELECT id FROM external_brand_reports WHERE user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_external_report_email_captures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_report_email_captures_updated_at
  BEFORE UPDATE ON external_report_email_captures
  FOR EACH ROW
  EXECUTE FUNCTION update_external_report_email_captures_updated_at();

-- Create RPC function to increment email captures count
CREATE OR REPLACE FUNCTION increment_email_captures(report_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE external_brand_reports
  SET email_captures = COALESCE(email_captures, 0) + 1
  WHERE id = report_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_email_captures(UUID) TO service_role;

-- Add comment
COMMENT ON TABLE external_report_email_captures IS 'Stores email captures from users accessing external brand reports';
