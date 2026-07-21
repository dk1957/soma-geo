/**
 * Smart Insights Generator
 * 
 * Generates contextual, data-driven insights based on actual report data.
 * Adapts language and focus based on entity type (company, personality, campaign, etc.)
 */

import { 
  getEntityTerminology, 
  isPoliticalEntity, 
  isCommercialEntity,
  type EntityType,
  type EntityTerminology
} from './entity-language'

// Types for the data we receive
interface BrandRanking {
  brand: string
  position: number
  positionChange: number
  visibility: number
  visibilityChange: number
  sentiment: number
  isYourBrand?: boolean
}

interface PromptData {
  prompt_text?: string
  promptText?: string
  prompt_category?: string
  promptCategory?: string
  mentionRate?: number
  isOpportunity?: boolean
  isThreat?: boolean
  opportunity_score?: number
  competitor_mention_count?: number
  primary_mention_count?: number
}

interface SourceData {
  domain: string
  type: string
  usedPercentage: number
  totalCitations?: number
  brandsCiting?: string[]
}

interface TopicData {
  topic: string
  brand: string
  value: number
  sentiment: number
  relevance: number
}

interface InsightInput {
  entityType: EntityType
  brandName: string
  yourBrandRanking?: BrandRanking
  allCompetitors: BrandRanking[]
  topPerformingPrompts: PromptData[]
  underperformingPrompts: PromptData[]
  opportunities: PromptData[]
  threats: PromptData[]
  sources: SourceData[]
  topicMatrix?: TopicData[]
  topCompetitor?: BrandRanking
  competitorsThreatening: BrandRanking[]
}

export interface SmartInsight {
  category: 'performance' | 'competitive' | 'content' | 'opportunity' | 'topic' | 'perception'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metricValue?: string | number
  metric?: string
  dataSource: string // What data this insight is based on
}

export interface SmartRecommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actions: string[]
  dataSource: string // What data this recommendation is based on
}

/**
 * Generate smart, contextual insights based on actual data patterns
 */
export function generateSmartInsights(input: InsightInput): SmartInsight[] {
  const { 
    entityType, 
    brandName,
    yourBrandRanking,
    allCompetitors,
    topPerformingPrompts,
    underperformingPrompts,
    opportunities,
    threats,
    sources,
    topicMatrix,
    topCompetitor,
    competitorsThreatening
  } = input
  
  const t = getEntityTerminology(entityType)
  const isPolitical = isPoliticalEntity(entityType)
  const isCommercial = isCommercialEntity(entityType)
  
  const insights: SmartInsight[] = []
  
  // 1. POSITION & PERFORMANCE INSIGHT (based on actual ranking)
  if (yourBrandRanking) {
    insights.push(generatePositionInsight(yourBrandRanking, t, isPolitical, brandName))
  }
  
  // 2. COMPETITIVE LANDSCAPE INSIGHT (based on actual competitor data)
  if (allCompetitors.length > 0 && yourBrandRanking) {
    insights.push(generateCompetitiveInsight(
      yourBrandRanking, 
      allCompetitors, 
      topCompetitor, 
      competitorsThreatening, 
      t, 
      isPolitical
    ))
  }
  
  // 3. TOPIC/THEME INSIGHT (based on actual topic matrix data)
  if (topicMatrix && topicMatrix.length > 0) {
    const topicInsight = generateTopicInsight(topicMatrix, brandName, t, isPolitical)
    if (topicInsight) insights.push(topicInsight)
  }
  
  // 4. OPPORTUNITY INSIGHT (based on actual gaps, not revenue estimates)
  if (opportunities.length > 0 || underperformingPrompts.length > 0) {
    insights.push(generateOpportunityInsight(
      opportunities, 
      underperformingPrompts, 
      threats,
      t, 
      isPolitical,
      isCommercial
    ))
  }
  
  // 5. SOURCE AUTHORITY INSIGHT (based on actual citation sources)
  const sourceInsight = generateSourceInsight(sources, t, isPolitical)
  if (sourceInsight) insights.push(sourceInsight)
  
  // 6. PERCEPTION/SENTIMENT INSIGHT (based on actual sentiment data)
  if (yourBrandRanking && yourBrandRanking.sentiment > 0) {
    const sentimentInsight = generateSentimentInsight(yourBrandRanking, topCompetitor, t, isPolitical)
    if (sentimentInsight) insights.push(sentimentInsight)
  }
  
  return insights.slice(0, 4) // Return top 4 most relevant insights
}

function generatePositionInsight(
  ranking: BrandRanking, 
  t: EntityTerminology, 
  isPolitical: boolean,
  brandName: string
): SmartInsight {
  const isLeading = ranking.position === 1
  const isTop3 = ranking.position <= 3
  const isImproving = ranking.positionChange < 0
  const isDecling = ranking.positionChange > 0
  
  let title: string
  let description: string
  let impact: 'high' | 'medium' | 'low'
  
  if (isLeading) {
    title = isPolitical ? '🏆 Leading AI Visibility' : '🏆 Market Leader Position'
    description = `${brandName} ranks #1 with ${ranking.visibility?.toFixed(1)}% share of AI mentions. ` +
      `${isImproving ? 'Momentum is strong - you\'ve widened your lead.' : 'Maintain vigilance as competitors can close the gap quickly.'}`
    impact = 'high'
  } else if (isTop3) {
    title = isPolitical ? 'Strong Positioning in AI Responses' : 'Competitive Position'
    description = `Ranking #${ranking.position} with ${ranking.visibility?.toFixed(1)}% visibility. ` +
      `${isImproving 
        ? `Moving up ${Math.abs(ranking.positionChange)} position${Math.abs(ranking.positionChange) > 1 ? 's' : ''} - your ${t.strategyType} is gaining traction.`
        : isDecling 
          ? `Slipped ${ranking.positionChange} position${ranking.positionChange > 1 ? 's' : ''} - action needed to regain momentum.`
          : `Stable position but opportunities exist to break into the top spot.`
      }`
    impact = isImproving ? 'medium' : isDecling ? 'high' : 'medium'
  } else {
    title = isPolitical ? '📈 Visibility Growth Opportunity' : '📈 Ranking Improvement Needed'
    description = `Currently at #${ranking.position} with ${ranking.visibility?.toFixed(1)}% visibility. ` +
      `${isPolitical 
        ? 'Increasing presence in AI conversations will help reach more undecided voters.'
        : `Significant opportunity to capture more ${t.marketShare} from higher-ranked ${t.competitorPlural}.`
      }`
    impact = 'high'
  }
  
  return {
    category: 'performance',
    title,
    description,
    impact,
    metricValue: `#${ranking.position}`,
    metric: isPolitical ? 'AI Visibility Rank' : 'Industry Rank',
    dataSource: 'industry rankings'
  }
}

function generateCompetitiveInsight(
  yourBrand: BrandRanking,
  competitors: BrandRanking[],
  topCompetitor: BrandRanking | undefined,
  threatening: BrandRanking[],
  t: EntityTerminology,
  isPolitical: boolean
): SmartInsight {
  const visibilityGap = topCompetitor 
    ? (yourBrand.visibility || 0) - (topCompetitor.visibility || 0)
    : 0
  
  const isThreatened = threatening.length > 0
  const isLeading = visibilityGap > 0
  
  let title: string
  let description: string
  
  if (isThreatened) {
    const threatNames = threatening.slice(0, 2).map(c => c.brand).join(' and ')
    title = `⚠️ ${t.competitorPlural.charAt(0).toUpperCase() + t.competitorPlural.slice(1)} Gaining Ground`
    description = `${threatNames} ${threatening.length > 1 ? 'are' : 'is'} showing rapid visibility growth (${
      threatening[0].visibilityChange > 0 ? '+' : ''}${threatening[0].visibilityChange.toFixed(1)}% change). ` +
      `${isPolitical 
        ? 'Their increased presence in AI responses means more voters seeing their message first.'
        : `Each point they gain could translate to ${t.audience} choosing them over you.`
      }`
  } else if (isLeading && topCompetitor) {
    title = `Leading ${topCompetitor.brand}`
    description = `You lead by ${visibilityGap.toFixed(1)} percentage points in AI visibility. ` +
      `${topCompetitor.brand} holds ${topCompetitor.visibility?.toFixed(1)}% share. ` +
      `${isPolitical 
        ? 'Maintain your advantage by staying active across key topics.'
        : 'Continue content investment to widen the gap.'
      }`
  } else if (topCompetitor) {
    title = isPolitical ? `Trailing ${topCompetitor.brand}` : `Gap to Close with ${topCompetitor.brand}`
    description = `${topCompetitor.brand} leads with ${topCompetitor.visibility?.toFixed(1)}% visibility vs your ${yourBrand.visibility?.toFixed(1)}%. ` +
      `${isPolitical 
        ? 'Increasing your AI presence on key policy topics can shift the narrative.'
        : `Targeted content on high-value topics can help close this ${Math.abs(visibilityGap).toFixed(1)}pp gap.`
      }`
  } else {
    title = 'Competitive Landscape Analysis'
    description = `Monitoring ${competitors.length} ${t.competitorPlural} in your space. Stay ahead by maintaining strong content presence.`
  }
  
  return {
    category: 'competitive',
    title,
    description,
    impact: isThreatened ? 'high' : isLeading ? 'medium' : 'high',
    metricValue: isThreatened ? `${threatening.length}` : `${Math.abs(visibilityGap).toFixed(1)}%`,
    metric: isThreatened ? 'threats detected' : (isLeading ? 'lead' : 'gap'),
    dataSource: 'competitor analysis'
  }
}

function generateTopicInsight(
  topicMatrix: TopicData[],
  brandName: string,
  t: EntityTerminology,
  isPolitical: boolean
): SmartInsight | null {
  // Find topics where this brand appears
  const brandTopics = topicMatrix.filter(tm => 
    tm.brand.toLowerCase() === brandName.toLowerCase() && tm.value > 0
  )
  
  if (brandTopics.length === 0) return null
  
  // Sort by value (visibility) to find strongest and weakest topics
  const sortedTopics = [...brandTopics].sort((a, b) => b.value - a.value)
  const topTopics = sortedTopics.slice(0, 3)
  const weakTopics = sortedTopics.filter(t => t.value < 0.3).slice(0, 3)
  
  // Calculate average sentiment across topics
  const avgSentiment = brandTopics.reduce((sum, t) => sum + t.sentiment, 0) / brandTopics.length
  
  let title: string
  let description: string
  
  if (topTopics.length > 0 && weakTopics.length > 0) {
    const strongTopicNames = topTopics.map(t => t.topic).join(', ')
    const weakTopicNames = weakTopics.map(t => t.topic).join(', ')
    
    title = isPolitical ? '📊 Topic Strength Analysis' : '📊 Theme Performance Map'
    description = `Strong presence on ${strongTopicNames}. ` +
      `Opportunity to improve visibility on ${weakTopicNames}. ` +
      `${isPolitical 
        ? 'Focusing messaging on weaker topics can expand your voter reach.'
        : `Expanding content coverage on these themes can capture additional ${t.audience}.`
      }`
  } else if (topTopics.length > 0) {
    const topicNames = topTopics.map(t => t.topic).join(', ')
    title = isPolitical ? '💪 Your Strongest Messages' : '💪 Your Content Strengths'
    description = `Dominant presence on ${topicNames}. ` +
      `${avgSentiment > 70 
        ? 'Positive sentiment suggests your messaging resonates well.'
        : 'Consider refining your messaging to improve perception.'
      }`
  } else {
    return null
  }
  
  return {
    category: 'topic',
    title,
    description,
    impact: weakTopics.length > 2 ? 'high' : 'medium',
    metricValue: brandTopics.length,
    metric: isPolitical ? 'topics covered' : 'themes tracked',
    dataSource: 'topic analysis'
  }
}

function generateOpportunityInsight(
  opportunities: PromptData[],
  underperforming: PromptData[],
  threats: PromptData[],
  t: EntityTerminology,
  isPolitical: boolean,
  isCommercial: boolean
): SmartInsight {
  const totalGaps = opportunities.length + underperforming.length
  
  // Extract actual prompt categories to make this contextual
  const categories = [...new Set([
    ...opportunities.map(o => o.prompt_category || o.promptCategory),
    ...underperforming.map(u => u.prompt_category || u.promptCategory)
  ])].filter(Boolean).slice(0, 3)
  
  const categoryList = categories.length > 0 
    ? categories.join(', ') 
    : isPolitical ? 'key policy areas' : 'high-intent search topics'
  
  let title: string
  let description: string
  
  if (isPolitical) {
    title = '🗳️ Visibility Gaps to Address'
    description = `${totalGaps} ${totalGaps === 1 ? 'query' : 'queries'} where ${t.competitorPlural} appear but you don't. ` +
      `These cover ${categoryList}. ` +
      `Each gap represents ${t.audience} who may never discover your positions.`
  } else if (isCommercial) {
    title = '🎯 Untapped Search Opportunities'
    description = `${totalGaps} high-relevance ${totalGaps === 1 ? 'query' : 'queries'} where you're not being recommended. ` +
      `Focus areas: ${categoryList}. ` +
      `${t.competitorPlural.charAt(0).toUpperCase() + t.competitorPlural.slice(1)} are capturing these ${t.audience}.`
  } else {
    title = '📍 Visibility Opportunities'
    description = `Found ${totalGaps} opportunities to increase your presence in AI responses. ` +
      `Related to ${categoryList}. Building content here will expand your reach.`
  }
  
  // Add threat context if significant
  if (threats.length >= 3) {
    description += ` Note: ${threats.length} areas where ${t.competitorPlural} consistently outrank you need attention.`
  }
  
  return {
    category: 'opportunity',
    title,
    description,
    impact: totalGaps > 5 ? 'high' : totalGaps > 2 ? 'medium' : 'low',
    metricValue: totalGaps,
    metric: 'visibility gaps',
    dataSource: 'prompt analysis'
  }
}

function generateSourceInsight(
  sources: SourceData[],
  t: EntityTerminology,
  isPolitical: boolean
): SmartInsight | null {
  if (sources.length === 0) return null
  
  // Categorize sources
  const newsSources = sources.filter(s => 
    s.type === 'news-media' || s.type === 'news' || s.type === 'News & Media'
  )
  const industrySources = sources.filter(s => 
    s.type === 'industry' || s.type === 'Industry Publication'
  )
  const ownedSources = sources.filter(s => s.type === 'your-brand')
  
  // Find top cited sources
  const topSources = [...sources]
    .sort((a, b) => b.usedPercentage - a.usedPercentage)
    .slice(0, 3)
  
  if (topSources.length === 0) return null
  
  const topSourceNames = topSources.map(s => s.domain).join(', ')
  const avgCitationRate = topSources.reduce((sum, s) => sum + s.usedPercentage, 0) / topSources.length
  
  let title: string
  let description: string
  
  if (ownedSources.length > 0 && ownedSources[0].usedPercentage > 20) {
    title = '✅ Strong Owned Media Citations'
    description = `Your content is cited ${ownedSources[0].usedPercentage.toFixed(1)}% of the time. ` +
      `${isPolitical 
        ? 'This strong presence means your messaging reaches voters directly.'
        : 'Strong self-citation indicates good content authority.'
      }`
  } else if (newsSources.length > 0) {
    title = '📰 News Media Influence'
    description = `Top cited sources: ${topSourceNames} (avg ${avgCitationRate.toFixed(1)}% citation rate). ` +
      `${isPolitical 
        ? 'Securing coverage from these outlets can significantly boost your AI visibility.'
        : 'Getting mentioned by these sources can elevate your authority with AI models.'
      }`
  } else {
    title = '📊 Citation Source Analysis'
    description = `AI models rely on ${topSourceNames} for information. ` +
      `Building presence on high-authority sources improves how AI represents ${isPolitical ? 'you' : `your ${t.entityName}`}.`
  }
  
  return {
    category: 'content',
    title,
    description,
    impact: ownedSources.length === 0 || ownedSources[0].usedPercentage < 10 ? 'high' : 'medium',
    metricValue: `${avgCitationRate.toFixed(0)}%`,
    metric: 'avg citation rate',
    dataSource: 'citation analysis'
  }
}

function generateSentimentInsight(
  yourBrand: BrandRanking,
  topCompetitor: BrandRanking | undefined,
  t: EntityTerminology,
  isPolitical: boolean
): SmartInsight | null {
  const sentiment = yourBrand.sentiment
  
  if (sentiment <= 0) return null
  
  const competitorSentiment = topCompetitor?.sentiment || 0
  const sentimentGap = sentiment - competitorSentiment
  
  let title: string
  let description: string
  let impact: 'high' | 'medium' | 'low'
  
  if (sentiment >= 80) {
    title = '💚 Strong Positive Perception'
    description = `Sentiment score of ${sentiment}/100 indicates AI models describe ${isPolitical ? 'you' : `your ${t.entityName}`} favorably. ` +
      `${sentimentGap > 10 && topCompetitor 
        ? `You lead ${topCompetitor.brand} by ${sentimentGap.toFixed(0)} points in perception.`
        : 'Maintain this positive narrative through consistent quality content.'
      }`
    impact = 'medium'
  } else if (sentiment >= 60) {
    title = isPolitical ? '📊 Mixed Public Perception' : '📊 Neutral Brand Perception'
    description = `Sentiment at ${sentiment}/100 - room for improvement. ` +
      `${isPolitical 
        ? 'Some AI responses may include critical or neutral language about your positions.'
        : 'AI models may be presenting balanced but not enthusiastic views.'
      } ` +
      `Targeted content addressing concerns can shift perception positive.`
    impact = 'medium'
  } else {
    title = isPolitical ? '⚠️ Perception Concerns' : '⚠️ Brand Sentiment Alert'
    description = `Sentiment score of ${sentiment}/100 suggests negative language in AI responses. ` +
      `${isPolitical 
        ? 'Voters using AI may encounter critical narratives. Proactive positive content is essential.'
        : `${t.audience} see less favorable descriptions. Address this to improve ${t.successMetric}.`
      }`
    impact = 'high'
  }
  
  return {
    category: 'perception',
    title,
    description,
    impact,
    metricValue: sentiment,
    metric: 'sentiment score',
    dataSource: 'sentiment analysis'
  }
}

/**
 * Generate smart, contextual recommendations based on actual data
 */
export function generateSmartRecommendations(input: InsightInput): SmartRecommendation[] {
  const { 
    entityType, 
    brandName,
    yourBrandRanking,
    allCompetitors,
    topPerformingPrompts,
    underperformingPrompts,
    opportunities,
    sources,
    topicMatrix,
    topCompetitor,
    competitorsThreatening
  } = input
  
  const t = getEntityTerminology(entityType)
  const isPolitical = isPoliticalEntity(entityType)
  
  const recommendations: SmartRecommendation[] = []
  
  // Extract high-value sources for publisher recommendations
  const highValueSources = sources
    .filter(s => s.type !== 'your-brand' && s.usedPercentage > 15)
    .sort((a, b) => b.usedPercentage - a.usedPercentage)
    .slice(0, 3)
  
  // 1. PUBLISH ON HIGH-AUTHORITY SOURCES (if we have publisher data)
  if (highValueSources.length > 0) {
    const sourceNames = highValueSources.map(s => s.domain).join(', ')
    recommendations.push({
      title: isPolitical ? '🚀 Secure Coverage on High-Authority Media' : '🚀 Get Published on High-Authority Sources',
      description: `${sourceNames} ${highValueSources.length > 1 ? 'are' : 'is'} cited ${highValueSources[0].usedPercentage.toFixed(0)}%+ of the time by AI models. ` +
        `${isPolitical 
          ? 'Coverage from these outlets significantly increases how AI represents your campaign.'
          : 'Articles on these platforms carry weight with AI systems, directly improving your rankings.'
        }`,
      impact: 'high',
      effort: 'medium',
      actions: [
        `Target ${sourceNames} for ${isPolitical ? 'news coverage, op-eds, or interviews' : 'guest articles, features, or press mentions'}`,
        isPolitical 
          ? 'Prepare newsworthy announcements, policy positions, or endorsement news'
          : 'Prepare thought leadership content with original data or insights',
        `Focus content on topics where you currently have visibility gaps`,
        'Build relationships with journalists and editors at these publications',
        'Cross-promote any coverage across your owned channels for maximum impact'
      ],
      dataSource: 'citation analysis'
    })
  }
  
  // 2. ADDRESS VISIBILITY GAPS (based on actual prompt opportunities)
  if (opportunities.length > 0 || underperformingPrompts.length > 0) {
    const gapCount = opportunities.length + underperformingPrompts.length
    const sampleTopics = [...new Set([
      ...opportunities.slice(0, 2).map(o => o.prompt_category || o.promptCategory),
      ...underperformingPrompts.slice(0, 2).map(u => u.prompt_category || u.promptCategory)
    ])].filter(Boolean)
    
    recommendations.push({
      title: isPolitical ? `🗳️ Fill ${gapCount} Visibility Gaps` : `🎯 Capture ${gapCount} Missed Opportunities`,
      description: `${gapCount} relevant searches don't include you in AI responses. ` +
        `${sampleTopics.length > 0 ? `Key areas: ${sampleTopics.join(', ')}. ` : ''}` +
        `${isPolitical 
          ? 'Each gap is a voter conversation happening without your voice.'
          : 'Each represents potential customers discovering competitors instead.'
        }`,
      impact: gapCount > 5 ? 'high' : 'medium',
      effort: 'medium',
      actions: [
        `Create targeted content addressing the ${gapCount} gap${gapCount > 1 ? 's' : ''}`,
        isPolitical
          ? 'Develop clear position statements on these topics'
          : 'Build landing pages or articles covering these search topics',
        'Ensure new content is factual, comprehensive, and citable',
        `Publish on authoritative platforms, not just ${isPolitical ? 'campaign sites' : 'your own website'}`,
        'Monitor ranking changes weekly to track progress'
      ],
      dataSource: 'prompt analysis'
    })
  }
  
  // 3. COMPETITIVE RESPONSE (if competitors are threatening)
  if (competitorsThreatening.length > 0 && topCompetitor) {
    const threatNames = competitorsThreatening.slice(0, 2).map(c => c.brand).join(' and ')
    
    recommendations.push({
      title: `⚔️ Counter ${threatNames}'s Momentum`,
      description: `${threatNames} ${competitorsThreatening.length > 1 ? 'are' : 'is'} gaining visibility rapidly. ` +
        `${isPolitical 
          ? 'Their increased AI presence means more voters seeing their message first.'
          : 'They\'re capturing attention that could be going to you.'
        }`,
      impact: 'high',
      effort: 'medium',
      actions: [
        `Analyze what content is driving ${threatNames}'s visibility increase`,
        isPolitical
          ? 'Develop contrast messaging highlighting your strengths vs theirs'
          : 'Create comparison content showcasing your advantages',
        'Accelerate your publishing schedule on shared topic areas',
        'Monitor their coverage and respond quickly with your perspective',
        `Target the same high-authority sources they're being cited by`
      ],
      dataSource: 'competitor analysis'
    })
  }
  
  // 4. AMPLIFY STRENGTHS (based on top performing prompts)
  if (topPerformingPrompts.length > 0) {
    const strongAreas = [...new Set(
      topPerformingPrompts.slice(0, 3).map(p => p.prompt_category || p.promptCategory)
    )].filter(Boolean)
    
    recommendations.push({
      title: isPolitical ? '💪 Amplify Your Winning Messages' : '💪 Double Down on What\'s Working',
      description: `You rank well in ${topPerformingPrompts.length} search${topPerformingPrompts.length > 1 ? 'es' : ''}. ` +
        `${strongAreas.length > 0 ? `Strong areas: ${strongAreas.join(', ')}. ` : ''}` +
        `Expanding content on these themes can solidify your position.`,
      impact: 'medium',
      effort: 'low',
      actions: [
        `Create additional content building on your ${strongAreas.join(', ')} strengths`,
        'Identify related topics where you can expand your presence',
        isPolitical
          ? 'Ensure consistent messaging across all campaign channels'
          : 'Build internal links between high-performing content',
        'Republish winning content on partner platforms for wider reach',
        'Use these topics as templates for addressing your gap areas'
      ],
      dataSource: 'prompt analysis'
    })
  }
  
  // 5. TOPIC EXPANSION (based on topic matrix)
  if (topicMatrix && topicMatrix.length > 0) {
    const brandTopics = topicMatrix.filter(tm => 
      tm.brand.toLowerCase() === brandName.toLowerCase()
    )
    const weakTopics = brandTopics.filter(t => t.value < 0.3).slice(0, 5)
    
    if (weakTopics.length > 0) {
      const topicNames = weakTopics.map(t => t.topic).slice(0, 3).join(', ')
      
      recommendations.push({
        title: isPolitical ? '📊 Expand Topic Coverage' : '📊 Fill Topic Gaps',
        description: `Weak visibility on ${topicNames}${weakTopics.length > 3 ? ` and ${weakTopics.length - 3} more topics` : ''}. ` +
          `${isPolitical 
            ? 'Voters searching these topics aren\'t hearing from you.'
            : 'Potential customers interested in these areas find competitors first.'
          }`,
        impact: 'medium',
        effort: 'medium',
        actions: [
          `Develop content specifically targeting ${topicNames}`,
          isPolitical
            ? 'Prepare clear, quotable positions on each topic'
            : 'Create comprehensive guides or articles on each topic',
          'Ensure content includes facts and data that AI models can cite',
          'Promote new topic content through all available channels',
          'Track progress on these specific topics weekly'
        ],
        dataSource: 'topic analysis'
      })
    }
  }
  
  // 6. SENTIMENT IMPROVEMENT (if needed)
  if (yourBrandRanking && yourBrandRanking.sentiment < 70) {
    recommendations.push({
      title: isPolitical ? '💬 Improve Narrative & Perception' : '💬 Boost Brand Sentiment',
      description: `Sentiment at ${yourBrandRanking.sentiment}/100 suggests AI responses include neutral or negative language. ` +
        `${isPolitical 
          ? 'How AI describes you influences voter perception.'
          : 'Better sentiment leads to stronger recommendations.'
        }`,
      impact: yourBrandRanking.sentiment < 50 ? 'high' : 'medium',
      effort: 'medium',
      actions: [
        'Audit current AI responses to identify negative language patterns',
        isPolitical
          ? 'Publish endorsements, success stories, and achievement highlights'
          : 'Publish customer success stories and positive case studies',
        'Address common criticisms proactively with factual responses',
        isPolitical
          ? 'Ensure positive news and accomplishments are well-documented and citable'
          : 'Create comparison content highlighting your advantages and value',
        'Monitor sentiment changes monthly to track improvement'
      ],
      dataSource: 'sentiment analysis'
    })
  }
  
  return recommendations.slice(0, 4) // Return top 4 most relevant recommendations
}
