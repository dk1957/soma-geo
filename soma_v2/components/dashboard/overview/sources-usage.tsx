"use client"

/**
 * Sources Usage Component
 * 
 * Displays content sources that AI platforms reference when mentioning the brand.
 * Shows citation frequency, domain distribution, and content performance metrics.
 * 
 * API Integration:
 * - Endpoint: GET /api/sources-citations?brandId={brandId}&limit={limit}
 * - Response: { sources: SourceData[], metadata: { ... } }
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ExternalLink, Loader2, ChevronDown, ChevronRight, Globe, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SourceData {
  domain: string
  type: string
  totalCitations: number
  usageFrequency: number
  avgCitations: number
  citationUrls?: Array<{ url: string; title?: string; type?: string }>
  brandsCiting: string[]
}

interface SourcesUsageProps {
  brandId: string
  reportData?: any  // Data from useReportData hook - single source of truth
  isAnalyzing?: boolean
}

export function SourcesUsage({ brandId, reportData, isAnalyzing = false }: SourcesUsageProps) {
  const [sources, setSources] = useState<SourceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setSources([])
    setExpandedRows(new Set())
    setError(null)
    setIsLoading(true)
  }, [brandId])

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const getUniqueUrls = (urls: Array<{ url: string; title?: string; type?: string }>) => {
    const seen = new Set<string>()
    return urls.filter(item => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
  }

  const getTypeLabel = (type: string) => {
    const normalized = (type || 'other').toLowerCase().replace(/_/g, '-').trim()
    const labels: Record<string, string> = {
      'own': 'Own',
      'owned': 'Own',
      'competitor': 'Competitor',
      'news': 'News',
      'editorial': 'Editorial',
      'blog': 'Blog',
      'ugc': 'UGC',
      'social': 'Social',
      'reference': 'Reference',
      'academic': 'Academic',
      'government': 'Government',
      'institutional': 'Institutional',
      'corporate': 'Corporate',
      'other': 'Other',
      // Legacy fallbacks
      'earned': 'Other',
      'research': 'Reference',
      'directory': 'Reference',
      'unknown': 'Other',
      'fintech': 'Corporate',
      'telecom': 'Corporate',
      'industry': 'Corporate',
      'e-commerce': 'Corporate',
      'official': 'Institutional',
      'user-generated': 'UGC',
      'comparison': 'UGC',
    }
    return labels[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, ' ')
  }

  const getTypeBadgeColor = (type: string) => {
    const normalized = (type || 'other').toLowerCase().replace(/_/g, '-').trim()
    const colors: Record<string, string> = {
      'own': 'bg-orange-50 text-orange-700 border-orange-200',
      'owned': 'bg-orange-50 text-orange-700 border-orange-200',
      'competitor': 'bg-red-50 text-red-700 border-red-200',
      'news': 'bg-blue-50 text-blue-700 border-blue-200',
      'editorial': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'blog': 'bg-violet-50 text-violet-700 border-violet-200',
      'ugc': 'bg-amber-50 text-amber-700 border-amber-200',
      'social': 'bg-pink-50 text-pink-700 border-pink-200',
      'reference': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'academic': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'government': 'bg-slate-100 text-slate-700 border-slate-200',
      'institutional': 'bg-teal-50 text-teal-700 border-teal-200',
      'corporate': 'bg-neutral-100 text-neutral-700 border-neutral-200',
      'other': 'bg-gray-50 text-gray-500 border-gray-200',
    }
    return colors[normalized] || 'bg-gray-50 text-gray-500 border-gray-200'
  }

  const getBrandInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getBrandColor = (name: string): string => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500']
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Transform sources from /api/analytics/sources/detailed (same as /sources page)
  const transformDetailedSources = (detailedSources: any[]): SourceData[] => {
    return detailedSources
      .filter((s: any) => (s.citation_count || 0) > 0)
      .map((s: any) => {
        // Use content_type directly — same granular classification as /sources page
        const contentType = (s.content_type || 'other').toLowerCase()

        const totalCitations = s.citation_count || 0
        const usedPct = (s.contextual_relevance || 0) / 100  // contextual_relevance is used_percentage (0-100)

        return {
          domain: s.domain,
          type: contentType,
          totalCitations,
          usageFrequency: usedPct,
          avgCitations: s.citation_velocity ? s.citation_velocity / 10 : totalCitations,
          citationUrls: (s.sample_contexts || []).map((ctx: any) =>
            typeof ctx === 'string' ? { url: ctx } : { url: ctx.url, title: ctx.title, type: ctx.type }
          ),
          brandsCiting: s.associated_brands || s.brands_mentioned_in_sources || [],
        }
      })
  }

  // Fetch from /api/analytics/sources/detailed (same endpoint as /sources page)
  useEffect(() => {
    if (!brandId) {
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()

    const fetchSources = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          brand_id: brandId,
          timeframe: '30d',
          contentType: 'all',
          authorityMin: '0',
          authorityMax: '100',
        })
        const response = await fetch(
          `/api/analytics/sources/detailed?${params}`,
          { credentials: 'include', signal: abortController.signal }
        )

        if (abortController.signal.aborted) return
        if (!response.ok) throw new Error('Failed to fetch sources data')

        const result = await response.json()
        if (abortController.signal.aborted) return

        if (result.success && result.data?.sources) {
          const transformed = transformDetailedSources(result.data.sources)
          setSources(transformed)
        } else {
          setSources([])
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Error fetching sources:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sources data')
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }

    fetchSources()
    return () => { abortController.abort() }
  }, [brandId])

  /**
   * Extract and format domain initials for badge display
   * Takes first 2 characters of domain name before TLD
   */
  const getDomainInitials = (domain: string) => {
    const name = domain.split('.')[0];
    return name.slice(0, 2).toUpperCase();
  };
  
  /**
   * Generate consistent color for domain badge
   * Uses hash function to ensure same domain always gets same color
   * Helps users quickly identify sources across the dashboard
   */
  const getDomainColor = (domain: string) => {
    const colors = [
      'bg-blue-600 text-white', 'bg-green-600 text-white', 'bg-red-600 text-white',
      'bg-purple-600 text-white', 'bg-orange-500 text-white', 'bg-indigo-600 text-white',
      'bg-pink-600 text-white', 'bg-teal-600 text-white', 'bg-gray-700 text-white',
      'bg-amber-600 text-white', 'bg-lime-600 text-white', 'bg-cyan-600 text-white'
    ];
    // Simple hash function to get consistent color for same domain
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = ((hash << 5) - hash + domain.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <TooltipProvider>
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
        <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
          <FileText className="h-5 w-5 text-white" />
          Sources Usage
        </CardTitle>
        <CardDescription className="text-gray-300 font-light">
          Content sources referenced in AI responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(isLoading || (isAnalyzing && sources.length === 0)) ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-10 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-10 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-12 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-20 rounded bg-gray-200 animate-pulse" /></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        <div className="h-3.5 w-28 rounded bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 30}ms` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full max-w-[80px] rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        <div className="h-2.5 w-8 rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-4 w-6 rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                    Cited
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                    Used %
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">
                    Avg Citations
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.length > 0 ? sources.slice(0, 5).map((source, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                              alt={source.domain}
                              className="h-5 w-5 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = (source.type === 'own' || source.type === 'owned')
                                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF760D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                                    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{source.domain}</span>
                            {source.citationUrls && source.citationUrls.length > 0 && (() => {
                              const uniqueUrls = getUniqueUrls(source.citationUrls)
                              return uniqueUrls.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRow(idx)}
                                  className="h-5 px-1.5 ml-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  {expandedRows.has(idx) ? (
                                    <><ChevronDown className="h-3 w-3 mr-1" />{uniqueUrls.length} URL{uniqueUrls.length !== 1 ? 's' : ''}</>
                                  ) : (
                                    <><ChevronRight className="h-3 w-3 mr-1" />{uniqueUrls.length} URL{uniqueUrls.length !== 1 ? 's' : ''}</>
                                  )}
                                </Button>
                              )
                            })()}
                          </div>
                        </div>
                        {source.citationUrls && source.citationUrls.length > 0 && expandedRows.has(idx) && (() => {
                          const uniqueUrls = getUniqueUrls(source.citationUrls)
                          return (
                            <div className="ml-11 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                              {uniqueUrls.map((citation, urlIdx) => (
                                <a
                                  key={urlIdx}
                                  href={citation.url.startsWith('http') ? citation.url : `https://${citation.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline group"
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate max-w-[450px]">
                                    {citation.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {source.brandsCiting.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center -space-x-1.5">
                            {source.brandsCiting.slice(0, 3).map((brand, brandIdx) => (
                              <Tooltip key={brandIdx}>
                                <TooltipTrigger asChild>
                                  <Avatar className={`h-6 w-6 border-2 border-white ${getBrandColor(brand)} text-white cursor-pointer hover:z-10`}>
                                    <AvatarFallback className={`${getBrandColor(brand)} text-white text-[10px] font-semibold`}>
                                      {getBrandInitials(brand)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{brand}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {source.brandsCiting.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-6 w-6 border-2 border-white bg-gray-200 text-gray-700 cursor-pointer">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px] font-semibold">
                                      +{source.brandsCiting.length - 3}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{source.brandsCiting.slice(3).join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium border ${getTypeBadgeColor(source.type)}`}
                      >
                        {getTypeLabel(source.type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              source.type === 'own' || source.type === 'owned' ? 'bg-[#FF760D]' : 'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min(source.usageFrequency * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">
                          {(source.usageFrequency * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            source.avgCitations >= 3
                              ? 'bg-[#FF760D]'
                              : source.avgCitations >= 2
                                ? 'bg-gray-700'
                                : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          {source.avgCitations.toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Your sources data will appear here soon.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
        
      {/* Card Footer Link */}
      <div className="mt-0 pt-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-lg">
        <Link 
          href="/dashboard/sources" 
          className="group flex items-center justify-between text-sm font-medium text-gray-700 hover:text-black transition-all duration-200 hover:bg-gray-100 -mx-2 px-2 py-2 rounded-md"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors" />
            <span>View detailed sources analysis</span>
          </div>
          <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
        </Link>
      </div>
    </Card>
    </TooltipProvider>
  )
}
