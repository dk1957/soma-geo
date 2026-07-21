# Multiple Daily Analysis Runs - Quick Reference

## Problem Solved

You can now run response analysis **multiple times per day** on the same or new responses. The system stores ALL runs and provides tools to:
1. Get the **latest** metrics for any date
2. Get **aggregated** (averaged) metrics per date
3. Track which analyses ran together (batch tracking)

## Key Changes

### 1. Removed Unique Constraints
- No more "duplicate key value violates unique constraint" errors
- Each run creates new records with unique UUIDs
- Multiple runs per day are fully supported

### 2. New Tracking Columns
- `analysis_run_timestamp`: Exact time when analysis ran
- `analysis_batch_id`: Groups analyses that ran together

### 3. New Views for Easy Querying

#### `brand_daily_analysis_latest`
Shows the **most recent** analysis for each brand/date:
```sql
SELECT * FROM brand_daily_analysis_latest
WHERE brand_id = 'your-uuid'
  AND analysis_date = CURRENT_DATE;
```

#### `brand_daily_analysis_aggregated`
Shows **averaged** metrics from all runs per date:
```sql
SELECT * FROM brand_daily_analysis_aggregated
WHERE brand_id = 'your-uuid'
  AND analysis_date >= CURRENT_DATE - 30;
```

## Usage Examples

### Running Analysis Multiple Times

```sql
-- Run 1: Morning analysis (9 AM)
SELECT calculate_brand_daily_metrics(
  'account-uuid',
  'brand-uuid',
  CURRENT_DATE,
  NULL  -- simulation_id
);
-- Returns: batch_id_1

-- Run 2: Afternoon analysis (3 PM) - adds more data
SELECT calculate_brand_daily_metrics(
  'account-uuid',
  'brand-uuid',
  CURRENT_DATE,
  NULL
);
-- Returns: batch_id_2

-- Run 3: Evening analysis (9 PM) - even more data
SELECT calculate_brand_daily_metrics(
  'account-uuid',
  'brand-uuid',
  CURRENT_DATE,
  NULL
);
-- Returns: batch_id_3

-- All three runs are stored!
```

### Querying Latest Data (For Reports)

```sql
-- Get latest metrics for today
SELECT 
  brand_name,
  is_primary_brand,
  lvi_score,
  mention_rate,
  avg_position,
  avg_sentiment,
  share_of_voice,
  analysis_run_timestamp
FROM brand_daily_analysis_latest
WHERE brand_id = 'your-uuid'
  AND analysis_date = CURRENT_DATE
ORDER BY is_primary_brand DESC;

-- Using helper function
SELECT * FROM get_latest_brand_metrics(
  'brand-uuid',
  CURRENT_DATE,
  NULL  -- simulation_id
);
```

### Querying Aggregated Time Series

```sql
-- Get averaged metrics for last 30 days
SELECT 
  analysis_date,
  brand_name,
  is_primary_brand,
  avg_lvi_score,
  avg_mention_rate,
  avg_sentiment,
  analysis_run_count  -- Shows how many runs per day
FROM brand_daily_analysis_aggregated
WHERE brand_id = 'your-uuid'
  AND analysis_date >= CURRENT_DATE - 30
ORDER BY analysis_date DESC;

-- Using helper function
SELECT * FROM get_aggregated_brand_metrics(
  'brand-uuid',
  CURRENT_DATE - 30,
  CURRENT_DATE,
  NULL  -- simulation_id
);
```

### Querying Specific Batch

```sql
-- See all analyses from a specific batch
SELECT 
  brand_name,
  is_primary_brand,
  lvi_score,
  mention_rate,
  analysis_run_timestamp
FROM brand_daily_analysis
WHERE analysis_batch_id = 'batch-uuid'
ORDER BY is_primary_brand DESC;
```

### Comparing Multiple Runs

```sql
-- See how metrics changed across runs today
SELECT 
  analysis_run_timestamp,
  brand_name,
  is_primary_brand,
  lvi_score,
  mention_rate,
  total_mentions,
  sample_size
FROM brand_daily_analysis
WHERE brand_id = 'your-uuid'
  AND analysis_date = CURRENT_DATE
ORDER BY analysis_run_timestamp DESC;
```

## API Integration

### Run Analysis Endpoint

```typescript
// POST /api/brands/:brandId/analyze-daily
export async function POST(request: Request) {
  const { brandId } = params
  const { analysisDate, simulationId } = await request.json()
  
  const { data: batchId } = await supabase.rpc(
    'calculate_brand_daily_metrics',
    {
      p_account_id: accountId,
      p_brand_id: brandId,
      p_analysis_date: analysisDate || new Date().toISOString().split('T')[0],
      p_simulation_id: simulationId || null,
      p_analysis_batch_id: null  // Auto-generates
    }
  )
  
  return Response.json({ 
    success: true, 
    batchId,
    message: 'Analysis completed successfully'
  })
}
```

### Get Latest Metrics Endpoint

```typescript
// GET /api/brands/:brandId/metrics/latest?date=2025-11-09
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const { data: metrics } = await supabase
    .from('brand_daily_analysis_latest')
    .select('*')
    .eq('brand_id', brandId)
    .eq('analysis_date', date)
    .order('is_primary_brand', { ascending: false })
  
  return Response.json({ metrics })
}
```

### Get Time Series Endpoint

```typescript
// GET /api/brands/:brandId/metrics/timeseries?days=30
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data: timeseries } = await supabase
    .from('brand_daily_analysis_aggregated')
    .select('*')
    .eq('brand_id', brandId)
    .gte('analysis_date', startDate.toISOString().split('T')[0])
    .order('analysis_date', { ascending: true })
  
  return Response.json({ timeseries })
}
```

## Frontend Integration

### Fetching Data for Reports

```typescript
// hooks/use-brand-metrics.ts
export function useBrandMetrics(brandId: string, date: string) {
  return useQuery({
    queryKey: ['brand-metrics', brandId, date],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/metrics/latest?date=${date}`)
      return res.json()
    }
  })
}

export function useBrandTimeseries(brandId: string, days: number = 30) {
  return useQuery({
    queryKey: ['brand-timeseries', brandId, days],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/metrics/timeseries?days=${days}`)
      return res.json()
    }
  })
}
```

### Using in Components

```tsx
function BrandDashboard({ brandId }: { brandId: string }) {
  const today = new Date().toISOString().split('T')[0]
  
  // Get latest metrics for today
  const { data: todayMetrics } = useBrandMetrics(brandId, today)
  
  // Get 30-day time series
  const { data: timeseries } = useBrandTimeseries(brandId, 30)
  
  return (
    <div>
      <h2>Today's Performance</h2>
      {todayMetrics?.metrics.map(metric => (
        <StatCard
          key={metric.brand_name}
          title={metric.brand_name}
          isPrimary={metric.is_primary_brand}
          lvi={metric.lvi_score}
          mentions={metric.mention_rate}
          sentiment={metric.avg_sentiment}
        />
      ))}
      
      <h2>30-Day Trend</h2>
      <LineChart data={timeseries?.timeseries || []} />
    </div>
  )
}
```

## Data Retention & Cleanup

### Keep Last N Runs Per Date

```sql
-- Keep only last 3 runs per brand/date
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY brand_id, competitor_id, analysis_date 
      ORDER BY analysis_run_timestamp DESC
    ) as rn
  FROM brand_daily_analysis
)
DELETE FROM brand_daily_analysis
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 3
);
```

### Archive Old Runs

```sql
-- Archive runs older than 30 days (keep only latest per date)
WITH to_keep AS (
  SELECT DISTINCT ON (brand_id, competitor_id, analysis_date)
    id
  FROM brand_daily_analysis
  WHERE analysis_date >= CURRENT_DATE - 30
  ORDER BY brand_id, competitor_id, analysis_date, analysis_run_timestamp DESC
)
DELETE FROM brand_daily_analysis
WHERE analysis_date < CURRENT_DATE - 30
  AND id NOT IN (SELECT id FROM to_keep);
```

## Troubleshooting

### Check How Many Runs Per Day

```sql
SELECT 
  analysis_date,
  brand_name,
  COUNT(*) as run_count,
  MIN(analysis_run_timestamp) as first_run,
  MAX(analysis_run_timestamp) as last_run,
  MAX(sample_size) as max_sample_size
FROM brand_daily_analysis
WHERE brand_id = 'your-uuid'
  AND analysis_date >= CURRENT_DATE - 7
GROUP BY analysis_date, brand_name
ORDER BY analysis_date DESC;
```

### Verify Latest Data is Being Used

```sql
-- Compare raw table vs latest view
SELECT 'Raw Table' as source, COUNT(*) as record_count
FROM brand_daily_analysis
WHERE brand_id = 'your-uuid' AND analysis_date = CURRENT_DATE

UNION ALL

SELECT 'Latest View' as source, COUNT(*) as record_count
FROM brand_daily_analysis_latest
WHERE brand_id = 'your-uuid' AND analysis_date = CURRENT_DATE;

-- Should show: Raw Table has multiple records, Latest View has one per brand
```

### Check Batch Tracking

```sql
-- See all batches run today
SELECT DISTINCT
  analysis_batch_id,
  MIN(analysis_run_timestamp) as batch_start_time,
  COUNT(*) as brands_analyzed
FROM brand_daily_analysis
WHERE analysis_date = CURRENT_DATE
GROUP BY analysis_batch_id
ORDER BY batch_start_time DESC;
```

## Best Practices

1. **Use Views for Reports**: Always use `brand_daily_analysis_latest` or `brand_daily_analysis_aggregated` in reports
2. **Track Batches**: Pass a consistent `batch_id` when running related analyses together
3. **Monitor Run Count**: Set up alerts if too many runs per day (performance)
4. **Archive Old Runs**: Keep only recent runs to maintain performance
5. **Query Performance**: Always filter by `brand_id` and `analysis_date` for fast queries

## Summary

✅ **Multiple runs per day**: Fully supported  
✅ **Latest metrics**: Use `_latest` views  
✅ **Aggregated time series**: Use `_aggregated` views  
✅ **Batch tracking**: Use `analysis_batch_id`  
✅ **No more errors**: Unique constraints removed  
✅ **Cumulative data**: Store all runs, aggregate later
