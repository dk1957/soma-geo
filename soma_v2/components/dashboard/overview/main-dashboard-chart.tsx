/**
 * Main Dashboard Chart Component
 * 
 * This component displays the primary analytics dashboard with interactive charts,
 * metric cards, and competitor comparison functionality.
 * 
 * @module MainDashboardChart
 * 
 * ================================
 * API INTEGRATION REQUIREMENTS
 * ================================
 * 
 * This component requires the following external API endpoints to be implemented:
 * 
 * 1. GET /api/analytics/timeseries
 *    Purpose: Fetch time-series analytics data for brand and competitors
 *    Query Parameters:
 *      - brandId: string (required) - The brand identifier
 *      - startDate: string (ISO date) - Start of date range
 *      - endDate: string (ISO date) - End of date range
 *      - promptType: 'all' | 'branded' | 'discovery' - Filter by prompt type
 *      - includeCompetitors: boolean - Whether to include competitor data
 *      - competitors: string[] - Array of competitor IDs to include
 *    Response Format:
 *      Array<{
 *        date: string,
 *        lvi: number,           // LLM Visibility Index
 *        gsov: number,          // Generative Share of Voice
 *        mentions: number,      // Total brand mentions
 *        citations: number,     // Citation count
 *        prompts: number,       // Prompt appearances
 *        sentiment: number,     // Sentiment score (0-100)
 *        authority: number,     // Authority score (0-100)
 *        discoverability: number, // Discoverability score (0-100)
 *        [competitorName_metric]: number // Dynamic keys for competitor metrics
 *      }>
 * 
 * 2. GET /api/competitors
 *    Purpose: Fetch available competitors for a brand
 *    Query Parameters:
 *      - brandId: string (required)
 *    Response Format:
 *      {
 *        competitors: Array<{
 *          id: string,
 *          name: string,
 *          color?: string  // Optional hex color for visualization
 *        }>
 *      }
 * 
 * 3. GET /api/mentions/recent
 *    Purpose: Fetch recent brand mentions across AI platforms
 *    Query Parameters:
 *      - brandId: string (required)
 *      - limit: number (default: 6)
 *    Response Format:
 *      Array<{
 *        id: string,
 *        platform: string,
 *        query: string,
 *        mention: string,
 *        timestamp: string,
 *        sentiment: 'positive' | 'neutral' | 'negative'
 *      }>
 * 
 * 4. GET /api/sources/usage
 *    Purpose: Fetch source usage statistics
 *    Query Parameters:
 *      - brandId: string (required)
 *      - limit: number (default: 6)
 *      - dateRange: string (e.g., '7d', '30d')
 *    Response Format:
 *      Array<{
 *        source: string,
 *        citations: number,
 *        change: number  // Percentage change
 *      }>
 * 
 * 5. GET /api/rankings/industry
 *    Purpose: Fetch industry ranking data
 *    Query Parameters:
 *      - brandId: string (required)
 *      - includeCompetitors: boolean
 *    Response Format:
 *      Array<{
 *        brand: string,
 *        rank: number,
 *        score: number,
 *        change: number
 *      }>
 * 
 * ================================
 * CURRENT STATE
 * ================================
 * 
 * Currently using mock data and placeholder cachedFetchJson calls.
 * All API calls have TODO markers indicating where external APIs should be integrated.
 * 
 * Search for "TODO: Replace with external API" to find all integration points.
 */

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Legend
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Target,
  MessageSquare,
  FileText,
  Users,
  Zap,
  Activity,
  Award,
  Shield,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  Search,
  Building,
  Trophy,
  ExternalLink,
  Play,
  RefreshCw,
  Info
} from "lucide-react"
import { cachedFetchJson } from '@/lib/utils/cached-fetch'
import { AnalyticsFilters, type FilterOptions } from '@/components/dashboard/overview/analytics-filters'

// Model name to display label mapping
const getModelLabel = (modelName: string | null | undefined): string => {
  if (!modelName) return 'Unknown'
  const lower = modelName.toLowerCase()
  if (lower.includes('gpt')) return 'ChatGPT'
  if (lower.includes('claude')) return 'Claude'
  if (lower.includes('gemini')) return 'Gemini'
  if (lower.includes('grok')) return 'Grok'
  if (lower.includes('perplexity') || lower.includes('sonar')) return 'Perplexity'
  return modelName.split('/').pop()?.split('-')[0] || modelName
}

// Type definitions
interface MockCompetitor {
  id: string
  name: string
  color: string
}



// Default competitor colors for visualization - highly distinct colors with good contrast
const defaultCompetitorColors = [
  '#2563eb', // Deep blue
  '#dc2626', // Strong red
  '#059669', // Forest green
  '#ca8a04', // Golden yellow
  '#7c3aed', // Deep purple
  '#db2777', // Hot pink
  '#0891b2', // Cyan
  '#ea580c', // Burnt orange
  '#4f46e5', // Indigo
  '#65a30d'  // Lime green
]

// Aggregation period for grouping data points
type AggregationPeriod = 'day' | 'week' | 'month' | 'quarter'

interface AnalyticsData {
  date: string
  lvi: number
  gsov: number
  mentions: number
  citations: number
  prompts: number
  sentiment: number  // 0-10 scale, 0 when brand not mentioned
  competitors: number
  authority: number
  discoverability: number
  position: number  // Position score (0-100%, 0 when not mentioned)
  avg_position_raw: number  // Raw ordinal avg position (e.g. 3.5 = mentioned ~3rd)
  citation_rate: number  // Citation rate (0-100)
  visibility: number  // Visibility/mention rate (0-100)
  branded_prompts?: number
  discovery_prompts?: number
  competitor_lvi?: number
  competitor_gsov?: number
  _hasData?: boolean  // True if a real LLM run produced data for this day
  _noData?: boolean   // True if this date is a placeholder (no primary brand metrics)
  competitor_mentions?: number
  brand_mentions?: number
  brand_sentiment?: number  // 0 when brand not mentioned
}

interface MetricConfig {
  key: keyof AnalyticsData
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  gradient: string
  description: string
  unit: string
  target?: number
  isNorthStar?: boolean
  promptTypeSupported?: boolean
}

interface AnalyticsChartDashboardProps {
  brandId: string
  dateRange?: string
  reportData?: any  // Report data from useReportData hook
  isLoading?: boolean
  error?: Error | null
  filters?: FilterOptions  // Lifted filter state from parent
  onFiltersChange?: (filters: FilterOptions) => void  // Callback to update parent filters
}

// Comprehensive metrics configuration for brand managers
// These map to the 5 key AEO metrics: Visibility, Citation, Sentiment, Position, Share of Voice + composite LVI
const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'lvi',
    label: 'LVI Score',
    icon: Eye,
    color: '#FF760D',
    gradient: 'from-gray-900 to-black',
    description: 'Your overall AI visibility score combining how often you appear, get cited, receive positive sentiment, and rank early in responses.',
    unit: '',
    target: 80,
    isNorthStar: true,
    promptTypeSupported: false
  },
  {
    key: 'gsov',
    label: 'Share of Voice',
    icon: Target,
    color: '#FF760D',
    gradient: 'from-gray-800 to-gray-900',
    description: 'How much of the conversation you own compared to competitors when AI mentions brands in your industry.',
    unit: '%',
    target: 25,
    isNorthStar: true,
    promptTypeSupported: true
  },
  {
    key: 'visibility',
    label: 'Visibility Rate',
    icon: MessageSquare,
    color: '#FF760D',
    gradient: 'from-emerald-600 to-emerald-700',
    description: 'The percentage of relevant AI responses that mention your brand. Higher means you appear more often.',
    unit: '%',
    promptTypeSupported: true
  },
  {
    key: 'sentiment',
    label: 'Sentiment Score',
    icon: Activity,
    color: '#FF760D',
    gradient: 'from-violet-600 to-violet-700',
    description: 'How positively or negatively AI describes your brand when mentioned. Above 5 is positive, below 5 is negative.',
    unit: '',
    promptTypeSupported: true
  },
  {
    key: 'position',
    label: 'Average Position',
    icon: Award,
    color: '#FF760D',
    gradient: 'from-red-600 to-red-700',
    description: 'Your average rank when mentioned in AI responses. Lower is better — 1st means you appear first.',
    unit: '',
    target: 3
  }
]

// Data is now sourced from reportData prop via useReportData hook
// The timeseries data is processed in loadAnalyticsData callback

// Format a number as ordinal (1st, 2nd, 3rd, 4th, ...)
const formatOrdinal = (n: number): string => {
  if (n === 0) return '—'
  const rounded = Math.round(n)
  const s = ['th', 'st', 'nd', 'rd']
  const v = rounded % 100
  return rounded + (s[(v - 20) % 10] || s[v] || s[0])
}

// Compute average of a metric across data points that have real data
// Best practice: days with no LLM run (_hasData=false) are excluded from the denominator
const calculateAverage = (
  data: AnalyticsData[],
  metric: keyof AnalyticsData,
  getValueFn?: (d: AnalyticsData) => number
): number => {
  if (data.length === 0) return 0
  // Only include days where data was actually collected
  const dataWithValues = data.filter(d => d._hasData !== false)
  if (dataWithValues.length === 0) return 0
  const values = dataWithValues.map(d => getValueFn ? getValueFn(d) : (d[metric] as number) || 0)
  return values.reduce((sum, v) => sum + v, 0) / dataWithValues.length
}

// Get ISO week key (YYYY-Wnn) for a date string
const getWeekKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00') // noon avoids timezone day-shift
  d.setHours(0, 0, 0, 0)
  // ISO week: Thursday determines the week
  const thursday = new Date(d)
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNum = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// Get month key (YYYY-MM) for a date string
const getMonthKey = (dateStr: string): string => dateStr.slice(0, 7)

// Get quarter key (YYYY-Q1..Q4) for a date string
const getQuarterKey = (dateStr: string): string => {
  const month = parseInt(dateStr.slice(5, 7), 10)
  const q = Math.ceil(month / 3)
  return `${dateStr.slice(0, 4)}-Q${q}`
}

// Format a period key for display in chart x-axis and tooltips
const formatPeriodLabel = (key: string, period: AggregationPeriod): string => {
  if (period === 'day') {
    // Append T12:00:00 to avoid timezone day-shift
    const d = new Date(key + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === 'week') {
    // key is YYYY-Wnn — show "Week nn"
    return key.replace(/^\d{4}-/, '')
  }
  if (period === 'month') {
    const d = new Date(key + '-01')
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  // quarter — "Q1 '26"
  return key.replace(/^(\d{2})(\d{2})-(Q\d)$/, '$3 \'$2')
}

// Aggregate daily data into periods (week/month/quarter)
// Within a period, metrics are averaged — only days with real data count in the denominator
const aggregateDataByPeriod = (
  data: AnalyticsData[],
  period: AggregationPeriod
): AnalyticsData[] => {
  if (period === 'day') return data

  const getKey = period === 'week' ? getWeekKey : period === 'month' ? getMonthKey : getQuarterKey

  // Group by period
  const groups = new Map<string, AnalyticsData[]>()
  data.forEach(d => {
    const key = getKey(d.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  })

  // Numeric keys of AnalyticsData to aggregate
  const numericKeys: (keyof AnalyticsData)[] = [
    'lvi', 'gsov', 'mentions', 'citations', 'prompts', 'sentiment',
    'competitors', 'authority', 'discoverability', 'position',
    'citation_rate', 'visibility', 'branded_prompts', 'discovery_prompts',
    'brand_mentions', 'brand_sentiment'
  ]

  const result: AnalyticsData[] = []
  groups.forEach((items, key) => {
    // Only average over days that have real data
    const withData = items.filter(d => d._hasData !== false)
    const denominator = withData.length || 1

    const aggregated: any = {
      date: key,  // period key used for x-axis
      _hasData: withData.length > 0,
      _periodLabel: formatPeriodLabel(key, period),
    }

    // Average standard numeric fields
    for (const k of numericKeys) {
      const sum = withData.reduce((s, d) => s + ((d[k] as number) || 0), 0)
      aggregated[k] = sum / denominator
    }

    // Average competitor dynamic keys (e.g., Wise_lvi, Remitly_gsov)
    const dynamicKeys = new Set<string>()
    items.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k.includes('_') && !numericKeys.includes(k as any) && !k.startsWith('_') && k !== 'date') {
          dynamicKeys.add(k)
        }
      })
    })
    dynamicKeys.forEach(dk => {
      const sum = withData.reduce((s, d) => s + ((d as any)[dk] || 0), 0)
      aggregated[dk] = sum / denominator
    })

    result.push(aggregated as AnalyticsData)
  })

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

// Trend calculation: compare first half average vs second half average of the range
const calculateTrend = (data: AnalyticsData[], metric: keyof AnalyticsData): { direction: 'up' | 'down' | 'stable', percentage: number } => {
  if (data.length < 2) return { direction: 'stable', percentage: 0 }
  
  const mid = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, mid)
  const secondHalf = data.slice(mid)
  
  const firstAvg = calculateAverage(firstHalf, metric)
  const secondAvg = calculateAverage(secondHalf, metric)
  
  // If the current period average is 0, trend is meaningless — show stable 0%
  if (secondAvg === 0) {
    return { direction: 'stable', percentage: 0 }
  }
  
  // Handle division by zero (first half was 0, but second half has data)
  if (firstAvg === 0) {
    return { direction: 'up', percentage: 100 }
  }
  
  const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100
  
  return {
    direction: Math.abs(percentageChange) < 0.1 ? 'stable' : percentageChange > 0 ? 'up' : 'down',
    percentage: isNaN(Math.abs(percentageChange)) ? 0 : Math.abs(percentageChange)
  }
}

// Prior-period trend: compare selected range average vs the equivalent prior range
// e.g. 7D selected → compare last 7 days vs the 7 days before that
const calculatePriorPeriodTrend = (
  data: AnalyticsData[],
  metric: keyof AnalyticsData,
  getValueFn?: (d: AnalyticsData) => number
): { direction: 'up' | 'down' | 'stable', percentage: number, label: string } => {
  if (data.length < 2) return { direction: 'stable', percentage: 0, label: 'vs prior' }

  const mid = Math.floor(data.length / 2)
  const priorPeriod = data.slice(0, mid)
  const currentPeriod = data.slice(mid)

  const priorAvg = getValueFn
    ? calculateAverage(priorPeriod, metric, getValueFn)
    : calculateAverage(priorPeriod, metric)
  const currentAvg = getValueFn
    ? calculateAverage(currentPeriod, metric, getValueFn)
    : calculateAverage(currentPeriod, metric)

  if (currentAvg === 0) return { direction: 'stable', percentage: 0, label: 'vs prior' }
  if (priorAvg === 0) return { direction: 'up', percentage: 100, label: 'vs prior' }

  const pct = ((currentAvg - priorAvg) / priorAvg) * 100

  // Determine a human-readable label for the comparison
  const days = data.length
  let label = 'vs prior'
  if (days <= 2) label = 'vs prior day'
  else if (days <= 14) label = 'vs prior week'
  else if (days <= 60) label = 'vs prior month'
  else if (days <= 180) label = 'vs prior quarter'
  else label = 'vs prior period'

  return {
    direction: Math.abs(pct) < 0.1 ? 'stable' : pct > 0 ? 'up' : 'down',
    percentage: isNaN(Math.abs(pct)) ? 0 : Math.abs(pct),
    label,
  }
}

// Check if a filter date range represents "All time" (epoch start or >364 days)
const isAllTimeRange = (dateRange: { from: string; to: string }): boolean => {
  if (!dateRange.from || !dateRange.to) return true
  const from = new Date(dateRange.from)
  const to = new Date(dateRange.to)
  // Epoch start date (1970) or span > 364 days → "all time"
  if (from.getFullYear() <= 1970) return true
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 364
}

export function AnalyticsChartDashboard({ 
  brandId, 
  dateRange = '30d',
  reportData,
  isLoading: externalLoading = false,
  error: externalError = null,
  filters: externalFilters,
  onFiltersChange: externalOnFiltersChange
}: AnalyticsChartDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof AnalyticsData>('lvi')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('day')
  const [loading, setLoading] = useState(true)
  const [availableCompetitors, setAvailableCompetitors] = useState<MockCompetitor[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  
  // Internal filter state (used if no external filters provided)
  const [internalFilters, setInternalFilters] = useState<FilterOptions>({
    dateRange: {
      from: new Date(0).toISOString().split('T')[0],
      to: new Date().toLocaleDateString('en-CA') // local timezone YYYY-MM-DD
    },
    promptType: 'all',
    aiPlatforms: [],
    competitorBenchmark: false,
    selectedCompetitors: [],
    selectedModel: undefined
  })
  
  // Use external filters if provided, otherwise use internal state
  const filters = externalFilters || internalFilters
  const setFilters = externalOnFiltersChange || setInternalFilters
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setAnalyticsData([])
    setAvailableCompetitors([])
    setAvailableModels([])
    setSelectedMetric('lvi')
    setHoveredLine(null)
    setLoading(true)
    // Reset filters to default state
    setFilters({
      dateRange: {
        from: new Date(0).toISOString().split('T')[0],
        to: new Date().toLocaleDateString('en-CA') // local timezone YYYY-MM-DD
      },
      promptType: 'all',
      aiPlatforms: [],
      competitorBenchmark: false,
      selectedCompetitors: [],
      selectedModel: undefined
    })
  }, [brandId])
  
  // Extract available models from report metadata (new approach using dedicated query)
  const availableModelsFromMetadata = useMemo(() => {
    return reportData?.metadata?.availableModels || []
  }, [reportData])

  // Memoize stable competitors string to prevent unnecessary re-renders
  const selectedCompetitorsString = useMemo(() =>
    filters.selectedCompetitors.join(','),
    [filters.selectedCompetitors]
  )

  // Fetch analytics data - using same approach as external report
  const loadAnalyticsData = useCallback(async () => {
    setLoading(true)
    try {
      let data: AnalyticsData[] = []
      
      if (reportData?.timeseries && Array.isArray(reportData.timeseries)) {
        // Handle timeseries data from new API structure
        // Note: Filtering is now done at API level, but we keep local filter for UI selection
        let filteredTimeseries = reportData.timeseries
        
        // Apply local model filtering if models selected (data already filtered at API level but this handles UI state)
        if (filters.aiPlatforms && filters.aiPlatforms.length > 0) {
          filteredTimeseries = reportData.timeseries.filter((t: any) => {
            if (!t.model_name) return true // Include rows without model (aggregates)
            return filters.aiPlatforms.some(platform => {
              const modelLower = t.model_name?.toLowerCase() || ''
              const platformLower = platform.toLowerCase()
              return modelLower.includes(platformLower) || platformLower.includes(modelLower)
            })
          })
        }
        
        // Group by date - database now returns aggregated data (one row per day per brand)
        const dateMap = new Map<string, any>()
        
        filteredTimeseries.forEach((t: any) => {
          const date = t.metric_date
          
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date: date,
              lvi: 0,
              gsov: 0,
              mentions: 0,
              citations: 0,
              prompts: 0,
              sentiment: 0,
              competitors: 0,
              authority: 0,
              discoverability: 0,
              position: 0,       // Position score (0-100%)
              avg_position_raw: 0, // Raw ordinal avg position
              visibility: 0,    // Visibility/mention rate (0-100%)
              citation_rate: 0, // Citation rate (0-100%)
              branded_prompts: 0,
              discovery_prompts: 0,
              brand_mentions: 0,
              brand_sentiment: 0,
              _hasData: false,
            })
          }
          
          const dayData = dateMap.get(date)
          
          if (t.is_primary) {
            // If the API signals "no data" for this date, mark it but leave
            // values as null so the chart renders "—" instead of "0".
            if (t._no_data) {
              dayData._hasData = false
              dayData._noData = true
              // Leave all values at their initialized 0 so the chart
              // still renders the date point, but the tooltip will show "—"
              return
            }

            const hasMentions = (t.mention_count || 0) > 0
            // Mark this day as having real data if LLM runs produced responses
            dayData._hasData = (t.total_responses || 0) > 0
            
            // Zero-visibility rule: if brand has no mentions, LVI and derived metrics must be 0
            dayData.lvi = hasMentions ? (t.lvi_score || 0) : 0
            dayData.gsov = hasMentions ? (t.share_of_voice || 0) : 0
            dayData.visibility = t.mention_rate || 0
            dayData.citation_rate = t.citation_rate || 0
            dayData.mentions = t.mention_count || 0
            dayData.citations = t.citation_count || 0
            dayData.prompts = t.total_responses || 0
            dayData.brand_mentions = t.mention_count || 0
            dayData.authority = Math.min(100, (t.citation_count || 0) * 5)
            dayData.discoverability = Math.min(100, (t.mention_rate || 0) * 1.5)
            
            // Sentiment: convert from -1 to 1 scale to 0-10 scale
            // Show 0 if brand not mentioned
            if (hasMentions && t.avg_sentiment !== null && t.avg_sentiment !== undefined) {
              dayData.sentiment = ((t.avg_sentiment + 1) * 5)
              dayData.brand_sentiment = dayData.sentiment
            } else {
              dayData.sentiment = 0
              dayData.brand_sentiment = 0
            }
            
            // Position score: canonical formula — rank 1=100, rank 10=0
            if (hasMentions && t.avg_position && t.avg_position > 0) {
              dayData.position = Math.max(0, Math.min(100, (1 - (t.avg_position - 1) / 9) * 100))
              dayData.avg_position_raw = t.avg_position
            } else {
              dayData.position = 0
              dayData.avg_position_raw = 0
            }
          } else {
            const compName = t.brand_name
            const compHasMentions = (t.mention_count || 0) > 0
            
            // Competitor values — enforce zero-visibility rule
            dayData[`${compName}_lvi`] = compHasMentions ? (t.lvi_score || 0) : 0
            dayData[`${compName}_gsov`] = compHasMentions ? (t.share_of_voice || 0) : 0
            dayData[`${compName}_visibility`] = t.mention_rate || 0
            dayData[`${compName}_citation_rate`] = t.citation_rate || 0
            dayData[`${compName}_mentions`] = t.mention_count || 0
            dayData[`${compName}_citations`] = t.citation_count || 0
            dayData[`${compName}_authority`] = Math.min(100, (t.citation_count || 0) * 5)
            dayData[`${compName}_discoverability`] = Math.min(100, (t.mention_rate || 0) * 1.5)
            
            // Competitor sentiment
            if (compHasMentions && t.avg_sentiment !== null && t.avg_sentiment !== undefined) {
              dayData[`${compName}_sentiment`] = ((t.avg_sentiment + 1) * 5)
            } else {
              dayData[`${compName}_sentiment`] = 0
            }
            
            // Competitor position score: canonical formula — rank 1=100, rank 10=0
            if (compHasMentions && t.avg_position && t.avg_position > 0) {
              dayData[`${compName}_position`] = Math.max(0, Math.min(100, (1 - (t.avg_position - 1) / 9) * 100))
              dayData[`${compName}_avg_position_raw`] = t.avg_position
            } else {
              dayData[`${compName}_position`] = 0
              dayData[`${compName}_avg_position_raw`] = 0
            }
            
            dayData.competitors = Math.max(dayData.competitors, 1)
          }
        })
        
        // Calculate derived values
        dateMap.forEach((dayData) => {
          dayData.branded_prompts = Math.floor((dayData.prompts || 0) * 0.4)
          dayData.discovery_prompts = Math.floor((dayData.prompts || 0) * 0.6)
        })
        
        // Ensure all competitor keys exist in each day's data (for chart to show all brands)
        // Get all unique competitor names from the timeseries
        const allCompetitorNames = new Set<string>()
        filteredTimeseries.forEach((t: any) => {
          if (!t.is_primary && t.brand_name) {
            allCompetitorNames.add(t.brand_name)
          }
        })
        
        // Initialize missing competitor keys with 0 values (show all brands in chart)
        dateMap.forEach((dayData) => {
          allCompetitorNames.forEach((compName) => {
            if (dayData[`${compName}_lvi`] === undefined) dayData[`${compName}_lvi`] = 0
            if (dayData[`${compName}_gsov`] === undefined) dayData[`${compName}_gsov`] = 0
            if (dayData[`${compName}_mentions`] === undefined) dayData[`${compName}_mentions`] = 0
            if (dayData[`${compName}_citations`] === undefined) dayData[`${compName}_citations`] = 0
            if (dayData[`${compName}_sentiment`] === undefined) dayData[`${compName}_sentiment`] = 0
            if (dayData[`${compName}_position`] === undefined) dayData[`${compName}_position`] = 0
            if (dayData[`${compName}_visibility`] === undefined) dayData[`${compName}_visibility`] = 0
            if (dayData[`${compName}_citation_rate`] === undefined) dayData[`${compName}_citation_rate`] = 0
            if (dayData[`${compName}_authority`] === undefined) dayData[`${compName}_authority`] = 0
            if (dayData[`${compName}_discoverability`] === undefined) dayData[`${compName}_discoverability`] = 0
          })
        })
        
        data = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      }
      
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics data:', error)
      setAnalyticsData([])
    } finally {
      setLoading(false)
    }
  }, [brandId, filters, reportData])

  // Load competitors from reportData and auto-select all
  const loadCompetitors = useCallback(async () => {
    try {
      if (reportData?.rankings && Array.isArray(reportData.rankings)) {
        const competitors = reportData.rankings
          .filter((r: any) => !r.is_primary)
          .map((r: any, idx: number) => ({
            id: `comp-${idx}`,
            name: r.brand_name,
            color: defaultCompetitorColors[idx % defaultCompetitorColors.length] || '#6b7280'
          }))
        
        setAvailableCompetitors(competitors)
        
        // Auto-select all competitors and enable benchmark mode
        if (competitors.length > 0) {
          setFilters(prev => ({
            ...prev,
            competitorBenchmark: true,
            selectedCompetitors: competitors.map((c: MockCompetitor) => c.name)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading competitors:', error)
      setAvailableCompetitors([])
    }
  }, [reportData])
  
  // Load models from reportData metadata
  const loadModels = useCallback(async () => {
    try {
      // Use models from metadata (populated by dedicated query in API)
      if (availableModelsFromMetadata.length > 0) {
        setAvailableModels(availableModelsFromMetadata)
      } else if (reportData?.timeseries && Array.isArray(reportData.timeseries)) {
        // Fallback to extracting from timeseries if no metadata
        const models = reportData.timeseries
          .map((t: any) => t.model_name)
          .filter((name: string, index: number, self: string[]) => 
            name && self.indexOf(name) === index
          )
          .sort()
        setAvailableModels(models)
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    }
  }, [reportData, availableModelsFromMetadata])

  
  // brand_appearances table dropped — mentions data no longer fetched
   /**
    Fetch recent brand mentions (stubbed — brand_appearances dropped)
   */
  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])
  
  useEffect(() => {
    loadModels()
  }, [loadModels])

  // Listen for dashboard refresh events (e.g., after run completion)
  useEffect(() => {
    const handleRefresh = () => {
      loadAnalyticsData()
    }

    window.addEventListener('dashboardRefresh', handleRefresh)
    return () => window.removeEventListener('dashboardRefresh', handleRefresh)
  }, [loadAnalyticsData])

  // Get the appropriate data based on prompt type filtering
  const getMetricValue = (data: AnalyticsData, metric: keyof AnalyticsData): number => {
    if (filters.promptType === 'branded' && metric === 'prompts') {
      return data.branded_prompts || 0
    }
    if (filters.promptType === 'discovery' && metric === 'prompts') {
      return data.discovery_prompts || 0
    }
    if (metric === 'sentiment') {
      // Sentiment is already converted to 0-10 scale during data loading
      // Returns 0 when brand not mentioned
      return data.sentiment ?? data.brand_sentiment ?? 0
    }
    if (metric === 'position') {
      // Position score 0-100%, returns 0 when brand not mentioned
      return data.position ?? 0
    }
    if (metric === 'mentions') {
      return data.brand_mentions || 0
    }
    return (data[metric] as number) ?? 0
  }

  const selectedMetricConfig = METRICS_CONFIG.find(m => m.key === selectedMetric)!
  // Combine internal + external loading for consistent UI
  const isLoading = loading || externalLoading
  
  // Aggregate data by selected period (day/week/month/quarter) — only for the chart
  const displayData = useMemo(
    () => aggregateDataByPeriod(analyticsData, aggregationPeriod),
    [analyticsData, aggregationPeriod]
  )
  
  // Whether we're showing "All time" (no comparison needed)
  const showAllTime = isAllTimeRange(filters.dateRange)
  
  // Chart header value: always raw daily data average
  const currentValue = analyticsData.length > 0
    ? calculateAverage(analyticsData, selectedMetric, (d) => getMetricValue(d, selectedMetric))
    : 0
  // Prior-period trend for chart header (hidden when All)
  const headerTrend = showAllTime
    ? { direction: 'stable' as const, percentage: 0, label: '' }
    : calculatePriorPeriodTrend(analyticsData, selectedMetric, (d) => getMetricValue(d, selectedMetric))
  // Suppress trend when the displayed value is 0
  const effectiveTrend = currentValue === 0 ? { direction: 'stable' as const, percentage: 0, label: '' } : headerTrend
  const hasTarget = selectedMetricConfig.target !== undefined
  const targetAchieved = hasTarget && typeof currentValue === 'number' && currentValue >= selectedMetricConfig.target!

  // Custom label component for line end markers (only shows on hover)
  const CustomLineLabel = (props: any) => {
    const { x, y, index, brandName, color, isLast } = props
    
    // Only render on the last data point and when this line is hovered
    if (!isLast || index !== displayData.length - 1 || hoveredLine !== brandName) return null
    
    // Get initials from brand name
    const getInitials = (name: string) => {
      if (name === "Avg") return "Avg"
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)
    }
    
    const initials = getInitials(brandName)
    
    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={16}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={10}
          fontWeight="600"
        >
          {initials}
        </text>
      </g>
    )
  }

  // Enhanced tooltip for charts - Google Analytics style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metric = METRICS_CONFIG.find(m => m.key === selectedMetric)
      // Check if this date has no primary brand data (placeholder entry)
      const matchingDay = analyticsData.find(d => d.date === label)
      const isNoData = matchingDay && (matchingDay as any)._noData
      
      return (
        <div className="bg-black p-3 rounded-md shadow-lg">
          <p className="text-xs font-semibold text-white mb-1">
            {metric?.label}
          </p>
          <p className="text-xs font-medium text-gray-400 mb-2">
            {aggregationPeriod !== 'day'
              ? formatPeriodLabel(label, aggregationPeriod)
              : new Date(label + 'T12:00:00').toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })
            }
          </p>
          
          {payload.map((entry: any, index: number) => {
            // For the primary brand line on a no-data day, show "—"
            const isPrimary = index === 0
            const displayValue = (isPrimary && isNoData)
              ? '—'
              : selectedMetric === 'position'
                ? formatOrdinal(typeof entry.value === 'number' ? entry.value : 0)
                : (typeof entry.value === 'number' && !isNaN(entry.value) ? entry.value.toFixed(1) : '0') + (metric?.unit || '')

            return (
              <div key={index} className="flex items-center justify-between gap-4 mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-300">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {displayValue}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Filters - Full Width */}
      <div className="w-full">
        <AnalyticsFilters 
          filters={filters}
          onFiltersChange={setFilters}
          availableCompetitors={availableCompetitors}
          availableModels={(() => {
            // Dedup by display label to avoid duplicate chips (e.g. multiple raw names → "ChatGPT")
            const seen = new Map<string, { value: string; label: string }>()
            for (const model of availableModels) {
              const label = getModelLabel(model)
              if (!seen.has(label)) {
                seen.set(label, { value: model, label })
              }
            }
            return Array.from(seen.values())
          })()}
        />
      </div>

      {/* Metrics Selector - Full Width */}
      <div className="w-full">
        <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-4 py-4">
            {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {METRICS_CONFIG.map((metric) => (
                <div
                  key={metric.key}
                  className="p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-gray-200 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {METRICS_CONFIG.map((metric) => {
                const isSelected = selectedMetric === metric.key
                // Stat cards always use raw daily data (not chart aggregation)
                const currentVal = analyticsData.length > 0
                  ? calculateAverage(analyticsData, metric.key, (d) => getMetricValue(d, metric.key))
                  : 0
                // When "All" is selected, hide comparison. Otherwise compare vs prior period.
                const showAllTime = isAllTimeRange(filters.dateRange)
                const metricTrend = showAllTime
                  ? { direction: 'stable' as const, percentage: 0, label: '' }
                  : calculatePriorPeriodTrend(analyticsData, metric.key, (d) => getMetricValue(d, metric.key))
                // Suppress trend when displayed value is 0
                const effectiveMetricTrend = currentVal === 0
                  ? { direction: 'stable' as const, percentage: 0, label: '' }
                  : metricTrend
                
                // Show prompt type badge if applicable
                const showPromptTypeBadge = metric.promptTypeSupported && filters.promptType !== 'all'
                
                return (
                  <div
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedMetric(metric.key)
                      }
                    }}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left hover:shadow-sm cursor-pointer ${
                      isSelected 
                        ? 'border-black bg-white shadow-sm ring-1 ring-black/20' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className={`h-4 w-4 ${
                        isSelected ? 'text-black' : 'text-gray-500'
                      }`} />
                      <div className="flex gap-1 items-center">
                        {showPromptTypeBadge && (
                          <Badge variant="outline" className="text-xs border-[#FF760D] text-[#FF760D]">
                            {filters.promptType === 'branded' ? 'B' : 'D'}
                          </Badge>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="cursor-help p-0.5 hover:bg-gray-100 rounded-full transition-colors" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">{metric.label}</p>
                            <p className="text-sm text-gray-300">{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {metric.key === 'position'
                          ? formatOrdinal(calculateAverage(analyticsData, 'avg_position_raw' as keyof AnalyticsData, (d) => d.avg_position_raw ?? 0))
                          : (typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal.toFixed(1) : '0')}{metric.key !== 'position' && metric.unit}
                      </div>
                      <div className="text-xs font-medium text-gray-600">{metric.label}</div>
                      {!showAllTime && (
                      <div className="flex items-center justify-between">
                        <div className={`text-xs flex items-center gap-1 ${
                          effectiveMetricTrend.direction === 'up' ? 'text-green-600' : 
                          effectiveMetricTrend.direction === 'down' ? 'text-red-600' : 
                          'text-gray-400'
                        }`}>
                          {effectiveMetricTrend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                          {effectiveMetricTrend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                          {effectiveMetricTrend.direction === 'stable' && <Minus className="h-3 w-3" />}
                          <span className="font-medium">
                            {effectiveMetricTrend.direction === 'up' ? '+' : effectiveMetricTrend.direction === 'down' ? '-' : ''}
                            {effectiveMetricTrend.percentage.toFixed(1)}%
                          </span>
                          <span className="text-gray-400 ml-0.5">{'label' in effectiveMetricTrend ? (effectiveMetricTrend as any).label : ''}</span>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Area */}
      <Card className="border border-gray-200 shadow-none bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/10"
                >
                  <selectedMetricConfig.icon 
                    className="h-5 w-5 text-black" 
                  />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">{selectedMetricConfig.label}</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    {selectedMetricConfig.description}
                    {filters.promptType !== 'all' && selectedMetricConfig.promptTypeSupported && (
                      <span className="ml-2 text-[#FF760D]">
                        ({filters.promptType === 'branded' ? 'Branded' : 'Discovery'} queries only)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              
              {/* Current Value & Trend */}
              {isLoading ? (
                <div className="text-left sm:text-right space-y-2">
                  <div className="h-10 w-24 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-32 rounded bg-gray-100 animate-pulse sm:ml-auto" />
                </div>
              ) : (
              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-1">
                  {selectedMetric === 'position'
                    ? formatOrdinal(calculateAverage(analyticsData, 'avg_position_raw' as keyof AnalyticsData, (d) => d.avg_position_raw ?? 0))
                    : <>{typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue.toFixed(selectedMetric === 'authority' ? 1 : 0) : '0'}{selectedMetricConfig.unit}</>}
                </div>
                {!showAllTime && (
                <div className="flex items-center sm:justify-end gap-1 text-sm">
                  {effectiveTrend.direction === 'up' && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                  {effectiveTrend.direction === 'down' && (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  {effectiveTrend.direction === 'stable' && (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={`font-medium ${
                    effectiveTrend.direction === 'up' ? 'text-green-600' :
                    effectiveTrend.direction === 'down' ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {isNaN(effectiveTrend.percentage) ? '0.0' : effectiveTrend.percentage.toFixed(1)}% {'label' in effectiveTrend ? (effectiveTrend as any).label : 'vs prior'}
                  </span>
                </div>
                )}
              </div>
              )}
            </div>
            
            {/* View by dropdown — far right */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-gray-500">View by</span>
              <Select value={aggregationPeriod} onValueChange={(v) => setAggregationPeriod(v as AggregationPeriod)}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="h-80 relative overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
              {/* Skeleton chart grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-8 px-12">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-b border-dashed border-gray-200" />
                ))}
              </div>
              {/* Skeleton chart bars/lines */}
              <div className="absolute bottom-8 left-12 right-12 flex items-end gap-2 h-48">
                {[35, 55, 40, 65, 50, 70, 45, 60, 75, 55, 50, 65].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 rounded-t animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              {/* X-axis labels skeleton */}
              <div className="absolute bottom-2 left-12 right-12 flex justify-between">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-2.5 w-10 rounded bg-gray-200 animate-pulse" />
                ))}
              </div>
              {/* Y-axis labels skeleton */}
              <div className="absolute top-8 bottom-8 left-2 flex flex-col justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-2.5 w-6 rounded bg-gray-200 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 20, right: 80, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  
                  <XAxis 
                    dataKey="date" 
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => {
                      if (aggregationPeriod !== 'day') {
                        return formatPeriodLabel(value, aggregationPeriod)
                      }
                      const date = new Date(value + 'T12:00:00')
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    label={{ value: aggregationPeriod === 'day' ? 'Date' : aggregationPeriod.charAt(0).toUpperCase() + aggregationPeriod.slice(1), position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#6b7280', fontWeight: 500 } }}
                  />
                  
                  <YAxis 
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    reversed={selectedMetric === 'position'}
                    domain={selectedMetric === 'position' ? [1, 'auto'] : undefined}
                    allowDecimals={selectedMetric !== 'position'}
                    tickFormatter={(value) => {
                      if (selectedMetric === 'position') return formatOrdinal(value)
                      if (selectedMetric === 'authority') return value.toFixed(1)
                      if (['gsov', 'discoverability'].includes(selectedMetric)) return `${value}%`
                      return Math.round(value).toString()
                    }}
                    label={{ 
                      value: selectedMetricConfig.label, 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fontSize: 12, fill: '#6b7280', fontWeight: 500, textAnchor: 'middle' } 
                    }}
                  />
                  
                  <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 20 }} />
                  
                  {filters.competitorBenchmark && <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px', zIndex: 1 }}
                    iconType="line"
                  />}
                  
                  {/* Main brand line - primary accent color */}
                  <Line
                    type="monotone"
                    dataKey={selectedMetric === 'position' ? 'avg_position_raw' : selectedMetric}
                    stroke="#FF760D"
                    strokeWidth={3.5}
                    dot={{ r: 4, fill: '#FF760D', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#FF760D', strokeWidth: 0 }}
                    name="Your Brand"
                    connectNulls={false}
                    label={<CustomLineLabel brandName="Your Brand" color="#FF760D" isLast={true} />}
                    onMouseEnter={() => setHoveredLine('Your Brand')}
                    onMouseLeave={() => setHoveredLine(null)}
                  />
                  
                  {/* Competitor lines - show when benchmark is enabled */}
                  {filters.competitorBenchmark && (
                    <>
                      {/* Show individual competitor lines if selected */}
                      {filters.selectedCompetitors.length > 0 && filters.selectedCompetitors.map((competitorName) => {
                        const competitor = availableCompetitors.find(c => c.name === competitorName)
                        const competitorColor = competitor?.color || '#9ca3af'
                        const dataKey = selectedMetric === 'position' ? `${competitorName}_avg_position_raw` : `${competitorName}_${selectedMetric}`
                        
                        return (
                          <Line
                            key={competitorName}
                            type="monotone"
                            dataKey={dataKey}
                            stroke={competitorColor}
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={{ r: 3, fill: competitorColor, strokeWidth: 0 }}
                            name={competitorName}
                            connectNulls={false}
                            label={<CustomLineLabel brandName={competitorName} color={competitorColor} isLast={true} />}
                            onMouseEnter={() => setHoveredLine(competitorName)}
                            onMouseLeave={() => setHoveredLine(null)}
                          />
                        )
                      })}
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}