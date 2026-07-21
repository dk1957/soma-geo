'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'

export interface UseReportDataOptions {
  reportId: string
  period?: '7d' | '30d' | '90d' | 'all'
  modelName?: string
  modelNames?: string[] // Support multiple models
  geography?: string[] // Geographic regions to filter by
  promptCategory?: string
  includeCompetitors?: boolean
  autoRefresh?: boolean
  refreshInterval?: number // ms
  enabled?: boolean // Allow disabling the hook
  publicAccessToken?: string // For public report access
  freeAuditToken?: string // For free audit public access
}

export interface ReportData {
  stats: Array<{
    brand_name: string
    is_primary: boolean
    lvi_score: number
    mention_rate: number
    citation_rate: number
    avg_sentiment: number
    avg_position: number
    share_of_voice: number
    total_responses: number
    total_mentions: number
    first_position_count: number
    top_3_count: number
    citation_count: number
  }>
  timeseries: Array<{
    metric_date: string
    lvi_score: number
    visibility_component: number
    citation_component: number
    sentiment_component: number
    position_component: number
    mention_rate: number
    citation_rate: number
    share_of_voice: number
    avg_sentiment: number
    avg_position: number
    total_responses: number
    total_mentions: number
    mention_count: number
    citation_count: number
    is_primary: boolean
    brand_name: string
    model_name?: string
  }>
  rankings: Array<{
    rank: number
    brand_name: string
    is_primary: boolean
    lvi_score: number
    mention_rate: number
    avg_sentiment: number
    share_of_voice: number
    avg_position: number
    total_mentions: number
    total_responses: number
    first_position_count: number
    citation_count: number
    lvi_change: number
    lvi_change_pct: number
    mention_rate_change: number
    mention_rate_change_pct: number
    sentiment_change: number
    sentiment_change_pct: number
    avg_position_change: number
    avg_position_change_pct: number
    share_of_voice_change: number
    share_of_voice_change_pct: number
  }>
  topicMatrix: {
    topics: string[]
    brands: string[]
    data: Array<{
      topic: string
      brand: string
      value: number
      sentiment: number
      relevance: number
    }>
  }
  prompts: {
    opportunities: Array<{
      prompt_id: string
      prompt_text: string
      prompt_category: string
      prompt_intent: string
      primary_mention_count: number
      competitor_mention_count: number
      opportunity_score: number
      total_responses: number
      competitors_mentioned: string[]
    }>
    threats: Array<{
      prompt_id: string
      prompt_text: string
      prompt_category: string
      primary_mention_count: number
      competitor_mention_count: number
      primary_avg_position: number
      competitor_avg_position: number
      competitors_mentioned: string[]
    }>
    strengths: Array<{
      prompt_id: string
      prompt_text: string
      prompt_category: string
      primary_mention_count: number
      primary_avg_position: number
      primary_avg_sentiment: number
      primary_sov: number
    }>
  }
  citations: Array<{
    source_domain: string
    source_type: string
    total_citations: number
    unique_responses_citing: number
    usage_frequency: number
    avg_citation_position: number
    first_citation_count: number
    brands_citing: string[]
    primary_brand_citations: number
    competitor_citations: number
    is_authoritative: boolean
    trust_score: number
    citationUrls?: Array<{ url: string; title?: string; type?: string }>
  }>
  citationOpportunities: Array<{
    source_domain: string
    source_type: string
    total_citations: number
    competitor_citations: number
    trust_score: number
    opportunity_score: number
    associated_topics: string[]
  }>
  topicOpportunities: Array<{
    topic_name: string
    topic_category: string
    mention_count: number
    relevance_score: number
    opportunity_score: number
    shared_with_competitors: string[]
  }>
  recentMentions: Array<{
    prompt_text: string
    brand_position: number | null
    gsov: number | null
    mentions: number
    model_name: string
    model_provider: string | null
    response_snippet: string | null
    mentioned_brands: Array<{ name: string; isPrimary: boolean }>
    sources_cited: Array<{ url: string; domain: string; title?: string }>
    analysis_date: string
    date: string
  }>
  metadata: {
    brand_name: string
    period: string
    start_date: string
    end_date: string
    total_responses: number
    total_prompts: number
    filters: {
      model?: string
      models?: string[]
      geography?: string[]
      category?: string
    }
    last_updated: string
    availableLocations?: string[]
    availableModels?: string[]
  }
}

export interface UseReportDataResult {
  data: ReportData | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  isValidating: boolean
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

/**
 * React hook for fetching comprehensive report data
 * Uses SWR for efficient data fetching and caching
 */
export function useReportData(options: UseReportDataOptions): UseReportDataResult {
  const { 
    reportId, 
    period = '30d',
    modelName,
    modelNames,
    geography,
    promptCategory,
    includeCompetitors = true,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    enabled = true, // Default to enabled
    publicAccessToken,
    freeAuditToken
  } = options

  // Build query string
  const queryParams = new URLSearchParams({
    period,
    ...(modelName && { model: modelName }),
    ...(promptCategory && { category: promptCategory }),
    includeCompetitors: String(includeCompetitors),
    ...(publicAccessToken && { public_access_token: publicAccessToken }),
    ...(freeAuditToken && { free_audit_token: freeAuditToken })
  })
  
  // Add multiple models as comma-separated list
  if (modelNames && modelNames.length > 0) {
    queryParams.set('models', modelNames.join(','))
  }
  
  // Add geography filter as comma-separated list
  if (geography && geography.length > 0) {
    queryParams.set('geography', geography.join(','))
  }
  
  // If disabled, pass null as the key to prevent fetching
  // Important: SWR will not fetch when key is null
  const url = enabled && reportId ? `/api/reports/${reportId}/data?${queryParams.toString()}` : null
  
  // Use SWR for data fetching with automatic revalidation
  const { data, error, mutate, isLoading, isValidating } = useSWR<ReportData>(
    url,
    fetcher,
    {
      refreshInterval: autoRefresh ? refreshInterval : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true, // Retry on error to handle transient failures
      errorRetryCount: 3, // Retry up to 3 times
      dedupingInterval: 5000 // Reduce deduping interval to allow faster retries if needed
    }
  )
  
  const refresh = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    data: data || null,
    isLoading,
    error: error || null,
    refresh,
    isValidating
  }
}

/**
 * Hook for fetching specific report sections
 */
export interface UseReportSectionOptions {
  reportId: string
  section: 'stats' | 'rankings' | 'timeseries' | 'topics' | 'sources' | 'prompts'
  params?: Record<string, string | number | boolean>
}

export function useReportSection<T = any>(options: UseReportSectionOptions) {
  const { reportId, section, params = {} } = options

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })

  const url = `/api/reports/${reportId}/${section}?${searchParams}`
  
  const { data, error, mutate, isLoading } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  })

  return {
    data: data || null,
    isLoading,
    error: error || null,
    refetch: mutate
  }
}

/**
 * Hook for triggering manual refresh of materialized views
 */
export function useReportRefresh(reportId: string) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const triggerRefresh = useCallback(async () => {
    if (!reportId || isRefreshing) return

    try {
      setIsRefreshing(true)
      setError(null)

      const response = await fetch(`/api/reports/${reportId}/refresh`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Refresh failed')
      }

      const result = await response.json()
      return result
    } catch (err) {
      console.error('Manual refresh error:', err)
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsRefreshing(false)
    }
  }, [reportId, isRefreshing])

  return {
    triggerRefresh,
    isRefreshing,
    error
  }
}

/**
 * Combined hook with refresh capability
 */
export function useReportDataWithRefresh(options: UseReportDataOptions) {
  const reportData = useReportData(options)
  const { triggerRefresh, isRefreshing } = useReportRefresh(options.reportId)

  const refreshAll = useCallback(async () => {
    await triggerRefresh()
    await reportData.refresh()
  }, [triggerRefresh, reportData])

  return {
    ...reportData,
    refreshAll,
    isRefreshing
  }
}

/**
 * useLVIScore Hook
 * 
 * Fetches just the LVI score and basic metrics
 */
export function useLVIScore(
  brandId: string,
  options?: {
    period?: '7d' | '30d' | '90d' | 'all'
    modelName?: string
    promptCategory?: string
    competitorId?: string
  }
) {
  const {
    period = '30d',
    modelName,
    promptCategory,
    competitorId
  } = options || {}
  
  const queryParams = new URLSearchParams({
    period,
    ...(modelName && { model: modelName }),
    ...(promptCategory && { category: promptCategory }),
    ...(competitorId && { competitorId })
  })
  
  const url = `/api/reports/${brandId}/lvi?${queryParams.toString()}`
  
  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  })
  
  return {
    lviScore: data,
    error,
    isLoading,
    refresh: mutate
  }
}

/**
 * useReportFilters Hook
 * 
 * Manages report filter state
 */
export function useReportFilters(initialFilters?: {
  period?: '7d' | '30d' | '90d' | 'all'
  modelName?: string
  promptCategory?: string
}) {
  const [filters, setFilters] = useState({
    period: initialFilters?.period || 'all' as '7d' | '30d' | '90d' | 'all',
    modelName: initialFilters?.modelName,
    promptCategory: initialFilters?.promptCategory
  })
  
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const resetFilters = useCallback(() => {
    setFilters({
      period: 'all',
      modelName: undefined,
      promptCategory: undefined
    })
  }, [])
  
  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters
  }
}

