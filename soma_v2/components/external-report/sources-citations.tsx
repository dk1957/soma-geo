"use client"

/**
 * Sources & Citations Component
 * 
 * Displays domain-based citation analysis with logos, types, and usage metrics
 * Helps brand managers understand which sources AI models reference
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Globe, Building2, Quote, ExternalLink, ChevronDown, ChevronRight } from "lucide-react"

interface SourceData {
  domain: string
  domainLogo?: string
  type: 'your-brand' | 'competitor' | 'news-media' | 'industry' | 'academic' | 'government' | 'reference'
  usedPercentage: number
  avgCitations: number
  citationUrls?: Array<{ url: string; title?: string; type?: string }>
  brandsCiting?: string[]
}

interface SourcesCitationsProps {
  sources: SourceData[]
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'your-brand': 'Your Brand',
    'competitor': 'Competitor',
    'news-media': 'News & Media',
    'industry': 'Industry Publication',
    'academic': 'Academic',
    'government': 'Government',
    'reference': 'Reference'
  }
  return labels[type] || type
}

const getTypeBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    'your-brand': 'bg-[#FF760D] text-white',
    'competitor': 'bg-red-100 text-red-700 border-red-200',
    'news-media': 'bg-blue-100 text-blue-700 border-blue-200',
    'industry': 'bg-purple-100 text-purple-700 border-purple-200',
    'academic': 'bg-green-100 text-green-700 border-green-200',
    'government': 'bg-gray-100 text-gray-700 border-gray-300',
    'reference': 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
  return colors[type] || 'bg-gray-100 text-gray-700'
}

export function SourcesCitations({ sources }: SourcesCitationsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

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

  return (
    <TooltipProvider>
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
        <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
          <Quote className="h-5 w-5 text-white" />
          Sources & Citations
        </CardTitle>
        <CardDescription className="text-gray-300 font-light">
          External sources referenced in AI responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
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
                {sources.slice(0, 5).map((source, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={source.domainLogo || `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                              alt={source.domain}
                              className="h-5 w-5 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = source.type === 'your-brand'
                                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF760D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                                    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <a 
                              href={`https://${source.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                            >
                              {source.domain}
                            </a>
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
                      {source.brandsCiting && source.brandsCiting.length > 0 ? (
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
                              source.type === 'your-brand' ? 'bg-[#FF760D]' : 'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min(source.usedPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">
                          {source.usedPercentage.toFixed(1)}%
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Quote className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Citation data will appear here soon.
            </p>
          </div>
        )}
      </CardContent>

      {/* Card Footer - Note section for external reports */}
      <div className="mt-0 pt-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Quote className="h-4 w-4 text-gray-500" />
          <span>Top 5 sources cited in AI responses</span>
        </div>
      </div>
    </Card>
    </TooltipProvider>
  )
}
