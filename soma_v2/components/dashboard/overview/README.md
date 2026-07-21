# Dashboard Overview Components

Comprehensive analytics and visualization components for the main dashboard.

## Components

### 1. Analytics Filters (`analytics-filters.tsx`) ✅ MIGRATED

Advanced filtering component with:
- Date range selection (presets: 7d, 30d, 90d + custom)
- Query type filtering (all, branded, discovery)
- AI platform multi-select (ChatGPT, Claude, Gemini, Grok, Perplexity)
- Competitor benchmark toggle and selection
- Advanced filters dialog

**Usage:**
```tsx
import { AnalyticsFilters, type FilterOptions } from '@/components/dashboard/overview'

const [filters, setFilters] = useState<FilterOptions>({
  dateRange: { from: '2024-01-01', to: '2024-01-31' },
  promptType: 'all',
  aiPlatforms: [],
  competitorBenchmark: false,
  selectedCompetitors: []
})

<AnalyticsFilters 
  filters={filters}
  onFiltersChange={setFilters}
  availableCompetitors={competitors}
/>
```

### 2. Main Dashboard Chart (`main-dashboard-chart.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/main-dashboard-chart.tsx ./
```

Primary analytics visualization with:
- Interactive line charts (Recharts)
- Multiple metrics: LVI, gSOV, mentions, sentiment, authority
- Competitor comparison with multi-line overlays
- Trend calculations and indicators
- Metric selector cards with current values
- Real-time data from `/api/analytics-dashboard`

**Size:** 611 lines | **API:** `/api/analytics-dashboard`

### 3. Recent Brand Mentions (`recent-brand-mentions.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/recent-brand-mentions.tsx ./
```

Displays recent AI chat responses mentioning the brand:
- Query and chat excerpt
- Brand rank in response
- All brands mentioned (with initials badges)
- Date stamp
- Link to full prompt analysis

**Size:** 150 lines | **API:** `/api/recent-mentions`

### 4. Sources Usage (`sources-usage.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/sources-usage.tsx ./
```

Content sources cited by AI platforms:
- Domain badges with initials
- Usage percentage bars
- Citation frequency
- Link to citations page

**Size:** 140 lines | **API:** `/api/sources-usage`

### 5. Industry Ranking (`industry-ranking.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/industry-ranking.tsx ./
```

Competitive rankings table showing:
- Overall position ranking
- LVI scores with trends
- gSOV percentages with trends
- Sentiment scores with trends
- Color-coded trend indicators

**Size:** 130 lines | **API:** `/api/analytics-dashboard`

### 6. Brand-Topic Heatmap (`brand-topic-heatmap.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/brand-topic-heatmap.tsx ./
```

Interactive heatmap showing topic mentions:
- Multi-select topic filtering
- Brand and topic search
- Color-coded intensity (orange for your brand, gray for competitors)
- Sticky brand column for horizontal scrolling
- Intensity legend with 6 levels
- Refresh functionality

**Size:** 450 lines | **API:** `/api/brand-topic-analysis`

### 7. Insights & Recommendations (`insights-recommendations.tsx`) ⏳ PENDING

**To migrate:** Copy from frontend using:
```bash
cp ../frontend/components/dashboard/overview/insights-recommendations.tsx ./
```

AI-powered strategic insights:
- Grouped by priority (high/medium/low)
- Type-based styling (success/opportunity/warning/action)
- Impact metrics with trend indicators
- Action items
- Empty state handling

**Size:** 280 lines | **API:** `/api/insights`

## Quick Migration

To migrate all pending components at once:

```bash
cd /Users/danny_1/_PROJECTS_/Soma AI/soma-geo/components/dashboard/overview

# Copy all remaining components
cp ../../../frontend/components/dashboard/overview/main-dashboard-chart.tsx ./
cp ../../../frontend/components/dashboard/overview/recent-brand-mentions.tsx ./
cp ../../../frontend/components/dashboard/overview/sources-usage.tsx ./
cp ../../../frontend/components/dashboard/overview/industry-ranking.tsx ./
cp ../../../frontend/components/dashboard/overview/brand-topic-heatmap.tsx ./
cp ../../../frontend/components/dashboard/overview/insights-recommendations.tsx ./
```

**Note:** These components are production-ready and require NO modifications. They already:
- Use soma-geo's API endpoints
- Have proper fallback to mock data
- Include comprehensive JSDoc documentation
- Support all required features

## API Endpoints

All components are designed to work with soma-geo's existing API structure:

| Component | Endpoint | Method | Query Params |
|-----------|----------|--------|--------------|
| Main Chart | `/api/analytics-dashboard` | GET | `brandId`, `startDate`, `endDate`, `includeCompetitors` |
| Mentions | `/api/recent-mentions` | GET | `brandId`, `limit` |
| Sources | `/api/sources-usage` | GET | `brandId`, `limit`, `dateRange` |
| Rankings | `/api/analytics-dashboard` | GET | `brandId`, `includeCompetitors` |
| Heatmap | `/api/brand-topic-analysis` | GET | `brandId`, `dateRange` |
| Insights | `/api/insights` | GET | `brandId`, `priority`, `limit` |

## Mock Data Fallback

All components include mock data fallback for development. When APIs return no data or errors occur, components gracefully fall back to mock data defined in their respective files. This ensures a smooth development experience even when backend APIs are still being built.

## Usage in Dashboard

```tsx
// app/dashboard/page.tsx
import { 
  AnalyticsChartDashboard,
  RecentBrandMentions,
  SourcesUsage,
  IndustryRanking,
  BrandTopicHeatmap,
  InsightsRecommendations
} from '@/components/dashboard/overview'

export default function DashboardPage() {
  const { currentBrand } = useBrand()
  
  return (
    <div className="space-y-6">
      {/* Main Chart with Filters */}
      <AnalyticsChartDashboard 
        brandId={currentBrand.id} 
        dateRange="30d" 
      />
      
      {/* Industry Ranking */}
      <IndustryRanking brandId={currentBrand.id} />
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBrandMentions brandId={currentBrand.id} />
        <SourcesUsage brandId={currentBrand.id} />
      </div>
      
      {/* Heatmap */}
      <BrandTopicHeatmap brandId={currentBrand.id} />
      
      {/* Insights */}
      <InsightsRecommendations brandId={currentBrand.id} />
    </div>
  )
}
```

## Design System

All components follow soma-geo's design system:
- **Primary:** Black (#000000)
- **Accent:** Orange (#FF760D)
- **Secondary:** Beige (#E3D8C8)
- **Grays:** Gray-50 through Gray-900 scale
- **Typography:** Font weights 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Spacing:** Tailwind's spacing scale
- **Borders:** border-gray-200 for cards, border-gray-300 for inputs

## Dependencies

- `@/components/ui/*` - All UI primitives (button, card, dialog, etc.)
- `lucide-react` - Icon components
- `recharts` - Chart visualizations (main-dashboard-chart)
- `@/lib/contexts/brand-context` - Brand management
- `@/lib/utils` - Utility functions

## Testing

After migration, test each component:
1. Verify data loads from API
2. Check filter functionality
3. Test responsive design (mobile/tablet/desktop)
4. Verify empty states display correctly
5. Test error handling (network failures, no data)
6. Verify mock data fallback works
7. Check all links navigate correctly

## Performance

Components are optimized with:
- Memoized calculations (`useMemo`)
- Debounced search inputs
- Lazy loading for large datasets
- Efficient re-render prevention (`useCallback`)
- Client-side data caching (60s TTL)
