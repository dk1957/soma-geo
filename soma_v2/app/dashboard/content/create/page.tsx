"use client"

/**
 * Content Creation Page
 * Professional content creation interface with multiple input methods
 * Loads configuration from admin-managed API (content types, strategies, settings)
 * Shows AI-driven content suggestions based on brand visibility insights
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useBrand } from '@/lib/contexts/brand-context'
import { useToast } from '@/components/layout/notification-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { documentParser } from '@/lib/services/document-parser'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { AIGenerationDialog } from '@/components/ai-generation-dialog'

// ─── Types for API-loaded config ───────────────────────────
interface ContentTypeOption {
  value: string
  label: string
  description?: string
  enabled: boolean
}
interface OptimizationStrategyOption {
  value: string
  label: string
  description: string
  time_estimate: string
  enabled: boolean
}
interface ExecutionSettingDef {
  value: number
  min: number
  max: number
  description: string
}
interface PipelineConfig {
  content_types: ContentTypeOption[]
  optimization_strategies: OptimizationStrategyOption[]
  execution_settings: {
    max_iterations: ExecutionSettingDef
    convergence_threshold: ExecutionSettingDef
    plateau_window: ExecutionSettingDef
    num_queries: ExecutionSettingDef
  }
}
interface ContentSuggestion {
  id: string
  type: 'opportunity' | 'gap' | 'improve' | 'trending'
  title: string
  description: string
  suggested_content_type: string
  suggested_keywords: string[]
  priority: 'high' | 'medium' | 'low'
  source: string
  estimated_impact: string
}

// ─── Fallback config (used while API loads or on error) ────
const FALLBACK_CONFIG: PipelineConfig = {
  content_types: [
    { value: "article", label: "Article", enabled: true },
    { value: "blog_post", label: "Blog Post", enabled: true },
    { value: "whitepaper", label: "Whitepaper", enabled: true },
    { value: "guide", label: "Guide", enabled: true },
    { value: "case_study", label: "Case Study", enabled: true },
    { value: "faq", label: "FAQ", enabled: true },
    { value: "landing_page", label: "Landing Page", enabled: true },
  ],
  optimization_strategies: [
    { value: "conservative", label: "Conservative", description: "Light edits for quick wins", time_estimate: "~2-3 min", enabled: true },
    { value: "balanced", label: "Balanced", description: "Moderate improvements (recommended)", time_estimate: "~5-7 min", enabled: true },
    { value: "aggressive", label: "Aggressive", description: "Extensive rewriting for maximum impact", time_estimate: "~8-12 min", enabled: true },
    { value: "comprehensive", label: "Comprehensive", description: "Deep analysis + restructuring", time_estimate: "~15-20 min", enabled: true },
  ],
  execution_settings: {
    max_iterations: { value: 3, min: 1, max: 5, description: "Maximum optimization cycles" },
    convergence_threshold: { value: 0.5, min: 0.1, max: 2.0, description: "Score variance threshold" },
    plateau_window: { value: 3, min: 2, max: 10, description: "Plateau detection window" },
    num_queries: { value: 5, min: 3, max: 25, description: "Benchmark queries per cycle" },
  },
}

export default function CreateContentPage() {
  const router = useRouter()
  const { currentBrand, isLoading } = useBrand()
  const { addToast, ToastContainer } = useToast()

  const [activeTab, setActiveTab] = useState<'manual' | 'url' | 'file'>('manual')
  const [loading, setLoading] = useState(false)
  const [processingStage, setProcessingStage] = useState<'creating' | 'optimizing' | 'complete' | null>(null)
  const [extracting, setExtracting] = useState(false)

  // Pipeline config from API
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>(FALLBACK_CONFIG)
  const [configLoaded, setConfigLoaded] = useState(false)

  // Content suggestions from insights
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  // AI Generation Dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiDialogMode, setAiDialogMode] = useState<'title' | 'content'>('title')
  
  // Inline AI generation state
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)

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
  const [runMode, setRunMode] = useState(false)

  // URL input
  const [url, setUrl] = useState('')

  // File upload
  const [file, setFile] = useState<File | null>(null)

  // Strip HTML tags for word count
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  const wordCount = content.trim() ? stripHtml(content).trim().split(/\s+/).filter(word => word.length > 0).length : 0

  // ─── Load pipeline config from API ─────────────────────────
  useEffect(() => {
    let cancelled = false
    async function loadConfig() {
      try {
        const res = await fetch('/api/content/config')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.config) {
          setPipelineConfig(data.config)
          // Set default maxIterations from config
          setMaxIterations(data.config.execution_settings?.max_iterations?.value ?? 3)
        }
      } catch {
        // Use fallback config silently
      } finally {
        if (!cancelled) setConfigLoaded(true)
      }
    }
    loadConfig()
    return () => { cancelled = true }
  }, [])

  // ─── Load content suggestions from insights ───────────────
  useEffect(() => {
    if (!currentBrand?.id) return
    let cancelled = false
    async function loadSuggestions() {
      setSuggestionsLoading(true)
      try {
        const res = await fetch(`/api/content/suggestions?brand_id=${currentBrand!.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.suggestions) {
          setSuggestions(data.suggestions)
        }
      } catch {
        // Suggestions are optional — fail silently
      } finally {
        if (!cancelled) setSuggestionsLoading(false)
      }
    }
    loadSuggestions()
    return () => { cancelled = true }
  }, [currentBrand?.id])

  // ─── Apply suggestion to form ─────────────────────────────
  const applySuggestion = useCallback((suggestion: ContentSuggestion) => {
    setTitle(suggestion.title)
    if (suggestion.suggested_keywords.length > 0) {
      setKeywords(prev => [...new Set([...prev, ...suggestion.suggested_keywords])])
    }
    if (suggestion.suggested_content_type) {
      setContentType(suggestion.suggested_content_type)
    }
    setActiveTab('manual')
    addToast({
      type: 'success',
      title: 'Suggestion Applied',
      message: 'Title and keywords have been pre-filled. Add content and start optimization!'
    })
  }, [addToast])

  // Derived: enabled content types and strategies from config
  const enabledContentTypes = pipelineConfig.content_types.filter(t => t.enabled)
  const enabledStrategies = pipelineConfig.optimization_strategies.filter(s => s.enabled)
  const iterationConfig = pipelineConfig.execution_settings.max_iterations

  // Persist form state to localStorage to prevent data loss on tab switch
  useEffect(() => {
    const storageKey = `content-create-draft-${currentBrand?.id || 'default'}`
    
    // Restore from localStorage on mount
    const savedDraft = localStorage.getItem(storageKey)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.title) setTitle(draft.title)
        if (draft.content) setContent(draft.content)
        if (draft.contentType) setContentType(draft.contentType)
        if (draft.targetAudience) setTargetAudience(draft.targetAudience)
        if (draft.contentGoals) setContentGoals(draft.contentGoals)
        if (draft.keywords) setKeywords(draft.keywords)
        if (draft.optimizationStrategy) setOptimizationStrategy(draft.optimizationStrategy)
        if (draft.maxIterations) setMaxIterations(draft.maxIterations)
        if (draft.runMode !== undefined) setRunMode(draft.runMode)
        if (draft.activeTab) setActiveTab(draft.activeTab)
      } catch (error) {
        console.error('Failed to restore draft:', error)
      }
    }
  }, [currentBrand?.id])

  // Save to localStorage whenever form state changes
  useEffect(() => {
    if (!currentBrand?.id) return
    
    const storageKey = `content-create-draft-${currentBrand.id}`
    const draft = {
      title,
      content,
      contentType,
      targetAudience,
      contentGoals,
      keywords,
      optimizationStrategy,
      maxIterations,
      runMode,
      activeTab,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [currentBrand?.id, title, content, contentType, targetAudience, contentGoals, keywords, optimizationStrategy, maxIterations, runMode, activeTab])

  // Clear draft on successful submission
  const clearDraft = () => {
    if (!currentBrand?.id) return
    const storageKey = `content-create-draft-${currentBrand.id}`
    localStorage.removeItem(storageKey)
  }

  const handleGenerateTitle = async () => {
    // Validate minimum input
    const input = title || keywords.join(', ')
    if (!input || input.trim().length < 3) {
      addToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter a title or add keywords before generating'
      })
      return
    }
    
    setGeneratingTitle(true)
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: title ? 'rewrite' : 'generate',
          type: 'title',
          input: input,
          contentType,
          targetAudience,
          keywords,
          tone: 'professional'
        })
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      setTitle(data.result)
      
      addToast({
        type: 'success',
        title: 'Title Generated',
        message: 'AI-generated title has been added'
      })
    } catch (error) {
      console.error('Title generation error:', error)
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate title. Please try again.'
      })
    } finally {
      setGeneratingTitle(false)
    }
  }

  const handleGenerateContent = async () => {
    // Use existing content if available, otherwise use title/keywords as seed
    const existingContent = content ? stripHtml(content).trim() : ''
    const seedInput = title || keywords.join(', ')
    
    // Validate we have something to work with
    if (!existingContent && (!seedInput || seedInput.length < 3)) {
      addToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter a title, add keywords, or write some content before generating'
      })
      return
    }
    
    // For rewriting, need at least 10 words of existing content
    if (existingContent && existingContent.split(/\s+/).filter(w => w.length > 0).length < 10) {
      addToast({
        type: 'error',
        title: 'More Content Needed',
        message: 'Please write or paste at least 10 words before using AI to regenerate content'
      })
      return
    }
    
    setGeneratingContent(true)
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: existingContent ? 'rewrite' : 'generate',
          type: 'content',
          input: existingContent || seedInput,
          contentType,
          targetAudience,
          contentGoals,
          keywords,
          tone: 'professional',
          length: 'comprehensive' // Full content generation for better AI optimization
        })
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      
      console.log('🔍 Frontend received response:', {
        success: data.success,
        hasResult: !!data.result,
        resultLength: data.result?.length || 0,
        resultPreview: data.result?.substring(0, 200) || 'No result'
      })
      
      // Replace entire content with new AI-generated content
      console.log('📝 Setting content in editor...')
      setContent(data.result)
      console.log('✅ Content set! New content length:', data.result?.length || 0)
      
      const mode = existingContent ? 'rewritten' : 'generated'
      const wordCount = data.result ? stripHtml(data.result).split(/\s+/).filter((w: string) => w.length > 0).length : 0
      
      console.log('📊 Final stats:', { mode, wordCount, contentType })
      
      addToast({
        type: 'success',
        title: `Content ${mode.charAt(0).toUpperCase() + mode.slice(1)} Successfully`,
        message: `AI has created ${wordCount} words of ${contentType} content optimized for ${targetAudience || 'your audience'}${contentGoals.length > 0 ? ' with your content goals' : ''}${keywords.length > 0 ? ' and target keywords' : ''}. Previous content has been completely replaced.`
      })
    } catch (error) {
      console.error('Content generation error:', error)
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate content. Please try again.'
      })
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleExtractFromUrl = async () => {
    if (!url) {
      addToast({
        type: 'error',
        title: 'URL Required',
        message: 'Please enter a valid URL'
      })
      return
    }

    setExtracting(true)
    try {
      // Use server-side API to avoid CORS issues
      const response = await fetch('/api/content/extract-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to extract content')
      }

      const result = await response.json()
      
      setTitle(result.title || 'Untitled')
      setContent(result.content)
      
      // Extract keywords from text content (strip HTML for keyword extraction)
      const textContent = result.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      const topics = documentParser.extractKeyTopics(textContent)
      setKeywords(topics.slice(0, 5))

      // Switch to manual tab to show the rich text editor with formatted content
      setActiveTab('manual')

      addToast({
        type: 'success',
        title: 'Content Extracted',
        message: `Successfully extracted ${result.metadata.wordCount} words with formatting preserved`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Extraction Failed',
        message: error instanceof Error ? error.message : 'Could not extract content from URL'
      })
    } finally {
      setExtracting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    // Check file size (5MB limit)
    if (uploadedFile.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'File size must be less than 5MB'
      })
      return
    }

    setFile(uploadedFile)
    setExtracting(true)

    try {
      // Use server-side API for file parsing (supports all formats including PDF/DOCX)
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/content/parse-file', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to parse file')
      }

      const result = await response.json()
      
      setTitle(result.title || uploadedFile.name.replace(/\.[^/.]+$/, ''))
      setContent(result.content)

      // Extract keywords from content
      const textContent = result.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      const topics = documentParser.extractKeyTopics(textContent)
      setKeywords(topics.slice(0, 5))

      addToast({
        type: 'success',
        title: 'File Processed',
        message: `Successfully processed ${uploadedFile.name} (${result.metadata.wordCount} words)`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Processing Failed',
        message: error instanceof Error ? error.message : 'Could not process file'
      })
    } finally {
      setExtracting(false)
    }
  }

  const addContentGoal = () => {
    if (goalInput.trim() && !contentGoals.includes(goalInput.trim())) {
      setContentGoals([...contentGoals, goalInput.trim()])
      setGoalInput('')
    }
  }

  const removeContentGoal = (goal: string) => {
    setContentGoals(contentGoals.filter(g => g !== goal))
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleSubmit = async () => {
    if (!currentBrand) {
      addToast({
        type: 'error',
        title: 'No Brand Selected',
        message: 'Please select a brand first'
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide both title and content'
      })
      return
    }

    if (content.trim().split(/\s+/).length < 50) {
      addToast({
        type: 'error',
        title: 'Content Too Short',
        message: 'Content must be at least 50 words'
      })
      return
    }

    setLoading(true)
    setProcessingStage('creating')

    try {
      // Single pipeline call — creates content AND starts optimization in one request
      addToast({
        type: 'info',
        title: 'Creating & Optimizing',
        message: 'Setting up your content and starting AI optimization...'
      })

      const pipelineResponse = await fetch('/api/content/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          title,
          content,
          content_type: contentType,
          source_type: activeTab,
          source_url: activeTab === 'url' ? url : undefined,
          source_file_name: activeTab === 'file' ? file?.name : undefined,
          target_audience: targetAudience || undefined,
          content_goals: contentGoals,
          brand_voice: currentBrand.brand_voice,
          target_keywords: keywords,
          optimization_strategy: optimizationStrategy,
          max_iterations: maxIterations,
          run_mode: runMode,
          auto_optimize: true,
        })
      })

      if (!pipelineResponse.ok) {
        const err = await pipelineResponse.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create content')
      }

      const result = await pipelineResponse.json()

      setProcessingStage('complete')

      addToast({
        type: 'success',
        title: 'Optimization In Progress!',
        message: 'AI agents are optimizing your content. Taking you to the results page...'
      })

      // Clear the draft since content was successfully created
      clearDraft()

      // Redirect immediately — no delay
      router.push(`/dashboard/content/${result.content_id}`)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Process Failed',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
      setProcessingStage(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <ToastContainer />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-600 mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading Brand</h3>
            <p className="text-muted-foreground">Please wait while we load your brand context...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentBrand) {
    return (
      <div className="container mx-auto px-6 py-6">
        <ToastContainer />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Brand Selected</h3>
            <p className="text-muted-foreground mb-4">Please select a brand to create content</p>
            <Link href="/dashboard/content">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
            </Link>
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
              <Link href="/dashboard/content" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Content</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Create Content</p>
                <p className="text-xs text-gray-500">Add new content to optimize for AI search engines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <ToastContainer />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Input */}
          <Card>
            <CardHeader>
              <CardTitle>Content Input</CardTitle>
              <CardDescription>Choose how you want to provide your content</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">
                    <FileText className="h-4 w-4 mr-2" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    File
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-base font-semibold">Content Title *</Label>
                      <span className={`mt-1 ${
                        title.length === 0 ? 'text-muted-foreground' :
                        title.length < 30 ? 'text-orange-600' :
                        title.length > 60 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {title.length} / 60 characters
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="title"
                        placeholder="Enter an engaging, descriptive title for your content..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={generatingTitle}
                        className="text-lg h-12 pr-10 placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50"
                        title={generatingTitle ? 'Generating...' : 'Generate title with AI'}
                        onClick={handleGenerateTitle}
                        disabled={generatingTitle}
                      >
                        {generatingTitle ? (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Aim for 30-60 characters. Clear, descriptive titles perform better in AI search results.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                     <Label htmlFor="content" className="text-base font-semibold">Content Body*</Label>
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
                    <div className="mt-1">
                      <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Write or paste your content here... Use the toolbar to format text, add links, images, and more."
                        minHeight="400px"
                        brandId={currentBrand?.id}
                        editable={!generatingContent}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className={wordCount >= 50 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                        {wordCount} words {wordCount < 50 ? `(minimum 50 required)` : '✓'}
                      </span>
                      <span className="text-muted-foreground">{content.length} characters</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Tip: Write or paste at least 10 words, then click "Generate with AI" to transform your content into a professionally optimized {contentType} based on your audience, goals, and keywords. The AI will completely rewrite and replace your content.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="url">Article URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com/article"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                      <Button
                        onClick={handleExtractFromUrl}
                        disabled={extracting || !url}
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          'Extract'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll automatically extract the article with formatting preserved (headers, lists, images, tables, quotes)
                    </p>
                  </div>

                  {content && title && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">Content Extracted Successfully!</h4>
                          <p className="text-sm text-green-700 mb-2">
                            We've extracted <strong>{wordCount} words</strong> from the URL with all formatting preserved.
                          </p>
                          <p className="text-sm text-green-700">
                            Switch to the <strong>Manual</strong> tab to view and edit the content in the rich text editor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="file" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="file-upload">Upload File</Label>
                    <div className="mt-1">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {file ? (
                                <span className="font-medium">{file.name}</span>
                              ) : (
                                <>
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              TXT, MD, HTML, PDF, DOCX (MAX. 5MB)
                            </p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".txt,.md,.html,.htm,.pdf,.docx,.doc"
                            onChange={handleFileUpload}
                            disabled={extracting}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {content && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="file-title" className="text-base font-semibold">Content Title *</Label>
                          <span className={`mt-1 ${
                            title.length === 0 ? 'text-muted-foreground' :
                            title.length < 30 ? 'text-orange-600' :
                            title.length > 60 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {title.length} / 60 characters
                          </span>
                        </div>
                        <Input
                          id="file-title"
                          placeholder="Enter an engaging, descriptive title for your content..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="text-lg h-12 placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Aim for 30-60 characters. Clear, descriptive titles perform better in AI search results.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="file-content" className="text-base font-semibold">Content Body *</Label>
                        <div className="mt-1">
                          <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Your uploaded content appears here. You can edit and format it using the toolbar."
                            minHeight="400px"
                            brandId={currentBrand?.id}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className={wordCount >= 50 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                            {wordCount} words {wordCount < 50 ? `(minimum 50 required)` : '✓'}
                          </span>
                          <span className="text-muted-foreground">{content.length} characters</span>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Sidebar */}
        <div className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set content type, audience, and keywords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger id="content-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledContentTypes.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target-audience">Target Audience</Label>
                <Input
                  id="target-audience"
                  placeholder="e.g., Tech professionals"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Content Goals</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a goal..."
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContentGoal())}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addContentGoal}
                    disabled={!goalInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {contentGoals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contentGoals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="gap-1 pr-1 pl-2">
                        <span>{goal}</span>
                        <button
                          type="button"
                          className="ml-1 hover:text-red-600 transition-colors focus:outline-none"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeContentGoal(goal)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Target Keywords</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addKeyword}
                    disabled={!keywordInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1 pr-1 pl-2">
                        <span>{keyword}</span>
                        <button
                          type="button"
                          className="ml-1 hover:text-red-600 transition-colors focus:outline-none"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeKeyword(keyword)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>Configure AI optimization strategy and iterations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={optimizationStrategy} onValueChange={setOptimizationStrategy}>
                  <SelectTrigger id="strategy" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledStrategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{s.label}</span>
                          <span className="text-xs text-muted-foreground">{s.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const activeStrategy = enabledStrategies.find(s => s.value === optimizationStrategy)
                  return activeStrategy ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱️ {activeStrategy.time_estimate} • {activeStrategy.description}
                    </p>
                  ) : null
                })()}
              </div>

              <div>
                <Label htmlFor="iterations">Max Iterations: {maxIterations}</Label>
                <input
                  id="iterations"
                  type="range"
                  min={iterationConfig.min}
                  max={iterationConfig.max}
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{iterationConfig.min} (Quick)</span>
                  <span>{iterationConfig.max} (Thorough)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {iterationConfig.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="run-mode"
                  checked={runMode}
                  onChange={(e) => setRunMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="run-mode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable Fast Run Mode
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Use for testing and demos. Skips real AI analysis for instant results.
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {loading && processingStage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">
                        {processingStage === 'creating' && 'Creating your content...'}
                        {processingStage === 'optimizing' && 'Starting AI optimization...'}
                        {processingStage === 'complete' && 'Redirecting to results...'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1 ml-6">
                      {processingStage === 'creating' && 'Saving to database and preparing for optimization'}
                      {processingStage === 'optimizing' && (runMode ? 'Running run...' : 'Initializing AI agents for multi-dimensional analysis')}
                      {processingStage === 'complete' && 'You\'ll see real-time progress on the next page'}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleSubmit}
                  disabled={loading || title.trim().length === 0 || content.trim().length === 0 || wordCount < 50}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processingStage === 'creating' && 'Creating...'}
                      {processingStage === 'optimizing' && 'Optimizing...'}
                      {processingStage === 'complete' && 'Redirecting...'}
                      {!processingStage && 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create & Optimize with AI
                    </>
                  )}
                </Button>
                
                {!loading && (
                  <p className="text-xs text-center text-muted-foreground">
                    This will create your content and start optimization with {maxIterations} iterations using our {runMode ? 'run engine' : 'Multi-Agent AI System'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Optimization Info */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-blue-900 mb-1">
                    AI-Powered Optimization
                  </h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Our Multi-Agent AI System will analyze and optimize your content across 6 dimensions: 
                    visibility score, source accuracy, content accuracy, key info coverage, semantic contribution, 
                    and ranking strength.
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-1 h-1 rounded-full bg-blue-600" />
                      <span>Real-time progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-1 h-1 rounded-full bg-blue-600" />
                      <span>Iterative improvements</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-1 h-1 rounded-full bg-blue-600" />
                      <span>Detailed scoring & feedback</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Suggestions from Insights */}
          {(suggestions.length > 0 || suggestionsLoading) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Content Suggestions
                </CardTitle>
                <CardDescription className="text-xs">
                  AI-driven suggestions based on your brand&apos;s visibility gaps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestionsLoading ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing visibility data...
                  </div>
                ) : (
                  suggestions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {s.type === 'opportunity' && <Target className="h-3.5 w-3.5 text-green-600" />}
                          {s.type === 'gap' && <TrendingUp className="h-3.5 w-3.5 text-orange-600" />}
                          {s.type === 'improve' && <Sparkles className="h-3.5 w-3.5 text-blue-600" />}
                          {s.type === 'trending' && <TrendingUp className="h-3.5 w-3.5 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-900">
                            {s.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {s.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] px-1.5 py-0 ${
                                s.priority === 'high' ? 'bg-red-50 text-red-700' :
                                s.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {s.priority}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">{s.source}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 mt-0.5 shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {/* AI Generation Dialog */}
      <AIGenerationDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        mode={aiDialogMode}
        currentValue={aiDialogMode === 'title' ? title : content}
        onGenerate={(generated) => {
          if (aiDialogMode === 'title') {
            setTitle(generated)
          } else {
            setContent(generated)
          }
          addToast({
            type: 'success',
            title: 'Content Generated',
            message: `AI-generated ${aiDialogMode} has been added`
          })
        }}
        contentType={contentType}
        targetAudience={targetAudience}
        keywords={keywords}
      />
    </>
  )
}
