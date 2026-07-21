-- ============================================================================
-- CRM System Tables for Soma AI Admin
-- Comprehensive sales, BD, and customer management system
-- ============================================================================

-- ── 1. CRM Contacts ──────────────────────────────────────────────────────────
-- Unified contact table: prospects, leads, customers
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  email TEXT,
  phone TEXT,
  full_name TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  
  -- Company info (denormalized for quick access)
  company_name TEXT,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  company_country TEXT,
  company_city TEXT,
  company_address TEXT,
  company_latitude NUMERIC(10,7),
  company_longitude NUMERIC(10,7),
  company_description TEXT,
  company_logo_url TEXT,
  
  -- CRM classification
  contact_type TEXT NOT NULL DEFAULT 'prospect' 
    CHECK (contact_type IN ('prospect', 'lead', 'customer', 'churned', 'partner')),
  lead_source TEXT DEFAULT 'manual'
    CHECK (lead_source IN ('manual', 'free_audit', 'signup', 'trial', 'research', 'referral', 'inbound', 'outbound', 'event', 'content')),
  lead_status TEXT NOT NULL DEFAULT 'new'
    CHECK (lead_status IN ('new', 'contacted', 'qualified', 'nurturing', 'opportunity', 'negotiation', 'closed_won', 'closed_lost', 'churned')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  
  -- Qualification
  budget_range TEXT,
  decision_timeline TEXT,
  pain_points TEXT[],
  use_case TEXT,
  
  -- Link to internal account (if they signed up)
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Assigned to
  assigned_to TEXT, -- clerk_id of assigned sales rep
  assigned_at TIMESTAMPTZ,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  
  -- Research data (AI-generated)
  research_data JSONB DEFAULT '{}',
  visibility_score NUMERIC(5,2),
  estimated_mrr NUMERIC(10,2),
  
  -- Tracking
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_company_domain ON crm_contacts(company_domain);
CREATE INDEX idx_crm_contacts_contact_type ON crm_contacts(contact_type);
CREATE INDEX idx_crm_contacts_lead_status ON crm_contacts(lead_status);
CREATE INDEX idx_crm_contacts_lead_score ON crm_contacts(lead_score DESC);
CREATE INDEX idx_crm_contacts_assigned_to ON crm_contacts(assigned_to);
CREATE INDEX idx_crm_contacts_account_id ON crm_contacts(account_id);
CREATE INDEX idx_crm_contacts_created_at ON crm_contacts(created_at DESC);
CREATE INDEX idx_crm_contacts_next_follow_up ON crm_contacts(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- ── 2. CRM Deals (Pipeline) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  
  -- Deal info
  deal_name TEXT NOT NULL,
  deal_value NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Pipeline stage
  stage TEXT NOT NULL DEFAULT 'discovery'
    CHECK (stage IN ('discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  
  -- Plan interest
  plan_interest TEXT, -- growth, pro, enterprise
  billing_cycle_interest TEXT, -- monthly, annual, etc.
  
  -- Timing
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Ownership
  assigned_to TEXT, -- clerk_id
  
  -- Context
  notes TEXT,
  loss_reason TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_assigned_to ON crm_deals(assigned_to);
CREATE INDEX idx_crm_deals_expected_close ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_created_at ON crm_deals(created_at DESC);

-- ── 3. CRM Activities ────────────────────────────────────────────────────────
-- Log all interactions: emails, calls, meetings, notes
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('email_sent', 'email_received', 'call', 'meeting', 'note', 'sms_sent', 'task', 'status_change', 'research', 'campaign_sent')),
  
  subject TEXT,
  body TEXT,
  
  -- For emails/SMS
  channel TEXT CHECK (channel IN ('email', 'sms', 'phone', 'meeting', 'other')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Who did it
  performed_by TEXT, -- clerk_id or 'system'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activities_contact_id ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal_id ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_created_at ON crm_activities(created_at DESC);

-- ── 4. CRM Campaigns ─────────────────────────────────────────────────────────
-- Email and SMS marketing campaigns
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  campaign_type TEXT NOT NULL DEFAULT 'email'
    CHECK (campaign_type IN ('email', 'sms', 'email_sequence', 'sms_sequence')),
  
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  
  -- Content
  subject TEXT, -- for email
  body_html TEXT, -- rich content for email
  body_text TEXT, -- plain text / SMS content
  
  -- Template reference
  template_id UUID,
  
  -- Targeting
  target_segments JSONB DEFAULT '{}', -- filter criteria for contacts
  
  -- Schedule
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  
  -- Channel config
  from_email TEXT,
  from_name TEXT,
  reply_to TEXT,
  
  -- Created by
  created_by TEXT, -- clerk_id
  
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_type ON crm_campaigns(campaign_type);
CREATE INDEX idx_crm_campaigns_created_at ON crm_campaigns(created_at DESC);

-- ── 5. CRM Campaign Recipients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  
  -- Delivery
  email TEXT,
  phone TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  
  -- External IDs
  resend_message_id TEXT,
  twilio_message_sid TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_recipients_campaign ON crm_campaign_recipients(campaign_id);
CREATE INDEX idx_crm_recipients_contact ON crm_campaign_recipients(contact_id);
CREATE INDEX idx_crm_recipients_status ON crm_campaign_recipients(status);

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
  
  -- Variables available in template (e.g., {{name}}, {{company}})
  variables TEXT[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_templates_category ON crm_email_templates(category);
CREATE INDEX idx_crm_templates_active ON crm_email_templates(is_active) WHERE is_active = true;

-- ── 7. CRM Prospect Research Results ─────────────────────────────────────────
-- AI-powered research on potential business prospects
CREATE TABLE IF NOT EXISTS crm_prospect_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  
  -- Research query used
  research_query TEXT NOT NULL,
  research_type TEXT NOT NULL DEFAULT 'company'
    CHECK (research_type IN ('company', 'industry', 'competitor', 'keyword')),
  
  -- Results
  company_name TEXT,
  domain TEXT,
  description TEXT,
  industry TEXT,
  employee_count TEXT,
  annual_revenue TEXT,
  location TEXT,
  
  -- AI visibility assessment
  current_ai_visibility_score NUMERIC(5,2),
  estimated_monthly_ai_searches INTEGER,
  competitor_visibility_gap NUMERIC(5,2),
  roi_potential JSONB DEFAULT '{}', -- estimated ROI breakdown
  
  -- Search presence
  search_data JSONB DEFAULT '{}', -- raw search results
  ai_mentions JSONB DEFAULT '{}', -- mentions in AI platforms
  
  -- Qualification
  fit_score INTEGER DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 100),
  fit_reasons TEXT[],
  recommended_plan TEXT,
  recommended_approach TEXT,
  
  -- Sources
  sources_used TEXT[], -- exa, serp, google, etc.
  raw_data JSONB DEFAULT '{}',
  
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_research_contact ON crm_prospect_research(contact_id);
CREATE INDEX idx_crm_research_domain ON crm_prospect_research(domain);
CREATE INDEX idx_crm_research_fit_score ON crm_prospect_research(fit_score DESC);
CREATE INDEX idx_crm_research_created_at ON crm_prospect_research(created_at DESC);

-- ── 8. Updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER crm_deals_updated_at 
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER crm_campaigns_updated_at
  BEFORE UPDATE ON crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

-- ── 9. Auto-sync: When a new account is created, auto-create a CRM contact ──
CREATE OR REPLACE FUNCTION sync_account_to_crm_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if it's a new account with an owner
  INSERT INTO crm_contacts (
    company_name,
    company_industry,
    company_size,
    contact_type,
    lead_source,
    lead_status,
    account_id,
    lead_score
  ) VALUES (
    NEW.name,
    NEW.industry,
    NEW.company_size,
    'customer',
    'signup',
    'closed_won',
    NEW.id,
    80
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Don't auto-create for now, we'll do it via API
-- CREATE TRIGGER sync_new_account_to_crm
--   AFTER INSERT ON accounts
--   FOR EACH ROW EXECUTE FUNCTION sync_account_to_crm_contact();
