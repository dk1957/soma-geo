"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useBrand } from "@/lib/contexts/brand-context"
import ExecutiveBrandVisibilityReport from "@/components/reports/brand-visibility-report"
import ShareReportDialog from "@/components/reports/share-report-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  FileText,
  Download,
  Share2,
  ArrowLeft,
  Calendar,
  Eye,
  Star,
  TrendingUp,
  BarChart3,
  Users,
  Quote,
  Search,
  ExternalLink,
  Loader2,
  Target,
  Lightbulb,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { 
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  DonutChart,
  LineChart as TremorLineChart,
  Metric,
  Text,
  Title,
  Grid,
  Col
} from '@tremor/react'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Activity,
  MessageSquare,
  PieChart as PieChartIcon,
  CheckCircle,
  Shield,
  Award,
  LineChart as LineChartIcon,
  Users as UsersIcon,
  Star as StarIcon,
  HelpCircle
} from 'lucide-react'

interface PlatformMetric {
  name: string
  mentions: number
  mention_rate?: number
  ranking_position?: number
  visibility_score: number
  sentiment_score?: number
  citations?: number
  competitors_mentioned?: number
}

interface ChartDataPoint {
  platform?: string
  visibility?: number
  mentions?: number
  sentiment?: string | number
  percentage?: number
  competitor?: string
  platforms?: number
}

interface KeyFinding {
  top_platforms?: string[]
  strongest_performance?: string
  improvement_areas?: string[]
  opportunities?: string[]
  analysis_status?: string
}

// Enhanced analytics interface
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

interface BrandReport {
  id: string
  brand_id: string
  title: string
  description?: string
  report_type: string
  status: string
  brands?: {
    id: string
    name: string
    industry?: string
    target_markets?: string[]
  }
  overall_score?: number
  visibility_score?: number
  discoverability_score?: number
  mention_count?: number
  citation_count?: number
  competitor_count?: number
  views_count?: number
  downloads_count?: number
  date_range_start?: string
  date_range_end?: string
  platforms_filter?: string[]
  created_at: string
  generated_at?: string
  executive_summary?: string
  key_findings?: KeyFinding
  metrics_data?: {
    platforms?: PlatformMetric[]
    analysis_type?: string
    analysis_status?: string
    generated_date?: string
    total_queries_tested?: number
    models_tested?: string[]
    sentiment_analysis?: {
      positive: number
      neutral: number
      negative: number
    }
    performance_summary?: {
      mention_rate: number
      avg_sentiment: number
      total_citations: number
      unique_platforms: number
    }
  }
  charts_data?: {
    platform_performance?: ChartDataPoint[]
    sentiment_distribution?: ChartDataPoint[]
    competitor_landscape?: ChartDataPoint[]
    top_performing_queries?: any[]
  }
  recommendations?: string[]
  raw_data?: any
  classification?: string
  shares_count?: number
  share_url?: string
  public_url?: string
  report_data?: any
  analysis_status?: string
}

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'brand_visibility': return Eye
    case 'brand_discoverability': return Search
    case 'brand_audit': return FileText
    case 'brand_mentions': return Quote
    case 'brand_competitors': return Users
    case   'sources_citations': return BarChart3
    default: return FileText
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

const getReportTypeLabel = (type: string) => {
  const types = {
    'brand_visibility': 'Brand Visibility',
    'brand_discoverability': 'Brand Discoverability',
    'visibility_report_external': 'Visibility Report (External)',
    'brand_audit': 'Brand Audit',
    'brand_mentions': 'Brand Mentions',
    'brand_competitors': 'Brand Competitors',
    'sources_citations': 'Sources & Citations'
  }
  return types[type as keyof typeof types] || type
}

// External Sharing Analytics Component
function ExternalSharingAnalytics({ reportId, brandName }: { reportId: string; brandName: string }) {
  const [externalShares, setExternalShares] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchExternalShares()
  }, [reportId])

  const fetchExternalShares = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports/external?source_report_id=${reportId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExternalShares(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching external shares:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async (shareToken: string) => {
    const url = `${window.location.origin}/reports/${shareToken}`
    await navigator.clipboard.writeText(url)
    setCopied(shareToken)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleOpenLink = (shareToken: string) => {
    const url = `${window.location.origin}/reports/${shareToken}`
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            External Sharing Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (externalShares.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                External Sharing Analytics
              </CardTitle>
              <CardDescription>Create shareable links to this report with lead capture</CardDescription>
            </div>
            <ShareReportDialog
              reportId={reportId}
              reportTitle="Visibility Report"
              brandName={brandName}
              onExternalReportsChange={fetchExternalShares}
              trigger={
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No external shares yet</h3>
            <p className="text-sm text-gray-500">Create a shareable link to track views, leads, and engagement</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalViews = externalShares.reduce((sum, share) => sum + (share.total_views || 0), 0)
  const totalVisitors = externalShares.reduce((sum, share) => sum + (share.unique_visitors || 0), 0)
  const totalLeads = externalShares.reduce((sum, share) => sum + (share.email_captures || 0), 0)
  const totalHighIntent = externalShares.reduce((sum, share) => sum + (share.high_intent_leads || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              External Sharing Analytics
            </CardTitle>
            <CardDescription>Performance metrics for all shared versions of this report</CardDescription>
          </div>
          <ShareReportDialog
            reportId={reportId}
            reportTitle="Visibility Report"
            brandName={brandName}
            onExternalReportsChange={fetchExternalShares}
            trigger={
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Create New Share
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Total Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalViews.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Unique Visitors</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{totalVisitors.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Leads Captured</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{totalLeads.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs font-medium">High Intent</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{totalHighIntent.toLocaleString()}</div>
          </div>
        </div>

        {/* Individual Share Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Active Share Links</h4>
          {externalShares.map((share) => (
            <div key={share.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">{share.title}</h5>
                    {share.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Created {new Date(share.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(share.share_token)}
                    className="text-xs"
                  >
                    {copied === share.share_token ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenLink(share.share_token)}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{share.total_views || 0}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{share.unique_visitors || 0}</div>
                  <div className="text-xs text-gray-500">Visitors</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{share.email_captures || 0}</div>
                  <div className="text-xs text-gray-500">Leads</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {share.conversion_rate ? `${share.conversion_rate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-xs text-gray-500">Conversion</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportDetailsPage() {
  const { id: reportId } = useParams()
  const { currentBrand, switchBrand } = useBrand()
  const router = useRouter()
  
  const [report, setReport] = useState<BrandReport | null>(null)
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Feature flag for new executive report design
  const useExecutiveReport = true

  const fetchReport = useCallback(async (showLoading = true) => {
    if (!reportId) return

    try {
      if (showLoading) {
        setIsLoading(true)
      }
      const response = await fetch(`/api/reports/${reportId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Report fetched, type:', data.report_type)
        
        // If external report, fetch share URL
        if (data.report_type === 'visibility_report_external') {
          const externalResponse = await fetch(`/api/reports/external?source_report_id=${reportId}`, {
            credentials: 'include'
          })
          if (externalResponse.ok) {
            const externalData = await externalResponse.json()
            const externalReports = externalData.data || []
            if (externalReports.length > 0) {
              const activeReport = externalReports.find((r: any) => r.is_active) || externalReports[0]
              data.share_url = `${window.location.origin}/reports/public/${activeReport.share_token}`
              data.shares_count = externalReports.length
              data.views_count = externalReports.reduce((sum: number, r: any) => sum + (r.total_views || 0), 0)
            }
          }
        }
        
        setReport(data)
        
        // If the report belongs to a different brand than currently selected,
        // auto-switch brand context to match the report's brand
        if (data.brand_id && currentBrand?.id && data.brand_id !== currentBrand.id) {
          console.log(`🔄 Report belongs to brand ${data.brand_id}, switching from ${currentBrand.id}`)
          switchBrand(data.brand_id)
        }
        
        // Use the report's own brand_id for analytics (not currentBrand.id, which may differ)
        fetchEnhancedAnalytics(data.brand_id)
      } else {
        setError('Failed to fetch report')
      }
    } catch (error) {
      setError('Error fetching report')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [reportId, switchBrand])

  const fetchEnhancedAnalytics = useCallback(async (brandId: string) => {
    if (!brandId) return

    try {
      setAnalyticsLoading(true)
      const response = await fetch(`/api/analytics/brand?brandId=${brandId}&includeCompetitors=true`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch enhanced analytics')
      }
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (reportId) {
      fetchReport()
      // fetchEnhancedAnalytics is called inside fetchReport once we have the report's brand_id
    }
  }, [reportId, fetchReport])

  const handleDownload = async () => {
    if (!report || !currentBrand) return

    try {
      const response = await fetch(`/api/reports/brand/${report.id}/export?brand_id=${report.brand_id || currentBrand.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf',
          include_charts: true,
          include_raw_data: false
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${report.title}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'generating': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Report</h3>
          <p className="text-gray-500">Please wait while we fetch your report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Report Not Found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'The requested report could not be found.'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    )
  }

  const ReportIcon = getReportTypeIcon(report.report_type)

  // Check if this is an external visibility report - render it immediately
  if (report.report_type === 'visibility_report_external') {
    console.log('🎨 Rendering external report for type:', report.report_type)
    const ExternalBrandVisibilityReportV4 = require('@/components/reports/external-brand-visibility-report-v4').ExternalBrandVisibilityReportV4
    
    if (!ExternalBrandVisibilityReportV4) {
      console.error('❌ External report component not found')
      return <div className="p-8 text-center">External report component not loaded</div>
    }
    
    const reportData = {
      ...report,
      id: report.id,
      brand: {
        name: report.brands?.name || currentBrand?.name || 'Brand',
        logo: currentBrand?.logo_url
      },
      title: report.title,
      description: report.description,
      classification: report.classification,
      generated_at: report.generated_at || report.created_at,
      created_at: report.created_at,
      shares_count: report.shares_count || 0,
      views_count: report.views_count || 0,
      share_url: report.share_url,
      public_url: report.public_url,
      report_data: report.report_data || {},
      raw_data: report.raw_data || {},
      metrics_data: report.metrics_data || {},
      onShareCreated: () => fetchReport(false),
      isPublicView: false, // Dashboard view - hide internal header since page has its own
    }
    
    console.log('📊 Passing data to external report V4:', reportData)
    
    return (
      <div className="space-y-6">
        <ExternalBrandVisibilityReportV4 report={reportData} />
      </div>
    )
  }

  // For all other report types, use the executive report design
  if (useExecutiveReport && currentBrand) {
    // Check if analysis is pending
    const analysisStatus = report?.metrics_data?.analysis_status || report?.key_findings?.analysis_status
    const isAnalysisPending = analysisStatus === 'analysis_pending' || report?.status === 'processing'
    
    return (
      <div className="space-y-0">
        {/* Analysis Pending Banner */}
        {isAnalysisPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="container mx-auto flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Response Analysis in Progress</h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your AI run has completed! Detailed response analysis is currently processing. 
                  Full visibility metrics, competitor insights, and recommendations will be available shortly.
                </p>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Check back in a few minutes for the complete report
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchReport()}
                className="flex-shrink-0 text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>
        )}
        
        <ExecutiveBrandVisibilityReport
          brandName={report?.brands?.name || currentBrand.name}
          brandId={report?.brand_id || currentBrand.id}
          brandDescription={report?.description || `${report?.brands?.name || currentBrand.name} brand performance across AI platforms`}
          industry={report?.brands?.industry || currentBrand.industry || 'Technology'}
          targetMarkets={report?.brands?.target_markets || currentBrand.targetMarkets || ['Global']}
          isOnboarding={false}
          onBack={() => router.push('/dashboard/reports')}
        />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Header - Similar to Prompt Details */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard/reports')}
                className="text-gray-600 hover:text-gray-900 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <ReportIcon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    {report.overall_score && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                        {report.overall_score.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-5 text-sm text-gray-600 mb-2">
                    <span className="font-medium text-blue-600">{getReportTypeLabel(report.report_type)}</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(report.generated_at || report.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{report.views_count || 0}</span> views
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-gray-600 text-sm">{report.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <ShareReportDialog 
                  reportId={report.id}
                  reportTitle={report.title}
                  brandName={currentBrand?.name || 'Brand'}
                  trigger={
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Report
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Enhanced Key Metrics */}
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
              <div className="text-2xl font-bold">
                {analytics ? analytics.lvi_metrics.overall_lvi.toFixed(1) : (report.visibility_score ? report.visibility_score.toFixed(1) : 'N/A')}
              </div>
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
              <div className="text-2xl font-bold">
                {analytics ? analytics.brand_info.total_mentions : (report.mention_count || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {analytics ? analytics.brand_info.total_responses : 'all'} responses
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
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics ? analytics.share_of_voice.overall_share.toFixed(1) : 'N/A'}%
              </div>
              <p className="text-xs text-muted-foreground">
                Compared to competitors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quality Metrics Cards */}
        {analytics?.quality_metrics && (
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
                <div className="text-2xl font-bold">{analytics.quality_metrics.mention_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Response coverage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                <StarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((analytics.quality_metrics.avg_sentiment + 1) * 5).toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/10</span></div>
                <p className="text-xs text-muted-foreground">Brand perception</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completeness</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.quality_metrics.avg_completeness.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Response quality</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.quality_metrics.avg_accuracy.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Information accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relevance</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.quality_metrics.avg_relevance.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Content relevance</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* External Sharing Analytics */}
        <ExternalSharingAnalytics reportId={report.id} brandName={currentBrand?.name || ''} />

        {/* LVI by Model Chart - Enhanced with Tremor */}
        {analytics?.lvi_metrics.lvi_by_model && analytics.lvi_metrics.lvi_by_model.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                LVI Score by AI Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <TremorLineChart
                  data={analytics.lvi_metrics.lvi_by_model.map(model => ({
                    platform: model.model_name.split('/').pop()?.split(':')[0] || model.model_name,
                    'LVI Score': model.lvi_score,
                    'Mention Rate': model.mention_rate || 0
                  }))}
                  index="platform"
                  categories={['LVI Score']}
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
        )}

        {/* Share of Voice by Model Chart - Enhanced with Tremor */}
        {analytics?.share_of_voice.share_by_model && analytics.share_of_voice.share_by_model.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Share of Voice by AI Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <TremorBarChart
                  data={analytics.share_of_voice.share_by_model.map(model => ({
                    platform: model.model_name.split('/').pop()?.split(':')[0] || model.model_name,
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
                <UsersIcon className="h-5 w-5" />
                Competitive Intelligence Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.competitive_analysis.competitor_positioning.slice(0, 6).map((competitor) => (
                    <div key={competitor.name} className="p-4 border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{competitor.name}</h4>
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
                <StarIcon className="h-5 w-5" />
                Sentiment Analysis by AI Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.competitive_analysis.sentiment_analysis.map((sentiment) => (
                  <div key={sentiment.model_name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{sentiment.model_name.split('/').pop()?.split(':')[0] || sentiment.model_name}</h4>
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

        {/* Executive Summary */}
        {report.executive_summary && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{report.executive_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Findings */}
        {report.key_findings && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Platforms */}
                {report.key_findings.top_platforms && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Top Performing Platforms
                    </h4>
                    <div className="space-y-2">
                      {report.key_findings.top_platforms.map((platform: string, index: number) => (
                        <div key={platform} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-gray-900 font-medium">{platform}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strongest Performance */}
                {report.key_findings.strongest_performance && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      Strongest Performance
                    </h4>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-gray-900 font-medium">{report.key_findings.strongest_performance}</p>
                    </div>
                  </div>
                )}

                {/* Improvement Areas */}
                {report.key_findings.improvement_areas && report.key_findings.improvement_areas.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      {report.key_findings.improvement_areas.map((area: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                          <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-900">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opportunities */}
                {report.key_findings.opportunities && report.key_findings.opportunities.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      Growth Opportunities
                    </h4>
                    <div className="space-y-2">
                      {report.key_findings.opportunities.map((opportunity: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-900">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Performance Chart - Enhanced with Tremor */}
        {report.charts_data?.platform_performance && report.charts_data.platform_performance.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Platform Performance Analysis
              </CardTitle>
              <CardDescription>
                Visibility scores and mention counts across AI platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <TremorBarChart
                  data={report.charts_data.platform_performance.map(item => ({
                    platform: item.platform || 'Unknown',
                    'Visibility Score': item.visibility || 0,
                    'Mentions': item.mentions || 0
                  }))}
                  index="platform"
                  categories={['Visibility Score', 'Mentions']}
                  colors={['blue', 'green']}
                  valueFormatter={(number: number) => number.toString()}
                  yAxisWidth={60}
                  className="h-full"
                  showLegend={true}
                  showTooltip={true}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Performance Table */}
        {report.metrics_data?.platforms && report.metrics_data.platforms.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                Detailed Platform Metrics
              </CardTitle>
              <CardDescription>
                Comprehensive performance breakdown by AI platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Platform</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Visibility Score</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Mentions</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Mention Rate</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Avg Position</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Citations</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.metrics_data.platforms.map((platform: PlatformMetric, index: number) => (
                      <tr key={platform.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-medium text-gray-900">{platform.name}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={
                            platform.visibility_score >= 70 ? 'bg-green-100 text-green-800' :
                            platform.visibility_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {platform.visibility_score}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">{platform.mentions}</td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {platform.mention_rate ? `${platform.mention_rate}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {platform.ranking_position ? `#${platform.ranking_position}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">{platform.citations || 0}</td>
                        <td className="py-3 px-4 text-center">
                          {platform.sentiment_score != null ? (
                            (() => {
                              const s10 = (platform.sentiment_score + 1) * 5
                              return (
                                <span className={
                                  s10 >= 7 ? 'text-green-600' :
                                  s10 >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }>
                                  {s10.toFixed(1)}/10
                                </span>
                              )
                            })()
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sentiment Analysis */}
        {report.metrics_data?.sentiment_analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-green-600" />
                  Sentiment Distribution
                </CardTitle>
                <CardDescription>
                  Overall sentiment analysis across all mentions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Positive', value: report.metrics_data.sentiment_analysis.positive, fill: '#10b981' },
                          { name: 'Neutral', value: report.metrics_data.sentiment_analysis.neutral, fill: '#f59e0b' },
                          { name: 'Negative', value: report.metrics_data.sentiment_analysis.negative, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { fill: '#10b981' },
                          { fill: '#f59e0b' },
                          { fill: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            {report.metrics_data?.performance_summary && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Performance Summary
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators from the analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-gray-900">Overall Mention Rate</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {Math.round(report.metrics_data.performance_summary.mention_rate)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-900">Average Sentiment</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {(report.metrics_data.performance_summary.avg_sentiment * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-gray-900">Total Citations</span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        {report.metrics_data.performance_summary.total_citations}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-gray-900">Platforms Tested</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {report.metrics_data.performance_summary.unique_platforms}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>
                Actionable insights based on your AI discoverability analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-gray-900 leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Metadata */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Report Type</label>
                  <p className="text-gray-900">{getReportTypeLabel(report.report_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900 capitalize">{report.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900">{formatDate(report.created_at)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {report.date_range_start && report.date_range_end && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date Range</label>
                    <p className="text-gray-900">
                      {formatDate(report.date_range_start)} - {formatDate(report.date_range_end)}
                    </p>
                  </div>
                )}
                {report.platforms_filter && report.platforms_filter.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Platforms</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.platforms_filter.map((platform: string) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Downloads</label>
                  <p className="text-gray-900">{report.downloads_count || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  )
}