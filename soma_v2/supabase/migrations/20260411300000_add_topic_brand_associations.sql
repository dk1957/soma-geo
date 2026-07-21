-- ============================================================================
-- Topic Brand Associations Table
-- ============================================================================
-- Stores per-brand topic/attribute associations extracted from AI responses.
-- Each row = one topic associated with one brand in one response.
-- Enables brand×topic heatmap with per-brand sentiment.
-- ============================================================================

CREATE TABLE IF NOT EXISTS topic_brand_associations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES llm_response_files(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  brand_id UUID,          -- FK to brands (set for primary brand)
  competitor_id UUID,     -- FK to competitors (set for competitor rows)
  topic_name TEXT NOT NULL,
  topic_category TEXT,
  sentiment FLOAT NOT NULL DEFAULT 0,   -- -1.0 to 1.0 per brand for this topic
  relevance FLOAT NOT NULL DEFAULT 0,   -- 0.0 to 1.0
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_tba_response_id ON topic_brand_associations(response_id);
CREATE INDEX idx_tba_account_id ON topic_brand_associations(account_id);
CREATE INDEX idx_tba_account_brand ON topic_brand_associations(account_id, brand_name);
CREATE INDEX idx_tba_topic_name ON topic_brand_associations(topic_name);
CREATE INDEX idx_tba_account_topic ON topic_brand_associations(account_id, topic_name);

-- RLS
ALTER TABLE topic_brand_associations ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on topic_brand_associations"
  ON topic_brand_associations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read their own account's data
CREATE POLICY "Authenticated users can read own topic_brand_associations"
  ON topic_brand_associations FOR SELECT TO authenticated
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
