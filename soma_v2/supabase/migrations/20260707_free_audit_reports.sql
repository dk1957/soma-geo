-- ============================================================================
-- Free Audit Reports - Growth Engine
-- ============================================================================
-- Stores free visibility audit reports for lead generation.
-- Reports are created anonymously, then linked to accounts on signup.
-- ============================================================================

-- Free audit reports table
CREATE TABLE IF NOT EXISTS free_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Access control
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Brand info (provided by visitor)
  brand_name TEXT NOT NULL,
  brand_website TEXT,
  brand_industry TEXT,
  brand_categories TEXT[] DEFAULT '{}',
  target_markets TEXT[] DEFAULT '{}',
  competitors TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Contact info (for lead capture)
  email TEXT,
  
  -- Audit state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'expired')),
  
  -- Audit results (JSONB for flexibility)
  audit_results JSONB DEFAULT '{}',
  -- Contains: lvi_score, model_scores, mention_rate, sentiment, 
  --           top_sources, competitor_comparison, recommendations, etc.
  
  -- Linking to account (after signup)
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  
  -- Rate limiting / security
  ip_address INET,
  user_agent TEXT,
  fingerprint TEXT, -- browser fingerprint hash for abuse detection
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for common queries
CREATE INDEX idx_free_audit_reports_access_token ON free_audit_reports(access_token) WHERE is_active = TRUE;
CREATE INDEX idx_free_audit_reports_email ON free_audit_reports(email) WHERE email IS NOT NULL;
CREATE INDEX idx_free_audit_reports_status ON free_audit_reports(status);
CREATE INDEX idx_free_audit_reports_ip ON free_audit_reports(ip_address, created_at DESC);
CREATE INDEX idx_free_audit_reports_fingerprint ON free_audit_reports(fingerprint, created_at DESC) WHERE fingerprint IS NOT NULL;
CREATE INDEX idx_free_audit_reports_account ON free_audit_reports(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_free_audit_reports_created ON free_audit_reports(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_free_audit_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_free_audit_reports_updated_at
  BEFORE UPDATE ON free_audit_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_free_audit_reports_updated_at();

-- RLS: No auth required for insert (public), service role for reads/updates
ALTER TABLE free_audit_reports ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service client)
CREATE POLICY "Service role full access on free_audit_reports"
  ON free_audit_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Rate limit check function: max audits per IP per day
CREATE OR REPLACE FUNCTION check_free_audit_rate_limit(
  p_ip_address INET,
  p_fingerprint TEXT DEFAULT NULL,
  p_max_per_day INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
  ip_count INTEGER;
  fp_count INTEGER;
BEGIN
  -- Check IP-based limit
  SELECT COUNT(*) INTO ip_count
  FROM free_audit_reports
  WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '24 hours'
    AND is_active = TRUE;
  
  IF ip_count >= p_max_per_day THEN
    RETURN FALSE;
  END IF;
  
  -- Check fingerprint-based limit (if provided)
  IF p_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO fp_count
    FROM free_audit_reports
    WHERE fingerprint = p_fingerprint
      AND created_at > NOW() - INTERVAL '24 hours'
      AND is_active = TRUE;
    
    IF fp_count >= p_max_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim report function: link to account after signup
CREATE OR REPLACE FUNCTION claim_free_audit_report(
  p_access_token TEXT,
  p_account_id UUID,
  p_brand_id UUID
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
BEGIN
  UPDATE free_audit_reports
  SET account_id = p_account_id,
      brand_id = p_brand_id,
      claimed_at = NOW()
  WHERE access_token = p_access_token
    AND account_id IS NULL
    AND is_active = TRUE
    AND expires_at > NOW()
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired reports (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_free_audits()
RETURNS INTEGER AS $$
DECLARE
  cleaned INTEGER;
BEGIN
  UPDATE free_audit_reports
  SET is_active = FALSE
  WHERE expires_at < NOW()
    AND is_active = TRUE
    AND account_id IS NULL;
  
  GET DIAGNOSTICS cleaned = ROW_COUNT;
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
