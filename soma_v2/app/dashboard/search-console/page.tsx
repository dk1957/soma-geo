"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useBrand } from "@/lib/contexts/brand-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Link2,
  Unlink,
  Search,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  BarChart3,
  Loader2,
  Sparkles,
  Target,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  FileText,
  HelpCircle,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  ArrowRight,
  CircleDot,
  ChevronDown,
  X,
} from "lucide-react"
import { useToast } from "@/components/layout/notification-toast"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ---------- Types ----------

interface GSCConnection {
  id: string
  site_url: string
  is_active: boolean
  last_sync_at: string | null
  last_sync_status: 'success' | 'failed' | 'partial' | null
  sync_error: string | null
  connected_at?: string
}

interface GSCSite {
  siteUrl: string
  permissionLevel: string
}

interface PerformanceData {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface TopQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPageMetrics {
  pageUrl: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  queryCount: number
}

interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  totalQueries: number
  totalPages: number
  opportunityQueries: number
  pagesToOptimize: number
}

interface QueryClassification {
  branded: number
  question: number
  informational: number
  navigational: number
  total: number
}

interface CountryData {
  country: string
  clicks: number
  impressions: number
}

interface DeviceData {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface SitemapPage {
  url: string
  inspection: {
    verdict: string
    coverage_state: string
    last_crawl_time: string
    inspected_at: string
  } | null
}

interface QueryDetail {
  query: string
  pages: { pageUrl: string; clicks: number; impressions: number; ctr: number; position: number }[]
  trend: { date: string; clicks: number; impressions: number; position: number }[]
  totals: { clicks: number; impressions: number; avgCtr: number; avgPosition: number }
}

interface CompetitorEntry {
  domain: string
  appearances: number
  avgPosition: number
  queries: string[]
}

interface GapQueryResult {
  query: string
  intent: string
  brandFound: boolean
  brandPosition: number | null
  results: { position: number; title: string; link: string; snippet: string; domain: string }[]
}

interface CompetitiveGapData {
  brand: { name: string; domain: string }
  summary: { totalQueries: number; brandVisibleIn: number; gapCount: number; visibilityRate: number }
  gapQueries: GapQueryResult[]
  visibleQueries: GapQueryResult[]
  topCompetitors: CompetitorEntry[]
  analyzedAt?: string
  trend?: { visibilityRateChange: number; gapCountChange: number; previousDate: string } | null
}

interface GapHistoryEntry {
  id: string
  date: string
  totalQueries: number
  gapCount: number
  visibilityRate: number
}

interface InsightItem {
  url?: string
  query?: string
  clicks: number
  impressions: number
  prevClicks: number
  change: number
  isNew: boolean
  gain?: number
  loss?: number
}

interface InsightsData {
  period: { days: number; currentStart: string; prevStart: string }
  summary: { clicks: number; clicksChange: number; impressions: number; impressionsChange: number }
  content: { top: InsightItem[]; trendingUp: InsightItem[]; trendingDown: InsightItem[] }
  queries: { top: InsightItem[]; trendingUp: InsightItem[]; trendingDown: InsightItem[] }
}

type SortField = 'clicks' | 'impressions' | 'ctr' | 'position'
type SortDir = 'asc' | 'desc'

const QUERIES_PER_PAGE = 15
const COUNTRY_NAMES: Record<string, string> = {
  usa: '🇺🇸 United States', gbr: '🇬🇧 United Kingdom', deu: '🇩🇪 Germany', fra: '🇫🇷 France',
  ind: '🇮🇳 India', can: '🇨🇦 Canada', aus: '🇦🇺 Australia', bra: '🇧🇷 Brazil',
  nga: '🇳🇬 Nigeria', gha: '🇬🇭 Ghana', ken: '🇰🇪 Kenya', zaf: '🇿🇦 South Africa',
  are: '🇦🇪 UAE', sau: '🇸🇦 Saudi Arabia', jpn: '🇯🇵 Japan', kor: '🇰🇷 South Korea',
  mex: '🇲🇽 Mexico', esp: '🇪🇸 Spain', ita: '🇮🇹 Italy', nld: '🇳🇱 Netherlands',
  sgp: '🇸🇬 Singapore', phl: '🇵🇭 Philippines', idn: '🇮🇩 Indonesia', mys: '🇲🇾 Malaysia',
  tur: '🇹🇷 Turkey', pol: '🇵🇱 Poland', swe: '🇸🇪 Sweden', che: '🇨🇭 Switzerland',
  arg: '🇦🇷 Argentina', col: '🇨🇴 Colombia', egy: '🇪🇬 Egypt', tha: '🇹🇭 Thailand',
  pak: '🇵🇰 Pakistan', ukr: '🇺🇦 Ukraine', isr: '🇮🇱 Israel', nzl: '🇳🇿 New Zealand',
}
const DEVICE_ICONS: Record<string, typeof Monitor> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
}
const PIE_COLORS = ['#f97316', '#22c55e', '#f59e0b', '#94a3b8']

// ---------- Component ----------

export default function SearchConsolePage() {
  const { currentBrand } = useBrand()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { addToast } = useToast()

  // Core state
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [connection, setConnection] = useState<GSCConnection | null>(null)
  const [availableSites, setAvailableSites] = useState<GSCSite[]>([])
  const [selectedSite, setSelectedSite] = useState('')
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [topQueries, setTopQueries] = useState<TopQuery[]>([])
  const [topPages, setTopPages] = useState<GSCPageMetrics[]>([])
  const [opportunityQueries, setOpportunityQueries] = useState<TopQuery[]>([])
  const [pagesToOptimize, setPagesToOptimize] = useState<GSCPageMetrics[]>([])
  const [protectQueries, setProtectQueries] = useState<TopQuery[]>([])
  const [questionQueries, setQuestionQueries] = useState<TopQuery[]>([])
  const [brandedQueries, setBrandedQueries] = useState<TopQuery[]>([])
  const [queryClassification, setQueryClassification] = useState<QueryClassification | null>(null)
  const [countries, setCountries] = useState<CountryData[]>([])
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [summary, setSummary] = useState<GSCSummary | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSavingSite, setIsSavingSite] = useState(false)

  // Page Health state
  const [sitemapPages, setSitemapPages] = useState<SitemapPage[]>([])
  const [isFetchingSitemap, setIsFetchingSitemap] = useState(false)
  const [inspectingUrls, setInspectingUrls] = useState<Set<string>>(new Set())
  const [inspectionResults, setInspectionResults] = useState<Map<string, any>>(new Map())
  const [selectedHealthPages, setSelectedHealthPages] = useState<Set<string>>(new Set())
  const [isBulkInspecting, setIsBulkInspecting] = useState(false)
  const [bulkInspectProgress, setBulkInspectProgress] = useState({ done: 0, total: 0 })
  const bulkInspectAbortRef = useRef(false)

  // Performance chart
  const [dateRange, setDateRange] = useState('all')
  const [chartMetrics, setChartMetrics] = useState<Set<'clicks' | 'impressions'>>(new Set(['clicks']))
  const toggleChartMetric = (metric: 'clicks' | 'impressions') => {
    setChartMetrics(prev => {
      const next = new Set(prev)
      if (next.has(metric) && next.size > 1) {
        next.delete(metric)
      } else {
        next.add(metric)
      }
      return next
    })
  }

  // Query table controls
  const [querySearch, setQuerySearch] = useState('')
  const [querySortField, setQuerySortField] = useState<SortField>('clicks')
  const [querySortDir, setQuerySortDir] = useState<SortDir>('desc')
  const [queryPage, setQueryPage] = useState(1)

  // Pages table controls
  const [pageSearch, setPageSearch] = useState('')
  const [pageSortField, setPageSortField] = useState<SortField>('clicks')
  const [pageSortDir, setPageSortDir] = useState<SortDir>('desc')
  const [pagesPage, setPagesPage] = useState(1)

  // Query detail (expandable row)
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)
  const [queryDetail, setQueryDetail] = useState<QueryDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Competitive gap
  const [competitiveGap, setCompetitiveGap] = useState<CompetitiveGapData | null>(null)
  const [isRunningGap, setIsRunningGap] = useState(false)
  const [expandedGapQuery, setExpandedGapQuery] = useState<string | null>(null)
  const [gapHistory, setGapHistory] = useState<GapHistoryEntry[]>([])
  const [isLoadingGapCache, setIsLoadingGapCache] = useState(false)

  // Insights
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [contentSubTab, setContentSubTab] = useState<'top' | 'up' | 'down'>('top')
  const [querySubTab, setQuerySubTab] = useState<'top' | 'up' | 'down'>('top')

  const handledQueryRef = useRef<string | null>(null)
  const searchParamsString = searchParams.toString()

  // ---- OAuth callback handling ----
  useEffect(() => {
    if (handledQueryRef.current === searchParamsString) return

    const params = new URLSearchParams(searchParamsString)
    const success = params.get('success')
    const error = params.get('error')
    const selectSite = params.get('select_site')

    if (!success && !error && !selectSite) return
    handledQueryRef.current = searchParamsString

    if (success === 'connected') {
      addToast({ type: 'success', title: 'Connected!', message: 'Google Search connected. Choose your website then sync your data.' })
    }
    if (error) {
      addToast({ type: 'error', title: 'Connection Failed', message: decodeURIComponent(error) })
    }
    if (selectSite === 'true') {
      setActiveTab('settings')
      addToast({ type: 'info', title: 'Choose Website', message: 'Please choose which website to track.' })
    }

    params.delete('success')
    params.delete('error')
    params.delete('select_site')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [addToast, pathname, router, searchParamsString])

  // ---- Data fetching ----
  const fetchConnection = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/integrations/gsc?brand_id=${currentBrand.id}&days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setConnection(data.connection)
        setAvailableSites(data.sites || [])
        if (data.connection?.site_url && data.connection.site_url !== 'pending_selection') {
          setSelectedSite(data.connection.site_url)
        }
        if (data.performance) setPerformanceData(data.performance)
        if (data.topQueries) setTopQueries(data.topQueries)
        if (data.topPages) setTopPages(data.topPages)
        if (data.opportunityQueries) setOpportunityQueries(data.opportunityQueries)
        if (data.pagesToOptimize) setPagesToOptimize(data.pagesToOptimize)
        if (data.protectQueries) setProtectQueries(data.protectQueries)
        if (data.questionQueries) setQuestionQueries(data.questionQueries)
        if (data.brandedQueries) setBrandedQueries(data.brandedQueries)
        if (data.queryClassification) setQueryClassification(data.queryClassification)
        if (data.countries) setCountries(data.countries)
        if (data.devices) setDevices(data.devices)
        setSummary(data.summary || null)
        if (data.insights) setInsights(data.insights)
      }
    } catch (error) {
      console.error('Error fetching GSC connection:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentBrand?.id, dateRange])

  useEffect(() => { fetchConnection() }, [fetchConnection])

  // ---- Actions ----
  const connectGSC = async () => {
    if (!currentBrand?.id) {
      addToast({ type: 'error', title: 'Error', message: 'Please select a brand first.' })
      return
    }
    setIsConnecting(true)
    try {
      const response = await fetch('/api/integrations/gsc/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: currentBrand.id })
      })
      if (!response.ok) {
        const error = await response.json()
        addToast({ type: 'error', title: 'Error', message: error.error || 'Failed to start OAuth flow' })
        setIsConnecting(false)
        return
      }
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to connect to Google. Please try again.' })
      setIsConnecting(false)
    }
  }

  const disconnectGSC = async () => {
    if (!currentBrand?.id) return
    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/integrations/gsc', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrand.id })
      })
      if (response.ok) {
        setConnection(null)
        setPerformanceData([])
        setTopQueries([])
        setTopPages([])
        setOpportunityQueries([])
        setPagesToOptimize([])
        setProtectQueries([])
        setQuestionQueries([])
        setBrandedQueries([])
        setQueryClassification(null)
        setCountries([])
        setDevices([])
        setSummary(null)
        setAvailableSites([])
        setSelectedSite('')
        setSitemapPages([])
        setInspectionResults(new Map())
        addToast({ type: 'success', title: 'Disconnected', message: 'Google Search has been disconnected.' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to disconnect.' })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const saveSiteSelection = async () => {
    if (!currentBrand?.id || !selectedSite) {
      addToast({ type: 'error', title: 'Error', message: 'Please choose a website first.' })
      return
    }
    setIsSavingSite(true)
    try {
      const response = await fetch('/api/integrations/gsc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrand.id, site_url: selectedSite })
      })
      if (response.ok) {
        addToast({ type: 'success', title: 'Saved', message: 'Property saved. Syncing data now...' })
        if (connection) setConnection({ ...connection, site_url: selectedSite })
        await syncData()
      } else {
        const data = await response.json()
        addToast({ type: 'error', title: 'Error', message: data.error || 'Failed to save property selection.' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save site selection.' })
    } finally {
      setIsSavingSite(false)
    }
  }

  const syncData = async () => {
    if (!currentBrand?.id) return
    setIsSyncing(true)
    try {
      const response = await fetch('/api/integrations/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrand.id })
      })
      if (response.ok) {
        addToast({ type: 'success', title: 'Synced', message: 'Your search data has been updated.' })
        fetchConnection()
      } else {
        const data = await response.json()
        addToast({ type: 'error', title: 'Sync Failed', message: data.details ? `${data.error} ${data.details}` : (data.error || 'Failed to sync data.') })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to sync data.' })
    } finally {
      setIsSyncing(false)
    }
  }

  // ---- Page Health: sitemap + inspection ----
  const fetchSitemapPages = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsFetchingSitemap(true)
    try {
      const response = await fetch(`/api/integrations/gsc/sitemap?brand_id=${currentBrand.id}`)
      if (response.ok) {
        const data = await response.json()
        setSitemapPages(data.pages || [])
        // Pre-populate inspection results from ALL saved inspections (not just sitemap URLs)
        const results = new Map<string, any>()
        // First load all previously saved inspections from DB
        data.allInspections?.forEach((i: any) => {
          results.set(i.url, i)
        })
        // Then overlay any inspections embedded in sitemap pages
        data.pages?.forEach((p: SitemapPage) => {
          if (p.inspection) results.set(p.url, p.inspection)
        })
        setInspectionResults(prev => {
          const merged = new Map(prev)
          results.forEach((v, k) => merged.set(k, v))
          return merged
        })
      }
    } catch (err) {
      console.error('Error fetching sitemap pages:', err)
    } finally {
      setIsFetchingSitemap(false)
    }
  }, [currentBrand?.id])

  // Auto-fetch sitemap when switching to page-health tab
  useEffect(() => {
    if (activeTab === 'page-health' && sitemapPages.length === 0 && !isFetchingSitemap) {
      fetchSitemapPages()
    }
  }, [activeTab, sitemapPages.length, isFetchingSitemap, fetchSitemapPages])

  const inspectSingleUrl = async (url: string) => {
    if (!currentBrand?.id) return
    setInspectingUrls(prev => new Set(prev).add(url))
    try {
      const response = await fetch('/api/integrations/gsc/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrand.id, url })
      })
      if (response.ok) {
        const data = await response.json()
        setInspectionResults(prev => {
          const next = new Map(prev)
          next.set(url, {
            verdict: data.result?.indexStatusResult?.verdict,
            coverage_state: data.result?.indexStatusResult?.coverageState,
            last_crawl_time: data.result?.indexStatusResult?.lastCrawlTime,
            inspected_at: new Date().toISOString()
          })
          return next
        })
      } else {
        const data = await response.json()
        addToast({ type: 'error', title: 'Inspect Failed', message: data.error || 'Failed to inspect URL.' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to inspect URL.' })
    } finally {
      setInspectingUrls(prev => {
        const next = new Set(prev)
        next.delete(url)
        return next
      })
    }
  }

  // ---- Bulk inspect: run selected URLs sequentially ----
  const bulkInspectUrls = async (urls: string[]) => {
    if (!currentBrand?.id || urls.length === 0) return
    setIsBulkInspecting(true)
    setBulkInspectProgress({ done: 0, total: urls.length })
    bulkInspectAbortRef.current = false

    for (let i = 0; i < urls.length; i++) {
      if (bulkInspectAbortRef.current) break
      const url = urls[i]
      setInspectingUrls(prev => new Set(prev).add(url))
      try {
        const response = await fetch('/api/integrations/gsc/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: currentBrand.id, url })
        })
        if (response.ok) {
          const data = await response.json()
          setInspectionResults(prev => {
            const next = new Map(prev)
            next.set(url, {
              verdict: data.result?.indexStatusResult?.verdict,
              coverage_state: data.result?.indexStatusResult?.coverageState,
              last_crawl_time: data.result?.indexStatusResult?.lastCrawlTime,
              inspected_at: new Date().toISOString()
            })
            return next
          })
        }
      } catch {
        // continue to next URL on failure
      } finally {
        setInspectingUrls(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
        setBulkInspectProgress(prev => ({ ...prev, done: i + 1 }))
      }
    }

    setIsBulkInspecting(false)
    setSelectedHealthPages(new Set())
    addToast({ type: 'success', title: 'Bulk Inspection Complete', message: `Checked ${urls.length} pages.` })
  }

  // ---- Query detail fetching ----
  const fetchQueryDetail = useCallback(async (query: string) => {
    if (!currentBrand?.id) return
    if (expandedQuery === query) {
      setExpandedQuery(null)
      setQueryDetail(null)
      return
    }
    setExpandedQuery(query)
    setIsLoadingDetail(true)
    setQueryDetail(null)
    try {
      const response = await fetch(
        `/api/integrations/gsc/query-detail?brand_id=${currentBrand.id}&query=${encodeURIComponent(query)}`
      )
      if (response.ok) {
        const data = await response.json()
        setQueryDetail(data)
      }
    } catch (err) {
      console.error('Error fetching query detail:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [currentBrand?.id, expandedQuery])

  // ---- Competitive gap analysis ----
  const loadGapCache = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsLoadingGapCache(true)
    try {
      const response = await fetch(`/api/integrations/gsc/competitive-gap?brand_id=${currentBrand.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.latest) {
          setCompetitiveGap({ ...data.latest, trend: data.trend })
        }
        if (data.history) setGapHistory(data.history)
      }
    } catch (err) {
      console.error('Error loading gap cache:', err)
    } finally {
      setIsLoadingGapCache(false)
    }
  }, [currentBrand?.id])

  const runCompetitiveGap = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsRunningGap(true)
    try {
      const response = await fetch('/api/integrations/gsc/competitive-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrand.id }),
      })
      if (response.ok) {
        const data = await response.json()
        setCompetitiveGap(data)
      } else if (response.status === 429) {
        const err = await response.json()
        addToast({ type: 'info', title: 'Rate Limited', message: err.error || 'Please wait before running again.' })
        // Load cached data instead
        await loadGapCache()
      } else {
        const err = await response.json()
        addToast({ type: 'error', title: 'Analysis Failed', message: err.error || 'Could not run analysis.' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to run competitive gap analysis.' })
    } finally {
      setIsRunningGap(false)
    }
  }, [currentBrand?.id, addToast, loadGapCache])

  // Auto-load cached gap data when switching to the tab
  useEffect(() => {
    if (activeTab === 'competitive-gap' && !competitiveGap && !isRunningGap && !isLoadingGapCache) {
      loadGapCache()
    }
  }, [activeTab, competitiveGap, isRunningGap, isLoadingGapCache, loadGapCache])

  // ---- Derived data ----
  const hasValidProperty = connection?.site_url && connection.site_url !== 'pending_selection'

  // Performance data from API includes 2x the date range for period comparison
  // Filter to the selected range for display, matching GSC's convention:
  // end date = latest data available (capped at today-2 for GSC lag), start = end - days + 1
  const filteredPerformance = useMemo(() => {
    if (dateRange === 'all') return performanceData
    if (performanceData.length === 0) return performanceData
    const days = parseInt(dateRange)

    // GSC data typically lags ~2 days. Cap end date to match Google's display.
    const now = new Date()
    const maxEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2))
      .toISOString().split('T')[0]
    const latestData = performanceData.reduce((max, d) => d.date > max ? d.date : max, performanceData[0].date)
    const endStr = latestData <= maxEnd ? latestData : maxEnd

    const endDate = new Date(endStr + 'T00:00:00Z')
    const startDate = new Date(endDate)
    startDate.setUTCDate(startDate.getUTCDate() - days + 1)
    const startStr = startDate.toISOString().split('T')[0]

    return performanceData.filter(d => d.date >= startStr && d.date <= endStr)
  }, [performanceData, dateRange])

  const totalClicks = filteredPerformance.reduce((sum, d) => sum + d.clicks, 0)
  const totalImpressions = filteredPerformance.reduce((sum, d) => sum + d.impressions, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const avgPosition = filteredPerformance.length > 0
    ? filteredPerformance.reduce((sum, d) => sum + d.position, 0) / filteredPerformance.length
    : 0

  // Compare with previous period
  const prevPeriodStats = useMemo(() => {
    if (dateRange === 'all' || performanceData.length === 0) return null
    const days = parseInt(dateRange)

    // Same end date logic as filteredPerformance
    const now = new Date()
    const maxEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2))
      .toISOString().split('T')[0]
    const latestData = performanceData.reduce((max, d) => d.date > max ? d.date : max, performanceData[0].date)
    const endStr = latestData <= maxEnd ? latestData : maxEnd

    const endDate = new Date(endStr + 'T00:00:00Z')
    const currentStart = new Date(endDate)
    currentStart.setUTCDate(currentStart.getUTCDate() - days + 1)
    const currentStartStr = currentStart.toISOString().split('T')[0]

    // Previous period: same number of days immediately before current period
    const prevEnd = new Date(currentStart)
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setUTCDate(prevStart.getUTCDate() - days + 1)
    const prevStartStr = prevStart.toISOString().split('T')[0]
    const prevEndStr = prevEnd.toISOString().split('T')[0]

    const prev = performanceData.filter(d => d.date >= prevStartStr && d.date <= prevEndStr)
    if (prev.length === 0) return null
    const pClicks = prev.reduce((s, d) => s + d.clicks, 0)
    const pImpressions = prev.reduce((s, d) => s + d.impressions, 0)
    return { clicks: pClicks, impressions: pImpressions }
  }, [performanceData, dateRange])

  const clicksDelta = prevPeriodStats && prevPeriodStats.clicks > 0
    ? ((totalClicks - prevPeriodStats.clicks) / prevPeriodStats.clicks) * 100
    : null
  const impressionsDelta = prevPeriodStats && prevPeriodStats.impressions > 0
    ? ((totalImpressions - prevPeriodStats.impressions) / prevPeriodStats.impressions) * 100
    : null

  // Chart data
  const chartData = useMemo(() => {
    return filteredPerformance.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: d.clicks,
      impressions: d.impressions,
    }))
  }, [filteredPerformance])

  // Query classification pie data
  const classificationPieData = useMemo(() => {
    if (!queryClassification) return []
    return [
      { name: 'Question', value: queryClassification.question, color: '#6366f1' },
      { name: 'Informational', value: queryClassification.informational, color: '#22c55e' },
      { name: 'Branded', value: queryClassification.branded, color: '#f59e0b' },
      { name: 'Navigational', value: queryClassification.navigational, color: '#94a3b8' },
    ].filter(d => d.value > 0)
  }, [queryClassification])

  // All pages for health tab (merge topPages + sitemap)
  const allHealthPages = useMemo(() => {
    const pageMap = new Map<string, { url: string; clicks: number; impressions: number; inspection: any }>()

    // Add from topPages (GSC data)
    topPages.forEach(p => {
      pageMap.set(p.pageUrl, {
        url: p.pageUrl,
        clicks: p.clicks,
        impressions: p.impressions,
        inspection: inspectionResults.get(p.pageUrl) || null
      })
    })

    // Add from sitemap (may include pages with no GSC data)
    sitemapPages.forEach(p => {
      if (!pageMap.has(p.url)) {
        pageMap.set(p.url, {
          url: p.url,
          clicks: 0,
          impressions: 0,
          inspection: inspectionResults.get(p.url) || p.inspection
        })
      } else {
        // Update inspection data if we have it from sitemap
        const existing = pageMap.get(p.url)!
        if (!existing.inspection && (p.inspection || inspectionResults.get(p.url))) {
          existing.inspection = inspectionResults.get(p.url) || p.inspection
        }
      }
    })

    return Array.from(pageMap.values()).sort((a, b) => b.impressions - a.impressions)
  }, [topPages, sitemapPages, inspectionResults])

  // Query table: search, sort, paginate
  const processedQueries = useMemo(() => {
    let filtered = topQueries
    if (querySearch.trim()) {
      const term = querySearch.toLowerCase()
      filtered = filtered.filter(q => q.query.toLowerCase().includes(term))
    }
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[querySortField]
      const bVal = b[querySortField]
      return querySortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
    return filtered
  }, [topQueries, querySearch, querySortField, querySortDir])

  const totalQueryPages = Math.max(1, Math.ceil(processedQueries.length / QUERIES_PER_PAGE))
  const paginatedQueries = processedQueries.slice((queryPage - 1) * QUERIES_PER_PAGE, queryPage * QUERIES_PER_PAGE)

  // Pages tab: filter, sort, paginate
  const processedPages = useMemo(() => {
    const search = pageSearch.toLowerCase().trim()
    return topPages.filter(p =>
      !search || p.pageUrl.toLowerCase().includes(search)
    ).sort((a, b) => {
      const aVal = a[pageSortField]
      const bVal = b[pageSortField]
      return pageSortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [topPages, pageSearch, pageSortField, pageSortDir])

  const PAGES_PER_PAGE = 15
  const totalPagesPages = Math.max(1, Math.ceil(processedPages.length / PAGES_PER_PAGE))
  const paginatedPages = processedPages.slice((pagesPage - 1) * PAGES_PER_PAGE, pagesPage * PAGES_PER_PAGE)

  // Reset page on search/sort change
  useEffect(() => { setQueryPage(1) }, [querySearch, querySortField, querySortDir])
  useEffect(() => { setPagesPage(1) }, [pageSearch, pageSortField, pageSortDir])

  const togglePageSort = (field: SortField) => {
    if (pageSortField === field) {
      setPageSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setPageSortField(field)
      setPageSortDir('desc')
    }
  }

  const PageSortIcon = ({ field }: { field: SortField }) => {
    if (pageSortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return pageSortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
  }

  const toggleSort = (field: SortField) => {
    if (querySortField === field) {
      setQuerySortDir(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setQuerySortField(field)
      setQuerySortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (querySortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return querySortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
  }

  // ---- Render ----

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Disconnected state
  if (!connection?.is_active) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Search Performance</h1>
          <p className="text-muted-foreground mt-1">
            Understand how people find your brand in search engines
          </p>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-5">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Connect Your Website</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6 text-sm">
              See exactly what people search for to find your brand, which pages get the most attention, and where you have room to grow.
            </p>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={connectGSC} disabled={isConnecting}>
              {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              {isConnecting ? 'Connecting...' : 'Connect Google Search'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: HelpCircle, label: 'Discover What People Ask', desc: 'Find the questions people search for that relate to your brand — and where AI tools like ChatGPT get their answers.' },
            { icon: Sparkles, label: 'Find Growth Opportunities', desc: 'See which searches you appear in but aren\'t getting clicks — and fix that.' },
            { icon: Shield, label: 'Check Page Visibility', desc: 'Make sure Google can find all your pages so they show up in search results and AI answers.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-lg border border-dashed p-4">
              <Icon className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Search Performance</h1>
          <p className="text-muted-foreground mt-1">
            {hasValidProperty ? (
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {connection.site_url}
                <Badge variant="outline" className="ml-1 text-xs bg-green-500/10 text-green-600">Connected</Badge>
              </span>
            ) : (
              'Connect your website to see how it performs in search'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasValidProperty && (
            <>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 180 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={syncData} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sync
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Property selection needed */}
      {!hasValidProperty && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Choose Your Website
            </CardTitle>
            <CardDescription>
              Pick which website to track search performance for {currentBrand?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableSites.length > 0 ? (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSites.map((site) => (
                        <SelectItem key={site.siteUrl} value={site.siteUrl}>
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {site.siteUrl}
                            <Badge variant="outline" className="ml-1 text-xs">{site.permissionLevel}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-black hover:bg-gray-800 text-white" onClick={saveSiteSelection} disabled={!selectedSite || isSavingSite}>
                  {isSavingSite ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {isSavingSite ? 'Connecting...' : 'Connect Property'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No properties found. Refresh to check again.</p>
                <Button variant="outline" size="sm" onClick={fetchConnection}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {hasValidProperty && (
        <>
          {/* Compact stat row — 3 cards only */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Traffic */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Visitors from Search</p>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-2xl font-bold">{totalClicks.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">clicks</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-lg font-semibold">{totalImpressions.toLocaleString()}</span>
                    <span className="text-xs ml-1">impr.</span>
                  </div>
                </div>
                {clicksDelta !== null && (
                  <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${clicksDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {clicksDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(clicksDelta).toFixed(1)}% clicks vs prev period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AI Optimization Gap */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Untapped Opportunities</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold">{opportunityQueries.length}</span>
                  <span className="text-xs text-muted-foreground">
                    search terms where you could rank higher and get more traffic
                  </span>
                </div>
                {queryClassification && queryClassification.question > 0 && (
                  <p className="text-xs mt-1.5 flex items-center gap-1 text-orange-600">
                    <HelpCircle className="h-3 w-3" />
                    {queryClassification.question} question-type searches found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Content Footprint */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Your Reach</p>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-2xl font-bold">{summary?.totalPages || topPages.length}</span>
                    <span className="text-xs text-muted-foreground ml-1">pages</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-lg font-semibold">{summary?.totalQueries || topQueries.length}</span>
                    <span className="text-xs ml-1">queries</span>
                  </div>
                </div>
                <p className="text-xs mt-1.5 text-muted-foreground">
                  Avg position {avgPosition > 0 ? avgPosition.toFixed(1) : '—'} · {avgCtr.toFixed(1)}% CTR
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-gray-200 h-11 rounded-lg p-1 gap-1 w-full">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'queries', label: 'Search Terms' },
                { value: 'pages', label: 'Top Pages' },
                { value: 'page-health', label: 'Indexing' },
                { value: 'competitive-gap', label: 'Market Gaps' },
                { value: 'settings', label: 'Settings' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all flex-1"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ===== Overview Tab ===== */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Performance chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Search Performance</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant={chartMetrics.has('clicks') ? 'default' : 'ghost'}
                        size="sm"
                        className={chartMetrics.has('clicks') ? 'bg-black hover:bg-gray-800 text-white h-7 text-xs' : 'h-7 text-xs'}
                        onClick={() => toggleChartMetric('clicks')}
                      >
                        Clicks
                      </Button>
                      <Button
                        variant={chartMetrics.has('impressions') ? 'default' : 'ghost'}
                        size="sm"
                        className={chartMetrics.has('impressions') ? 'bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs' : 'h-7 text-xs'}
                        onClick={() => toggleChartMetric('impressions')}
                      >
                        Impressions
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} />
                        {chartMetrics.size > 1 ? (
                          <>
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickMargin={8} width={50} stroke="#000" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickMargin={8} width={50} stroke="#f97316" />
                          </>
                        ) : (
                          <YAxis tick={{ fontSize: 11 }} tickMargin={8} width={50} />
                        )}
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }} />
                        {chartMetrics.has('clicks') && (
                          <Line
                            type="monotone"
                            dataKey="clicks"
                            stroke="#000"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                            yAxisId={chartMetrics.size > 1 ? 'left' : undefined}
                          />
                        )}
                        {chartMetrics.has('impressions') && (
                          <Line
                            type="monotone"
                            dataKey="impressions"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                            yAxisId={chartMetrics.size > 1 ? 'right' : undefined}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">No performance data yet.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={syncData} disabled={isSyncing}>
                        {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sync Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Query Intelligence + Traffic Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Query Intelligence */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-orange-500" />
                      Query Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs">
                      What people search for to find you — question-type searches are key for AI visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {queryClassification && queryClassification.total > 0 ? (
                      <div className="flex items-start gap-4">
                        <div className="w-28 h-28 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={classificationPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={48}
                                dataKey="value"
                                strokeWidth={1}
                              >
                                {classificationPieData.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[
                            { label: 'Question queries', value: queryClassification.question, color: 'bg-orange-500', desc: 'AI engines answer these' },
                            { label: 'Informational', value: queryClassification.informational, color: 'bg-green-500', desc: 'High-value for AI' },
                            { label: 'Branded', value: queryClassification.branded, color: 'bg-amber-500', desc: 'Your brand terms' },
                            { label: 'Navigational', value: queryClassification.navigational, color: 'bg-gray-400', desc: 'Direct navigation' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="font-medium">{item.label}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold">{item.value}</span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({queryClassification.total > 0 ? Math.round((item.value / queryClassification.total) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Sync your data to see search term breakdown.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      Where Your Traffic Comes From
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Countries and devices driving your search traffic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {countries.length > 0 || devices.length > 0 ? (
                      <div className="space-y-3">
                        {/* Devices */}
                        {devices.length > 0 && (
                          <div className="flex items-center gap-3 pb-2 border-b">
                            {devices.map(d => {
                              const Icon = DEVICE_ICONS[d.device] || Monitor
                              const total = devices.reduce((s, x) => s + x.clicks, 0)
                              const pct = total > 0 ? Math.round((d.clicks / total) * 100) : 0
                              return (
                                <div key={d.device} className="flex items-center gap-1.5 text-sm">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{pct}%</span>
                                  <span className="text-xs text-muted-foreground capitalize">{d.device.toLowerCase()}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {/* Countries */}
                        {countries.length > 0 && (
                          <div className="space-y-1.5">
                            {countries.slice(0, 6).map(c => {
                              const name = COUNTRY_NAMES[c.country.toLowerCase()] || c.country
                              const maxClicks = countries[0]?.clicks || 1
                              return (
                                <div key={c.country} className="flex items-center gap-2 text-sm">
                                  <span className="w-36 truncate text-xs">{name}</span>
                                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-orange-500"
                                      style={{ width: `${Math.max(4, (c.clicks / maxClicks) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{c.clicks}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No traffic source data available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* AI Opportunities — the core GEO value */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      Growth Opportunities
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Search terms with high visibility but low clicks — improve these to get more traffic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {opportunityQueries.length > 0 ? (
                      <div className="space-y-2">
                        {opportunityQueries.slice(0, 5).map((q, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{q.query}</p>
                              <p className="text-xs text-muted-foreground">
                                Pos #{q.position.toFixed(0)} · {q.impressions.toLocaleString()} impr.
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => router.push(`/dashboard/prompts?suggest=${encodeURIComponent(q.query)}`)}
                            >
                              Add to Prompts
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        ))}
                        {opportunityQueries.length > 5 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('queries')}>
                            View all {opportunityQueries.length} opportunities
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Sync your data to discover growth opportunities.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Question Queries — most valuable for GEO */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-orange-500" />
                      Questions People Ask
                    </CardTitle>
                    <CardDescription className="text-xs">
                      The questions driving people to your site — AI engines prioritize answering these
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {questionQueries.length > 0 ? (
                      <div className="space-y-2">
                        {questionQueries.slice(0, 5).map((q, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{q.query}</p>
                              <p className="text-xs text-muted-foreground">
                                Pos #{q.position.toFixed(0)} · {q.impressions.toLocaleString()} impr. · {(q.ctr * 100).toFixed(1)}% CTR
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => router.push(`/dashboard/content?query=${encodeURIComponent(q.query)}`)}
                            >
                              Create Content
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        ))}
                        {questionQueries.length > 5 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('queries')}>
                            View all {questionQueries.length} question queries
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No question-type searches found yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Content + Query Insights (period comparison) */}
              {insights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Your Content */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Page Performance</CardTitle>
                      <CardDescription className="text-xs">How your pages are performing over the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1 mb-3">
                        {(['top', 'up', 'down'] as const).map(tab => (
                          <Button
                            key={tab}
                            variant={contentSubTab === tab ? 'default' : 'ghost'}
                            size="sm"
                            className={contentSubTab === tab ? 'bg-black hover:bg-gray-800 text-white h-7 text-xs' : 'h-7 text-xs'}
                            onClick={() => setContentSubTab(tab)}
                          >
                            {tab === 'top' ? 'Top' : tab === 'up' ? 'Trending Up' : 'Trending Down'}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {(contentSubTab === 'top' ? insights.content.top
                          : contentSubTab === 'up' ? insights.content.trendingUp
                          : insights.content.trendingDown
                        ).map((item, i) => {
                          const displayTitle = (() => {
                            try {
                              const path = new URL(item.url || '').pathname
                              return path === '/' ? 'Homepage' : decodeURIComponent(path.replace(/\/$/, '').split('/').pop() || '').replace(/[-_]/g, ' ')
                            } catch { return item.url || '' }
                          })()
                          const displayUrl = (() => {
                            try {
                              const u = new URL(item.url || '')
                              return `${u.hostname}${u.pathname}`
                            } catch { return item.url || '' }
                          })()
                          return (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate capitalize">{displayTitle}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{displayUrl}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <div className={`text-[11px] flex items-center gap-0.5 ${
                                  item.isNew ? 'text-orange-600'
                                    : item.change >= 0 ? 'text-green-600' : 'text-red-500'
                                }`}>
                                  {item.isNew ? (
                                    <span>New</span>
                                  ) : (
                                    <>
                                      {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                      {Math.abs(item.change)}%
                                    </>
                                  )}
                                </div>
                                <span className="text-sm font-bold tabular-nums w-8 text-right">{item.clicks}</span>
                              </div>
                            </div>
                          )
                        })}
                        {(contentSubTab === 'top' ? insights.content.top
                          : contentSubTab === 'up' ? insights.content.trendingUp
                          : insights.content.trendingDown
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">No data for this period.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Queries Leading to Your Site */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Search Terms Driving Traffic</CardTitle>
                      <CardDescription className="text-xs">What people search for to reach your site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1 mb-3">
                        {(['top', 'up', 'down'] as const).map(tab => (
                          <Button
                            key={tab}
                            variant={querySubTab === tab ? 'default' : 'ghost'}
                            size="sm"
                            className={querySubTab === tab ? 'bg-black hover:bg-gray-800 text-white h-7 text-xs' : 'h-7 text-xs'}
                            onClick={() => setQuerySubTab(tab)}
                          >
                            {tab === 'top' ? 'Top' : tab === 'up' ? 'Trending Up' : 'Trending Down'}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {(querySubTab === 'top' ? insights.queries.top
                          : querySubTab === 'up' ? insights.queries.trendingUp
                          : insights.queries.trendingDown
                        ).map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-muted/30 transition-colors">
                            <span className="text-sm font-medium truncate">{item.query}</span>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <div className={`text-[11px] flex items-center gap-0.5 ${
                                item.isNew ? 'text-orange-600'
                                  : item.change >= 0 ? 'text-green-600' : 'text-red-500'
                              }`}>
                                {item.isNew ? (
                                  <span>New</span>
                                ) : (
                                  <>
                                    {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs(item.change)}%
                                  </>
                                )}
                              </div>
                              <span className="text-sm font-bold tabular-nums w-8 text-right">{item.clicks}</span>
                            </div>
                          </div>
                        ))}
                        {(querySubTab === 'top' ? insights.queries.top
                          : querySubTab === 'up' ? insights.queries.trendingUp
                          : insights.queries.trendingDown
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">No data for this period.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick links to platform features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Technical SEO', desc: 'Check how AI-ready your website is', href: '/dashboard/technical-seo', icon: Eye },
                  { label: 'Content Optimization', desc: 'Create content that AI engines recommend', href: '/dashboard/content', icon: FileText },
                  { label: 'Prompt Testing', desc: 'See how AI responds to your search terms', href: '/dashboard/prompts', icon: Target },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.href)}
                    className="flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* ===== Queries Tab ===== */}
            <TabsContent value="queries" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Search Terms</CardTitle>
                      <CardDescription className="text-xs">{processedQueries.length} terms people use to find you</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter queries..."
                        value={querySearch}
                        onChange={e => setQuerySearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {paginatedQueries.length > 0 ? (
                    <>
                      <div className="grid grid-cols-[1fr_80px_100px_70px_70px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                        <span>Query</span>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => toggleSort('clicks')}>
                          Clicks <SortIcon field="clicks" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => toggleSort('impressions')}>
                          Impr. <SortIcon field="impressions" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => toggleSort('ctr')}>
                          CTR <SortIcon field="ctr" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => toggleSort('position')}>
                          Pos. <SortIcon field="position" />
                        </button>
                      </div>

                      <div className="divide-y">
                        {paginatedQueries.map((q, i) => {
                          const isExpanded = expandedQuery === q.query
                          return (
                            <div key={i}>
                              <button
                                className={`w-full grid grid-cols-[1fr_80px_100px_70px_70px] gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors items-center text-left ${
                                  isExpanded ? 'bg-muted/50' : ''
                                }`}
                                onClick={() => fetchQueryDetail(q.query)}
                              >
                                <span className="truncate font-medium flex items-center gap-1.5">
                                  <ChevronDown className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  {q.query}
                                </span>
                                <span className="text-right tabular-nums">{q.clicks.toLocaleString()}</span>
                                <span className="text-right tabular-nums">{q.impressions.toLocaleString()}</span>
                                <span className="text-right tabular-nums">{(q.ctr * 100).toFixed(1)}%</span>
                                <span className="text-right tabular-nums">{q.position.toFixed(1)}</span>
                              </button>

                              {/* Expanded detail panel */}
                              {isExpanded && (
                                <div className="bg-muted/30 border-t px-4 py-4 space-y-4">
                                  {isLoadingDetail ? (
                                    <div className="flex items-center justify-center py-6">
                                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : queryDetail ? (
                                    <>
                                      {/* Query header with actions */}
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-semibold text-sm">&ldquo;{queryDetail.query}&rdquo;</p>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {queryDetail.totals.clicks} clicks · {queryDetail.totals.impressions.toLocaleString()} impressions · Pos {queryDetail.totals.avgPosition.toFixed(1)}
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/dashboard/prompts?suggest=${encodeURIComponent(q.query)}`)
                                            }}
                                          >
                                            <Target className="h-3 w-3 mr-1" />
                                            Test in AI
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/dashboard/content?query=${encodeURIComponent(q.query)}`)
                                            }}
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            Create Content
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              window.open(`https://www.google.com/search?q=${encodeURIComponent(q.query)}`, '_blank')
                                            }}
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Search Google
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Trend mini-chart */}
                                      {queryDetail.trend.length > 1 && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Performance Trend</p>
                                          <ResponsiveContainer width="100%" height={120}>
                                            <LineChart data={queryDetail.trend.map(d => ({
                                              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                              clicks: d.clicks,
                                              impressions: d.impressions,
                                            }))}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={4} />
                                              <YAxis tick={{ fontSize: 10 }} width={35} />
                                              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e5e7eb' }} />
                                              <Line type="monotone" dataKey="clicks" stroke="#000" strokeWidth={1.5} dot={false} />
                                              <Line type="monotone" dataKey="impressions" stroke="#f97316" strokeWidth={1.5} dot={false} />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </div>
                                      )}

                                      {/* Pages that rank for this query */}
                                      {queryDetail.pages.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2">
                                            Pages ranking for this query ({queryDetail.pages.length})
                                          </p>
                                          <div className="rounded-lg border overflow-hidden">
                                            <div className="grid grid-cols-[1fr_70px_90px_60px_60px] gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50 border-b">
                                              <span>Page</span>
                                              <span className="text-right">Clicks</span>
                                              <span className="text-right">Impressions</span>
                                              <span className="text-right">CTR</span>
                                              <span className="text-right">Pos.</span>
                                            </div>
                                            {queryDetail.pages.map((page, pi) => {
                                              const displayPath = (() => {
                                                try { return new URL(page.pageUrl).pathname } catch { return page.pageUrl }
                                              })()
                                              return (
                                                <div key={pi} className="grid grid-cols-[1fr_70px_90px_60px_60px] gap-2 px-3 py-2 text-xs items-center border-b last:border-b-0">
                                                  <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="truncate" title={page.pageUrl}>{displayPath}</span>
                                                    <a
                                                      href={page.pageUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="shrink-0 text-muted-foreground hover:text-foreground"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                  </div>
                                                  <span className="text-right tabular-nums">{page.clicks}</span>
                                                  <span className="text-right tabular-nums">{page.impressions.toLocaleString()}</span>
                                                  <span className="text-right tabular-nums">{(page.ctr * 100).toFixed(1)}%</span>
                                                  <span className="text-right tabular-nums">{page.position.toFixed(1)}</span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {queryDetail.pages.length === 0 && queryDetail.trend.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                          No detailed data available for this query.
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      Failed to load query details.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {totalQueryPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t mt-2">
                          <p className="text-xs text-muted-foreground">
                            Page {queryPage} of {totalQueryPages}
                          </p>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setQueryPage(p => Math.max(1, p - 1))} disabled={queryPage === 1}>
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setQueryPage(p => Math.min(totalQueryPages, p + 1))} disabled={queryPage === totalQueryPages}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : topQueries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Search className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">No search term data available.</p>
                      <p className="text-xs">Sync your data to see what people search for.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No queries match &quot;{querySearch}&quot;</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Pages Tab ===== */}
            <TabsContent value="pages" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Your Top Pages</CardTitle>
                      <CardDescription className="text-xs">{processedPages.length} pages appearing in search results</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter pages..."
                        value={pageSearch}
                        onChange={e => setPageSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {paginatedPages.length > 0 ? (
                    <>
                      <div className="grid grid-cols-[1fr_80px_100px_70px_70px_70px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                        <span>Page URL</span>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => togglePageSort('clicks')}>
                          Clicks <PageSortIcon field="clicks" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => togglePageSort('impressions')}>
                          Impr. <PageSortIcon field="impressions" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => togglePageSort('ctr')}>
                          CTR <PageSortIcon field="ctr" />
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => togglePageSort('position')}>
                          Pos. <PageSortIcon field="position" />
                        </button>
                        <span className="text-right">Queries</span>
                      </div>

                      <div className="divide-y">
                        {paginatedPages.map((p, i) => {
                          const displayUrl = (() => {
                            try { return new URL(p.pageUrl).pathname } catch { return p.pageUrl }
                          })()
                          return (
                            <div key={i} className="grid grid-cols-[1fr_80px_100px_70px_70px_70px] gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors items-center">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium" title={p.pageUrl}>{displayUrl}</span>
                                <a href={p.pageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <span className="text-right tabular-nums">{p.clicks.toLocaleString()}</span>
                              <span className="text-right tabular-nums">{p.impressions.toLocaleString()}</span>
                              <span className="text-right tabular-nums">{(p.ctr * 100).toFixed(1)}%</span>
                              <span className="text-right tabular-nums">{p.position.toFixed(1)}</span>
                              <span className="text-right tabular-nums text-muted-foreground">{p.queryCount}</span>
                            </div>
                          )
                        })}
                      </div>

                      {totalPagesPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t mt-2">
                          <p className="text-xs text-muted-foreground">
                            Page {pagesPage} of {totalPagesPages}
                          </p>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPagesPage(p => Math.max(1, p - 1))} disabled={pagesPage === 1}>
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPagesPage(p => Math.min(totalPagesPages, p + 1))} disabled={pagesPage === totalPagesPages}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : topPages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">No page data available.</p>
                      <p className="text-xs">Sync your data to see page performance.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No pages match &quot;{pageSearch}&quot;</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Page Health Tab ===== */}
            <TabsContent value="page-health" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Indexing Status</CardTitle>
                      <CardDescription className="text-xs">
                        Google needs to index your pages before they can appear in search or be cited by AI. Check which pages are indexed.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSitemapPages}
                      disabled={isFetchingSitemap}
                    >
                      {isFetchingSitemap ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Refresh Sitemap
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {allHealthPages.length > 0 ? (
                    <>
                      {/* Summary bar */}
                      <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50 text-sm">
                        <span className="font-medium">{allHealthPages.length} pages found</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {allHealthPages.filter(p => p.inspection?.verdict === 'PASS').length} indexed
                        </span>
                        <span className="text-yellow-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {allHealthPages.filter(p => p.inspection && p.inspection.verdict !== 'PASS').length} issues
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CircleDot className="h-3 w-3" />
                          {allHealthPages.filter(p => !p.inspection).length} not checked
                        </span>
                      </div>

                      {/* Table */}
                      <div className="grid grid-cols-[28px_1fr_90px_80px_100px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                        <span>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 accent-orange-500"
                            checked={selectedHealthPages.size === allHealthPages.length && allHealthPages.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHealthPages(new Set(allHealthPages.map(p => p.url)))
                              } else {
                                setSelectedHealthPages(new Set())
                              }
                            }}
                          />
                        </span>
                        <span>Page URL</span>
                        <span className="text-center">Status</span>
                        <span className="text-right">Impressions</span>
                        <span className="text-right">Action</span>
                      </div>

                      <div className="divide-y max-h-[500px] overflow-y-auto">
                        {allHealthPages.map((page, i) => {
                          const displayUrl = (() => {
                            try { return new URL(page.url).pathname } catch { return page.url }
                          })()
                          const inspection = page.inspection
                          const isInspecting = inspectingUrls.has(page.url)
                          const isSelected = selectedHealthPages.has(page.url)

                          return (
                            <div key={i} className={`grid grid-cols-[28px_1fr_90px_80px_100px] gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors items-center ${isSelected ? 'bg-orange-50/50' : ''}`}>
                              <span>
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 accent-orange-500"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    setSelectedHealthPages(prev => {
                                      const next = new Set(prev)
                                      if (e.target.checked) next.add(page.url)
                                      else next.delete(page.url)
                                      return next
                                    })
                                  }}
                                />
                              </span>
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium" title={page.url}>{displayUrl}</span>
                                <a href={page.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                {inspection ? (
                                  <>
                                    {inspection.verdict === 'PASS' ? (
                                      <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Indexed
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Issue
                                      </Badge>
                                    )}
                                    {inspection.inspected_at && (
                                      <span className="text-[9px] text-muted-foreground">
                                        {new Date(inspection.inspected_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    Not checked
                                  </Badge>
                                )}
                              </div>
                              <span className="text-right tabular-nums text-muted-foreground">
                                {page.impressions > 0 ? page.impressions.toLocaleString() : '—'}
                              </span>
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => inspectSingleUrl(page.url)}
                                  disabled={isInspecting}
                                >
                                  {isInspecting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Search className="h-3 w-3 mr-1" />
                                      {inspection ? 'Re-check' : 'Inspect'}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Floating action bar */}
                      {(selectedHealthPages.size > 0 || isBulkInspecting) && (
                        <div className="sticky bottom-0 left-0 right-0 mt-3 p-3 bg-black text-white rounded-lg flex items-center justify-between gap-3 shadow-lg">
                          <div className="flex items-center gap-3 text-sm">
                            {isBulkInspecting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                                <span>Inspecting {bulkInspectProgress.done}/{bulkInspectProgress.total} pages...</span>
                                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                                    style={{ width: `${bulkInspectProgress.total > 0 ? (bulkInspectProgress.done / bulkInspectProgress.total) * 100 : 0}%` }}
                                  />
                                </div>
                              </>
                            ) : (
                              <span>{selectedHealthPages.size} page{selectedHealthPages.size !== 1 ? 's' : ''} selected</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isBulkInspecting ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-white hover:bg-white/20"
                                onClick={() => { bulkInspectAbortRef.current = true }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-white hover:bg-white/20"
                                  onClick={() => {
                                    const unchecked = allHealthPages.filter(p => !p.inspection).map(p => p.url)
                                    setSelectedHealthPages(new Set(unchecked))
                                  }}
                                >
                                  Select Unchecked ({allHealthPages.filter(p => !p.inspection).length})
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                  onClick={() => bulkInspectUrls(Array.from(selectedHealthPages))}
                                  disabled={selectedHealthPages.size === 0}
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Inspect Selected
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-white hover:bg-white/20"
                                  onClick={() => setSelectedHealthPages(new Set())}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : isFetchingSitemap ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-3" />
                      <p className="text-sm">Fetching sitemap and page data...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">No pages found.</p>
                      <p className="text-xs mb-3">Make sure your site has a sitemap.xml or sync your search data first.</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchSitemapPages}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Sitemap
                        </Button>
                        <Button variant="outline" size="sm" onClick={syncData} disabled={isSyncing}>
                          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Sync Data
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Competitive Gap Tab ===== */}
            <TabsContent value="competitive-gap" className="space-y-4 mt-4">
              {/* Header + Run button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Market Gap Analysis</CardTitle>
                      <CardDescription className="mt-1">
                        Find searches where potential customers look for what you offer, but your brand doesn’t show up yet.
                      </CardDescription>
                    </div>
                    <Button
                      className="bg-black hover:bg-gray-800 text-white"
                      onClick={runCompetitiveGap}
                      disabled={isRunningGap}
                    >
                      {isRunningGap ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Search className="h-4 w-4 mr-2" /> {competitiveGap ? 'Re-run Analysis' : 'Run Analysis'}</>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isRunningGap && (
                  <CardContent className="pt-0">
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Finding searches relevant to your brand...</p>
                      <p className="text-xs text-muted-foreground">We’re checking Google results for each search. This may take 30–60 seconds.</p>
                    </div>
                  </CardContent>
                )}

                {isLoadingGapCache && !competitiveGap && (
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground ml-2">Loading previous analysis...</span>
                    </div>
                  </CardContent>
                )}

                {!isRunningGap && !isLoadingGapCache && !competitiveGap && (
                  <CardContent className="pt-0">
                    <div className="flex flex-col items-center py-10 gap-2 text-center">
                      <Target className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground max-w-md">
                        We’ll check what potential customers are searching for and whether your brand shows up in the results.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click &quot;Run Analysis&quot; to discover where you’re missing out.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Results */}
              {competitiveGap && !isRunningGap && (
                <>
                  {/* Analyzed timestamp + trend */}
                  {competitiveGap.analyzedAt && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>Last analyzed: {new Date(competitiveGap.analyzedAt).toLocaleString()}</span>
                      {competitiveGap.trend && (
                        <span className={`flex items-center gap-1 ${
                          competitiveGap.trend.visibilityRateChange >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {competitiveGap.trend.visibilityRateChange >= 0
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(competitiveGap.trend.visibilityRateChange)}% visibility vs previous run
                        </span>
                      )}
                    </div>
                  )}

                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <Card className="py-3">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs text-muted-foreground">Queries Checked</p>
                        <p className="text-2xl font-bold">{competitiveGap.summary.totalQueries}</p>
                      </CardContent>
                    </Card>
                    <Card className="py-3">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs text-muted-foreground">You&apos;re Missing From</p>
                        <p className="text-2xl font-bold text-red-600">{competitiveGap.summary.gapCount}</p>
                        {competitiveGap.trend && competitiveGap.trend.gapCountChange !== 0 && (
                          <p className={`text-[10px] mt-0.5 ${competitiveGap.trend.gapCountChange < 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {competitiveGap.trend.gapCountChange > 0 ? '+' : ''}{competitiveGap.trend.gapCountChange} vs last run
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="py-3">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs text-muted-foreground">You Appear In</p>
                        <p className="text-2xl font-bold text-green-600">{competitiveGap.summary.brandVisibleIn}</p>
                      </CardContent>
                    </Card>
                    <Card className="py-3">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs text-muted-foreground">Visibility Rate</p>
                        <p className="text-2xl font-bold">{competitiveGap.summary.visibilityRate}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* History sparkline */}
                  {gapHistory.length > 1 && (
                    <Card className="py-3">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Visibility Rate History</p>
                        <div className="flex items-end gap-1 h-12">
                          {gapHistory.slice(0, 10).reverse().map((h, i) => (
                            <div
                              key={h.id}
                              title={`${new Date(h.date).toLocaleDateString()}: ${h.visibilityRate}%`}
                              className="flex-1 bg-black/80 rounded-t-sm transition-all hover:bg-black"
                              style={{ height: `${Math.max(4, h.visibilityRate)}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>{gapHistory.length > 1 ? new Date(gapHistory[gapHistory.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                          <span>{new Date(gapHistory[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gap queries - where brand is NOT ranking */}
                  {competitiveGap.gapQueries.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Queries Where You&apos;re Missing ({competitiveGap.gapQueries.length})
                        </CardTitle>
                        <CardDescription>Your brand doesn&apos;t appear in Google&apos;s top 10 for these relevant queries</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {competitiveGap.gapQueries.map((gq, i) => {
                            const isExpanded = expandedGapQuery === gq.query
                            return (
                              <div key={i} className="rounded-lg border">
                                <button
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                                  onClick={() => setExpandedGapQuery(isExpanded ? null : gq.query)}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    <span className="font-medium truncate">&ldquo;{gq.query}&rdquo;</span>
                                    <Badge variant="outline" className="text-[10px] shrink-0">{gq.intent}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 text-[10px]">Not ranking</Badge>
                                    <span className="text-xs text-muted-foreground">{gq.results.length} results</span>
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="border-t px-3 py-3 bg-muted/20 space-y-3">
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => router.push(`/dashboard/content?query=${encodeURIComponent(gq.query)}`)}
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        Create Content
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => router.push(`/dashboard/prompts?suggest=${encodeURIComponent(gq.query)}`)}
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Test in AI Engines
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(gq.query)}`, '_blank')}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View on Google
                                      </Button>
                                    </div>

                                    {/* Who's ranking */}
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Who&apos;s ranking instead</p>
                                      <div className="rounded-lg border overflow-hidden">
                                        <div className="grid grid-cols-[40px_1fr_1fr] gap-2 px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide bg-muted/50 border-b">
                                          <span>Pos</span>
                                          <span>Page</span>
                                          <span>Snippet</span>
                                        </div>
                                        {gq.results.slice(0, 5).map((r, ri) => (
                                          <div key={ri} className="grid grid-cols-[40px_1fr_1fr] gap-2 px-3 py-2 text-xs border-b last:border-b-0 items-start">
                                            <span className="font-mono font-bold text-muted-foreground">#{r.position}</span>
                                            <div className="min-w-0">
                                              <a
                                                href={r.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-orange-600 hover:underline truncate block"
                                              >
                                                {r.title}
                                              </a>
                                              <span className="text-[10px] text-muted-foreground">{r.domain}</span>
                                            </div>
                                            <span className="text-muted-foreground line-clamp-2">{r.snippet}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Visible queries - where brand IS ranking */}
                  {competitiveGap.visibleQueries.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Queries Where You Appear ({competitiveGap.visibleQueries.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {competitiveGap.visibleQueries.map((vq, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm">
                              <span className="font-medium">&ldquo;{vq.query}&rdquo;</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{vq.intent}</Badge>
                                {vq.brandPosition && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 text-[10px]">
                                    Position #{vq.brandPosition}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Competitors */}
                  {competitiveGap.topCompetitors.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top Competitors in Your Space</CardTitle>
                        <CardDescription>Domains that appear most frequently across your category search queries</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <div className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide bg-muted/50 border-b">
                            <span>Domain</span>
                            <span className="text-right">Appearances</span>
                            <span className="text-right">Avg Pos.</span>
                            <span>Ranking For</span>
                          </div>
                          {competitiveGap.topCompetitors.slice(0, 10).map((comp, ci) => (
                            <div key={ci} className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 px-3 py-2.5 text-sm border-b last:border-b-0 items-center">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs text-muted-foreground w-5">{ci + 1}.</span>
                                <a
                                  href={`https://${comp.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium truncate hover:underline"
                                >
                                  {comp.domain}
                                </a>
                              </div>
                              <span className="text-right tabular-nums font-medium">
                                {comp.appearances}/{competitiveGap.summary.totalQueries}
                              </span>
                              <span className="text-right tabular-nums">{comp.avgPosition}</span>
                              <div className="flex flex-wrap gap-1 min-w-0">
                                {comp.queries.slice(0, 3).map((q, qi) => (
                                  <Badge key={qi} variant="outline" className="text-[10px] truncate max-w-[140px]">
                                    {q}
                                  </Badge>
                                ))}
                                {comp.queries.length > 3 && (
                                  <Badge variant="outline" className="text-[10px]">+{comp.queries.length - 3}</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ===== Settings Tab ===== */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connection Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Manage your Google Search connection for {currentBrand?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm">Connected Website</Label>
                    {availableSites.length > 0 ? (
                      <div className="flex items-end gap-3 mt-2">
                        <div className="flex-1">
                          <Select value={selectedSite} onValueChange={setSelectedSite}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a property..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSites.map((site) => (
                                <SelectItem key={site.siteUrl} value={site.siteUrl}>
                                  <span className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    {site.siteUrl}
                                    <Badge variant="outline" className="ml-1 text-xs">{site.permissionLevel}</Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="bg-black hover:bg-gray-800 text-white"
                          onClick={saveSiteSelection}
                          disabled={!selectedSite || selectedSite === connection?.site_url || isSavingSite}
                        >
                          {isSavingSite ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          {isSavingSite ? 'Saving...' : 'Save & Sync'}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 p-4 rounded-lg border border-dashed text-center">
                        <p className="text-sm text-muted-foreground">No properties found.</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={fetchConnection}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Connection Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">Connected</Badge>
                      </div>
                      {connection?.connected_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Connected</span>
                          <span>{new Date(connection.connected_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {connection?.last_sync_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Sync</span>
                          <span>{new Date(connection.last_sync_at).toLocaleString()}</span>
                        </div>
                      )}
                      {connection?.last_sync_status && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sync Status</span>
                          <Badge variant="outline" className={
                            connection.last_sync_status === 'success'
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-red-500/10 text-red-600'
                          }>
                            {connection.last_sync_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-1 text-red-600">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Disconnecting removes all synced search data for this brand.
                    </p>
                    <Button variant="destructive" size="sm" onClick={disconnectGSC} disabled={isDisconnecting}>
                      {isDisconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
                      Disconnect Google Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
