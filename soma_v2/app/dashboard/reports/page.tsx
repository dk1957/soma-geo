"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBrand } from "@/lib/contexts/brand-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShareReportDialog from "@/components/reports/share-report-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText,
  Download,
  RefreshCw,
  Search,
  Eye,
  Plus,
  Calendar,
  Star,
  Share2,
  MessageSquare,
  Trash2,
  MoreVertical,
  Loader2,
  Mail,
  Users
} from "lucide-react"

interface BrandReport {
  id: string
  title: string
  description?: string
  report_type: string
  status: string
  overall_score?: number
  visibility_score?: number
  mention_count?: number
  citation_count?: number
  views_count?: number
  platforms_filter?: string[]
  created_at: string
  generated_at?: string
}

interface ExternalReportStats {
  report_id: string
  total_shares: number
  total_views: number
  unique_visitors: number
  email_captures: number
}

const REPORT_TYPES = [
  { value: 'visibility_report_external', label: 'AI Visibility Report' },
  { value: 'brand_audit', label: 'Brand Audit' },
  { value: 'brand_mentions', label: 'Brand Mentions' },
  { value: 'brand_competitors', label: 'Competitor Analysis' },
  { value: 'sources_citations', label: 'Sources & Citations' }
]

export default function DashboardReportsPage() {
  const { currentBrand } = useBrand()
  const router = useRouter()
  const { toast } = useToast()
  const [reports, setReports] = useState<BrandReport[]>([])
  const [externalStats, setExternalStats] = useState<Record<string, ExternalReportStats>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [reportType, setReportType] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [navigatingToReportId, setNavigatingToReportId] = useState<string | null>(null)

  useEffect(() => {
    if (currentBrand) {
      fetchReports()
    }
  }, [currentBrand?.id, searchQuery, reportType])

  const fetchExternalStats = async (reportIds: string[]) => {
    if (!reportIds.length) return
    
    try {
      // Fetch external report stats for each report
      const statsPromises = reportIds.map(async (reportId) => {
        try {
          const response = await fetch(`/api/reports/external?source_report_id=${reportId}`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            const reports = data.data || []
            // Aggregate stats from all external shares of this report
            return {
              report_id: reportId,
              total_shares: reports.length,
              total_views: reports.reduce((sum: number, r: any) => sum + (r.total_views || 0), 0),
              unique_visitors: reports.reduce((sum: number, r: any) => sum + (r.unique_visitors || 0), 0),
              email_captures: reports.reduce((sum: number, r: any) => sum + (r.email_captures || 0), 0)
            }
          }
          return null
        } catch (e) {
          return null
        }
      })
      
      const results = await Promise.all(statsPromises)
      const statsMap: Record<string, ExternalReportStats> = {}
      results.forEach((stat) => {
        if (stat) {
          statsMap[stat.report_id] = stat
        }
      })
      setExternalStats(statsMap)
    } catch (error) {
      console.error('Error fetching external stats:', error)
    }
  }

  const fetchReports = async () => {
    if (!currentBrand) return

    try {
      setIsLoading(true)
      
      // No longer rely on Supabase client session (migrated to Clerk).
      // Server endpoints use Clerk middleware/service client to authorize requests via cookies.
      const params = new URLSearchParams({
        brand_id: currentBrand.id,
        limit: '20',
        include_stats: 'true'
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (reportType !== 'all') params.append('type', reportType)
      
      const response = await fetch(`/api/reports/brand?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const fetchedReports = data.data || []
        setReports(fetchedReports)
        
        // Fetch external stats for these reports
        const reportIds = fetchedReports.map((r: BrandReport) => r.id)
        fetchExternalStats(reportIds)
      } else {
        console.error('Failed to fetch reports:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportCreated = (newReport: any) => {
    // Refresh the reports list
    fetchReports()
  }

  const openDeleteDialog = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setReportToDelete(reportId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteReport = async () => {
    if (!reportToDelete) return

    try {
      setIsDeleting(true)
      // Delete request: Clerk auth is handled server-side via cookies/middleware
      const response = await fetch(`/api/reports/${reportToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: "Report deleted",
          description: "The report has been successfully deleted.",
        })
        // Refresh the list
        fetchReports()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete report. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'generating': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getReportTypeLabel = (type: string) => {
    return REPORT_TYPES.find(t => t.value === type)?.label || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!currentBrand) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Please select a brand to view reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AI Visibility Reports</h1>
            <p className="text-gray-600 mt-1">
              Track how {currentBrand.name} appears across AI search engines and measure your ROI
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                setIsCreating(true)
                router.push('/dashboard/reports/create')
              }}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Report
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchReports} 
              disabled={isLoading}
              className="text-gray-700 border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

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
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription className="text-gray-600">
              Shareable reports showing how {currentBrand.name} ranks in AI-generated responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || reportType !== 'all' ? 'No matching reports' : 'No reports yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || reportType !== 'all'
                    ? 'Try adjusting your filters or search term.'
                    : 'Generate your first AI visibility report to see how your brand ranks across ChatGPT, Gemini, Claude, and Perplexity.'}
                </p>
                {(!searchQuery && reportType === 'all') && (
                  <Button onClick={() => router.push('/dashboard/reports/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate First Report
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.id} 
                    className="group p-5 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white relative"
                    onClick={() => {
                      setNavigatingToReportId(report.id)
                      router.push(`/dashboard/reports/${report.id}`)
                    }}
                  >
                    {navigatingToReportId === report.id && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                          <span className="text-sm text-gray-600">Loading report...</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                          <FileText className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors">{report.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-medium">{getReportTypeLabel(report.report_type)}</span>
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(report.generated_at || report.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.overall_score && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <Star className="h-3 w-3 mr-1 text-gray-400" />
                            {report.overall_score.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-5 text-sm text-gray-600">
                        {report.mention_count !== undefined && report.mention_count > 0 && (
                          <div className="flex items-center gap-1.5" title="Times your brand appeared in AI responses">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{report.mention_count}</span>
                            <span className="text-gray-500">AI mentions</span>
                          </div>
                        )}
                        {/* Show external share stats if available */}
                        {externalStats[report.id] && externalStats[report.id].total_shares > 0 && (
                          <>
                            <div className="flex items-center gap-1.5" title="Total views from shared report links">
                              <Eye className="h-4 w-4 text-blue-400" />
                              <span className="font-medium">{externalStats[report.id].total_views}</span>
                              <span className="text-gray-500">report views</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Unique visitors from shared links">
                              <Users className="h-4 w-4 text-green-400" />
                              <span className="font-medium">{externalStats[report.id].unique_visitors}</span>
                              <span className="text-gray-500">unique visitors</span>
                            </div>
                            {externalStats[report.id].email_captures > 0 && (
                              <div className="flex items-center gap-1.5" title="Email leads captured via report">
                                <Mail className="h-4 w-4 text-purple-400" />
                                <span className="font-medium">{externalStats[report.id].email_captures}</span>
                                <span className="text-gray-500">leads captured</span>
                              </div>
                            )}
                          </>
                        )}
                        {/* Fallback to regular views_count if no external stats */}
                        {(!externalStats[report.id] || externalStats[report.id].total_shares === 0) && report.views_count !== undefined && report.views_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{report.views_count}</span>
                            <span className="text-gray-500">views</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div onClick={(e) => e.stopPropagation()}>
                          <ShareReportDialog 
                            reportId={report.id}
                            reportTitle={report.title}
                            brandName={currentBrand.name}
                            trigger={
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                            }
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          onClick={(e) => openDeleteDialog(report.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the report and any shared links associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
