'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBrand } from '@/lib/contexts/brand-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Sparkles, 
  Search, 
  MoreVertical, 
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Globe,
  RefreshCw,
  Lightbulb,
  FileText,
  Loader2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { NextQueryCountdown } from '@/components/next-query-countdown'
import { QuotaLimitDialog } from '@/components/subscription/quota-limit-dialog'
import { useCanPerformAction } from '@/hooks/use-subscription'

// Types
interface Topic {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  description?: string
  prompt_count: number
  created_at: string
}

interface Prompt {
  id: string
  prompt_text: string
  category: 'branded' | 'discovery' | 'general'
  priority: number
  is_selected: boolean
  topic_id?: string
  topic?: Topic
  intent_type?: string
  context_details?: Record<string, any>
  locale?: string
  country_name?: string
  created_at: string
  updated_at: string
  execution_status: 'draft' | 'active' | 'archived'
  // Performance metrics (from API)
  lvi_score?: number | null
  gsov_score?: number | null
  mentions_count?: number | null
  sentiment_score?: number | null
  position?: number | null
  total_responses?: number
  citation_count?: number
  latest_analysis_date?: string | null
}

interface Suggestion {
  id: string
  prompt_text: string
  prompt_type: string // 'what', 'who', 'how', 'why', 'compare', 'best', 'with_feature', 'general'
  intent: string
  context: string
  status: 'pending' | 'accepted' | 'rejected'
  topic_id?: string
  topic?: Topic
  confidence_score?: number
  created_at: string
}

// Color options for topics
const TOPIC_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
]

const TOPIC_ICONS = [
  'folder', 'star', 'tag', 'bookmark', 'flag', 'heart', 'zap', 'target', 'compass', 'award'
]

// Helper function for relative dates
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60)
    return `${mins}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks}w ago`
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months}mo ago`
  }
  const years = Math.floor(diffInSeconds / 31536000)
  return `${years}y ago`
}

export default function PromptsPage() {
  const { currentBrand, isLoading: brandLoading } = useBrand()
  const router = useRouter()
  
  // Ref to track the current brand ID for staleness detection in async callbacks
  const brandIdRef = useRef<string | null>(null)
  // Ref to hold AbortController for cancelling in-flight fetches on brand change
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track whether the first data fetch has completed (prevents empty flash on back-navigation)
  const initialLoadDoneRef = useRef(false)
  
  // Main state
  const [activeTab, setActiveTab] = useState<'topics' | 'prompts' | 'suggestions'>('prompts')
  const [topics, setTopics] = useState<Topic[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  
  // Expanded topics state for grouped view
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  
  // Selection state for bulk actions
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set())
  const [togglingPrompts, setTogglingPrompts] = useState<Set<string>>(new Set())
  
  // Navigation loading state
  const [navigatingToPrompt, setNavigatingToPrompt] = useState<string | null>(null)
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Loading states
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false)
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false)
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [quotaLimit, setQuotaLimit] = useState<{ current: number; max: number; plan_name?: string; plan_tier?: string } | null>(null)
  
  // Countries and regions for geography selection
  const [countries, setCountries] = useState<{value: string, label: string, region?: string, sub_region?: string}[]>([])
  const [regions, setRegions] = useState<{region: string, sub_regions: string[]}[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'suggested'>('all')

  // Pre-check prompt creation quota
  const { canPerform: canAddMorePrompts, current: promptCount, max: promptMax, loading: promptQuotaLoading, recheck: recheckPromptQuota, planName: promptPlanName, planTier: promptPlanTier } = useCanPerformAction(
    'add_prompt',
    undefined,
    currentBrand?.id
  )

  const handleCreatePromptClick = () => {
    if (!canAddMorePrompts && !promptQuotaLoading) {
      setQuotaLimit({
        current: promptCount,
        max: promptMax,
        plan_name: promptPlanName,
        plan_tier: promptPlanTier,
      })
      return
    }
    setShowCreatePromptDialog(true)
  }
  
  // Reset state when brand changes to prevent showing stale data from different brands
  // Also update the brandIdRef for staleness checks in async callbacks
  useEffect(() => {
    brandIdRef.current = currentBrand?.id || null
    
    // Abort any in-flight fetches from the previous brand
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setTopics([])
    setPrompts([])
    setSuggestions([])
    setExpandedTopics(new Set())
    setSelectedPrompts(new Set())
    setSearchQuery('')
    setSelectedTopic(null)
    setSelectedCategory(null)
    setSelectedFilter('all')
    setSortColumn(null)
    setSortDirection('desc')
    setCreateError(null)
    // Reset initial load tracking when brand changes
    initialLoadDoneRef.current = false
    // Show loader immediately while new brand data loads
    if (currentBrand?.id) {
      setIsLoadingTopics(true)
      setIsLoadingPrompts(true)
      setIsLoadingSuggestions(true)
    } else {
      setIsLoadingTopics(false)
      setIsLoadingPrompts(false)
      setIsLoadingSuggestions(false)
    }
  }, [currentBrand?.id])
  
  // Dialog states
  const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
  const [showCreatePromptDialog, setShowCreatePromptDialog] = useState(false)
  const [showEditPromptDialog, setShowEditPromptDialog] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  
  // Form state
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicColor, setNewTopicColor] = useState(TOPIC_COLORS[0].value)
  const [newTopicIcon, setNewTopicIcon] = useState('folder')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  
  const [newPromptText, setNewPromptText] = useState('')
  const [newPromptCategory, setNewPromptCategory] = useState<'branded' | 'discovery' | 'general'>('general')
  const [newPromptTopicId, setNewPromptTopicId] = useState<string>('')
  const [newPromptLocale, setNewPromptLocale] = useState<string>('')
  
  // Fetch topics
  const fetchTopics = useCallback(async (signal?: AbortSignal) => {
    if (!currentBrand?.id) return
    if (signal?.aborted) return
    const expectedBrandId = currentBrand.id
    
    setIsLoadingTopics(true)
    try {
      const res = await fetch(`/api/content/prompts/topics?brand_id=${currentBrand.id}`, {
        credentials: 'include',
        signal
      })
      if (signal?.aborted) return
      if (!res.ok) {
        console.error('Topics API returned', res.status)
        return
      }
      const data = await res.json()
      // Verify brand hasn't changed while we were fetching
      if (brandIdRef.current !== expectedBrandId) return
      if (data.success) {
        const fetchedTopics = data.topics || []
        setTopics(fetchedTopics)
        // Only expand the first topic by default (all others closed)
        if (fetchedTopics.length > 0) {
          setExpandedTopics(new Set([fetchedTopics[0].id]))
        } else {
          setExpandedTopics(new Set())
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || signal?.aborted) return
      console.error('Error fetching topics:', error)
    } finally {
      if (!signal?.aborted && brandIdRef.current === expectedBrandId) {
        setIsLoadingTopics(false)
      }
    }
  }, [currentBrand?.id])
  
  // Fetch prompts
  const fetchPrompts = useCallback(async (signal?: AbortSignal) => {
    if (!currentBrand?.id) return
    if (signal?.aborted) return
    const expectedBrandId = currentBrand.id
    
    setIsLoadingPrompts(true)
    try {
      const res = await fetch(`/api/content/prompts?brand_id=${currentBrand.id}`, {
        credentials: 'include',
        signal
      })
      if (signal?.aborted) return
      if (!res.ok) {
        console.error('Prompts API returned', res.status)
        return
      }
      const data = await res.json()
      // Verify brand hasn't changed while we were fetching
      if (brandIdRef.current !== expectedBrandId) return
      if (data.success) {
        setPrompts(data.data || [])
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || signal?.aborted) return
      console.error('Error fetching prompts:', error)
    } finally {
      if (!signal?.aborted && brandIdRef.current === expectedBrandId) {
        setIsLoadingPrompts(false)
        initialLoadDoneRef.current = true
      }
    }
  }, [currentBrand?.id])
  
  // Fetch suggestions
  const fetchSuggestions = useCallback(async (signal?: AbortSignal) => {
    if (!currentBrand?.id) return
    if (signal?.aborted) return
    const expectedBrandId = currentBrand.id
    
    setIsLoadingSuggestions(true)
    try {
      const res = await fetch(`/api/content/prompts/suggestions?brand_id=${currentBrand.id}&status=pending`, {
        credentials: 'include',
        signal
      })
      if (signal?.aborted) return
      if (!res.ok) {
        console.error('Suggestions API returned', res.status)
        return
      }
      const data = await res.json()
      // Verify brand hasn't changed while we were fetching
      if (brandIdRef.current !== expectedBrandId) return
      if (data.success) {
        setSuggestions(data.suggestions || [])
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || signal?.aborted) return
      console.error('Error fetching suggestions:', error)
    } finally {
      if (!signal?.aborted && brandIdRef.current === expectedBrandId) {
        setIsLoadingSuggestions(false)
      }
    }
  }, [currentBrand?.id])
  
  // Generate new suggestions
  const generateSuggestions = async (topicId?: string) => {
    if (!currentBrand?.id) return
    
    setIsGeneratingSuggestions(true)
    try {
      const res = await fetch('/api/content/prompts/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          topic_id: topicId,
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        // Refresh suggestions list
        await fetchSuggestions()
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }
  
  // State for add suggestion dialog
  const [addingSuggestion, setAddingSuggestion] = useState<Suggestion | null>(null)
  const [addSuggestionTopicId, setAddSuggestionTopicId] = useState<string>('')
  const [addSuggestionLocale, setAddSuggestionLocale] = useState<string>('')
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false)
  
  // Track which suggestions are being processed (for async button feedback)
  const [processingSuggestions, setProcessingSuggestions] = useState<Set<string>>(new Set())
  
  // Accept suggestion with topic and geo selection
  const acceptSuggestion = async () => {
    if (!currentBrand?.id || !addingSuggestion) return
    
    setIsAddingSuggestion(true)
    setProcessingSuggestions(prev => new Set(prev).add(addingSuggestion.id))
    try {
      const res = await fetch('/api/content/prompts/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: addingSuggestion.id,
          action: 'accept',
          topic_id: addSuggestionTopicId || null,
          locale_id: addSuggestionLocale || null
        }),
        credentials: 'include'
      })
      
      if (res.ok) {
        // Remove from suggestions and refresh prompts
        setSuggestions(prev => prev.filter(s => s.id !== addingSuggestion.id))
        await fetchPrompts()
        await fetchTopics()
        setAddingSuggestion(null)
        setAddSuggestionTopicId('')
        setAddSuggestionLocale('')
      } else {
        const data = await res.json()
        console.error('Error accepting suggestion:', data.error)
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error)
    } finally {
      setIsAddingSuggestion(false)
      setProcessingSuggestions(prev => {
        const newSet = new Set(prev)
        if (addingSuggestion) newSet.delete(addingSuggestion.id)
        return newSet
      })
    }
  }
  
  // Reject suggestion (deletes it) - async with loading state
  const rejectSuggestion = async (suggestionId: string) => {
    // Add to processing set for UI feedback
    setProcessingSuggestions(prev => new Set(prev).add(suggestionId))
    
    try {
      const res = await fetch('/api/content/prompts/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          action: 'reject'
        }),
        credentials: 'include'
      })
      
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error)
    } finally {
      setProcessingSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(suggestionId)
        return newSet
      })
    }
  }
  
  // Create topic
  const createTopic = async () => {
    if (!currentBrand?.id || !newTopicName.trim()) return
    
    setIsCreatingTopic(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/content/prompts/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          name: newTopicName,
          color: newTopicColor,
          icon: newTopicIcon,
          description: newTopicDescription
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (res.status === 409) {
        setCreateError('A topic with this name already exists')
        return
      }
      
      if (res.ok && data.success) {
        setShowCreateTopicDialog(false)
        setNewTopicName('')
        setNewTopicDescription('')
        setCreateError(null)
        await fetchTopics()
      } else {
        setCreateError(data.error || 'Failed to create topic')
      }
    } catch (error) {
      console.error('Error creating topic:', error)
      setCreateError('An unexpected error occurred')
    } finally {
      setIsCreatingTopic(false)
    }
  }
  
  // Update topic
  const updateTopic = async () => {
    if (!editingTopic) return
    
    setIsUpdatingTopic(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/content/prompts/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTopic.id,
          name: newTopicName,
          color: newTopicColor,
          icon: newTopicIcon,
          description: newTopicDescription
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (res.status === 409) {
        setCreateError('A topic with this name already exists')
        return
      }
      
      if (res.ok && data.success) {
        setEditingTopic(null)
        setNewTopicName('')
        setNewTopicDescription('')
        setCreateError(null)
        await fetchTopics()
      } else {
        setCreateError(data.error || 'Failed to update topic')
      }
    } catch (error) {
      console.error('Error updating topic:', error)
      setCreateError('An unexpected error occurred')
    } finally {
      setIsUpdatingTopic(false)
    }
  }
  
  // Delete topic
  const deleteTopic = async (topicId: string) => {
    try {
      const res = await fetch(`/api/content/prompts/topics?id=${topicId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        await fetchTopics()
        await fetchPrompts() // Prompts may have been reassigned
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
    }
  }
  
  // Create prompt
  const createPrompt = async () => {
    if (!currentBrand?.id || !newPromptText.trim()) return
    
    setIsCreatingPrompt(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/content/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          prompt_text: newPromptText,
          category: newPromptCategory,
          topic_id: newPromptTopicId || null,
          locale: newPromptLocale || null,
          execution_status: 'draft'
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setShowCreatePromptDialog(false)
        resetPromptForm()
        setCreateError(null)
        recheckPromptQuota()
        await fetchPrompts()
        await fetchTopics() // Update prompt counts
      } else if (res.status === 403 && data.quota_exceeded) {
        setShowCreatePromptDialog(false)
        setQuotaLimit({
          current: data.current_count ?? data.max_prompts ?? 0,
          max: data.max_prompts ?? 0,
          plan_name: data.plan_name,
          plan_tier: data.plan_tier,
        })
      } else {
        setCreateError(data.error || 'Failed to create prompt')
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
      setCreateError('An unexpected error occurred')
    } finally {
      setIsCreatingPrompt(false)
    }
  }
  
  // Update prompt
  const updatePrompt = async () => {
    if (!editingPrompt) return
    
    setIsUpdatingPrompt(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/content/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPrompt.id,
          prompt_text: newPromptText,
          category: newPromptCategory,
          topic_id: newPromptTopicId || null,
          locale: newPromptLocale || null
        }),
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setShowEditPromptDialog(false)
        setEditingPrompt(null)
        resetPromptForm()
        setCreateError(null)
        await fetchPrompts()
        await fetchTopics()
      } else {
        setCreateError(data.error || 'Failed to update prompt')
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
      setCreateError('An unexpected error occurred')
    } finally {
      setIsUpdatingPrompt(false)
    }
  }
  
  // Delete prompt
  const deletePrompt = async (promptId: string) => {
    try {
      const res = await fetch(`/api/content/prompts?id=${promptId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        await fetchPrompts()
        await fetchTopics()
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }
  
  // Helper to reset prompt form
  const resetPromptForm = () => {
    setNewPromptText('')
    setNewPromptCategory('general')
    setNewPromptTopicId('')
    setNewPromptLocale('')
    setCreateError(null)
  }
  
  // Fetch countries and build regions data
  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true)
    try {
      const res = await fetch('/api/countries', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success && data.countries) {
        // Set countries with region info
        setCountries(data.countries.map((c: any) => ({
          value: c.id || c.code,
          label: `${c.flag_emoji || ''} ${c.name}`.trim(),
          region: c.region,
          sub_region: c.sub_region
        })))
        
        // Build unique regions and sub-regions for grouping
        const regionMap = new Map<string, Set<string>>()
        data.countries.forEach((c: any) => {
          if (c.region) {
            if (!regionMap.has(c.region)) {
              regionMap.set(c.region, new Set())
            }
            if (c.sub_region) {
              regionMap.get(c.region)!.add(c.sub_region)
            }
          }
        })
        
        const regionsData = Array.from(regionMap.entries()).map(([region, subRegions]) => ({
          region,
          sub_regions: Array.from(subRegions).sort()
        })).sort((a, b) => a.region.localeCompare(b.region))
        
        setRegions(regionsData)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setIsLoadingCountries(false)
    }
  }, [])
  
  // Open edit dialog for prompt
  const openEditPromptDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setNewPromptText(prompt.prompt_text)
    setNewPromptCategory(prompt.category)
    setNewPromptTopicId(prompt.topic_id || '')
    setNewPromptLocale(prompt.locale || '')
    setCreateError(null)
    setShowEditPromptDialog(true)
  }
  
  // Open edit dialog for topic
  const openEditTopicDialog = (topic: Topic) => {
    setEditingTopic(topic)
    setNewTopicName(topic.name)
    setNewTopicColor(topic.color)
    setNewTopicIcon(topic.icon)
    setNewTopicDescription(topic.description || '')
    setCreateError(null)
  }
  
  // Toggle prompt active/inactive
  const handleToggleSelection = async (promptId: string, currentSelection: boolean) => {
    if (!currentBrand || !promptId) return
    
    setTogglingPrompts(prev => new Set(prev).add(promptId))
    
    // Optimistic update
    setPrompts(prevPrompts => prevPrompts.map(prompt => 
      prompt.id === promptId 
        ? { ...prompt, is_selected: !currentSelection }
        : prompt
    ))
    
    try {
      const response = await fetch('/api/content/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promptId,
          is_selected: !currentSelection
        }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        // Revert on error
        setPrompts(prevPrompts => prevPrompts.map(prompt => 
          prompt.id === promptId 
            ? { ...prompt, is_selected: currentSelection }
            : prompt
        ))
        console.error('Failed to toggle prompt selection')
      }
    } catch (error) {
      // Revert on error
      setPrompts(prevPrompts => prevPrompts.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, is_selected: currentSelection }
          : prompt
      ))
      console.error('Error toggling prompt selection:', error)
    } finally {
      setTogglingPrompts(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
    }
  }
  
  // Bulk set prompts active/inactive
  const handleBulkSetActive = async (setToActive: boolean) => {
    if (!currentBrand) return
    const ids = Array.from(selectedPrompts)
    if (ids.length === 0) return
    
    // Optimistic update
    setPrompts(prevPrompts => prevPrompts.map(prompt => 
      ids.includes(prompt.id) ? { ...prompt, is_selected: setToActive } : prompt
    ))
    
    try {
      await Promise.all(ids.map(id => 
        fetch('/api/content/prompts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_selected: setToActive })
        })
      ))
      setSelectedPrompts(new Set())
    } catch (error) {
      console.error('Bulk action failed:', error)
      // Reload to get correct state
      await fetchPrompts()
    }
  }
  
  // Toggle topic expansion
  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }
  
  // Select/deselect prompt for bulk actions
  const toggleSelectPrompt = (promptId: string) => {
    setSelectedPrompts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(promptId)) {
        newSet.delete(promptId)
      } else {
        newSet.add(promptId)
      }
      return newSet
    })
  }
  
  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }
  
  // Get sort icon for a column
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />
  }
  
  // Filter and sort prompts
  const filteredPrompts = useMemo(() => {
    let result = prompts.filter(prompt => {
      const matchesSearch = !searchQuery || 
        prompt.prompt_text.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTopic = !selectedTopic || prompt.topic_id === selectedTopic
      const matchesCategory = !selectedCategory || prompt.category === selectedCategory
      const matchesFilter = selectedFilter === 'all' || 
        selectedFilter === 'suggested' || // Don't filter prompts in suggested view
        (selectedFilter === 'active' && prompt.is_selected) ||
        (selectedFilter === 'inactive' && !prompt.is_selected)
      
      return matchesSearch && matchesTopic && matchesCategory && matchesFilter
    })
    
    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (sortColumn) {
          case 'prompt':
            aVal = a.prompt_text.toLowerCase()
            bVal = b.prompt_text.toLowerCase()
            break
          case 'lvi':
            aVal = a.lvi_score ?? -1
            bVal = b.lvi_score ?? -1
            break
          case 'gsov':
            aVal = a.gsov_score ?? -1
            bVal = b.gsov_score ?? -1
            break
          case 'mentions':
            aVal = a.mentions_count ?? -1
            bVal = b.mentions_count ?? -1
            break
          case 'sentiment':
            aVal = a.sentiment_score ?? -1
            bVal = b.sentiment_score ?? -1
            break
          case 'position':
            aVal = a.position ?? 999
            bVal = b.position ?? 999
            break
          case 'geography':
            aVal = a.country_name?.toLowerCase() || a.locale?.toLowerCase() || ''
            bVal = b.country_name?.toLowerCase() || b.locale?.toLowerCase() || ''
            break
          case 'date':
            aVal = new Date(a.created_at).getTime()
            bVal = new Date(b.created_at).getTime()
            break
          default:
            return 0
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    
    return result
  }, [prompts, searchQuery, selectedTopic, selectedCategory, selectedFilter, sortColumn, sortDirection])
  
  // Group prompts by topic
  const groupedPrompts = () => {
    const groups: { topic: Topic | null; prompts: Prompt[] }[] = []
    
    // Group prompts with topics
    const topicMap = new Map<string, Prompt[]>()
    const uncategorized: Prompt[] = []
    
    filteredPrompts.forEach(prompt => {
      if (prompt.topic_id) {
        if (!topicMap.has(prompt.topic_id)) {
          topicMap.set(prompt.topic_id, [])
        }
        topicMap.get(prompt.topic_id)!.push(prompt)
      } else {
        uncategorized.push(prompt)
      }
    })
    
    // Add grouped topics
    topics.forEach(topic => {
      const topicPrompts = topicMap.get(topic.id) || []
      if (topicPrompts.length > 0) {
        groups.push({ topic, prompts: topicPrompts })
      }
    })
    
    // Add uncategorized prompts
    if (uncategorized.length > 0) {
      groups.push({ topic: null, prompts: uncategorized })
    }
    
    return groups
  }
  
  // Load data on mount and when brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      // Create a new AbortController for this brand's fetches
      const controller = new AbortController()
      abortControllerRef.current = controller
      
      fetchTopics(controller.signal)
      fetchPrompts(controller.signal)
      fetchSuggestions(controller.signal)
      
      return () => {
        // Cancel in-flight fetches when effect re-runs or unmounts
        controller.abort()
      }
    }
  }, [currentBrand?.id, fetchTopics, fetchPrompts, fetchSuggestions])
  
  // Fetch countries once (independent of brand)
  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])
  
  if (!currentBrand && !brandLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Brand Selected</h2>
        <p className="text-muted-foreground">Please select a brand to manage prompts.</p>
      </div>
    )
  }

  // Show full page skeleton during brand loading OR initial data fetch (back-navigation fix)
  if (brandLoading || (!initialLoadDoneRef.current && isLoadingPrompts)) {
    return (
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-56 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 rounded-md bg-gray-100 animate-pulse" />
            <div className="h-9 w-32 rounded-md bg-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 h-12 rounded-lg bg-gray-100 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-[200px] rounded-md bg-gray-100 animate-pulse" />
            <div className="h-9 w-[150px] rounded-md bg-gray-100 animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y">
              <div className="flex items-center gap-2 py-3 px-2">
                <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-3 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse ml-2" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 px-2" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="h-4 w-4 rounded bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: `${55 + i * 7}%` }} />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
                      {i % 2 === 0 && <div className="h-5 w-12 rounded-full bg-gray-100 animate-pulse" />}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
                  </div>
                  <div className="h-8 w-8 rounded bg-gray-100 animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* Quota Limit Dialog */}
      <QuotaLimitDialog
        open={!!quotaLimit}
        onClose={() => setQuotaLimit(null)}
        resourceType="prompt"
        currentCount={quotaLimit?.current ?? 0}
        maxCount={quotaLimit?.max ?? 0}
        planName={quotaLimit?.plan_name}
        planTier={quotaLimit?.plan_tier}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompts</h1>
          <p className="text-muted-foreground">
            Organize and manage prompts for {currentBrand.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NextQueryCountdown />
          <Button
            variant="outline"
            onClick={() => setShowCreateTopicDialog(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Topic
          </Button>
          <Button onClick={handleCreatePromptClick}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
            {!promptQuotaLoading && promptMax > 0 && (
              <span className={`ml-2 text-xs ${promptCount >= promptMax ? 'text-red-200' : 'opacity-70'}`}>
                {promptCount}/{promptMax}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Status Filter Tabs with Filters */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)} className="flex-1 min-w-0">
          <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
            <TabsTrigger value="all" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
              All Prompts
              {isLoadingPrompts ? (
                <span className="ml-1.5 inline-block h-4 w-5 rounded bg-gray-200 animate-pulse" />
              ) : (
                <Badge variant="secondary" className="ml-1.5 text-[11px] px-1.5 py-0 data-[state=active]:bg-white/20 data-[state=active]:text-white">{prompts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggested" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
              <Lightbulb className="h-4 w-4" />
              Suggested
              {isLoadingSuggestions ? (
                <span className="ml-1.5 inline-block h-4 w-5 rounded bg-yellow-100 animate-pulse" />
              ) : (
                <Badge variant="secondary" className="ml-1.5 text-[11px] px-1.5 py-0 bg-yellow-100 text-yellow-700 data-[state=active]:bg-yellow-400/30 data-[state=active]:text-yellow-200">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
              <Activity className="h-4 w-4" />
              Active
              {isLoadingPrompts ? (
                <span className="ml-1.5 inline-block h-4 w-5 rounded bg-gray-200 animate-pulse" />
              ) : (
                <Badge variant="secondary" className="ml-1.5 text-[11px] px-1.5 py-0 bg-black text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {prompts.filter(p => p.is_selected).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
              Inactive
              {isLoadingPrompts ? (
                <span className="ml-1.5 inline-block h-4 w-5 rounded bg-gray-200 animate-pulse" />
              ) : (
                <Badge variant="secondary" className="ml-1.5 text-[11px] px-1.5 py-0">
                  {prompts.filter(p => !p.is_selected).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          
          <Select value={selectedTopic || 'all'} onValueChange={(v) => setSelectedTopic(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map(topic => (
                <SelectItem key={topic.id} value={topic.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    {topic.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="branded">Branded</SelectItem>
              <SelectItem value="discovery">Discovery</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Suggested Prompts View */}
      {selectedFilter === 'suggested' ? (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Prompts ({suggestions.length})</CardTitle>
            <CardDescription>
              AI-generated prompt suggestions based on your brand. Accept to add them to your prompts library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSuggestions ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: `${65 + i * 8}%`, animationDelay: `${i * 100}ms` }} />
                        <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="h-8 w-16 rounded bg-gray-200 animate-pulse" />
                        <div className="h-8 w-18 rounded bg-gray-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No suggestions yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Generate AI-powered prompt suggestions for your brand
                </p>
                <Button onClick={() => generateSuggestions()} disabled={isGeneratingSuggestions}>
                  {isGeneratingSuggestions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Suggestions
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map(suggestion => (
                  <div 
                    key={suggestion.id}
                    className="group border rounded-lg px-4 py-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{suggestion.prompt_text}</p>
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-muted-foreground">{suggestion.prompt_type || 'general'}</span>
                          {suggestion.intent && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{suggestion.intent}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-4 bg-white border-gray-200 hover:bg-black hover:border-black hover:text-white text-gray-700 disabled:opacity-50"
                          disabled={processingSuggestions.has(suggestion.id)}
                          onClick={() => {
                            setAddingSuggestion(suggestion)
                            setAddSuggestionTopicId(suggestion.topic_id || '')
                            setAddSuggestionLocale('')
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-4 bg-white border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 disabled:opacity-50"
                          disabled={processingSuggestions.has(suggestion.id)}
                          onClick={() => rejectSuggestion(suggestion.id)}
                        >
                          {processingSuggestions.has(suggestion.id) ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
          
          /* Prompts Table */
          isLoadingPrompts ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y">
                  {/* Skeleton topic header */}
                  <div className="flex items-center gap-2 py-3 px-2">
                    <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                    <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse ml-2" />
                  </div>
                  {/* Skeleton prompt rows */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3.5 px-2" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="h-4 w-4 rounded bg-gray-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: `${55 + i * 7}%`, animationDelay: `${i * 80}ms` }} />
                        <div className="flex gap-2">
                          <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
                          {i % 2 === 0 && <div className="h-5 w-12 rounded-full bg-gray-100 animate-pulse" />}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                        <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
                        <div className="h-5 w-14 rounded-full bg-gray-100 animate-pulse" />
                        <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
                      </div>
                      <div className="h-8 w-8 rounded bg-gray-100 animate-pulse flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-lg">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || selectedTopic || selectedCategory ? 'No matching prompts' : 'No prompts yet'}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                {searchQuery || selectedTopic || selectedCategory 
                  ? 'Try adjusting your filters to find what you\'re looking for' 
                  : 'Create your first prompt or generate AI suggestions to get started'}
              </p>
              <div className="flex items-center justify-center gap-3">
                {(searchQuery || selectedTopic || selectedCategory) ? (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('')
                    setSelectedTopic(null)
                    setSelectedCategory(null)
                  }}>
                    Clear Filters
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => generateSuggestions()}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Suggestions
                    </Button>
                    <Button onClick={handleCreatePromptClick}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Prompt
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Prompts ({filteredPrompts.length})</CardTitle>
                <CardDescription>
                  Manage your brand visibility testing prompts across AI platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300"
                          checked={filteredPrompts.length > 0 && filteredPrompts.every(p => selectedPrompts.has(p.id))}
                          onChange={() => {
                            if (filteredPrompts.every(p => selectedPrompts.has(p.id))) {
                              setSelectedPrompts(new Set())
                            } else {
                              setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)))
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('prompt')}
                      >
                        <div className="flex items-center">
                          Prompt
                          {getSortIcon('prompt')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('geography')}
                      >
                        <div className="flex items-center justify-center">
                          Geography
                          {getSortIcon('geography')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center justify-center">
                          Date
                          {getSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[70px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('lvi')}
                      >
                        <div className="flex items-center justify-center">
                          LVI
                          {getSortIcon('lvi')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[70px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('gsov')}
                      >
                        <div className="flex items-center justify-center">
                          gSOV
                          {getSortIcon('gsov')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[80px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('mentions')}
                      >
                        <div className="flex items-center justify-center">
                          Mentions
                          {getSortIcon('mentions')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[90px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('sentiment')}
                      >
                        <div className="flex items-center justify-center">
                          Sentiment
                          {getSortIcon('sentiment')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="w-[70px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('position')}
                      >
                        <div className="flex items-center justify-center">
                          Position
                          {getSortIcon('position')}
                        </div>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPrompts().map(({ topic, prompts: groupPrompts }) => (
                      <React.Fragment key={topic?.id || 'uncategorized'}>
                        {/* Topic Header Row */}
                        <TableRow 
                          className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                          onClick={() => toggleTopicExpansion(topic?.id || 'uncategorized')}
                        >
                          <TableCell colSpan={10}>
                            <div className="flex items-center gap-2">
                              {expandedTopics.has(topic?.id || 'uncategorized') ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {topic ? (
                                <>
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: topic.color }}
                                  />
                                  <span className="font-medium">{topic.name}</span>
                                </>
                              ) : (
                                <>
                                  <Folder className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-muted-foreground">Uncategorized</span>
                                </>
                              )}
                              <Badge variant="secondary" className="ml-2">
                                {groupPrompts.length} prompt{groupPrompts.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Prompt Rows (when expanded) */}
                        {expandedTopics.has(topic?.id || 'uncategorized') && groupPrompts.map(prompt => (
                          <TableRow 
                            key={prompt.id}
                            className={cn(
                              "hover:bg-muted/30 cursor-pointer",
                              navigatingToPrompt === prompt.id && "opacity-50"
                            )}
                            onClick={(e) => {
                              // Don't navigate if clicking on checkbox or menu
                              if ((e.target as HTMLElement).closest('input, button, [role="menuitem"]')) return
                              setNavigatingToPrompt(prompt.id)
                              router.push(`/dashboard/prompts/${prompt.id}`)
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  className="h-4 w-4 rounded border-gray-300"
                                  checked={selectedPrompts.has(prompt.id)}
                                  onChange={() => toggleSelectPrompt(prompt.id)}
                                />
                                {navigatingToPrompt === prompt.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <p className="font-medium text-sm line-clamp-2">{prompt.prompt_text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={
                                    prompt.category === 'branded' ? 'default' : 
                                    prompt.category === 'discovery' ? 'secondary' : 'outline'
                                  } className="text-xs">
                                    {prompt.category === 'branded' ? 'Brand Defense' :
                                     prompt.category === 'discovery' ? 'Discovery' :
                                     prompt.category === 'category_capture' ? 'Category' :
                                     prompt.category === 'solution_discovery' ? 'Solution' :
                                     prompt.category === 'brand_defense' ? 'Brand Defense' :
                                     prompt.category === 'general' ? 'General' :
                                     prompt.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                  </Badge>
                                  {prompt.is_selected && (
                                    <Badge variant="outline" className="text-xs bg-black text-white border-black">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {prompt.locale ? (
                                <span className="text-sm flex items-center justify-center gap-1">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  {prompt.country_name || prompt.locale}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span 
                                className="text-sm text-muted-foreground"
                                title={new Date(prompt.latest_analysis_date || prompt.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              >
                                {getRelativeTime(prompt.latest_analysis_date || prompt.created_at)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {prompt.lvi_score != null ? (
                                  <>{Math.round(prompt.lvi_score)}<span className="text-xs text-muted-foreground font-normal">/100</span></>
                                ) : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {prompt.gsov_score != null ? `${Math.round(prompt.gsov_score)}%` : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {prompt.mentions_count ?? '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {prompt.sentiment_score != null ? (
                                (() => {
                                  const s10 = (prompt.sentiment_score + 1) * 5  // Convert -1..1 to 0-10
                                  return (
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        s10 >= 7 ? "border-green-500 text-green-600" :
                                        s10 >= 4 ? "border-yellow-500 text-yellow-600" :
                                        "border-red-500 text-red-600"
                                      )}
                                    >
                                      {s10.toFixed(1)}/10
                                    </Badge>
                                  )
                                })()
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {prompt.position != null ? `#${Math.round(prompt.position)}` : '—'}
                              </span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/prompts/${prompt.id}`)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditPromptDialog(prompt)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(prompt.prompt_text)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deletePrompt(prompt.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
      )}
      
      {/* Floating Action Bar for Selected Prompts */}
      {selectedPrompts.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-black text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
            <span className="font-medium">
              {selectedPrompts.size} prompt{selectedPrompts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="h-6 w-px bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:text-black h-8"
              disabled={selectedPrompts.size !== 1}
              onClick={() => {
                const id = Array.from(selectedPrompts)[0]
                if (!id) return
                router.push(`/dashboard/prompts/${id}`)
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:text-black h-8"
              disabled={selectedPrompts.size !== 1}
              onClick={() => {
                const id = Array.from(selectedPrompts)[0]
                if (!id) return
                const promptToEdit = prompts.find(p => p.id === id)
                if (!promptToEdit) {
                  console.error('Selected prompt not found for edit:', id)
                  return
                }
                openEditPromptDialog(promptToEdit)
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <div className="h-6 w-px bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:text-black h-8"
              onClick={() => handleBulkSetActive(true)}
            >
              Set Active
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:text-black h-8"
              onClick={() => handleBulkSetActive(false)}
            >
              Set Inactive
            </Button>
            <div className="h-6 w-px bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:text-black h-8"
              onClick={() => setSelectedPrompts(new Set())}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Create Topic Dialog */}
      <Dialog open={showCreateTopicDialog || !!editingTopic} onOpenChange={(open) => {
        if (!open) {
          setShowCreateTopicDialog(false)
          setEditingTopic(null)
          setNewTopicName('')
          setNewTopicDescription('')
          setCreateError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create Topic'}</DialogTitle>
            <DialogDescription>
              {editingTopic 
                ? 'Update the topic details' 
                : 'Create a new topic to organize your prompts'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {createError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Topic Name</Label>
              <Input
                placeholder="e.g., Product Features, Pricing Questions"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                disabled={isCreatingTopic || isUpdatingTopic}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {TOPIC_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewTopicColor(color.value)}
                    disabled={isCreatingTopic || isUpdatingTopic}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all disabled:opacity-50",
                      newTopicColor === color.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of this topic..."
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                rows={2}
                disabled={isCreatingTopic || isUpdatingTopic}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateTopicDialog(false)
                setEditingTopic(null)
                setCreateError(null)
              }}
              disabled={isCreatingTopic || isUpdatingTopic}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingTopic ? updateTopic : createTopic}
              disabled={isCreatingTopic || isUpdatingTopic || !newTopicName.trim()}
            >
              {(isCreatingTopic || isUpdatingTopic) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTopic ? 'Save Changes' : 'Create Topic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create/Edit Prompt Dialog */}
      <Dialog open={showCreatePromptDialog || showEditPromptDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreatePromptDialog(false)
          setShowEditPromptDialog(false)
          setEditingPrompt(null)
          resetPromptForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Edit Prompt' : 'Create Prompt'}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt 
                ? 'Update the prompt details' 
                : 'Create a new prompt manually'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {createError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Prompt Text</Label>
              <Textarea
                placeholder="What would users search for about your brand?"
                value={newPromptText}
                onChange={(e) => {
                  if (e.target.value.length <= 190) {
                    setNewPromptText(e.target.value)
                  }
                }}
                rows={3}
                maxLength={190}
                disabled={isCreatingPrompt || isUpdatingPrompt}
              />
              <p className={cn(
                "text-xs text-right",
                newPromptText.length > 170 ? "text-orange-500" : "text-muted-foreground",
                newPromptText.length >= 190 && "text-destructive"
              )}>
                {newPromptText.length}/190 characters
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newPromptCategory} 
                  onValueChange={(v: any) => setNewPromptCategory(v)}
                  disabled={isCreatingPrompt || isUpdatingPrompt}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branded">Branded</SelectItem>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Topic (Optional)</Label>
                <Select 
                  value={newPromptTopicId || 'none'} 
                  onValueChange={(v) => setNewPromptTopicId(v === 'none' ? '' : v)}
                  disabled={isCreatingPrompt || isUpdatingPrompt}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Topic</SelectItem>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          {topic.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Geography (Optional)</Label>
              <Select 
                value={newPromptLocale || 'none'} 
                onValueChange={(v) => setNewPromptLocale(v === 'none' ? '' : v)}
                disabled={isCreatingPrompt || isUpdatingPrompt || isLoadingCountries}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select geography"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Global (No specific geography)
                    </div>
                  </SelectItem>
                  
                  {/* Regions grouped by continent */}
                  {regions.map(({ region, sub_regions }) => (
                    <React.Fragment key={region}>
                      {/* Region header */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {region}
                      </div>
                      
                      {/* Sub-regions under this region */}
                      {sub_regions.length > 0 && sub_regions.map(subRegion => (
                        <SelectItem 
                          key={`subregion-${region}-${subRegion}`} 
                          value={`subregion:${subRegion}`}
                          className="pl-4"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">↳</span>
                            {subRegion}
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Countries in this region */}
                      {countries
                        .filter(c => c.region === region)
                        .map(country => (
                          <SelectItem 
                            key={country.value} 
                            value={country.value}
                            className="pl-6"
                          >
                            {country.label}
                          </SelectItem>
                        ))
                      }
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a country, sub-region (e.g., West Africa), or leave global
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreatePromptDialog(false)
                setShowEditPromptDialog(false)
                setEditingPrompt(null)
                resetPromptForm()
              }}
              disabled={isCreatingPrompt || isUpdatingPrompt}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingPrompt ? updatePrompt : createPrompt}
              disabled={isCreatingPrompt || isUpdatingPrompt || !newPromptText.trim()}
            >
              {(isCreatingPrompt || isUpdatingPrompt) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingPrompt ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Suggestion Dialog */}
      <Dialog open={!!addingSuggestion} onOpenChange={(open) => {
        if (!open) {
          setAddingSuggestion(null)
          setAddSuggestionTopicId('')
          setAddSuggestionLocale('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Prompts</DialogTitle>
            <DialogDescription>
              Choose a topic and geography for this prompt
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{addingSuggestion?.prompt_text}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic (Optional)</Label>
                <Select 
                  value={addSuggestionTopicId || 'none'} 
                  onValueChange={(v) => setAddSuggestionTopicId(v === 'none' ? '' : v)}
                  disabled={isAddingSuggestion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Topic</SelectItem>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          {topic.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Geography (Optional)</Label>
                <Select 
                  value={addSuggestionLocale || 'none'} 
                  onValueChange={(v) => setAddSuggestionLocale(v === 'none' ? '' : v)}
                  disabled={isAddingSuggestion || isLoadingCountries}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Global
                      </div>
                    </SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddingSuggestion(null)
                setAddSuggestionTopicId('')
                setAddSuggestionLocale('')
              }}
              disabled={isAddingSuggestion}
            >
              Cancel
            </Button>
            <Button 
              onClick={acceptSuggestion}
              disabled={isAddingSuggestion}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isAddingSuggestion && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
