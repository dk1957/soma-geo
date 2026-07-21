/**
 * Website Context Extractor
 * ========================
 * 
 * Extracts brand context from websites to improve categorization and contextualization.
 * Uses web scraping to gather additional information about the brand's offerings,
 * target market, and business focus.
 */

export interface WebsiteContext {
  description?: string
  services?: string[]
  industries?: string[]
  targetMarkets?: string[]
  keywords?: string[]
  metaDescription?: string
  title?: string
  businessType?: string
  extractedText?: string
}

export class WebsiteContextExtractor {
  private tavilyApiKey: string

  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY || ''
  }

  /**
   * Extract context from a website URL
   */
  async extractContext(websiteUrl: string): Promise<WebsiteContext | null> {
    if (!this.tavilyApiKey) {
      console.warn('⚠️ Tavily API key not available, skipping website extraction')
      return null
    }

    if (!websiteUrl || !this.isValidUrl(websiteUrl)) {
      console.warn('⚠️ Invalid website URL provided')
      return null
    }

    try {
      console.log(`🌐 Extracting context from website: ${websiteUrl}`)

      // Use Tavily to get website content
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query: `site:${this.extractDomain(websiteUrl)} about services products`,
          search_depth: 'basic',
          max_results: 3,
          include_domains: [this.extractDomain(websiteUrl)],
          include_raw_content: true
        }),
      })

      if (!response.ok) {
        console.error(`❌ Tavily API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        console.warn(`⚠️ No website content found for ${websiteUrl}`)
        return null
      }

      console.log(`✅ Found ${data.results.length} pages from website`)

      // Extract context from the results
      const context = this.parseWebsiteContent(data.results, websiteUrl)
      
      console.log(`📊 Extracted context: ${JSON.stringify(context, null, 2)}`)
      
      return context

    } catch (error) {
      console.error(`❌ Error extracting website context:`, error)
      return null
    }
  }

  /**
   * Parse website content to extract meaningful context
   */
  private parseWebsiteContent(results: any[], websiteUrl: string): WebsiteContext {
    const context: WebsiteContext = {
      services: [],
      industries: [],
      targetMarkets: [],
      keywords: []
    }

    let allText = ''
    
    for (const result of results) {
      // Extract title and meta description from homepage result
      if (result.url.includes(this.extractDomain(websiteUrl))) {
        if (result.title && !context.title) {
          context.title = result.title
        }
        
        if (result.content && !context.metaDescription) {
          context.metaDescription = result.content.substring(0, 200)
        }
      }

      // Combine all text content
      if (result.content) {
        allText += ' ' + result.content
      }
      if (result.raw_content) {
        allText += ' ' + result.raw_content
      }
    }

    context.extractedText = allText

    // Extract services and products
    context.services = this.extractServices(allText)
    
    // Extract industry keywords
    context.industries = this.extractIndustries(allText)
    
    // Extract target markets/locations
    context.targetMarkets = this.extractTargetMarkets(allText)
    
    // Extract key business terms
    context.keywords = this.extractKeywords(allText)
    
    // Determine business type
    context.businessType = this.determineBusinessType(allText)
    
    // Create comprehensive description
    context.description = this.generateDescription(context, allText)

    return context
  }

  /**
   * Extract services from website content
   */
  private extractServices(text: string): string[] {
    const services: Set<string> = new Set()
    const lowerText = text.toLowerCase()

    const servicePatterns = [
      // Marketing & SEO
      /(?:seo|search engine optimization|digital marketing|content marketing|social media marketing|ppc|pay per click|email marketing|influencer marketing)/g,
      /(?:brand optimization|ai optimization|generative engine optimization|geo|brand visibility|content creation)/g,
      
      // Technology
      /(?:web development|mobile app development|software development|cloud services|ai services|data analytics|cybersecurity)/g,
      /(?:e-commerce|ecommerce|online store|marketplace|saas|software as a service)/g,
      
      // Finance
      /(?:payment processing|financial services|fintech|digital wallet|money transfer|banking|investment|insurance)/g,
      
      // Consulting & Professional
      /(?:consulting|business advisory|strategy consulting|management consulting|legal services|accounting)/g,
      
      // Healthcare & Education
      /(?:telemedicine|healthcare|medical services|e-learning|online education|training|courses)/g
    ]

    for (const pattern of servicePatterns) {
      const matches = lowerText.match(pattern)
      if (matches) {
        matches.forEach(match => services.add(match.trim()))
      }
    }

    return Array.from(services).slice(0, 10) // Limit to top 10
  }

  /**
   * Extract industry classifications
   */
  private extractIndustries(text: string): string[] {
    const industries: Set<string> = new Set()
    const lowerText = text.toLowerCase()

    const industryMap = {
      'technology': /(?:technology|software|tech|digital|ai|artificial intelligence|machine learning|cloud|saas)/g,
      'marketing': /(?:marketing|advertising|seo|social media|content|brand|promotion)/g,
      'finance': /(?:finance|financial|fintech|banking|payment|money|investment|trading)/g,
      'healthcare': /(?:healthcare|health|medical|medicine|wellness|fitness|nutrition)/g,
      'education': /(?:education|learning|training|course|school|university|teaching)/g,
      'retail': /(?:retail|ecommerce|e-commerce|shopping|store|sales|merchandise)/g,
      'consulting': /(?:consulting|advisory|consultant|professional services|business services)/g,
      'media': /(?:media|entertainment|content|publishing|news|journalism|creative)/g
    }

    for (const [industry, pattern] of Object.entries(industryMap)) {
      if (pattern.test(lowerText)) {
        industries.add(industry)
      }
    }

    return Array.from(industries)
  }

  /**
   * Extract target markets and geographic focus
   */
  private extractTargetMarkets(text: string): string[] {
    const markets: Set<string> = new Set()
    const lowerText = text.toLowerCase()

    // African countries and regions
    const africanMarkets = [
      'nigeria', 'kenya', 'ghana', 'south africa', 'egypt', 'morocco', 'tunisia',
      'uganda', 'tanzania', 'rwanda', 'ethiopia', 'senegal', 'ivory coast',
      'cameroon', 'zambia', 'zimbabwe', 'botswana', 'algeria', 'libya'
    ]

    // Middle Eastern markets
    const middleEastMarkets = [
      'uae', 'saudi arabia', 'kuwait', 'qatar', 'oman', 'bahrain',
      'jordan', 'lebanon', 'israel', 'iraq', 'iran'
    ]

    // Check for specific mentions
    const allMarkets = [...africanMarkets, ...middleEastMarkets, 'africa', 'middle east', 'global']
    
    for (const market of allMarkets) {
      if (lowerText.includes(market)) {
        markets.add(market)
      }
    }

    return Array.from(markets)
  }

  /**
   * Extract key business keywords
   */
  private extractKeywords(text: string): string[] {
    const keywords: Set<string> = new Set()
    
    // Extract important business terms
    const keywordPatterns = [
      /\b(?:solutions?|services?|platform|software|app|tool|system|framework)\b/gi,
      /\b(?:optimization|analytics|automation|integration|management|development)\b/gi,
      /\b(?:enterprise|business|corporate|startup|sme|small business)\b/gi,
      /\b(?:api|dashboard|interface|workflow|process|strategy)\b/gi
    ]

    for (const pattern of keywordPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase().trim()))
      }
    }

    return Array.from(keywords).slice(0, 15)
  }

  /**
   * Determine business type from content
   */
  private determineBusinessType(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('saas') || lowerText.includes('software as a service')) {
      return 'saas'
    }
    if (lowerText.includes('marketplace')) {
      return 'marketplace'
    }
    if (lowerText.includes('ecommerce') || lowerText.includes('e-commerce')) {
      return 'ecommerce'
    }
    if (lowerText.includes('consulting') || lowerText.includes('advisory')) {
      return 'consulting'
    }
    if (lowerText.includes('agency')) {
      return 'agency'
    }

    return 'business'
  }

  /**
   * Generate comprehensive description
   */
  private generateDescription(context: WebsiteContext, text: string): string {
    const parts: string[] = []

    if (context.services && context.services.length > 0) {
      parts.push(`Offers ${context.services.slice(0, 3).join(', ')}`)
    }

    if (context.industries && context.industries.length > 0) {
      parts.push(`in the ${context.industries.join(' and ')} industry`)
    }

    if (context.targetMarkets && context.targetMarkets.length > 0) {
      parts.push(`serving ${context.targetMarkets.join(', ')}`)
    }

    if (parts.length === 0) {
      // Fallback to extract first sentence
      const sentences = text.split(/[.!?]+/)
      const firstSentence = sentences.find(s => s.trim().length > 20)
      if (firstSentence) {
        return firstSentence.trim().substring(0, 150) + '...'
      }
    }

    return parts.join(' ')
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }
}

export default WebsiteContextExtractor