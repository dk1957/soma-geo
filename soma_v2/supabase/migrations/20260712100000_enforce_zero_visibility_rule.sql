-- ============================================================================
-- Migration: Enforce zero-visibility rule on historical data
-- ============================================================================
-- Problem: daily_brand_metrics rows computed before the zero-visibility rule
-- was added to the aggregator have non-zero lvi_score when visibility_rate = 0.
-- This causes phantom LVI scores for brands with no mentions.
--
-- Rule: If a brand has 0 visibility (no mentions), LVI must be 0.
-- Sentiment defaults to 0 (not "neutral 0.0") when there are no mentions.
-- ============================================================================

-- Fix daily_brand_metrics: set lvi_score = 0 where visibility_rate = 0
UPDATE daily_brand_metrics
SET lvi_score = 0
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
  AND lvi_score != 0;

-- Fix daily_brand_metrics: set avg_sentiment = 0 where no mentions
-- (raw sentiment 0 means "no data", not "neutral")
UPDATE daily_brand_metrics
SET avg_sentiment = 0
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
  AND avg_sentiment != 0;

-- Fix daily_brand_metrics: set share_of_voice = 0 where no mentions
UPDATE daily_brand_metrics
SET share_of_voice = 0
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
  AND share_of_voice != 0;

-- Fix daily_brand_metrics: null out avg_brand_rank where no mentions
UPDATE daily_brand_metrics
SET avg_brand_rank = NULL
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
  AND avg_brand_rank IS NOT NULL;

-- Same fixes for daily_prompt_metrics
UPDATE daily_prompt_metrics
SET lvi_score = 0
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND lvi_score != 0;

UPDATE daily_prompt_metrics
SET avg_sentiment = 0
WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
  AND avg_sentiment != 0;

-- Same fixes for daily_model_metrics (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_model_metrics') THEN
    EXECUTE '
      UPDATE daily_model_metrics
      SET lvi_score = 0
      WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
        AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
        AND lvi_score != 0;

      UPDATE daily_model_metrics
      SET avg_sentiment = 0
      WHERE (visibility_rate = 0 OR visibility_rate IS NULL)
        AND (responses_with_mention = 0 OR responses_with_mention IS NULL)
        AND avg_sentiment != 0;
    ';
  END IF;
END $$;
