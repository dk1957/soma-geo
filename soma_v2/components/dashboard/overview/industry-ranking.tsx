"use client"

/**
 * Industry Ranking Component
 * 
 * Displays competitive rankings comparing brand performance against industry competitors.
 * Shows key metrics including average position, LVI, gSOV, and sentiment with trend indicators.
 */

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useBrand } from "@/lib/contexts/brand-context"
import { getEntityTerminology, EntityType } from "@/lib/utils/entity-language"

interface BrandRanking {
  rank: number
  brand: string
  avgPosition: number | null  // Ordinal rank (1st, 2nd, 3rd...) — lower is better
  avgPositionChangePct: number
  lvi: number
  lviChangePct: number
  gSOV: number | null
  gSOVChangePct: number
  sentiment: number | null  // 0-10 scale
  sentimentChangePct: number
  isPrimary: boolean
  isCompetitor: boolean
}

interface IndustryRankingProps {
  brandId: string
  reportData?: any  // Data from useReportData hook - single source of truth
  isAnalyzing?: boolean
}

const ChangeIndicator = ({ value }: { value: number }) => {
  if (Math.abs(value) < 0.1) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Minus className="h-3 w-3" />
        <span className="text-xs">0%</span>
      </div>
    )
  }
  
  const isPositive = value > 0
  const displayValue = Math.abs(value)
  
  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span className="text-xs font-medium">{displayValue.toFixed(1)}%</span>
    </div>
  )
}

export function IndustryRanking({ brandId, reportData, isAnalyzing = false }: IndustryRankingProps) {
  const { currentWorkspace, currentBrand } = useBrand()
  const [rankings, setRankings] = useState<BrandRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get entity-aware terminology
  const terminology = useMemo(() => 
    getEntityTerminology(currentBrand?.entity_type as EntityType), 
    [currentBrand?.entity_type]
  )
  
  // Capitalize first letter helper
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setRankings([])
    setError(null)
    setIsLoading(true)
  }, [brandId])

  // Transform ranking data from either reportData or API response
  const transformRankings = (rawRankings: any[]): BrandRanking[] => {
    const knownCompetitors = currentBrand?.knownCompetitors || []
    const primaryBrandName = currentBrand?.name || ''
    
    return rawRankings
      .filter((r: any) => {
        const brandName = (r.brand || r.brand_name)?.trim() || ''
        return brandName && 
               brandName !== 'Unknown Primary Brand' && 
               brandName !== 'unknown' &&
               brandName.toLowerCase() !== 'null'
      })
      .map((r: any) => {
        const brandName = (r.brand || r.brand_name)?.trim() || ''
        const isPrimary = r.is_primary || brandName.toLowerCase() === primaryBrandName.toLowerCase()
        const isCompetitor = knownCompetitors.some(
          (comp: string) => comp.toLowerCase() === brandName.toLowerCase()
        )
        
        // Average position as ordinal rank (lower is better)
        const avgPos = r.avgPosition || r.avg_position || 0
        
        const lvi = parseFloat(r.lvi?.toString() || r.lvi_score?.toString() || '0')
        const rawSov = r.gSOV ?? r.share_of_voice ?? null
        const gSOV = rawSov !== null && rawSov !== undefined ? parseFloat(rawSov.toString()) : null
        const rawSentiment = r.sentiment !== undefined ? r.sentiment : (r.avg_sentiment !== undefined ? r.avg_sentiment : 0)
        
        // Check if brand has any mentions — if not, sentiment should be 0 (not "neutral 5.0")
        const mentionRate = parseFloat(r.mention_rate?.toString() || r.mentionRate?.toString() || '0')
        const totalMentions = parseFloat(r.total_mentions?.toString() || r.mention_count?.toString() || '0')
        const hasMentions = mentionRate > 0 || totalMentions > 0
        
        // Sentiment: convert -1..1 to 0-10 scale (null if not mentioned)
        const sentiment10 = hasMentions ? ((parseFloat(rawSentiment?.toString() ?? '0') || 0) + 1) * 5 : null
        
        return {
          rank: r.rank,
          brand: brandName,
          avgPosition: avgPos > 0 ? Math.round(avgPos * 10) / 10 : null,
          avgPositionChangePct: r.avgPositionChangePct || r.avg_position_change_pct || 0,
          lvi: hasMentions ? lvi : 0, // Zero-visibility rule: no mentions = LVI 0
          lviChangePct: parseFloat(r.lviChangePct?.toString() || r.lvi_change_pct?.toString() || '0'),
          gSOV,
          gSOVChangePct: parseFloat(r.gSOVChangePct?.toString() || r.share_of_voice_change_pct?.toString() || '0'),
          sentiment: sentiment10,
          sentimentChangePct: parseFloat(r.sentimentChangePct?.toString() || r.sentiment_change_pct?.toString() || '0'),
          isPrimary,
          isCompetitor
        }
      })
      .sort((a: BrandRanking, b: BrandRanking) => b.lvi - a.lvi)
      .map((r: BrandRanking, index: number) => ({
        ...r,
        rank: index + 1
      }))
  }

  // Primary: Use reportData from useReportData hook (single source of truth)
  useEffect(() => {
    if (reportData?.rankings && Array.isArray(reportData.rankings) && reportData.rankings.length > 0) {
      const mapped = transformRankings(reportData.rankings)
      setRankings(mapped)
      setIsLoading(false)
      setError(null)
      return
    }
    
    // If reportData exists but rankings is empty, show empty state
    if (reportData && reportData.rankings !== undefined) {
      setRankings([])
      setIsLoading(false)
      return
    }
    
    // Fallback: fetch from dedicated API (for standalone usage without reportData)
    if (!brandId || !currentWorkspace?.account_id) {
      if (!brandId) setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    
    const fetchRankings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          brandId,
          accountId: currentWorkspace!.account_id,
          limit: '10'
        })

        const response = await fetch(`/api/analytics/rankings/industry?${params}`, {
          credentials: 'include',
          signal: abortController.signal
        })
        
        if (abortController.signal.aborted) return
        
        if (!response.ok) {
          throw new Error('Failed to fetch rankings')
        }

        const data = await response.json()
        if (abortController.signal.aborted) return
        
        const mapped = transformRankings(data.rankings || [])
        setRankings(mapped)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Failed to load industry rankings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load rankings')
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchRankings()
    return () => { abortController.abort() }
  }, [brandId, reportData, currentWorkspace?.account_id, currentBrand?.name, currentBrand?.knownCompetitors])
  return (
    <Card className="border py-0 border-gray-200 shadow-none bg-white">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
        <CardTitle className="flex items-center gap-3 text-xl font-light text-white">
          <Trophy className="h-5 w-5 text-white" />
          {capitalize(terminology.position)} Ranking
        </CardTitle>
        <CardDescription className="text-gray-300 font-light">
          Compare your {terminology.entityName} performance against {terminology.competitorPlural}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(isLoading || (isAnalyzing && rankings.length === 0)) ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 w-12"><div className="h-3 w-8 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-14 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-10 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-10 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                  <th className="py-3 px-4"><div className="h-3 w-16 rounded bg-gray-200 animate-pulse mx-auto" /></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-4"><div className="h-6 w-6 rounded bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 rounded bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                          <div className="h-2.5 w-16 rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-8 rounded bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    <td className="py-4 px-4"><div className="h-4 w-10 rounded bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    <td className="py-4 px-4"><div className="h-4 w-10 rounded bg-gray-100 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 rounded bg-gray-100 animate-pulse mx-auto" style={{ animationDelay: `${i * 100}ms` }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <Trophy className="h-12 w-12 text-red-300 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700 w-12">Rank</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">{capitalize(terminology.entityName)}</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">Position</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">LVI</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">gSOV</th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length > 0 ? rankings.map((ranking) => (
                  <tr 
                    key={`${ranking.brand}-${ranking.rank}`}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      ranking.isPrimary ? 'bg-orange-50/30' : ranking.isCompetitor ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <Badge 
                        variant={ranking.isPrimary ? "default" : ranking.isCompetitor ? "outline" : "secondary"}
                        className={ranking.isPrimary ? "bg-[#FF760D] text-white" : ranking.isCompetitor ? "border-blue-500 text-blue-600" : ""}
                      >
                        {ranking.rank}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                          ranking.isPrimary ? 'bg-[#FF760D]' : 'bg-white border border-gray-200'
                        }`}>
                          {ranking.isPrimary ? (
                            <Building2 className="h-4 w-4 text-white" />
                          ) : (
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${ranking.brand.toLowerCase().replace(/[\s.]+/g, '')}.com&sz=32`}
                              alt={ranking.brand}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  const color = ranking.isCompetitor ? '#2563eb' : '#6b7280'
                                  target.parentElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`
                                }
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{ranking.brand}</span>
                          {ranking.isPrimary && (
                            <Badge variant="outline" className="text-xs border-[#FF760D] text-[#FF760D]">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {ranking.avgPosition !== null ? `#${ranking.avgPosition}` : 'N/A'}
                          </span>
                          {Math.abs(ranking.avgPositionChangePct) > 0.1 && (
                            <ChangeIndicator value={-ranking.avgPositionChangePct} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {ranking.lvi.toFixed(1)}
                          </span>
                          {Math.abs(ranking.lviChangePct) > 0.1 && (
                            <ChangeIndicator value={ranking.lviChangePct} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {ranking.gSOV !== null ? `${ranking.gSOV.toFixed(1)}%` : '—'}
                          </span>
                          {ranking.gSOV !== null && Math.abs(ranking.gSOVChangePct) > 0.1 && (
                            <ChangeIndicator value={ranking.gSOVChangePct} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {ranking.sentiment !== null ? `${ranking.sentiment.toFixed(1)}/10` : '—'}
                          </span>
                          {ranking.sentiment !== null && (
                            <div className={`w-2 h-2 rounded-full ${
                              ranking.sentiment >= 7 ? 'bg-[#FF760D]' :
                              ranking.sentiment >= 5 ? 'bg-gray-500' : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                        {ranking.sentiment !== null && Math.abs(ranking.sentimentChangePct) > 0.1 && (
                          <ChangeIndicator value={ranking.sentimentChangePct} />
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Trophy className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-600 font-medium">No ranking data available</p>
                        <p className="text-xs text-gray-400">Run a run to generate rankings</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
