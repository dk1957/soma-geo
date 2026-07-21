# LLM Run Report System

## Overview

The LLM Run Report System provides comprehensive analytics and insights from AI run data. It transforms raw run results into actionable business intelligence reports.

## Features

### 📊 Comprehensive Analytics
- **Brand Visibility Analysis**: Mention rates, confidence scores, and visibility trends
- **Competitor Analysis**: Share of voice, competitive positioning, and market rankings
- **AI Model Performance**: Response quality, speed, and cost analysis per model
- **Source Analysis**: Citation quality, top domains, and content relevance

### 🎯 Key Metrics
- Brand mention rate percentage
- Average confidence scores
- Competitive market position (#1, #2, etc.)
- Total citations and unique sources
- Model-specific performance benchmarks

### 💡 Actionable Insights
- Automated strength identification
- Opportunity detection
- Performance concerns flagging
- Strategic recommendations

## Architecture

### Core Components

1. **LLMRunReportService** (`/lib/services/llm-run-orchestrator.ts`)
   - Main service class for report generation
   - Handles data aggregation and analysis
   - Stores analysis results in database

2. **RunReport Component** (`/components/run-report.tsx`)
   - React component for report visualization
   - Interactive tabs for different analysis views
   - Real-time data loading and error handling

3. **API Endpoints** (`/app/api/reports/run/[runId]/route.ts`)
   - GET: Generate and return report data
   - POST: Generate and store analysis results

### Database Schema

The system reads from these main tables:
- `runs` - Run metadata (daily batch triggers)
- `llm_responses` - AI model responses with metrics
- `llm_prompts` - Input prompts used
- `llm_analysis_results` - Stored analysis results

## Usage

### 1. Generate Report via API

```typescript
// GET request to generate report
const response = await fetch(`/api/reports/run/${runId}`)
const report = await response.json()
```

### 2. Store Analysis Results

```typescript
// POST request to store analysis
await fetch(`/api/reports/run/${runId}`, { 
  method: 'POST' 
})
```

### 3. Display Report Component

```tsx
import { RunReport } from '@/components/run-report'

function MyPage() {
  return (
    <RunReport 
      runId="your-run-id"
      onReportLoaded={(data) => console.log('Report loaded:', data)}
    />
  )
}
```

## Report Structure

### Header Summary
- Brand mention rate
- Market position ranking
- Average confidence score
- Total citations count

### Key Insights
- Automated analysis with impact levels (high/medium/low)
- Categorized as: strength, opportunity, concern, recommendation
- Specific metrics and actionable descriptions

### Detailed Analytics Tabs

1. **AI Models Tab**
   - Performance by model (ChatGPT, Claude, Gemini, Perplexity)
   - Response time, cost, confidence metrics
   - Brand mention rates per model

2. **Competitors Tab**
   - Share of voice analysis
   - Competitive rankings
   - Brand positioning insights

3. **Sources Tab**
   - Top citation domains
   - Citation quality metrics
   - Source diversity analysis

4. **Visibility Tab**
   - Brand mention patterns
   - Model comparison charts
   - Detailed metrics breakdown

## Example Output

```json
{
  "run": {
    "brand_name": "Moneypoint",
    "status": "completed",
    "total_cost": 0.0125
  },
  "analytics": {
    "brandVisibility": {
      "mentionRate": 28.6,
      "totalMentions": 8,
      "averageConfidence": 0.857
    },
    "competitorAnalysis": {
      "brandRanking": 1,
      "shareOfVoice": {
        "Moneypoint": 8,
        "Kenya Airways": 18
      }
    }
  },
  "insights": [
    {
      "type": "strength",
      "title": "High Response Confidence",
      "description": "AI models show high confidence (85.7%) when mentioning your brand.",
      "impact": "medium"
    }
  ]
}
```

## Testing

### Test Page
Visit `/reports/test` to test the report generation with any run ID.

### Test Script
Run the test script to verify database connectivity:
```bash
node test-report-service.js
```

## Configuration

The service uses Supabase for data access. Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

## Performance

- Reports generate in ~1-3 seconds for typical runs
- Caching available for frequently accessed reports
- Pagination support for large datasets
- Optimized SQL queries with indexed lookups

## Integration Examples

### Dashboard Integration
```tsx
const [reportData, setReportData] = useState(null)

useEffect(() => {
  async function loadReport() {
    const response = await fetch(`/api/reports/run/${simId}`)
    const data = await response.json()
    setReportData(data)
  }
  loadReport()
}, [simId])
```

### Automated Reporting
```typescript
// Generate reports for all completed runs
const runs = await getCompletedRuns()
for (const sim of runs) {
  await reportService.generateAndStoreAnalysis(sim.id)
}
```

## Next Steps

1. **Real-time Updates**: WebSocket integration for live report updates
2. **Export Features**: PDF/Excel export functionality
3. **Comparative Analysis**: Multi-run comparison reports
4. **Predictive Analytics**: Trend analysis and forecasting
5. **Custom Metrics**: User-defined KPIs and benchmarks

---

The report system provides the foundation for comprehensive AI run analysis, transforming raw data into actionable business intelligence.