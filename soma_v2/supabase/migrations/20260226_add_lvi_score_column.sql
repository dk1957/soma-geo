-- Add lvi_score column to response_analysis table
-- LVI (LLM Visibility Index) = (Visibility×0.3) + (Citation×0.3) + (Sentiment×0.2) + (Position×0.2)
-- Scale: 0-100

ALTER TABLE response_analysis 
ADD COLUMN IF NOT EXISTS lvi_score NUMERIC(5,2) DEFAULT 0;

-- Index for time-series queries and leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_response_analysis_lvi_score 
ON response_analysis (account_id, brand_id, analysis_date, lvi_score DESC);

-- Backfill existing records with computed LVI scores
UPDATE response_analysis SET lvi_score = ROUND(
  (
    -- Visibility: 30 points if mentioned
    (CASE WHEN brand_mentioned THEN 100 ELSE 0 END * 0.3) +
    -- Citation: citation_rate already 0-1, scale to 100 then weight
    (LEAST(1, COALESCE(citation_rate, 0)) * 100 * 0.3) +
    -- Sentiment: normalize -1..1 to 0..100 then weight
    (CASE WHEN brand_mentioned THEN ((COALESCE(sentiment_score, 0) + 1) / 2 * 100) * 0.2 ELSE 0 END) +
    -- Position: position_score already 0-1, scale to 100 then weight
    (COALESCE(position_score, 0) * 100 * 0.2)
  ),
  2
)
WHERE lvi_score = 0 OR lvi_score IS NULL;
