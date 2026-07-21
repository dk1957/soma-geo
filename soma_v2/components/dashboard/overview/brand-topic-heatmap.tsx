"use client"

/**
 * Brand-Topic Analysis Heatmap Component
 * 
 * Displays a comprehensive heatmap showing topic mention frequency across competitor brands.
 * Uses the dashboard theme: black/white base with #FF760D (orange) and #E3D8C8 (beige) accents.
 * 
 * API Integration:
 * - Endpoint: GET /api/brand-topic-analysis?brandId={brandId}&dateRange={range}
 * - Response: BrandTopicData[]
 * 
 * Expected API Response Structure:
 * {
 *   brands: [
 *     {
 *       brand: string,               // Brand/competitor name
 *       isYourBrand?: boolean,       // Flag to highlight user's brand
 *       topics: {
 *         [topicName: string]: number  // Topic name -> mention count
 *       }
 *     }
 *   ],
 *   topics: string[],                // List of all available topics
 *   yourBrand: string,               // User's brand identifier
 *   dateRange: {
 *     from: string,
 *     to: string
 *   },
 *   totalMentions: number,
 *   topTopics: string[],             // Most mentioned topics
 *   lastUpdated: string
 * }
 * 
 * Features:
 * - Multi-select topic filtering with checkboxes
 * - Interactive sorting by selected topics
 * - Brand and topic search filters
 * - Color-coded intensity visualization (orange for your brand, gray for competitors)
 * - Sticky brand column for horizontal scrolling
 * - Inline legend with intensity levels (0, 1-10%, 10-30%, 30-50%, 50-80%, 80-100%)
 * - Empty state handling with contextual messages
 * - Responsive design for mobile/tablet/desktop
 * - Refresh button for manual data reload
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Search, RefreshCw, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useBrand } from "@/lib/contexts/brand-context"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Brand topic data structure
 * Represents mention counts and sentiment for each topic across a single brand
 */
interface BrandTopicData {
  brand: string
  isYourBrand?: boolean // Flag to highlight the user's brand
  topics: {
    [key: string]: number // Topic name -> mention count
  }
  topicSentiments: {
    [key: string]: number // Topic name -> avg sentiment (-1 to 1)
  }
}

interface BrandTopicHeatmapProps {
  brandId?: string
  maxTopics?: number // Maximum topics to display (default: 8)
  reportData?: any // Report data from useReportData hook
  isAnalyzing?: boolean
}

// ============================================================================
// MOCK DATA (Replace with API call in production)
// ============================================================================

/**
 * Mock brand-topic analysis data
 * TODO: Replace with API call to GET /api/brand-topic-analysis?brandId={brandId}
 * 
 * Expected API Response:
 * {
 *   brands: BrandTopicData[],
 *   topics: string[],
 *   yourBrand: string,
 *   lastUpdated: string,
 *   totalMentions: number
 * }
 */
const mockBrandTopicData: BrandTopicData[] = [
  {
    brand: "Your Brand",
    isYourBrand: true,
    topics: {
      content: 213, seo: 154, tool: 117, keyword: 42, linking: 101,
      topics: 281, analysis: 54, search: 105, site: 28, markup: 108,
      pages: 89, offers: 21, features: 20, data: 11, relevant: 48
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor A",
    topics: {
      content: 185, seo: 423, tool: 244, keyword: 292, linking: 37,
      topics: 89, analysis: 207, search: 68, site: 113, markup: 0,
      pages: 20, offers: 91, features: 128, data: 63, relevant: 13
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor B",
    topics: {
      content: 528, seo: 202, tool: 160, keyword: 324, linking: 33,
      topics: 78, analysis: 87, search: 123, site: 12, markup: 0,
      pages: 47, offers: 47, features: 26, data: 4, relevant: 112
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor C",
    topics: {
      content: 62, seo: 102, tool: 30, keyword: 7, linking: 115,
      topics: 2, analysis: 10, search: 11, site: 42, markup: 31,
      pages: 8, offers: 24, features: 28, data: 13, relevant: 8
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor D",
    topics: {
      content: 13, seo: 87, tool: 22, keyword: 6, linking: 17,
      topics: 3, analysis: 2, search: 4, site: 28, markup: 27,
      pages: 1, offers: 22, features: 33, data: 13, relevant: 4
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor E",
    topics: {
      content: 8, seo: 33, tool: 34, keyword: 9, linking: 21,
      topics: 21, analysis: 6, search: 78, site: 26, markup: 1,
      pages: 10, offers: 8, features: 2, data: 16, relevant: 1
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor F",
    topics: {
      content: 110, seo: 178, tool: 114, keyword: 188, linking: 88,
      topics: 38, analysis: 168, search: 33, site: 63, markup: 0,
      pages: 34, offers: 48, features: 68, data: 58, relevant: 17
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor G",
    topics: {
      content: 668, seo: 432, tool: 188, keyword: 270, linking: 0,
      topics: 82, analysis: 133, search: 81, site: 14, markup: 0,
      pages: 84, offers: 76, features: 58, data: 7, relevant: 66
    },
    topicSentiments: {},
  },
  {
    brand: "Competitor H",
    topics: {
      content: 408, seo: 78, tool: 52, keyword: 53, linking: 17,
      topics: 147, analysis: 89, search: 31, site: 3, markup: 0,
      pages: 20, offers: 41, features: 34, data: 3, relevant: 61
    },
    topicSentiments: {},
  }
]

const allTopics = [
  "content", "seo", "tool", "keyword", "linking", "topics", 
  "analysis", "search", "site", "markup", "pages", "offers", 
  "features", "data", "relevant"
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BrandTopicHeatmap({ brandId, maxTopics = 8, reportData, isAnalyzing = false }: BrandTopicHeatmapProps) {
  // State management
  const [data, setData] = useState<BrandTopicData[]>([])
  const [allTopicsList, setAllTopicsList] = useState<string[]>([])
  const [relevantTopics, setRelevantTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [searchBrand, setSearchBrand] = useState("")
  const [searchTopic, setSearchTopic] = useState("")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { currentWorkspace, currentBrand } = useBrand()
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setData([])
    setAllTopicsList([])
    setRelevantTopics([])
    setSelectedTopics([])
    setSearchBrand("")
    setSearchTopic("")
    setError(null)
    setLoading(true)
  }, [brandId])

  /**
   * Process topic matrix data from reportData prop
   */
  useEffect(() => {
    const processData = () => {
      if (!brandId) return
      
      // If no reportData yet, show loading
      if (!reportData) {
        setLoading(true)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        const topicMatrix = reportData.topicMatrix || { topics: [], data: [] }
        
        // Transform API data into component format
        const topics = topicMatrix.topics || []
        const matrixData = topicMatrix.data || []
        
        // Get unique brands
        const uniqueBrands = [...new Set(matrixData.map((d: any) => d.brand))]
        
        // Get the primary brand name for comparison
        const primaryBrandName = currentBrand?.name?.toLowerCase() || ''
        
        // Build brand-topic structure
        const formattedData: BrandTopicData[] = uniqueBrands.map((brandName: string) => {
          const brandData = matrixData.filter((d: any) => d.brand === brandName)
          const topicsObj: { [key: string]: number } = {}
          const sentimentsObj: { [key: string]: number } = {}
          
          brandData.forEach((item: any) => {
            topicsObj[item.topic] = item.value || 0
            sentimentsObj[item.topic] = item.sentiment ?? 0
          })
          
          // Check if this brand matches the primary brand from context
          const isYourBrand = brandName.toLowerCase() === primaryBrandName
          
          return {
            brand: brandName,
            isYourBrand,
            topics: topicsObj,
            topicSentiments: sentimentsObj,
          }
        })
        
        setData(formattedData)
        setAllTopicsList(topics)
        
        // Filter to only show most relevant topics (by total mentions)
        let topTopics = topics
        if (maxTopics > 0 && topics.length > maxTopics) {
          const topicMentions = new Map<string, number>()
          topics.forEach((topic: string) => {
            const totalMentions = formattedData.reduce((sum, brand) => sum + (brand.topics[topic] || 0), 0)
            topicMentions.set(topic, totalMentions)
          })
          topTopics = [...topics]
            .sort((a: string, b: string) => (topicMentions.get(b) || 0) - (topicMentions.get(a) || 0))
            .slice(0, maxTopics)
        }
        
        setRelevantTopics(topTopics)
        setSelectedTopics(topTopics)
      } catch (err) {
        console.error('Error processing topic matrix:', err)
        setError(err instanceof Error ? err.message : 'Failed to load topic data')
      } finally {
        setLoading(false)
      }
    }
    
    processData()
  }, [brandId, reportData, currentBrand?.name, maxTopics])

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  // Filter brands based on search
  const filteredBrands = data.filter(brand =>
    brand.brand.toLowerCase().includes(searchBrand.toLowerCase())
  )

  // Filter topics based on search and selected topics
  const filteredTopics = selectedTopics.filter(topic =>
    topic.toLowerCase().includes(searchTopic.toLowerCase())
  )

  // Sort brands based on total mentions across all selected topics
  const sortedBrands = [...filteredBrands].sort((a, b) => {
    const aTotal = selectedTopics.reduce((sum, topic) => sum + (a.topics[topic] || 0), 0)
    const bTotal = selectedTopics.reduce((sum, topic) => sum + (b.topics[topic] || 0), 0)
    return bTotal - aTotal
  })

  // Toggle topic selection
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  // Select/deselect all topics (uses relevantTopics instead of allTopicsList)
  const toggleAllTopics = () => {
    setSelectedTopics(prev => prev.length === relevantTopics.length ? [] : [...relevantTopics])
  }

  // Calculate max value for color intensity normalization
  const allValues = filteredBrands.flatMap(brand =>
    filteredTopics.map(topic => brand.topics[topic] || 0)
  )
  const maxValue = Math.max(...allValues, 1) // Prevent division by zero

  // ============================================================================
  // STYLING FUNCTIONS
  // ============================================================================

  /**
   * Get color class based on value intensity and sentiment.
   * Sentiment-aware: green for positive, red for negative, gray for neutral.
   * Intensity based on count relative to max.
   */
  const getColorClass = (value: number, sentiment: number = 0, isYourBrand: boolean = false) => {
    if (value === 0) return "bg-white text-gray-400 border-gray-100"
    
    const intensity = (value / maxValue) * 100
    
    // Determine sentiment direction
    const isPositive = sentiment > 0.15
    const isNegative = sentiment < -0.15
    
    if (isYourBrand) {
      // Your brand: orange for neutral, green-tinged for positive, red-tinged for negative
      if (isPositive) {
        if (intensity >= 80) return "bg-emerald-600 text-white font-semibold"
        if (intensity >= 50) return "bg-emerald-500 text-white font-semibold"
        if (intensity >= 30) return "bg-emerald-400 text-white"
        if (intensity >= 10) return "bg-emerald-200 text-gray-900"
        return "bg-emerald-100 text-gray-700"
      }
      if (isNegative) {
        if (intensity >= 80) return "bg-red-600 text-white font-semibold"
        if (intensity >= 50) return "bg-red-500 text-white font-semibold"
        if (intensity >= 30) return "bg-red-400 text-white"
        if (intensity >= 10) return "bg-red-200 text-gray-900"
        return "bg-red-100 text-gray-700"
      }
      // Neutral → orange (brand color)
      if (intensity >= 80) return "bg-[#FF760D] text-white font-semibold"
      if (intensity >= 50) return "bg-[#FF760D]/80 text-white font-semibold"
      if (intensity >= 30) return "bg-[#FF760D]/60 text-white"
      if (intensity >= 10) return "bg-[#FF760D]/40 text-gray-900"
      return "bg-[#FF760D]/20 text-gray-700"
    }
    
    // Competitors: green for positive, red for negative, gray for neutral
    if (isPositive) {
      if (intensity >= 80) return "bg-emerald-700 text-white font-semibold"
      if (intensity >= 50) return "bg-emerald-600 text-white font-semibold"
      if (intensity >= 30) return "bg-emerald-400 text-white"
      if (intensity >= 10) return "bg-emerald-200 text-gray-900"
      return "bg-emerald-50 text-gray-700"
    }
    if (isNegative) {
      if (intensity >= 80) return "bg-red-700 text-white font-semibold"
      if (intensity >= 50) return "bg-red-600 text-white font-semibold"
      if (intensity >= 30) return "bg-red-400 text-white"
      if (intensity >= 10) return "bg-red-200 text-gray-900"
      return "bg-red-50 text-gray-700"
    }
    // Neutral
    if (intensity >= 80) return "bg-gray-900 text-white font-semibold"
    if (intensity >= 50) return "bg-gray-700 text-white font-semibold"
    if (intensity >= 30) return "bg-gray-500 text-white"
    if (intensity >= 10) return "bg-gray-300 text-gray-900"
    return "bg-gray-100 text-gray-700"
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (loading || (isAnalyzing && sortedBrands.length === 0)) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <BarChart3 className="h-5 w-5 text-white" />
            Brand-Topic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filter skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="h-3 w-20 rounded bg-gray-200 animate-pulse mb-1.5" />
              <div className="h-9 w-full rounded border border-gray-200 bg-gray-50 animate-pulse" />
            </div>
            <div className="w-32">
              <div className="h-3 w-16 rounded bg-gray-200 animate-pulse mb-1.5" />
              <div className="h-9 w-full rounded border border-gray-200 bg-gray-50 animate-pulse" />
            </div>
          </div>
          {/* Heatmap grid skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-3 w-[180px]"><div className="h-3 w-12 rounded bg-gray-200 animate-pulse" /></th>
                  {[...Array(4)].map((_, i) => (
                    <th key={i} className="py-3 px-2 text-center">
                      <div className="h-3 w-16 rounded bg-gray-200 animate-pulse mx-auto" style={{ animationDelay: `${i * 80}ms` }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, row) => (
                  <tr key={row} className="border-b border-gray-100">
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-28 rounded bg-gray-200 animate-pulse" style={{ animationDelay: `${row * 80}ms` }} />
                    </td>
                    {[...Array(4)].map((_, col) => (
                      <td key={col} className="py-3 px-2 text-center">
                        <div
                          className="h-8 w-full rounded bg-gray-100 animate-pulse mx-auto"
                          style={{ animationDelay: `${(row * 4 + col) * 40}ms`, opacity: 0.4 + Math.random() * 0.4 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <BarChart3 className="h-5 w-5 text-white" />
            Brand-Topic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      {/* Header - Black background with white text */}
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
              <BarChart3 className="h-5 w-5 text-white" />
              Brand-Topic Analysis
            </CardTitle>
            <CardDescription className="text-gray-300 font-light">
              Competitive topic analysis showing mention frequency across brands and topics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Sort by Topic</label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-gray-300 text-sm font-normal hover:bg-gray-50"
                >
                  <span className="text-gray-900">
                    {selectedTopics.length === relevantTopics.length 
                      ? `All ${relevantTopics.length} topics selected` 
                      : selectedTopics.length === 0
                      ? 'No topics selected'
                      : `${selectedTopics.length} of ${relevantTopics.length} topics selected`}
                  </span>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Select Topics ({relevantTopics.length} most relevant)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllTopics}
                      className="h-7 text-xs text-[#FF760D] hover:text-[#FF760D] hover:bg-[#FF760D]/10"
                    >
                      {selectedTopics.length === relevantTopics.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {relevantTopics.map(topic => (
                    <div
                      key={topic}
                      className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleTopic(topic)}
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => toggleTopic(topic)}
                        className="data-[state=checked]:bg-[#FF760D] data-[state=checked]:border-[#FF760D]"
                      />
                      <span className="text-sm text-gray-900 capitalize">{topic}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Sort brands</label>
            <Select defaultValue="mentions">
              <SelectTrigger className="h-9 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentions">Brands sorted by Topics + Mentions</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="total">Total Mentions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Search brands</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search brands..."
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                className="pl-8 h-9 border-gray-300"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Search topics</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search topics..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="pl-8 h-9 border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Heatmap Table with Sticky Brand Column */}
        {sortedBrands.length === 0 || filteredTopics.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {selectedTopics.length === 0 ? 'Please select at least one topic to view the analysis.' : 'Your brand-topic analysis will appear here soon.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 text-left py-3 px-4 font-semibold text-gray-900 text-sm border-b border-r border-gray-200 min-w-[140px]">
                    Brand
                  </th>
                  {filteredTopics.map(topic => (
                    <th
                      key={topic}
                      className="text-center py-3 px-4 font-semibold text-gray-900 text-sm border-b border-gray-200 min-w-[80px] capitalize"
                    >
                      {topic}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedBrands.map((brand) => (
                  <tr 
                    key={brand.brand} 
                    className={`transition-colors ${
                      brand.isYourBrand 
                        ? 'bg-[#FF760D]/5 hover:bg-[#FF760D]/10' 
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className={`sticky left-0 z-10 text-left py-3 px-4 font-medium text-sm border-b border-r border-gray-200 ${
                      brand.isYourBrand 
                        ? 'bg-[#FF760D]/5 text-[#FF760D] font-semibold' 
                        : 'bg-white text-gray-900 hover:bg-gray-50/50'
                    }`}>
                      {brand.brand}
                      {brand.isYourBrand && (
                        <Badge className="ml-2 bg-[#FF760D] text-white text-xs">You</Badge>
                      )}
                    </td>
                    {filteredTopics.map(topic => {
                      const value = brand.topics[topic] || 0
                      const sentiment = brand.topicSentiments?.[topic] || 0
                      return (
                        <td
                          key={topic}
                          className={`text-center py-3 px-4 text-sm border-b border-gray-200 transition-colors ${
                            getColorClass(value, sentiment, brand.isYourBrand)
                          }`}
                          title={value > 0 ? `${topic}: ${value} mentions, sentiment: ${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)}` : ''}
                        >
                          {value > 0 ? value : ""}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend - Sentiment-aware color scheme */}
        <div className="mt-6 mb-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-900">Sentiment:</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-emerald-500"></div>
              <span className="text-xs text-gray-500">Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-[#FF760D]/60"></div>
              <span className="text-xs text-gray-500">Neutral (Your Brand)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gray-500"></div>
              <span className="text-xs text-gray-500">Neutral (Competitor)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-red-500"></div>
              <span className="text-xs text-gray-500">Negative</span>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <div className="w-5 h-5 rounded bg-white border border-gray-200"></div>
              <span className="text-xs text-gray-500">No data</span>
            </div>
            <span className="text-xs text-gray-400 ml-3">Intensity = mention frequency • Color = sentiment direction</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
