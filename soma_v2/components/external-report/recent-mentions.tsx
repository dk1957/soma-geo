"use client"

/**
 * Recent Chats Component (External Report Version)
 * 
 * Displays latest AI chat responses grouped by prompt, with stacked model icons,
 * aggregated Position and gSOV across multiple model responses.
 * Matches the dashboard design pattern.
 */

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
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
  promptText: string
  responseSnippet: string | null
  brandPosition: number
  gsov?: number | null
  mentionedBrands: MentionedBrand[]
  modelName: string
  modelProvider: string
  sourcesCited: ChatSource[]
  date: string
}

// Grouped chat data structure
interface GroupedChat {
  promptText: string
  responses: ChatData[]
  avgPosition: number | null
  avgGsov: number | null
  models: { name: string; provider: string }[]
  allBrands: MentionedBrand[]
  allSources: ChatSource[]
  latestDate: string
}

interface RecentMentionsProps {
  mentions: ChatData[]
}

export function RecentMentions({ mentions }: RecentMentionsProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())

  // Group mentions by prompt text
  const groupedMentions = useMemo(() => {
    const groups = new Map<string, GroupedChat>()
    
    mentions.forEach(mention => {
      const key = mention.promptText.trim().toLowerCase()
      
      if (!groups.has(key)) {
        groups.set(key, {
          promptText: mention.promptText,
          responses: [],
          avgPosition: null,
          avgGsov: null,
          models: [],
          allBrands: [],
          allSources: [],
          latestDate: mention.date
        })
      }
      
      const group = groups.get(key)!
      group.responses.push(mention)
      
      // Track unique models
      const modelKey = `${mention.modelProvider}-${mention.modelName}`
      if (!group.models.some(m => `${m.provider}-${m.name}` === modelKey)) {
        group.models.push({ name: mention.modelName, provider: mention.modelProvider })
      }
      
      // Merge brands (dedupe by name)
      mention.mentionedBrands?.forEach(brand => {
        if (!group.allBrands.some(b => b.name === brand.name)) {
          group.allBrands.push(brand)
        }
      })
      
      // Merge sources (dedupe by domain)
      mention.sourcesCited?.forEach(source => {
        if (!group.allSources.some(s => s.domain === source.domain)) {
          group.allSources.push(source)
        }
      })
      
      // Track latest date
      if (new Date(mention.date) > new Date(group.latestDate)) {
        group.latestDate = mention.date
      }
    })
    
    // Calculate aggregates for each group
    groups.forEach(group => {
      const positions = group.responses.filter(r => r.brandPosition !== null && r.brandPosition > 0).map(r => r.brandPosition)
      const gsovs = group.responses.filter(r => r.gsov !== null && r.gsov !== undefined && r.gsov > 0).map(r => r.gsov!)
      
      group.avgPosition = positions.length > 0 
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length * 10) / 10
        : null
      group.avgGsov = gsovs.length > 0 
        ? Math.round(gsovs.reduce((a, b) => a + b, 0) / gsovs.length * 10) / 10
        : null
    })
    
    // Sort by latest date and return array, limit to 6 groups
    return Array.from(groups.values())
      .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
      .slice(0, 6)
  }, [mentions])

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

  const getModelImage = (provider: string | null | undefined, model: string | null | undefined): string => {
    const p = provider?.toLowerCase() || ''
    const m = model?.toLowerCase() || ''
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
          {groupedMentions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No recent chats available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 border-b border-gray-200">
                    <TableHead className="w-[100px] text-left font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="min-w-[300px] font-semibold text-gray-900">Prompt</TableHead>
                    <TableHead className="w-[70px] text-center font-semibold text-gray-900">Avg Pos</TableHead>
                    <TableHead className="w-[70px] text-center font-semibold text-gray-900">Avg Share of Voice</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold text-gray-900">Models</TableHead>
                    <TableHead className="w-[120px] text-center font-semibold text-gray-900">Mentions</TableHead>
                    <TableHead className="w-[120px] text-center font-semibold text-gray-900">Sources</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedMentions.map((group, idx) => {
                    const isExpanded = expandedPrompts.has(group.promptText)
                    const hasMultipleResponses = group.responses.length > 1
                    
                    return (
                      <TableRow 
                        key={idx} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${hasMultipleResponses ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (hasMultipleResponses) {
                            const newExpanded = new Set(expandedPrompts)
                            if (isExpanded) {
                              newExpanded.delete(group.promptText)
                            } else {
                              newExpanded.add(group.promptText)
                            }
                            setExpandedPrompts(newExpanded)
                          }
                        }}
                      >
                        {/* Date */}
                        <TableCell className="py-3 px-4 text-sm text-gray-600">
                          {formatRelativeDate(group.latestDate)}
                        </TableCell>

                        {/* Prompt with response count badge */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 flex-1">
                                {truncateText(cleanMarkdown(group.promptText), 100)}
                              </p>
                              {hasMultipleResponses && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 shrink-0">
                                  {group.responses.length} responses
                                  {isExpanded ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />}
                                </Badge>
                              )}
                            </div>
                            {/* Show first response snippet when collapsed */}
                            {!isExpanded && group.responses[0]?.responseSnippet && (
                              <p className="text-xs text-gray-500 truncate max-w-[400px]">
                                {truncateText(cleanMarkdown(group.responses[0].responseSnippet), 80)}
                              </p>
                            )}
                            {/* Show all response snippets when expanded */}
                            {isExpanded && group.responses.map((response, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100 first:mt-1 first:pt-0 first:border-0">
                                <div className="relative h-5 w-5 shrink-0 mt-0.5">
                                  <Image
                                    src={getModelImage(response.modelProvider, response.modelName)}
                                    alt={response.modelName}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">
                                    {truncateText(cleanMarkdown(response.responseSnippet || ''), 120)}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                    {response.brandPosition > 0 && <span>Pos: {response.brandPosition}</span>}
                                    {response.gsov !== null && response.gsov !== undefined && response.gsov > 0 && <span>Share of Voice: {response.gsov}%</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        {/* Average Position */}
                        <TableCell className="py-3 px-4">
                          {group.avgPosition !== null ? (
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-700 mx-auto">
                              <span className="text-sm font-bold">{group.avgPosition}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm block text-center">—</span>
                          )}
                        </TableCell>

                        {/* Average gSoV */}
                        <TableCell className="py-3 px-4 text-center">
                          {group.avgGsov !== null ? (
                            <span className="text-sm font-medium text-gray-900">{group.avgGsov}%</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
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
                                      alt={model.name}
                                      fill
                                      className="object-contain rounded-full"
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{model.name}</p>
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
                            {group.allBrands && group.allBrands.length > 0 ? (
                              <>
                                {group.allBrands.slice(0, 3).map((brand, brandIdx) => (
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
                                {group.allBrands.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-7 w-7 border-2 border-white bg-gray-200 text-gray-700 cursor-pointer">
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-semibold">
                                          +{group.allBrands.length - 3}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{group.allBrands.length - 3} more</p>
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
                            {group.allSources && group.allSources.length > 0 ? (
                              <>
                                {group.allSources.slice(0, 3).map((source, sourceIdx) => {
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
                                {group.allSources.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-6 w-6 border-2 border-white bg-gray-200 text-gray-700 cursor-pointer">
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px] font-semibold">
                                          +{group.allSources.length - 3}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{group.allSources.length - 3} more</p>
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

          {/* Card Footer - Note section for external reports */}
          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span>Showing recent AI responses grouped by prompt</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
