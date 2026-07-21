-- ============================================================================
-- Leads Table — Shadow Accounts for Pre-Auth User Acquisition
-- ============================================================================
-- Tracks anonymous visitors from first interaction through conversion.
-- Created when a visitor starts the free-audit flow (before Clerk signup).
-- Progressively enriched with business data as the user completes form steps.
-- Linked to a real account when the user signs up via Clerk.
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Identity signals
  ip_address INET,
  user_agent TEXT,
  fingerprint TEXT,
  device_info JSONB DEFAULT '{}',
  -- device_info stores: platform, language, screen, timezone, cores, memory,
  -- connection_type, color_depth, touch_support, device_pixel_ratio

  -- Collected data (progressively enriched as user fills form)
  email TEXT,
  brand_name TEXT,
  brand_website TEXT,
  form_data JSONB DEFAULT '{}',

  -- Attribution
  source TEXT NOT NULL DEFAULT 'free_audit',
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Journey tracking
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'engaged', 'audit_started', 'audit_completed', 'converted', 'expired')),
  last_step TEXT,
  steps_completed TEXT[] DEFAULT '{}',

  -- Conversion linking
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  clerk_id TEXT,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- Indexes
CREATE INDEX idx_leads_token ON leads(lead_token);
CREATE INDEX idx_leads_fingerprint ON leads(fingerprint, created_at DESC) WHERE fingerprint IS NOT NULL;
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_account ON leads(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_leads_source ON leads(source, created_at DESC);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Auto-update timestamps on every write
CREATE OR REPLACE FUNCTION update_leads_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_timestamps
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_timestamps();

-- RLS: service_role only (all access goes through API routes)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leads"
  ON leads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- Link leads to free_audit_reports
-- ============================================================================
ALTER TABLE free_audit_reports
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_free_audit_reports_lead
  ON free_audit_reports(lead_id) WHERE lead_id IS NOT NULL;

-- ============================================================================
-- Cleanup expired leads (call from cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_leads()
RETURNS INTEGER AS $$
DECLARE
  cleaned INTEGER;
BEGIN
  UPDATE leads
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status NOT IN ('converted', 'expired');
  GET DIAGNOSTICS cleaned = ROW_COUNT;
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
