"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Share2, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Star,
  Calendar,
  Eye,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users
} from "lucide-react"

interface ReportData {
  id: string
  title: string
  type: string
  brand_name: string
  website?: string
  industry?: string
  target_markets?: string[]
  created_at: string
  updated_at: string
  status: string
  ldi_score?: number
  visibility_score?: number
  market_position_score?: number
  authority_index?: number
  summary: string
  audit_data: any
  key_insights: string[]
  platform_performance: Record<string, any>
  competitive_analysis: any
  recommendations: string[]
  metrics: Record<string, any>
}

export default function ReportDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setReport(data.data)
      } else if (response.status === 404) {
        setError('Report not found')
      } else {
        setError('Failed to load report')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B+"
    if (score >= 60) return "B"
    if (score >= 50) return "C+"
    if (score >= 40) return "C"
    return "D"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        <Button 
          onClick={() => router.push('/reports')} 
          variant="ghost" 
          size="sm"
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Report Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested report could not be found.'}</p>
          <Button onClick={() => router.push('/reports')} className="bg-gray-900 hover:bg-gray-800 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/reports')} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{report.title}</h1>
              <p className="text-gray-600 mt-1">{report.summary}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="text-gray-700 border-gray-200">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" className="text-gray-700 border-gray-200">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Report Metadata */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Brand</p>
                <p className="text-gray-900 font-semibold">{report.brand_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Report Type</p>
                <p className="text-gray-900 capitalize">{report.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Generated</p>
                <p className="text-gray-900">{formatDate(report.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {report.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {report.ldi_score && (
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${report.ldi_score * 2.83} 283`}
                        className={getScoreColor(report.ldi_score)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-xl font-bold ${getScoreColor(report.ldi_score)}`}>
                          {report.ldi_score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600">LDI Score</p>
                <p className={`text-sm font-semibold ${getScoreColor(report.ldi_score)}`}>
                  Grade {getScoreGrade(report.ldi_score)}
                </p>
              </CardContent>
            </Card>
          )}

          {report.visibility_score && (
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Visibility Score</p>
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <p className={`text-2xl font-semibold ${getScoreColor(report.visibility_score)}`}>
                  {report.visibility_score}
                </p>
                <Progress value={report.visibility_score} className="mt-2" />
              </CardContent>
            </Card>
          )}

          {report.market_position_score && (
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Market Position</p>
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <p className={`text-2xl font-semibold ${getScoreColor(report.market_position_score)}`}>
                  {report.market_position_score}
                </p>
                <Progress value={report.market_position_score} className="mt-2" />
              </CardContent>
            </Card>
          )}

          {report.authority_index && (
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Authority Index</p>
                  <Award className="h-4 w-4 text-orange-600" />
                </div>
                <p className={`text-2xl font-semibold ${getScoreColor(report.authority_index)}`}>
                  {report.authority_index}
                </p>
                <Progress value={report.authority_index} className="mt-2" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Insights */}
        {report.key_insights.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="h-5 w-5" />
                Key Insights
              </CardTitle>
              <CardDescription>
                Important findings from your AI visibility analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.key_insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-blue-900">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Performance */}
        {Object.keys(report.platform_performance || {}).length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Globe className="h-5 w-5" />
                Platform Performance
              </CardTitle>
              <CardDescription>
                Your brand's performance across AI platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.platform_performance).map(([platform, data]) => (
                  <div key={platform} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{platform}</h3>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    {typeof data === 'object' && data !== null && (
                      <div className="space-y-2">
                        {(data as any).mention_rate && (
                          <div>
                            <p className="text-xs text-gray-600">Mention Rate</p>
                            <p className="text-sm font-semibold">{((data as any).mention_rate * 100).toFixed(1)}%</p>
                          </div>
                        )}
                        {(data as any).avg_position && (
                          <div>
                            <p className="text-xs text-gray-600">Avg Position</p>
                            <p className="text-sm font-semibold">#{(data as any).avg_position}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>
                Actionable steps to improve your AI visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <p className="text-sm text-green-900">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Metrics */}
        {Object.keys(report.metrics || {}).length > 0 && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BarChart3 className="h-5 w-5" />
                Detailed Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
