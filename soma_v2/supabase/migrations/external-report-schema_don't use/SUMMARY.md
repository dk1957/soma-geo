# External Report Schema - Implementation Summary

## 📦 What Was Created

A complete database schema to power the external brand visibility report with 5 new aggregated tables, helper functions, and comprehensive documentation.

### Directory Structure
```
supabase/migrations/external-report-schema/
├── 00_master_migration.sql          # Master file that runs all migrations
├── 01_brand_performance_metrics.sql # Aggregated brand metrics
├── 02_topic_brand_associations.sql  # Topic-brand heatmap data
├── 03_brand_metrics_timeseries.sql  # Time-series for trend charts
├── 04_prompt_performance_analysis.sql # Per-prompt competitive analysis
├── 05_citation_domain_analysis.sql  # Source/citation analysis
├── 06_helper_functions.sql          # Aggregation functions
├── README.md                        # Complete documentation
├── QUERY_REFERENCE.sql              # Ready-to-use SQL queries
└── SUMMARY.md                       # This file
```

## 🎯 Tables Created

### 1. `brand_performance_metrics`
**Purpose**: Overall brand & competitor performance metrics

**Key Features**:
- Tracks both primary brand and competitors in same table
- Multiple time periods (7d, 30d, 90d, all)
- LVI score calculation components
- Trend indicators (deltas from previous period)
- Industry rankings

**Used For**: Stats cards, industry rankings, competitive benchmarking

### 2. `topic_brand_associations`
**Purpose**: Topic-brand relationship data

**Key Features**:
- Topic relevance scores per brand
- Co-occurrence rates
- Competitive advantage scoring
- Sample contexts for UI

**Used For**: Brand-topic heatmap, content gap analysis

### 3. `brand_metrics_timeseries`
**Purpose**: Daily snapshots for trend visualization

**Key Features**:
- Daily/hourly granularity
- Delta calculations
- Materialized view for latest metrics
- Efficient time-series queries

**Used For**: LVI trend chart, analytics chart

### 4. `prompt_performance_analysis`
**Purpose**: Per-prompt competitive breakdown

**Key Features**:
- Primary brand vs competitor performance
- Opportunity/threat/strength classification
- Model-by-model breakdown (JSONB)
- Strategic priority scoring
- Action recommendations

**Used For**: Prompt-by-prompt analysis section

### 5. `citation_domain_analysis`
**Purpose**: Source/publisher citation metrics

**Key Features**:
- Domain classification (your-brand, competitor, industry, news-media, etc.)
- Usage percentages
- Authority/trust scoring
- Partnership opportunity scoring

**Used For**: Sources & citations table, publisher opportunities

## 🔧 Helper Functions

### Core Functions
1. **`calculate_brand_performance_metrics()`** - Aggregates response analysis data
2. **`calculate_topic_brand_associations()`** - Aggregates topic insights
3. **`calculate_prompt_performance()`** - Per-prompt metrics
4. **`calculate_citation_domain_analysis()`** - Citation aggregation
5. **`refresh_external_report_metrics()`** - Master refresh function

### Usage Example
```sql
-- Refresh all metrics for a brand
SELECT refresh_external_report_metrics(
  p_account_id := 'your-account-uuid',
  p_brand_id := 'your-brand-uuid',
  p_simulation_id := NULL  -- or specific simulation UUID
);
```

## 📊 Report Component Mapping

| Report Section | Data Source Table | Key Metrics |
|---------------|-------------------|-------------|
| **Stats Cards** | `brand_performance_metrics` | mention_rate, avg_sentiment, avg_ranking, total_citations, lvi_score |
| **LVI Trend Chart** | `brand_metrics_timeseries` | lvi_score by date |
| **Industry Rankings** | `brand_performance_metrics` | All brands + competitors ranked |
| **Topic Heatmap** | `topic_brand_associations` | relevance_score by brand×topic |
| **Prompt Analysis** | `prompt_performance_analysis` | Per-prompt competitive metrics |
| **Sources Table** | `citation_domain_analysis` | Domain citations & usage % |
| **Insights** | All tables | Computed from multiple sources |

## 🚀 Next Steps

### 1. Run Migration
```bash
cd "/Users/danny_1/_PROJECTS_/Soma AI/soma-geo"

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/01_brand_performance_metrics.sql

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/02_topic_brand_associations.sql

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/03_brand_metrics_timeseries.sql

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/04_prompt_performance_analysis.sql

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/05_citation_domain_analysis.sql

PGPASSWORD='mnCNLEEAeaYlNCs6' psql \
  "postgres://postgres.tndkhcfpcxzgfhnoqzbk@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f supabase/migrations/external-report-schema/06_helper_functions.sql
```

### 2. Initial Data Population
After migration, populate with existing data:

```sql
-- For each brand/account in your system
SELECT refresh_external_report_metrics(
  p_account_id := '<account-uuid>',
  p_brand_id := '<brand-uuid>',
  p_simulation_id := NULL
);
```

### 3. Verify Tables
```sql
-- Check tables exist
\dt *performance_metrics*
\dt *topic_brand*
\dt *timeseries*
\dt *prompt_performance*
\dt *citation_domain*

-- Check data
SELECT COUNT(*) FROM brand_performance_metrics;
SELECT COUNT(*) FROM topic_brand_associations;
SELECT COUNT(*) FROM prompt_performance_analysis;
```

### 4. Update TypeScript/API Code
Reference `QUERY_REFERENCE.sql` for ready-to-use queries to integrate into your API endpoints and components.

### 5. Set Up Scheduled Refresh
Choose one approach:

**Option A: pg_cron (recommended)**
```sql
SELECT cron.schedule(
  'refresh-report-metrics-hourly',
  '0 * * * *',  -- Every hour
  $$
  SELECT refresh_external_report_metrics(account_id, brand_id, simulation_id)
  FROM (
    SELECT DISTINCT ra.account_id, ra.brand_id, ra.simulation_id 
    FROM response_analysis ra
    WHERE ra.analyzed_at > NOW() - INTERVAL '1 hour'
  ) t;
  $$
);
```

**Option B: API endpoint**
```typescript
// Call this after analysis completes
app.post('/api/reports/:id/refresh-metrics', async (req, res) => {
  await supabase.rpc('refresh_external_report_metrics', {
    p_account_id: accountId,
    p_brand_id: brandId,
    p_simulation_id: simulationId
  })
})
```

## 💡 Key Design Decisions

### 1. Unified Brand/Competitor Tables
Instead of separate tables for brand and competitors, we use a single table with:
- `is_primary_brand` boolean flag
- `competitor_id` nullable FK

**Benefits**:
- Easier queries for rankings (no UNION needed)
- Consistent metrics calculation
- Single source of truth

### 2. Pre-Aggregated Periods
Tables store pre-calculated metrics for common periods (7d, 30d, 90d):
- Faster queries (no date math)
- Consistent period definitions
- Easy to add new periods

### 3. JSONB for Flexible Data
Using JSONB for:
- `model_performance` - Per-model breakdown
- `topic_relevance` - Dynamic topic lists
- `sample_contexts` - Example content

**Benefits**:
- Schema flexibility
- Rich nested data
- GIN indexes for performance

### 4. Separation of Concerns
- **Raw data** → `llm_simulation_responses`, `response_analysis`
- **Aggregated metrics** → New tables (this schema)
- **Presentation** → React components

**Benefits**:
- Clean architecture
- Easy to rebuild aggregations
- API queries stay simple

## 📈 Performance Characteristics

### Table Sizes (Estimated)
- `brand_performance_metrics`: ~100 rows per brand (periods × competitors)
- `topic_brand_associations`: ~500 rows per brand (topics × brands × periods)
- `brand_metrics_timeseries`: ~30 rows per brand per month (daily snapshots)
- `prompt_performance_analysis`: ~50 rows per brand (prompts × periods)
- `citation_domain_analysis`: ~100 rows per account (domains × periods)

### Query Performance
All queries optimized with:
- ✅ Indexes on all foreign keys
- ✅ Indexes on filter columns (period, is_primary_brand)
- ✅ Indexes on sort columns (lvi_score, mention_rate)
- ✅ GIN indexes on JSONB columns
- ✅ Materialized view for latest metrics

Expected query times:
- Stats cards: <10ms
- Rankings table: <50ms
- Heatmap: <100ms
- Prompt analysis: <200ms

## 🔍 Data Flow

```
1. Simulation runs
   ↓
2. Raw responses stored in llm_simulation_responses
   ↓
3. Analysis job runs (existing)
   ↓
4. response_analysis & competitor_response_analysis populated
   ↓
5. Aggregation functions run (NEW - via cron or trigger)
   ↓
6. New analytics tables populated (NEW)
   ↓
7. External report queries these tables
```

## 🛠️ Maintenance

### Daily Tasks
- Monitor aggregation job completion
- Check data quality scores
- Verify timeseries continuity

### Weekly Tasks
- Refresh materialized views
- Analyze tables for query optimization
- Review slow query logs

### Monthly Tasks
- Archive old snapshots (optional)
- Reindex tables if needed
- Review and update opportunity scores

## 📚 Documentation Files

1. **README.md** - Complete schema documentation, migration guide, troubleshooting
2. **QUERY_REFERENCE.sql** - Ready-to-use SQL queries for each report section
3. **SUMMARY.md** - This file, high-level overview

## 🎓 Learning Resources

### Understanding the Schema
1. Read `README.md` for architecture overview
2. Review table comments: `\d+ brand_performance_metrics` in psql
3. Check function comments: `\df+ calculate_brand_performance_metrics`

### Writing Queries
1. Start with `QUERY_REFERENCE.sql` examples
2. Test queries in psql with real data
3. Use EXPLAIN ANALYZE to check performance

### Debugging
1. Check aggregation function execution: `SELECT * FROM pg_stat_user_functions WHERE funcname LIKE 'calculate_%'`
2. Verify data completeness: `SELECT AVG(data_quality_score) FROM brand_performance_metrics`
3. Check for missing data: `SELECT * FROM brand_performance_metrics WHERE sample_size = 0`

## ✅ Verification Checklist

After migration, verify:
- [ ] All 5 tables created successfully
- [ ] All indexes created (check with `\di` in psql)
- [ ] All functions created (check with `\df`)
- [ ] RLS policies active (check with `\drls`)
- [ ] Materialized view created
- [ ] Helper functions execute without errors
- [ ] Sample queries return expected results
- [ ] Data populated in all tables

## 🚨 Common Issues

### Issue: Functions fail with permission errors
**Solution**: Ensure service role has execution permissions

### Issue: Metrics not updating
**Solution**: Check if aggregation job is running, manually trigger refresh

### Issue: Slow queries
**Solution**: Run ANALYZE on tables, verify indexes exist

### Issue: Missing competitor data
**Solution**: Ensure competitors table is populated, check competitor_id FK

## 📞 Support

For issues or questions:
1. Check README.md troubleshooting section
2. Review QUERY_REFERENCE.sql for examples
3. Verify table structure with `\d+ table_name`
4. Check function definitions with `\df+ function_name`

---

**Created**: 2025-01-17
**Schema Version**: 1.0.0
**Compatible With**: external-brand-visibility-report-v4.tsx
