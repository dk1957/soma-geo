# External Report Schema Documentation

## Overview

This schema provides the database infrastructure for the external brand visibility report (`external-brand-visibility-report-v4.tsx`). It aggregates data from raw LLM simulation responses and analysis tables into optimized structures for reporting and visualization.

## Architecture

```
Raw Data Layer
├── llm_simulation_responses (raw LLM responses)
├── response_analysis (primary brand analysis)
├── competitor_response_analysis (competitor analysis)
├── response_citations (citation data)
└── topic_insights (topic extraction)

Aggregation Layer (THIS SCHEMA)
├── brand_performance_metrics (overall brand metrics)
├── topic_brand_associations (topic-brand heatmap)
├── brand_metrics_timeseries (time-series for charts)
├── prompt_performance_analysis (per-prompt analysis)
└── citation_domain_analysis (source/publisher analysis)

Presentation Layer
└── external-brand-visibility-report-v4.tsx
```

## Tables

### 1. brand_performance_metrics

**Purpose**: Aggregated performance metrics for brands and competitors across all prompts and models.

**Used For**:
- Stats cards (mention rate, avg sentiment, avg ranking, total citations)
- Industry rankings table
- Competitive positioning
- LVI score calculation

**Key Columns**:
- `is_primary_brand`: Distinguishes your brand from competitors
- `metric_period`: '7d', '30d', '90d', 'all'
- `mention_rate`: % of responses where brand mentioned
- `lvi_score`: LLM Visibility Index (0-100)
- `industry_rank`: Overall competitive rank
- `share_of_voice`: % of total brand mentions

**Populated By**: `calculate_brand_performance_metrics()` function

**Data Flow**:
```
response_analysis → aggregate by brand → brand_performance_metrics
competitor_response_analysis → aggregate by competitor → brand_performance_metrics
```

### 2. topic_brand_associations

**Purpose**: Aggregated topic associations for brands across all responses.

**Used For**:
- Brand-topic heatmap visualization
- Topic-competitive analysis
- Content gap identification

**Key Columns**:
- `topic_name`: The topic/keyword
- `brand_name`: Associated brand
- `mention_count`: Times topic+brand appear together
- `co_occurrence_rate`: % of brand mentions including this topic
- `relevance_score`: Strength of association (0-100)
- `competitive_advantage_score`: Topic exclusivity (0-100)

**Populated By**: `calculate_topic_brand_associations()` function

**Data Flow**:
```
topic_insights → aggregate by topic+brand → topic_brand_associations
```

### 3. brand_metrics_timeseries

**Purpose**: Daily/hourly snapshots of brand performance for trend analysis.

**Used For**:
- LVI trend chart
- Analytics chart with date filtering
- Historical comparison

**Key Columns**:
- `snapshot_date`: Date of snapshot
- `time_granularity`: 'hourly', 'daily', 'weekly'
- `lvi_score`: Point-in-time LVI
- `mention_rate`: Point-in-time mention rate
- `lvi_delta`: Change from previous snapshot
- `mention_rate_delta`: Change from previous snapshot

**Populated By**: Scheduled jobs (daily/hourly aggregation)

**Materialized View**: `brand_metrics_latest` - Fast access to most recent metrics

### 4. prompt_performance_analysis

**Purpose**: Per-prompt competitive analysis showing brand vs competitor performance.

**Used For**:
- Prompt-by-prompt analysis section
- Opportunity identification (missed mentions)
- Strength identification (dominance)
- Threat identification (competitor advantage)

**Key Columns**:
- `prompt_text`: The query analyzed
- `primary_brand_mentioned`: Boolean - was your brand mentioned?
- `primary_brand_mention_rate`: % of models mentioning brand
- `top_competitor_name`: Leading competitor for this prompt
- `is_opportunity`: True if competitors mentioned but not you
- `is_strength`: True if you dominate this prompt
- `is_threat`: True if competitors significantly outperform
- `opportunity_score`: Revenue/impact potential (0-100)

**Populated By**: `calculate_prompt_performance()` function

**Data Flow**:
```
response_analysis + competitor_response_analysis → 
  aggregate by prompt_id → 
  prompt_performance_analysis
```

### 5. citation_domain_analysis

**Purpose**: Aggregated citation data by domain for source analysis.

**Used For**:
- Sources & Citations table
- Publisher opportunity analysis
- Authority assessment

**Key Columns**:
- `domain`: Source domain (e.g., 'techcrunch.com')
- `domain_type`: 'your-brand', 'competitor', 'industry', 'news-media', 'academic', 'reference'
- `used_percentage`: % of responses citing this domain
- `avg_citations_per_response`: Citation density
- `is_target_publisher`: High-value publishing opportunity
- `partnership_opportunity_score`: Publisher partnership value (0-100)

**Populated By**: `calculate_citation_domain_analysis()` function

**Data Flow**:
```
response_citations → aggregate by domain → citation_domain_analysis
```

## Helper Functions

### calculate_brand_performance_metrics()

```sql
SELECT calculate_brand_performance_metrics(
  p_account_id := 'uuid',
  p_brand_id := 'uuid',
  p_simulation_id := 'uuid',  -- optional
  p_period := '30d'           -- '7d', '30d', '90d', 'all'
);
```

Aggregates response analysis data into brand performance metrics for both primary brand and competitors.

### calculate_topic_brand_associations()

```sql
SELECT calculate_topic_brand_associations(
  p_account_id := 'uuid',
  p_brand_id := 'uuid',
  p_simulation_id := 'uuid',  -- optional
  p_period := '30d'
);
```

Aggregates topic insights into brand-topic associations.

### calculate_prompt_performance()

```sql
SELECT calculate_prompt_performance(
  p_account_id := 'uuid',
  p_brand_id := 'uuid',
  p_simulation_id := 'uuid',  -- optional
  p_period := '30d'
);
```

Calculates per-prompt performance metrics.

### calculate_citation_domain_analysis()

```sql
SELECT calculate_citation_domain_analysis(
  p_account_id := 'uuid',
  p_simulation_id := 'uuid',  -- optional
  p_period := '30d'
);
```

Aggregates citation data by domain.

### refresh_external_report_metrics()

**Master function** - Refreshes all analytics tables at once:

```sql
SELECT refresh_external_report_metrics(
  p_account_id := 'uuid',
  p_brand_id := 'uuid',
  p_simulation_id := 'uuid'  -- optional
);
```

This function:
1. Refreshes brand performance for 7d, 30d, 90d periods
2. Refreshes topic-brand associations
3. Refreshes prompt performance
4. Refreshes citation domain analysis
5. Refreshes materialized views

## Report Component Mapping

### Stats Cards (5 metrics)
**Data Source**: `brand_performance_metrics` (WHERE is_primary_brand = true AND metric_period = '30d')

```sql
SELECT 
  mention_rate,           -- "Mention Rate"
  avg_sentiment_score,    -- "Avg Sentiment"
  avg_ranking_position,   -- "Avg Ranking"
  total_citations,        -- "Total Citations"
  lvi_score              -- "LVI Score"
FROM brand_performance_metrics
WHERE brand_id = ? AND is_primary_brand = true AND metric_period = '30d';
```

### LVI Trend Chart
**Data Source**: `brand_metrics_timeseries`

```sql
SELECT 
  snapshot_date as date,
  lvi_score as lvi
FROM brand_metrics_timeseries
WHERE brand_id = ? 
  AND snapshot_date >= NOW() - INTERVAL '30 days'
ORDER BY snapshot_date ASC;
```

### Industry Rankings Table
**Data Source**: `brand_performance_metrics` (all brands + competitors)

```sql
SELECT 
  brand_name,
  is_primary_brand as "isYourBrand",
  industry_rank as position,
  rank_change as "positionChange",
  avg_sentiment_score as sentiment,
  sentiment_change as "sentimentChange",
  mention_rate as visibility,
  mention_rate_change as "visibilityChange"
FROM brand_performance_metrics
WHERE account_id = ? AND metric_period = '30d'
ORDER BY industry_rank ASC;
```

### Brand-Topic Heatmap
**Data Source**: `topic_brand_associations`

```sql
SELECT 
  brand_name as brand,
  is_primary_brand as "isYourBrand",
  jsonb_object_agg(topic_name, relevance_score) as topics
FROM topic_brand_associations
WHERE account_id = ? AND metric_period = '30d'
GROUP BY brand_name, is_primary_brand;
```

### Prompt-by-Prompt Analysis
**Data Source**: `prompt_performance_analysis`

```sql
SELECT 
  prompt_text as "promptText",
  prompt_id as "promptKey",
  total_responses,
  primary_brand_mentioned,
  primary_brand_mention_rate,
  primary_brand_avg_position,
  primary_brand_sentiment,
  top_competitor_name,
  is_opportunity,
  is_strength,
  is_threat,
  opportunity_score,
  model_performance -- JSONB with per-model breakdown
FROM prompt_performance_analysis
WHERE account_id = ? AND primary_brand_id = ?
ORDER BY opportunity_score DESC, primary_brand_lvi DESC;
```

### Sources & Citations Table
**Data Source**: `citation_domain_analysis`

```sql
SELECT 
  domain,
  domain_type as type,
  used_percentage as "usedPercentage",
  avg_citations_per_response as "avgCitations",
  is_target_publisher as "isTargetPublisher",
  partnership_opportunity_score
FROM citation_domain_analysis
WHERE account_id = ? AND metric_period = '30d'
ORDER BY used_percentage DESC
LIMIT 10;
```

## Data Update Strategy

### Option 1: Trigger-Based (Real-time)
Create triggers on `response_analysis` table to update metrics on insert:

```sql
CREATE TRIGGER update_metrics_on_analysis
  AFTER INSERT ON response_analysis
  FOR EACH ROW
  EXECUTE FUNCTION refresh_external_report_metrics_for_response();
```

**Pros**: Always up-to-date
**Cons**: Performance overhead on analysis insert

### Option 2: Scheduled Jobs (Recommended)
Use pg_cron or external scheduler to refresh metrics periodically:

```sql
-- Refresh every hour
SELECT cron.schedule(
  'refresh-report-metrics',
  '0 * * * *',  -- Every hour
  $$SELECT refresh_external_report_metrics(account_id, brand_id, simulation_id)
    FROM (SELECT DISTINCT account_id, brand_id, simulation_id FROM response_analysis WHERE analyzed_at > NOW() - INTERVAL '1 hour') t$$
);
```

**Pros**: Better performance, controlled resource usage
**Cons**: Up to 1 hour delay

### Option 3: On-Demand (API endpoint)
Call refresh function when report is requested:

```typescript
// API endpoint
app.post('/api/reports/:id/refresh-metrics', async (req, res) => {
  const { accountId, brandId, simulationId } = req.body
  await supabase.rpc('refresh_external_report_metrics', {
    p_account_id: accountId,
    p_brand_id: brandId,
    p_simulation_id: simulationId
  })
  res.json({ success: true })
})
```

**Pros**: Guaranteed fresh data when needed
**Cons**: Slower report loading

## Migration Instructions

### 1. Run Migration

```bash
cd /Users/danny_1/_PROJECTS_/Soma\ AI/soma-geo

# Option A: Run master migration (includes all files)
PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/00_master_migration.sql

# Option B: Run individual files
for f in supabase/migrations/external-report-schema/*.sql; do
  echo "Running $f..."
  PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
    "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
    -f "$f"
done
```

### 2. Initial Data Population

After migration, populate tables with existing data:

```sql
-- For each brand in your system
SELECT refresh_external_report_metrics(
  p_account_id := '...your-account-id...',
  p_brand_id := '...your-brand-id...',
  p_simulation_id := NULL  -- or specific simulation
);
```

### 3. Verify Data

```sql
-- Check brand performance metrics
SELECT * FROM brand_performance_metrics LIMIT 10;

-- Check topic associations
SELECT * FROM topic_brand_associations LIMIT 10;

-- Check prompt performance
SELECT * FROM prompt_performance_analysis LIMIT 10;

-- Check citation analysis
SELECT * FROM citation_domain_analysis LIMIT 10;
```

## Performance Considerations

### Indexes
All tables have comprehensive indexes on:
- Foreign keys (account_id, brand_id, simulation_id, etc.)
- Filter columns (metric_period, is_primary_brand, etc.)
- Sort columns (lvi_score, mention_rate, etc.)
- JSONB columns (using GIN indexes)

### Materialized Views
`brand_metrics_latest` materialized view provides fast access to current metrics without scanning full time-series.

Refresh periodically:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY brand_metrics_latest;
```

### Query Optimization Tips

1. **Always filter by account_id** - Uses partition-friendly index
2. **Use metric_period** - Pre-aggregated data, no date math needed
3. **Leverage is_primary_brand** - Quickly separate your brand from competitors
4. **Use JSONB operators carefully** - Index-backed queries like `@>` and `?` are fast

## Future Enhancements

### 1. Partitioning
For high-volume accounts, partition time-series tables by date:

```sql
CREATE TABLE brand_metrics_timeseries_2024_01 
  PARTITION OF brand_metrics_timeseries
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. Incremental Aggregation
Instead of full recalculation, update only changed data:

```sql
-- Track last aggregation timestamp
ALTER TABLE brand_performance_metrics 
  ADD COLUMN last_included_response_at TIMESTAMP WITH TIME ZONE;

-- Aggregate only new responses
UPDATE brand_performance_metrics
SET total_mentions = total_mentions + (
  SELECT COUNT(*) FROM response_analysis 
  WHERE analyzed_at > last_included_response_at
);
```

### 3. Real-time Aggregation with Materialized Views

```sql
CREATE MATERIALIZED VIEW brand_performance_realtime AS
SELECT 
  brand_id,
  COUNT(*) FILTER (WHERE primary_brand_mentions > 0) as mentions,
  AVG(primary_brand_sentiment) as avg_sentiment
FROM response_analysis
WHERE analyzed_at > NOW() - INTERVAL '1 hour'
GROUP BY brand_id;

-- Auto-refresh every 5 minutes
SELECT cron.schedule('refresh-realtime-metrics', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY brand_performance_realtime');
```

## Troubleshooting

### Metrics Not Updating
```sql
-- Check if aggregation functions are running
SELECT * FROM pg_stat_user_functions 
WHERE funcname LIKE 'calculate_%';

-- Manually trigger refresh
SELECT refresh_external_report_metrics(
  p_account_id := '...',
  p_brand_id := '...',
  p_simulation_id := NULL
);
```

### Slow Queries
```sql
-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN (
  'brand_performance_metrics',
  'topic_brand_associations',
  'brand_metrics_timeseries',
  'prompt_performance_analysis',
  'citation_domain_analysis'
);

-- Analyze tables
ANALYZE brand_performance_metrics;
ANALYZE topic_brand_associations;
-- etc.
```

### Data Quality Issues
```sql
-- Check data completeness scores
SELECT 
  AVG(data_quality_score) as avg_quality,
  MIN(data_quality_score) as min_quality
FROM brand_performance_metrics;

-- Check sample sizes
SELECT 
  metric_period,
  AVG(sample_size) as avg_sample_size
FROM brand_performance_metrics
GROUP BY metric_period;
```

## Support

For questions or issues:
1. Check this README first
2. Review table comments: `\d+ table_name` in psql
3. Review function comments: `\df+ function_name` in psql
4. Check migration logs for errors
