-- ============================================================================
-- CRM Tasks & Enhancements
-- Sales follow-ups, action items, and pipeline tasks
-- ============================================================================

-- ── 1. CRM Tasks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,

  task_type TEXT NOT NULL DEFAULT 'follow_up'
    CHECK (task_type IN ('follow_up', 'call', 'email', 'meeting', 'demo', 'proposal', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  assigned_to TEXT,   -- clerk_id
  created_by TEXT,    -- clerk_id

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_deal ON crm_tasks(deal_id);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_priority ON crm_tasks(priority) WHERE status IN ('pending', 'in_progress');

-- Updated_at trigger
CREATE TRIGGER crm_tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

-- ── 2. Add enrichment columns to contacts if missing ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_logo_url') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_description') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_revenue') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_revenue TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_tech_stack') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_tech_stack TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_address') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_latitude') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_latitude NUMERIC(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contacts' AND column_name = 'company_longitude') THEN
    ALTER TABLE crm_contacts ADD COLUMN company_longitude NUMERIC(10,7);
  END IF;
END $$;

-- ── 3. Add geospatial fields to research records if missing ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_prospect_research' AND column_name = 'location_address') THEN
    ALTER TABLE crm_prospect_research ADD COLUMN location_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_prospect_research' AND column_name = 'latitude') THEN
    ALTER TABLE crm_prospect_research ADD COLUMN latitude NUMERIC(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_prospect_research' AND column_name = 'longitude') THEN
    ALTER TABLE crm_prospect_research ADD COLUMN longitude NUMERIC(10,7);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_coords
  ON crm_contacts(company_latitude, company_longitude)
  WHERE company_latitude IS NOT NULL AND company_longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_research_coords
  ON crm_prospect_research(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
