# Implementation Checklist

## ✅ Schema Design Complete

### Files Created
- [x] 01_brand_performance_metrics.sql
- [x] 02_topic_brand_associations.sql
- [x] 03_brand_metrics_timeseries.sql
- [x] 04_prompt_performance_analysis.sql
- [x] 05_citation_domain_analysis.sql
- [x] 06_helper_functions.sql
- [x] 00_master_migration.sql (orchestrator)
- [x] README.md (complete documentation)
- [x] QUERY_REFERENCE.sql (ready-to-use queries)
- [x] SUMMARY.md (high-level overview)
- [x] ARCHITECTURE.md (visual diagrams)

## 🚀 Next Steps for Implementation

### Phase 1: Database Migration (30 minutes)
- [ ] Run migrations in order:
  ```bash
  cd "/Users/danny_1/_PROJECTS_/Soma AI/soma-geo"
  
  # Run each migration file
  PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
    "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
    -f supabase/migrations/external-report-schema/01_brand_performance_metrics.sql
  
  # Repeat for 02, 03, 04, 05, 06
  ```

- [ ] Verify tables created:
  ```sql
  \dt *performance_metrics*
  \dt *topic_brand*
  \dt *timeseries*
  \dt *prompt_performance*
  \dt *citation_domain*
  ```

- [ ] Verify functions created:
  ```sql
  \df calculate_*
  \df refresh_*
  ```

### Phase 2: Initial Data Population (1 hour)
- [ ] Identify all active brands/accounts:
  ```sql
  SELECT id, name FROM brands WHERE deleted_at IS NULL;
  SELECT id, name FROM accounts;
  ```

- [ ] Run initial aggregation for each brand:
  ```sql
  -- For each brand
  SELECT refresh_external_report_metrics(
    p_account_id := '<account-uuid>',
    p_brand_id := '<brand-uuid>',
    p_simulation_id := NULL
  );
  ```

- [ ] Verify data populated:
  ```sql
  SELECT COUNT(*) FROM brand_performance_metrics;
  SELECT COUNT(*) FROM topic_brand_associations;
  SELECT COUNT(*) FROM prompt_performance_analysis;
  SELECT COUNT(*) FROM citation_domain_analysis;
  ```

### Phase 3: API Integration (2-3 hours)
- [ ] Create API endpoint for report data:
  ```typescript
  // app/api/reports/[id]/metrics/route.ts
  export async function GET(req, { params }) {
    const { accountId, brandId, period } = params
    
    // Query using QUERY_REFERENCE.sql examples
    const { data } = await supabase
      .from('brand_performance_metrics')
      .select('*')
      .eq('account_id', accountId)
      .eq('brand_id', brandId)
      .eq('is_primary_brand', true)
      .eq('metric_period', period)
      .single()
    
    return Response.json(data)
  }
  ```

- [ ] Create helper functions/hooks:
  ```typescript
  // lib/hooks/useExternalReportData.ts
  export function useExternalReportData(reportId: string) {
    // Fetch all report sections
    return useSWR(`/api/reports/${reportId}/metrics`, fetcher)
  }
  ```

- [ ] Update external-brand-visibility-report-v4.tsx to use real data:
  - [ ] Replace mock data in Stats Cards
  - [ ] Replace mock data in Industry Rankings
  - [ ] Replace mock data in Topic Heatmap
  - [ ] Replace mock data in Prompt Analysis
  - [ ] Replace mock data in Citations Table

### Phase 4: Scheduled Refresh Setup (1 hour)
Choose one approach:

#### Option A: pg_cron (Recommended)
- [ ] Install pg_cron extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```

- [ ] Schedule hourly refresh:
  ```sql
  SELECT cron.schedule(
    'refresh-external-report-metrics',
    '0 * * * *',  -- Every hour
    $$
    SELECT refresh_external_report_metrics(
      account_id, 
      brand_id, 
      simulation_id
    )
    FROM (
      SELECT DISTINCT 
        ra.account_id, 
        ra.brand_id, 
        ra.simulation_id 
      FROM response_analysis ra
      WHERE ra.analyzed_at > NOW() - INTERVAL '1 hour'
    ) t;
    $$
  );
  ```

#### Option B: API Endpoint + External Scheduler
- [ ] Create refresh endpoint:
  ```typescript
  // app/api/reports/refresh/route.ts
  export async function POST(req: Request) {
    const { accountId, brandId, simulationId } = await req.json()
    
    const { data, error } = await supabase.rpc(
      'refresh_external_report_metrics',
      {
        p_account_id: accountId,
        p_brand_id: brandId,
        p_simulation_id: simulationId
      }
    )
    
    if (error) throw error
    return Response.json({ success: true })
  }
  ```

- [ ] Set up Vercel Cron or external scheduler:
  ```typescript
  // vercel.json
  {
    "crons": [{
      "path": "/api/reports/refresh",
      "schedule": "0 * * * *"
    }]
  }
  ```

#### Option C: Trigger-Based (Real-time)
- [ ] Create trigger function:
  ```sql
  CREATE OR REPLACE FUNCTION refresh_metrics_on_analysis()
  RETURNS TRIGGER AS $$
  BEGIN
    PERFORM refresh_external_report_metrics(
      NEW.account_id,
      NEW.brand_id,
      NEW.simulation_id
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER update_metrics_after_analysis
    AFTER INSERT ON response_analysis
    FOR EACH ROW
    EXECUTE FUNCTION refresh_metrics_on_analysis();
  ```

### Phase 5: Testing (2 hours)
- [ ] Test each report section with real data:
  - [ ] Stats Cards show correct metrics
  - [ ] LVI Trend Chart displays properly
  - [ ] Industry Rankings include all competitors
  - [ ] Topic Heatmap renders correctly
  - [ ] Prompt Analysis shows opportunities/threats
  - [ ] Citations Table lists top sources

- [ ] Test filtering:
  - [ ] Date range filters work
  - [ ] Period switching (7d/30d/90d)
  - [ ] Model filtering

- [ ] Test performance:
  - [ ] Report loads in < 2 seconds
  - [ ] Queries complete in < 500ms
  - [ ] No N+1 query issues

- [ ] Test edge cases:
  - [ ] Brand with no data
  - [ ] Brand with only competitor data
  - [ ] Very large datasets
  - [ ] Missing/null values

### Phase 6: Monitoring & Optimization (Ongoing)
- [ ] Set up monitoring:
  ```sql
  -- Create monitoring view
  CREATE VIEW metrics_freshness AS
  SELECT 
    metric_period,
    MAX(updated_at) as last_updated,
    COUNT(*) as total_records,
    AVG(data_quality_score) as avg_quality
  FROM brand_performance_metrics
  GROUP BY metric_period;
  ```

- [ ] Create alerting for stale data:
  ```typescript
  // Check if metrics are stale (> 2 hours old)
  const { data } = await supabase
    .from('brand_performance_metrics')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
  
  const hoursOld = (Date.now() - new Date(data.updated_at)) / (1000 * 60 * 60)
  if (hoursOld > 2) {
    // Alert: metrics are stale
  }
  ```

- [ ] Review slow queries:
  ```sql
  SELECT 
    query,
    mean_exec_time,
    calls
  FROM pg_stat_statements
  WHERE query LIKE '%brand_performance_metrics%'
  ORDER BY mean_exec_time DESC
  LIMIT 10;
  ```

- [ ] Optimize as needed:
  - [ ] Add missing indexes
  - [ ] Partition large tables
  - [ ] Create additional materialized views
  - [ ] Adjust aggregation frequency

## 📊 Success Metrics

After implementation, verify:
- [ ] Report loads in < 2 seconds
- [ ] All sections populated with real data
- [ ] Metrics update within 1 hour of new analysis
- [ ] No missing data or null values
- [ ] Data quality score > 0.95
- [ ] User feedback is positive

## 🐛 Troubleshooting Guide

### Issue: Migrations fail
**Check**:
- PostgreSQL version compatibility
- User permissions
- Existing table conflicts

**Fix**:
```sql
-- Drop and recreate if needed
DROP TABLE IF EXISTS brand_performance_metrics CASCADE;
-- Then re-run migration
```

### Issue: Metrics not populating
**Check**:
- Response analysis data exists
- Functions execute without errors
- RLS policies allow access

**Fix**:
```sql
-- Manually trigger refresh
SELECT refresh_external_report_metrics(
  '<account-id>', 
  '<brand-id>', 
  NULL
);

-- Check for errors
SELECT * FROM pg_stat_user_functions 
WHERE funcname LIKE 'calculate_%';
```

### Issue: Slow queries
**Check**:
- Missing indexes
- Table statistics
- Query plan

**Fix**:
```sql
-- Analyze tables
ANALYZE brand_performance_metrics;
ANALYZE topic_brand_associations;

-- Check missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN (
  'brand_performance_metrics',
  'topic_brand_associations'
);

-- View query plan
EXPLAIN ANALYZE
SELECT * FROM brand_performance_metrics
WHERE account_id = '...';
```

### Issue: Data quality low
**Check**:
- Sample sizes
- Completeness scores
- Missing source data

**Fix**:
```sql
-- Check data quality
SELECT 
  metric_period,
  AVG(data_quality_score) as avg_quality,
  MIN(sample_size) as min_sample
FROM brand_performance_metrics
GROUP BY metric_period;

-- Investigate low quality records
SELECT * FROM brand_performance_metrics
WHERE data_quality_score < 0.8;
```

## 📞 Support Resources

- **README.md** - Complete documentation
- **QUERY_REFERENCE.sql** - SQL query examples
- **ARCHITECTURE.md** - Visual diagrams
- **SUMMARY.md** - Quick reference

## 🎯 Timeline Estimate

| Phase | Time | Dependencies |
|-------|------|--------------|
| Database Migration | 30 min | PostgreSQL access |
| Initial Data Population | 1 hour | Existing response data |
| API Integration | 2-3 hours | TypeScript/React knowledge |
| Scheduled Refresh | 1 hour | pg_cron or scheduler |
| Testing | 2 hours | Complete API integration |
| Monitoring Setup | 1 hour | Logging infrastructure |
| **Total** | **7-9 hours** | |

## ✨ Future Enhancements

- [ ] Real-time websocket updates for live metrics
- [ ] Export report as PDF
- [ ] Email digest of weekly/monthly changes
- [ ] Predictive analytics (trend forecasting)
- [ ] Automated content recommendations
- [ ] Competitor alert system
- [ ] A/B testing different prompts
- [ ] Integration with Google Analytics
- [ ] Custom dashboard builder
