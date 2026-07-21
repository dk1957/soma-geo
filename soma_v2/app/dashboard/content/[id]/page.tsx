"use client"

/**
 * Content Detail Page
 * View content details, optimization progress, scores, and version history
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBrand } from '@/lib/contexts/brand-context'
import { useToast } from '@/components/layout/notification-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  History,
  BarChart3,
  Download,
  ExternalLink,
  RefreshCw,
  FileText,
  PlayCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Maximize2,
  Minimize2,
  Brain,
  HelpCircle,
  Eye,
  Code
} from 'lucide-react'
import Link from 'next/link'
import { ScoreGauge } from '@/components/ui/score-display'
import { ContentRenderer } from '@/components/ui/content-renderer'
import { DiffViewer } from '@/components/ui/diff-viewer'

interface ContentDetail {
  id: string
  title: string
  content_type: string
  status: string
  original_content: string
  optimized_content: string | null
  optimization_version: number
  target_keywords: string[]
  target_audience: string
  created_at: string
  updated_at: string
}

interface OptimizationHistory {
  id: string
  version_number: number
  content_text: string
  change_summary: string | null
  change_rationale: string | null
  optimizing_agent: string | null
  pre_optimization_score: number | null
  post_optimization_score: number | null
  created_at: string
}

interface Evaluation {
  id: string
  overall_score: number
  citation_prominence: number
  attribution_accuracy: number
  faithfulness: number
  key_info_coverage: number
  semantic_contribution: number
  answer_dominance: number
  citation_prominence_justification: string
  attribution_accuracy_justification: string
  faithfulness_justification: string
  key_info_coverage_justification: string
  semantic_contribution_justification: string
  answer_dominance_justification: string
  evaluated_at: string
}

interface Session {
  current_iteration: number
  max_iterations: number
  current_score: number
  best_score: number
  session_status: string
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentBrand } = useBrand()
  const { addToast, ToastContainer } = useToast()

  const [content, setContent] = useState<ContentDetail | null>(null)
  const [history, setHistory] = useState<OptimizationHistory[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [reoptimizing, setReoptimizing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)
  const [focusedView, setFocusedView] = useState<'split' | 'original' | 'optimized'>('split')
  const [diffMode, setDiffMode] = useState(false)

  // Get latest history item for diff context
  const latestHistory = history.length > 0
    ? [...history].sort((a, b) => b.version_number - a.version_number)[0]
    : null

  useEffect(() => {
    if (currentBrand && params.id) {
      fetchContentDetails()
      // Also fetch session immediately if we might be optimizing
      fetchSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBrand?.id, params.id])

  useEffect(() => {
    if (content?.status === 'optimizing' || session?.session_status === 'running') {
      // Poll during optimization - reduced frequency to avoid server overload
      const interval = setInterval(fetchSession, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [content?.status, session?.session_status])

  const fetchContentDetails = async () => {
    // Use refreshing for manual refresh, loading for initial load
    if (content) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [contentRes, historyRes, evaluationsRes] = await Promise.all([
        fetch(`/api/content/gseo?action=get&content_id=${params.id}`),
        fetch(`/api/content/gseo?action=history&content_id=${params.id}`),
        fetch(`/api/content/gseo?action=evaluations&content_id=${params.id}`)
      ])

      if (contentRes.ok) {
        const { content: contentData } = await contentRes.json()
        setContent(contentData)
      }

      if (historyRes.ok) {
        const { history: historyData } = await historyRes.json()
        setHistory(historyData || [])
      }

      if (evaluationsRes.ok) {
        const { evaluations: evalData } = await evaluationsRes.json()
        setEvaluations(evalData || [])
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load content details'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/content/gseo?action=status&content_id=${params.id}`)
      if (response.ok) {
        const { session: sessionData } = await response.json()
        setSession(sessionData)

        if (sessionData?.session_status === 'completed') {
          fetchContentDetails() // Refresh when done
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const handleReoptimize = async () => {
    if (!confirm('Re-run optimization? This will create a new version of your content.')) {
      return
    }

    setReoptimizing(true)
    try {
      const response = await fetch('/api/content/gseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'optimize'
        },
        body: JSON.stringify({
          content_id: params.id,
          optimization_strategy: 'balanced',
          max_iterations: content?.max_iterations ? Math.min(content.max_iterations, 5) : 3
        })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Optimization Started',
          message: 'Re-optimizing your content with our AI agents'
        })
        setTimeout(() => fetchContentDetails(), 1000)
      } else {
        throw new Error('Failed to start optimization')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Could not start re-optimization'
      })
    } finally {
      setReoptimizing(false)
    }
  }

  const handleEdit = () => {
    // Navigate to edit page (we'll create this)
    router.push(`/dashboard/content/${params.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/content/gseo?content_id=${params.id}`, {
        method: 'DELETE',
        headers: {
          'x-action': 'delete'
        }
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Content Deleted',
          message: 'Content has been permanently deleted'
        })
        setTimeout(() => {
          router.push('/dashboard/content')
        }, 1000)
      } else {
        throw new Error('Failed to delete content')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete content'
      })
      setDeleting(false)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await fetch('/api/content/gseo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: params.id,
          status: 'approved'
        })
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Content Approved',
          message: 'Content is now ready to publish'
        })
        await fetchContentDetails()
      } else {
        throw new Error(result.error || 'Failed to approve content')
      }
    } catch (error) {
      console.error('Approve error:', error)
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: error instanceof Error ? error.message : 'Could not approve content'
      })
    } finally {
      setApproving(false)
    }
  }

  const handleRejectClick = () => {
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    setRejecting(true)
    try {
      // Note: rejection_reason is saved in state but not sent to API yet
      // TODO: Add rejection_reason field to database schema and API
      const response = await fetch('/api/content/gseo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: params.id,
          status: 'draft'
        })
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          type: 'info',
          title: 'Content Rejected',
          message: 'Content moved back to draft for revisions'
        })
        setRejectDialogOpen(false)
        setRejectionReason('')
        await fetchContentDetails()
      } else {
        throw new Error(result.error || 'Failed to reject content')
      }
    } catch (error) {
      console.error('Reject error:', error)
      addToast({
        type: 'error',
        title: 'Rejection Failed',
        message: error instanceof Error ? error.message : 'Could not reject content'
      })
    } finally {
      setRejecting(false)
    }
  }

  const handlePublish = async (publishUrl: string) => {
    setPublishing(true)
    try {
      const response = await fetch('/api/content/gseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'publish'
        },
        body: JSON.stringify({
          content_id: params.id,
          publish_url: publishUrl
        })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Published',
          message: 'Content successfully published'
        })
        fetchContentDetails()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Publish Failed',
        message: 'Could not publish content'
      })
    } finally {
      setPublishing(false)
    }
  }

  if (loading || !content) {
    return (
      <div className="container mx-auto px-6 py-6 space-y-6">
        <ToastContainer />

        {/* Skeleton Loading UI */}
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-9 w-20 bg-gray-200 rounded"></div>
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-gray-200 rounded"></div>
              <div className="h-9 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* If we have session data, show optimization card even while loading */}
          {session && session.session_status === 'running' && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Optimization in Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Iteration {session.current_iteration} of {session.max_iterations}
                      </p>
                    </div>
                  </div>
                  {session.current_score > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">{session.current_score.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Current Score</div>
                    </div>
                  )}
                </div>
                <Progress value={(session.current_iteration / session.max_iterations) * 100} />
              </CardContent>
            </Card>
          )}

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Loading content details...
        </div>
      </div>
    )
  }

  const avgScore = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.overall_score, 0) / evaluations.length
    : 0

  return (
    <>
      {/* Sticky Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-9xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/content" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Content</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[60vw]">{content.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {content.content_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{content.optimization_version}
                    </Badge>
                    {content.target_audience && (
                      <Badge variant="outline" className="text-xs">
                        {content.target_audience}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {history.length} iteration{history.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchContentDetails}
                disabled={refreshing || approving || rejecting || publishing || deleting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>

              {/* Re-optimize button - show for draft, approved, or published */}
              {['draft', 'approved', 'published'].includes(content.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reoptimizing || content.status === 'optimizing' || approving || rejecting || publishing || deleting}
                  onClick={handleReoptimize}
                >
                  {reoptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-optimizing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Re-optimize
                    </>
                  )}
                </Button>
              )}

              {/* Edit button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={content.status === 'optimizing' || approving || rejecting || publishing || deleting}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              {/* Publish button - only for approved */}
              {content.status === 'approved' && (
                <Button
                  size="sm"
                  disabled={publishing || approving || rejecting || reoptimizing || deleting}
                  onClick={() => {
                    const url = prompt('Enter the URL where this content will be published:')
                    if (url) handlePublish(url)
                  }}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>
              )}

              {/* Delete button */}
              <Button
                variant="outline"
                size="sm"
                disabled={deleting || approving || rejecting || publishing || reoptimizing}
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <ToastContainer />

        {/* Status Card - Show for both optimizing status OR running session */}
        {(content.status === 'optimizing' || session?.session_status === 'running') && session && (
          <Card className="border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">🤖 AI Optimization in Progress</h3>
                    <p className="text-sm text-blue-700">
                      Iteration {session.current_iteration} of {session.max_iterations} •
                      {session.session_status === 'running' ? 'Agents are analyzing and improving your content' : 'Processing...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {session.current_score > 0 && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-900">{session.current_score.toFixed(2)}</div>
                      <div className="text-xs text-blue-600 font-medium">Current Score</div>
                    </div>
                  )}
                  {session.best_score > 0 && session.best_score !== session.current_score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700">{session.best_score.toFixed(2)}</div>
                      <div className="text-xs text-green-600 font-medium">Best Score</div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSession}
                    className="bg-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={(session.current_iteration / session.max_iterations) * 100} className="h-3" />
                <p className="text-xs text-blue-600 text-right">
                  {Math.round((session.current_iteration / session.max_iterations) * 100)}% Complete
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics - Circular Row */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Performance Metrics</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {evaluations.length > 1 && (
                  <>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Baseline (v1)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Current (v{content.optimization_version})</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {evaluations.length > 0 && [
                {
                  label: 'Visibility & Citations',
                  key: 'citation_prominence' as keyof Evaluation,
                  desc: 'How prominently the brand is cited in the answer (e.g. "According to Brand X...").'
                },
                {
                  label: 'Trust & Accuracy',
                  key: 'attribution_accuracy' as keyof Evaluation,
                  desc: 'How accurately the AI attributes your claims and facts.'
                },
                {
                  label: 'Fact Accuracy',
                  key: 'faithfulness' as keyof Evaluation,
                  desc: 'How well the AI preserves the core meaning of your content.'
                },
                {
                  label: 'Key Selling Points',
                  key: 'key_info_coverage' as keyof Evaluation,
                  desc: 'Did the AI include your most important differentiators?'
                },
                {
                  label: 'Idea Influence',
                  key: 'semantic_contribution' as keyof Evaluation,
                  desc: 'Did your unique perspective shape the structure of the answer?'
                },
                {
                  label: 'Share of Voice',
                  key: 'answer_dominance' as keyof Evaluation,
                  desc: 'How dominant your brand is in the final answer compared to others.'
                }
              ].map(dim => {
                // Sort evaluations by date to find baseline (oldest) and current (newest)
                const sortedEvals = [...evaluations].sort((a, b) =>
                  new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime()
                )

                const currentScore = sortedEvals[sortedEvals.length - 1][dim.key] as number
                const baselineScore = sortedEvals.length > 1 ? sortedEvals[0][dim.key] as number : 0
                const improvement = baselineScore > 0 ? ((currentScore - baselineScore) / baselineScore) * 100 : 0

                return (
                  <div key={dim.key} className="flex flex-col items-center gap-3 min-w-[120px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{dim.label}</span>
                            <HelpCircle className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs text-xs">{dim.desc}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="relative flex flex-col items-center">
                      <ScoreGauge
                        dimension=""
                        score={currentScore}
                      />

                      {baselineScore > 0 && (
                        <div className="mt-2 flex flex-col items-center">
                          <div className="text-xs text-gray-500">
                            was {baselineScore.toFixed(1)}
                          </div>
                          {improvement !== 0 && (
                            <div className={`text-xs font-medium flex items-center ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Comparison */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle>Content Comparison</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(content.updated_at).toLocaleDateString()}
                    {content.target_keywords && content.target_keywords.length > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="flex items-center gap-1.5">
                          {content.target_keywords.slice(0, 3).map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                          {content.target_keywords.length > 3 && (
                            <span className="text-xs">+{content.target_keywords.length - 3} more</span>
                          )}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDiffMode(false)}
                    className={!diffMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visual
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDiffMode(true)}
                    className={diffMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Diff
                  </Button>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                <div className="flex items-center gap-1">
                  <Button
                    variant={focusedView === 'split' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFocusedView('split')}
                    title="Split View"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={focusedView === 'original' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFocusedView('original')}
                    title="Original Only"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={focusedView === 'optimized' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFocusedView('optimized')}
                    title="Optimized Only"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${focusedView === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}>
              {/* Original Content */}
              {(focusedView === 'split' || focusedView === 'original') && (
                <div className="relative">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                          <span className="text-sm font-semibold text-gray-900">Original Content</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Base Version</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Initial version before optimization</p>
                    </div>
                    <div className="p-6 bg-white rounded-b-lg min-h-[400px]">
                      {diffMode ? (
                        <DiffViewer
                          oldText={content.original_content}
                          newText={content.optimized_content || ''}
                          mode={focusedView === 'split' ? "split-left" : "inline"}
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ContentRenderer content={content.original_content} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Optimized Content */}
              {(focusedView === 'split' || focusedView === 'optimized') && (
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-blue-200 bg-white/90 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-sm font-semibold text-gray-900">Optimized Content</span>
                          {content.optimized_content && (
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                              v{content.optimization_version}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {content.status === 'reviewing' && content.optimized_content && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                onClick={handleApprove}
                                disabled={approving || rejecting}
                              >
                                {approving ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1.5" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                onClick={handleRejectClick}
                                disabled={rejecting || approving}
                              >
                                <XCircle className="h-3 w-3 mr-1.5" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {content.optimized_content ? 'AI-enhanced version' : 'Not yet optimized'}
                      </p>
                    </div>
                    <div className="p-6 bg-white rounded-b-lg min-h-[400px]">
                      {content.optimized_content ? (
                        diffMode ? (
                          <DiffViewer
                            oldText={content.original_content}
                            newText={content.optimized_content}
                            mode={focusedView === 'split' ? "split-right" : "inline"}
                          />
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <ContentRenderer content={content.optimized_content} />
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Loader2 className="h-12 w-12 mb-4 opacity-30 animate-spin" />
                          <p className="text-sm font-medium">Optimization in progress or not started</p>
                          <p className="text-xs mt-1">Please wait while AI enhances your content</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Rationale Section - Always visible in split view if available */}
            {focusedView === 'split' && latestHistory && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestHistory.change_summary && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Summary of Changes
                    </h4>
                    <p className="text-sm text-blue-800">{latestHistory.change_summary}</p>
                  </div>
                )}
                {latestHistory.change_rationale && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 mb-1 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Reasoning
                    </h4>
                    <p className="text-sm text-purple-800">{latestHistory.change_rationale}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Detailed Analytics - Collapsible */}
        <Card>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setAnalyticsExpanded(!analyticsExpanded)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Detailed Analytics</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {evaluations.length} evaluations • {history.length} versions
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {analyticsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!analyticsExpanded && (
              <CardDescription className="text-xs mt-1">
                Click to view detailed evaluation scores and version history
              </CardDescription>
            )}
          </CardHeader>
          {analyticsExpanded && (
            <CardContent>
              <Tabs defaultValue="evaluations" className="w-full">
                <TabsList>
                  <TabsTrigger value="evaluations">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Evaluations ({evaluations.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Version History ({history.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="evaluations" className="mt-6">
                  <div className="space-y-4">
                    {evaluations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No evaluations yet
                      </div>
                    ) : (
                      evaluations.map((evaluation, idx) => (
                        <Card key={evaluation.id} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium">Evaluation {idx + 1}</div>
                              <Badge variant="outline">{evaluation.overall_score.toFixed(2)}/10</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Visibility Score: {evaluation.citation_prominence.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.citation_prominence_justification}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Source Accuracy: {evaluation.attribution_accuracy.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.attribution_accuracy_justification}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Content Accuracy: {evaluation.faithfulness.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.faithfulness_justification}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Key Info Coverage: {evaluation.key_info_coverage.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.key_info_coverage_justification}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Semantic Contribution: {evaluation.semantic_contribution.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.semantic_contribution_justification}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-muted-foreground mb-1">Ranking Strength: {evaluation.answer_dominance.toFixed(1)}</div>
                                <div className="text-gray-700">{evaluation.answer_dominance_justification}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No version history yet
                      </div>
                    ) : (
                      history.sort((a, b) => b.version_number - a.version_number).map(version => (
                        <Card key={version.id} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold text-base">Version {version.version_number}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(version.created_at).toLocaleString()}
                                  {version.optimizing_agent && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span className="capitalize">{version.optimizing_agent} agent</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {version.post_optimization_score && (
                                <Badge variant="outline" className="text-sm">
                                  Score: {version.post_optimization_score.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            {version.change_summary && (
                              <div className="text-sm mb-2 p-3 bg-blue-50 rounded-md">
                                <span className="font-semibold text-blue-900">Changes:</span>
                                <p className="text-gray-700 mt-1">{version.change_summary}</p>
                              </div>
                            )}
                            {version.change_rationale && (
                              <div className="text-sm p-3 bg-purple-50 rounded-md">
                                <span className="font-semibold text-purple-900">Rationale:</span>
                                <p className="text-gray-700 mt-1">{version.change_rationale}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Content
            </DialogTitle>
            <DialogDescription>
              This content will be moved back to draft status. Please provide feedback to help improve the next version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                placeholder="What needs to be improved? (optional but recommended)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Examples: Tone doesn't match brand voice, missing key information, factual inaccuracies, etc.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejecting}
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
