"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Eye, 
  Target, 
  Globe,
  Star,
  Users,
  BarChart3,
  Search,
  Award,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Shield,
  Rocket,
  ArrowRight,
  Building,
  MessageSquare,
  TrendingDown,
  ExternalLink,
  Crown,
  Zap,
  Brain,
  ChevronRight,
  Info,
  RefreshCw,
  Calendar,
  MapPin,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  X,
  Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { StrategicInsights } from '@/components/dashboard/overview/strategic-insights'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Enhanced interfaces for analytics
interface BrandAnalytics {
  brand_info: {
    brand_id: string
    brand_name: string
    total_responses: number
    total_mentions: number
    analysis_period: {
      start: string
      end: string
    }
  }
  lvi_metrics: {
    overall_lvi: number
    lvi_by_model: Array<{
      model_name: string
      lvi_score: number
      response_count: number
      mention_count: number
      mention_rate: number
      avg_sentiment: number
      avg_position: number
      citation_count: number
      competitor_mentions: number
    }>
    lvi_by_prompt: Array<{
      prompt_id: string
      prompt_text: string
      lvi_score: number
      response_count: number
      mention_count: number
      model_scores: Array<{
        model_name: string
        lvi_score: number
        brand_mentioned: boolean
        raw_response?: string
      }>
    }>
    lvi_components: {
      mention_frequency: number
      position_quality: number
      citation_authority: number
      sentiment_quality: number
      competitive_position: number
      platform_coverage: number
    }
  }
  share_of_voice: {
    overall_share: number
    share_by_model: Array<{
      model_name: string
      total_mentions: number
      brand_mentions: number
      competitor_mentions: number
      share_percentage: number
    }>
    share_by_prompt: Array<{
      prompt_id: string
      prompt_text: string
      total_responses: number
      brand_mentions: number
      expected_mentions: number
      total_brand_mentions_in_prompt: number
      share_percentage: number
      mention_rate: number
      missed_opportunities: number
    }>
    competitor_comparison: Array<{
      competitor_name: string
      mentions: number
      share_percentage: number
      avg_sentiment: number
    }>
  }
  source_analysis: {
    citations_by_prompt: Array<{
      prompt_id: string
      prompt_text: string
      citations: Array<{
        url: string
        domain: string
        authority_score: number
        model_name: string
        relevance_score: number
      }>
    }>
    top_domains: Array<{
      domain: string
      citation_count: number
      avg_authority: number
      models_used: string[]
    }>
    authority_distribution: {
      high_authority: number
      medium_authority: number
      low_authority: number
    }
  }
  competitive_analysis: {
    direct_competitors: string[]
    discovered_brands: string[]
    market_position_score: number
    competitor_positioning?: Array<{
      name: string
      mentions: number
      models: string[]
      avg_position: number
      co_mentions_with_brand: number
      avg_sentiment: number
      co_mention_rate: number
    }>
    detailed_competitor_analysis?: Array<{
      name: string
      mention_count: number
      avg_position: number
      prominence_score: number
      models_mentioned_in: string[]
      model_count: number
      avg_sentiment: number
      co_mention_rate: number
      citation_count: number
      unique_source_domains: string[]
      source_count: number
      threat_level: 'low' | 'medium' | 'high'
      market_share_estimate: number
    }>
    sentiment_analysis?: Array<{
      model_name: string
      avg_sentiment: number
      sentiment_distribution: {
        positive: number
        neutral: number
        negative: number
      }
      total_sentiment_scores: number
    }>
    citation_analysis?: {
      total_citations: number
      avg_citations_per_response: number
      citation_types: Record<string, number>
      avg_authority_score: number
      high_authority_citations: number
    }
  }
  trends: {
    lvi_trend: number
    mention_trend: number
    sentiment_trend: number
  }
  quality_metrics?: {
    avg_completeness: number
    avg_accuracy: number
    avg_relevance: number
    mention_rate: number
    avg_sentiment: number
  }
}

interface ExecutiveBrandVisibilityReportProps {
  brandName: string
  brandId?: string
  brandDescription?: string
  industry?: string
  targetMarkets?: string[]
  isOnboarding?: boolean
  isFreeAudit?: boolean
  analytics?: BrandAnalytics // Allow direct data injection for onboarding
  runData?: any // Support run data from onboarding
  onBack?: () => void
  onStartOver?: () => void
  onSignOut?: () => void
}

// AI Model Display Names and Icons
const ModelDisplayNames: Record<string, { name: string; icon: string }> = {
  'openai/gpt-4o-mini:online': { name: 'ChatGPT', icon: '/models/chatgpt-logo.png' },
  'meta-llama/llama-4-8b-instruct:online': { name: 'Llama', icon: '/models/meta-logo.svg' },
  'google/gemini-2.5-flash:online': { name: 'Gemini', icon: '/models/gemini-logo.png' },
  'x-ai/grok-3-mini:online': { name: 'Grok', icon: '/models/grok-logo.png' },
  'perplexity/sonar': { name: 'Perplexity', icon: '/models/perplexity-logo.png' }
}

// Performance level indicators
const getPerformanceLevel = (score: number): { label: string; color: string; icon: React.ReactNode } => {
  if (score >= 80) return { 
    label: 'Excellent', 
    color: 'emerald',
    icon: <Crown className="h-4 w-4 text-emerald-600" />
  }
  if (score >= 60) return { 
    label: 'Good', 
    color: 'blue',
    icon: <TrendingUp className="h-4 w-4 text-blue-600" />
  }
  if (score >= 40) return { 
    label: 'Fair', 
    color: 'yellow',
    icon: <Eye className="h-4 w-4 text-yellow-600" />
  }
  if (score >= 20) return { 
    label: 'Poor', 
    color: 'orange',
    icon: <AlertTriangle className="h-4 w-4 text-orange-600" />
  }
  return { 
    label: 'Critical', 
    color: 'red',
    icon: <TrendingDown className="h-4 w-4 text-red-600" />
  }
}

export default function ExecutiveBrandVisibilityReport({ 
  brandName,
  brandId,
  brandDescription,
  industry,
  targetMarkets = [],
  isOnboarding = false,
  isFreeAudit: isFreeAuditProp = false,
  analytics: directAnalytics, // Direct data for onboarding
  runData,
  onBack,
  onStartOver,
  onSignOut
}: ExecutiveBrandVisibilityReportProps) {
  // Disable the free audit gate on localhost for development
  const isFreeAudit = isFreeAuditProp && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')

  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(directAnalytics || null)
  const [loading, setLoading] = useState(!directAnalytics && !runData && !!brandId)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['performance-snapshot', 'swot-analysis', 'action-recommendations']))

  // Insight engine state (server-powered recommendations from all data sources)
  const [engineInsights, setEngineInsights] = useState<Array<{
    id: string
    action: string
    insight: string
    metrics: Array<{ label: string; value: string; warn?: boolean }>
    impact: 'critical' | 'high' | 'medium'
    category: 'visibility' | 'content' | 'citations' | 'competitive' | 'sentiment' | 'technical' | 'seo'
    source: 'response-analysis' | 'audit' | 'gsc' | 'cross-reference'
  }> | null>(null)
  const [insightSources, setInsightSources] = useState<{
    responseAnalysis: boolean
    discoverabilityAudit: boolean
    searchConsole: boolean
  } | null>(null)

  // Fetch analytics data only if no direct data provided and brandId exists
  useEffect(() => {
    // If direct analytics or run data provided, use that
    if (directAnalytics) {
      setAnalytics(directAnalytics)
      setLoading(false)
      return
    }

    if (runData) {
      // Convert run data to analytics format
      // This would need implementation based on run data structure
      setLoading(false)
      return
    }

    if (!brandId) {
      setLoading(false)
      return
    }

    // Only fetch if we don't have any data
    if (!analytics) {
      const fetchAnalytics = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/analytics/brand?brandId=${brandId}&includeCompetitors=true`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch analytics: ${response.statusText}`)
          }
          
          const data = await response.json()
          setAnalytics(data)
          setError(null)
        } catch (err) {
          console.error('Analytics fetch error:', err)
          setError(err instanceof Error ? err.message : 'Failed to load analytics')
        } finally {
          setLoading(false)
        }
      }

      fetchAnalytics()
    }
  }, [brandId, directAnalytics, runData, analytics])

  // Update analytics when direct analytics prop changes
  useEffect(() => {
    if (directAnalytics) {
      setAnalytics(directAnalytics)
    }
  }, [directAnalytics])

  // Fetch insight engine data (server-powered recommendations from all data sources)
  useEffect(() => {
    if (!brandId || isOnboarding) return
    const fetchInsights = async () => {
      try {
        const response = await fetch(`/api/insights/engine?brand_id=${brandId}`)
        if (response.ok) {
          const data = await response.json()
          setEngineInsights(data.insights || [])
          setInsightSources(data.dataSources || null)
        }
      } catch (err) {
        console.error('Insight engine fetch error:', err)
      }
    }
    fetchInsights()
  }, [brandId, isOnboarding])

  // Get model logo
  const getModelLogo = (modelName: string) => {
    const model = modelName.toLowerCase()
    if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) {
      return '/models/chatgpt-logo.png'
    }
    if (model.includes('claude')) {
      return '/models/claude-logo.png'
    }
    if (model.includes('gemini')) {
      return '/models/gemini-logo.png'
    }
    if (model.includes('perplexity')) {
      return '/models/perplexity-logo.png'
    }
    if (model.includes('grok')) {
      return '/models/grok-logo.png'
    }
    if (model.includes('llama') || model.includes('meta')) {
      return '/models/meta-logo.svg'
    }
    return null
  }

  // Calculate derived metrics
  const displayData = analytics
  const overallLVI = displayData?.lvi_metrics.overall_lvi || 0
  const performanceLevel = getPerformanceLevel(overallLVI)
  // Use market position data from API competitive analysis
  const marketPositionScore = displayData?.competitive_analysis.market_position_score || 0
  const topCompetitors = displayData?.share_of_voice.competitor_comparison.slice(0, 3) || []
  const aiCoverage = displayData?.lvi_metrics.lvi_by_model.length || 0
  // Calculate coverage percentage based on actual data rather than hardcoded max
  const totalAvailableModels = 5 // This could come from API config
  const coveragePercentage = aiCoverage > 0 ? (aiCoverage / totalAvailableModels) * 100 : 0

  // Share of Voice — presence-based using competitive_density (pre-computed by aggregator)
  // SOV = avg across all responses of (1/competitive_density if mentioned, 0 if not)
  // Use pre-aggregated value from API; fall back to overall_share
  const calculateShareOfVoice = () => {
    return displayData?.share_of_voice?.overall_share ?? 0
  }
  // Calculate sentiment score from the analytics data
  const calculateSentimentScore = () => {
    if (displayData?.quality_metrics?.avg_sentiment == null) return 0 // No data
    // Convert from -1 to +1 scale to 0-10 scale
    return Math.max(0, Math.min(10, (displayData.quality_metrics.avg_sentiment + 1) * 5))
  }
  
  const sentimentScore = calculateSentimentScore()
  const hasMentions = (displayData?.brand_info?.total_mentions ?? 0) > 0
  const shareOfVoicePercentage = calculateShareOfVoice()

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Show loading state for analytics
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              Loading your visibility report...
            </p>
            <p className="text-sm text-slate-500">
              Analyzing {brandName} across AI platforms
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center space-y-4 pt-6">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Unable to Generate Report
              </h3>
              <p className="text-slate-600 dark:text-slate-300">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If no analytics data available, show fallback message
  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center space-y-4 pt-6">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                No Analytics Data Available
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Analytics data is being prepared for {brandName}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Sets the tone: "This brand has been analyzed"
         ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-16">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Badge className="bg-white/10 text-white border-white/20 text-xs font-medium tracking-wide">
                AI VISIBILITY REPORT
              </Badge>
              <span className="text-gray-500 text-sm">
                Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

          </div>

          {/* Brand name + headline */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              {brandName}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              Every day, potential customers ask ChatGPT, Gemini, and Grok for recommendations in your industry. Here&apos;s what they&apos;re being told about {brandName} — and what they&apos;re not.
            </p>
          </div>

          {/* 4 Key Metrics — large, confident, scannable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* LVI Score */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-gray-400 uppercase tracking-wide font-medium">Visibility Score</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-500 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border border-gray-700">
                    <p className="font-medium mb-1">Language Model Visibility Index</p>
                    <p className="text-sm text-gray-300">Measures how often and prominently your brand appears in AI-generated responses — the higher, the more discoverable you are.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{overallLVI.toFixed(1)}</div>
              <div className={`text-sm font-medium ${
                overallLVI >= 60 ? 'text-emerald-400' : overallLVI >= 30 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {performanceLevel.label}
              </div>
            </div>

            {/* Share of Voice */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-gray-400 uppercase tracking-wide font-medium">Share of Voice</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-500 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border border-gray-700">
                    <p className="font-medium mb-1">Share of Voice (SOV)</p>
                    <p className="text-sm text-gray-300">Your average share of the conversation across AI responses. For each response, your share equals 1 ÷ total brands mentioned. Averaged across all responses including those where you weren't mentioned.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{shareOfVoicePercentage.toFixed(0)}%</div>
              <div className="text-sm text-gray-400">vs. competitors</div>
            </div>

            {/* Sentiment */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-gray-400 uppercase tracking-wide font-medium">Brand Sentiment</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-500 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border border-gray-700">
                    <p className="font-medium mb-1">How AI talks about you</p>
                    <p className="text-sm text-gray-300">Sentiment score from 0–10. Measures whether AI descriptions of your brand are positive, neutral, or negative.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                {hasMentions 
                  ? <>{sentimentScore.toFixed(1)}<span className="text-lg text-gray-500">/10</span></>
                  : <span className="text-gray-500">N/A</span>
                }
              </div>
              <div className={`text-sm font-medium ${
                !hasMentions ? 'text-gray-500' :
                sentimentScore >= 7 ? 'text-emerald-400' : sentimentScore >= 4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {!hasMentions ? 'No mentions' : sentimentScore >= 7 ? 'Positive' : sentimentScore >= 4 ? 'Neutral' : 'Negative'}
              </div>
            </div>

            {/* Recommendation Score */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[13px] text-gray-400 uppercase tracking-wide font-medium">Recommended</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-500 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border border-gray-700">
                    <p className="font-medium mb-1">AI Recommendation Rate</p>
                    <p className="text-sm text-gray-300">How often AI actively recommends your brand when users ask for suggestions — not just mentions you, but endorses you.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{((displayData as any)?.recommendation_score || 0)}%</div>
              <div className={`text-sm font-medium ${
                ((displayData as any)?.recommendation_score || 0) >= 30 ? 'text-emerald-400' : ((displayData as any)?.recommendation_score || 0) >= 10 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {((displayData as any)?.recommendation_score || 0) >= 30 ? 'Actively endorsed' : ((displayData as any)?.recommendation_score || 0) >= 10 ? 'Sometimes suggested' : 'Rarely recommended'}
              </div>
            </div>
          </div>
        </div>

        {/* Report metadata strip */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
            <p className="text-center text-gray-500 text-sm">
              Based on {displayData?.brand_info.total_responses.toLocaleString() || '0'} AI responses · {displayData?.lvi_metrics.lvi_by_prompt.length || 0} real customer queries · {displayData?.source_analysis.citations_by_prompt.reduce((sum, p) => sum + p.citations.length, 0) || 0} citations · {aiCoverage} AI platforms tested
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN REPORT BODY
         ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 space-y-14">

        {/* ── Section 1: Platform Performance ───────────────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-9 h-9 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
              <Eye className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">How Each AI Platform Sees You</h2>
              <p className="text-gray-500 text-sm mt-0.5">When customers ask ChatGPT, Gemini, or Grok about your industry — here&apos;s how often {brandName} shows up</p>
            </div>
          </div>

          {displayData && displayData.lvi_metrics.lvi_by_model.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden mt-5">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentions</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mention Rate</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Citations</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayData.lvi_metrics.lvi_by_model
                    .sort((a, b) => b.lvi_score - a.lvi_score)
                    .map((model, index) => {
                      const perfLevel = model.lvi_score >= 70 ? 'excellent' : model.lvi_score >= 50 ? 'good' : model.lvi_score >= 30 ? 'fair' : 'poor'
                      return (
                        <tr key={model.model_name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <img 
                                  src={ModelDisplayNames[model.model_name]?.icon || '/models/chatgpt-logo.png'} 
                                  alt={ModelDisplayNames[model.model_name]?.name || model.model_name}
                                  className="w-5 h-5 object-contain"
                                />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {ModelDisplayNames[model.model_name]?.name || model.model_name}
                                </span>
                                {index === 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-gray-950 text-white text-[10px] font-bold rounded uppercase">Best</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-900 tabular-nums">{model.lvi_score.toFixed(1)}</span>
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  model.lvi_score >= 70 ? 'bg-emerald-500' : model.lvi_score >= 50 ? 'bg-blue-500' : model.lvi_score >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} style={{ width: `${Math.min(100, model.lvi_score)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-gray-700 font-medium tabular-nums">{model.mention_count}/{model.response_count}</td>
                          <td className="px-6 py-5 text-gray-700 font-medium tabular-nums">{model.mention_rate.toFixed(0)}%</td>
                          <td className="px-6 py-5">
                            {model.avg_position ? (
                              <span className={`font-medium ${
                                model.avg_position <= 2 ? 'text-emerald-600' : model.avg_position <= 5 ? 'text-blue-600' : 'text-yellow-600'
                              }`}>
                                {model.avg_position <= 2 ? 'Featured first' : model.avg_position <= 4 ? 'Mentioned early' : model.avg_position <= 7 ? 'Mid-response' : 'Mentioned late'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-gray-700 font-medium tabular-nums">{model.citation_count}</td>
                          <td className="px-6 py-5">
                            {model.mention_count > 0 ? (
                              <span className={`font-medium ${
                                model.avg_sentiment >= 0.1 ? 'text-emerald-600' : model.avg_sentiment >= -0.1 ? 'text-gray-600' : 'text-red-600'
                              }`}>
                                {model.avg_sentiment >= 0.1 ? 'Positive' : model.avg_sentiment >= -0.1 ? 'Neutral' : 'Negative'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                              perfLevel === 'excellent' ? 'bg-emerald-50 text-emerald-700' :
                              perfLevel === 'good' ? 'bg-blue-50 text-blue-700' :
                              perfLevel === 'fair' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {perfLevel.charAt(0).toUpperCase() + perfLevel.slice(1)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-12 text-center mt-5">
              <Brain className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Platform data will appear once analysis is complete.</p>
            </div>
          )}
        </section>

        {/* ── Section 2: Search Queries — "Are you showing up?" ──── */}
        <section className={isFreeAudit ? "relative overflow-hidden" : ""}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-9 h-9 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
              <Search className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">How AI Responds When Asked About You</h2>
              <p className="text-gray-500 text-sm mt-0.5">We tested these prompts across ChatGPT, Gemini, and other AI models. Here&apos;s where {brandName} showed up — and where it didn&apos;t.</p>
            </div>
          </div>

          {displayData && displayData.lvi_metrics.lvi_by_prompt.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden mt-5">
              <PromptsAnalysisTable 
                prompts={displayData.lvi_metrics.lvi_by_prompt}
                citations={displayData.source_analysis.citations_by_prompt}
                ModelDisplayNames={ModelDisplayNames}
                lviComponents={displayData.lvi_metrics.lvi_components}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-12 text-center mt-5">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Query analysis will appear once data is available.</p>
            </div>
          )}

          {/* Gradient fade within the section */}
          {isFreeAudit && (
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-white/0 via-white/80 to-white pointer-events-none" />
          )}
        </section>

      {/* Close the max-w-7xl container so the gate can go full-width */}
      </div>

      {/* ── Free Audit Gate — full-width, extends to fill remaining viewport ── */}
      {isFreeAudit && (
        <div className="relative bg-gradient-to-b from-white via-gray-50 to-gray-100 -mt-20">
          {/* Top fade to blend seamlessly with content above */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent pointer-events-none" />

          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 pt-24 pb-20">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-14 h-14 bg-gray-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 mb-3">
                See the full picture
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md mx-auto">
                Sign up to unlock competitor analysis, your action plan, and see exactly what AI says about {brandName}.
              </p>
              <a href="/signup?source=free-audit&redirect_url=/free-audit/activate">
                <Button className="bg-gray-950 text-white hover:bg-gray-800 font-semibold px-10 py-4 text-lg h-auto w-full sm:w-auto shadow-lg shadow-gray-950/10">
                  Start 7-Day Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </a>
              <p className="text-gray-400 text-sm mt-4">Free 7-day trial · No credit card required</p>
            </div>
          </div>
        </div>
      )}

      {/* Re-open the container for the rest of non-free-audit content */}
      {!isFreeAudit && (
      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-14 space-y-14">

        {/* ── Section 3: Competitive Landscape ──────────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-9 h-9 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Who AI Is Sending Your Customers To</h2>
              <p className="text-gray-500 text-sm mt-0.5">These brands show up when people search for what you offer — they&apos;re getting the customers you&apos;re missing</p>
            </div>
          </div>

          {displayData?.competitive_analysis?.detailed_competitor_analysis && 
           displayData.competitive_analysis.detailed_competitor_analysis.length > 0 ? (() => {
            // Filter out platform/tool names that aren't real business competitors
            const platformFilter = new Set([
              'facebook', 'google', 'google ads', 'meta', 'meta ads', 'instagram', 'linkedin',
              'twitter', 'x', 'tiktok', 'youtube', 'reddit', 'pinterest', 'snapchat',
              'whatsapp', 'telegram', 'bing', 'yahoo', 'amazon', 'microsoft', 'apple',
              'chatgpt', 'openai', 'anthropic', 'perplexity', 'gemini', 'claude',
              'hubspot', 'salesforce', 'mailchimp', 'wordpress', 'shopify', 'stripe',
              'zapier', 'slack', 'zoom', 'canva', 'notion', 'figma', 'github', 'gitlab',
              'stackoverflow', 'stack overflow', 'wikipedia', 'craigslist', 'yelp',
              'zillow', 'indeed', 'glassdoor', 'paypal', 'venmo', 'square',
              'wix', 'squarespace', 'godaddy', 'cloudflare', 'aws', 'azure',
              'google analytics', 'google search console', 'google my business',
              'facebook ads', 'facebook marketplace', 'instagram ads', 'linkedin ads',
              'tiktok ads', 'youtube ads', 'bing ads', 'twitter ads',
              'semrush', 'ahrefs', 'moz', 'screaming frog',
            ])
            const filteredCompetitors = displayData.competitive_analysis.detailed_competitor_analysis
              .filter(c => !platformFilter.has(c.name.toLowerCase().trim()))
            
            return filteredCompetitors.length > 0 ? (
            <div className="mt-5 space-y-3">
              {filteredCompetitors
                .slice(0, 8)
                .map((competitor, index) => (
                  <div key={competitor.name} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors bg-white">
                    <div className="flex items-start gap-4">
                      {/* Rank + Favicon */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-400 tabular-nums w-5 text-center">#{index + 1}</span>
                        <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${competitor.name.toLowerCase().replace(/[\s.]+/g, '')}.com&sz=32`}
                            alt={competitor.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              if (target.parentElement) {
                                target.parentElement.innerHTML = `<span class="text-xs font-bold text-gray-400">${competitor.name.charAt(0)}</span>`
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Name + Share */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900">{competitor.name}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            competitor.threat_level?.toLowerCase() === 'high' ? 'bg-red-50 text-red-700' :
                            competitor.threat_level?.toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {competitor.threat_level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{competitor.market_share_estimate.toFixed(1)}% estimated share of voice</p>
                      </div>

                      {/* Key Metrics */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{competitor.mention_count}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Mentions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{competitor.model_count}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Platforms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{competitor.citation_count}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Citations</div>
                        </div>
                        <div className="text-center min-w-[60px]">
                          <div className={`text-sm font-semibold leading-tight ${
                            competitor.avg_sentiment >= 0.1 ? 'text-emerald-600' : competitor.avg_sentiment >= -0.1 ? 'text-gray-600' : 'text-red-600'
                          }`}>
                            {competitor.avg_sentiment >= 0.1 ? 'Positive' : competitor.avg_sentiment >= -0.1 ? 'Neutral' : 'Negative'}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Sentiment</div>
                        </div>
                        <div className="w-20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900 tabular-nums">{competitor.prominence_score}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${Math.min(100, competitor.prominence_score)}%` }} />
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mt-0.5">Prominence</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-12 text-center mt-5">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Competitive data will appear once analysis is complete.</p>
            </div>
          )})() : (
            <div className="border border-gray-200 rounded-xl p-12 text-center mt-5">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Competitive data will appear once analysis is complete.</p>
            </div>
          )}
        </section>

        {/* ── Section 5: Recommendations — Card Grid ──────────── */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-9 h-9 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
              <Rocket className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-950">What To Do Next</h2>
              <p className="text-gray-500 text-sm mt-0.5">Prioritized actions to improve your AI discoverability</p>
            </div>
            {insightSources && (
              <div className="flex gap-1.5">
                {insightSources.responseAnalysis && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">AI Responses</span>
                )}
                {insightSources.discoverabilityAudit && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">Audit</span>
                )}
                {insightSources.searchConsole && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Search Console</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(() => {
              // ── Use server-powered insights if available, else fall back to client-side ──
              type Rec = {
                action: string
                insight: string
                metrics: Array<{ label: string; value: string; warn?: boolean }>
                impact: 'critical' | 'high' | 'medium'
                category: string
                source?: string
              }

              // Server-powered insights from insight engine
              if (engineInsights && engineInsights.length > 0) {
                return engineInsights as Rec[]
              }

              // Client-side fallback (free audit / onboarding / no engine data yet)
              const recs: Rec[] = []
              if (!displayData) return []

              const models = displayData.lvi_metrics.lvi_by_model || []
              const prompts = displayData.lvi_metrics.lvi_by_prompt || []
              const components = displayData.lvi_metrics.lvi_components
              const sov = displayData.share_of_voice
              const sources = displayData.source_analysis
              const comp = displayData.competitive_analysis
              // Filter out platform/tool names that aren't real business competitors
              const platformNames = new Set(['facebook', 'google', 'google ads', 'meta', 'instagram', 'linkedin', 'twitter', 'x', 'tiktok', 'youtube', 'reddit', 'pinterest', 'snapchat', 'whatsapp', 'telegram', 'bing', 'yahoo', 'amazon', 'microsoft', 'apple', 'chatgpt', 'openai', 'anthropic', 'perplexity', 'gemini', 'hubspot', 'salesforce', 'mailchimp', 'wordpress', 'shopify', 'stripe', 'zapier', 'slack', 'zoom', 'canva'])
              const realCompetitors = (sov?.competitor_comparison || []).filter(c => !platformNames.has(c.competitor_name.toLowerCase()))
              const topComp = realCompetitors.slice(0, 5)
              const totalResponses = displayData.brand_info.total_responses
              const totalMentions = displayData.brand_info.total_mentions
              const mentionRate = totalResponses > 0 ? (totalMentions / totalResponses) * 100 : 0

              // ── 1. Platform Blind Spots ─────────────────────────────────
              const invisibleModels = models.filter(m => m.lvi_score < 15)
              const weakModels = models.filter(m => m.lvi_score >= 15 && m.lvi_score < 40)
              const visibleModels = models.filter(m => m.lvi_score >= 15)
              const bestModel = models.length > 0 ? models.reduce((a, b) => a.lvi_score > b.lvi_score ? a : b) : null
              const worstModel = models.length > 0 ? models.reduce((a, b) => a.lvi_score < b.lvi_score ? a : b) : null
              const hasSpread = bestModel && worstModel && bestModel.lvi_score > worstModel.lvi_score && bestModel.model_name !== worstModel.model_name

              if (invisibleModels.length > 0) {
                const allInvisible = invisibleModels.length === models.length
                const modelNames = invisibleModels.map(m => ModelDisplayNames[m.model_name]?.name || m.model_name).join(', ')
                recs.push({
                  action: allInvisible
                    ? `Your brand is invisible across all ${models.length} AI platforms`
                    : `Fix zero visibility on ${modelNames}`,
                  insight: allInvisible
                    ? `None of the AI engines we tested — ${modelNames} — mention your brand in their responses. This means potential customers searching via AI won't find you at all.`
                    : `${invisibleModels.length} of ${models.length} AI platforms don't mention your brand.${hasSpread ? ` Your best is ${ModelDisplayNames[bestModel!.model_name]?.name || bestModel!.model_name} at ${bestModel!.lvi_score}/100 — replicate that strategy elsewhere.` : ''}`,
                  metrics: [
                    ...invisibleModels.map(m => ({
                      label: ModelDisplayNames[m.model_name]?.name || m.model_name,
                      value: `${m.mention_count}/${m.response_count} mentioned`,
                      warn: true,
                    })),
                    ...visibleModels.slice(0, 1).map(m => ({
                      label: ModelDisplayNames[m.model_name]?.name || m.model_name,
                      value: `${m.lvi_score}/100 LVI`,
                    })),
                  ],
                  impact: 'critical',
                  category: 'visibility',
                })
              } else if (weakModels.length > 0 && hasSpread && bestModel!.lvi_score - worstModel!.lvi_score > 25) {
                recs.push({
                  action: `Inconsistent presence — ${bestModel!.lvi_score - worstModel!.lvi_score} point gap between platforms`,
                  insight: `${ModelDisplayNames[bestModel!.model_name]?.name || bestModel!.model_name} scores ${bestModel!.lvi_score}/100 but ${ModelDisplayNames[worstModel!.model_name]?.name || worstModel!.model_name} is only ${worstModel!.lvi_score}/100. Customers get different answers depending on which AI they use.`,
                  metrics: models.map(m => ({
                    label: ModelDisplayNames[m.model_name]?.name || m.model_name,
                    value: `${m.lvi_score}/100`,
                    warn: m.lvi_score < 40,
                  })),
                  impact: 'high',
                  category: 'visibility',
                })
              }

              // ── 2. Missed Search Topics ─────────────────────────────────
              const missedPrompts = prompts.filter(p => p.lvi_score < 20)
              const strongPrompts = prompts.filter(p => p.lvi_score >= 60)

              if (missedPrompts.length > 0) {
                // Find real competitors (not platforms) winning in missed prompts
                const competitorWins: Record<string, number> = {}
                missedPrompts.forEach(p => {
                  p.model_scores?.forEach((ms: any) => {
                    if (!ms.brand_mentioned && ms.raw_response) {
                      const response = ms.raw_response.toLowerCase()
                      topComp.forEach(c => {
                        if (response.includes(c.competitor_name.toLowerCase())) {
                          competitorWins[c.competitor_name] = (competitorWins[c.competitor_name] || 0) + 1
                        }
                      })
                    }
                  })
                })
                const topWinner = Object.entries(competitorWins).sort(([,a],[,b]) => b - a)[0]

                recs.push({
                  action: `${missedPrompts.length === prompts.length ? 'Not found in any' : `Missing from ${missedPrompts.length} of ${prompts.length}`} tested search ${missedPrompts.length === 1 ? 'query' : 'queries'}`,
                  insight: `AI doesn't mention your brand for ${missedPrompts.length === prompts.length ? 'any of the queries we tested' : `${missedPrompts.length} queries`}.${topWinner ? ` ${topWinner[0]} appears in ${topWinner[1]} of these instead.` : ''} ${strongPrompts.length > 0 ? `Apply your winning strategy from ${strongPrompts.length} strong topic${strongPrompts.length > 1 ? 's' : ''} to the gaps.` : 'You need authoritative content that directly answers these questions.'}`,
                  metrics: [
                    ...missedPrompts.slice(0, 2).map(p => ({
                      label: 'Missing',
                      value: p.prompt_text.length > 55 ? p.prompt_text.substring(0, 55) + '…' : p.prompt_text,
                      warn: true,
                    })),
                    ...(topWinner ? [{ label: 'Competitor winning', value: `${topWinner[0]} (${topWinner[1]}× mentioned)` }] : []),
                  ],
                  impact: missedPrompts.length > prompts.length / 2 ? 'critical' : 'high',
                  category: 'content',
                })
              }

              // ── 3. Citation Authority Gap ──────────────────────────────
              const totalCitations = sources?.top_domains?.reduce((sum, d) => sum + d.citation_count, 0) || 0
              const uniqueDomains = sources?.top_domains?.length || 0
              const authDist = sources?.authority_distribution
              const highAuthCount = authDist?.high_authority || 0

              if (totalCitations < 5 && totalResponses > 0) {
                recs.push({
                  action: totalCitations === 0 ? `No sources cite your brand` : `Only ${totalCitations} source${totalCitations !== 1 ? 's' : ''} cite your brand`,
                  insight: `AI models are ${totalCitations === 0 ? 'not' : 'barely'} citing your brand. ${uniqueDomains > 0 ? `Current sources: ${sources.top_domains.slice(0, 3).map(d => d.domain).join(', ')}.` : ''} Brands with 10+ citations see 3-5× higher visibility. Get mentioned on industry publications, review sites, and expert blogs.`,
                  metrics: [
                    { label: 'Brand citations', value: `${totalCitations}`, warn: true },
                    { label: 'Citing domains', value: `${uniqueDomains}`, warn: uniqueDomains < 3 },
                    { label: 'High-authority', value: `${highAuthCount}`, warn: highAuthCount < 2 },
                  ],
                  impact: totalCitations === 0 ? 'critical' : 'high',
                  category: 'citations',
                })
              } else if (highAuthCount < 2 && uniqueDomains > 0) {
                recs.push({
                  action: `Upgrade citation quality — only ${highAuthCount} high-authority source${highAuthCount !== 1 ? 's' : ''}`,
                  insight: `You have ${uniqueDomains} citing domains but few are authoritative. AI engines prioritize brands referenced by trusted publications over directory listings.`,
                  metrics: [
                    { label: 'High-authority', value: `${highAuthCount}/${uniqueDomains}`, warn: true },
                    ...sources.top_domains.slice(0, 3).map(d => ({ label: d.domain, value: `${d.citation_count}×` })),
                  ],
                  impact: 'high',
                  category: 'citations',
                })
              }

              // ── 4. Competitive Intelligence (real competitors only) ────
              const leadingComp = topComp[0]
              const brandShare = sov?.overall_share || 0

              if (leadingComp && leadingComp.share_percentage > brandShare + 15) {
                const compDetails = comp?.detailed_competitor_analysis?.find(
                  c => c.name === leadingComp.competitor_name
                )
                recs.push({
                  action: `${leadingComp.competitor_name} has ${(leadingComp.share_percentage - brandShare).toFixed(0)}% more share of voice than you`,
                  insight: `${leadingComp.competitor_name} appears in ${leadingComp.share_percentage.toFixed(0)}% of AI responses${compDetails ? ` across ${compDetails.model_count} platform${compDetails.model_count > 1 ? 's' : ''}` : ''} vs your ${brandShare}%. Analyze their content, backlinks, and structured data to identify what makes AI prefer them.`,
                  metrics: [
                    { label: leadingComp.competitor_name, value: `${leadingComp.share_percentage.toFixed(0)}% · ${leadingComp.mentions} mentions` },
                    { label: 'Your brand', value: `${brandShare}% · ${totalMentions} mentions`, warn: true },
                    ...topComp.slice(1, 3).map(c => ({ label: c.competitor_name, value: `${c.share_percentage.toFixed(0)}%` })),
                  ],
                  impact: leadingComp.share_percentage > brandShare + 40 ? 'critical' : 'high',
                  category: 'competitive',
                })
              }

              // ── 5. Sentiment ───────────────────────────────────────────
              const avgSentiment = displayData.quality_metrics?.avg_sentiment ?? 0
              if (avgSentiment < -0.1) {
                const negativeModels = models.filter(m => m.avg_sentiment < -0.1)
                recs.push({
                  action: `Negative brand sentiment detected in AI responses`,
                  insight: `AI platforms describe your brand with negative language (${((avgSentiment + 1) * 5).toFixed(1)}/10 sentiment). This reduces your LVI by up to 20 points and makes AI less likely to recommend you. Publish positive case studies and customer success stories.`,
                  metrics: [
                    { label: 'Sentiment', value: `${((avgSentiment + 1) * 5).toFixed(1)}/10`, warn: true },
                    ...negativeModels.slice(0, 2).map(m => ({
                      label: ModelDisplayNames[m.model_name]?.name || m.model_name,
                      value: `${((m.avg_sentiment + 1) * 5).toFixed(1)}/10`,
                      warn: true,
                    })),
                  ],
                  impact: 'high',
                  category: 'sentiment',
                })
              } else if (avgSentiment < 0.3 && avgSentiment >= -0.1 && mentionRate > 30) {
                recs.push({
                  action: `Shift sentiment from Neutral to Positive for +${Math.round(20 * (1 - (avgSentiment + 1) / 2))} LVI points`,
                  insight: `You're visible (${mentionRate.toFixed(0)}% mention rate) but AI describes you neutrally. Positive sentiment can boost your score significantly. Add reviews, testimonials, and expert endorsements to your content.`,
                  metrics: [
                    { label: 'Sentiment', value: `${((avgSentiment + 1) * 5).toFixed(1)}/10 (Neutral)` },
                    { label: 'LVI uplift potential', value: `+${Math.round(20 * (1 - (avgSentiment + 1) / 2))} pts` },
                  ],
                  impact: 'medium',
                  category: 'sentiment',
                })
              }

              // ── 6. Position Quality ────────────────────────────────────
              const positionQuality = components?.position_quality || 0
              if (positionQuality < 40 && mentionRate > 20) {
                recs.push({
                  action: `Mentioned but buried — improve your position in AI responses`,
                  insight: `AI mentions you but usually late in responses. Brands listed first get the most clicks. Create definitive, authoritative content that positions you as the primary answer.`,
                  metrics: [
                    { label: 'Position score', value: `${positionQuality}/100`, warn: true },
                    { label: 'Mention rate', value: `${mentionRate.toFixed(0)}%` },
                  ],
                  impact: 'high',
                  category: 'content',
                })
              }

              // ── 7. Catch-all: Low Visibility ──────────────────────────
              if (recs.length === 0 && overallLVI < 30) {
                recs.push({
                  action: `Your brand is largely undiscoverable by AI (LVI ${overallLVI}/100)`,
                  insight: `AI engines rarely mention or recommend your brand. Focus on publishing authoritative content, getting cited by trusted sources, and building a consistent digital footprint across the web.`,
                  metrics: [
                    { label: 'LVI Score', value: `${overallLVI}/100`, warn: true },
                    { label: 'Mentioned', value: `${totalMentions}/${totalResponses} responses`, warn: true },
                    { label: 'Sources', value: `${uniqueDomains} domains` },
                  ],
                  impact: 'critical',
                  category: 'visibility',
                })
              }

              // ── 8. Catch-all: Maintain ────────────────────────────────
              if (recs.length === 0 && overallLVI >= 60) {
                recs.push({
                  action: `Strong position — expand into ${missedPrompts.length} remaining topic gap${missedPrompts.length !== 1 ? 's' : ''}`,
                  insight: `With ${overallLVI}/100 LVI, your brand has solid AI visibility. Focus on maintaining consistency and closing remaining gaps where competitors outrank you.`,
                  metrics: [
                    { label: 'LVI', value: `${overallLVI}/100` },
                    { label: 'Coverage', value: `${strongPrompts.length}/${prompts.length} topics` },
                    { label: 'Sources', value: `${totalCitations} from ${uniqueDomains} domains` },
                  ],
                  impact: 'medium',
                  category: 'visibility',
                })
              }

              return recs.slice(0, 4)
            })().map((rec, index) => {
              const iconConfig = {
                visibility: { icon: Eye, bg: 'bg-gray-950', iconColor: 'text-white' },
                content: { icon: Layers, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
                citations: { icon: ExternalLink, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                competitive: { icon: Target, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
                sentiment: { icon: Heart, bg: 'bg-rose-50', iconColor: 'text-rose-600' },
                technical: { icon: Shield, bg: 'bg-violet-50', iconColor: 'text-violet-600' },
                seo: { icon: Search, bg: 'bg-orange-50', iconColor: 'text-orange-600' },
              }[rec.category] || { icon: Lightbulb, bg: 'bg-gray-100', iconColor: 'text-gray-600' }
              const Icon = iconConfig.icon
              const sourceLabel = rec.source === 'cross-reference' ? 'Cross-Signal'
                : rec.source === 'audit' ? 'Audit'
                : rec.source === 'gsc' ? 'Search Console'
                : rec.source === 'response-analysis' ? 'AI Analysis'
                : null

              return (
                <div key={index} className="border border-gray-200 rounded-xl px-4 py-3.5 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${iconConfig.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${iconConfig.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-1.5 py-px rounded text-[10px] font-semibold uppercase leading-tight ${
                          rec.impact === 'critical' ? 'bg-red-600 text-white' : rec.impact === 'high' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>{rec.impact}</span>
                        {sourceLabel && (
                          <span className="px-1.5 py-px rounded text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100">{sourceLabel}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 leading-snug text-sm">{rec.action}</h3>
                      <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{rec.insight}</p>
                      {rec.metrics.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t border-gray-100">
                          {rec.metrics.map((m, i) => (
                            <span key={i} className="text-xs text-gray-500">
                              <span className="text-gray-400">{m.label}:</span>{' '}
                              <span className={m.warn ? 'text-red-600 font-medium' : 'text-gray-700 font-medium'}>{m.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── What AI Actually Says ──────────────────────────── */}
        {(() => {
          const snippets: { model: string; snippet: string; prompt: string }[] = []
          displayData?.lvi_metrics.lvi_by_prompt.forEach(prompt => {
            prompt.model_scores.forEach((score: any) => {
              if (score.response_snippet && score.brand_mentioned) {
                snippets.push({
                  model: score.model_name,
                  snippet: score.response_snippet,
                  prompt: prompt.prompt_text,
                })
              }
            })
          })
          if (snippets.length === 0) return null
          return (
            <section>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-9 h-9 bg-gray-950 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-950">What AI Actually Says About You</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Real excerpts from AI responses — this is what your potential customers read</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {snippets.slice(0, 6).map((s, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      {ModelDisplayNames[s.model]?.icon && (
                        <img src={ModelDisplayNames[s.model].icon} alt="" className="w-5 h-5 object-contain" />
                      )}
                      <span className="text-sm font-medium text-gray-600">{ModelDisplayNames[s.model]?.name || s.model}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400 truncate max-w-md">{s.prompt}</span>
                    </div>
                    <blockquote className="text-gray-800 leading-relaxed border-l-2 border-gray-300 pl-4 italic">
                      &ldquo;{s.snippet}&rdquo;
                    </blockquote>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        {/* ── Strategic Insights — AI-generated recommendations ── */}
        {brandId && (
          <section>
            <StrategicInsights brandId={brandId} />
          </section>
        )}

        {/* Onboarding navigation */}
        {isOnboarding && (
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Button variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
              Back to Setup
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onStartOver} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button variant="outline" onClick={onSignOut} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Sign Out
              </Button>
            </div>
          </div>
        )}
        </div>
        )}
    </div>
    </TooltipProvider>
  )
}

// Prompts Analysis Table Component
interface PromptsAnalysisTableProps {
  prompts: Array<{
    prompt_id: string
    prompt_text: string
    lvi_score: number
    response_count: number
    mention_count: number
    model_scores: Array<{
      model_name: string
      lvi_score: number
      brand_mentioned: boolean
      raw_response?: string
    }>
  }>
  citations: Array<{
    prompt_id: string
    prompt_text: string
    citations: Array<{
      url: string
      domain: string
      authority_score: number
      model_name: string
      relevance_score: number
    }>
  }>
  ModelDisplayNames: Record<string, { name: string; icon: string }>
  lviComponents?: {
    mention_frequency: number
    position_quality: number
    citation_authority: number
    sentiment_quality: number
    competitive_position: number
    platform_coverage: number
  }
}

function PromptsAnalysisTable({ prompts, citations, ModelDisplayNames, lviComponents }: PromptsAnalysisTableProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())
  const [viewingResponse, setViewingResponse] = useState<{promptId: string, modelName: string, response: string} | null>(null)
  
  // Function to get the real response data from the API response
  const fetchFullResponse = async (promptId: string, modelName: string) => {
    // Find the prompt and model score that contains the raw response
    const prompt = prompts.find(p => p.prompt_id === promptId)
    if (!prompt) {
      return "Response data not found for this prompt."
    }
    
    const modelScore = prompt.model_scores.find(score => score.model_name === modelName)
    if (!modelScore || !modelScore.raw_response) {
      return "Raw response data not available for this model/prompt combination."
    }
    
    // Return the actual raw response from the API
    return modelScore.raw_response
  }

  const openResponseViewer = async (promptId: string, modelName: string) => {
    const response = await fetchFullResponse(promptId, modelName)
    setViewingResponse({ promptId, modelName, response })
  }

  const closeResponseViewer = () => {
    setViewingResponse(null)
  }

  // Enhanced markdown renderer component for AI responses
  const MarkdownRenderer = ({ content }: { content: string }) => {
    // Preprocess: normalize * bullets to - bullets, convert citation refs to superscript
    const processed = content
      .replace(/^(\s*)\* /gm, '$1- ')
      .replace(/⁽(\d+)⁾/g, '<sup>[$1]</sup>')

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-black border-b border-gray-200 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-black">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4 text-black">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-medium mb-2 mt-3 text-gray-800">{children}</h4>,
          p: ({ children }) => <p className="mb-3 text-gray-800 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-black">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-gray-800 leading-relaxed">{children}</li>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{children}</a>,
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return <pre className="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code className="text-sm">{children}</code></pre>
            }
            return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
          },
          hr: () => <hr className="my-4 border-gray-300" />,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">{children}</blockquote>,
          table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-200 text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-800">{children}</th>,
          td: ({ children }) => <td className="border border-gray-200 px-3 py-2 text-gray-700">{children}</td>,
        }}
      >
        {processed}
      </ReactMarkdown>
    )
  }

  const togglePrompt = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(promptId)) {
        newSet.delete(promptId)
      } else {
        newSet.add(promptId)
      }
      return newSet
    })
  }

  return (
    <div className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-6 font-bold text-black uppercase tracking-wide w-8"></th>
              <th className="text-left p-6 font-bold text-black uppercase tracking-wide">Customer Search Query</th>
              <th className="text-center p-6 font-bold text-black uppercase tracking-wide w-32">Mentioned</th>
              <th className="text-center p-6 font-bold text-black uppercase tracking-wide w-48">Platforms</th>
              <th className="text-center p-6 font-bold text-black uppercase tracking-wide w-32">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {prompts
              .sort((a, b) => b.lvi_score - a.lvi_score)
              .map((prompt, index) => {
                const isExpanded = expandedPrompts.has(prompt.prompt_id)
                const mentionedPlatforms = prompt.model_scores.filter(score => score.brand_mentioned)
                const isMentioned = mentionedPlatforms.length > 0
                
                return (
                  <React.Fragment key={prompt.prompt_id}>
                    <tr className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isExpanded ? 'bg-gray-100' : ''
                    }`}>
                      <td className="p-6">
                        <button
                          onClick={() => togglePrompt(prompt.prompt_id)}
                          className="w-6 h-6 bg-black rounded flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-white" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-white" />
                          )}
                        </button>
                      </td>
                      <td className="p-6">User Prompt

                        <div className="font-medium text-black leading-relaxed max-w-2xl">
                          {prompt.prompt_text}
                        </div>
                        {/* Show first available snippet preview */}
                        {!isExpanded && (() => {
                          const snippetScore = prompt.model_scores.find((s: any) => s.response_snippet && s.brand_mentioned) as any
                          if (!snippetScore?.response_snippet) return null
                          return (
                            <div className="mt-2 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3 line-clamp-2">
                              &ldquo;{snippetScore.response_snippet}&rdquo;
                              <span className="not-italic text-xs text-gray-400 ml-1">— {ModelDisplayNames[snippetScore.model_name]?.name || snippetScore.model_name}</span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isMentioned 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isMentioned ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {prompt.model_scores.map((score) => {
                            const modelName = ModelDisplayNames[score.model_name]?.name || score.model_name
                            const modelIcon = ModelDisplayNames[score.model_name]?.icon
                            return (
                              <div
                                key={score.model_name}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded ${
                                  score.brand_mentioned
                                    ? 'bg-black'
                                    : 'bg-gray-200'
                                }`}
                                title={`${modelName}: ${score.brand_mentioned ? 'Mentioned' : 'Not mentioned'}`}
                              >
                                {modelIcon ? (
                                  <img 
                                    src={modelIcon} 
                                    alt={modelName}
                                    className={`h-5 w-5 object-contain ${
                                      score.brand_mentioned ? 'filter brightness-0 invert' : ''
                                    }`}
                                  />
                                ) : (
                                  <Brain className={`h-4 w-4 ${
                                    score.brand_mentioned ? 'text-white' : 'text-gray-600'
                                  }`} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="text-2xl font-bold text-black">
                          {prompt.lvi_score.toFixed(1)}<span className="text-sm font-normal text-gray-400">/100</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={5} className="p-0">
                          <div className="px-6 py-6">
                            <div className="flex flex-col lg:flex-row gap-5">
                              {/* AI Responses Section */}
                              <div className={(() => {
                                const promptCitations = citations.find(c => c.prompt_id === prompt.prompt_id)?.citations || []
                                const hasAnyCitations = promptCitations.filter((citation, index, self) => 
                                  index === self.findIndex(c => c.url === citation.url)
                                ).length > 0
                                return hasAnyCitations ? 'lg:w-[58%]' : 'w-full'
                              })()}>
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                  <div className="px-5 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                        <MessageSquare className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-900">AI Responses</h4>
                                        <p className="text-xs text-gray-500">{prompt.model_scores.length} models queried</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {prompt.model_scores.map((score) => (
                                      <div key={score.model_name} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                          <div className="flex-shrink-0 mt-0.5">
                                            {ModelDisplayNames[score.model_name]?.icon ? (
                                              <img 
                                                src={ModelDisplayNames[score.model_name].icon} 
                                                alt={ModelDisplayNames[score.model_name]?.name || score.model_name}
                                                className="h-7 w-7 rounded-full border border-gray-200 object-contain bg-white p-0.5"
                                              />
                                            ) : (
                                              <div className="h-7 w-7 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
                                                <Brain className="h-4 w-4 text-gray-500" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className="text-sm font-semibold text-gray-900">
                                                {ModelDisplayNames[score.model_name]?.name || score.model_name}
                                              </span>
                                              {score.brand_mentioned ? (
                                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                                  Mentioned
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                                                  Not Mentioned
                                                </span>
                                              )}
                                              <span className="text-xs font-medium text-gray-400 ml-auto tabular-nums">
                                                LVI {score.lvi_score.toFixed(1)}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                              {score.raw_response?.substring(0, 180).replace(/[#*_`]/g, '') || 'Response data not available'}
                                              {score.raw_response && score.raw_response.length > 180 ? '...' : ''}
                                            </p>
                                            <button
                                              className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium"
                                              onClick={() => openResponseViewer(prompt.prompt_id, score.model_name)}
                                            >
                                              <Eye className="h-3 w-3" />
                                              View Full Response
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Citations & Sources Section */}
                              {(() => {
                                const promptCitations = citations.find(c => c.prompt_id === prompt.prompt_id)?.citations || []
                                const uniqueCitations = promptCitations.filter((citation, index, self) => 
                                  index === self.findIndex(c => c.url === citation.url)
                                )
                                
                                // Group citations by URL to collect which models cited them
                                const citationsByUrl = new Map<string, { citation: typeof uniqueCitations[0], models: string[] }>()
                                promptCitations.forEach(c => {
                                  const existing = citationsByUrl.get(c.url)
                                  if (existing) {
                                    if (!existing.models.includes(c.model_name)) {
                                      existing.models.push(c.model_name)
                                    }
                                  } else {
                                    citationsByUrl.set(c.url, { citation: c, models: [c.model_name] })
                                  }
                                })
                                
                                if (uniqueCitations.length === 0) return null
                                
                                return (
                                  <div className="lg:w-[42%]">
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
                                      <div className="px-5 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Citations & Sources</h4>
                                            <p className="text-xs text-gray-500">{uniqueCitations.length} source{uniqueCitations.length !== 1 ? 's' : ''} cited</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="divide-y divide-gray-50">
                                        {Array.from(citationsByUrl.values()).map(({ citation, models }, idx) => (
                                          <div key={idx} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                            <span className="text-xs font-medium text-gray-400 w-5 flex-shrink-0 mt-0.5 tabular-nums">#{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900 truncate" title={citation.domain}>
                                                {citation.domain}
                                              </p>
                                              <a 
                                                href={citation.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-gray-500 hover:text-gray-700 transition-colors truncate block"
                                              >
                                                {citation.url.length > 50 ? `${citation.url.substring(0, 50)}...` : citation.url}
                                              </a>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <div className="flex -space-x-1.5">
                                                {models.map(model => (
                                                  ModelDisplayNames[model]?.icon ? (
                                                    <img
                                                      key={model}
                                                      src={ModelDisplayNames[model].icon}
                                                      alt={ModelDisplayNames[model]?.name || model}
                                                      title={ModelDisplayNames[model]?.name || model}
                                                      className="h-5 w-5 rounded-full bg-white border border-gray-200 object-contain p-0.5"
                                                    />
                                                  ) : (
                                                    <div key={model} className="h-5 w-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center" title={model}>
                                                      <Brain className="h-3 w-3 text-gray-400" />
                                                    </div>
                                                  )
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
          </tbody>
        </table>
      </div>
      
      {/* Response Viewer Dialog — Chat bubble style */}
      {viewingResponse && (
        <Dialog open={!!viewingResponse} onOpenChange={() => closeResponseViewer()}>
          <DialogContent className="max-w-4xl sm:max-w-4xl w-[92vw] max-h-[90vh] overflow-hidden bg-gray-50 border border-gray-200">
            <DialogHeader className="bg-white border-b border-gray-200 pb-4 -mx-6 -mt-6 px-6 pt-6">
              <div className="flex items-center gap-3">
                {ModelDisplayNames[viewingResponse.modelName]?.icon && (
                  <div className="h-8 w-8 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={ModelDisplayNames[viewingResponse.modelName].icon} 
                      alt={ModelDisplayNames[viewingResponse.modelName].name}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900">
                    {ModelDisplayNames[viewingResponse.modelName]?.name || viewingResponse.modelName}
                  </DialogTitle>
                  <p className="text-xs text-gray-500">AI Response</p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex flex-col max-h-[calc(90vh-120px)] overflow-y-auto -mx-6 px-6 py-6 space-y-6">
              {/* User prompt bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 justify-end mb-1.5">
                    <span className="text-xs font-medium text-gray-400">Query</span>
                    <div className="h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      <Search className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm px-5 py-3.5">
                    <p className="text-sm leading-relaxed">
                      {prompts.find(p => p.prompt_id === viewingResponse.promptId)?.prompt_text}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI response bubble */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {ModelDisplayNames[viewingResponse.modelName]?.icon ? (
                    <div className="h-7 w-7 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                      <img 
                        src={ModelDisplayNames[viewingResponse.modelName].icon} 
                        alt={ModelDisplayNames[viewingResponse.modelName].name}
                        className="h-4 w-4 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-900">
                      {ModelDisplayNames[viewingResponse.modelName]?.name || viewingResponse.modelName}
                    </span>
                  </div>
                  {viewingResponse.response ? (
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-6 py-5">
                      <div className="prose prose-sm prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.8] prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-code:text-gray-900 prose-code:bg-gray-100 prose-pre:bg-gray-50 prose-blockquote:text-gray-600 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <MarkdownRenderer content={viewingResponse.response} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-6 py-8 text-center">
                      <MessageSquare className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">No response data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}