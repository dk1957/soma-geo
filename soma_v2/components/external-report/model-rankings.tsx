"use client"

/**
 * Industry Rankings Component
 * 
 * Displays competitive brand rankings across the industry:
 * - Shows how your brand ranks against competitors
 * - Position, Sentiment, and Visibility metrics
 * - Change indicators showing improvement/decline
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BrandRanking {
  brand: string
  brandLogo?: string
  isYourBrand?: boolean
  isPrimary?: boolean // Alias for isYourBrand
  position: number // This is the rank (1st, 2nd, 3rd in LVI scores)
  rank?: number // Alias for position
  avgPosition?: number // Average position in AI responses (lower is better, 1st mention = best)
  avgPositionChangePct?: number // % change in position (negative is improvement)
  lvi: number // LVI score (0-100)
  lviChange?: number // Absolute change in LVI
  lviChangePct?: number // % change in LVI
  gSOV: number // Generative Share of Voice (0-100) - note capital letters
  gsov?: number // Alias for gSOV
  gSOVChangePct?: number // % change in gSOV
  sentiment: number // sentiment score (-1 to 1, will be converted to 0-100)
  sentimentChange?: number // Absolute change in sentiment
  sentimentChangePct?: number // % change in sentiment
  visibility?: number // 0-100 percentage (alias for mentionRate)
  mentionRate?: number // 0-100 percentage
  mentionRateChange?: number // Absolute change in mention rate
  mentionRateChangePct?: number // % change in mention rate
  visibilityChange?: number // percentage point change
}

interface IndustryRankingsProps {
  rankings: BrandRanking[]
}

const ChangeIndicator = ({ value, isPercentage = true }: { value: number, isPercentage?: boolean }) => {
  if (value === 0 || Math.abs(value) < 0.1) {
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
      <span className="text-xs font-medium">
        {isPercentage ? `${displayValue.toFixed(1)}%` : displayValue.toFixed(2)}
      </span>
    </div>
  )
}

export function IndustryRankings({ rankings }: IndustryRankingsProps) {
  // Normalize the data to handle different API response formats
  const normalizedRankings = rankings.map(brand => ({
    ...brand,
    position: brand.position || brand.rank || 0,
    isYourBrand: brand.isYourBrand || brand.isPrimary || false,
    // Check if brand has any mentions — if not, sentiment is meaningless
    hasMentions: (brand.visibility || brand.mentionRate || 0) > 0,
    // Convert sentiment from -1 to 1 scale to 0-10 scale (canonical display format)
    sentimentDisplay: (brand.visibility || brand.mentionRate || 0) > 0
      ? (brand.sentiment >= -1 && brand.sentiment <= 1 
          ? Math.round(((brand.sentiment + 1) * 5) * 10) / 10
          : Math.round(brand.sentiment * 10) / 10)
      : 0,
    visibility: brand.visibility || brand.mentionRate || 0,
    gSOVValue: brand.gSOV || brand.gsov || 0,
    // Zero-visibility rule: no mentions = LVI 0
    lvi: (brand.visibility || brand.mentionRate || 0) > 0 ? brand.lvi : 0,
    avgPosition: brand.avgPosition || 0,
    avgPositionChangePct: brand.avgPositionChangePct || 0,
    lviChangePct: brand.lviChangePct || 0,
    sentimentChangePct: brand.sentimentChangePct || 0,
    gSOVChangePct: brand.gSOVChangePct || 0,
    mentionRateChangePct: brand.mentionRateChangePct || 0
  }))

  return (
    <Card className="border py-0 border-gray-200 shadow-none bg-white">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
        <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
          <Trophy className="h-5 w-5 text-white" />
          Industry Rankings
        </CardTitle>
        <CardDescription className="text-gray-200 text-sm font-light">
          Compare your brand performance against industry competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto px-6 pt-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700 w-12">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">
                  Brand
                </th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">
                  Avg Position
                </th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">
                  AI Visibility Score
                </th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">
                  AI Share of Voice
                </th>
                <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-semibold text-gray-700">
                  Sentiment
                </th>
              </tr>
            </thead>
            <tbody>
              {normalizedRankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium">No ranking data available</p>
                      <p className="text-xs text-gray-400">Run a run to generate rankings</p>
                    </div>
                  </td>
                </tr>
              ) : (
                normalizedRankings.map((brand, idx) => (
                  <tr 
                    key={`${brand.brand}-${idx}`} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      brand.isYourBrand ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <Badge 
                        variant={brand.isYourBrand ? "default" : "secondary"}
                        className={brand.isYourBrand ? "bg-[#FF760D] text-white" : ""}
                      >
                        {brand.position}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                          brand.isYourBrand ? 'bg-[#FF760D]' : 'bg-white border border-gray-200'
                        }`}>
                          {brand.isYourBrand ? (
                            <Building2 className="h-4 w-4 text-white" />
                          ) : (
                            <img
                              src={brand.brandLogo || `https://www.google.com/s2/favicons?domain=${brand.brand.toLowerCase().replace(/[\s.]+/g, '')}.com&sz=32`}
                              alt={brand.brand}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                                }
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{brand.brand}</span>
                          {brand.isYourBrand && (
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
                            {brand.avgPosition > 0 ? `#${brand.avgPosition.toFixed(1)}` : 'N/A'}
                          </span>
                          {Math.abs(brand.avgPositionChangePct) > 0.1 && (
                            <ChangeIndicator value={-brand.avgPositionChangePct} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {brand.lvi?.toFixed(1) || '0.0'}
                          </span>
                          {Math.abs(brand.lviChangePct) > 0.1 && (
                            <ChangeIndicator value={brand.lviChangePct} />
                          )}
                        </div>
                        <div className={`w-16 bg-gray-200 rounded-full h-1.5 mt-1`}>
                          <div 
                            className={`h-1.5 rounded-full ${
                              brand.isYourBrand ? 'bg-[#FF760D]' : 'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min((brand.lvi / 100) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {brand.gSOVValue?.toFixed(1) || '0.0'}%
                          </span>
                          {Math.abs(brand.gSOVChangePct) > 0.1 && (
                            <ChangeIndicator value={brand.gSOVChangePct} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            {brand.sentimentDisplay}/10
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            brand.sentimentDisplay >= 7 ? 'bg-[#FF760D]' :
                            brand.sentimentDisplay >= 5 ? 'bg-gray-500' : 'bg-gray-300'
                          }`} />
                        </div>
                        {Math.abs(brand.sentimentChangePct) > 0.1 && (
                          <ChangeIndicator value={brand.sentimentChangePct} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer - Info section for external reports */}
        <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy className="h-4 w-4 text-gray-500" />
            <span>Rankings based on AI Visibility Scores across all AI models and prompts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export with old name for backward compatibility
export { IndustryRankings as ModelRankings }
