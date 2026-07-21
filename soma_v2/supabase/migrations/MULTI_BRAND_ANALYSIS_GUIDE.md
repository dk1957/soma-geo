# Multi-Brand Daily Analysis System

## Overview

This system enables comprehensive daily analysis of your primary brand AND all competitors, storing all GEO (Generative Engine Optimization) metrics for benchmarking and competitive intelligence.

## Architecture

### Key Design Principles

1. **Brand-Agnostic Structure**: Every table stores data for BOTH primary brand and competitors
2. **Daily Granularity**: All metrics are calculated and stored daily for trend analysis
3. **Comprehensive Metrics**: Tracks all GEO metrics (LVI, mentions, sentiment, SOV, citations, topics, sources)
4. **Competitive Benchmarking**: Easy comparison between primary brand and competitors

## Database Tables

### 1. `brand_daily_analysis`
**Purpose**: Daily snapshot of ALL GEO metrics for each brand (primary + competitors)

**Key Columns**:
- `brand_id`: Primary brand reference
- `competitor_id`: NULL for primary brand, competitor ID for competitors
- `is_primary_brand`: TRUE/FALSE flag
- `analysis_date`: Date of analysis
- `total_mentions`: Count of brand mentions
- `mention_rate`: % of responses mentioning brand
- `avg_position`: Average position when mentioned
- `avg_sentiment`: Average sentiment (-1 to 1)
- `share_of_voice`: % of total brand mentions
- `visibility_score`: % of responses with brand
- `citation_rate`: % of mentions with citations
- `lvi_score`: Composite LVI (0-100)
- `model_breakdown`: Per-model performance (JSONB)

**GEO Metrics Tracked**:

#### LLM Visibility Index (LVI)
- **Formula**: `(Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)`
- **Range**: 0-100
- **Components**:
  - `lvi_visibility_component`: 30% weight
  - `lvi_citation_component`: 30% weight
  - `lvi_sentiment_component`: 20% weight
  - `lvi_position_component`: 20% weight

#### Visibility Score
- **Formula**: `(Responses with brand / Total responses) × 100`
- **Interpretation**:
  - <20%: Poor (rare mentions)
  - 20-50%: Fair (occasional mentions)
  - 50-80%: Good (regular mentions)
  - >80%: Excellent (dominant presence)

#### Share of Voice (gSOV)
- **Formula**: `(Brand mentions / Total brand mentions) × 100`
- **Purpose**: Market share in AI responses

#### Mentions
- **Metric**: `total_mentions`
- **Interpretation**:
  - 0-10 per 100 queries: Minimal exposure
  - 10-30: Moderate presence
  - 30-50: Strong presence
  - 50+: Dominant presence

#### Brand Position
- **Formula**: `Sum of all positions ÷ Number of mentions`
- **Example**: Mentioned 1st twice, 3rd once = (1+1+3) ÷ 3 = 1.67
- **Interpretation**:
  - Position 1: Top authority
  - Position 2-3: Strong authority
  - Position 4-5: Moderate presence
  - Position 6+: Weak presence

#### Sentiment
- **Scale**: -1 (negative) to 1 (positive)
- **Categories**:
  - Positive: >0.6
  - Neutral: 0.3 to 0.6
  - Negative: <0.3
- **Interpretation**:
  - >0.8: Excellent (favorable views)
  - 0.3-0.8: Good (mostly positive)
  - 0 to 0.3: Fair (neutral)
  - <0: Poor (negative perceptions)

#### Citation Rate
- **Formula**: `(Responses with citations / Responses with brand) × 100`
- **Purpose**: Source attribution frequency

#### Factual Consistency Rate
- **Formula**: `(Correct facts / Total facts) × 100`
- **Purpose**: Accuracy and reliability metric

### 2. `brand_topic_analysis`
**Purpose**: Track topics associated with each brand and their usage frequency

**Key Columns**:
- `topic_name`: The topic/keyword
- `mention_count`: Times topic+brand appeared together
- `co_occurrence_rate`: % of brand mentions with this topic
- `usage_frequency`: Overall topic usage rate
- `relevance_score`: Topic-brand association strength (0-100)
- `unique_to_brand`: TRUE if only this brand uses topic
- `shared_with_competitors`: Array of competitors also using topic
- `competitive_advantage_score`: Topic exclusivity (0-100)

**Use Cases**:
- Content gap analysis
- Topic ownership identification
- Competitive topic mapping
- Brand-topic heatmap generation

### 3. `brand_source_analysis`
**Purpose**: Track source citations for each brand with usage frequency

**Key Columns**:
- `source_domain`: Domain being cited
- `total_citations`: Count of citations
- `unique_responses_citing`: Number of responses citing source
- `usage_frequency`: % of responses with this source
- `avg_citation_position`: Where citations appear
- `direct_citation_count`: Explicit links
- `formal_citation_count`: Named references
- `trust_score`: Domain authority (0-1)
- `is_authoritative`: High-authority flag
- `cites_brand_exclusively`: TRUE if only cites this brand
- `is_target_publisher`: Partnership opportunity flag

**Use Cases**:
- Source attribution analysis
- Publisher partnership opportunities
- Citation quality assessment
- Competitive source mapping

### 4. `response_analysis` (Updated)
**Purpose**: Per-response analysis (existing table with new brand-agnostic columns)

**New Columns**:
- `analyzed_brand_id`: Brand being analyzed (can be primary or competitor)
- `analyzed_competitor_id`: Competitor ID if analyzing competitor
- `is_analyzing_primary_brand`: TRUE/FALSE flag
- `brand_mentions`: Generic brand mention count
- `brand_visibility_score`: Generic visibility score
- `brand_positions`: Generic positions array
- `brand_avg_position`: Generic average position
- `brand_sentiment`: Generic sentiment score

**Note**: Old `primary_brand_*` columns remain for backward compatibility

## Usage Examples

### Calculate Daily Metrics

```sql
-- Calculate metrics for today for a specific brand
SELECT calculate_brand_daily_metrics(
  p_account_id := 'your-account-uuid',
  p_brand_id := 'your-brand-uuid',
  p_analysis_date := CURRENT_DATE,
  p_simulation_id := NULL  -- or specific simulation UUID
);

-- Calculate metrics for yesterday
SELECT calculate_brand_daily_metrics(
  p_account_id := 'your-account-uuid',
  p_brand_id := 'your-brand-uuid',
  p_analysis_date := CURRENT_DATE - INTERVAL '1 day',
  p_simulation_id := NULL
);
```

### Query Daily Metrics

```sql
-- Get today's metrics for primary brand + all competitors
SELECT 
  brand_name,
  is_primary_brand,
  lvi_score,
  mention_rate,
  avg_position,
  avg_sentiment,
  share_of_voice,
  citation_rate
FROM brand_daily_analysis
WHERE account_id = 'your-account-uuid'
  AND brand_id = 'your-brand-uuid'
  AND analysis_date = CURRENT_DATE
ORDER BY is_primary_brand DESC, lvi_score DESC;

-- Get last 30 days trend for primary brand
SELECT 
  analysis_date,
  lvi_score,
  mention_rate,
  avg_sentiment,
  share_of_voice
FROM brand_daily_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_primary_brand = true
  AND analysis_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY analysis_date ASC;

-- Compare primary brand vs competitors over time
SELECT 
  analysis_date,
  brand_name,
  is_primary_brand,
  lvi_score,
  mention_rate
FROM brand_daily_analysis
WHERE account_id = 'your-account-uuid'
  AND analysis_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY analysis_date DESC, lvi_score DESC;
```

### Query Topic Analysis

```sql
-- Get top topics for primary brand today
SELECT 
  topic_name,
  mention_count,
  usage_frequency,
  relevance_score,
  unique_to_brand
FROM brand_topic_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_primary_brand = true
  AND analysis_date = CURRENT_DATE
ORDER BY relevance_score DESC
LIMIT 10;

-- Find topics unique to primary brand (not used by competitors)
SELECT 
  topic_name,
  mention_count,
  relevance_score
FROM brand_topic_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_primary_brand = true
  AND unique_to_brand = true
  AND analysis_date = CURRENT_DATE
ORDER BY relevance_score DESC;

-- Compare topic usage: primary vs competitors
SELECT 
  topic_name,
  brand_name,
  is_primary_brand,
  mention_count,
  relevance_score
FROM brand_topic_analysis
WHERE account_id = 'your-account-uuid'
  AND analysis_date = CURRENT_DATE
  AND topic_name IN (
    SELECT DISTINCT topic_name 
    FROM brand_topic_analysis 
    WHERE brand_id = 'your-brand-uuid' 
      AND analysis_date = CURRENT_DATE
  )
ORDER BY topic_name, relevance_score DESC;
```

### Query Source Analysis

```sql
-- Get top sources for primary brand
SELECT 
  source_domain,
  total_citations,
  usage_frequency,
  trust_score,
  is_authoritative
FROM brand_source_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_primary_brand = true
  AND analysis_date = CURRENT_DATE
ORDER BY total_citations DESC
LIMIT 10;

-- Find exclusive sources (only cite primary brand)
SELECT 
  source_domain,
  total_citations,
  trust_score,
  is_authoritative
FROM brand_source_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_primary_brand = true
  AND cites_brand_exclusively = true
  AND analysis_date = CURRENT_DATE
ORDER BY total_citations DESC;

-- Find publisher opportunities
SELECT 
  source_domain,
  total_citations,
  usage_frequency,
  trust_score,
  partnership_opportunity_score
FROM brand_source_analysis
WHERE brand_id = 'your-brand-uuid'
  AND is_target_publisher = true
  AND analysis_date = CURRENT_DATE
ORDER BY partnership_opportunity_score DESC;
```

## Setting Up Daily Analysis

### 1. Backfill Historical Data

```sql
-- Backfill last 30 days
DO $$
DECLARE
  current_date DATE := CURRENT_DATE - INTERVAL '30 days';
  brand_record RECORD;
BEGIN
  -- Loop through each day
  WHILE current_date <= CURRENT_DATE LOOP
    -- Loop through each brand
    FOR brand_record IN 
      SELECT b.id, b.account_id 
      FROM brands b 
      WHERE b.deleted_at IS NULL
    LOOP
      PERFORM calculate_brand_daily_metrics(
        brand_record.account_id,
        brand_record.id,
        current_date,
        NULL
      );
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END $$;
```

### 2. Set Up Daily Cron Job (using pg_cron)

```sql
-- Install pg_cron extension (if not already installed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily analysis at 1 AM
SELECT cron.schedule(
  'daily-brand-analysis',
  '0 1 * * *',  -- Every day at 1 AM
  $$
  DO $$
  DECLARE
    brand_record RECORD;
  BEGIN
    FOR brand_record IN 
      SELECT b.id, b.account_id 
      FROM brands b 
      WHERE b.deleted_at IS NULL
    LOOP
      PERFORM calculate_brand_daily_metrics(
        brand_record.account_id,
        brand_record.id,
        CURRENT_DATE - INTERVAL '1 day',
        NULL
      );
    END LOOP;
  END;
  $$
  $$
);
```

## Data Flow

```
1. Daily LLM Responses
   ↓
2. response_analysis (per-response metrics)
   ↓
3. calculate_brand_daily_metrics() function
   ↓
4. brand_daily_analysis (daily snapshots)
   brand_topic_analysis (topic tracking)
   brand_source_analysis (citation tracking)
   ↓
5. Reports & Dashboards
```

## Report Integration

### External Brand Visibility Report v4

The report should query data from:

1. **Stats Cards**: `brand_daily_analysis` (mention_rate, avg_sentiment, lvi_score, citation_rate)
2. **LVI Trend Chart**: `brand_daily_analysis` (lvi_score over time)
3. **Industry Rankings**: `brand_daily_analysis` (all brands sorted by lvi_score)
4. **Topic Heatmap**: `brand_topic_analysis` (brand × topic matrix)
5. **Sources Table**: `brand_source_analysis` (top sources by usage)
6. **Competitive Analysis**: `brand_daily_analysis` (compare primary vs competitors)

### Example API Endpoint

```typescript
// GET /api/brands/:brandId/daily-analysis?date=2025-11-09

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const { data: dailyMetrics } = await supabase
    .from('brand_daily_analysis')
    .select('*')
    .eq('brand_id', brandId)
    .eq('analysis_date', date)
    .order('is_primary_brand', { ascending: false })
  
  return Response.json({ metrics: dailyMetrics })
}
```

## Maintenance

### Check Data Quality

```sql
-- Check if daily analysis is running
SELECT 
  analysis_date,
  COUNT(*) as brands_analyzed,
  AVG(sample_size) as avg_sample_size,
  AVG(data_quality_score) as avg_quality
FROM brand_daily_analysis
WHERE analysis_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY analysis_date
ORDER BY analysis_date DESC;

-- Find missing dates
SELECT date_series::date as missing_date
FROM generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  '1 day'::interval
) date_series
WHERE NOT EXISTS (
  SELECT 1 FROM brand_daily_analysis 
  WHERE analysis_date = date_series::date
);
```

### Recalculate Specific Date

```sql
-- If you need to recalculate a specific date
SELECT calculate_brand_daily_metrics(
  'account-uuid',
  'brand-uuid',
  '2025-11-08'::date,
  NULL
);
```

## Migration Checklist

- [x] Create `brand_daily_analysis` table
- [x] Create `brand_topic_analysis` table  
- [x] Create `brand_source_analysis` table
- [x] Add brand-agnostic columns to `response_analysis`
- [x] Create `calculate_brand_daily_metrics()` function
- [x] Set up RLS policies
- [x] Add indexes for performance
- [ ] Backfill historical data
- [ ] Set up pg_cron daily job
- [ ] Update report queries
- [ ] Update API endpoints
- [ ] Update frontend components

## Troubleshooting

### No data in brand_daily_analysis
1. Check if `response_analysis` has data for the date
2. Run `calculate_brand_daily_metrics()` manually
3. Check function logs for errors

### Competitors not showing up
1. Verify competitors exist in `competitors` table
2. Check if `brands_mentioned` JSONB in `response_analysis` has competitor names
3. Ensure competitor names match exactly (case-sensitive)

### Performance issues
1. Ensure all indexes are created
2. Run `ANALYZE` on tables
3. Check pg_cron job timing (avoid peak hours)
