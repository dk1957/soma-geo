"use client"

/**
 * External Brand Visibility Report - Modular Version
 * 
 * Professional client-facing report with dashboard-quality design.
 * Uses modular component architecture for maintainability.
 * 
 * Features:
 * - Sticky header with engagement metrics (shares, views)
 * - LVI trend chart and key metrics overview
 * - Brand-topic heatmap analysis
 * - Model performance rankings
 * - Charts (mention rate, sentiment distribution)
 * - Prompt-by-prompt analysis with collapsible sections
 * - Sources & citations table
 * - Key insights and recommendations
 * - Entity-type aware language (supports personalities, campaigns, etc.)
 * 
 * Design: Black headers, white/gray UI, #FF760D orange accents
 */

import React, { useEffect, useState } from 'react'
import { Activity, Info, ChevronDown, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useReportData } from '@/lib/hooks/useReportData'
import useSWR from 'swr'
import { 
  getEntityTerminology, 
  isPoliticalEntity, 
  isCommercialEntity,
  formatValueMetric,
  type EntityType 
} from '@/lib/utils/entity-language'
import { generateSmartInsights, generateSmartRecommendations } from '@/lib/utils/smart-insights-generator'

// Import modular components
import { Header } from '../external-report/header'
import { ExternalAnalyticsChart } from '../external-report/analytics-chart'
import { Heatmap } from '../external-report/heatmap'
import { IndustryRankings } from '../external-report/model-rankings'
import { Charts } from '../external-report/charts'
import { SourcesCitations } from '../external-report/sources-citations'
import { RecentMentions } from '../external-report/recent-mentions'
import { Insights } from '../external-report/insights'
import { StrategicInsightsReport } from '../external-report/strategic-insights-report'
import { SourceIntelligenceReport } from '../external-report/source-intelligence-report'
import { PromptPerformanceReport } from '../external-report/prompt-performance-report'

interface ExternalBrandVisibilityReportProps {
  report: any
  isPublicView?: boolean  // true for public shared reports, false for dashboard view
  period?: '7d' | '30d' | '90d' | 'all'
  publicAccessToken?: string // For public report access
  freeAuditToken?: string // For free audit public access
}

export function ExternalBrandVisibilityReportV4({ report, isPublicView = false, period = '30d', publicAccessToken, freeAuditToken }: ExternalBrandVisibilityReportProps) {
  // ============================================================================
  // ENTITY TYPE & TERMINOLOGY
  // ============================================================================
  const entityType = (report.entity_type || report.brand?.entity_type || 'company') as EntityType
  const t = getEntityTerminology(entityType)
  const isPolitical = isPoliticalEntity(entityType)
  const isCommercial = isCommercialEntity(entityType)

  // ============================================================================
  // FETCH DATA FROM NEW ANALYTICS APIS
  // ============================================================================
  
  // For public views, only fetch data if we have an access token
  // If no token, we'll show a preview version
  const shouldFetchData = !isPublicView || !!(isPublicView && publicAccessToken) || !!freeAuditToken
  
  // Debug logging
  console.log('🔍 ExternalBrandVisibilityReportV4 render:', {
    isPublicView,
    hasAccessToken: !!publicAccessToken,
    shouldFetchData,
    reportId: report.brand?.id || report.brand_id || report.id
  })
  
  const { data, isLoading, error } = useReportData({
    reportId: report.brand?.id || report.brand_id || report.id,
    period,
    includeCompetitors: true,
    autoRefresh: false,
    publicAccessToken: isPublicView ? publicAccessToken : undefined,
    freeAuditToken: freeAuditToken || undefined,
    enabled: shouldFetchData // Don't fetch if we're in public view without access token
  })

  // Fetch LLM-powered strategic insights for the brand (dashboard feature)
  const brandIdForInsights = report.brand_id || report.brand?.id || null
  const insightsFetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  }
  // Only fetch for authenticated (non-public) views or when we have a brand_id
  const { data: strategicAnalysis } = useSWR(
    brandIdForInsights && !isPublicView ? `/api/insights/strategic?brand_id=${brandIdForInsights}` : null,
    insightsFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  
  // ============================================================================
  // PREVIEW MODE - Show static preview when no access token
  // ============================================================================
  
  const isPreviewMode = isPublicView && !publicAccessToken && !freeAuditToken
  
  // Determine data source: API data or preview data
  let reportDataSource = data
  
  if (isPreviewMode) {
    // Use placeholder data for preview to show users what the report looks like
    const brandName = report.brand_name || report.brand?.name || 'Brand'
    
    // Generate 30 days of placeholder timeseries data
    const generatePlaceholderTimeseries = () => {
      const data = []
      const today = new Date()
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // Generate realistic fluctuating values with trends
        const baseVariation = Math.sin(i / 5) * 8 + Math.random() * 6
        const trendBoost = i * 0.3 // Slight upward trend over time
        
        data.push({
          metric_date: date.toISOString().split('T')[0],
          date: date.toISOString().split('T')[0],
          model_name: 'chatgpt',
          brand_name: brandName,
          is_primary: true,
          lvi_score: Math.min(100, 60 + baseVariation + trendBoost),
          visibility_component: Math.min(100, 55 + baseVariation + trendBoost),
          citation_component: Math.min(100, 40 + baseVariation),
          sentiment_component: Math.min(100, 65 + baseVariation),
          position_component: Math.min(100, 50 + baseVariation),
          mention_count: Math.floor(25 + baseVariation * 2),
          mention_rate: Math.min(100, 55 + baseVariation + trendBoost),
          citation_rate: Math.min(100, 40 + baseVariation),
          citation_count: Math.floor(18 + baseVariation * 1.5),
          avg_sentiment: Math.max(-1, Math.min(1, 0.55 + (Math.random() * 0.3 - 0.15))),
          avg_position: Math.max(1, 2.5 + (Math.random() - 0.5)),
          share_of_voice: Math.min(100, 28 + baseVariation),
          total_responses: Math.floor(40 + Math.random() * 10),
          total_mentions: Math.floor(25 + baseVariation * 2),
        })
      }
      
      return data
    }
    
    // Build a data structure with realistic placeholder values
    reportDataSource = {
      stats: [{
        brand_name: brandName,
        is_primary: true,
        lvi_score: 72.5,
        mention_rate: 68,
        citation_rate: 45,
        avg_sentiment: 0.72,
        avg_position: 2.8,
        share_of_voice: 34,
        total_responses: 1240,
        total_mentions: 843,
        first_position_count: 156,
        top_3_count: 487,
        citation_count: 558
      }],
      timeseries: generatePlaceholderTimeseries(),
      rankings: [],
      topicMatrix: { topics: [], brands: [], data: [] },
      prompts: { opportunities: [], threats: [], strengths: [] },
      citations: [],
      citationOpportunities: [],
      topicOpportunities: [],
      recentMentions: [],
      metadata: {
        brand_name: brandName,
        period: '30d',
        start_date: '',
        end_date: '',
        total_responses: 1240,
        total_prompts: 847,
        filters: {},
        last_updated: report.created_at || new Date().toISOString()
      }
    }
  }
  
  // ============================================================================
  // FALLBACK: Use stored report data when live API returns empty
  // Report generation stores data from llm_response_files, but the live
  // brand_appearances table dropped — live API returns empty; fallback to stored report data.
  // ============================================================================
  
  const hasLiveData = reportDataSource && (
    (reportDataSource.stats?.length > 0) || 
    (reportDataSource.rankings?.length > 0) || 
    (reportDataSource.timeseries?.length > 0)
  )
  
  if (!hasLiveData && !isPreviewMode && !isLoading) {
    const storedMetrics = report.metrics_data?.core_metrics
    const storedCharts = report.charts_data
    const storedRaw = report.raw_data
    const storedKeyFindings = report.key_findings
    const storedCompetitive = report.metrics_data?.competitive_analysis
    const storedModelPerf = report.metrics_data?.model_performance
    const brandName = report.brand_name || report.brand?.name || 'Brand'
    
    if (storedMetrics || storedRaw?.geo_analyses?.length > 0) {
      const totalAnalyses = storedKeyFindings?.total_analyses || storedRaw?.geo_analyses?.length || 0
      const totalMentions = storedKeyFindings?.total_brand_mentions || storedMetrics?.total_brand_mentions || 0
      const mentionRate = totalAnalyses > 0 ? (totalMentions / totalAnalyses) * 100 : 0
      const citationRate = (storedMetrics?.citation_performance?.citation_rate || 0) * 100
      const totalCitations = storedMetrics?.citation_performance?.total_citations || storedKeyFindings?.citation_performance?.total_citations || 0
      const avgSentiment = storedMetrics?.avg_sentiment ?? storedKeyFindings?.avg_sentiment ?? 0
      const avgPosition = storedMetrics?.ranking_performance?.avg_ranking || 0
      const lviScore = report.visibility_score || storedMetrics?.avg_lvi_score || storedKeyFindings?.avg_lvi_score || 0
      
      // Build timeseries from stored chart data
      const lviTimeline = storedCharts?.lvi_timeline || []
      const timeseriesData = lviTimeline.map((entry: any) => ({
        metric_date: entry.date,
        lvi_score: entry.lvi_score || 0,
        mention_rate: mentionRate,
        citation_rate: citationRate,
        avg_sentiment: avgSentiment,
        avg_position: avgPosition,
        share_of_voice: 0,
        total_responses: 1,
        total_mentions: entry.lvi_score > 0 ? 1 : 0,
        mention_count: entry.lvi_score > 0 ? 1 : 0,
        citation_count: 0,
        is_primary: true,
        brand_name: brandName,
        model_name: entry.model || 'unknown',
        visibility_component: 0,
        citation_component: 0,
        sentiment_component: 0,
        position_component: 0,
        first_position_count: 0,
        top_3_count: 0
      }))
      
      // Build rankings from stored competitive analysis
      const rankingsData: any[] = []
      // Add primary brand
      rankingsData.push({
        rank: 1,
        brand_name: brandName,
        is_primary: true,
        lvi_score: lviScore,
        mention_rate: mentionRate,
        avg_sentiment: avgSentiment,
        share_of_voice: 0,
        avg_position: avgPosition,
        total_mentions: totalMentions,
        total_responses: totalAnalyses,
        first_position_count: storedMetrics?.ranking_performance?.top_3_appearances || 0,
        citation_count: totalCitations,
        lvi_change: 0,
        lvi_change_pct: 0,
        mention_rate_change: 0,
        mention_rate_change_pct: 0,
        sentiment_change: 0,
        sentiment_change_pct: 0,
        avg_position_change: 0,
        avg_position_change_pct: 0,
        share_of_voice_change: 0,
        share_of_voice_change_pct: 0
      })
      // Add competitors
      if (storedCompetitive?.top_competitors) {
        storedCompetitive.top_competitors.forEach((comp: any, idx: number) => {
          rankingsData.push({
            rank: idx + 2,
            brand_name: comp.name,
            is_primary: false,
            lvi_score: 0,
            mention_rate: (comp.appearance_rate || 0) * 100,
            avg_sentiment: 0,
            share_of_voice: 0,
            avg_position: 0,
            total_mentions: comp.appearance_count || 0,
            total_responses: totalAnalyses,
            first_position_count: 0,
            citation_count: 0,
            lvi_change: 0,
            lvi_change_pct: 0,
            mention_rate_change: 0,
            mention_rate_change_pct: 0,
            sentiment_change: 0,
            sentiment_change_pct: 0,
            avg_position_change: 0,
            avg_position_change_pct: 0,
            share_of_voice_change: 0,
            share_of_voice_change_pct: 0
          })
        })
      }
      
      // Build recent mentions from raw_data
      const recentMentionsData = (storedRaw?.geo_analyses || []).slice(0, 20).map((a: any) => ({
        prompt_text: a.prompt_text || '',
        rank: a.rank_in_response || null,
        mentions: a.brand_mentions || 0,
        date: a.date || a.created_at || '',
        model_name: a.model || 'unknown'
      }))
      
      reportDataSource = {
        stats: [{
          brand_name: brandName,
          is_primary: true,
          lvi_score: lviScore,
          mention_rate: mentionRate,
          citation_rate: citationRate,
          avg_sentiment: avgSentiment,
          avg_position: avgPosition,
          share_of_voice: 0,
          total_responses: totalAnalyses,
          total_mentions: totalMentions,
          first_position_count: storedMetrics?.ranking_performance?.top_3_appearances || 0,
          top_3_count: storedMetrics?.ranking_performance?.top_3_appearances || 0,
          citation_count: totalCitations
        }],
        timeseries: timeseriesData,
        rankings: rankingsData,
        topicMatrix: { topics: [], brands: [], data: [] },
        prompts: { opportunities: [], threats: [], strengths: [] },
        citations: [],
        citationOpportunities: [],
        topicOpportunities: [],
        recentMentions: recentMentionsData,
        metadata: {
          brand_name: brandName,
          period: period || '30d',
          start_date: report.date_range_start || '',
          end_date: report.date_range_end || '',
          total_responses: totalAnalyses,
          total_prompts: totalAnalyses,
          filters: {},
          last_updated: report.generated_at || report.created_at || new Date().toISOString()
        }
      }
    }
  }
  
  // ============================================================================
  // LOADING STATE - Only show for non-preview mode
  // ============================================================================
  
  if (isLoading && !isPreviewMode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Report</h2>
          <p className="text-gray-600">Please wait while we prepare your brand visibility analysis...</p>
        </div>
      </div>
    )
  }
  
  // ============================================================================
  // ERROR STATE - Only show for non-preview mode
  // ============================================================================
  
  if (error && !isPreviewMode) {
    const isExpiredToken = error.message?.includes('Invalid') || error.message?.includes('expired')
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-4 border-b border-gray-100">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              {isExpiredToken ? (
                <Activity className="h-8 w-8 text-orange-600" />
              ) : (
                <Activity className="h-8 w-8 text-red-600" />
              )}
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {isExpiredToken ? 'Access Link Expired' : 'Unable to Load Report'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            {isExpiredToken ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your access link has expired for security reasons.
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  Please request a new link from the report owner.
                </p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                  Report: {report.brand_name || report.title || 'AI Visibility Report'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-red-600 mb-2">Failed to load report data</p>
                <p className="text-xs text-gray-500">{error.message}</p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Please try refreshing the page or contact support if the issue persists.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // ============================================================================
  // EMPTY STATE - No data available (skip for preview mode)
  // ============================================================================

  const hasData = reportDataSource && (reportDataSource.stats.length > 0 || reportDataSource.rankings.length > 0 || reportDataSource.timeseries.length > 0)

  if (!hasData && !isPreviewMode) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="border border-gray-200 shadow-none bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold text-black">
                {report.brand?.name || report.title || (isPolitical ? 'AI Visibility Report' : 'Visibility Report')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No analysis data available yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ============================================================================
  // COMPUTE DERIVED DATA FOR COMPONENTS
  // ============================================================================

  // Extract data from data source (API, fallback, or preview)
  const primaryStats = reportDataSource?.stats.find(s => s.is_primary) || reportDataSource?.stats[0]

  // Header data
  const headerData = {
    reportId: report.id,
    title: report.brand_name || report.brand?.name || report.title || (isPolitical ? 'AI Visibility Report' : `${t.entityName.charAt(0).toUpperCase() + t.entityName.slice(1)} Visibility Report`),
    description: isPolitical ? 'AI Discoverability & Public Influence Analysis' : 'AI Discoverability & Performance Analysis',
    classification: report.classification,
    generatedAt: report.generated_at || report.created_at || new Date().toISOString(),
    shares: report.shares_count || 0,
    views: report.views_count || 0,
    uniqueViews: report.unique_views,
    emailCaptures: report.email_captures,
    conversionRate: report.conversion_rate,
    shareUrl: report.share_url || report.public_url,
    brandName: report.brand_name || report.brand?.name || primaryStats?.brand_name || (isPolitical ? 'Public Figure' : t.entityName.charAt(0).toUpperCase() + t.entityName.slice(1)),
    brandLogo: report.brand?.logo || report.brand_logo,
    onShareCreated: report.onShareCreated,
    isPublicView,
  }
  const timeseries = reportDataSource?.timeseries || []
  const rankings = reportDataSource?.rankings || []
  const topicMatrix = reportDataSource?.topicMatrix || { topics: [], brands: [], data: [] }
  const prompts = reportDataSource?.prompts || { opportunities: [], threats: [], strengths: [] }
  const citations = reportDataSource?.citations || []
  const recentMentions = reportDataSource?.recentMentions || []
  
  // LVI time series data - use timeseries from API
  const lviData = timeseries.map(t => ({
    date: new Date(t.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    lvi: t.lvi_score || 0
  }))

  // Get the most recent timeseries data for the primary brand
  // This ensures consistency with what the analytics chart displays
  const primaryTimeseries = timeseries.filter(t => t.is_primary).sort((a, b) => 
    new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
  )
  const latestPrimaryData = primaryTimeseries[0] // Most recent day's data

  // Metrics overview data - prefer latest timeseries data for consistency with chart
  // Fall back to aggregated stats if no timeseries data available
  const mentionRate = latestPrimaryData?.mention_rate ?? primaryStats?.mention_rate ?? 0
  const lviScore = latestPrimaryData?.lvi_score ?? primaryStats?.lvi_score ?? 0
  const avgSentiment = latestPrimaryData?.avg_sentiment ?? primaryStats?.avg_sentiment ?? 0 // Already in -1 to 1 scale
  const avgRanking = rankings.findIndex(r => r.is_primary) + 1 || 0
  const totalCitations = latestPrimaryData?.citation_count ?? primaryStats?.citation_count ?? 0

  // Industry rankings data from rankings API
  const industryRankings = rankings.map(r => ({
    brand: r.brand_name || 'Unknown',
    isYourBrand: r.is_primary || false,
    isPrimary: r.is_primary || false,
    position: r.rank || 0,
    rank: r.rank || 0,
    avgPosition: r.avg_position || 0,
    avgPositionChangePct: r.avg_position_change_pct || 0,
    positionChange: r.avg_position_change_pct || 0,
    lvi: r.lvi_score || 0,
    lviChange: r.lvi_change || 0,
    lviChangePct: r.lvi_change_pct || 0,
    gSOV: r.share_of_voice || 0,
    gsov: r.share_of_voice || 0, // Alias
    gSOVChangePct: r.share_of_voice_change_pct || 0,
    sentiment: ((r.avg_sentiment || 0) + 1) * 50, // Convert from -1,1 to 0-100
    sentimentChange: (r.sentiment_change || 0) * 50, // Scale change to 0-100 range
    sentimentChangePct: r.sentiment_change_pct || 0,
    mentionRate: r.mention_rate || 0,
    mentionRateChange: r.mention_rate_change || 0,
    mentionRateChangePct: r.mention_rate_change_pct || 0,
    visibility: r.mention_rate || 0,
    visibilityChange: r.mention_rate_change || 0
  }))

  // Charts data - use rankings from API
  const mentionRateChartData = industryRankings.map(b => ({
    model: b.brand,
    "Mention Rate": b.visibility,
  }))

  // Calculate sentiment distribution from timeseries data
  const positiveCount = timeseries.filter(t => t.avg_sentiment > 0.3).length
  const negativeCount = timeseries.filter(t => t.avg_sentiment < -0.3).length
  const neutralCount = timeseries.length - positiveCount - negativeCount
  
  const sentimentDistribution = timeseries.length > 0 ? [
    { name: 'Positive', value: Math.round((positiveCount / timeseries.length) * 100) },
    { name: 'Neutral', value: Math.round((neutralCount / timeseries.length) * 100) },
    { name: 'Negative', value: Math.round((negativeCount / timeseries.length) * 100) },
  ] : [
    { name: 'Positive', value: 50 },
    { name: 'Neutral', value: 30 },
    { name: 'Negative', value: 20 },
  ]

  // Heatmap data - transform topicMatrix API data into component format
  const allTopics = topicMatrix.topics || []
  const topicMatrixRawData = topicMatrix.data || []
  
  // Get unique brands
  const uniqueBrands = [...new Set(topicMatrixRawData.map((d: any) => d.brand))]
  
  // Transform into brand-topic structure for heatmap component
  const brandTopicData = uniqueBrands.map((brandName: string) => {
    const brandData = topicMatrixRawData.filter((d: any) => d.brand === brandName)
    const topics: { [key: string]: number } = {}
    const topicSentiments: { [key: string]: number } = {}
    
    brandData.forEach((item: any) => {
      topics[item.topic] = item.value || 0
      topicSentiments[item.topic] = item.sentiment ?? 0
    })
    
    // Use multiple fallbacks to get the primary brand name
    const primaryBrandName = report.brand_name || report.brand?.name || primaryStats?.brand_name || reportDataSource?.metadata?.brand_name
    
    return {
      brand: brandName,
      isYourBrand: brandName === primaryBrandName,
      topics,
      topicSentiments,
    }
  })

  // Prompt analysis data - combine opportunities, threats, and strengths
  const allPrompts = [
    ...(prompts.opportunities || []).map(p => ({ ...p, isOpportunity: true, isThreat: false })),
    ...(prompts.threats || []).map(p => ({ ...p, isOpportunity: false, isThreat: true })),
    ...(prompts.strengths || []).map(p => ({ ...p, isOpportunity: false, isThreat: false }))
  ]
  
  const promptData = allPrompts
    .filter(p => p.prompt_text)
    .map(p => ({
      promptKey: p.prompt_id || (p.prompt_text || '').substring(0, 50).toLowerCase().replace(/\s+/g, '-'),
      promptText: p.prompt_text,
      category: p.prompt_category || 'general',
      intent: (p as any).prompt_intent || undefined,
      mentionRate: (((p as any).primary_mention_count || 0) / ((p as any).total_responses || 1)) * 100,
      avgSentiment: (p as any).primary_avg_sentiment || 0,
      avgPosition: (p as any).primary_avg_position || null,
      lviScore: (p as any).primary_brand_lvi || (p as any).brandLVI || 0,
      gSOV: (p as any).primary_sov || 0,
      totalResponses: (p as any).total_responses || (p as any).totalResponses || 0,
      citationCount: (p as any).primary_brand_citations || (p as any).brandCitations || 0,
      opportunityScore: (p as any).opportunity_score || 0,
      isOpportunity: p.isOpportunity || false,
      isThreat: p.isThreat || false,
      isStrength: !p.isOpportunity && !p.isThreat,
      topCompetitor: (p as any).top_competitor_name || (p as any).topCompetitor || null,
      competitorMentions: (p as any).top_competitor_mentions || (p as any).competitorMentions || 0,
      visibilityGap: (p as any).visibility_gap || (p as any).visibilityGap || 0,
      modelPerformance: (p as any).model_performance || (p as any).modelPerformance || undefined,
    }))

  // Sources & citations data - use all citations from API for rich source view
  const totalCitationCount = citations.reduce((s: number, c: any) => s + (c.total_citations || 0), 0)
  const sources = citations.map(c => {
    // Determine source type
    let sourceType = (c.source_type || 'industry').toLowerCase()
    const domainType = ((c as any).domain_type || '').toLowerCase()
    if (domainType === 'owned') sourceType = 'own'
    else if (domainType === 'competitor') sourceType = 'competitor'
    else if (sourceType === 'news' || sourceType === 'editorial') sourceType = 'news'
    else if (sourceType === 'academic') sourceType = 'academic'
    else if (sourceType === 'government' || sourceType === 'official' || sourceType === 'institutional') sourceType = 'government'
    else if (sourceType === 'blog' || sourceType === 'social' || sourceType === 'user-generated' || sourceType === 'ugc') sourceType = 'reference'
    
    return {
      domain: c.source_domain,
      type: sourceType,
      totalCitations: c.total_citations || 0,
      citationShare: totalCitationCount > 0 ? Math.round((c.total_citations / totalCitationCount) * 1000) / 10 : 0,
      authorityScore: (c as any).trust_score || 0,
      models: (c as any).models_citing || [],
      isOwnBrand: domainType === 'owned',
      isCompetitor: domainType === 'competitor',
      competitorName: (c as any).competitor_name || null,
      brandMentioned: c.primary_brand_citations > 0,
      usedPercentage: c.usage_frequency || 0,
      avgCitations: c.total_citations / Math.max(c.unique_responses_citing || 1, 1),
      isTargetPublisher: c.is_authoritative,
      citationUrls: c.citationUrls || [],
      brandsCiting: c.brands_citing || [],
    }
  })

  // Legacy sources format for backward compat with old SourcesCitations component
  const legacySources = sources.slice(0, 10).map(s => ({
    domain: s.domain,
    type: (s.isOwnBrand ? 'your-brand' : s.isCompetitor ? 'competitor' : s.type === 'news' ? 'news-media' : s.type) as any,
    totalCitations: s.totalCitations,
    usedPercentage: s.usedPercentage,
    avgCitations: s.avgCitations,
    citationUrls: s.citationUrls,
    brandsCiting: s.brandsCiting,
  }))

  // Top cited pages from citation URL data
  const topPagesList = citations
    .flatMap(c => (c.citationUrls || []).map((u: any) => ({
      url: u.url,
      title: u.title,
      domain: c.source_domain,
      citations: 1,
      domainType: c.source_type || null,
      brandMentioned: c.primary_brand_citations > 0,
      models: (c as any).models_citing || [],
    })))
    .reduce((acc: any[], page: any) => {
      const existing = acc.find(p => p.url === page.url)
      if (existing) { existing.citations++; return acc }
      acc.push(page)
      return acc
    }, [])
    .sort((a: any, b: any) => b.citations - a.citations)
    .slice(0, 20)

  // Competitive source gaps from citationOpportunities
  const competitiveSourceGaps = (reportDataSource?.citationOpportunities || []).slice(0, 15).map((co: any) => ({
    domain: co.source_domain,
    authority: co.trust_score || null,
    citations: co.total_citations || co.competitor_citations || 0,
    competitorName: (co.associated_topics || []).join(', ') || 'Competitor',
  }))

  // ============================================================================
  // SMART INSIGHTS GENERATION - Using contextual, data-driven generator
  // ============================================================================
  
  // Prepare data for smart insights generator
  const yourBrandRanking = industryRankings.find(r => r.isYourBrand)
  const topCompetitor = industryRankings.find(r => !r.isYourBrand && r.position === 2) || industryRankings[1]
  const allCompetitors = industryRankings.filter(r => !r.isYourBrand).slice(0, 5)
  const competitorsThreatening = allCompetitors.filter(c => c.visibilityChange > 5)
  
  // Get prompt analysis data
  const topPerformingPrompts = promptData.filter(p => p.mentionRate > 0.7 && p.isOpportunity)
  const underperformingPrompts = promptData.filter(p => p.isThreat || p.mentionRate < 0.3)
  const opportunities = promptData.filter(p => p.isOpportunity)
  const threats = promptData.filter(p => p.isThreat)
  
  // Get topic matrix data for contextual insights
  const topicMatrixData = reportDataSource?.topicMatrix?.data || []
  
  // Brand name for personalized insights
  const brandName = report.brand_name || report.brand?.name || 'Your Brand'
  
  // Generate smart, contextual insights using the new generator
  const smartInsightsInput = {
    entityType,
    brandName,
    yourBrandRanking: yourBrandRanking ? {
      brand: yourBrandRanking.brand,
      position: yourBrandRanking.position,
      positionChange: yourBrandRanking.positionChange,
      visibility: yourBrandRanking.visibility || 0,
      visibilityChange: yourBrandRanking.visibilityChange || 0,
      sentiment: yourBrandRanking.sentiment || 0
    } : undefined,
    allCompetitors: allCompetitors.map(c => ({
      brand: c.brand,
      position: c.position,
      positionChange: c.positionChange,
      visibility: c.visibility || 0,
      visibilityChange: c.visibilityChange || 0,
      sentiment: c.sentiment || 0
    })),
    topPerformingPrompts,
    underperformingPrompts,
    opportunities,
    threats,
    sources: sources.map((s: any) => ({
      domain: s.domain,
      type: s.type,
      usedPercentage: s.usedPercentage || 0,
      totalCitations: s.totalCitations || 0,
      brandsCiting: s.brandsCiting || []
    })),
    topicMatrix: topicMatrixData,
    topCompetitor: topCompetitor ? {
      brand: topCompetitor.brand,
      position: topCompetitor.position,
      positionChange: topCompetitor.positionChange,
      visibility: topCompetitor.visibility || 0,
      visibilityChange: topCompetitor.visibilityChange || 0,
      sentiment: topCompetitor.sentiment || 0
    } : undefined,
    competitorsThreatening: competitorsThreatening.map(c => ({
      brand: c.brand,
      position: c.position,
      positionChange: c.positionChange,
      visibility: c.visibility || 0,
      visibilityChange: c.visibilityChange || 0,
      sentiment: c.sentiment || 0
    }))
  }
  
  // Generate insights and recommendations using the smart generator
  const insights = generateSmartInsights(smartInsightsInput)
  const recommendations = generateSmartRecommendations(smartInsightsInput)

  // ============================================================================
  // RENDER MODULAR COMPONENTS
  // ============================================================================

  return (
    <div className="min-h-screen bg-white text-[15px]">
      {/* Header - Different styles for public vs dashboard view */}
      <Header {...headerData} />

      {/* Educational Banner - Only show in public view */}
      {isPublicView && (
        <Collapsible defaultOpen={false} className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-6">
            <CollapsibleTrigger className="w-full py-6 flex items-center justify-between hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-[#FF760D]" />
                <h2 className="text-xl font-bold text-gray-900">What is Answer Engine Optimization (AEO)?</h2>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="pb-8 pt-2">
                <p className="text-[15px] text-gray-600 leading-relaxed mb-6 max-w-4xl">
                  {isPolitical ? (
                    <>When {t.audience} ask AI assistants like ChatGPT, Claude, or Perplexity questions about candidates, policies, or leadership in your area, 
                    <span className="text-gray-900 font-semibold"> you need to appear in those answers</span>. This report shows you exactly how visible you are across major AI platforms and where you rank compared to {t.competitorPlural}.</>
                  ) : (
                    <>When {t.potentialAudience} ask AI assistants like ChatGPT, Claude, or Perplexity questions about {t.entityNamePlural} or solutions in your industry, 
                    <span className="text-gray-900 font-semibold"> your {t.entityName} needs to appear in those answers</span>. This report shows you exactly how visible your {t.entityName} is across major AI platforms and where you rank compared to {t.competitorPlural}.</>
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                    <div className="text-4xl font-bold text-[#FF760D] mb-2">70%</div>
                    <div className="text-[15px] text-gray-600">
                      {isPolitical ? `of ${t.audience} now use AI to research candidates` : `of ${t.audience} now use AI to research ${t.engagementNoun}`}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                    <div className="text-4xl font-bold text-[#FF760D] mb-2">45%</div>
                    <div className="text-[15px] text-gray-600">
                      {isPolitical ? 'growth in AI-assisted research decisions' : 'growth in AI-assisted decisions'}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                    <div className="text-4xl font-bold text-[#FF760D] mb-2">Top 3</div>
                    <div className="text-[15px] text-gray-600">
                      {isPolitical ? `AI mentions capture 80% of ${t.audienceSingular} attention` : `AI mentions capture 80% of ${t.audienceSingular} attention`}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        
        {/* Executive Summary - Only show in public view */}
        {isPublicView && (
          <section className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden">
            <div className="bg-black text-white px-6 py-5">
              <h2 className="text-xl font-semibold">Executive Summary</h2>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {report.brand_name || (isPolitical ? 'Your' : 'Your Brand')} AI Visibility Overview
                  </h3>
                  <p className="text-[15px] text-gray-700 leading-relaxed">
                    {lviScore >= 75 ? (
                      `Strong AI presence with an LVI Score of ${lviScore.toFixed(1)}/100. ${isPolitical ? 'You appear' : `Your ${t.entityName} appears`} consistently across major AI platforms with ${mentionRate.toFixed(0)}% mention rate in relevant searches.`
                    ) : lviScore >= 50 ? (
                      `Moderate AI visibility with an LVI Score of ${lviScore.toFixed(1)}/100. Significant opportunity exists to improve your ${mentionRate.toFixed(0)}% mention rate and ${isPolitical ? 'reach more voters' : `capture more ${t.marketShare}`}.`
                    ) : (
                      `Limited AI visibility with an LVI Score of ${lviScore.toFixed(1)}/100. Critical need to establish presence across AI platforms where ${mentionRate.toFixed(0)}% mention rate indicates missed opportunities.`
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{isPolitical ? 'Polling Position' : 'Competitive Position'}</div>
                    <div className="text-base font-bold text-gray-900 mb-1">
                      {yourBrandRanking ? (
                        yourBrandRanking.rank <= 3 ? 'Top 3 - Leading' : 
                        yourBrandRanking.rank <= 5 ? 'Top 5 - Strong' : 
                        yourBrandRanking.rank <= 10 ? 'Top 10 - Competitive' : 'Outside Top 10'
                      ) : 'Not Ranked'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {yourBrandRanking ? `Ranked #${yourBrandRanking.rank} among ${industryRankings.length} ${t.competitorPlural}` : 'Insufficient data for ranking'}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Key Opportunity</div>
                    <div className="text-base font-bold text-gray-900 mb-1">
                      {mentionRate < 50 ? `Increase ${isPolitical ? 'Visibility' : `${t.entityName.charAt(0).toUpperCase() + t.entityName.slice(1)} Mentions`}` : 
                       totalCitations < 10 ? 'Build Citation Authority' : 
                       avgSentiment < 75 ? `Improve ${isPolitical ? 'Public' : t.entityName.charAt(0).toUpperCase() + t.entityName.slice(1)} Perception` : 'Maintain Leadership'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {mentionRate < 50 ? `Currently mentioned in ${mentionRate.toFixed(0)}% of searches - target 70%+` : 
                       totalCitations < 10 ? `${totalCitations} citations - increase authoritative backlinks` : 
                       avgSentiment < 75 ? `Sentiment at ${avgSentiment.toFixed(0)}/100 - optimize messaging` : 
                       'Focus on defending current position'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#FF760D]/5 border-l-4 border-[#FF760D] rounded-r-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    <strong className="text-gray-900">Bottom Line:</strong> {recommendations.filter(r => r.impact === 'high').length > 0 ? (
                      `Implement the ${recommendations.filter(r => r.impact === 'high').length} high-priority recommendations below to capture ${Math.min(100 - mentionRate, 40).toFixed(0)}+ percentage points of additional market visibility within 90 days.`
                    ) : (
                      'Your AI visibility is well-established. Focus on maintaining position and monitoring competitive threats identified in this report.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Analytics Chart & Metrics - Show for both views */}
        <ExternalAnalyticsChart 
          brandId={report.brand_id || report.brand?.id || ''} 
          dateRange={period}
          reportData={{
            ...report,
            stats: {
              lvi: lviScore,
              mentionRate,
              avgSentiment,
              totalCitations,
              avgRanking,
            },
            lviData,
            sentimentDistribution,
            timeseries, // Pass raw timeseries data from API
          }}
        />

        {/* Industry Rankings */}
        <IndustryRankings rankings={industryRankings} />

        {/* Brand-Topic Heatmap */}
        {brandTopicData.length > 0 && (
          <Heatmap data={brandTopicData} allTopics={allTopics} />
        )}

        {/* Prompt Performance - Rich per-query analysis */}
        {promptData.length > 0 && (
          <PromptPerformanceReport prompts={promptData} brandName={brandName} />
        )}

        {/* Recent Chats */}
        <RecentMentions
          mentions={recentMentions.map(m => ({
            promptText: m.prompt_text,
            responseSnippet: (m as any).response_snippet,
            brandPosition: (m as any).brand_position,
            mentionedBrands: (m as any).mentioned_brands || [],
            modelName: m.model_name,
            modelProvider: (m as any).model_provider,
            sourcesCited: (m as any).sources_cited || [],
            date: (m as any).analysis_date || m.date
          }))}
        />

        {/* Source Intelligence - Rich domain analysis */}
        <SourceIntelligenceReport
          sources={sources}
          topPages={topPagesList}
          competitiveGaps={competitiveSourceGaps}
          totalCitations={totalCitationCount}
        />

        {/* Strategic Insights & Recommendations */}
        <StrategicInsightsReport
          insights={insights}
          recommendations={recommendations}
          strategicAnalysis={strategicAnalysis || null}
        />

        {/* Methodology Section - Only show in public view */}
        {isPublicView && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-black text-white px-6 py-4">
              <h2 className="text-lg font-light flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Measurement Methodology
              </h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">What We Measured</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  This report analyzes how {report.brand_name || (isPolitical ? 'you' : `your ${t.entityName}`)} {isPolitical ? 'appear' : 'appears'} in AI-generated responses across major platforms. 
                  We measured visibility, positioning, sentiment, and competitive performance to give you a comprehensive view 
                  of your AI discoverability.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">AI Models Tested</div>
                  <div className="text-sm text-gray-900">ChatGPT, Claude, Gemini, Perplexity, Grok</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Analysis Period</div>
                  <div className="text-sm text-gray-900">Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : 'available period'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Prompts Analyzed</div>
                  <div className="text-sm text-gray-900">{recentMentions.length}+ industry-relevant queries</div>
                </div>
              </div>

              <div className="bg-[#FF760D]/5 border border-[#FF760D]/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#FF760D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why This Matters
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isPolitical ? (
                    `With 70% of ${t.audience} now using AI for research, your AI visibility directly impacts public reach and ${t.valueMetric}. ${t.entityNamePlural.charAt(0).toUpperCase() + t.entityNamePlural.slice(1)} that rank in the top 3 AI responses capture 80% of ${t.audienceSingular} attention. This report gives you the actionable insights needed to optimize your position and stay ahead of ${t.competitorPlural}.`
                  ) : (
                    `With 70% of ${t.audience} now using AI for research, your AI visibility directly impacts pipeline and ${t.valueMetric}. ${t.entityNamePlural.charAt(0).toUpperCase() + t.entityNamePlural.slice(1)} that rank in the top 3 AI responses capture 80% of ${t.audienceSingular} attention. This report gives you the actionable insights needed to optimize your position and stay ahead of ${t.competitorPlural}.`
                  )}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-900">Data Credibility:</strong> All metrics are derived from live AI model responses using 
                  industry-standard prompts and verified extraction methods. Rankings and sentiment scores are calculated using proprietary 
                  algorithms that account for mention frequency, positioning, context, and citation quality. Report generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </p>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Footer - Only show in public view */}
      {isPublicView && (
      <footer className="bg-black text-white mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Soma AI Logo - Inverted for dark background */}
              <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-sm font-bold text-black">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white">Soma AI</span>
                <span className="text-xs text-gray-400 font-medium tracking-wider">GEO PLATFORM</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">
                © {new Date().getFullYear()} Soma AI. All rights reserved.
              </p>
              <p className="text-xs text-gray-500">
                Confidential and for authorized use only.
              </p>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
