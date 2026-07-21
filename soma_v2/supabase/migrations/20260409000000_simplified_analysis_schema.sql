-- ============================================================================
-- SIMPLIFIED ANALYSIS SCHEMA
-- ============================================================================
-- Inspired by Google Search Console's clean data model:
--   GSC: { query, page, date, device } → { clicks, impressions, ctr, position }
--   AEO: { prompt, brand, model, date } → { mentioned, cited, position, sentiment, sov, lvi }
--
-- 3-table architecture:
--   1. brand_appearances  — One row per response × brand (atomic facts)
--   2. brand_daily_stats  — One row per brand × date (daily aggregates, like GSC chart)
--   3. brand_sources      — One row per source × brand × date (normalized source tracking)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: brand_appearances
-- The atomic fact table. One row per brand analyzed per LLM response.
-- Think of it as: "Did brand X appear in response Y, and how?"
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_appearances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys: who/what/when
  response_id           UUID NOT NULL,               -- FK → llm_response_files.id
  simulation_id         UUID NOT NULL,               -- FK → llm_simulations.id
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id              UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id         UUID REFERENCES competitors(id) ON DELETE CASCADE,
  
  -- Dimensions (slicing/filtering)
  brand_name            TEXT NOT NULL,
  is_primary            BOOLEAN NOT NULL DEFAULT false,
  model_name            TEXT NOT NULL,                -- e.g. 'openai/gpt-5-chat'
  prompt_id             UUID,
  prompt_text           TEXT NOT NULL,
  analysis_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- ═══ CORE METRICS (like GSC: clicks, impressions, ctr, position) ═══
  -- Metric 1: Visibility (= "impression" in GSC terms)
  mentioned             BOOLEAN NOT NULL DEFAULT false,
  mention_count         INTEGER NOT NULL DEFAULT 0,
  
  -- Metric 2: Position (= GSC average position)
  first_position        INTEGER,                     -- 1 = first brand mentioned (best)
  total_brands          INTEGER NOT NULL DEFAULT 0,   -- how many brands were in the response
  
  -- Metric 3: Sentiment (-1 to +1)
  sentiment             NUMERIC(4,3) NOT NULL DEFAULT 0,     -- -1.000 to 1.000
  sentiment_label       TEXT NOT NULL DEFAULT 'neutral',     -- positive/neutral/negative
  
  -- Metric 4: Citations (= "click" in GSC terms — brand was linked/sourced)
  cited                 BOOLEAN NOT NULL DEFAULT false,
  citation_count        INTEGER NOT NULL DEFAULT 0,
  total_sources         INTEGER NOT NULL DEFAULT 0,  -- total sources in the response
  
  -- Metric 5: Share of Voice
  share_of_voice        NUMERIC(5,2) NOT NULL DEFAULT 0,     -- 0-100%
  
  -- Metric 6: LVI Score (composite, pre-computed per response)
  lvi_score             NUMERIC(5,2) NOT NULL DEFAULT 0,     -- 0-100
  
  -- ═══ DETAIL FIELDS (for drill-downs, kept minimal) ═══
  topics                JSONB DEFAULT '[]'::jsonb,    -- [{name, category, sentiment}]
  competitors_in_response TEXT[] DEFAULT '{}',         -- other brands mentioned
  competitive_position  TEXT DEFAULT 'neutral',        -- leader/challenger/niche/neutral/not_mentioned
  
  -- Meta
  analyzed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_sentiment CHECK (sentiment >= -1 AND sentiment <= 1),
  CONSTRAINT valid_sov CHECK (share_of_voice >= 0 AND share_of_voice <= 100),
  CONSTRAINT valid_lvi CHECK (lvi_score >= 0 AND lvi_score <= 100),
  CONSTRAINT entity_type CHECK (
    (is_primary = true AND competitor_id IS NULL) OR
    (is_primary = false)
  )
);

-- Unique: one analysis per response × brand
CREATE UNIQUE INDEX idx_appearances_unique 
  ON brand_appearances (response_id, brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'));

-- Query patterns
CREATE INDEX idx_appearances_brand_date ON brand_appearances (brand_id, analysis_date DESC);
CREATE INDEX idx_appearances_account_date ON brand_appearances (account_id, analysis_date DESC);
CREATE INDEX idx_appearances_model ON brand_appearances (model_name, analysis_date DESC);
CREATE INDEX idx_appearances_mentioned ON brand_appearances (brand_id, analysis_date DESC) WHERE mentioned = true;
CREATE INDEX idx_appearances_simulation ON brand_appearances (simulation_id);
CREATE INDEX idx_appearances_competitor ON brand_appearances (competitor_id) WHERE competitor_id IS NOT NULL;
CREATE INDEX idx_appearances_prompt ON brand_appearances (prompt_id) WHERE prompt_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: brand_daily_stats
-- Pre-aggregated daily metrics — this IS the GSC chart.
-- One row per brand × date (optionally × model for model-level drilldown).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_daily_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dimensions
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id              UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id         UUID REFERENCES competitors(id) ON DELETE CASCADE,
  brand_name            TEXT NOT NULL,
  is_primary            BOOLEAN NOT NULL DEFAULT false,
  stat_date             DATE NOT NULL,
  model_name            TEXT,                        -- NULL = all models combined
  
  -- ═══ THE 5 CORE METRICS (GSC-style daily aggregates) ═══
  
  -- Like Impressions: how many responses, how many mentioned the brand
  total_responses       INTEGER NOT NULL DEFAULT 0,
  appearances           INTEGER NOT NULL DEFAULT 0,  -- responses where mentioned=true
  
  -- Metric 1: LVI Score (composite, daily average)
  lvi_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Metric 2: Share of Voice (daily average)
  share_of_voice        NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Metric 3: Visibility Rate (= appearances / total_responses × 100)
  visibility_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Metric 4: Sentiment Score (daily average, 0-100 scale)
  sentiment_score       NUMERIC(5,2) NOT NULL DEFAULT 50,
  
  -- Metric 5: Position Score (daily average, 0-100 scale)
  position_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- ═══ SUPPORTING COUNTS (for drill-downs) ═══
  citations             INTEGER NOT NULL DEFAULT 0,  -- responses where cited=true
  citation_rate         NUMERIC(5,2) NOT NULL DEFAULT 0, -- citations/appearances × 100
  
  avg_position          NUMERIC(4,1),                -- raw average ordinal position
  best_position         INTEGER,
  
  avg_sentiment_raw     NUMERIC(4,3),                -- raw -1 to 1 average
  positive_count        INTEGER NOT NULL DEFAULT 0,
  neutral_count         INTEGER NOT NULL DEFAULT 0,
  negative_count        INTEGER NOT NULL DEFAULT 0,
  
  total_mentions        INTEGER NOT NULL DEFAULT 0,  -- sum of all mention_count
  total_prompts         INTEGER NOT NULL DEFAULT 0,  -- distinct prompts
  total_models          INTEGER NOT NULL DEFAULT 0,  -- distinct models (when model_name IS NULL)
  
  -- Meta
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_stats CHECK (
    lvi_score >= 0 AND lvi_score <= 100 AND
    share_of_voice >= 0 AND share_of_voice <= 100 AND
    visibility_rate >= 0 AND visibility_rate <= 100 AND
    sentiment_score >= 0 AND sentiment_score <= 100 AND
    position_score >= 0 AND position_score <= 100
  )
);

-- Unique: one row per brand × date × model level
CREATE UNIQUE INDEX idx_daily_stats_unique
  ON brand_daily_stats (account_id, brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'), stat_date, COALESCE(model_name, '__all__'));

-- Query patterns (the main ones for dashboards)
CREATE INDEX idx_daily_stats_brand_date ON brand_daily_stats (brand_id, stat_date DESC);
CREATE INDEX idx_daily_stats_account_date ON brand_daily_stats (account_id, stat_date DESC);
CREATE INDEX idx_daily_stats_primary ON brand_daily_stats (account_id, stat_date DESC) WHERE is_primary = true AND model_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: brand_sources
-- Normalized source tracking. One row per source domain × brand × date.
-- Answers: "Which sources cite my brand? How often? What type?"
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dimensions
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id              UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id         UUID REFERENCES competitors(id) ON DELETE CASCADE,
  brand_name            TEXT NOT NULL,
  source_date           DATE NOT NULL,
  
  -- Source identity
  domain                TEXT NOT NULL,               -- e.g. 'forbes.com'
  source_type           TEXT NOT NULL DEFAULT 'earned', -- owned/earned/competitor/paid
  source_category       TEXT DEFAULT 'other',        -- news/editorial/blog/ugc/social/reference/academic/corporate/other
  
  -- Metrics
  citation_count        INTEGER NOT NULL DEFAULT 1,  -- times this source cited this brand on this date
  response_count        INTEGER NOT NULL DEFAULT 1,  -- in how many responses
  sample_url            TEXT,                        -- one example URL
  sample_title          TEXT,                        -- one example title
  
  -- Meta
  last_seen             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one row per brand × source × date
CREATE UNIQUE INDEX idx_sources_unique
  ON brand_sources (brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'), domain, source_date);

CREATE INDEX idx_sources_brand_date ON brand_sources (brand_id, source_date DESC);
CREATE INDEX idx_sources_domain ON brand_sources (domain, source_date DESC);
CREATE INDEX idx_sources_type ON brand_sources (source_type);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Compute daily stats from brand_appearances
-- Call this after each analysis batch to update the daily aggregate.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_daily_stats(
  p_account_id UUID,
  p_brand_id UUID,
  p_date DATE
) RETURNS void AS $$
BEGIN
  -- ── Per-model rows ──
  INSERT INTO brand_daily_stats (
    account_id, brand_id, competitor_id, brand_name, is_primary,
    stat_date, model_name,
    total_responses, appearances,
    lvi_score, share_of_voice, visibility_rate, sentiment_score, position_score,
    citations, citation_rate,
    avg_position, best_position,
    avg_sentiment_raw, positive_count, neutral_count, negative_count,
    total_mentions, total_prompts, total_models,
    computed_at
  )
  SELECT
    account_id,
    brand_id,
    competitor_id,
    MAX(brand_name),
    bool_or(is_primary),
    analysis_date,
    model_name,
    -- Counts
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE mentioned)::int,
    -- LVI: average of per-response LVI scores
    ROUND(AVG(lvi_score), 2),
    -- Share of Voice: average across responses
    ROUND(AVG(share_of_voice), 2),
    -- Visibility Rate: appearances / total × 100
    ROUND(COUNT(*) FILTER (WHERE mentioned)::numeric / NULLIF(COUNT(*), 0) * 100, 2),
    -- Sentiment Score: normalize avg sentiment from -1..1 to 0..100
    ROUND(((AVG(sentiment) + 1) / 2) * 100, 2),
    -- Position Score: avg(max(0, 100 - (first_position - 1) * 10))
    ROUND(AVG(
      CASE WHEN first_position IS NOT NULL AND first_position > 0
           THEN GREATEST(0, 100 - (first_position - 1) * 10)
           ELSE 0 END
    ), 2),
    -- Citation counts
    COUNT(*) FILTER (WHERE cited)::int,
    COALESCE(ROUND(
      COUNT(*) FILTER (WHERE cited)::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE mentioned), 0) * 100, 2
    ), 0),
    -- Position stats
    ROUND(AVG(first_position) FILTER (WHERE first_position IS NOT NULL AND first_position > 0), 1),
    MIN(first_position) FILTER (WHERE first_position IS NOT NULL AND first_position > 0),
    -- Sentiment stats
    ROUND(AVG(sentiment), 3),
    COUNT(*) FILTER (WHERE sentiment > 0.2)::int,
    COUNT(*) FILTER (WHERE sentiment >= -0.2 AND sentiment <= 0.2)::int,
    COUNT(*) FILTER (WHERE sentiment < -0.2)::int,
    -- Mention/prompt/model counts
    SUM(mention_count)::int,
    COUNT(DISTINCT prompt_id)::int,
    COUNT(DISTINCT model_name)::int,
    now()
  FROM brand_appearances
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND analysis_date = p_date
  GROUP BY account_id, brand_id, competitor_id, analysis_date, model_name
  ON CONFLICT (account_id, brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'), stat_date, COALESCE(model_name, '__all__'))
  DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    appearances = EXCLUDED.appearances,
    lvi_score = EXCLUDED.lvi_score,
    share_of_voice = EXCLUDED.share_of_voice,
    visibility_rate = EXCLUDED.visibility_rate,
    sentiment_score = EXCLUDED.sentiment_score,
    position_score = EXCLUDED.position_score,
    citations = EXCLUDED.citations,
    citation_rate = EXCLUDED.citation_rate,
    avg_position = EXCLUDED.avg_position,
    best_position = EXCLUDED.best_position,
    avg_sentiment_raw = EXCLUDED.avg_sentiment_raw,
    positive_count = EXCLUDED.positive_count,
    neutral_count = EXCLUDED.neutral_count,
    negative_count = EXCLUDED.negative_count,
    total_mentions = EXCLUDED.total_mentions,
    total_prompts = EXCLUDED.total_prompts,
    total_models = EXCLUDED.total_models,
    computed_at = now();

  -- ── Combined "all models" row ──
  INSERT INTO brand_daily_stats (
    account_id, brand_id, competitor_id, brand_name, is_primary,
    stat_date, model_name,
    total_responses, appearances,
    lvi_score, share_of_voice, visibility_rate, sentiment_score, position_score,
    citations, citation_rate,
    avg_position, best_position,
    avg_sentiment_raw, positive_count, neutral_count, negative_count,
    total_mentions, total_prompts, total_models,
    computed_at
  )
  SELECT
    account_id,
    brand_id,
    competitor_id,
    MAX(brand_name),
    bool_or(is_primary),
    analysis_date,
    NULL,  -- model_name = NULL means "all models combined"
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE mentioned)::int,
    ROUND(AVG(lvi_score), 2),
    ROUND(AVG(share_of_voice), 2),
    ROUND(COUNT(*) FILTER (WHERE mentioned)::numeric / NULLIF(COUNT(*), 0) * 100, 2),
    ROUND(((AVG(sentiment) + 1) / 2) * 100, 2),
    ROUND(AVG(
      CASE WHEN first_position IS NOT NULL AND first_position > 0
           THEN GREATEST(0, 100 - (first_position - 1) * 10)
           ELSE 0 END
    ), 2),
    COUNT(*) FILTER (WHERE cited)::int,
    COALESCE(ROUND(
      COUNT(*) FILTER (WHERE cited)::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE mentioned), 0) * 100, 2
    ), 0),
    ROUND(AVG(first_position) FILTER (WHERE first_position IS NOT NULL AND first_position > 0), 1),
    MIN(first_position) FILTER (WHERE first_position IS NOT NULL AND first_position > 0),
    ROUND(AVG(sentiment), 3),
    COUNT(*) FILTER (WHERE sentiment > 0.2)::int,
    COUNT(*) FILTER (WHERE sentiment >= -0.2 AND sentiment <= 0.2)::int,
    COUNT(*) FILTER (WHERE sentiment < -0.2)::int,
    SUM(mention_count)::int,
    COUNT(DISTINCT prompt_id)::int,
    COUNT(DISTINCT model_name)::int,
    now()
  FROM brand_appearances
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND analysis_date = p_date
  GROUP BY account_id, brand_id, competitor_id, analysis_date
  ON CONFLICT (account_id, brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'), stat_date, COALESCE(model_name, '__all__'))
  DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    appearances = EXCLUDED.appearances,
    lvi_score = EXCLUDED.lvi_score,
    share_of_voice = EXCLUDED.share_of_voice,
    visibility_rate = EXCLUDED.visibility_rate,
    sentiment_score = EXCLUDED.sentiment_score,
    position_score = EXCLUDED.position_score,
    citations = EXCLUDED.citations,
    citation_rate = EXCLUDED.citation_rate,
    avg_position = EXCLUDED.avg_position,
    best_position = EXCLUDED.best_position,
    avg_sentiment_raw = EXCLUDED.avg_sentiment_raw,
    positive_count = EXCLUDED.positive_count,
    neutral_count = EXCLUDED.neutral_count,
    negative_count = EXCLUDED.negative_count,
    total_mentions = EXCLUDED.total_mentions,
    total_prompts = EXCLUDED.total_prompts,
    total_models = EXCLUDED.total_models,
    computed_at = now();
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE brand_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_sources ENABLE ROW LEVEL SECURITY;

-- Service role: full access (used by analysis engine)
CREATE POLICY "service_role_appearances" ON brand_appearances
  USING (((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'));
CREATE POLICY "service_role_daily_stats" ON brand_daily_stats
  USING (((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'));
CREATE POLICY "service_role_sources" ON brand_sources
  USING (((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'));

-- Authenticated users: read their own account's data
CREATE POLICY "users_read_appearances" ON brand_appearances FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));
CREATE POLICY "users_read_daily_stats" ON brand_daily_stats FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));
CREATE POLICY "users_read_sources" ON brand_sources FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Grant access
GRANT ALL ON brand_appearances TO service_role;
GRANT SELECT ON brand_appearances TO authenticated;
GRANT ALL ON brand_daily_stats TO service_role;
GRANT SELECT ON brand_daily_stats TO authenticated;
GRANT ALL ON brand_sources TO service_role;
GRANT SELECT ON brand_sources TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- COMMENTS (for documentation)
-- ────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE brand_appearances IS 'Atomic fact table: one row per brand analyzed per LLM response. Like GSC raw search appearance data.';
COMMENT ON TABLE brand_daily_stats IS 'Daily aggregated metrics per brand. Like GSC Performance chart. The primary dashboard query table.';
COMMENT ON TABLE brand_sources IS 'Normalized source/citation tracking per brand per day. Answers: which sources cite my brand?';
COMMENT ON COLUMN brand_daily_stats.model_name IS 'NULL = all models combined (the top-level row). Non-NULL = per-model breakdown.';
COMMENT ON COLUMN brand_appearances.lvi_score IS 'LVI = (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2). Pre-computed per response.';
