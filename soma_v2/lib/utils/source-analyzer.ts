/**
 * Enhanced source and citation analysis utility
 * Provides strategic insights about which sources most influence brand visibility
 */

export interface SourceInsight {
  domain: string
  url?: string
  mentions: number  // Number of times this source was used/cited across AI responses
  authority: number
  category: string
  influence_score: number
  content_type: string
  is_brand_owned: boolean
  geographic_relevance: string[]
  last_seen: string
}

export interface SourceAnalysisResult {
  total_sources: number
  unique_domains: number
  authority_distribution: {
    high: number      // Authority 80+
    medium: number    // Authority 50-79
    low: number       // Authority 0-49
  }
  category_breakdown: Record<string, number>
  top_influencers: SourceInsight[]
  brand_owned_sources: SourceInsight[]
  competitor_sources: SourceInsight[]
  opportunity_sources: SourceInsight[]
}

export class SourceAnalyzer {
  private static scoreFromDomain(domain: string, min: number, max: number): number {
    let hash = 0
    for (let index = 0; index < domain.length; index++) {
      hash = ((hash << 5) - hash) + domain.charCodeAt(index)
      hash |= 0
    }

    const spread = Math.max(1, max - min + 1)
    return min + (Math.abs(hash) % spread)
  }
  
  /**
   * Analyze sources and citations from test results to provide strategic insights
   */
  static analyzeSourcesFromResults(testResults: any[], brandName: string, brandDomain?: string): SourceAnalysisResult {
    const sourceMap = new Map<string, SourceInsight>()
    const urlMap = new Map<string, SourceInsight>()
    
    // Process all citations and sources from test results
    testResults.forEach(result => {
      // Extract citations
      if (result.citations && Array.isArray(result.citations)) {
        result.citations.forEach((citation: any) => {
          const url = citation.url || citation.link || citation.source_url || citation
          if (url && typeof url === 'string') {
            this.processSource(url, sourceMap, urlMap, brandName, brandDomain, result.llm_name)
          }
        })
      }
      
      // Extract sources (alternative field)
      if (result.sources && Array.isArray(result.sources)) {
        result.sources.forEach((source: any) => {
          const url = source.url || source.link || source
          if (url && typeof url === 'string') {
            this.processSource(url, sourceMap, urlMap, brandName, brandDomain, result.llm_name)
          }
        })
      }
      
      // Extract inline citations from response text
      if (result.response && typeof result.response === 'string') {
        const inlineCitations = this.extractInlineCitations(result.response)
        inlineCitations.forEach(url => {
          this.processSource(url, sourceMap, urlMap, brandName, brandDomain, result.llm_name)
        })
      }
    })
    
    // Convert to arrays and analyze
    const allSources = Array.from(sourceMap.values())
    const allUrls = Array.from(urlMap.values())
    
    // Enhance domain sources with popular URLs
    allSources.forEach(domainSource => {
      const domainUrls = allUrls
        .filter(urlSource => urlSource.domain === domainSource.domain)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 3); // Top 3 URLs for this domain
      
      // Add the most popular URL as the representative URL for the domain
      if (domainUrls.length > 0) {
        domainSource.url = domainUrls[0].url;
        // Store additional URLs for potential display
        (domainSource as any).popularUrls = domainUrls.map(u => ({ url: u.url, mentions: u.mentions }));
      }
    });
    
    // Calculate insights
    const authorityDistribution = this.calculateAuthorityDistribution(allSources)
    const categoryBreakdown = this.calculateCategoryBreakdown(allSources)
    const topInfluencers = this.identifyTopInfluencers(allSources)
    const brandOwnedSources = allSources.filter(s => s.is_brand_owned)
    const competitorSources = this.identifyCompetitorSources(allSources, brandName)
    const opportunitySources = this.identifyOpportunitySources(allSources, brandName)
    
    return {
      total_sources: allUrls.length,
      unique_domains: allSources.length,
      authority_distribution: authorityDistribution,
      category_breakdown: categoryBreakdown,
      top_influencers: topInfluencers.slice(0, 10),
      brand_owned_sources: brandOwnedSources,
      competitor_sources: competitorSources.slice(0, 5),
      opportunity_sources: opportunitySources.slice(0, 5)
    }
  }
  
  /**
   * Process a single source/citation
   */
  private static processSource(
    url: string, 
    sourceMap: Map<string, SourceInsight>,
    urlMap: Map<string, SourceInsight>,
    brandName: string,
    brandDomain?: string,
    llmName?: string
  ) {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '').toLowerCase()
      
      // Update domain-level source
      if (!sourceMap.has(domain)) {
        sourceMap.set(domain, {
          domain,
          mentions: 0,
          authority: this.calculateDomainAuthority(domain),
          category: this.categorizeDomain(domain),
          influence_score: 0,
          content_type: this.inferContentType(domain, url),
          is_brand_owned: this.isBrandOwned(domain, brandName, brandDomain),
          geographic_relevance: this.getGeographicRelevance(domain),
          last_seen: new Date().toISOString()
        })
      }
      
      const domainSource = sourceMap.get(domain)!
      domainSource.mentions++
      domainSource.influence_score = this.calculateInfluenceScore(domainSource)
      
      // Update URL-level source  
      if (!urlMap.has(url)) {
        urlMap.set(url, {
          domain,
          url,
          mentions: 0,
          authority: domainSource.authority,
          category: domainSource.category,
          influence_score: 0,
          content_type: this.inferContentType(domain, url),
          is_brand_owned: domainSource.is_brand_owned,
          geographic_relevance: domainSource.geographic_relevance,
          last_seen: new Date().toISOString()
        })
      }
      
      const urlSource = urlMap.get(url)!
      urlSource.mentions++
      urlSource.influence_score = this.calculateInfluenceScore(urlSource)
      
    } catch (error) {
      console.warn('Invalid URL in source analysis:', url)
    }
  }
  
  /**
   * Extract inline citations from response text [domain.com] or (source.com) format
   */
  private static extractInlineCitations(text: string): string[] {
    const citations: string[] = []
    
    // Match [domain.com] format
    const bracketMatches = text.match(/\[([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\]/g) || []
    bracketMatches.forEach(match => {
      const domain = match.slice(1, -1) // Remove brackets
      citations.push(`https://${domain}`)
    })
    
    // Match (domain.com) format
    const parenMatches = text.match(/\(([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/g) || []
    parenMatches.forEach(match => {
      const domain = match.slice(1, -1) // Remove parentheses
      citations.push(`https://${domain}`)
    })
    
    // Match full URLs
    const urlMatches = text.match(/https?:\/\/[^\s\])\}]+/g) || []
    citations.push(...urlMatches)
    
    return citations
  }
  
  /**
   * Calculate domain authority based on known high-authority domains
   */
  private static calculateDomainAuthority(domain: string): number {
    // High authority domains (80-100)
    const highAuthority = [
      'wikipedia.org', 'bbc.com', 'cnn.com', 'nytimes.com', 'reuters.com',
      'forbes.com', 'bloomberg.com', 'wsj.com', 'guardian.com', 'economist.com',
      'harvard.edu', 'stanford.edu', 'mit.edu', 'nature.com', 'sciencemag.org',
      'youtube.com', 'google.com', 'amazon.com', 'microsoft.com', 'apple.com'
    ]
    
    // Medium authority domains (50-79)
    const mediumAuthority = [
      'techcrunch.com', 'venturebeat.com', 'mashable.com', 'wired.com',
      'businessinsider.com', 'huffpost.com', 'buzzfeed.com', 'reddit.com',
      'quora.com', 'medium.com', 'linkedin.com', 'twitter.com', 'facebook.com'
    ]
    
    // Industry-specific authority
    const industryAuthority: Record<string, number> = {
      // Food & Beverage
      'foodnetwork.com': 85,
      'allrecipes.com': 80,
      'epicurious.com': 82,
      'bonappetit.com': 78,
      'foodandwine.com': 79,
      
      // Business & Marketing  
      'marketingland.com': 75,
      'adweek.com': 77,
      'campaignlive.com': 72,
      
      // News & Media (regional)
      'news24.com': 70,
      'iol.co.za': 68,
      'mg.co.za': 75,
      'bdlive.co.za': 72,
      'timeslive.co.za': 69
    }
    
    if (industryAuthority[domain]) {
      return industryAuthority[domain]
    }
    
    if (highAuthority.includes(domain)) {
      return this.scoreFromDomain(domain, 90, 100)
    }
    
    if (mediumAuthority.includes(domain)) {
      return this.scoreFromDomain(domain, 50, 80)
    }
    
    // Domain extension heuristics
    if (domain.endsWith('.edu')) return this.scoreFromDomain(domain, 85, 100)
    if (domain.endsWith('.gov')) return this.scoreFromDomain(domain, 90, 100)
    if (domain.endsWith('.org')) return this.scoreFromDomain(domain, 65, 85)
    
    // Brand websites (assume medium authority)
    if (domain.includes('nestle') || domain.includes('unilever') || 
        domain.includes('cocacola') || domain.includes('pepsi')) {
      return this.scoreFromDomain(domain, 70, 85)
    }
    
    // Default for unknown domains
    return this.scoreFromDomain(domain, 30, 70)
  }
  
  /**
   * Categorize domain by content type
   */
  private static categorizeDomain(domain: string): string {
    // News & Media
    if (['bbc.com', 'cnn.com', 'reuters.com', 'nytimes.com', 'guardian.com',
         'news24.com', 'iol.co.za', 'mg.co.za', 'timeslive.co.za'].includes(domain)) {
      return 'News & Media'
    }
    
    // Business & Finance
    if (['forbes.com', 'bloomberg.com', 'wsj.com', 'businessinsider.com',
         'bdlive.co.za'].includes(domain)) {
      return 'Business & Finance'
    }
    
    // Food & Recipe
    if (['foodnetwork.com', 'allrecipes.com', 'epicurious.com', 'bonappetit.com',
         'foodandwine.com'].includes(domain)) {
      return 'Food & Recipe'
    }
    
    // Social Media
    if (['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 
         'linkedin.com', 'tiktok.com'].includes(domain)) {
      return 'Social Media'
    }
    
    // Academic & Research
    if (domain.endsWith('.edu') || ['nature.com', 'sciencemag.org'].includes(domain)) {
      return 'Academic & Research'
    }
    
    // Government
    if (domain.endsWith('.gov')) {
      return 'Government'
    }
    
    // E-commerce
    if (['amazon.com', 'shopify.com', 'ebay.com'].includes(domain)) {
      return 'E-commerce'
    }
    
    // Brand Websites
    if (domain.includes('nestle') || domain.includes('unilever') || 
        domain.includes('cocacola') || domain.includes('pepsi') ||
        domain.includes('maggi') || domain.includes('knorr')) {
      return 'Brand Website'
    }
    
    // Tech Blogs
    if (['techcrunch.com', 'venturebeat.com', 'wired.com', 'mashable.com'].includes(domain)) {
      return 'Technology'
    }
    
    // Community & Forum
    if (['reddit.com', 'quora.com', 'stackoverflow.com'].includes(domain)) {
      return 'Community & Forum'
    }
    
    return 'Other'
  }
  
  /**
   * Infer content type from URL patterns
   */
  private static inferContentType(domain: string, url: string): string {
    if (url.includes('/video/') || domain === 'youtube.com') return 'Video'
    if (url.includes('/blog/') || url.includes('/article/')) return 'Article'
    if (url.includes('/recipe/') || url.includes('/recipes/')) return 'Recipe'
    if (url.includes('/news/')) return 'News'
    if (url.includes('/product/') || url.includes('/products/')) return 'Product Page'
    if (url.includes('/about/') || url.includes('/company/')) return 'Company Info'
    if (url.includes('/research/') || url.includes('/study/')) return 'Research'
    
    return 'Web Page'
  }
  
  /**
   * Check if domain is brand-owned
   */
  private static isBrandOwned(domain: string, brandName: string, brandDomain?: string): boolean {
    const normalizedBrand = brandName.toLowerCase()
    const normalizedDomain = domain.toLowerCase()
    
    // Check against provided brand domain
    if (brandDomain && normalizedDomain.includes(brandDomain.toLowerCase())) {
      return true
    }
    
    // Check if domain contains brand name
    if (normalizedDomain.includes(normalizedBrand)) {
      return true
    }
    
    // Check for parent company domains (this could be expanded)
    const parentCompanyMapping: Record<string, string[]> = {
      'nido': ['nestle.com', 'nestle.ng', 'nestle.co.za'],
      'maggi': ['nestle.com', 'maggi.com'],
      'knorr': ['unilever.com', 'knorr.com'],
      'heineken': ['heineken.com', 'heineken.co.za', 'heineken.ng']
    }
    
    const parentDomains = parentCompanyMapping[normalizedBrand] || []
    return parentDomains.some(parent => normalizedDomain.includes(parent))
  }
  
  /**
   * Get geographic relevance indicators
   */
  private static getGeographicRelevance(domain: string): string[] {
    const relevance: string[] = []
    
    // Country-specific domains
    if (domain.endsWith('.co.za')) relevance.push('South Africa')
    if (domain.endsWith('.ng')) relevance.push('Nigeria')
    if (domain.endsWith('.ke')) relevance.push('Kenya')
    if (domain.endsWith('.gh')) relevance.push('Ghana')
    if (domain.endsWith('.ae')) relevance.push('UAE')
    if (domain.endsWith('.sa')) relevance.push('Saudi Arabia')
    if (domain.endsWith('.co.uk')) relevance.push('United Kingdom')
    if (domain.endsWith('.de')) relevance.push('Germany')
    
    // Regional indicators in domain name
    if (domain.includes('africa')) relevance.push('Africa')
    if (domain.includes('mena')) relevance.push('Middle East')
    if (domain.includes('europe')) relevance.push('Europe')
    if (domain.includes('asia')) relevance.push('Asia')
    
    // Default to global if no specific indicators
    if (relevance.length === 0) relevance.push('Global')
    
    return relevance
  }
  
  /**
   * Calculate influence score based on authority, usage frequency, and context
   */
  private static calculateInfluenceScore(source: SourceInsight): number {
    let score = 0
    
    // Authority weight (40%)
    score += (source.authority / 100) * 40
    
    // Usage frequency weight (30%)
    const usageScore = Math.min(source.mentions / 10, 1) * 30
    score += usageScore
    
    // Category bonus (20%)
    const categoryBonuses: Record<string, number> = {
      'News & Media': 20,
      'Academic & Research': 18,
      'Business & Finance': 16,
      'Food & Recipe': 15,
      'Government': 17,
      'Brand Website': 12,
      'Social Media': 10,
      'Community & Forum': 8,
      'Other': 5
    }
    score += categoryBonuses[source.category] || 5
    
    // Content type bonus (10%)
    const contentBonuses: Record<string, number> = {
      'Article': 10,
      'Research': 10,
      'News': 9,
      'Video': 7,
      'Recipe': 6,
      'Product Page': 5,
      'Web Page': 3
    }
    score += contentBonuses[source.content_type] || 3
    
    return Math.min(score, 100) // Cap at 100
  }
  
  /**
   * Calculate authority distribution
   */
  private static calculateAuthorityDistribution(sources: SourceInsight[]) {
    const distribution = { high: 0, medium: 0, low: 0 }
    
    sources.forEach(source => {
      if (source.authority >= 80) distribution.high++
      else if (source.authority >= 50) distribution.medium++
      else distribution.low++
    })
    
    return distribution
  }
  
  /**
   * Calculate category breakdown
   */
  private static calculateCategoryBreakdown(sources: SourceInsight[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    
    sources.forEach(source => {
      breakdown[source.category] = (breakdown[source.category] || 0) + 1
    })
    
    return breakdown
  }
  
  /**
   * Identify top influencer sources
   */
  private static identifyTopInfluencers(sources: SourceInsight[]): SourceInsight[] {
    return sources
      .filter(s => !s.is_brand_owned) // Exclude brand-owned sources
      .sort((a, b) => b.influence_score - a.influence_score)
  }
  
  /**
   * Identify competitor-owned sources
   */
  private static identifyCompetitorSources(sources: SourceInsight[], brandName: string): SourceInsight[] {
    // Known competitor domains (this could be expanded with a database)
    const competitorIndicators = [
      'heineken', 'castle', 'bavaria', 'corona', 'budweiser',
      'knorr', 'royco', 'maggi', 'oxo',
      'peak', 'cowbell', 'similac', 'enfamil'
    ]
    
    return sources.filter(source => {
      const domain = source.domain.toLowerCase()
      return competitorIndicators.some(comp => 
        domain.includes(comp) && !domain.includes(brandName.toLowerCase())
      )
    }).sort((a, b) => b.influence_score - a.influence_score)
  }
  
  /**
   * Identify opportunity sources (high authority, not brand-owned, relevant category)
   */
  private static identifyOpportunitySources(sources: SourceInsight[], brandName: string): SourceInsight[] {
    return sources
      .filter(source => 
        !source.is_brand_owned && 
        source.authority >= 70 &&
        ['News & Media', 'Food & Recipe', 'Business & Finance'].includes(source.category)
      )
      .sort((a, b) => b.authority - a.authority)
  }
}