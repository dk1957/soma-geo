"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { checkUserStatus } from "@/lib/utils/user-status-checker"
import { 
  FileText,
  Eye,
  Clock,
  Sparkles,
  Plus,
  Search,
  Star,
  Calendar,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Globe
} from "lucide-react"

interface Report {
  id: string
  title: string
  type: string
  brand_name: string
  created_at: string
  status: string
  summary: string
  ldi_score?: number
  visibility_score?: number
  market_position_score?: number
  authority_index?: number
  key_insights: string[]
  metrics: Record<string, any>
}

interface ReportsSummary {
  total_reports: number
  avg_ldi_score: number
  reports_this_month: number
  completed_reports: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary>({
    total_reports: 0,
    avg_ldi_score: 0,
    reports_this_month: 0,
    completed_reports: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [reportType, setReportType] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user, searchQuery, reportType, sortBy])

  const checkAuthAndFetchData = async () => {
    try {
      const userStatus = await checkUserStatus()
      
      if (!userStatus.isAuthenticated) {
        router.push('/signin')
        return
      }

      // Redirect all authenticated users to the proper dashboard reports page
      if (userStatus.brandId) {
        router.push(`/dashboard/reports?brand=${userStatus.brandId}`)
      } else {
        router.push('/dashboard')
      }
      
    } catch (error) {
      console.error('Error checking auth and fetching data:', error)
      router.push('/onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        sort: sortBy,
        order: 'desc'
      })
      
      if (searchQuery) params.append('brand', searchQuery)
      if (reportType !== 'all') params.append('type', reportType)
      
      const response = await fetch(`/api/reports?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.data.reports || [])
        setReportsSummary(data.data.summary || {})
      } else {
        console.error('Failed to fetch reports:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-50 text-green-700 border-green-200"
    if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200"
    if (score >= 40) return "bg-orange-50 text-orange-700 border-orange-200"
    return "bg-red-50 text-red-700 border-red-200"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewReport = (report: Report) => {
    router.push(`/reports/${report.id}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-gray-200 shadow-none">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">AI Visibility Reports</h1>
            <p className="text-gray-600 mt-2">
              Track and analyze your brand's AI platform performance
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="text-gray-700 border-gray-200"
            >
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchReports}
              className="text-gray-700 border-gray-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {reportsSummary.total_reports > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-semibold text-gray-900">{reportsSummary.total_reports}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg LDI Score</p>
                    <p className={`text-2xl font-semibold ${getScoreColor(reportsSummary.avg_ldi_score)}`}>
                      {reportsSummary.avg_ldi_score}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">{reportsSummary.reports_this_month}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{reportsSummary.completed_reports}</p>
                  </div>
                  <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {reportsSummary.total_reports > 0 && (
          <Card className="border-gray-200">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-gray-300"
                    />
                  </div>
                </div>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[200px] border-gray-200">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="comprehensive_audit">Comprehensive Audit</SelectItem>
                    <SelectItem value="competitive_analysis">Competitive Analysis</SelectItem>
                    <SelectItem value="free_tier">Free Tier</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] border-gray-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="ldi_score">LDI Score</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No Reports Found</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                {searchQuery || reportType !== 'all' 
                  ? 'No reports match your current filters.'
                  : 'Complete your onboarding to generate your first AI visibility report.'
                }
              </p>
              {!searchQuery && reportType === 'all' && (
                <Button 
                  onClick={() => router.push('/onboarding')}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Onboarding
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-gray-200 hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{report.title}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">{report.summary}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                        {report.status}
                      </Badge>
                      {report.ldi_score && (
                        <Badge className={getScoreBadgeColor(report.ldi_score)}>
                          <Star className="h-3 w-3 mr-1" />
                          {report.ldi_score}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Key Insights */}
                    {report.key_insights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {report.key_insights.slice(0, 3).map((insight, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            {insight}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Report Details */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(report.created_at)}
                        </div>
                        <div className="text-gray-700 font-medium">
                          {report.brand_name}
                        </div>
                        <div className="capitalize text-gray-600">
                          {report.type.replace('_', ' ')}
                        </div>
                        {report.visibility_score && (
                          <div>
                            Visibility: <span className="font-medium">{report.visibility_score}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleViewReport(report)}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
