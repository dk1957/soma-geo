-- Documentation for per-prompt metrics integration
-- This migration documents the data flow for prompt metrics

/*
Per-Prompt Metrics Integration
==============================

The prompt management API now fetches per-prompt metrics from response_analysis table.

Data Flow:
1. user_prompts table stores prompt definitions with UUID id
2. response_analysis table stores analysis results with TEXT prompt_id (same value as user_prompts.id)
3. API joins these tables by casting user_prompts.id to TEXT for comparison

Metrics Calculated Per Prompt:
- lvi_score: (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)
  - Visibility = (mention_count / total_responses) * 100
  - Citation = min((citation_count / total_responses) * 100, 100)
  - Sentiment = ((avg_sentiment + 1) / 2) * 100 (converts -1 to 1 scale to 0-100)
  - Position = 100 - ((avg_position - 1) * (100/19)) for positions 1-20
  
- gsov_score (Share of Voice): Average of share_of_voice from all responses for the prompt

- mentions_count: Count of responses where brand_mentioned = true

- sentiment_score: Average of brand_sentiment from responses where brand was mentioned (-1 to 1 scale)

- position: Average of brand_first_position from responses where brand was mentioned and position > 0

- total_responses: Total count of analysis records for this prompt

- citation_count: Sum of brand_citation_count across all responses

API Endpoints Updated:
- GET /api/prompt-management?brand_id=X - Now includes per-prompt metrics in response
- GET /api/prompt-analytics?brand_id=X&prompt_id=Y - Existing endpoint for detailed prompt analytics

Frontend Components Updated:
- /dashboard/prompts/page.tsx - Prompts table now displays LVI, gSOV, Mentions, Sentiment, Position
- /dashboard/prompts/[promptId]/page.tsx - Prompt detail page with comprehensive metrics

Consistent Metric Formulas:
The LVI formula is unified across:
- Main Dashboard Chart (get_lvi_timeseries)
- Industry Rankings (get_industry_rankings)
- Prompt-level metrics (prompt-management API)
- Prompt Details page (prompt-analytics API)
*/

-- No schema changes needed - this is documentation only
SELECT 'Per-prompt metrics documentation added' as status;
