/**
 * Enhanced competitor extraction utility
 * Extracted from BrandReportingService for use in client components
 */

export interface CompetitorExtractionResult {
  competitors: string[]
  scores: Record<string, number>
  totalEntities: number
}

export class CompetitorExtractor {
  /**
   * Extract competitor brands from text using enhanced patterns
   */
  static extractBrandEntitiesFromText(text: string, targetBrandName: string): string[] {
    const entities: string[] = []
    
    // Normalize target brand for comparison
    const normalizedTargetBrand = targetBrandName.toLowerCase().trim()
    
    // Enhanced beverage/alcohol indicators
    const beverageIndicators = [
      'Beer', 'Brewery', 'Brewing', 'Breweries', 'Lager', 'Ale', 'Stout', 'Pilsner',
      'Lite', 'Light', 'Draft', 'Premium', 'Special', 'Original', 'Classic',
      'Zero', 'Non-Alcoholic', 'Alcohol-Free'
    ]
    
    // Common brand/company indicators
    const companyIndicators = [
      'Inc\\.?', 'LLC', 'Ltd\\.?', 'Corporation', 'Corp\\.?', 'Company', 'Co\\.?',
      'Group', 'Holdings', 'Enterprises', 'Solutions', 'Services', 'Systems',
      'Technologies', 'Tech', 'Brands', 'International', 'Global', 'Worldwide',
      '& Co\\.?', '& Sons', '& Partners', 'PLC', 'SA', 'AG', 'GmbH', 'Pty'
    ]
    
    // Tourism/destination indicators  
    const destinationIndicators = [
      'Hotel', 'Resort', 'Lodge', 'Inn', 'Suites', 'Palace', 'Grand',
      'Royal', 'National Park', 'Reserve', 'Beach', 'Island', 'Mountain',
      'Valley', 'Lake', 'River', 'Bay', 'Coast', 'Safari', 'Tours',
      'Airlines', 'Airways', 'Airport', 'Station', 'Center', 'Centre'
    ]
    
    // Patterns to match entities with enhanced beer/beverage focus
    const patterns = [
      // Beer/beverage brand names with indicators
      `\\b[A-Z][a-zA-Z\\s&-]+\\s(?:${beverageIndicators.join('|')})\\b`,
      
      // Company names with indicators
      `\\b[A-Z][a-zA-Z\\s&-]+\\s(?:${companyIndicators.join('|')})\\b`,
      
      // Tourism/destination entities
      `\\b[A-Z][a-zA-Z\\s&-]+\\s(?:${destinationIndicators.join('|')})\\b`,
      
      // Capitalized entity names (2-4 words)
      '\\b[A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){1,3}\\b',
      
      // Branded product mentions
      '\\b[A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]*)*(?:\\s+(?:Brand|Product|Line|Series))\\b',
      
      // Geographic business entities
      '\\b(?:South\\s+African|East\\s+African|West\\s+African|North\\s+African)\\s+[A-Z][a-zA-Z\\s&-]+\\b'
    ]
    
    // Apply each pattern
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g')
      const matches = text.match(regex) || []
      
      matches.forEach(match => {
        const cleaned = match.trim()
        if (this.isValidCompetitorEntity(cleaned, targetBrandName)) {
          entities.push(cleaned)
        }
      })
    })
    
    // Additional extraction: Look for specific beer/beverage brand patterns
    const beerBrandPatterns = [
      // Beer brand names often mentioned with specific context
      '\\b(Heineken|Castle Lite|Castle|Bavaria|Balozi|Corona|Budweiser|Stella Artois|Guinness|Carlsberg|Becks)\\b',
      '\\b(Diageo|East African Breweries|SABMiller|Anheuser-Busch|AB InBev)\\b',
      '\\b([A-Z][a-zA-Z]+)\\s+(?:0\\.0|Zero|Light|Lite|Premium|Original|Classic)\\b',
      // Retail and service brands
      '\\b(Dial a Drink|Greenspoon|Haven Wines|Liquor Shack|The V Bar)\\b',
      // Direct brand name patterns (case-insensitive but preserve original case)
      '\\bHeineken\\b',
      '\\bBalozi\\b',
      '\\bBavaria\\b'
    ]
    
    beerBrandPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi')
      const matches = text.match(regex) || []
      
      matches.forEach(match => {
        const cleaned = match.trim()
        if (this.isValidCompetitorEntity(cleaned, targetBrandName)) {
          entities.push(cleaned)
        }
      })
    })
    
    // Remove duplicates and sort by relevance
    const uniqueEntities = [...new Set(entities)]
      .filter(entity => entity.length > 2 && entity.length < 100)
      .sort((a, b) => {
        const aScore = this.calculateEntityRelevanceScore(a, text)
        const bScore = this.calculateEntityRelevanceScore(b, text)
        return bScore - aScore
      })
    
    return uniqueEntities.slice(0, 15) // Return top 15 most relevant
  }
  
  /**
   * Validate if an entity is a legitimate competitor
   */
  private static isValidCompetitorEntity(entity: string, targetBrandName: string): boolean {
    const normalizedEntity = entity.toLowerCase().trim()
    const normalizedTarget = targetBrandName.toLowerCase().trim()
    
    // Skip if it's the target brand itself
    if (normalizedEntity.includes(normalizedTarget) || normalizedTarget.includes(normalizedEntity)) {
      return false
    }
    
    // Skip common words and fragments
    const skipPatterns = [
      /^(the|and|or|of|in|at|to|for|with|by|from|as|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall)$/i,
      /^(this|that|these|those|here|there|when|where|why|how|what|which|who|whom)$/i,
      /^(a|an|some|any|many|much|few|little|most|more|less|all|both|each|every|no|none|one|two|three)$/i,
      /^(very|quite|rather|pretty|really|truly|actually|probably|possibly|definitely|certainly|surely)$/i,
      /^(good|bad|great|excellent|poor|better|best|worse|worst|high|low|big|small|large|little)$/i,
      /^(new|old|young|fresh|modern|traditional|classic|premium|standard|basic|advanced)$/i,
      /^[a-z]{1,2}$/i, // Single letters or very short words
      /^\d+$/, // Pure numbers
      /^[^\w\s]+$/, // Only punctuation
    ]
    
    if (skipPatterns.some(pattern => pattern.test(normalizedEntity))) {
      return false
    }
    
    // Skip if it's just fragments or partial matches
    if (normalizedEntity.startsWith('{') || normalizedEntity.endsWith('}')) {
      return false
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(entity)) {
      return false
    }
    
    // Skip very generic terms
    const genericTerms = [
      'brand', 'product', 'company', 'business', 'market', 'industry', 'sector',
      'analysis', 'research', 'study', 'report', 'data', 'information', 'content',
      'response', 'answer', 'question', 'query', 'search', 'result', 'finding'
    ]
    
    if (genericTerms.includes(normalizedEntity)) {
      return false
    }
    
    return true
  }
  
  /**
   * Calculate relevance score for entity prioritization
   */
  private static calculateEntityRelevanceScore(entity: string, text: string): number {
    let score = 0
    
    // Known beer/beverage brands get high priority
    const knownBeerBrands = ['Heineken', 'Castle Lite', 'Castle', 'Bavaria', 'Balozi', 'Corona', 'Budweiser', 'Stella Artois', 'Guinness']
    if (knownBeerBrands.some(brand => entity.toLowerCase().includes(brand.toLowerCase()))) {
      score += 60 // Major boost for beer brands
    }
    
    // Major brewery/company names
    if (['Diageo', 'East African Breweries', 'SABMiller', 'AB InBev', 'Anheuser-Busch'].some(company => entity.includes(company))) {
      score += 50
    }
    
    // Length bonus (longer names tend to be more specific)
    score += Math.min(entity.length, 20)
    
    // Frequency bonus (mentioned multiple times)
    const mentions = (text.match(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    score += mentions * 10
    
    // Context bonus (appears near business/brand keywords)
    const contextKeywords = ['company', 'brand', 'brewery', 'group', 'limited', 'corporation', 'inc', 'ltd']
    const hasContextNearby = contextKeywords.some(keyword => {
      const entityIndex = text.toLowerCase().indexOf(entity.toLowerCase())
      if (entityIndex === -1) return false
      
      const contextWindow = text.substring(Math.max(0, entityIndex - 50), entityIndex + entity.length + 50)
      return contextWindow.toLowerCase().includes(keyword)
    })
    
    if (hasContextNearby) score += 15
    
    // Brand indicator bonus
    const brandIndicators = ['beer', 'brewery', 'lager', 'ale', 'group', 'limited', 'company', 'corp', 'inc']
    const containsBrandIndicator = brandIndicators.some(indicator => 
      entity.toLowerCase().includes(indicator)
    )
    
    if (containsBrandIndicator) score += 20
    
    return score
  }
  
  /**
   * Extract competitors with scores for debugging
   */
  static extractCompetitorsWithScores(text: string, targetBrandName: string): CompetitorExtractionResult {
    const competitors = this.extractBrandEntitiesFromText(text, targetBrandName)
    const scores: Record<string, number> = {}
    
    competitors.forEach(competitor => {
      scores[competitor] = this.calculateEntityRelevanceScore(competitor, text)
    })
    
    return {
      competitors,
      scores,
      totalEntities: competitors.length
    }
  }
}