"use client"

/**
 * Recent Chats Component (Dashboard Version)
 * 
 * Displays latest AI chat responses grouped by prompt, with stacked model icons,
 * aggregated Position and gSOV across multiple model responses.
 * Fetches data from /api/reports/[id]/data endpoint
 */

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Loader2, ExternalLink, ChevronDown, ChevronUp, Check, X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { FilterOptions } from "./analytics-filters"
import type { ReportData } from "@/lib/hooks/useReportData"

interface ChatSource {
  url: string
  domain: string
  title?: string
}

interface MentionedBrand {
  name: string
  isPrimary: boolean
  logo?: string | null
}

interface ChatData {
  prompt_id: string | null
  prompt_text: string
  response_snippet: string | null
  brand_position: number | null
  gsov: number | null
  sentiment: number | null
  mentioned: boolean
  mentioned_brands: MentionedBrand[]
  model_name: string
  model_provider: string | null
  sources_cited: ChatSource[]
  analysis_date: string
}

// Grouped chat data structure
interface GroupedChat {
  prompt_id: string | null
  prompt_text: string
  responses: ChatData[]
  avg_position: number | null
  avg_gsov: number | null
  avg_sentiment: number | null
  mentioned: boolean
  models: { name: string; provider: string | null }[]
  all_brands: MentionedBrand[]
  all_sources: ChatSource[]
  latest_date: string
}

interface RecentBrandMentionsProps {
  brandId: string
  reportData?: ReportData | null
  filters?: FilterOptions
  isAnalyzing?: boolean
}

export function RecentBrandMentions({ brandId, reportData, filters, isAnalyzing = false }: RecentBrandMentionsProps) {
  const [mentions, setMentions] = useState<ChatData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())
  const [lastFetchedBrandId, setLastFetchedBrandId] = useState<string | null>(null)
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setMentions([])
    setLoading(true)
    setExpandedPrompts(new Set())
    setLastFetchedBrandId(null)
  }, [brandId])

  // Filter mentions based on selected model
  const filteredMentions = useMemo(() => {
    if (!filters?.aiPlatforms || filters.aiPlatforms.length === 0) {
      return mentions
    }
    return mentions.filter(mention => {
      const modelLower = mention.model_name?.toLowerCase() || ''
      const providerLower = mention.model_provider?.toLowerCase() || ''
      return filters.aiPlatforms.some(platform => 
        modelLower.includes(platform.toLowerCase()) ||
        providerLower.includes(platform.toLowerCase())
      )
    })
  }, [mentions, filters?.aiPlatforms])

  // Group mentions by prompt text
  const groupedMentions = useMemo(() => {
    const groups = new Map<string, GroupedChat>()
    
    filteredMentions.forEach(mention => {
      const key = mention.prompt_text.trim().toLowerCase()
      
      if (!groups.has(key)) {
        groups.set(key, {
          prompt_id: mention.prompt_id,
          prompt_text: mention.prompt_text,
          responses: [],
          avg_position: null,
          avg_gsov: null,
          avg_sentiment: null,
          mentioned: false,
          models: [],
          all_brands: [],
          all_sources: [],
          latest_date: mention.analysis_date
        })
      }
      
      const group = groups.get(key)!
      group.responses.push(mention)
      
      // Track mention status (true if ANY response mentions the brand)
      if (mention.mentioned) group.mentioned = true
      // Use first available prompt_id
      if (!group.prompt_id && mention.prompt_id) group.prompt_id = mention.prompt_id
      
      // Track unique models
      const modelKey = `${mention.model_provider}-${mention.model_name}`
      if (!group.models.some(m => `${m.provider}-${m.name}` === modelKey)) {
        group.models.push({ name: mention.model_name, provider: mention.model_provider })
      }
      
      // Merge brands (dedupe by name)
      mention.mentioned_brands?.forEach(brand => {
        if (!group.all_brands.some(b => b.name === brand.name)) {
          group.all_brands.push(brand)
        }
      })
      
      // Merge sources (dedupe by domain)
      mention.sources_cited?.forEach(source => {
        if (!group.all_sources.some(s => s.domain === source.domain)) {
          group.all_sources.push(source)
        }
      })
      
      // Track latest date
      if (new Date(mention.analysis_date) > new Date(group.latest_date)) {
        group.latest_date = mention.analysis_date
      }
    })
    
    // Calculate aggregates for each group
    groups.forEach(group => {
      const positions = group.responses
        .filter(r => r.brand_position !== null && r.brand_position !== undefined && !isNaN(Number(r.brand_position)))
        .map(r => r.brand_position!)
      const gsovs = group.responses.filter(r => r.gsov !== null && r.gsov !== undefined && !isNaN(Number(r.gsov)) && r.gsov > 0).map(r => r.gsov!)
      
      group.avg_position = positions.length > 0 
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length * 10) / 10
        : null
      group.avg_gsov = gsovs.length > 0 
        ? Math.round(gsovs.reduce((a, b) => a + b, 0) / gsovs.length * 10) / 10
        : null
      const sentiments = group.responses.filter(r => r.sentiment !== null && r.sentiment !== undefined && !isNaN(Number(r.sentiment))).map(r => r.sentiment!)
      group.avg_sentiment = sentiments.length > 0
        ? Math.round(sentiments.reduce((a, b) => a + b, 0) / sentiments.length * 100) / 100
        : null
    })
    
    // Sort by latest date and return array, limit to 6 groups
    return Array.from(groups.values())
      .sort((a, b) => new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime())
      .slice(0, 6)
  }, [filteredMentions])

  useEffect(() => {
    // If reportData is provided, use it directly
    if (reportData) {
      // Sanitize sources_cited to ensure only simple {url, domain, title} objects
      const sanitized = (reportData.recentMentions || []).slice(0, 20).map((m: any) => ({
        ...m,
        sources_cited: Array.isArray(m.sources_cited) 
          ? m.sources_cited.map((s: any) => ({
              url: typeof s === 'string' ? s : (s?.url || ''),
              domain: typeof s === 'string' ? s : (s?.domain || ''),
              title: typeof s === 'string' ? '' : (s?.title || s?.source_name || ''),
            }))
          : [],
      }))
      setMentions(sanitized)
      setLoading(false)
      setLastFetchedBrandId(brandId)
      return
    }

    // Skip if we already fetched for this brand
    if (lastFetchedBrandId === brandId) return
    
    const abortController = new AbortController()

    // Otherwise fetch data
    const fetchMentions = async () => {
      try {
        const response = await fetch(`/api/reports/${brandId}/data?period=30d`, {
          credentials: 'include',
          signal: abortController.signal
        })
        
        // Check if request was aborted before setting state
        if (abortController.signal.aborted) return
        
        if (response.ok) {
          const data = await response.json()
          // Sanitize sources_cited in fallback fetch path too
          const sanitized = (data.recentMentions || []).slice(0, 20).map((m: any) => ({
            ...m,
            sources_cited: Array.isArray(m.sources_cited)
              ? m.sources_cited.map((s: any) => ({
                  url: typeof s === 'string' ? s : (s?.url || ''),
                  domain: typeof s === 'string' ? s : (s?.domain || ''),
                  title: typeof s === 'string' ? '' : (s?.title || s?.source_name || ''),
                }))
              : [],
          }))
          setMentions(sanitized)
          setLastFetchedBrandId(brandId)
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch recent mentions:', error)
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchMentions()
    
    // Cleanup: abort any in-flight requests when brand changes or component unmounts
    return () => abortController.abort()
  }, [brandId, reportData, lastFetchedBrandId])

  const formatRelativeDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInSeconds = Math.floor(diffInMs / 1000)
      const diffInMinutes = Math.floor(diffInSeconds / 60)
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)
      const diffInWeeks = Math.floor(diffInDays / 7)
      const diffInMonths = Math.floor(diffInDays / 30)

      if (diffInSeconds < 60) {
        return 'Just now'
      } else if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`
      } else if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
      } else if (diffInDays === 1) {
        return 'Yesterday'
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`
      } else if (diffInWeeks === 1) {
        return '1 week ago'
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} weeks ago`
      } else if (diffInMonths === 1) {
        return '1 month ago'
      } else if (diffInMonths < 12) {
        return `${diffInMonths} months ago`
      } else {
        // Fallback to absolute date for very old dates
        return new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }).format(date)
      }
    } catch {
      return dateString
    }
  }

  const truncateText = (text: string, maxLength: number = 120): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const cleanMarkdown = (text: string): string => {
    if (!text) return ''
    // Remove markdown headers (##, ###, etc.)
    text = text.replace(/^#+\s*/gm, '')
    // Remove bold (**text** or __text__)
    text = text.replace(/\*\*(.+?)\*\*/g, '$1')
    text = text.replace(/__(.+?)__/g, '$1')
    // Remove italic (*text* or _text_)
    text = text.replace(/\*(.+?)\*/g, '$1')
    text = text.replace(/_(.+?)_/g, '$1')
    // Remove backticks
    text = text.replace(/`(.+?)`/g, '$1')
    // Remove leading/trailing whitespace
    return text.trim()
  }

  const getModelBrandName = (provider: string | null | undefined, model: string | null | undefined): string => {
    const combined = `${provider || ''} ${model || ''}`.toLowerCase()
    if (combined.includes('openai') || combined.includes('gpt')) return 'ChatGPT'
    if (combined.includes('anthropic') || combined.includes('claude')) return 'Claude'
    if (combined.includes('google') || combined.includes('gemini')) return 'Gemini'
    if (combined.includes('grok') || combined.includes('xai') || combined.includes('x-ai')) return 'Grok'
    if (combined.includes('perplexity') || combined.includes('sonar')) return 'Perplexity'
    if (combined.includes('llama') || combined.includes('meta')) return 'Meta AI'
    if (combined.includes('mistral')) return 'Mistral'
    if (combined.includes('copilot')) return 'Copilot'
    return model || provider || 'AI'
  }

  const getModelImage = (provider: string | null | undefined, model: string | null | undefined): string => {
    const p = provider?.toLowerCase() || ''
    const m = model?.toLowerCase() || ''
    // Handle combined format like "perplexity/sonar-pro-search"
    const combined = `${p} ${m}`.toLowerCase()
    
    if (combined.includes('openai') || combined.includes('gpt')) {
      return '/models/chatgpt-logo.png'
    }
    if (combined.includes('anthropic') || combined.includes('claude')) {
      return '/models/claude-logo.png'
    }
    if (combined.includes('google') || combined.includes('gemini')) {
      return '/models/gemini-logo.png'
    }
    if (combined.includes('grok') || combined.includes('xai')) {
      return '/models/grok-logo.png'
    }
    if (combined.includes('perplexity') || combined.includes('sonar')) {
      return '/models/perplexity-logo.png'
    }
    if (combined.includes('llama') || combined.includes('meta')) {
      return '/models/meta-logo.svg'
    }
    return '/models/chatgpt-logo.png'
  }

  const getBrandInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getBrandColor = (name: string, isPrimary: boolean): string => {
    if (isPrimary) return 'bg-[#FF760D]'
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500']
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getSourceIcon = (domain: string): { initials: string; color: string } => {
    const domainParts = domain.split('.')
    const mainDomain = domainParts[domainParts.length - 2] || domain
    const initials = mainDomain.substring(0, 2).toUpperCase()
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500']
    const colorIndex = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return { initials, color: colors[colorIndex] }
  }

  return (
    <TooltipProvider>
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <MessageSquare className="h-5 w-5 text-white" />
            Recent Chats
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Latest AI responses mentioning your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(loading || (isAnalyzing && groupedMentions.length === 0)) ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="py-3 px-4 w-[100px]"><div className="h-3 w-10 rounded bg-gray-200 animate-pulse" /></th>
                    <th className="py-3 px-4 min-w-[300px]"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse" /></th>
                    <th className="py-3 px-4 w-[70px]"><div className="h-3 w-12 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[70px]"><div className="h-3 w-12 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[80px]"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[80px]"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[100px]"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[120px]"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                    <th className="py-3 px-4 w-[120px]"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-4 px-4"><div className="h-3 w-16 rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-full max-w-[280px] rounded bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                          <div className="h-2.5 w-3/4 max-w-[200px] rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                        </div>
                      </td>
                      <td className="py-4 px-4"><div className="h-4 w-8 rounded bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4"><div className="h-4 w-10 rounded bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4"><div className="h-5 w-12 rounded-full bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                          <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 30}ms` }} />
                        </div>
                      </td>
                      <td className="py-4 px-4"><div className="h-4 w-6 rounded bg-gray-100 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                      <td className="py-4 px-4"><div className="h-4 w-6 rounded bg-gray-100 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : groupedMentions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No recent chats available</p>
              {filters?.aiPlatforms && filters.aiPlatforms.length > 0 && mentions.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Try adjusting the model filter</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 border-b border-gray-200">
                    <TableHead className="w-[100px] text-left font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="min-w-[300px] font-semibold text-gray-900">Prompt</TableHead>
                    <TableHead className="w-[70px] text-center font-semibold text-gray-900">Avg Pos</TableHead>
                    <TableHead className="w-[70px] text-center font-semibold text-gray-900">Avg gSoV</TableHead>
                    <TableHead className="w-[80px] text-center font-semibold text-gray-900">Sentiment</TableHead>
                    <TableHead className="w-[80px] text-center font-semibold text-gray-900">Mentioned</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold text-gray-900">Models</TableHead>
                    <TableHead className="w-[120px] text-center font-semibold text-gray-900">Mentions</TableHead>
                    <TableHead className="w-[120px] text-center font-semibold text-gray-900">Sources</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedMentions.map((group, idx) => {
                    const isExpanded = expandedPrompts.has(group.prompt_text)
                    const hasMultipleResponses = group.responses.length > 1
                    
                    return (
                      <TableRow 
                        key={idx} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${hasMultipleResponses ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (hasMultipleResponses) {
                            const newExpanded = new Set(expandedPrompts)
                            if (isExpanded) {
                              newExpanded.delete(group.prompt_text)
                            } else {
                              newExpanded.add(group.prompt_text)
                            }
                            setExpandedPrompts(newExpanded)
                          }
                        }}
                      >
                        {/* Date */}
                        <TableCell className="py-3 px-4 text-sm text-gray-600">
                          {formatRelativeDate(group.latest_date)}
                        </TableCell>

                        {/* Prompt with response count badge */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {group.prompt_id ? (
                                <Link 
                                  href={`/dashboard/prompts/${group.prompt_id}`}
                                  className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline flex-1 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {truncateText(cleanMarkdown(group.prompt_text), 100)}
                                </Link>
                              ) : (
                                <p className="text-sm font-medium text-gray-900 flex-1">
                                  {truncateText(cleanMarkdown(group.prompt_text), 100)}
                                </p>
                              )}
                              {hasMultipleResponses && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 shrink-0">
                                  {group.responses.length} responses
                                  {isExpanded ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />}
                                </Badge>
                              )}
                            </div>
                            {/* Show first response snippet when collapsed */}
                            {!isExpanded && group.responses[0]?.response_snippet && (
                              <p className="text-xs text-gray-500 truncate max-w-[400px]">
                                {truncateText(cleanMarkdown(group.responses[0].response_snippet), 80)}
                              </p>
                            )}
                            {/* Show all response snippets when expanded */}
                            {isExpanded && group.responses.map((response, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100 first:mt-1 first:pt-0 first:border-0">
                                <div className="relative h-5 w-5 shrink-0 mt-0.5">
                                  <Image
                                    src={getModelImage(response.model_provider, response.model_name)}
                                    alt={getModelBrandName(response.model_provider, response.model_name)}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">
                                    {truncateText(cleanMarkdown(response.response_snippet || ''), 120)}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                    {response.brand_position && <span>Pos: #{response.brand_position}</span>}
                                    {response.gsov !== null && response.gsov > 0 && <span>gSoV: {response.gsov}%</span>}
                                    {response.sentiment !== null && response.sentiment !== undefined && (
                                      (() => {
                                        const s10 = (response.sentiment + 1) * 5
                                        return (
                                          <span className={s10 >= 7 ? 'text-emerald-600' : s10 < 4 ? 'text-red-500' : ''}>
                                            {s10.toFixed(1)}/10
                                          </span>
                                        )
                                      })()
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        {/* Average Position */}
                        <TableCell className="py-3 px-4">
                          {group.avg_position !== null ? (
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-700 mx-auto">
                              <span className="text-sm font-bold">#{group.avg_position}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm block text-center">—</span>
                          )}
                        </TableCell>

                        {/* Average gSoV */}
                        <TableCell className="py-3 px-4 text-center">
                          {group.avg_gsov !== null ? (
                            <span className="text-sm font-medium text-gray-900">{group.avg_gsov}%</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Sentiment */}
                        <TableCell className="py-3 px-4 text-center">
                          {group.avg_sentiment !== null ? (
                            (() => {
                              const s10 = (group.avg_sentiment + 1) * 5
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  s10 >= 7 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                  s10 < 4 ? 'text-red-700 bg-red-50 border-red-200' :
                                  'text-gray-700 bg-gray-50 border-gray-200'
                                }`}>
                                  {s10.toFixed(1)}/10
                                </span>
                              )
                            })()
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Mentioned */}
                        <TableCell className="py-3 px-4 text-center">
                          {group.mentioned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                              <X className="h-3 w-3" />
                              No
                            </span>
                          )}
                        </TableCell>

                        {/* Stacked Model Icons */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center -space-x-2">
                            {group.models.slice(0, 4).map((model, modelIdx) => (
                              <Tooltip key={modelIdx}>
                                <TooltipTrigger asChild>
                                  <div className="relative h-7 w-7 cursor-pointer rounded-full bg-white border-2 border-white shadow-sm hover:z-10 transition-transform hover:scale-110">
                                    <Image
                                      src={getModelImage(model.provider, model.name)}
                                      alt={getModelBrandName(model.provider, model.name)}
                                      fill
                                      className="object-contain rounded-full"
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{getModelBrandName(model.provider, model.name)}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {group.models.length > 4 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-200 border-2 border-white text-gray-600 text-[10px] font-semibold cursor-pointer">
                                    +{group.models.length - 4}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{group.models.length - 4} more models</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {/* All Mentioned Brands */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center -space-x-1.5">
                            {group.all_brands && group.all_brands.length > 0 ? (
                              <>
                                {group.all_brands.slice(0, 3).map((brand, brandIdx) => (
                                  <Tooltip key={brandIdx}>
                                    <TooltipTrigger asChild>
                                      <Avatar 
                                        className={`h-7 w-7 border-2 border-white ${getBrandColor(brand.name, brand.isPrimary)} text-white cursor-pointer hover:z-10`}
                                      >
                                        {brand.logo ? (
                                          <Image
                                            src={brand.logo}
                                            alt={brand.name}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <AvatarFallback className={`${getBrandColor(brand.name, brand.isPrimary)} text-white text-xs font-semibold`}>
                                            {getBrandInitials(brand.name)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{brand.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {group.all_brands.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-7 w-7 border-2 border-white bg-gray-200 text-gray-700 cursor-pointer">
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-semibold">
                                          +{group.all_brands.length - 3}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{group.all_brands.length - 3} more</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* All Sources */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center -space-x-1.5">
                            {group.all_sources && group.all_sources.length > 0 ? (
                              <>
                                {group.all_sources.slice(0, 3).map((source, sourceIdx) => {
                                  return (
                                    <Tooltip key={sourceIdx}>
                                      <TooltipTrigger asChild>
                                        <div className="h-6 w-6 rounded-full border-2 border-white bg-white cursor-pointer hover:z-10 flex items-center justify-center overflow-hidden">
                                          <img
                                            src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                                            alt={source.domain}
                                            className="h-4 w-4 object-contain"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement
                                              target.style.display = 'none'
                                              target.parentElement!.innerHTML = `<span class="text-[10px] font-semibold text-gray-600">${(source.domain.split('.')[0] || '').substring(0, 2).toUpperCase()}</span>`
                                            }}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">{source.domain}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                })}
                                {group.all_sources.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-6 w-6 border-2 border-white bg-gray-200 text-gray-700 cursor-pointer">
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px] font-semibold">
                                          +{group.all_sources.length - 3}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{group.all_sources.length - 3} more</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Card Footer Link */}
          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-lg">
            <Link 
              href="/dashboard/prompts" 
              className="group flex items-center justify-between text-sm font-medium text-gray-700 hover:text-black transition-all duration-200 hover:bg-gray-100 -mx-2 px-2 py-2 rounded-md"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors" />
                <span>View all chats and responses</span>
              </div>
              <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
