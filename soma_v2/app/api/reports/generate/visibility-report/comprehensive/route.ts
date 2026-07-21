import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const VisibilityReportRequestSchema = z.object({
  brand_id: z.string().uuid(),
  workspace_id: z.string().uuid().optional(),
  include_competitors: z.boolean().optional().default(true),
  include_trends: z.boolean().optional().default(true),
  time_period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  report_type: z.enum(['preview', 'full']).optional().default('full')
})

interface VisibilityReport {
  brand_info: {
    id: string
    name: string
    industry: string
    primary_domain: string
  }
  ldi_data: {
    overall_score: number
    provider_breakdown: { [provider: string]: number }
    trend_analysis: {
      current_score: number
      previous_score: number
      change_percentage: number
      trend_direction: 'up' | 'down' | 'stable'
    }
  }
  mention_analysis: {
    total_mentions: number
    by_provider: { [provider: string]: number }
    by_sentiment: {
      positive: number
      neutral: number
      negative: number
    }
    top_queries: Array<{
      query: string
      mentions: number
      sentiment: string
      providers: string[]
    }>
  }
  competitor_analysis: {
    direct_competitors: Array<{
      name: string
      mention_count: number
      visibility_score: number
      sentiment_score: number
    }>
    market_share: {
      brand_share: number
      competitor_share: number
      unattributed_share: number
    }
  }
  content_insights: {
    citation_sources: Array<{
      domain: string
      citation_count: number
      sentiment: string
    }>
    content_gaps: string[]
    optimization_opportunities: Array<{
      priority: 'high' | 'medium' | 'low'
      opportunity: string
      description: string
      impact: string
    }>
  }
  actionable_recommendations: Array<{
    category: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
    impact: string
  }>
  report_metadata: {
    generated_at: string
    data_period: string
    total_queries_analyzed: number
    providers_monitored: string[]
    cost_analysis: {
      total_cost: number
      cost_per_query: number
      cost_by_provider: { [provider: string]: number }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const validatedData = VisibilityReportRequestSchema.parse(body)

    // Check brand access
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        *,
        accounts!inner(
          account_users!inner(clerk_id, role)
        )
      `)
      .eq('id', validatedData.brand_id)
      .eq('accounts.account_users.clerk_id', currentUser.clerkUserId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 403 })
    }

    // Generate comprehensive visibility report
    const report = await generateComprehensiveReport(validatedData, brand, supabase)

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error generating visibility report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateComprehensiveReport(
  requestData: z.infer<typeof VisibilityReportRequestSchema>,
  brand: any,
  supabase: any
): Promise<VisibilityReport> {
  const { brand_id, time_period, include_competitors, include_trends } = requestData
  
  // Convert time period to days
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[time_period]
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get LLM query results for the time period
  const { data: queryResults } = await supabase
    .from('llm_query_results')
    .select('*')
    .eq('brand_id', brand_id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  // Get latest LDI snapshot
  const { data: ldiSnapshot } = await supabase
    .from('ldi_snapshots')
    .select('*')
    .eq('brand_id', brand_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get previous LDI for trend analysis
  const { data: previousLdiSnapshot } = await supabase
    .from('ldi_snapshots')
    .select('overall_score')
    .eq('brand_id', brand_id)
    .lt('created_at', ldiSnapshot?.created_at || new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Analyze query results
  const totalQueries = queryResults?.length || 0
  const mentionedQueries = queryResults?.filter((q: any) => q.brand_mentions.length > 0) || []
  const totalMentions = mentionedQueries.length

  // Provider breakdown
  const providerBreakdown: { [provider: string]: number } = {}
  const providerCosts: { [provider: string]: number } = {}
  let totalCost = 0

  queryResults?.forEach((result: any) => {
    if (!providerBreakdown[result.provider]) {
      providerBreakdown[result.provider] = 0
      providerCosts[result.provider] = 0
    }
    if (result.brand_mentions.length > 0) {
      providerBreakdown[result.provider]++
    }
    providerCosts[result.provider] += result.cost || 0
    totalCost += result.cost || 0
  })

  // Convert to percentages
  Object.keys(providerBreakdown).forEach(provider => {
    const providerTotal = queryResults?.filter((q: any) => q.provider === provider).length || 1
    providerBreakdown[provider] = Math.round((providerBreakdown[provider] / providerTotal) * 100)
  })

  // Sentiment analysis
  const sentimentBreakdown = {
    positive: queryResults?.filter((q: any) => q.sentiment === 'positive').length || 0,
    neutral: queryResults?.filter((q: any) => q.sentiment === 'neutral').length || 0,
    negative: queryResults?.filter((q: any) => q.sentiment === 'negative').length || 0
  }

  // Top queries analysis
  const queryFrequency: { [query: string]: any } = {}
  queryResults?.forEach((result: any) => {
    if (result.brand_mentions.length > 0) {
      if (!queryFrequency[result.query]) {
        queryFrequency[result.query] = {
          count: 0,
          sentiment: result.sentiment,
          providers: new Set()
        }
      }
      queryFrequency[result.query].count++
      queryFrequency[result.query].providers.add(result.provider)
    }
  })

  const topQueries: any = Object.entries(queryFrequency)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([query, data]) => ({
      query,
      mentions: data.count,
      sentiment: data.sentiment,
      providers: Array.from(data.providers)
    }))

  // Competitor analysis
  let competitorAnalysis: any = {
    direct_competitors: [] as any[],
    market_share: {
      brand_share: 0,
      competitor_share: 0,
      unattributed_share: 100
    }
  }

  if (include_competitors) {
    const competitorMentions: { [competitor: string]: any } = {}
    queryResults?.forEach((result: any) => {
      result.competitor_mentions.forEach((competitor: string) => {
        if (!competitorMentions[competitor]) {
          competitorMentions[competitor] = {
            mention_count: 0,
            total_sentiment_score: 0,
            sentiment_count: 0
          }
        }
        competitorMentions[competitor].mention_count++
        
        // Calculate sentiment score
        const sentimentScore = result.sentiment === 'positive' ? 1 : 
                             result.sentiment === 'negative' ? -1 : 0
        competitorMentions[competitor].total_sentiment_score += sentimentScore
        competitorMentions[competitor].sentiment_count++
      })
    })

    const directCompetitors = Object.entries(competitorMentions)
      .map(([name, data]) => ({
        name,
        mention_count: data.mention_count,
        visibility_score: totalQueries > 0 ? Math.round((data.mention_count / totalQueries) * 100) : 0,
        sentiment_score: data.sentiment_count > 0 ? 
          Math.round((data.total_sentiment_score / data.sentiment_count) * 100) : 0
      }))
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 5)

    const brandShare = totalQueries > 0 ? Math.round((totalMentions / totalQueries) * 100) : 0
    const competitorShare = Math.round(directCompetitors.reduce((sum, comp) => sum + comp.visibility_score, 0) / directCompetitors.length)
    
    competitorAnalysis = {
      direct_competitors: directCompetitors,
      market_share: {
        brand_share: brandShare,
        competitor_share: competitorShare,
        unattributed_share: Math.max(0, 100 - brandShare - competitorShare)
      }
    }
  }

  // Citation analysis
  const citationDomains: { [domain: string]: any } = {}
  queryResults?.forEach((result: any) => {
    if (result.brand_mentions.length > 0) {
      result.citations.forEach((citation: string) => {
        try {
          const url = new URL(citation)
          const domain = url.hostname
          if (!citationDomains[domain]) {
            citationDomains[domain] = {
              count: 0,
              sentiment_scores: []
            }
          }
          citationDomains[domain].count++
          const sentimentScore = result.sentiment === 'positive' ? 1 : 
                               result.sentiment === 'negative' ? -1 : 0
          citationDomains[domain].sentiment_scores.push(sentimentScore)
        } catch (e) {
          // Invalid URL, skip
        }
      })
    }
  })

  const citationSources = Object.entries(citationDomains)
    .map(([domain, data]) => ({
      domain,
      citation_count: data.count,
      sentiment: data.sentiment_scores.reduce((sum: number, score: number) => sum + score, 0) > 0 ? 'positive' : 
                 data.sentiment_scores.reduce((sum: number, score: number) => sum + score, 0) < 0 ? 'negative' : 'neutral'
    }))
    .sort((a, b) => b.citation_count - a.citation_count)
    .slice(0, 10)

  // Generate recommendations
  const recommendations = generateRecommendations(
    ldiSnapshot?.overall_score || 0,
    providerBreakdown,
    sentimentBreakdown,
    competitorAnalysis,
    citationSources
  )

  // Content gaps and opportunities
  const contentGaps = identifyContentGaps(queryResults || [], brand.name)
  const optimizationOpportunities = identifyOptimizationOpportunities(
    ldiSnapshot?.overall_score || 0,
    providerBreakdown,
    competitorAnalysis
  )

  // Trend analysis
  let trendAnalysis = {
    current_score: ldiSnapshot?.overall_score || 0,
    previous_score: 0,
    change_percentage: 0,
    trend_direction: 'stable' as 'up' | 'down' | 'stable'
  }

  if (include_trends && previousLdiSnapshot) {
    const currentScore = ldiSnapshot?.overall_score || 0
    const previousScore = previousLdiSnapshot.overall_score
    const changePercentage = previousScore > 0 ? 
      Math.round(((currentScore - previousScore) / previousScore) * 100) : 0
    
    trendAnalysis = {
      current_score: currentScore,
      previous_score: previousScore,
      change_percentage: Math.abs(changePercentage),
      trend_direction: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable'
    }
  }

  return {
    brand_info: {
      id: brand.id,
      name: brand.name,
      industry: brand.industry || 'Technology',
      primary_domain: brand.primary_domain || ''
    },
    ldi_data: {
      overall_score: ldiSnapshot?.overall_score || 0,
      provider_breakdown: ldiSnapshot?.provider_scores || providerBreakdown,
      trend_analysis: trendAnalysis
    },
    mention_analysis: {
      total_mentions: totalMentions,
      by_provider: Object.fromEntries(
        Object.entries(providerBreakdown).map(([provider, percentage]) => [
          provider, 
          Math.round((percentage / 100) * (queryResults?.filter((q: any) => q.provider === provider && q.brand_mentions.length > 0).length || 0))
        ])
      ),
      by_sentiment: sentimentBreakdown,
      top_queries: topQueries
    },
    competitor_analysis: competitorAnalysis,
    content_insights: {
      citation_sources: citationSources,
      content_gaps: contentGaps,
      optimization_opportunities: optimizationOpportunities
    },
    actionable_recommendations: recommendations,
    report_metadata: {
      generated_at: new Date().toISOString(),
      data_period: `${days} days`,
      total_queries_analyzed: totalQueries,
      providers_monitored: Object.keys(providerBreakdown),
      cost_analysis: {
        total_cost: Math.round(totalCost * 100) / 100,
        cost_per_query: totalQueries > 0 ? Math.round((totalCost / totalQueries) * 10000) / 10000 : 0,
        cost_by_provider: Object.fromEntries(
          Object.entries(providerCosts).map(([provider, cost]) => [
            provider, 
            Math.round(cost * 10000) / 10000
          ])
        )
      }
    }
  }
}

function generateRecommendations(
  overallScore: number,
  providerBreakdown: { [provider: string]: number },
  sentimentBreakdown: { positive: number, neutral: number, negative: number },
  competitorAnalysis: any,
  citationSources: any[]
): Array<{
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  impact: string
}> {
  const recommendations = []

  // LDI score recommendations
  if (overallScore < 30) {
    recommendations.push({
      category: 'Visibility',
      title: 'Improve Overall AI Discoverability',
      description: 'Your brand has low visibility across AI platforms. Focus on creating comprehensive, AI-friendly content and optimizing existing content for better discoverability.',
      priority: 'high' as const,
      effort: 'high' as const,
      impact: 'Increase overall LDI score by 40-60%'
    })
  } else if (overallScore < 60) {
    recommendations.push({
      category: 'Visibility',
      title: 'Optimize Content for AI Platforms',
      description: 'Your brand has moderate visibility. Focus on specific content optimization and structured data implementation to improve AI recognition.',
      priority: 'medium' as const,
      effort: 'medium' as const,
      impact: 'Increase LDI score by 20-30%'
    })
  }

  // Provider-specific recommendations
  const lowPerformingProviders = Object.entries(providerBreakdown)
    .filter(([_, score]) => score < 20)
    .map(([provider, _]) => provider)

  if (lowPerformingProviders.length > 0) {
    recommendations.push({
      category: 'Platform Optimization',
      title: `Improve Performance on ${lowPerformingProviders.join(', ')}`,
      description: `Your brand has low visibility on these AI platforms. Consider platform-specific content optimization strategies.`,
      priority: 'medium' as const,
      effort: 'medium' as const,
      impact: 'Increase visibility on underperforming platforms by 15-25%'
    })
  }

  // Sentiment recommendations
  const totalSentiment = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative
  if (totalSentiment > 0) {
    const negativePercentage = (sentimentBreakdown.negative / totalSentiment) * 100
    if (negativePercentage > 30) {
      recommendations.push({
        category: 'Reputation Management',
        title: 'Address Negative Sentiment',
        description: 'A significant portion of AI responses about your brand have negative sentiment. Focus on reputation management and positive content creation.',
        priority: 'high' as const,
        effort: 'high' as const,
        impact: 'Improve sentiment score by 20-40%'
      })
    }
  }

  // Competitor recommendations
  if (competitorAnalysis.market_share.competitor_share > competitorAnalysis.market_share.brand_share) {
    recommendations.push({
      category: 'Competitive Strategy',
      title: 'Increase Market Share in AI Responses',
      description: 'Competitors have higher visibility in AI responses. Analyze their content strategy and create competitive differentiation content.',
      priority: 'high' as const,
      effort: 'medium' as const,
      impact: 'Increase relative market share by 10-20%'
    })
  }

  // Citation recommendations
  if (citationSources.length < 3) {
    recommendations.push({
      category: 'Authority Building',
      title: 'Increase Citation Sources',
      description: 'Your brand is cited from few sources. Focus on building authority through PR, thought leadership, and industry partnerships.',
      priority: 'medium' as const,
      effort: 'high' as const,
      impact: 'Increase citation diversity and authority signals'
    })
  }

  return recommendations
}

function identifyContentGaps(queryResults: any[], brandName: string): string[] {
  const gaps = []
  
  // Analyze queries where brand is not mentioned
  const missedQueries = queryResults.filter((q: any) => q.brand_mentions.length === 0)
  const commonMissedTopics = new Set<string>()

  missedQueries.forEach(query => {
    const lowerQuery = query.query.toLowerCase()
    if (lowerQuery.includes('alternative') || lowerQuery.includes('vs') || lowerQuery.includes('compare')) {
      commonMissedTopics.add('Competitive comparison content')
    }
    if (lowerQuery.includes('how to') || lowerQuery.includes('guide')) {
      commonMissedTopics.add('Educational and how-to content')
    }
    if (lowerQuery.includes('review') || lowerQuery.includes('rating')) {
      commonMissedTopics.add('Review and testimonial content')
    }
    if (lowerQuery.includes('pricing') || lowerQuery.includes('cost')) {
      commonMissedTopics.add('Transparent pricing information')
    }
  })

  return Array.from(commonMissedTopics).slice(0, 5)
}

function identifyOptimizationOpportunities(
  overallScore: number,
  providerBreakdown: { [provider: string]: number },
  competitorAnalysis: any
): Array<{
  priority: 'high' | 'medium' | 'low'
  opportunity: string
  description: string
  impact: string
}> {
  const opportunities = []

  // Low-hanging fruit opportunities
  const underperformingProviders = Object.entries(providerBreakdown)
    .filter(([_, score]) => score < 50)
    .sort(([, a], [, b]) => b - a)

  if (underperformingProviders.length > 0) {
    opportunities.push({
      priority: 'high' as const,
      opportunity: `Optimize for ${underperformingProviders[0][0]}`,
      description: `This provider shows potential for quick wins with targeted optimization efforts.`,
      impact: 'Quick 15-25% improvement in platform-specific visibility'
    })
  }

  // Competitive opportunities
  if (competitorAnalysis.direct_competitors.length > 0) {
    const topCompetitor = competitorAnalysis.direct_competitors[0]
    opportunities.push({
      priority: 'medium' as const,
      opportunity: `Target ${topCompetitor.name}'s Keywords`,
      description: `Your main competitor has ${topCompetitor.mention_count} mentions. Analyze their content strategy for opportunities.`,
      impact: 'Capture 10-15% of competitor mentions'
    })
  }

  // Overall score opportunities
  if (overallScore < 70) {
    opportunities.push({
      priority: 'medium' as const,
      opportunity: 'Implement Structured Data',
      description: 'Add comprehensive structured data markup to improve AI understanding of your content.',
      impact: 'Increase overall discoverability by 20-30%'
    })
  }

  return opportunities
}