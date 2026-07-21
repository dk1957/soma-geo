"use client"

/**
 * Insights & Recommendations Component
 * 
 * Displays AI-powered strategic insights and actionable recommendations based on
 * brand performance data, competitive analysis, and trend detection.
 * 
 * API Integration:
 * - Endpoint: GET /api/reports/[brandId]/data?period=30d
 * - Uses opportunities, threats, and strengths from prompt performance data
 * 
 * Features:
 * - Grouped by priority (High Priority, Additional Opportunities)
 * - Color-coded by type (success, opportunity, warning, action)
 * - Interactive cards with hover effects
 * - Metric tracking with trend indicators
 * - Empty state with lightbulb icon
 * - Responsive grid layout (3 columns on desktop)
 */

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  ArrowUpRight,
  Target,
  Zap,
  Shield,
  Loader2
} from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { getEntityTerminology, EntityType } from "@/lib/utils/entity-language"

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'action'
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  impact: string
  metric?: {
    value: string
    change: string
    positive: boolean
  }
}

interface InsightsRecommendationsProps {
  brandId: string
}

/**
 * Get the appropriate icon component for each insight type
 * Icons help users quickly identify the nature of each insight
 */

/**
 * Get the appropriate icon component for each insight type
 * Icons help users quickly identify the nature of each insight
 */
const getInsightIcon = (type: Insight['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle2
    case 'opportunity':
      return TrendingUp
    case 'warning':
      return AlertTriangle
    case 'action':
      return Target
    default:
      return Lightbulb
  }
}

/**
 * Get color scheme for insight card based on type
 * Returns background, icon color, and border color classes
 * Uses dashboard theme colors: orange (#FF760D) for primary, grays for secondary
 */
const getInsightColor = (type: Insight['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-[#E3D8C8]/20',
        icon: 'text-[#FF760D]',
        border: 'border-[#E3D8C8]'
      }
    case 'opportunity':
      return {
        bg: 'bg-[#FF760D]/10',
        icon: 'text-[#FF760D]',
        border: 'border-[#FF760D]/30'
      }
    case 'warning':
      return {
        bg: 'bg-gray-100',
        icon: 'text-gray-600',
        border: 'border-gray-300'
      }
    case 'action':
      return {
        bg: 'bg-black/5',
        icon: 'text-black',
        border: 'border-gray-300'
      }
    default:
      return {
        bg: 'bg-gray-50',
        icon: 'text-gray-500',
        border: 'border-gray-200'
      }
  }
}

/**
 * Render priority badge with appropriate styling
 * High priority uses orange accent color to draw attention
 * Medium and low use outline style with grays
 */
const getPriorityBadge = (priority: Insight['priority']) => {
  switch (priority) {
    case 'high':
      return <Badge className="bg-[#FF760D] text-white text-xs">High Priority</Badge>
    case 'medium':
      return <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">Medium</Badge>
    case 'low':
      return <Badge variant="outline" className="border-gray-200 text-gray-500 text-xs">Low</Badge>
  }
}

export function InsightsRecommendations({ brandId }: InsightsRecommendationsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedBrandId, setLastFetchedBrandId] = useState<string | null>(null)
  const { currentWorkspace, currentBrand } = useBrand()
  
  // Get entity-aware terminology
  const terminology = useMemo(() => 
    getEntityTerminology(currentBrand?.entity_type as EntityType), 
    [currentBrand?.entity_type]
  )
  
  // Reset state when brand changes to prevent showing stale data
  useEffect(() => {
    setInsights([])
    setError(null)
    setIsLoading(true)
    setLastFetchedBrandId(null)
  }, [brandId])

  useEffect(() => {
    // Skip if we already fetched for this brand
    if (lastFetchedBrandId === brandId) return
    
    const abortController = new AbortController()
    
    const fetchInsights = async () => {
      if (!brandId || !currentWorkspace?.account_id) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(
          `/api/reports/${brandId}/data?period=30d`,
          { credentials: 'include', signal: abortController.signal }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights data')
        }
        
        const data = await response.json()
        
        // Transform API data into insights
        const generatedInsights: Insight[] = []
        
        // Get primary brand stats - prefer latest timeseries data for consistency with chart
        const primaryStats = data.stats?.[0]
        const primaryTimeseries = (data.timeseries || [])
          .filter((t: any) => t.is_primary)
          .sort((a: any, b: any) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())
        const latestData = primaryTimeseries[0]
        
        // Use latest timeseries values if available, falling back to aggregated stats
        const currentLviScore = latestData?.lvi_score ?? primaryStats?.lvi_score
        const currentMentionRate = latestData?.mention_rate ?? (primaryStats?.mention_rate * 100)
        const currentSentiment = latestData?.avg_sentiment ?? primaryStats?.avg_sentiment
        
        // Calculate LVI change from timeseries if we have enough data points
        let lviChange = 0
        if (primaryTimeseries.length >= 2) {
          const previousLvi = primaryTimeseries[1]?.lvi_score || 0
          if (previousLvi > 0 && currentLviScore) {
            lviChange = ((currentLviScore - previousLvi) / previousLvi) * 100
          }
        } else {
          lviChange = primaryStats?.lvi_change || 0
        }
        
        // Add LVI insight if we have data
        if (currentLviScore) {
          generatedInsights.push({
            id: 'lvi-score',
            type: lviChange > 0 ? 'success' : 'action',
            priority: 'high',
            category: terminology.position,
            title: lviChange > 0 ? 'Strong LVI Performance' : 'LVI Score Needs Attention',
            description: `Your ${terminology.entityName} achieved ${currentLviScore.toFixed(1)} LVI score${lviChange !== 0 ? ` with ${lviChange > 0 ? 'a' : 'a'} ${Math.abs(lviChange).toFixed(1)}% ${lviChange > 0 ? 'improvement' : 'decrease'} in visibility` : ''}.`,
            impact: lviChange !== 0 ? `${lviChange > 0 ? '+' : ''}${lviChange.toFixed(1)}%` : 'Current score',
            metric: {
              value: currentLviScore.toFixed(1),
              change: lviChange !== 0 ? `${lviChange > 0 ? '+' : ''}${lviChange.toFixed(1)}%` : '—',
              positive: lviChange >= 0
            }
          })
        }
        
        // Add mention rate insight
        if (currentMentionRate !== undefined && currentMentionRate !== null) {
          // Note: latestData.mention_rate is already a percentage (0-100), 
          // but primaryStats.mention_rate is a decimal (0-1), so we normalize above
          const mentionRateValue = currentMentionRate
          generatedInsights.push({
            id: 'mention-rate',
            type: mentionRateValue > 60 ? 'success' : mentionRateValue > 40 ? 'action' : 'warning',
            priority: mentionRateValue > 60 ? 'medium' : 'high',
            category: 'Visibility',
            title: mentionRateValue > 60 ? 'Excellent Mention Rate' : mentionRateValue > 40 ? 'Good Mention Rate' : 'Low Mention Rate',
            description: `Your ${terminology.entityName} appears in ${mentionRateValue.toFixed(1)}% of relevant AI responses${mentionRateValue > 60 ? ', significantly outperforming industry averages' : mentionRateValue > 40 ? '. There is room for improvement' : '. Focus on content optimization to increase visibility'}.`,
            impact: mentionRateValue > 60 ? 'Leading performance' : mentionRateValue > 40 ? 'Average performance' : 'Below average',
            metric: {
              value: `${mentionRateValue.toFixed(1)}%`,
              change: '—',
              positive: mentionRateValue > 50
            }
          })
        }
        
        // Add sentiment insight - use currentSentiment derived from timeseries
        if (currentSentiment !== undefined && currentSentiment !== null) {
          const sentiment = currentSentiment
          const sentimentScore = ((sentiment + 1) / 2) * 10 // Convert -1 to 1 scale to 0-10
          generatedInsights.push({
            id: 'sentiment',
            type: sentiment > 0.3 ? 'success' : sentiment > 0 ? 'action' : 'warning',
            priority: 'medium',
            category: `${terminology.entityName.charAt(0).toUpperCase() + terminology.entityName.slice(1)} Sentiment`,
            title: sentiment > 0.3 ? 'Excellent Sentiment Score' : sentiment > 0 ? 'Positive Sentiment' : 'Negative Sentiment Detected',
            description: `Average sentiment of ${sentimentScore.toFixed(1)}/10 across all mentions${sentiment > 0.3 ? ', with strong positive perception' : sentiment > 0 ? '. Monitor for improvement opportunities' : '. Immediate attention recommended'}.`,
            impact: sentiment > 0.3 ? 'Very positive' : sentiment > 0 ? 'Slightly positive' : 'Needs improvement',
            metric: {
              value: sentimentScore.toFixed(1),
              change: '—',
              positive: sentiment > 0
            }
          })
        }
        
        // Add opportunity insights from prompts
        const opportunities = data.prompts?.opportunities || []
        opportunities.slice(0, 2).forEach((opp: any, idx: number) => {
          generatedInsights.push({
            id: `opportunity-${idx}`,
            type: 'opportunity',
            priority: 'high',
            category: 'Content Opportunity',
            title: `Expand in "${opp.prompt_text?.substring(0, 50) || 'Query'}"...`,
            description: `This prompt shows ${opp.opportunity_score}% opportunity score with ${opp.competitor_mention_count || 0} ${terminology.competitor} mentions but zero ${terminology.entityName} mentions. High potential for visibility gain.`,
            impact: `${opp.opportunity_score}% opportunity`,
            metric: {
              value: `${opp.opportunity_score}%`,
              change: '—',
              positive: true
            }
          })
        })
        
        // Add threat insights from prompts
        const threats = data.prompts?.threats || []
        threats.slice(0, 1).forEach((threat: any, idx: number) => {
          const avgSentiment = threat.primary_avg_sentiment || 0
          const sentimentScore = ((avgSentiment + 1) / 2) * 10
          generatedInsights.push({
            id: `threat-${idx}`,
            type: 'warning',
            priority: 'high',
            category: `${terminology.entityName.charAt(0).toUpperCase() + terminology.entityName.slice(1)} Perception`,
            title: 'Negative Sentiment Alert',
            description: `Prompt "${threat.prompt_text?.substring(0, 50) || 'Query'}..." shows ${sentimentScore.toFixed(1)}/10 sentiment. Review and address ${terminology.audience} concerns.`,
            impact: 'Sentiment issue',
            metric: {
              value: sentimentScore.toFixed(1),
              change: '—',
              positive: false
            }
          })
        })
        
        // Add strength insights from top performing prompts
        const strengths = data.prompts?.strengths || []
        strengths.slice(0, 1).forEach((strength: any, idx: number) => {
          const avgSentiment = strength.primary_avg_sentiment || 0
          const sentimentScore = ((avgSentiment + 1) / 2) * 10
          generatedInsights.push({
            id: `strength-${idx}`,
            type: 'success',
            priority: 'medium',
            category: 'Content Success',
            title: 'Strong Performance Area',
            description: `Excellent ${sentimentScore.toFixed(1)}/10 sentiment with ${strength.primary_mention_count} mentions in "${strength.prompt_text?.substring(0, 40) || 'Query'}...". Replicate this success.`,
            impact: 'High engagement',
            metric: {
              value: `${strength.primary_mention_count}`,
              change: '—',
              positive: true
            }
          })
        })
        
        // Add ranking insight if available
        if (data.rankings && data.rankings.length > 0) {
          const primaryRanking = data.rankings.find((r: any) => r.is_primary_brand)
          if (primaryRanking) {
            const sovValue = primaryRanking.share_of_voice ?? primaryRanking.gsov ?? 0
            generatedInsights.push({
              id: 'ranking',
              type: primaryRanking.rank_position <= 3 ? 'success' : 'action',
              priority: primaryRanking.rank_position <= 3 ? 'medium' : 'high',
              category: 'Competitive Position',
              title: primaryRanking.rank_position <= 3 ? `Ranked #${primaryRanking.rank_position}` : `${terminology.position.charAt(0).toUpperCase() + terminology.position.slice(1)} #${primaryRanking.rank_position}`,
              description: `You hold position #${primaryRanking.rank_position} with ${sovValue.toFixed(1)}% gSOV${primaryRanking.rank_position <= 3 ? ', maintaining a leading position' : `. Focus on differentiation to climb rankings against ${terminology.competitorPlural}`}.`,
              impact: primaryRanking.rank_position <= 3 ? 'Leading position' : 'Room for growth',
              metric: {
                value: `#${primaryRanking.rank_position}`,
                change: `${sovValue.toFixed(1)}% gSOV`,
                positive: primaryRanking.rank_position <= 3
              }
            })
          }
        }
        
        // Check if request was aborted before setting state
        if (abortController.signal.aborted) return
        
        setInsights(generatedInsights)
        setLastFetchedBrandId(brandId)
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Error fetching insights:', err)
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load insights')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchInsights()
    
    // Cleanup: abort any in-flight requests when brand changes or component unmounts
    return () => abortController.abort()
  }, [brandId, currentWorkspace, lastFetchedBrandId])
  
  // Group insights by priority
  const highPriorityInsights = insights.filter(i => i.priority === 'high')
  const otherInsights = insights.filter(i => i.priority !== 'high')

  return (
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      {/* Header - Black background with white text */}
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-6">
        <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
          <Lightbulb className="h-5 w-5 text-white" />
          Insights & Recommendations
        </CardTitle>
        <CardDescription className="text-gray-300 font-light">
          AI-powered strategic recommendations based on your performance data
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 mb-6">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-gray-700 mt-4">Generating insights...</p>
            <p className="text-xs text-gray-500 mt-1">Analyzing performance and identifying opportunities</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : insights.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Your insights will appear here soon.</p>
            <p className="text-xs text-gray-500 mt-1">Run a run to generate insights and recommendations.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* High Priority Insights */}
            {highPriorityInsights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#FF760D]" />
                  <h3 className="text-sm font-semibold text-gray-900">High Priority Actions</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {highPriorityInsights.map((insight) => {
                    const Icon = getInsightIcon(insight.type)
                    const colors = getInsightColor(insight.type)
                    
                    return (
                      <Card 
                        key={insight.id} 
                        className={`border ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                              <Icon className={`h-5 w-5 ${colors.icon}`} />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-[#FF760D] transition-colors" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(insight.priority)}
                              <span className="text-xs text-gray-500">{insight.category}</span>
                            </div>
                            
                            <h4 className="text-base font-semibold text-gray-900 leading-tight">
                              {insight.title}
                            </h4>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {insight.description}
                            </p>
                            
                            {insight.metric && (
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Impact</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {insight.metric.value}
                                  </span>
                                  <span className={`text-xs font-medium ${
                                    insight.metric.positive ? 'text-[#FF760D]' : 'text-gray-400'
                                  }`}>
                                    {insight.metric.change}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Other Insights */}
            {otherInsights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Additional Opportunities</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherInsights.map((insight) => {
                    const Icon = getInsightIcon(insight.type)
                    const colors = getInsightColor(insight.type)
                    
                    return (
                      <Card 
                        key={insight.id} 
                        className={`border ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                              <Icon className={`h-5 w-5 ${colors.icon}`} />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(insight.priority)}
                              <span className="text-xs text-gray-500">{insight.category}</span>
                            </div>
                            
                            <h4 className="text-base font-semibold text-gray-900 leading-tight">
                              {insight.title}
                            </h4>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {insight.description}
                            </p>
                            
                            {insight.metric && (
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Metric</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {insight.metric.value}
                                  </span>
                                  <span className={`text-xs font-medium ${
                                    insight.metric.positive ? 'text-[#FF760D]' : 'text-gray-400'
                                  }`}>
                                    {insight.metric.change}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
