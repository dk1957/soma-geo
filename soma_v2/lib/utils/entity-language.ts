/**
 * Entity Language Utility
 * 
 * Provides entity-type-aware language and terminology for reports and analysis.
 * Supports: company, product, service, personality, organization, government, campaign, location
 */

export type EntityType = 
  | 'company'       // Traditional business/company
  | 'product'       // Physical product
  | 'service'       // Service offering
  | 'personality'   // Individual (politician, celebrity, influencer, executive)
  | 'organization'  // Non-profit, association, NGO
  | 'government'    // Government body, department, agency
  | 'campaign'      // Political campaign, movement, initiative
  | 'location'      // City, country, destination, venue

export interface EntityTerminology {
  // Basic terms
  entityName: string           // "brand", "candidate", "organization"
  entityNamePlural: string     // "brands", "candidates", "organizations"
  entityPossessive: string     // "brand's", "candidate's", "organization's"
  
  // Audience terms
  audience: string             // "customers", "voters", "supporters"
  audienceSingular: string     // "customer", "voter", "supporter"
  potentialAudience: string    // "potential customers", "potential voters"
  
  // Engagement terms
  engagementAction: string     // "purchase", "vote for", "support"
  engagementPastTense: string  // "purchased", "voted for", "supported"
  engagementNoun: string       // "sales", "votes", "support"
  
  // Value/Revenue terms
  valueMetric: string          // "revenue", "votes", "impact"
  valueLoss: string            // "lost revenue", "lost votes", "lost support"
  valueOpportunity: string     // "revenue opportunity", "voter opportunity", "support opportunity"
  
  // Competition terms
  competitor: string           // "competitor", "opponent", "rival"
  competitorPlural: string     // "competitors", "opponents", "rivals"
  competitiveAction: string    // "capturing market share", "winning votes", "gaining ground"
  
  // Success metrics
  successMetric: string        // "conversion", "voter conversion", "engagement"
  marketShare: string          // "market share", "vote share", "support share"
  position: string             // "market position", "polling position", "ranking"
  
  // Content/Strategy terms
  contentType: string          // "marketing content", "campaign messaging", "communications"
  strategyType: string         // "marketing strategy", "campaign strategy", "outreach strategy"
  
  // CTA language
  ctaAction: string            // "buy", "vote for", "support"
  ctaUrgency: string           // "close deals", "win votes", "gain supporters"
  
  // Negative outcomes
  negativeOutcome: string      // "losing customers", "losing votes", "losing support"
  missedOpportunity: string    // "missed sales", "missed votes", "missed engagement"
}

const ENTITY_TERMINOLOGY: Record<EntityType, EntityTerminology> = {
  company: {
    entityName: 'brand',
    entityNamePlural: 'brands',
    entityPossessive: "brand's",
    audience: 'customers',
    audienceSingular: 'customer',
    potentialAudience: 'potential customers',
    engagementAction: 'purchase from',
    engagementPastTense: 'purchased from',
    engagementNoun: 'sales',
    valueMetric: 'revenue',
    valueLoss: 'lost revenue',
    valueOpportunity: 'revenue opportunity',
    competitor: 'competitor',
    competitorPlural: 'competitors',
    competitiveAction: 'capturing market share',
    successMetric: 'conversion',
    marketShare: 'market share',
    position: 'market position',
    contentType: 'marketing content',
    strategyType: 'marketing strategy',
    ctaAction: 'buy',
    ctaUrgency: 'close deals',
    negativeOutcome: 'losing customers',
    missedOpportunity: 'missed sales'
  },
  
  product: {
    entityName: 'product',
    entityNamePlural: 'products',
    entityPossessive: "product's",
    audience: 'buyers',
    audienceSingular: 'buyer',
    potentialAudience: 'potential buyers',
    engagementAction: 'purchase',
    engagementPastTense: 'purchased',
    engagementNoun: 'sales',
    valueMetric: 'revenue',
    valueLoss: 'lost sales',
    valueOpportunity: 'sales opportunity',
    competitor: 'competing product',
    competitorPlural: 'competing products',
    competitiveAction: 'capturing sales',
    successMetric: 'purchase rate',
    marketShare: 'market share',
    position: 'product ranking',
    contentType: 'product content',
    strategyType: 'product marketing',
    ctaAction: 'buy',
    ctaUrgency: 'drive purchases',
    negativeOutcome: 'losing sales',
    missedOpportunity: 'missed purchases'
  },
  
  service: {
    entityName: 'service',
    entityNamePlural: 'services',
    entityPossessive: "service's",
    audience: 'clients',
    audienceSingular: 'client',
    potentialAudience: 'potential clients',
    engagementAction: 'hire',
    engagementPastTense: 'hired',
    engagementNoun: 'engagements',
    valueMetric: 'revenue',
    valueLoss: 'lost revenue',
    valueOpportunity: 'revenue opportunity',
    competitor: 'competitor',
    competitorPlural: 'competitors',
    competitiveAction: 'winning clients',
    successMetric: 'client acquisition',
    marketShare: 'market share',
    position: 'market position',
    contentType: 'service content',
    strategyType: 'service marketing',
    ctaAction: 'hire',
    ctaUrgency: 'win clients',
    negativeOutcome: 'losing clients',
    missedOpportunity: 'missed engagements'
  },
  
  personality: {
    entityName: 'public figure',
    entityNamePlural: 'public figures',
    entityPossessive: "public figure's",
    audience: 'supporters',
    audienceSingular: 'supporter',
    potentialAudience: 'potential supporters',
    engagementAction: 'support',
    engagementPastTense: 'supported',
    engagementNoun: 'support',
    valueMetric: 'influence',
    valueLoss: 'lost support',
    valueOpportunity: 'support opportunity',
    competitor: 'rival',
    competitorPlural: 'rivals',
    competitiveAction: 'gaining influence',
    successMetric: 'support growth',
    marketShare: 'share of voice',
    position: 'public ranking',
    contentType: 'public messaging',
    strategyType: 'public influence strategy',
    ctaAction: 'support',
    ctaUrgency: 'grow influence',
    negativeOutcome: 'losing supporters',
    missedOpportunity: 'missed engagement'
  },
  
  organization: {
    entityName: 'organization',
    entityNamePlural: 'organizations',
    entityPossessive: "organization's",
    audience: 'supporters',
    audienceSingular: 'supporter',
    potentialAudience: 'potential supporters',
    engagementAction: 'support',
    engagementPastTense: 'supported',
    engagementNoun: 'support',
    valueMetric: 'impact',
    valueLoss: 'lost support',
    valueOpportunity: 'support opportunity',
    competitor: 'peer organization',
    competitorPlural: 'peer organizations',
    competitiveAction: 'gaining visibility',
    successMetric: 'engagement',
    marketShare: 'mindshare',
    position: 'visibility ranking',
    contentType: 'communications',
    strategyType: 'outreach strategy',
    ctaAction: 'support',
    ctaUrgency: 'grow support',
    negativeOutcome: 'losing supporters',
    missedOpportunity: 'missed engagement'
  },
  
  government: {
    entityName: 'agency',
    entityNamePlural: 'agencies',
    entityPossessive: "agency's",
    audience: 'citizens',
    audienceSingular: 'citizen',
    potentialAudience: 'citizens',
    engagementAction: 'engage with',
    engagementPastTense: 'engaged with',
    engagementNoun: 'engagement',
    valueMetric: 'public awareness',
    valueLoss: 'lost reach',
    valueOpportunity: 'awareness opportunity',
    competitor: 'comparable agency',
    competitorPlural: 'comparable agencies',
    competitiveAction: 'increasing public awareness',
    successMetric: 'public engagement',
    marketShare: 'public awareness',
    position: 'visibility ranking',
    contentType: 'public communications',
    strategyType: 'communications strategy',
    ctaAction: 'engage',
    ctaUrgency: 'increase awareness',
    negativeOutcome: 'losing public trust',
    missedOpportunity: 'missed outreach'
  },
  
  campaign: {
    entityName: 'campaign',
    entityNamePlural: 'campaigns',
    entityPossessive: "campaign's",
    audience: 'voters',
    audienceSingular: 'voter',
    potentialAudience: 'potential voters',
    engagementAction: 'vote for',
    engagementPastTense: 'voted for',
    engagementNoun: 'votes',
    valueMetric: 'votes',
    valueLoss: 'lost votes',
    valueOpportunity: 'voter opportunity',
    competitor: 'opponent',
    competitorPlural: 'opponents',
    competitiveAction: 'gaining voter support',
    successMetric: 'voter conversion',
    marketShare: 'vote share',
    position: 'polling position',
    contentType: 'campaign messaging',
    strategyType: 'campaign strategy',
    ctaAction: 'vote',
    ctaUrgency: 'win votes',
    negativeOutcome: 'losing voter support',
    missedOpportunity: 'missed voter engagement'
  },
  
  location: {
    entityName: 'destination',
    entityNamePlural: 'destinations',
    entityPossessive: "destination's",
    audience: 'visitors',
    audienceSingular: 'visitor',
    potentialAudience: 'potential visitors',
    engagementAction: 'visit',
    engagementPastTense: 'visited',
    engagementNoun: 'visits',
    valueMetric: 'visitor interest',
    valueLoss: 'lost visitors',
    valueOpportunity: 'visitor opportunity',
    competitor: 'competing destination',
    competitorPlural: 'competing destinations',
    competitiveAction: 'attracting visitors',
    successMetric: 'visitor interest',
    marketShare: 'tourism share',
    position: 'destination ranking',
    contentType: 'destination content',
    strategyType: 'tourism strategy',
    ctaAction: 'visit',
    ctaUrgency: 'attract visitors',
    negativeOutcome: 'losing visitors',
    missedOpportunity: 'missed tourism'
  }
}

/**
 * Get terminology for a specific entity type
 */
export function getEntityTerminology(entityType: EntityType | string | null | undefined): EntityTerminology {
  const type = (entityType || 'company') as EntityType
  return ENTITY_TERMINOLOGY[type] || ENTITY_TERMINOLOGY.company
}

/**
 * Check if entity type should use political/campaign language
 * Includes 'campaign' and 'personality' (for politicians)
 */
export function isPoliticalEntity(entityType: EntityType | string | null | undefined): boolean {
  return entityType === 'campaign' || entityType === 'personality'
}

/**
 * Check if entity type is a person/personality
 */
export function isPersonalityEntity(entityType: EntityType | string | null | undefined): boolean {
  return entityType === 'personality'
}

/**
 * Check if entity type is a location/destination
 */
export function isLocationEntity(entityType: EntityType | string | null | undefined): boolean {
  return entityType === 'location'
}

/**
 * Check if entity type should use revenue/commercial language
 */
export function isCommercialEntity(entityType: EntityType | string | null | undefined): boolean {
  return ['company', 'product', 'service'].includes(entityType || 'company')
}

/**
 * Get appropriate currency symbol based on entity type
 * Commercial entities use money, political uses votes, etc.
 */
export function getValueSymbol(entityType: EntityType | string | null | undefined): string {
  if (isPoliticalEntity(entityType)) {
    return '' // No currency symbol for votes
  }
  return '$'
}

/**
 * Format a value metric appropriately for entity type
 */
export function formatValueMetric(
  value: number, 
  entityType: EntityType | string | null | undefined,
  options?: { abbreviated?: boolean }
): string {
  const terms = getEntityTerminology(entityType)
  
  if (isPoliticalEntity(entityType)) {
    // Format as vote count
    if (options?.abbreviated && value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ${terms.engagementNoun}`
    } else if (options?.abbreviated && value >= 1000) {
      return `${(value / 1000).toFixed(0)}K ${terms.engagementNoun}`
    }
    return `${value.toLocaleString()} ${terms.engagementNoun}`
  }
  
  // Format as currency for commercial entities
  if (options?.abbreviated && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (options?.abbreviated && value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

/**
 * Generate entity-appropriate insight messages
 */
export function generateInsightMessages(entityType: EntityType | string | null | undefined) {
  const t = getEntityTerminology(entityType)
  const isPolicial = isPoliticalEntity(entityType)
  const isCommercial = isCommercialEntity(entityType)
  
  return {
    // Position insights
    stablePosition: (rank: number, visibility: number, sentiment: number) => ({
      title: 'Stable Position',
      description: `You rank #${rank} with ${visibility.toFixed(1)}% visibility and ${sentiment.toFixed(1)}/100 sentiment. Maintaining position but ${t.competitorPlural} are closing the gap.`
    }),
    
    positionGained: (change: number) => ({
      title: 'Strong Upward Momentum',
      description: `Climbed ${change} position${change > 1 ? 's' : ''} - your ${t.strategyType} is working.`
    }),
    
    positionLost: (change: number) => ({
      title: 'Position Decline Detected',
      description: `Slipped ${change} position${change > 1 ? 's' : ''} - immediate action needed.`
    }),
    
    // Competitive insights
    competitorsGainingGround: (competitors: string[], topCompetitorVisibility: number) => ({
      title: `⚠️ ${t.competitorPlural.charAt(0).toUpperCase() + t.competitorPlural.slice(1)} Gaining Ground`,
      description: `${competitors.join(', ')} ${competitors.length > 1 ? 'are' : 'is'} rapidly increasing visibility. ${competitors[0]} is capturing ${topCompetitorVisibility.toFixed(1)}% of AI mentions. Every day you wait, they ${isPolicial ? 'win over' : 'steal'} ${t.potentialAudience} who never discover ${isPolicial ? 'you' : `your ${t.entityName}`}.`
    }),
    
    leadingCompetition: (gap: number, topCompetitor: string) => ({
      title: 'Leading the Competition',
      description: `You dominate ${topCompetitor} by ${gap.toFixed(1)}pp, but staying ahead requires constant optimization.`
    }),
    
    narrowLead: (gap: number, topCompetitor: string) => ({
      title: 'Narrow Lead',
      description: `${topCompetitor} is just ${gap.toFixed(1)}pp behind - one ${isPolicial ? 'campaign push' : 'content push'} could overtake you.`
    }),
    
    behindCompetitor: (gap: number, topCompetitor: string) => ({
      title: `Behind ${topCompetitor}`,
      description: `${topCompetitor} leads by ${Math.abs(gap).toFixed(1)}pp. They're capturing ${t.audience} ${isPolicial ? 'looking for leadership' : 'searching for solutions you provide'}.`
    }),
    
    // Opportunity insights
    missedOpportunities: (count: number, estimatedValue: number) => {
      if (isPolicial) {
        return {
          title: '🗳️ Missed Voter Reach',
          description: `${count} high-impact queries don't mention you - these are ${t.audience} actively researching candidates. At current engagement rates, you're missing approximately ${formatValueMetric(estimatedValue, entityType)} in potential reach. ${t.competitorPlural.charAt(0).toUpperCase() + t.competitorPlural.slice(1)} are capturing these ${t.audience} instead.`,
          metricLabel: 'estimated missed reach'
        }
      }
      return {
        title: '💰 Missed Revenue Opportunities',
        description: `${count} high-intent queries don't mention your ${t.entityName} - these are ${t.audience} actively searching for solutions. At an estimated $50K value per query, you're potentially missing ${formatValueMetric(estimatedValue, entityType, { abbreviated: true })} in annual ${t.valueMetric}. ${t.competitorPlural.charAt(0).toUpperCase() + t.competitorPlural.slice(1)} are capturing these ${t.audience} instead.`,
        metricLabel: `estimated ${t.valueLoss}`
      }
    },
    
    // Publisher insights
    publisherOpportunities: (publishers: string[], publisherCitationRate: number, yourRate: number) => ({
      title: '📰 High-Impact Media Opportunities',
      description: `${publishers.join(', ')} are cited ${publisherCitationRate.toFixed(1)}% of the time by AI models. Your content appears only ${yourRate.toFixed(1)}% of the time. ${isPolicial ? 'Getting coverage' : 'Publishing'} on these trusted platforms will immediately boost your authority and visibility.`
    }),
    
    // Recommendation titles
    recommendations: {
      publishOnPlatform: (platform: string, citationRate: number) => ({
        title: `🚀 Fast-Track: ${isPolicial ? 'Get Coverage on' : 'Publish on'} ${platform}`,
        description: `AI models cite ${platform} ${citationRate.toFixed(0)}% of the time. One ${isPolicial ? 'feature story' : 'article'} on ${platform} reaches more AI queries than 10 ${isPolicial ? 'press releases' : 'articles on your own site'}.`
      }),
      
      outrankCompetitor: (competitor: string, competitorVisibility: number, yourVisibility: number) => ({
        title: `⚔️ ${isPolicial ? 'Overtake' : 'Outrank'} ${competitor} in 30 Days`,
        description: `${competitor} leads because they're cited by authoritative sources. They're ${competitorVisibility.toFixed(1)}% visible vs your ${yourVisibility.toFixed(1)}%. We'll help you ${isPolicial ? 'secure more authoritative coverage' : 'publish more authoritative content'} to overtake them.`
      }),
      
      captureValue: (missedCount: number, estimatedValue: number) => {
        if (isPolicial) {
          return {
            title: `🗳️ Reach ${formatValueMetric(estimatedValue, entityType, { abbreviated: true })} More Voters`,
            description: `${missedCount} high-impact ${t.audience} queries don't mention you - ${t.competitorPlural} are capturing these ${t.audience}. Each query represents significant voter reach. We'll help you create and distribute messaging that appears in all ${missedCount} gaps.`
          }
        }
        return {
          title: `💸 Capture ${formatValueMetric(estimatedValue, entityType, { abbreviated: true })} in Lost Revenue`,
          description: `${missedCount} high-intent ${t.audience} queries don't mention your ${t.entityName} - ${t.competitorPlural} are capturing these ${t.audience}. Each query represents ~$50K in potential annual ${t.valueMetric}. We'll help you create and distribute content that appears in all ${missedCount} gaps.`
        }
      },
      
      improveSentiment: (currentScore: number) => ({
        title: `${isPolicial ? '📊 Improve Public Perception' : '⚠️ Address Brand Perception Issues'}`,
        description: `Your sentiment score of ${currentScore.toFixed(1)}/100 means AI models are describing ${isPolicial ? 'you' : `your ${t.entityName}`} with negative or neutral language. This directly impacts ${isPolicial ? 'voter trust' : 'conversion'} - ${t.audience} are less likely to ${t.engagementAction} ${isPolicial ? 'candidates' : `${t.entityNamePlural}`} with poor AI sentiment.`
      }),
      
      protectRankings: (risingCompetitor: string) => ({
        title: `🛡️ Protect Your Rankings from ${isPolicial ? 'Opponent' : 'Competitor'} Attacks`,
        description: `${risingCompetitor} is gaining momentum. Without daily monitoring, you won't know when ${t.competitorPlural} overtake you until it's too late. Our platform alerts you within hours of ranking changes so you can respond immediately.`
      })
    }
  }
}

/**
 * Entity type display labels for UI
 */
export const ENTITY_TYPE_OPTIONS = [
  { value: 'company', label: 'Company / Brand', description: 'Traditional business or brand' },
  { value: 'product', label: 'Product', description: 'Physical or digital product' },
  { value: 'service', label: 'Service', description: 'Professional or consumer service' },
  { value: 'personality', label: 'Person / Personality', description: 'Celebrity, influencer, executive, or public figure' },
  { value: 'organization', label: 'Organization', description: 'Non-profit, association, or NGO' },
  { value: 'government', label: 'Government / Agency', description: 'Government body, department, or agency' },
  { value: 'campaign', label: 'Political Campaign', description: 'Election campaign or political candidate' },
  { value: 'location', label: 'Location / Destination', description: 'City, country, or tourist destination' }
]

export default {
  getEntityTerminology,
  isPoliticalEntity,
  isPersonalityEntity,
  isLocationEntity,
  isCommercialEntity,
  getValueSymbol,
  formatValueMetric,
  generateInsightMessages,
  ENTITY_TYPE_OPTIONS
}
