"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import ExecutiveBrandVisibilityReport from './brand-visibility-report'
import { ExternalBrandVisibilityReportV4 } from './external-brand-visibility-report-v4'
import FreeAuditReport from './free-audit-report'
import { 
  TrendingUp, 
  Eye, 
  Target, 
  Globe,
  Info,
  Star,
  Users,
  ChevronRight,
  BarChart3,
  Search,
  Award,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Shield,
  Rocket,
  ArrowRight,
  Loader2,
  Building,
  MessageSquare,
  TrendingDown,
  ExternalLink,
  Layers,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  FileText,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceAnalyzer, type SourceAnalysisResult } from '@/lib/utils/source-analyzer'
import ReactMarkdown from 'react-markdown'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AreaChart, BarChart, DonutChart, LineChart as TremorLineChart } from '@tremor/react'
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

interface BrandVisibilityAuditReportProps {
  auditResults: any
  brandName: string
  brandId?: string
  freeAuditToken?: string
  isOnboarding?: boolean
  isFreeAudit?: boolean
  onBack?: () => void
  onStartOver?: () => void
  onSignOut?: () => void
}

const ModelDisplayNames: Record<string, string> = {
  'openai/gpt-4o-mini:online': 'ChatGPT',
  'meta-llama/llama-4-8b-instruct:online': 'Llama',
  'google/gemini-2.5-flash:online': 'Gemini',
  'x-ai/grok-3-mini:online': 'Grok',
  'perplexity/sonar': 'Perplexity'
}

const getModelDisplayName = (modelName: string): string => {
  return ModelDisplayNames[modelName] || modelName.split('/').pop()?.split(':')[0] || modelName
}

// Convert audit results to analytics format for onboarding (fallback only)
const convertAuditResultsToAnalytics = (auditResults: any, brandName: string): any => {
  console.log('🔄 Using fallback audit results conversion for:', brandName)
  if (!auditResults) {
    return null
  }

  // Basic fallback structure when no API data available
  return {
    brand_info: {
      brand_name: brandName,
      total_responses: 0,
      total_mentions: 0,
      analysis_period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    },
    lvi_metrics: {
      overall_lvi: 0,
      lvi_by_model: [],
      lvi_by_prompt: [],
      lvi_components: {
        mention_frequency: 0,
        position_strength: 0,
        source_authority: 0,
        sentiment_quality: 0
      }
    },
    share_of_voice: {
      overall_share: 0,
      share_by_model: [],
      share_by_prompt: [],
      competitor_comparison: []
    },
    competitive_analysis: {
      market_position_score: 0,
      detailed_competitor_analysis: []
    },
    source_analysis: {
      citations_by_prompt: [],
      top_domains: [],
      authority_distribution: []
    }
  }
}

// Metric tooltip component for explaining calculations
const MetricTooltip = ({ title, description, calculation }: { 
  title: string
  description: string
  calculation?: string 
}) => (
  <UITooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-white cursor-help transition-colors" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs bg-black text-white border border-slate-700">
      <div className="space-y-2">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-gray-200">{description}</p>
        {calculation && (
          <p className="text-xs font-mono bg-gray-800 text-gray-100 p-2 rounded border border-gray-600">{calculation}</p>
        )}
      </div>
    </TooltipContent>
  </UITooltip>
)

export default function BrandVisibilityAuditReport({ 
  auditResults, 
  brandName, 
  brandId,
  freeAuditToken,
  isOnboarding = false,
  isFreeAudit = false,
  onBack,
  onStartOver,
  onSignOut 
}: BrandVisibilityAuditReportProps) {
  // Feature flag for new executive report (enable for new design)
  const useExecutiveReport = true

  if (useExecutiveReport) {
    // Enhanced brand information extraction
    const brandInfo = auditResults?.brand_research || {}
    const brandDescription = brandInfo?.industry ? 
      `Leading ${brandInfo.industry} brand serving ${brandInfo.target_markets?.join(', ') || 'global markets'}` :
      `Innovative brand delivering value to customers worldwide`
    
    const industry = brandInfo?.industry || auditResults?.business_type || 'Technology'
    const targetMarkets = brandInfo?.target_markets || auditResults?.target_regions || ['Global']

    // Use the same component as dashboard - if brandId exists, use API data directly
    // If no brandId, pass auditResults as analytics (already BrandAnalytics format from free audit, or fallback conversion)
    let analyticsData = !brandId ? (
      auditResults?.lvi_metrics ? auditResults : convertAuditResultsToAnalytics(auditResults, brandName)
    ) : undefined

    // Enrich lvi_by_prompt model_scores with raw_response from raw_responses array
    // This handles existing reports where raw_response was stored separately
    if (analyticsData?.lvi_metrics?.lvi_by_prompt && auditResults?.raw_responses) {
      const rawResponses: Array<{ raw_response: string; model_name: string; prompt_text: string }> = auditResults.raw_responses
      analyticsData = {
        ...analyticsData,
        lvi_metrics: {
          ...analyticsData.lvi_metrics,
          lvi_by_prompt: analyticsData.lvi_metrics.lvi_by_prompt.map((prompt: any) => ({
            ...prompt,
            model_scores: prompt.model_scores.map((score: any) => {
              if (score.raw_response) return score // Already has response
              // Find matching raw response by model + prompt text
              const match = rawResponses.find(
                (r: any) => r.model_name === score.model_name && r.prompt_text === prompt.prompt_text
              )
              return match ? { ...score, raw_response: match.raw_response } : score
            }),
          })),
        },
      }
    }

    // Enrich model_scores with response_snippet and position_label for existing reports
    if (analyticsData?.lvi_metrics?.lvi_by_prompt) {
      const brandLower = brandName.toLowerCase()
      const brandEscaped = brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const brandRegex = new RegExp(`\\b${brandEscaped}\\b`, 'i')
      let hasSnippets = false
      analyticsData.lvi_metrics.lvi_by_prompt.forEach((prompt: any) => {
        prompt.model_scores?.forEach((score: any) => {
          if (score.response_snippet) hasSnippets = true
        })
      })
      // Only enrich if snippets are missing (old report)
      if (!hasSnippets) {
        analyticsData = {
          ...analyticsData,
          lvi_metrics: {
            ...analyticsData.lvi_metrics,
            lvi_by_prompt: analyticsData.lvi_metrics.lvi_by_prompt.map((prompt: any) => ({
              ...prompt,
              model_scores: prompt.model_scores.map((score: any) => {
                if (!score.raw_response || !score.brand_mentioned) return score
                const match = score.raw_response.match(brandRegex)
                if (!match || match.index == null) return score
                const brandIdx = match.index
                // Extract snippet
                const snippetStart = Math.max(0, brandIdx - 60)
                const snippetEnd = Math.min(score.raw_response.length, brandIdx + brandName.length + 120)
                let snippet = score.raw_response.substring(snippetStart, snippetEnd).trim()
                if (snippetStart > 0) snippet = '...' + snippet
                if (snippetEnd < score.raw_response.length) snippet = snippet + '...'
                // Classify position
                const relPos = brandIdx / score.raw_response.length
                const posLabel = relPos < 0.15 ? 'Featured First' : relPos < 0.35 ? 'Mentioned Early' : relPos < 0.65 ? 'Mid-Response' : 'Mentioned Late'
                return { ...score, response_snippet: snippet, position_label: posLabel }
              }),
            })),
          },
        }
      }
    }

    // Enrich detailed_competitor_analysis from competitor_positioning for existing reports
    if (analyticsData?.competitive_analysis && !analyticsData.competitive_analysis.detailed_competitor_analysis?.length) {
      const positioning = analyticsData.competitive_analysis.competitor_positioning || []
      if (positioning.length > 0) {
        const totalResponses = analyticsData.brand_info?.total_responses || 15
        analyticsData = {
          ...analyticsData,
          competitive_analysis: {
            ...analyticsData.competitive_analysis,
            detailed_competitor_analysis: positioning.map((comp: any) => {
              const mentionRate = totalResponses > 0 ? comp.mentions / totalResponses : 0
              const prominence = Math.round(mentionRate * 100)
              return {
                name: comp.name,
                mention_count: comp.mentions,
                prominence_score: prominence,
                model_count: comp.models?.length || 0,
                models: comp.models || [],
                citation_count: 0,
                avg_sentiment: comp.avg_sentiment || 0.5,
                threat_level: prominence >= 80 ? 'high' : prominence >= 40 ? 'medium' : 'low',
                market_share_estimate: prominence,
                co_mention_rate: comp.co_mention_rate || 0,
              }
            }),
          },
        }
      }
    }

    // Use the new executive report component (same as dashboard)
    // When we have a brandId, use the V4 modular report (same data as dashboard)
    // This gives us rich Source Intelligence, Prompt Performance, Strategic Insights, Topic Heatmap
    if (brandId) {
      // Free audit: use the dedicated one-time audit report
      if (isFreeAudit && freeAuditToken) {
        return (
          <FreeAuditReport
            brandName={brandName}
            brandId={brandId}
            freeAuditToken={freeAuditToken}
            onBack={onBack}
          />
        )
      }

      const v4Report = {
        id: brandId,
        brand_id: brandId,
        brand_name: brandName,
        brand: { id: brandId, name: brandName, entity_type: 'company' },
        entity_type: 'company',
        classification: 'company',
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      return (
        <ExternalBrandVisibilityReportV4
          report={v4Report}
          isPublicView={isFreeAudit}
          period="30d"
          freeAuditToken={freeAuditToken}
        />
      )
    }

    // No brandId: fall back to the executive report with direct analytics
    return (
      <ExecutiveBrandVisibilityReport
        brandName={brandName}
        brandId={brandId} // This will trigger API fetch if available
        brandDescription={brandDescription}
        industry={industry}
        targetMarkets={targetMarkets}
        isOnboarding={isOnboarding}
        isFreeAudit={isFreeAudit}
        analytics={analyticsData} // Only used if no brandId
        runData={auditResults}
        onBack={onBack}
        onStartOver={onStartOver}
        onSignOut={onSignOut}
      />
    )
  }

  // Legacy component code follows...
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())

  // Fetch enhanced analytics if brandId is provided
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!brandId) {
        // Fallback to legacy audit results
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/analytics/brand?brandId=${brandId}&includeCompetitors=true`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else {
          console.warn('Failed to fetch analytics, using legacy data')
        }
      } catch (err) {
        console.warn('Analytics fetch error:', err)
        setError('Failed to load enhanced analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [brandId])

  // Toggle prompt expansion
  const togglePromptExpansion = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts)
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId)
    } else {
      newExpanded.add(promptId)
    }
    setExpandedPrompts(newExpanded)
  }

  // Legacy data extraction for backwards compatibility
  const legacyData = React.useMemo(() => {
    if (!auditResults) return null

    const testResults = auditResults.test_results || []
    const brandResearch = auditResults.brand_research || {}
    
    // Extract metrics similar to analytics structure
    const platformMetrics: Record<string, any> = {}
    testResults.forEach((result: any) => {
      const platform = result.platform || result.llm_name || 'unknown'
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = {
          total_mentions: 0,
          mentioned_count: 0,
          total_tests: 0,
          avg_sentiment: 0
        }
      }
      
      const metrics = platformMetrics[platform]
      metrics.total_tests++
      metrics.total_mentions += result.brand_mention_count || 0
      if (result.brand_mentioned) metrics.mentioned_count++
      if (result.sentiment_score) metrics.avg_sentiment += result.sentiment_score
    })

    const lviByModel = Object.entries(platformMetrics).map(([modelName, metrics]: [string, any]) => ({
      model_name: modelName,
      lvi_score: metrics.total_tests > 0 ? (metrics.mentioned_count / metrics.total_tests) * 100 : 0,
      response_count: metrics.total_tests,
      mention_rate: metrics.total_tests > 0 ? (metrics.mentioned_count / metrics.total_tests) * 100 : 0
    }))

    return {
      brand_info: {
        brand_name: brandName,
        total_responses: testResults.length,
        total_mentions: testResults.reduce((sum: number, r: any) => sum + (r.brand_mention_count || 0), 0)
      },
      lvi_metrics: {
        overall_lvi: brandResearch.brand_analysis?.brand_mention_rate || 0,
        lvi_by_model: lviByModel,
        lvi_by_prompt: []
      },
      share_of_voice: {
        overall_share: 0,
        share_by_model: [],
        competitor_comparison: []
      },
      quality_metrics: {
        avg_completeness: 0,
        avg_accuracy: 0,
        avg_relevance: 0,
        mention_rate: lviByModel.length > 0 ? lviByModel.reduce((sum, model) => sum + model.mention_rate, 0) / lviByModel.length : 0,
        avg_sentiment: 0
      }
    }
  }, [auditResults, brandName])

  const displayData = analytics || legacyData

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enhanced analytics...</p>
        </div>
      </div>
    )
  }

  if (!displayData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground">Unable to load brand visibility data.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {displayData.brand_info.brand_name} AI Visibility Report
          </h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive analysis across {displayData.lvi_metrics.lvi_by_model.length} AI platforms
          </p>
          {isOnboarding && (
            <div className="flex justify-center gap-4 mt-6">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back to Setup
                </Button>
              )}
              {onStartOver && (
                <Button variant="outline" onClick={onStartOver}>
                  Start Over
                </Button>
              )}
              {onSignOut && (
                <Button variant="outline" onClick={onSignOut}>
                  Sign Out
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Overall AI Visibility Score</CardTitle>
                <MetricTooltip 
                  title="LVI (Language Model Visibility Index)"
                  description="A composite score measuring your brand's visibility across AI platforms based on mention frequency, position quality, citation authority, and sentiment."
                  calculation="LVI = (Visibility × 0.35) + (Position Quality × 0.30) + (Citation Authority × 0.15) + (Sentiment × 0.20)"
                />
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.lvi_metrics.overall_lvi.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                AI visibility index across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
                <MetricTooltip 
                  title="Total Brand Mentions"
                  description="The total number of times your brand was mentioned across all AI platform responses when prompted with various queries."
                  calculation="Sum of all brand mentions across all tested queries and AI platforms"
                />
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.brand_info.total_mentions}</div>
              <p className="text-xs text-muted-foreground">
                Across {displayData.brand_info.total_responses} responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Share of Voice</CardTitle>
                <MetricTooltip 
                  title="Share of Voice"
                  description="Your average share of the conversation across all AI responses. For each response where your brand appears, you receive an equal share (1 ÷ total brands mentioned). Responses where you're not mentioned count as 0%. The daily SOV is the average across all responses."
                  calculation="Per response: (1 ÷ Competitive Density) × 100 if mentioned, else 0. Daily = avg across all responses."
                />
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.share_of_voice.overall_share.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Compared to competitors
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Quality Metrics Cards */}
      {displayData.quality_metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Mention Rate</CardTitle>
                <MetricTooltip 
                  title="Mention Rate"
                  description="The percentage of AI responses that mentioned your brand when prompted with relevant queries in your industry or domain."
                  calculation="(Responses with Brand Mentions ÷ Total Responses) × 100"
                />
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.quality_metrics.mention_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Response coverage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                <MetricTooltip 
                  title="Average Brand Sentiment"
                  description="The average sentiment score of your brand mentions across all AI responses, ranging from -1 (very negative) to +1 (very positive)."
                  calculation="Sum of all sentiment scores ÷ Number of brand mentions"
                />
              </div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayData.brand_info.total_mentions > 0 
                  ? <>{((displayData.quality_metrics.avg_sentiment + 1) * 5).toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/10</span></>
                  : <span className="text-muted-foreground">N/A</span>
                }
              </div>
              <p className="text-xs text-muted-foreground">{displayData.brand_info.total_mentions > 0 ? 'Brand perception' : 'No mentions to analyze'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Completeness</CardTitle>
                <MetricTooltip 
                  title="Response Completeness"
                  description="A score measuring how complete and comprehensive the AI responses are when mentioning your brand, based on depth and detail of information provided."
                  calculation="Average of completeness scores (0-100) across all responses"
                />
              </div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.quality_metrics.avg_completeness.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Response quality</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <MetricTooltip 
                  title="Information Accuracy"
                  description="A score measuring how accurate and factually correct the information about your brand is in AI responses, based on verification against known facts."
                  calculation="Average of accuracy scores (0-100) across all brand mentions"
                />
              </div>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.quality_metrics.avg_accuracy.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Information accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Relevance</CardTitle>
                <MetricTooltip 
                  title="Content Relevance"
                  description="A score measuring how relevant and contextually appropriate your brand mentions are within the AI responses to the given queries."
                  calculation="Average of relevance scores (0-100) based on contextual appropriateness"
                />
              </div>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.quality_metrics.avg_relevance.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Content relevance</p>
            </CardContent>
          </Card>
        </div>
      )}

        {/* LVI by Model Chart - Enhanced with Tremor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              AI Visibility Score by AI Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <TremorLineChart
                data={displayData.lvi_metrics.lvi_by_model.map(model => ({
                  platform: getModelDisplayName(model.model_name),
                  'AI Visibility Score': model.lvi_score,
                  'Mention Rate': model.mention_rate || 0
                }))}
                index="platform"
                categories={['AI Visibility Score']}
                colors={['blue']}
                valueFormatter={(number: number) => `${number.toFixed(1)}`}
                yAxisWidth={48}
                className="h-full"
                showLegend={true}
                showTooltip={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Share of Voice by Model Chart - Enhanced with Tremor */}
        {displayData.share_of_voice.share_by_model.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Share of Voice by AI Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart
                  data={displayData.share_of_voice.share_by_model.map(model => ({
                    platform: getModelDisplayName(model.model_name),
                    'Share of Voice': model.share_percentage,
                    'Brand Mentions': model.brand_mentions,
                    'Competitor Mentions': model.competitor_mentions
                  }))}
                  index="platform"
                  categories={['Share of Voice']}
                  colors={['green']}
                  valueFormatter={(number: number) => `${number.toFixed(1)}%`}
                  yAxisWidth={48}
                  className="h-full"
                  showLegend={true}
                  showTooltip={true}
                />
              </div>
            </CardContent>
          </Card>
        )}

      {/* Enhanced Competitive Intelligence */}
      {analytics?.competitive_analysis?.competitor_positioning && analytics.competitive_analysis.competitor_positioning.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Competitive Intelligence Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.competitive_analysis.competitor_positioning.slice(0, 6).map((competitor) => (
                  <div key={competitor.name} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${competitor.name.toLowerCase().replace(/[\s.]+/g, '')}.com&sz=32`}
                            alt={competitor.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                        <h4 className="font-medium">{competitor.name}</h4>
                      </div>
                      <Badge variant={competitor.avg_sentiment > 0.1 ? "default" : competitor.avg_sentiment < -0.1 ? "destructive" : "secondary"}>
                        {competitor.avg_sentiment > 0.1 ? "Positive" : competitor.avg_sentiment < -0.1 ? "Negative" : "Neutral"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mentions:</span>
                        <span className="font-medium">{competitor.mentions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Position:</span>
                        <span className="font-medium">#{competitor.avg_position.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Co-mention Rate:</span>
                        <span className="font-medium">{competitor.co_mention_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platforms:</span>
                        <span className="font-medium">{competitor.models.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Analysis by Platform */}
      {analytics?.competitive_analysis?.sentiment_analysis && analytics.competitive_analysis.sentiment_analysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Sentiment Analysis by AI Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.competitive_analysis.sentiment_analysis.map((sentiment) => (
                <div key={sentiment.model_name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{sentiment.model_name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={sentiment.avg_sentiment > 0.1 ? "default" : sentiment.avg_sentiment < -0.1 ? "destructive" : "secondary"}>
                        {((sentiment.avg_sentiment + 1) * 5).toFixed(1)}/10
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({sentiment.total_sentiment_scores} responses)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{sentiment.sentiment_distribution.positive}</div>
                      <div className="text-muted-foreground">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-500">{sentiment.sentiment_distribution.neutral}</div>
                      <div className="text-muted-foreground">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{sentiment.sentiment_distribution.negative}</div>
                      <div className="text-muted-foreground">Negative</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress 
                      value={(sentiment.sentiment_distribution.positive / sentiment.total_sentiment_scores) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citation Authority Analysis */}
      {analytics?.competitive_analysis?.citation_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Citation Authority & Source Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analytics.competitive_analysis.citation_analysis.total_citations}</div>
                <div className="text-sm text-muted-foreground">Total Citations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{analytics.competitive_analysis.citation_analysis.avg_citations_per_response.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg per Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{analytics.competitive_analysis.citation_analysis.avg_authority_score.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Authority Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{analytics.competitive_analysis.citation_analysis.high_authority_citations}</div>
                <div className="text-sm text-muted-foreground">High Authority</div>
              </div>
            </div>
            
            {Object.keys(analytics.competitive_analysis.citation_analysis.citation_types).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Citation Source Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(analytics.competitive_analysis.citation_analysis.citation_types).map(([type, count]) => (
                    <div key={type} className="p-3 bg-muted/20 rounded-lg text-center">
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">{type.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompt Performance Table */}
      {analytics?.lvi_metrics.lvi_by_prompt && analytics.lvi_metrics.lvi_by_prompt.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prompt Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.lvi_metrics.lvi_by_prompt.map((prompt) => (
                <div key={prompt.prompt_id} className="border rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => togglePromptExpansion(prompt.prompt_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2">{prompt.prompt_text}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>AI Visibility Score: {prompt.lvi_score.toFixed(1)}</span>
                          <span>Mentions: {prompt.mention_count}/{prompt.response_count}</span>
                          <span>Success Rate: {((prompt.mention_count / prompt.response_count) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={prompt.lvi_score > 50 ? "default" : "secondary"}>
                          {prompt.lvi_score > 70 ? "Excellent" : prompt.lvi_score > 50 ? "Good" : "Needs Improvement"}
                        </Badge>
                        {expandedPrompts.has(prompt.prompt_id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedPrompts.has(prompt.prompt_id) && (
                    <div className="border-t bg-muted/20">
                      <div className="p-4">
                        <h5 className="font-medium mb-3">Platform Performance</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {prompt.model_scores.map((model) => (
                            <div key={model.model_name} className="p-3 bg-background rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{getModelDisplayName(model.model_name)}</span>
                                <Badge variant={model.brand_mentioned ? "default" : "secondary"} className="text-xs">
                                  {model.brand_mentioned ? "Mentioned" : "Not Mentioned"}
                                </Badge>
                              </div>
                              <div className="text-lg font-bold text-primary">{model.lvi_score.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show detailed responses if available */}
                        <div className="mt-6">
                          <h5 className="font-medium mb-3">Detailed Responses</h5>
                          <div className="space-y-4">
                            {/* This would be populated with actual response data */}
                            <div className="text-sm text-muted-foreground">
                              Detailed response analysis would appear here when available from the analytics API.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isOnboarding && (
        <div className="flex justify-center gap-4 pt-8">
          <Button onClick={() => window.location.href = '/dashboard'} size="lg">
            Continue to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}

interface OnboardingReportPreviewProps {
  auditResults?: any
  brandName?: string
  brandId?: string
  onSeeFullReport?: () => void
  isNavigatingToReport?: boolean
}

export function OnboardingReportPreview({ 
  auditResults, 
  brandName, 
  brandId,
  onSeeFullReport,
  isNavigatingToReport = false
}: OnboardingReportPreviewProps) {
  const [isReportLoaded, setIsReportLoaded] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch analytics data and delay showing the report
  useEffect(() => {
    if (brandId) {
      const fetchAnalytics = async () => {
        try {
          const response = await fetch(`/api/analytics/brand?brandId=${brandId}&includeCompetitors=true`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch analytics: ${response.statusText}`)
          }
          
          const data = await response.json()
          setAnalytics(data)
          setFetchError(null)
        } catch (err) {
          console.error('Analytics fetch error:', err)
          setFetchError(err instanceof Error ? err.message : 'Failed to load analytics')
        }
      }

      // Start data fetching immediately
      fetchAnalytics()
      
      // Set minimum loading time to show the loading state
      const timer = setTimeout(() => {
        setIsReportLoaded(true)
      }, 2000) // Increased to 2 seconds to ensure data is loaded
      
      return () => clearTimeout(timer)
    }
  }, [brandId])

  // Show loading state until report is ready and data is fetched
  if (!brandId || !isReportLoaded || (!analytics && !fetchError)) {
    return (
      <div className="relative min-h-[600px]">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-semibold">Preparing your Brand Visibility Report...</h3>
            <p className="text-muted-foreground">
              Analyzing how {brandName || 'your brand'} appears across AI search engines.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if data fetching failed
  if (fetchError) {
    return (
      <div className="relative min-h-[600px]">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-600">Unable to Load Report</h3>
            <p className="text-muted-foreground">
              {fetchError}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-[1400px] mx-auto">
      {/* Report Container with Border */}
      <div className="border-2 border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden">
        {/* Main Report Content */}
        <ExecutiveBrandVisibilityReport 
          brandName={brandName || 'Your Brand'}
          brandId={brandId}
          analytics={analytics}
        />
      </div>
      
      {/* Overlay starting from Search Performance section */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent h-1/2 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 border shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Your Brand Visibility Report is Ready!</h3>
            <p className="text-muted-foreground mb-4">
              We've analyzed how {brandName || 'your brand'} appears across AI search engines.
            </p>
            <Button 
              onClick={onSeeFullReport} 
              size="lg" 
              className="min-w-[200px] cursor-pointer" 
              disabled={isNavigatingToReport}
            >
              {isNavigatingToReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Report...
                </>
              ) : (
                <>
                  See the Full Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}