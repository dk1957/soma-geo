"use client"

/**
 * GSEO Content Management Dashboard
 * Real-time content optimization tracking with MACO agents
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBrand } from '@/lib/contexts/brand-context'
import { useToast } from '@/components/layout/notification-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Search,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  Sparkles,
  Plus
} from 'lucide-react'

interface Content {
  id: string
  title: string
  content_type: string
  status: string
  optimization_version: number
  created_at: string
  updated_at: string
  target_keywords?: string[]
  target_audience?: string
  original_content?: string
  optimized_content?: string
}

interface OptimizationSession {
  id: string
  current_iteration: number
  max_iterations: number
  current_score: number
  best_score: number
  session_status: string
  session_start: string
}

export default function ContentPage() {
  const router = useRouter()
  const { currentBrand } = useBrand()
  const { addToast, ToastContainer } = useToast()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const fetchContents = useCallback(async () => {
    if (!currentBrand) return

    setLoading(true)
    try {
      const response = await fetch(`/api/content/gseo?action=list&brand_id=${currentBrand.id}`)
      if (response.ok) {
        const { contents: fetchedContents } = await response.json()
        setContents(fetchedContents || [])
      } else {
        throw new Error('Failed to fetch contents')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load content. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }, [currentBrand, addToast])

  useEffect(() => {
    if (currentBrand) {
      fetchContents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBrand?.id])

  const filteredContents = contents.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || c.status === activeTab
    return matchesSearch && matchesTab
  })

  const stats = {
    total: contents.length,
    optimizing: contents.filter(c => c.status === 'optimizing').length,
    approved: contents.filter(c => c.status === 'approved').length,
    published: contents.filter(c => c.status === 'published').length
  }

  if (!currentBrand) {
    return (
      <div className="container mx-auto px-6 py-6">
        <ToastContainer />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Please select a brand to manage content</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Sticky Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-9xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Content Optimization</h1>
                <p className="text-xs text-gray-500">
                  Optimize your content for AI visibility
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setNavigating(true)
                router.push('/dashboard/content/create')
              }}
              disabled={navigating}
            >
              {navigating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <ToastContainer />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Pieces created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Optimizing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.optimizing}
                {stats.optimizing > 0 && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to publish</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
              <p className="text-xs text-muted-foreground mt-1">Live content</p>
            </CardContent>
          </Card>
        </div>

        {/* Content List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Content</CardTitle>
                <CardDescription>Manage and track optimization progress</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="optimizing">Optimizing ({stats.optimizing})</TabsTrigger>
                <TabsTrigger value="reviewing">Review</TabsTrigger>
                <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredContents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No results found' : 'No content yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Create your first optimized content piece'}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => {
                          setNavigating(true)
                          router.push('/dashboard/content/create')
                        }}
                        disabled={navigating}
                      >
                        {navigating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredContents.map(content => (
                      <ContentCard key={content.id} content={content} onUpdate={fetchContents} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function ContentCard({ content, onUpdate }: { content: Content; onUpdate: () => void }) {
  const router = useRouter()
  const [session, setSession] = useState<OptimizationSession | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [navigatingView, setNavigatingView] = useState(false)
  const [navigatingReview, setNavigatingReview] = useState(false)

  const fetchSession = useCallback(async () => {
    setLoadingSession(true)
    try {
      const response = await fetch(`/api/content/gseo?action=status&content_id=${content.id}`)
      if (response.ok) {
        const { session: sessionData } = await response.json()
        setSession(sessionData)

        // If completed, refresh list
        if (sessionData?.session_status === 'completed') {
          onUpdate()
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoadingSession(false)
    }
  }, [content.id, onUpdate])

  useEffect(() => {
    if (content.status === 'optimizing') {
      fetchSession()
      const interval = setInterval(fetchSession, 15000) // Poll every 15 seconds
      return () => clearInterval(interval)
    }
  }, [content.status, fetchSession])

  const getStatusBadge = () => {
    const statusConfig: Record<
      string,
      { label: string; icon: any; className: string }
    > = {
      draft: {
        label: 'Draft',
        icon: FileText,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      optimizing: {
        label: 'Optimizing',
        icon: Loader2,
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      reviewing: {
        label: 'Review',
        icon: Eye,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      approved: {
        label: 'Approved',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      published: {
        label: 'Published',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      archived: {
        label: 'Archived',
        icon: Clock,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const config = statusConfig[content.status] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        <Icon
          className={`h-3 w-3 ${content.status === 'optimizing' ? 'animate-spin' : ''}`}
        />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className={`hover:border-gray-300 transition-colors ${loadingSession ? 'opacity-90' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/dashboard/content/${content.id}`}>
                <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                  {content.title}
                </h3>
              </Link>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="capitalize">{content.content_type.replace('_', ' ')}</span>
              <span>•</span>
              <span>Version {content.optimization_version}</span>
              <span>•</span>
              <span>{formatDate(content.created_at)}</span>
            </div>

            {/* Content Preview */}
            {(content.original_content || content.optimized_content) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {((content.optimized_content || content.original_content) || '').substring(0, 150)}
                {((content.optimized_content || content.original_content) || '').length > 150 ? '...' : ''}
              </p>
            )}

            {content.target_keywords && content.target_keywords.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                {content.target_keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {content.target_keywords.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{content.target_keywords.length - 3} more
                  </span>
                )}
              </div>
            )}

            {content.status === 'optimizing' && session && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Iteration {session.current_iteration} of {session.max_iterations}
                  </span>
                  {session.current_score > 0 && (
                    <span className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      Score: {session.current_score.toFixed(2)}/10
                    </span>
                  )}
                </div>
                <Progress
                  value={(session.current_iteration / session.max_iterations) * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNavigatingView(true)
                router.push(`/dashboard/content/${content.id}`)
              }}
              disabled={navigatingView || navigatingReview}
            >
              {navigatingView ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </>
              )}
            </Button>

            {content.status === 'reviewing' && (
              <Button
                size="sm"
                onClick={() => {
                  setNavigatingReview(true)
                  router.push(`/dashboard/content/${content.id}`)
                }}
                disabled={navigatingView || navigatingReview}
              >
                {navigatingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Review
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
