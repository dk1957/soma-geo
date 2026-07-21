/**
 * External Report Analytics Chart Component
 * 
 * Mirrors the main dashboard chart patterns for external/shared reports.
 * Sources data from reportData.timeseries (API) or falls back to /api/analytics/historical.
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
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
  Activity,
  Award,
} from "lucide-react"
import { cachedFetchJson } from '@/lib/utils/cached-fetch'
import { ExternalAnalyticsFilters } from './analytics-filters'

interface FilterOptions {
  dateRange: { from: string; to: string }
  promptType: 'all' | 'branded' | 'discovery'
  aiPlatforms: string[]
  competitorBenchmark: boolean
  selectedCompetitors: string[]
  selectedModel?: string
}

interface MockCompetitor {
  id: string
  name: string
  color: string
}

const defaultCompetitorColors = [
  '#2563eb', '#dc2626', '#059669', '#ca8a04', '#7c3aed',
  '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#65a30d'
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
  sentiment: number
  competitors: number
  authority: number
  discoverability: number
  position: number
  visibility: number
  citation_rate: number
  branded_prompts?: number
  discovery_prompts?: number
  competitor_lvi?: number
  competitor_gsov?: number
  competitor_mentions?: number
  brand_mentions?: number
  brand_sentiment?: number
  _hasData?: boolean
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

interface ExternalAnalyticsChartProps {
  brandId: string
  dateRange?: string
  reportData?: any
}

const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'lvi',
    label: 'AI Visibility Score',
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
    label: 'AI Share of Voice',
    icon: Target,
    color: '#FF760D',
    gradient: 'from-gray-800 to-gray-900',
    description: 'Your average share of the conversation across AI responses. Per response: 1 ÷ total brands mentioned if you appear, 0 if not. Averaged across all responses.',
    unit: '%',
    target: 25,
    isNorthStar: true,
    promptTypeSupported: true
  },
  {
    key: 'visibility',
    label: 'Mention Rate',
    icon: MessageSquare,
    color: '#FF760D',
    gradient: 'from-emerald-600 to-emerald-700',
    description: 'The percentage of relevant AI responses that mention your brand. Higher means you appear more often.',
    unit: '%',
    promptTypeSupported: true
  },
  {
    key: 'sentiment',
    label: 'Brand Sentiment',
    icon: Activity,
    color: '#FF760D',
    gradient: 'from-violet-600 to-violet-700',
    description: 'How positively or negatively AI describes your brand when mentioned. Above 5 is positive, below 5 is negative.',
    unit: '',
    promptTypeSupported: true
  },
  {
    key: 'position',
    label: 'Ranking Position',
    icon: Award,
    color: '#FF760D',
    gradient: 'from-red-600 to-red-700',
    description: 'How early your brand appears in AI responses. Higher scores mean you are mentioned first. Score from 0\u2013100.',
    unit: '/100',
    target: 70
  }
]

// ─── Utility functions (matching dashboard patterns) ───

const calculateAverage = (
  data: AnalyticsData[],
  metric: keyof AnalyticsData,
  getValueFn?: (d: AnalyticsData) => number
): number => {
  if (data.length === 0) return 0
  const dataWithValues = data.filter(d => d._hasData !== false)
  if (dataWithValues.length === 0) return 0
  const values = dataWithValues.map(d => getValueFn ? getValueFn(d) : (d[metric] as number) || 0)
  return values.reduce((sum, v) => sum + v, 0) / dataWithValues.length
}

const getWeekKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00') // noon avoids timezone day-shift
  d.setHours(0, 0, 0, 0)
  const thursday = new Date(d)
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNum = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

const getMonthKey = (dateStr: string): string => dateStr.slice(0, 7)

const getQuarterKey = (dateStr: string): string => {
  const month = parseInt(dateStr.slice(5, 7), 10)
  const q = Math.ceil(month / 3)
  return `${dateStr.slice(0, 4)}-Q${q}`
}

const formatPeriodLabel = (key: string, period: AggregationPeriod): string => {
  if (period === 'day') {
    const d = new Date(key + 'T12:00:00') // noon avoids timezone day-shift
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (period === 'week') return key.replace(/^\d{4}-/, '')
  if (period === 'month') {
    const d = new Date(key + '-01')
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return key.replace(/^(\d{2})(\d{2})-(Q\d)$/, '$3 \'$2')
}

const aggregateDataByPeriod = (
  data: AnalyticsData[],
  period: AggregationPeriod
): AnalyticsData[] => {
  if (period === 'day') return data

  const getKey = period === 'week' ? getWeekKey : period === 'month' ? getMonthKey : getQuarterKey
  const groups = new Map<string, AnalyticsData[]>()
  data.forEach(d => {
    const key = getKey(d.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  })

  const numericKeys: (keyof AnalyticsData)[] = [
    'lvi', 'gsov', 'mentions', 'citations', 'prompts', 'sentiment',
    'competitors', 'authority', 'discoverability', 'position',
    'citation_rate', 'visibility', 'branded_prompts', 'discovery_prompts',
    'brand_mentions', 'brand_sentiment'
  ]

  const result: AnalyticsData[] = []
  groups.forEach((items, key) => {
    const withData = items.filter(d => d._hasData !== false)
    const denominator = withData.length || 1
    const aggregated: any = {
      date: key,
      _hasData: withData.length > 0,
      _periodLabel: formatPeriodLabel(key, period),
    }
    for (const k of numericKeys) {
      const sum = withData.reduce((s, d) => s + ((d[k] as number) || 0), 0)
      aggregated[k] = sum / denominator
    }
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

const calculateTrend = (data: AnalyticsData[], metric: keyof AnalyticsData): { direction: 'up' | 'down' | 'stable', percentage: number } => {
  if (data.length < 2) return { direction: 'stable', percentage: 0 }

  const mid = Math.floor(data.length / 2)
  const firstAvg = calculateAverage(data.slice(0, mid), metric)
  const secondAvg = calculateAverage(data.slice(mid), metric)

  if (secondAvg === 0) return { direction: 'stable', percentage: 0 }
  if (firstAvg === 0) return { direction: 'up', percentage: 100 }

  const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100
  return {
    direction: Math.abs(percentageChange) < 0.1 ? 'stable' : percentageChange > 0 ? 'up' : 'down',
    percentage: isNaN(Math.abs(percentageChange)) ? 0 : Math.abs(percentageChange)
  }
}

const calculatePriorPeriodTrend = (
  data: AnalyticsData[],
  metric: keyof AnalyticsData,
  getValueFn?: (d: AnalyticsData) => number
): { direction: 'up' | 'down' | 'stable', percentage: number, label: string } => {
  if (data.length < 2) return { direction: 'stable', percentage: 0, label: 'vs prior' }

  const mid = Math.floor(data.length / 2)
  const priorAvg = getValueFn
    ? calculateAverage(data.slice(0, mid), metric, getValueFn)
    : calculateAverage(data.slice(0, mid), metric)
  const currentAvg = getValueFn
    ? calculateAverage(data.slice(mid), metric, getValueFn)
    : calculateAverage(data.slice(mid), metric)

  if (currentAvg === 0) return { direction: 'stable', percentage: 0, label: 'vs prior' }
  if (priorAvg === 0) return { direction: 'up', percentage: 100, label: 'vs prior' }

  const pct = ((currentAvg - priorAvg) / priorAvg) * 100
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

const isAllTimeRange = (dateRange: { from: string; to: string }): boolean => {
  if (!dateRange.from || !dateRange.to) return true
  const from = new Date(dateRange.from)
  const to = new Date(dateRange.to)
  if (from.getFullYear() <= 1970) return true
  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 364
}

// ─── Data fetching (fallback when no reportData provided) ───

const fetchAnalyticsData = async (brandId: string, filters: FilterOptions) => {
  try {
    const params = new URLSearchParams({
      brandId,
      includeMetrics: 'true',
      includeCompetitors: filters.competitorBenchmark.toString(),
      promptType: filters.promptType,
    })
    if (filters.dateRange.from) params.append('startDate', filters.dateRange.from)
    if (filters.dateRange.to) params.append('endDate', filters.dateRange.to)
    if (filters.selectedCompetitors.length > 0) {
      params.append('competitors', filters.selectedCompetitors.join(','))
    }

    const response = await fetch(`/api/analytics/historical?${params}`)
    if (!response.ok) return []

    const analytics = await response.json()
    const historicalData = analytics.historical_data || []
    if (historicalData.length === 0) return []

    return historicalData.map((item: any) => ({
      date: item.date,
      lvi: item.lvi_score || 0,
      gsov: Math.max(0, item.share_of_voice || 0),
      mentions: item.brand_mentions || item.total_mentions || 0,
      citations: item.citations || item.total_citations || 0,
      prompts: item.total_prompts || item.total_responses || 0,
      sentiment: Math.max(0, Math.min(10, (item.brand_sentiment || item.avg_sentiment || 0) * 5 + 5)),
      competitors: 0,
      authority: item.content_authority || item.citation_rate || 0,
      discoverability: item.discoverability_score || item.visibility_rate || 0,
      position: item.position_quality_score ? Math.max(0, Math.min(100, item.position_quality_score)) : 0,
      visibility: item.mention_frequency_score || item.visibility_rate || 0,
      citation_rate: item.citation_authority_score || item.citation_rate || 0,
      branded_prompts: item.branded_prompts || 0,
      discovery_prompts: item.discovery_prompts || 0,
      brand_mentions: item.brand_mentions || item.total_mentions || 0,
      brand_sentiment: Math.max(0, Math.min(10, (item.brand_sentiment || item.avg_sentiment || 0) * 5 + 5)),
      _hasData: (item.total_prompts || item.total_responses || 0) > 0,
    }))
  } catch {
    return []
  }
}

// ─── Component ───

export function ExternalAnalyticsChart({ brandId, dateRange = 'all', reportData }: ExternalAnalyticsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof AnalyticsData>('lvi')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('day')
  const [loading, setLoading] = useState(true)
  const [availableCompetitors, setAvailableCompetitors] = useState<MockCompetitor[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterOptions>({
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

  const selectedCompetitorsString = useMemo(() =>
    filters.selectedCompetitors.join(','),
    [filters.selectedCompetitors]
  )

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true)
    try {
      let data: AnalyticsData[] = []

      if (reportData?.timeseries && Array.isArray(reportData.timeseries)) {
        let filteredTimeseries = reportData.timeseries

        if (filters.selectedModel) {
          filteredTimeseries = reportData.timeseries.filter((t: any) =>
            t.model_name === filters.selectedModel
          )
        }

        const dateMap = new Map<string, any>()

        filteredTimeseries.forEach((t: any) => {
          const date = t.metric_date
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              lvi: 0, gsov: 0, mentions: 0, citations: 0, prompts: 0,
              sentiment: 0, competitors: 0, authority: 0, discoverability: 0,
              position: 0, visibility: 0, citation_rate: 0,
              branded_prompts: 0, discovery_prompts: 0,
              brand_mentions: 0, brand_sentiment: 0,
              _hasData: false,
            })
          }

          const dayData = dateMap.get(date)

          if (t.is_primary) {
            // If the API signals "no data" for this date, mark it but leave
            // values at initialized 0 so the chart renders the date point.
            if (t._no_data) {
              dayData._hasData = false
              dayData._noData = true
              return
            }

            const hasMentions = (t.mention_count || 0) > 0
            dayData._hasData = (t.total_responses || 0) > 0

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

            if (hasMentions && t.avg_sentiment !== null && t.avg_sentiment !== undefined) {
              dayData.sentiment = ((t.avg_sentiment + 1) * 5)
              dayData.brand_sentiment = dayData.sentiment
            } else {
              dayData.sentiment = 0
              dayData.brand_sentiment = 0
            }

            if (hasMentions && t.avg_position && t.avg_position > 0) {
              dayData.position = Math.max(0, Math.min(100, (1 - (t.avg_position - 1) / 9) * 100))
            } else {
              dayData.position = 0
            }
          } else {
            const compName = t.brand_name
            const compHasMentions = (t.mention_count || 0) > 0

            dayData[`${compName}_lvi`] = compHasMentions ? (t.lvi_score || 0) : 0
            dayData[`${compName}_gsov`] = compHasMentions ? (t.share_of_voice || 0) : 0
            dayData[`${compName}_visibility`] = t.mention_rate || 0
            dayData[`${compName}_citation_rate`] = t.citation_rate || 0
            dayData[`${compName}_mentions`] = t.mention_count || 0
            dayData[`${compName}_citations`] = t.citation_count || 0
            dayData[`${compName}_authority`] = Math.min(100, (t.citation_count || 0) * 5)
            dayData[`${compName}_discoverability`] = Math.min(100, (t.mention_rate || 0) * 1.5)

            if (compHasMentions && t.avg_sentiment !== null && t.avg_sentiment !== undefined) {
              dayData[`${compName}_sentiment`] = ((t.avg_sentiment + 1) * 5)
            } else {
              dayData[`${compName}_sentiment`] = 0
            }

            if (compHasMentions && t.avg_position && t.avg_position > 0) {
              dayData[`${compName}_position`] = Math.max(0, Math.min(100, (1 - (t.avg_position - 1) / 9) * 100))
            } else {
              dayData[`${compName}_position`] = 0
            }

            dayData.competitors = Math.max(dayData.competitors, 1)
          }
        })

        dateMap.forEach((dayData) => {
          dayData.branded_prompts = Math.floor((dayData.prompts || 0) * 0.4)
          dayData.discovery_prompts = Math.floor((dayData.prompts || 0) * 0.6)
        })

        // Ensure all competitor keys exist in each day
        const allCompetitorNames = new Set<string>()
        filteredTimeseries.forEach((t: any) => {
          if (!t.is_primary && t.brand_name) allCompetitorNames.add(t.brand_name)
        })
        dateMap.forEach((dayData) => {
          allCompetitorNames.forEach((compName) => {
            for (const suffix of ['lvi', 'gsov', 'mentions', 'citations', 'sentiment', 'position', 'visibility', 'citation_rate', 'authority', 'discoverability']) {
              if (dayData[`${compName}_${suffix}`] === undefined) dayData[`${compName}_${suffix}`] = 0
            }
          })
        })

        data = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      }

      // Fallback: fetch from API if no reportData timeseries
      if (data.length === 0 && brandId) {
        data = await fetchAnalyticsData(brandId, filters)
      }

      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalyticsData([])
    } finally {
      setLoading(false)
    }
  }, [brandId, filters.dateRange.from, filters.dateRange.to, filters.promptType, filters.competitorBenchmark, selectedCompetitorsString, filters.selectedModel, reportData])

  const loadCompetitors = useCallback(async () => {
    try {
      let mappedCompetitors: MockCompetitor[] = []

      // Try reportData rankings first (new API structure)
      if (reportData?.rankings && Array.isArray(reportData.rankings)) {
        mappedCompetitors = reportData.rankings
          .filter((r: any) => !r.is_primary)
          .map((r: any, idx: number) => ({
            id: `comp-${idx}`,
            name: r.brand_name,
            color: defaultCompetitorColors[idx % defaultCompetitorColors.length] || '#6b7280'
          }))
      }

      // Fallback: extract from timeseries
      if (mappedCompetitors.length === 0 && reportData?.timeseries && Array.isArray(reportData.timeseries)) {
        const competitorBrands = reportData.timeseries
          .filter((t: any) => !t.is_primary)
          .map((t: any) => t.brand_name)
          .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)

        mappedCompetitors = competitorBrands.map((name: string, idx: number) => ({
          id: `comp-${idx}`,
          name,
          color: defaultCompetitorColors[idx % defaultCompetitorColors.length] || '#6b7280'
        }))
      }

      // Fallback: fetch from API
      if (mappedCompetitors.length === 0 && brandId) {
        try {
          const data = await cachedFetchJson(
            `/api/brands/${brandId}/competitors`,
            { credentials: 'include' },
            30_000
          )
          if ((data as any)?.success && Array.isArray((data as any)?.competitors)) {
            mappedCompetitors = (data as any).competitors.map((c: any, idx: number) => ({
              id: c.id || `comp-${idx}`,
              name: c.competitor_name || c.name || `Competitor ${idx + 1}`,
              color: defaultCompetitorColors[idx % defaultCompetitorColors.length] || '#6b7280'
            }))
          }
        } catch {
          // API may fail for public/shared reports
        }
      }

      setAvailableCompetitors(mappedCompetitors)

      if (mappedCompetitors.length > 0) {
        setFilters(prev => ({
          ...prev,
          competitorBenchmark: true,
          selectedCompetitors: mappedCompetitors.map(c => c.name)
        }))
      }
    } catch (error) {
      console.error('Error loading competitors:', error)
      setAvailableCompetitors([])
    }
  }, [brandId, reportData])

  const loadModels = useCallback(async () => {
    try {
      let models: string[] = []
      if (reportData?.timeseries && Array.isArray(reportData.timeseries)) {
        models = reportData.timeseries
          .map((t: any) => t.model_name)
          .filter((name: string, index: number, self: string[]) =>
            name && self.indexOf(name) === index
          )
          .sort()
      }
      setAvailableModels(models)
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    }
  }, [reportData])

  useEffect(() => { loadAnalyticsData() }, [loadAnalyticsData])
  useEffect(() => { loadCompetitors() }, [loadCompetitors])
  useEffect(() => { loadModels() }, [loadModels])

  // ─── Derived values ───

  const getMetricValue = (data: AnalyticsData, metric: keyof AnalyticsData): number => {
    if (filters.promptType === 'branded' && metric === 'prompts') return data.branded_prompts || 0
    if (filters.promptType === 'discovery' && metric === 'prompts') return data.discovery_prompts || 0
    if (metric === 'sentiment') return data.sentiment ?? data.brand_sentiment ?? 0
    if (metric === 'position') return data.position ?? 0
    if (metric === 'mentions') return data.brand_mentions || 0
    return (data[metric] as number) ?? 0
  }

  const selectedMetricConfig = METRICS_CONFIG.find(m => m.key === selectedMetric)!

  const displayData = useMemo(
    () => aggregateDataByPeriod(analyticsData, aggregationPeriod),
    [analyticsData, aggregationPeriod]
  )

  const showAllTime = isAllTimeRange(filters.dateRange)

  const currentValue = analyticsData.length > 0
    ? calculateAverage(analyticsData, selectedMetric, (d) => getMetricValue(d, selectedMetric))
    : 0

  const headerTrend = showAllTime
    ? { direction: 'stable' as const, percentage: 0, label: '' }
    : calculatePriorPeriodTrend(analyticsData, selectedMetric, (d) => getMetricValue(d, selectedMetric))

  const effectiveTrend = currentValue === 0
    ? { direction: 'stable' as const, percentage: 0, label: '' }
    : headerTrend

  // ─── Chart components ───

  const CustomLineLabel = (props: any) => {
    const { x, y, index, brandName, color, isLast } = props
    if (!isLast || index !== displayData.length - 1 || hoveredLine !== brandName) return null

    const getInitials = (name: string) => {
      if (name === "Avg") return "Avg"
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3)
    }

    return (
      <g>
        <circle cx={x} cy={y} r={16} fill={color} stroke="#fff" strokeWidth={2} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight="600">
          {getInitials(brandName)}
        </text>
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metric = METRICS_CONFIG.find(m => m.key === selectedMetric)

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

          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-300">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {typeof entry.value === 'number' && !isNaN(entry.value) ? entry.value.toFixed(1) : '0'}{metric?.unit}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="w-full">
        <ExternalAnalyticsFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableCompetitors={availableCompetitors}
          availableModels={availableModels}
        />
      </div>

      {/* Metric Cards */}
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {METRICS_CONFIG.map((metric) => {
              const isSelected = selectedMetric === metric.key
              const currentVal = analyticsData.length > 0
                ? calculateAverage(analyticsData, metric.key, (d) => getMetricValue(d, metric.key))
                : 0
              const metricShowAllTime = isAllTimeRange(filters.dateRange)
              const metricTrend = metricShowAllTime
                ? { direction: 'stable' as const, percentage: 0, label: '' }
                : calculatePriorPeriodTrend(analyticsData, metric.key, (d) => getMetricValue(d, metric.key))
              const effectiveMetricTrend = currentVal === 0
                ? { direction: 'stable' as const, percentage: 0, label: '' }
                : metricTrend
              const showPromptTypeBadge = metric.promptTypeSupported && filters.promptType !== 'all'

              return (
                <Tooltip key={metric.key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedMetric(metric.key)}
                      className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-black bg-white shadow-sm ring-1 ring-black/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon className={`h-4 w-4 ${isSelected ? 'text-black' : 'text-gray-500'}`} />
                        <div className="flex gap-1 items-center">
                          {showPromptTypeBadge && (
                            <Badge variant="outline" className="text-xs border-[#FF760D] text-[#FF760D]">
                              {filters.promptType === 'branded' ? 'B' : 'D'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-gray-900">
                          {typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal.toFixed(1) : '0'}{metric.unit}
                        </div>
                        <div className="text-xs font-medium text-gray-600">{metric.label}</div>
                        {!metricShowAllTime && (
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
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">{metric.label}</p>
                    <p className="text-sm text-gray-300">{metric.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card className="border border-gray-200 shadow-none bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/10">
                  <selectedMetricConfig.icon className="h-5 w-5 text-black" />
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
                    {filters.selectedModel && (
                      <span className="ml-2 text-blue-600 font-medium">
                        &bull; Filtered by model
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-1">
                  {typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue.toFixed(selectedMetric === 'authority' ? 1 : 0) : '0'}{selectedMetricConfig.unit}
                </div>
                {!showAllTime && (
                <div className="flex items-center sm:justify-end gap-1 text-sm">
                  {effectiveTrend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {effectiveTrend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {effectiveTrend.direction === 'stable' && <Minus className="h-4 w-4 text-gray-400" />}
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
            </div>

            {/* View by dropdown */}
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
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-[#FF760D] rounded-full"></div>
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
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(value) => {
                      if (aggregationPeriod !== 'day') {
                        return formatPeriodLabel(value, aggregationPeriod)
                      }
                      const date = new Date(value + 'T12:00:00') // noon avoids timezone day-shift
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    label={{ value: aggregationPeriod === 'day' ? 'Analysis Date' : aggregationPeriod.charAt(0).toUpperCase() + aggregationPeriod.slice(1), position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#6b7280', fontWeight: 600 } }}
                  />

                  <YAxis
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(value) => {
                      if (selectedMetric === 'authority') return value.toFixed(1)
                      if (['gsov', 'discoverability'].includes(selectedMetric)) return `${value}%`
                      return Math.round(value).toString()
                    }}
                    label={{
                      value: selectedMetricConfig.label,
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#6b7280', fontWeight: 600, textAnchor: 'middle' }
                    }}
                  />

                  <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 20 }} />

                  {filters.competitorBenchmark && <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px', zIndex: 1 }}
                    iconType="line"
                  />}

                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
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

                  {filters.competitorBenchmark && filters.selectedCompetitors.length > 0 && filters.selectedCompetitors.map((competitorName) => {
                    const competitor = availableCompetitors.find(c => c.name === competitorName)
                    const competitorColor = competitor?.color || '#9ca3af'
                    const dataKey = `${competitorName}_${selectedMetric}`

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
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
