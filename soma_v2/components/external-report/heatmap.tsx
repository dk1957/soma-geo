"use client"

/**
 * Brand Topic Heatmap Component for External Reports
 * 
 * Displays brand-topic analysis heatmap showing mention frequency
 * across competitor brands. Adapted from dashboard component.
 * 
 * Features:
 * - Multi-select topic filtering
 * - Brand/topic search filters
 * - Color-coded intensity (orange for your brand, gray for competitors)
 * - Sticky brand column
 * - Inline legend
 */

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface BrandTopicData {
  brand: string
  isYourBrand?: boolean
  topics: {
    [key: string]: number
  }
  topicSentiments?: {
    [key: string]: number
  }
}

interface HeatmapProps {
  data: BrandTopicData[]
  allTopics: string[]
  maxTopics?: number // Maximum topics to display (default: 8)
}

export function Heatmap({ data, allTopics, maxTopics = 8 }: HeatmapProps) {
  // Filter to only show most relevant topics (by total mentions across all brands)
  const relevantTopics = useMemo(() => {
    if (maxTopics <= 0 || allTopics.length <= maxTopics) return allTopics
    
    // Calculate total mentions per topic
    const topicMentions = new Map<string, number>()
    allTopics.forEach(topic => {
      const totalMentions = data.reduce((sum, brand) => sum + (brand.topics[topic] || 0), 0)
      topicMentions.set(topic, totalMentions)
    })
    
    // Sort by mentions and take top N
    return [...allTopics]
      .sort((a, b) => (topicMentions.get(b) || 0) - (topicMentions.get(a) || 0))
      .slice(0, maxTopics)
  }, [allTopics, data, maxTopics])

  const [selectedTopics, setSelectedTopics] = useState<string[]>(relevantTopics)
  const [searchBrand, setSearchBrand] = useState("")
  const [searchTopic, setSearchTopic] = useState("")
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Update selected topics when relevant topics change
  useEffect(() => {
    setSelectedTopics(relevantTopics)
  }, [relevantTopics])

  // Filter brands based on search
  const filteredBrands = data.filter(brand =>
    brand.brand.toLowerCase().includes(searchBrand.toLowerCase())
  )

  // Filter topics based on search and selected topics
  const filteredTopics = selectedTopics.filter(topic =>
    topic.toLowerCase().includes(searchTopic.toLowerCase())
  )

  // Sort brands based on total mentions across selected topics
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

  // Select/deselect all topics (uses relevantTopics instead of allTopics)
  const toggleAllTopics = () => {
    setSelectedTopics(prev => prev.length === relevantTopics.length ? [] : [...relevantTopics])
  }

  // Calculate max value for color intensity normalization
  const allValues = filteredBrands.flatMap(brand =>
    filteredTopics.map(topic => brand.topics[topic] || 0)
  )
  const maxValue = Math.max(...allValues, 1)

  // Get color class based on value intensity and sentiment
  const getColorClass = (value: number, sentiment: number = 0, isYourBrand: boolean = false) => {
    if (value === 0) return "bg-white text-gray-400 border-gray-100"

    const intensity = (value / maxValue) * 100
    const isPositive = sentiment > 0.15
    const isNegative = sentiment < -0.15

    if (isYourBrand) {
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
      if (intensity >= 80) return "bg-[#FF760D] text-white font-semibold"
      if (intensity >= 50) return "bg-[#FF760D]/80 text-white font-semibold"
      if (intensity >= 30) return "bg-[#FF760D]/60 text-white"
      if (intensity >= 10) return "bg-[#FF760D]/40 text-gray-900"
      return "bg-[#FF760D]/20 text-gray-700"
    }

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
    if (intensity >= 80) return "bg-gray-900 text-white font-semibold"
    if (intensity >= 50) return "bg-gray-700 text-white font-semibold"
    if (intensity >= 30) return "bg-gray-500 text-white"
    if (intensity >= 10) return "bg-gray-300 text-gray-900"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
        <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
          <BarChart3 className="h-5 w-5 text-white" />
          Brand-Topic Analysis
        </CardTitle>
        <CardDescription className="text-gray-300 font-light">
          Competitive topic analysis showing mention frequency across brands and topics
        </CardDescription>
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
                  {relevantTopics.map((topic) => (
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

        {/* Heatmap Table */}
        {sortedBrands.length === 0 || filteredTopics.length === 0 ? (
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
                    className={`transition-colors ${brand.isYourBrand
                        ? 'bg-[#FF760D]/5 hover:bg-[#FF760D]/10'
                        : 'hover:bg-gray-50/50'
                      }`}
                  >
                    <td className={`sticky left-0 z-10 text-left py-3 px-4 font-medium text-sm border-b border-r border-gray-200 ${brand.isYourBrand
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
                          className={`text-center py-3 px-4 text-sm border-b border-gray-200 transition-colors ${getColorClass(value, sentiment, brand.isYourBrand)
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
