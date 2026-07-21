-- ============================================================================
-- Create missing CRM tables (crm_contacts already exists)
-- ============================================================================

-- ── 2. CRM Deals (Pipeline) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  deal_value NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage TEXT NOT NULL DEFAULT 'discovery'
    CHECK (stage IN ('discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  plan_interest TEXT,
  billing_cycle_interest TEXT,
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to TEXT,
  notes TEXT,
  loss_reason TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_assigned_to ON crm_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_deals_expected_close ON crm_deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_crm_deals_created_at ON crm_deals(created_at DESC);

-- ── 3. CRM Activities ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('email_sent', 'email_received', 'call', 'meeting', 'note', 'sms_sent', 'task', 'status_change', 'research', 'campaign_sent')),
  subject TEXT,
  body TEXT,
  channel TEXT CHECK (channel IN ('email', 'sms', 'phone', 'meeting', 'other')),
  metadata JSONB DEFAULT '{}',
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal_id ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);

-- ── 4. CRM Campaigns ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'email'
    CHECK (campaign_type IN ('email', 'sms', 'email_sequence', 'sms_sequence')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  template_id UUID,
  target_segments JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  from_email TEXT,
  from_name TEXT,
  reply_to TEXT,
  created_by TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_type ON crm_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_created_at ON crm_campaigns(created_at DESC);

-- ── 5. CRM Campaign Recipients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  resend_message_id TEXT,
  twilio_message_sid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_recipients_campaign ON crm_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_recipients_contact ON crm_campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_recipients_status ON crm_campaign_recipients(status);

-- ── 6. CRM Email Templates ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'marketing', 'promotional', 'reminder', 'onboarding', 'follow_up', 'win_back')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_templates_category ON crm_email_templates(category);
CREATE INDEX IF NOT EXISTS idx_crm_templates_active ON crm_email_templates(is_active) WHERE is_active = true;

-- ── 7. CRM Prospect Research Results ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_prospect_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  research_query TEXT NOT NULL,
  research_type TEXT NOT NULL DEFAULT 'company'
    CHECK (research_type IN ('company', 'industry', 'competitor', 'keyword')),
  company_name TEXT,
  domain TEXT,
  description TEXT,
  industry TEXT,
  employee_count TEXT,
  annual_revenue TEXT,
  location TEXT,
  location_address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  current_ai_visibility_score NUMERIC(5,2),
  estimated_monthly_ai_searches INTEGER,
  competitor_visibility_gap NUMERIC(5,2),
  roi_potential JSONB DEFAULT '{}',
  search_data JSONB DEFAULT '{}',
  ai_mentions JSONB DEFAULT '{}',
  fit_score INTEGER DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
  fit_reasons TEXT[],
  recommended_plan TEXT,
  recommended_approach TEXT,
  sources_used TEXT[],
  raw_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_research_contact ON crm_prospect_research(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_research_domain ON crm_prospect_research(domain);
CREATE INDEX IF NOT EXISTS idx_crm_research_fit_score ON crm_prospect_research(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_research_created_at ON crm_prospect_research(created_at DESC);

-- ── 8. Updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Use DROP + CREATE to avoid "trigger already exists" errors
DROP TRIGGER IF EXISTS crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

DROP TRIGGER IF EXISTS crm_deals_updated_at ON crm_deals;
CREATE TRIGGER crm_deals_updated_at 
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

DROP TRIGGER IF EXISTS crm_campaigns_updated_at ON crm_campaigns;
CREATE TRIGGER crm_campaigns_updated_at
  BEFORE UPDATE ON crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

DROP TRIGGER IF EXISTS crm_email_templates_updated_at ON crm_email_templates;
CREATE TRIGGER crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();
