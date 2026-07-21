"use client"

/**
 * Content Edit Page
 * Edit existing content before re-optimization
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBrand } from '@/lib/contexts/brand-context'
import { useToast } from '@/components/layout/notification-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface ContentData {
  id: string
  title: string
  content: string
  content_type: string
  target_audience: string
  content_goals: string[]
  keywords: string[]
  optimization_strategy: string
  max_iterations: number
  status: string
}

import { use } from 'react'

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { currentBrand } = useBrand()
  const { addToast, ToastContainer } = useToast()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reoptimizing, setReoptimizing] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<string>('article')
  const [targetAudience, setTargetAudience] = useState('')
  const [contentGoals, setContentGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [optimizationStrategy, setOptimizationStrategy] = useState<string>('balanced')
  const [maxIterations, setMaxIterations] = useState(3)
  const [generatingContent, setGeneratingContent] = useState(false)

  // Strip HTML tags for word count
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  const wordCount = content.trim() ? stripHtml(content).trim().split(/\s+/).filter(word => word.length > 0).length : 0

  // Fetch existing content
  useEffect(() => {
    const fetchContent = async () => {
      if (!currentBrand?.id) return

      try {
        const response = await fetch(`/api/content/gseo?content_id=${id}`)
        if (!response.ok) throw new Error('Failed to fetch content')

        const data = await response.json()
        const contentData: ContentData = data.content

        // Pre-populate form
        setTitle(contentData.title || '')
        setContent(contentData.original_content || '')
        setContentType(contentData.content_type || 'article')
        setTargetAudience(contentData.target_audience || '')
        setContentGoals(contentData.content_goals || [])
        setKeywords(contentData.target_keywords || [])
        setOptimizationStrategy(contentData.optimization_strategy || 'balanced')
        // Clamp max_iterations to valid range (1-5)
        const iterations = contentData.max_iterations || 3
        setMaxIterations(Math.min(Math.max(iterations, 1), 5))
        
        setLoading(false)
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Failed to Load',
          message: error instanceof Error ? error.message : 'Could not load content'
        })
        setLoading(false)
      }
    }

    fetchContent()
  }, [id, currentBrand?.id, addToast])

  const handleAddGoal = () => {
    if (goalInput.trim() && !contentGoals.includes(goalInput.trim())) {
      setContentGoals([...contentGoals, goalInput.trim()])
      setGoalInput('')
    }
  }

  const handleRemoveGoal = (goal: string) => {
    setContentGoals(contentGoals.filter(g => g !== goal))
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleGenerateContent = async () => {
    // Validate minimum requirements
    if (!content || stripHtml(content).trim().split(/\s+/).length < 10) {
      addToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter at least 10 words of content before generating'
      })
      return
    }
    
    setGeneratingContent(true)
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'rewrite',
          type: 'content',
          input: stripHtml(content),
          contentType,
          targetAudience,
          keywords,
          contentGoals,
          tone: 'professional',
          length: 'comprehensive'
        })
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      setContent(data.result)
      
      addToast({
        type: 'success',
        title: 'Content Generated',
        message: 'AI has regenerated your content based on your specifications'
      })
    } catch (error) {
      console.error('Content generation error:', error)
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Could not generate content'
      })
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleSave = async () => {
    if (!currentBrand?.id) {
      addToast({
        type: 'error',
        title: 'Brand Required',
        message: 'Please select a brand first'
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Title and content are required'
      })
      return
    }

    if (wordCount < 50) {
      addToast({
        type: 'error',
        title: 'Content Too Short',
        message: 'Content must be at least 50 words'
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/content/gseo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: id,
          title,
          content,
          content_type: contentType,
          target_audience: targetAudience,
          content_goals: contentGoals,
          keywords,
          optimization_strategy: optimizationStrategy,
          max_iterations: maxIterations,
          brand_id: currentBrand.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      addToast({
        type: 'success',
        title: 'Saved Successfully',
        message: 'Your changes have been saved'
      })

      // Redirect back to detail page
      setTimeout(() => {
        router.push(`/dashboard/content/${id}`)
      }, 1000)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save changes'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndReoptimize = async () => {
    if (!currentBrand?.id) {
      addToast({
        type: 'error',
        title: 'Brand Required',
        message: 'Please select a brand first'
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Title and content are required'
      })
      return
    }

    if (wordCount < 50) {
      addToast({
        type: 'error',
        title: 'Content Too Short',
        message: 'Content must be at least 50 words'
      })
      return
    }

    setReoptimizing(true)
    try {
      // First, save the changes
      const updateResponse = await fetch('/api/content/gseo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: id,
          title,
          content,
          content_type: contentType,
          target_audience: targetAudience,
          content_goals: contentGoals,
          keywords,
          optimization_strategy: optimizationStrategy,
          max_iterations: maxIterations,
          brand_id: currentBrand.id
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to save changes')
      }

      // Then trigger re-optimization
      console.log('🔄 Re-optimizing with max_iterations:', maxIterations)
      const optimizeResponse = await fetch('/api/content/gseo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'optimize'
        },
        body: JSON.stringify({
          content_id: id,
          brand_id: currentBrand.id,
          max_iterations: maxIterations
        })
      })

      if (!optimizeResponse.ok) {
        throw new Error('Failed to start optimization')
      }

      addToast({
        type: 'success',
        title: 'Re-optimizing Content',
        message: 'Your changes have been saved and optimization started'
      })

      // Redirect to detail page to watch optimization
      setTimeout(() => {
        router.push(`/dashboard/content/${id}`)
      }, 1500)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Operation Failed',
        message: error instanceof Error ? error.message : 'Failed to save and re-optimize'
      })
    } finally {
      setReoptimizing(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
        <ToastContainer />
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
              <Link href={`/dashboard/content/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Details</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[60vw]">{title || 'Edit Content'}</p>
                <p className="text-xs text-gray-500">Modify content before re-optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <ToastContainer />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>Edit your content information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter content title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="content">Content *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleGenerateContent}
                    disabled={generatingContent}
                  >
                    {generatingContent ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 text-blue-600 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Edit your content here... Use the toolbar to format text, add links, images, tables, and more."
                  minHeight="500px"
                  brandId={currentBrand?.id}
                  editable={!generatingContent}
                />
                <div className="flex justify-between text-xs mt-2">
                  <span className={wordCount >= 50 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {wordCount} words {wordCount < 50 ? `(minimum 50 required)` : '✓'}
                  </span>
                  <span className="text-muted-foreground">{content.length} characters</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="contentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="product">Product Description</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Tech professionals"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keywords & Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Keywords & Goals</CardTitle>
              <CardDescription>Define target keywords and content objectives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddKeyword()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddKeyword} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        {keyword}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Content Goals</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add goal..."
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddGoal()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddGoal} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {contentGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contentGoals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="gap-1">
                        {goal}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveGoal(goal)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Optimization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>Configure AI optimization parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={optimizationStrategy} onValueChange={setOptimizationStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Conservative</span>
                        <span className="text-xs text-muted-foreground">⏱️ ~2-3 min • Light edits</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="balanced">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Balanced</span>
                        <span className="text-xs text-muted-foreground">⏱️ ~5-7 min • Best balance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="aggressive">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Aggressive</span>
                        <span className="text-xs text-muted-foreground">⏱️ ~8-12 min • Extensive rewriting</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Comprehensive</span>
                        <span className="text-xs text-muted-foreground">⏱️ ~15-20 min • Full analysis</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="iterations">Max Iterations</Label>
                  <span className="text-sm font-medium">{maxIterations}</span>
                </div>
                <input
                  id="iterations"
                  type="range"
                  min="1"
                  max="5"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 (Quick)</span>
                  <span>5 (Thorough)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Each iteration analyzes and improves your content. More iterations = better results but longer processing time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <AlertCircle className="h-5 w-5" />
                Editing Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                • Make changes to improve your content foundation
              </p>
              <p>
                • Updated keywords and goals will guide re-optimization
              </p>
              <p>
                • Save without re-optimizing to keep current scores
              </p>
              <p>
                • Re-optimize after changes for best results
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSaveAndReoptimize}
              disabled={saving || reoptimizing || !title.trim() || !content.trim() || wordCount < 50}
              className="w-full"
              size="lg"
            >
              {reoptimizing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving & Re-optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Save & Re-optimize
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || reoptimizing || !title.trim() || !content.trim() || wordCount < 50}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes Only
                </>
              )}
            </Button>

            <Link href={`/dashboard/content/${id}`} className="block">
              <Button
                variant="ghost"
                className="w-full"
                disabled={saving || reoptimizing}
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
