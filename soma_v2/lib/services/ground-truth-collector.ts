/**
 * Ground Truth Collector for High-Intent Brand Queries
 * ----------------------------------------------------
 * Purpose: Collect real-world user queries about a brand, its products, services,
 * competitors, or related solutions.        // Brand mention priority (highest weight)
        if (context.brandName && textLower.includes(context.brandName.toLowerCase())) {
          score += 50
        }

        // Business category relevance
        if (context.businessCategory && textLower.includes(context.businessCategory.toLowerCase())) {
          score += 30
        }

        // Products/services mention
        if (context.productsServices) {
          const productTerms = context.productsServices.toLowerCase().split(/[,\s]+/)
          for (const term of productTerms) {
            if (term.length > 2 && textLower.includes(term)) {
              score += 20
              break
            }
          }
        }st relevant and high-intent
 * queries for AI-based prompt expansion.
 * 
 * Features:
 * - Supports multiple markets/locations
 * - Collects Google PAA + Autocomplete
 * - Collects Reddit & Quora questions
 * - Scores and ranks questions based on commercial and informational intent
 * - Prepares structured output for next-step AI expansion
 * 
 * NOTE: This service performs ONLY online research and data collection.
 * No LLM processing - data is passed to LLM agents for subsequent processing.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { countriesService } from '@/lib/services/countries-service'
import WebsiteContextExtractor, { type WebsiteContext } from './website-context-extractor'

export interface BrandContext {
  brandName: string
  markets: string[]        // e.g., ["Uganda", "Kenya"]
  businessCategory: string // Primary category for backward compatibility
  businessCategories?: string[] // All selected categories for multi-select
  productsServices: string
  competitors?: string[]
  website?: string
  websiteContext?: WebsiteContext
  userId?: string
  topics?: string[]
  // Enhanced context for smarter prompt generation
  description?: string        // What the brand does - rich narrative
  targetAudience?: string     // Who the brand serves
  primaryValue?: string       // Primary value proposition
  businessModel?: string      // B2B, B2C, B2B2C, marketplace
  businessType?: string       // brand, business, product, organization
}

export interface GroundTruthQuestion {
  text: string
  source: 'PAA' | 'Autocomplete' | 'Reddit' | 'Quora' | 'SerpAPI' | 'Forums'
  volume?: number
  timestamp?: string
  relevanceScore: number
  intentCategory: 'transactional_direct' | 'transactional_local' | 'commercial_product' | 'commercial_solution' | 'navigational_branded'
  market?: string
  rawData?: any
}

export interface GroundTruthResult {
  brandContext: BrandContext
  questions: GroundTruthQuestion[]
  totalQuestions: number
  highIntentQuestions: number
  marketBreakdown: { [market: string]: number }
  intentBreakdown: { [intent: string]: number }
  topSources: string[]
  collectionTimestamp: string
  qualityScore: number
  businessKeywords: string[] // Pre-extracted keywords for Step 2
  categoryKeywords: string[] // Category-specific keywords
}

export class PureGroundTruthCollector {
  private serpApiKey: string
  private tavilyApiKey: string
  private supabase = createServiceClient()
  private countryCodeCache: Map<string, string> = new Map()

  constructor() {
    this.serpApiKey = process.env.SERP_API_KEY || ''
    this.tavilyApiKey = process.env.TAVILY_API_KEY || ''
    
    if (!this.serpApiKey) {
      console.warn('⚠️ SERP_API_KEY not found. Google search features will be limited.')
    }
    if (!this.tavilyApiKey) {
      console.warn('⚠️ TAVILY_API_KEY not found. Forum search features will be limited.')
    }
  }

  /**
   * Initialize country code mapping cache for faster lookups
   */
  private async initializeCountryCache(): Promise<void> {
    if (this.countryCodeCache.size > 0) {
      return // Already initialized
    }

    try {
      const countries = await countriesService.getAllCountries()
      
      // Create mappings for both name -> code and code -> code
      countries.forEach(country => {
        // Map country name to country code (case insensitive)
        this.countryCodeCache.set(country.name.toLowerCase(), country.code)
        // Map country code to itself (for validation)
        this.countryCodeCache.set(country.code.toLowerCase(), country.code)
      })

      console.log(`✅ Initialized country cache with ${countries.length} countries`)
    } catch (error) {
      console.error('❌ Failed to initialize country cache:', error)
      // Set basic fallback mappings
      this.countryCodeCache.set('united states', 'us')
      this.countryCodeCache.set('us', 'us')
    }
  }

  /**
   * Step 1: Fetch Google PAA + Autocomplete questions for a specific market
   */
  async fetchGoogleQuestions(query: string, market?: string): Promise<GroundTruthQuestion[]> {
    console.log(`🔍 Fetching Google questions for: "${query}" in market: ${market || 'global'}`)
    
    if (!this.serpApiKey) {
      console.warn('⚠️ SERP API key not available, skipping Google questions')
      return []
    }

    // Convert market name to country code for Google API
    const countryCode = this.getCountryCodeFromCache(market || 'global')
    
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=${countryCode}&api_key=${this.serpApiKey}&num=10`
      console.log(`🌐 Making Google API request: ${url.replace(this.serpApiKey, '***')}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error(`❌ Google API request failed: ${response.status} - ${response.statusText}`)
        if (response.status === 429) {
          console.warn('⚠️ Rate limit hit - consider upgrading SERP API plan or implementing backoff strategy')
        }
        return []
      }

      const data = await response.json()
      console.log(`📊 Google API response keys:`, Object.keys(data))

      const questions: GroundTruthQuestion[] = []

      // Extract PAA questions
      if (data.related_questions && Array.isArray(data.related_questions)) {
        console.log(`🔍 Found ${data.related_questions.length} PAA questions`)
        data.related_questions.forEach((q: any, index: number) => {
          if (q.question) {
            console.log(`  📝 PAA ${index + 1}: ${q.question}`)
            questions.push({
              text: q.question,
              source: 'PAA',
              volume: q.search_volume || 0,
              timestamp: new Date().toISOString(),
              relevanceScore: 0,
              intentCategory: 'commercial_product',
              market: market || 'global'
            })
          }
        })
      } else {
        console.log('ℹ️ No PAA questions found in response')
      }

      // Extract autocomplete suggestions
      if (data.searches_related_to && Array.isArray(data.searches_related_to)) {
        console.log(`🔍 Found ${data.searches_related_to.length} related searches`)
        data.searches_related_to.forEach((q: any, index: number) => {
          if (q.query) {
            console.log(`  📝 Related ${index + 1}: ${q.query}`)
            questions.push({
              text: q.query,
              source: 'Autocomplete',
              volume: 0,
              timestamp: new Date().toISOString(),
              relevanceScore: 0,
              intentCategory: 'commercial_solution',
              market: market || 'global'
            })
          }
        })
      } else {
        console.log('ℹ️ No related searches found in response')
      }

      console.log(`✅ Collected ${questions.length} Google questions for "${query}" in ${market}`)
      return questions

    } catch (error) {
      console.error(`❌ Error fetching Google questions for "${query}":`, error)
      return []
    }
  }

  /**
   * Extract searchable terms from business description
   * Prioritizes brand's actual products/services over broad category patterns
   */
  private extractSearchableTerms(productsServices: string, businessCategory: string, businessCategories?: string[]): {
    primaryTerms: string[]
    industryTerms: string[]
    serviceTerms: string[]
  } {
    const text = (productsServices || businessCategory || '').toLowerCase()
    
    if (!text || text.trim().length === 0) {
      return {
        primaryTerms: [businessCategory || 'services'],
        industryTerms: [],
        serviceTerms: []
      }
    }

    console.log(`🔍 Extracting specific services from: "${text.substring(0, 100)}..."`)

    const primaryTerms: string[] = []
    const industryTerms: string[] = []
    const serviceTerms: string[] = []
    
    // PRIORITY 1: Extract exact phrases from brand's products/services description
    // This captures the brand's specific offerings rather than broad categories
    const exactServicePhrases = this.extractExactServicePhrases(text)
    primaryTerms.push(...exactServicePhrases.slice(0, 3)) // Top 3 exact services
    
    // PRIORITY 2: Extract specific service terms from the description  
    const specificServiceTerms = this.extractSpecificServiceTerms(text)
    serviceTerms.push(...specificServiceTerms.slice(0, 4)) // Top 4 specific terms
    
    // PRIORITY 3: Only use pattern matching if we don't have enough specific terms
    if (primaryTerms.length < 2) {
      const patternBasedTerms = this.extractPatternBasedTerms(text, businessCategory, businessCategories)
      primaryTerms.push(...patternBasedTerms.slice(0, 2 - primaryTerms.length))
    }
    
    // PRIORITY 4: Extract industry context terms (not for search, but for context)
    const industryContextTerms = this.extractIndustryContextTerms(text)
    industryTerms.push(...industryContextTerms.slice(0, 3))
    
    console.log(`✅ Extracted specific terms - Primary: [${primaryTerms.join(', ')}], Service: [${serviceTerms.join(', ')}]`)
    
    return {
      primaryTerms: primaryTerms.length > 0 ? primaryTerms : [businessCategory || 'services'],
      industryTerms,
      serviceTerms
    }
  }

  /**
   * Extract exact service phrases from brand description (2-4 word combinations)
   */
  private extractExactServicePhrases(text: string): string[] {
    const phrases: string[] = []
    
    // Split into sentences and extract meaningful phrases
    const sentences = text.split(/[.!?;,]+/).map(s => s.trim()).filter(s => s.length > 10)
    
    for (const sentence of sentences) {
      // Extract 2-4 word phrases that describe services
      const words = sentence.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
      
      // Extract 2-word service phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`
        if (this.isServicePhrase(phrase)) {
          phrases.push(phrase)
        }
      }
      
      // Extract 3-word service phrases
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
        if (this.isServicePhrase(phrase)) {
          phrases.push(phrase)
        }
      }
      
      // Extract 4-word service phrases (for very specific services)
      for (let i = 0; i < words.length - 3; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`
        if (this.isVerySpecificServicePhrase(phrase)) {
          phrases.push(phrase)
        }
      }
    }
    
    // Remove duplicates and prioritize longer, more specific phrases
    const uniquePhrases = [...new Set(phrases)]
    return uniquePhrases.sort((a, b) => b.length - a.length).slice(0, 5)
  }

  /**
   * Check if a phrase describes a service (not generic business terms)
   */
  private isServicePhrase(phrase: string): boolean {
    const serviceIndicators = [
      'optimization', 'development', 'management', 'consulting', 'analysis',
      'strategy', 'implementation', 'design', 'creation', 'monitoring',
      'tracking', 'reporting', 'auditing', 'testing', 'research',
      'training', 'support', 'maintenance', 'integration', 'automation'
    ]
    
    const specificServiceTerms = [
      'generative engine', 'brand visibility', 'ai discovery', 'search ranking',
      'content optimization', 'digital marketing', 'social media', 'email marketing',
      'money transfer', 'payment processing', 'mobile money', 'digital wallet',
      'web development', 'app development', 'software development', 'cloud services',
      'data analytics', 'business intelligence', 'machine learning', 'artificial intelligence'
    ]
    
    // Must contain at least one service indicator or be a known specific service
    return serviceIndicators.some(indicator => phrase.includes(indicator)) ||
           specificServiceTerms.some(term => phrase.includes(term))
  }

  /**
   * Check if a 4-word phrase is very specific and valuable
   */
  private isVerySpecificServicePhrase(phrase: string): boolean {
    const verySpecificTerms = [
      'generative engine optimization', 'artificial intelligence optimization', 'brand visibility monitoring',
      'cross border money transfer', 'mobile payment processing', 'digital wallet development',
      'custom software development', 'enterprise software solutions', 'cloud infrastructure management'
    ]
    
    return verySpecificTerms.some(term => phrase.includes(term))
  }

  /**
   * Extract specific service terms from text (individual meaningful words)
   */
  private extractSpecificServiceTerms(text: string): string[] {
    const words = text.match(/\b[a-z]{3,}\b/g) || []
    
    // Prioritize service-specific terms over generic business terms
    const serviceSpecificTerms = words.filter(word => {
      const highValueTerms = [
        'optimization', 'analytics', 'intelligence', 'automation', 'monitoring',
        'tracking', 'reporting', 'auditing', 'consulting', 'implementation',
        'integration', 'development', 'engineering', 'architecture', 'strategy'
      ]
      
      const domainSpecificTerms = [
        'fintech', 'healthtech', 'edtech', 'proptech', 'ecommerce', 'saas',
        'blockchain', 'cryptocurrency', 'machine', 'artificial', 'generative',
        'algorithmic', 'predictive', 'cognitive', 'conversational'
      ]
      
      return highValueTerms.includes(word) || domainSpecificTerms.includes(word)
    })
    
    return [...new Set(serviceSpecificTerms)]
  }

  /**
   * Fallback pattern-based extraction (only when specific terms are insufficient)
   */
  private extractPatternBasedTerms(text: string, businessCategory: string, businessCategories?: string[]): string[] {
    // Core service extraction patterns (more specific than before)
    const servicePatterns = [
      // AI & Optimization (very specific)
      { pattern: /generative\s+engine\s+optimization/i, terms: ['generative engine optimization'] },
      { pattern: /ai\s+optimization/i, terms: ['AI optimization'] },
      { pattern: /brand\s+visibility/i, terms: ['brand visibility'] },
      { pattern: /ai\s+discovery/i, terms: ['AI discovery'] },
      
      // Financial (specific services)
      { pattern: /cross\s+border\s+money\s+transfer/i, terms: ['cross border money transfer'] },
      { pattern: /mobile\s+money/i, terms: ['mobile money'] },
      { pattern: /digital\s+wallet/i, terms: ['digital wallet'] },
      { pattern: /payment\s+processing/i, terms: ['payment processing'] },
      
      // Technology (specific services) 
      { pattern: /custom\s+software\s+development/i, terms: ['custom software development'] },
      { pattern: /mobile\s+app\s+development/i, terms: ['mobile app development'] },
      { pattern: /cloud\s+infrastructure/i, terms: ['cloud infrastructure'] },
      { pattern: /data\s+analytics/i, terms: ['data analytics'] },
      
      // Only fallback to broad terms if nothing specific found
      { pattern: /(?:digital\s+)?marketing/i, terms: ['digital marketing'] },
      { pattern: /fintech/i, terms: ['fintech solutions'] },
      { pattern: /software/i, terms: ['software solutions'] }
    ]
    
    const extractedTerms: string[] = []
    
    for (const { pattern, terms } of servicePatterns) {
      if (pattern.test(text)) {
        extractedTerms.push(terms[0])
        break // Take first match to maintain specificity
      }
    }
    
    return extractedTerms
  }

  /**
   * Extract industry context terms (for understanding, not primary search)
   */
  private extractIndustryContextTerms(text: string): string[] {
    const industryTerms = [
      'technology', 'digital', 'online', 'mobile', 'cloud', 'data',
      'artificial', 'machine', 'automation', 'platform', 'software',
      'financial', 'payment', 'banking', 'crypto', 'blockchain',
      'healthcare', 'medical', 'wellness', 'fitness', 'nutrition',
      'education', 'learning', 'training', 'knowledge', 'skills',
      'retail', 'ecommerce', 'marketplace', 'shopping', 'commerce'
    ]
    
    const words = text.match(/\b[a-z]{4,}\b/g) || []
    return words.filter(word => industryTerms.includes(word)).slice(0, 3)
  }

  /**
   * Step 1.5: Discover competing brands automatically when competitors are not provided
   */
  async discoverCompetitors(context: BrandContext): Promise<string[]> {
    console.log(`🔍 Starting competitor discovery for "${context.brandName}" in category: ${context.businessCategory}`)
    
    if (!this.serpApiKey && !this.tavilyApiKey) {
      console.warn('❌ No API keys available for competitor discovery')
      return []
    }

    const discoveredCompetitors: Set<string> = new Set()
    const maxCompetitors = 8 // Limit to prevent overwhelming the system

    try {
      // Process all markets for comprehensive competitor discovery
      const markets = context.markets && context.markets.length > 0 ? context.markets : ['global']
      
      // Extract natural search terms instead of using raw productsServices
      const { primaryTerms, serviceTerms } = this.extractSearchableTerms(
        context.productsServices || '', 
        context.businessCategory || '',
        context.businessCategories
      )
      const searchableTerms = [...primaryTerms, ...serviceTerms].slice(0, 2)
      const functionalityContext = searchableTerms.length > 0 ? ` ${searchableTerms.join(' ')}` : ''
      
      // Generate search queries for all markets
      const competitorSearchQueries: string[] = []
      
      for (const market of markets) {
        const marketContext = market !== 'global' ? ` in ${market}` : ''
        
        // Base queries for each market using specific business context
        const primaryTerm = searchableTerms[0] || context.businessCategory || 'services'
        const marketQueries = [
          `"${context.brandName}" vs competitors comparison review${marketContext}${functionalityContext}`,
          `"${context.brandName}" alternative brands similar companies${marketContext}${functionalityContext}`,
          `best ${primaryTerm} companies 2024 2025 available${marketContext}`,
          `"${context.brandName}" competitor analysis market share${marketContext}`,
          `top ${primaryTerm} providers${marketContext} industry leaders`,
          `"${context.brandName}" compared to other ${primaryTerm} services${marketContext}`
        ]
        
        competitorSearchQueries.push(...marketQueries)
      }
      
      // Also add multi-market queries for broader coverage
      if (markets.length > 1 && !markets.includes('global')) {
        const multiMarketContext = ` in ${markets.slice(0, 3).join(' and ')}` // Limit to first 3 markets for readability
        const primaryTerm = searchableTerms[0] || context.businessCategory || 'services'
        competitorSearchQueries.push(
          `"${context.brandName}" competitors across${multiMarketContext}${functionalityContext}`,
          `best ${primaryTerm} providers${multiMarketContext}` // Use natural search term
        )
      }

      console.log(`🔍 Using ${competitorSearchQueries.length} competitor discovery queries across ${markets.length} market(s): [${markets.join(', ')}]`)
      console.log(`🔧 Functionality context: "${context.productsServices || 'N/A'}"`)
      if (markets.length > 1) {
        console.log(`🌍 Multi-market queries generated for comprehensive coverage`)
      }

      // Use Google Search to find competitor mentions
      if (this.serpApiKey) {
        // Intelligently limit queries based on number of markets to avoid API overload
        const maxQueries = Math.min(8, Math.max(4, markets.length * 2)) // 2 queries per market, max 8 total
        for (const query of competitorSearchQueries.slice(0, maxQueries)) {
          try {
            // Use global search for better competitor discovery
            const countryCode = 'us' // Use US for broader results
            const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=${countryCode}&api_key=${this.serpApiKey}&num=15`
            
            console.log(`🌐 Competitor search query: "${query}"`)
            const response = await fetch(url)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`📊 Search returned ${data.organic_results?.length || 0} results`)
              
              // Extract competitor names from organic results
              if (data.organic_results) {
                for (const result of data.organic_results) {
                  const title = result.title || ''
                  const snippet = result.snippet || ''
                  const fullText = `${title} ${snippet}`
                  
                  // Enhanced brand extraction patterns
                  const competitors = this.extractCompetitorNames(fullText, context.brandName, context.businessCategory)
                  competitors.forEach(competitor => {
                    if (discoveredCompetitors.size < maxCompetitors && this.isLikelyCompetitorBrand(competitor, context.businessCategory)) {
                      discoveredCompetitors.add(competitor)
                      console.log(`  ✅ Found potential competitor: "${competitor}"`)
                    }
                  })
                  
                  if (discoveredCompetitors.size >= maxCompetitors) break
                }
              }
              
              // Also check PAA questions for competitor mentions
              if (data.related_questions && discoveredCompetitors.size < maxCompetitors) {
                for (const paa of data.related_questions) {
                  const question = paa.question || ''
                  const competitors = this.extractCompetitorNames(question, context.brandName, context.businessCategory)
                  competitors.forEach(competitor => {
                    if (discoveredCompetitors.size < maxCompetitors && this.isLikelyCompetitorBrand(competitor, context.businessCategory)) {
                      discoveredCompetitors.add(competitor)
                      console.log(`  ✅ Found competitor from PAA: "${competitor}"`)
                    }
                  })
                  
                  if (discoveredCompetitors.size >= maxCompetitors) break
                }
              }
            } else {
              console.warn(`⚠️ Search API error: ${response.status}`)
            }
            
            // Rate limiting between searches
            await new Promise(resolve => setTimeout(resolve, 50))
            
          } catch (error) {
            console.error(`❌ Error in competitor search for query "${query}":`, error)
          }
          
          if (discoveredCompetitors.size >= maxCompetitors) break
        }
      }

      // Use Tavily to search forums for competitor mentions
      if (this.tavilyApiKey && discoveredCompetitors.size < maxCompetitors) {
        try {
          // Enhanced forum queries with market and functionality context
          const forumQueries: string[] = []
          
          // Generate forum queries for each market using specific business context
          for (const market of markets) {
            const marketContext = market !== 'global' ? ` in ${market}` : ''
            
            const primaryTerm = searchableTerms[0] || context.businessCategory || 'services'
            const marketForumQueries = [
              `${context.brandName} vs alternatives ${primaryTerm}${marketContext}`,
              `best ${primaryTerm} services reddit${marketContext}`,
              `${primaryTerm} comparison review reddit quora${marketContext}`,
              `${context.brandName} competitors similar providers${marketContext}`
            ]
            
            forumQueries.push(...marketForumQueries)
          }
          
          // Limit forum queries based on number of markets
          const maxForumQueries = Math.min(4, Math.max(2, markets.length)) // 1 query per market, max 4
          for (const forumQuery of forumQueries.slice(0, maxForumQueries)) {
            console.log(`🗣️ Forum competitor search: "${forumQuery}"`)
            
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: this.tavilyApiKey,
                query: forumQuery,
                search_depth: 'basic',
                max_results: 8,
                include_domains: ['reddit.com', 'quora.com']
              })
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log(`📊 Forum search returned ${data.results?.length || 0} results`)
              
              for (const result of data.results || []) {
                const fullText = `${result.title} ${result.content || ''}`
                
                // Use enhanced extraction method
                const competitors = this.extractCompetitorNames(fullText, context.brandName, context.businessCategory)
                competitors.forEach(competitor => {
                  if (discoveredCompetitors.size < maxCompetitors && this.isLikelyCompetitorBrand(competitor, context.businessCategory)) {
                    discoveredCompetitors.add(competitor)
                    console.log(`  ✅ Found forum competitor: "${competitor}"`)
                  }
                })
                
                if (discoveredCompetitors.size >= maxCompetitors) break
              }
              
              if (discoveredCompetitors.size >= maxCompetitors) break
            }
            
            // Small delay between forum queries
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error('❌ Error in forum competitor search:', error)
        }
      }

    } catch (error) {
      console.error('❌ Error in competitor discovery:', error)
    }

    const finalCompetitors = Array.from(discoveredCompetitors).slice(0, maxCompetitors)
    console.log(`🎯 Discovered ${finalCompetitors.length} competitors: [${finalCompetitors.join(', ')}]`)
    
    return finalCompetitors
  }

  /**
   * Extract competitor names from text using enhanced patterns
   */
  private extractCompetitorNames(text: string, brandName: string, businessCategory: string): string[] {
    const competitors: string[] = []
    const brandLower = brandName.toLowerCase()
    const categoryLower = businessCategory.toLowerCase()
    
    // More specific and intelligent competitor detection
    const competitorIndicators = [
      'vs', 'versus', 'compared to', 'alternative to', 'competitor', 'rival',
      'instead of', 'better than', 'similar to', 'like', 'other options'
    ]
    
    // Common exclusions to filter out generic words
    const exclusions = new Set([
      'Google', 'Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'Apple', 'Microsoft',
      'Best', 'Top', 'Company', 'Inc', 'LLC', 'Corp', 'Ltd', 'The', 'This', 'That', 'Which',
      'Payment', 'Transfer', 'Money', 'Cash', 'Bank', 'Finance', 'Financial', 'Service', 'Platform',
      'Mobile', 'Digital', 'Online', 'International', 'Global', 'Local', 'National', 'Regional',
      'Alternatives', 'Options', 'Solutions', 'Products', 'Services', 'Companies', 'Brands',
      'Most', 'Some', 'Many', 'All', 'Other', 'These', 'Those', 'Such', 'More', 'Better',
      'Coca', 'Cola', 'Holdings', 'Beverage', 'Food', 'Trustworthy', 'Logo', 'Are', 'Is', 'Was'
    ])

    // Split text into sentences for better context analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase()
      
      // Only process sentences that contain competitive indicators and the brand name
      const hasCompetitiveContext = competitorIndicators.some(indicator => 
        sentenceLower.includes(indicator)
      )
      
      const hasBrandMention = sentenceLower.includes(brandLower)
      
      if (hasCompetitiveContext || hasBrandMention) {
        // Look for direct "X vs Y" patterns
        const vsPattern = new RegExp(`\\b([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})\\s+(?:vs|versus)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})\\b`, 'g')
        const vsMatches = sentence.match(vsPattern) || []
        
        for (const match of vsMatches) {
          const parts = match.split(/\s+(?:vs|versus)\s+/i)
          for (const part of parts) {
            const cleanPart = part.trim()
            if (this.isValidCompetitorName(cleanPart, brandLower, exclusions)) {
              competitors.push(cleanPart)
            }
          }
        }
        
        // Look for "alternative to X" patterns
        const altPattern = new RegExp(`(?:alternative to|instead of|better than|similar to)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})`, 'gi')
        const altMatches = sentence.match(altPattern) || []
        
        for (const match of altMatches) {
          const competitorMatch = match.replace(/(?:alternative to|instead of|better than|similar to)\s+/i, '').trim()
          if (this.isValidCompetitorName(competitorMatch, brandLower, exclusions)) {
            competitors.push(competitorMatch)
          }
        }
        
        // Look for "like X" patterns but only in competitive context
        if (hasCompetitiveContext) {
          const likePattern = new RegExp(`(?:like|such as)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})`, 'gi')
          const likeMatches = sentence.match(likePattern) || []
          
          for (const match of likeMatches) {
            const competitorMatch = match.replace(/(?:like|such as)\s+/i, '').trim()
            if (this.isValidCompetitorName(competitorMatch, brandLower, exclusions)) {
              competitors.push(competitorMatch)
            }
          }
        }
        
        // Look for brand names in lists (comma-separated)
        if (hasCompetitiveContext) {
          const listPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})(?:\s*,\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})){2,}/g
          const listMatches = sentence.match(listPattern) || []
          
          for (const match of listMatches) {
            const brands = match.split(',').map(b => b.trim())
            for (const brand of brands) {
              if (this.isValidCompetitorName(brand, brandLower, exclusions)) {
                competitors.push(brand)
              }
            }
          }
        }
      }
    }
    
    // Remove duplicates and return unique competitors
    const uniqueCompetitors = Array.from(new Set(competitors))
    console.log(`  🎯 Extracted ${uniqueCompetitors.length} potential competitors from text analysis`)
    return uniqueCompetitors
  }

  /**
   * Helper method to validate if a detected name is a valid competitor
   */
  private isValidCompetitorName(name: string, brandLower: string, exclusions: Set<string>): boolean {
    const cleanName = name.trim()
    const nameLower = cleanName.toLowerCase()
    
    return (
      cleanName.length >= 3 && 
      cleanName.length <= 30 && 
      !nameLower.includes(brandLower) &&
      !exclusions.has(cleanName) &&
      /^[A-Z]/.test(cleanName) && // Must start with capital letter
      !/^\d/.test(cleanName) && // Must not start with number
      !/\d{3,}/.test(cleanName) && // Avoid strings with many consecutive numbers
      !/^(https?|www|http)/i.test(cleanName) && // Avoid URLs
      !/^(and|or|the|but|for|with|by|at|in|on|to|of|a|an)$/i.test(cleanName) && // Avoid common words
      /^[A-Za-z\s&]+$/.test(cleanName) && // Only letters, spaces, and ampersand
      cleanName.split(' ').length <= 3 // Maximum 3 words
    )
  }

  /**
   * Additional validation to ensure the detected name is likely a real brand/company
   */
  private isLikelyCompetitorBrand(name: string, businessCategory: string): boolean {
    const nameLower = name.toLowerCase()
    const categoryLower = businessCategory.toLowerCase()
    
    // Common non-brand words that might pass basic validation
    const genericWords = new Set([
      'alternative', 'alternatives', 'option', 'options', 'solution', 'solutions',
      'provider', 'providers', 'service', 'services', 'company', 'companies',
      'brand', 'brands', 'product', 'products', 'business', 'businesses',
      'platform', 'platforms', 'tool', 'tools', 'app', 'apps', 'software',
      'system', 'systems', 'network', 'networks', 'technology', 'technologies',
      'market', 'markets', 'industry', 'industries', 'sector', 'sectors',
      'leader', 'leaders', 'top', 'best', 'popular', 'famous', 'well known',
      'review', 'reviews', 'comparison', 'comparisons', 'analysis', 'analyses'
    ])
    
    // Check if the name is too generic
    if (genericWords.has(nameLower)) {
      return false
    }
    
    // Brand-like characteristics (proper nouns, combinations of words)
    const hasProperNounStructure = /^[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,2}$/.test(name)
    
    // Must have proper noun structure
    if (!hasProperNounStructure) {
      return false
    }
    
    // Additional category-specific validation
    if (categoryLower.includes('food') || categoryLower.includes('beverage')) {
      // For food/beverage, avoid generic food terms
      const foodGenerics = ['food', 'beverage', 'drink', 'snack', 'meal', 'recipe', 'ingredient']
      if (foodGenerics.some(term => nameLower.includes(term))) {
        return false
      }
    }
    
    if (categoryLower.includes('tech') || categoryLower.includes('software')) {
      // For tech, avoid generic tech terms
      const techGenerics = ['tech', 'software', 'app', 'digital', 'online', 'cloud', 'data']
      if (techGenerics.some(term => nameLower.includes(term))) {
        return false
      }
    }
    
    // Length and complexity checks for brand names
    return (
      name.length >= 3 &&
      name.length <= 30 &&
      !nameLower.includes('www') &&
      !nameLower.includes('.com') &&
      !/^\d+$/.test(name) && // Not just numbers
      name.split(' ').every(word => word.length >= 2) // Each word at least 2 characters
    )
  }

  /**
   * Step 2: Scrape Reddit & Quora for brand/category questions using Tavily
   */
  async fetchForumQuestions(keywords: string[], market?: string, brandContext?: BrandContext): Promise<GroundTruthQuestion[]> {
    console.log(`🗣️ Starting forum questions collection for ${keywords.length} keywords in market: ${market || 'global'}`)
    console.log(`🔑 Keywords: [${keywords.join(', ')}]`)
    
    if (!this.tavilyApiKey) {
      console.warn('❌ Tavily API key not available, skipping forum questions')
      return []
    }

    console.log('✅ Tavily API key configured, proceeding with forum search')
    const forumQuestions: GroundTruthQuestion[] = []

    for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords for performance
      // Skip empty keywords or nested arrays
      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        console.log(`⚠️ Skipping invalid keyword:`, keyword)
        continue
      }

      try {
        console.log(`🔍 Searching forums for keyword: "${keyword}"`)
        
        // Enhanced search query with market and brand functionality context
        let searchQuery = `"${keyword}" review experience problems questions`
        
        // Add market context - use provided market or include all markets from brand context
        if (market && market !== 'global') {
          searchQuery += ` in ${market}`
        } else if (!market && brandContext?.markets && brandContext.markets.length > 0) {
          // If no specific market provided but brand has markets, include them
          const marketsToInclude = brandContext.markets.filter(m => m !== 'global').slice(0, 2) // Limit to 2 markets for query length
          if (marketsToInclude.length > 0) {
            searchQuery += ` in ${marketsToInclude.join(' or ')}`
          }
        }
        
        // Add brand functionality context if available - use extracted searchable terms
        if (brandContext?.productsServices) {
          const { primaryTerms, serviceTerms } = this.extractSearchableTerms(
            brandContext.productsServices, 
            brandContext.businessCategory || '',
            brandContext.businessCategories
          )
          
          const searchableTerms = [...primaryTerms, ...serviceTerms].slice(0, 2) // Limit to 2 terms
          if (searchableTerms.length > 0) {
            searchQuery += ` ${searchableTerms.join(' ')}`
          }
        }
        
        // Add category context if available
        if (brandContext?.businessCategory) {
          searchQuery += ` ${brandContext.businessCategory}`
        }
        
        // Exclude help and support pages
        searchQuery += ` -help -support -"help center"`
        
        console.log(`📝 Enhanced search query: "${searchQuery}"`)
        
        const requestBody = {
          api_key: this.tavilyApiKey,
          query: searchQuery,
          search_depth: 'basic',
          max_results: 10,
          include_domains: ['reddit.com', 'quora.com'],
          exclude_domains: ['help.quora.com'] // Exclude help pages
        }
        console.log(`📤 Tavily API request:`, { ...requestBody, api_key: '[REDACTED]' })
        
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        console.log(`📡 Tavily API response status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`📊 Tavily returned ${data.results?.length || 0} results`)
          
          let questionsAdded = 0
          for (const result of data.results || []) {
            console.log(`🔍 Processing result from ${result.url}`)
            
            // Skip help pages and generic content
            if (result.url.includes('help.') || result.url.includes('/help/') || 
                result.title.includes('Help Center') || result.title.includes('help.')) {
              console.log(`  ⏭️ Skipping help page: ${result.title}`)
              continue
            }
            
            // Extract questions from titles and content - must be relevant to keyword
            if (result.title && result.title.includes('?') && 
                (result.title.toLowerCase().includes(keyword.toLowerCase()) || 
                 result.content?.toLowerCase().includes(keyword.toLowerCase()))) {
              const sourceType: 'Reddit' | 'Quora' = result.url.includes('reddit.com') ? 'Reddit' : 'Quora'
              const question = {
                text: result.title,
                source: sourceType,
                timestamp: new Date().toISOString(),
                relevanceScore: 0,
                intentCategory: 'commercial_solution' as const,
                market: market,
                rawData: result
              }
              forumQuestions.push(question)
              questionsAdded++
              console.log(`  ✅ Added title question: "${result.title}"`)
            }

            // Extract questions from content if available - must mention keyword
            if (result.content) {
              const sentences = result.content.split(/[.!?]+/)
              let contentQuestionsAdded = 0
              for (const sentence of sentences) {
                if (sentence.includes('?') && sentence.toLowerCase().includes(keyword.toLowerCase()) && 
                    sentence.length > 10 && sentence.length < 200) { // Reasonable length
                  const sourceType: 'Reddit' | 'Quora' = result.url.includes('reddit.com') ? 'Reddit' : 'Quora'
                  const question = {
                    text: sentence.trim() + '?',
                    source: sourceType,
                    timestamp: new Date().toISOString(),
                    relevanceScore: 0,
                    intentCategory: 'commercial_solution' as const,
                    market: market,
                    rawData: { ...result, extracted_from: 'content' }
                  }
                  forumQuestions.push(question)
                  questionsAdded++
                  contentQuestionsAdded++
                }
              }
              if (contentQuestionsAdded > 0) {
                console.log(`  ✅ Added ${contentQuestionsAdded} content questions from ${result.url}`)
              }
            }
          }
          console.log(`📈 Added ${questionsAdded} questions for keyword "${keyword}"`)
        } else {
          const errorText = await response.text()
          console.error(`❌ Tavily API error for "${keyword}": ${response.status} - ${errorText}`)
        }

        // Rate limiting
        console.log(`⏳ Waiting 500ms before next keyword...`)
        await new Promise(resolve => setTimeout(resolve, 50))

      } catch (error) {
        console.error(`❌ Forum search failed for keyword "${keyword}":`, error)
      }
    }

    console.log(`🗣️ Forum questions collection complete: ${forumQuestions.length} total questions`)
    return forumQuestions
  }

  /**
   * Step 3: Score and rank questions for relevance & intent
   */
  scoreAndRankQuestions(questions: GroundTruthQuestion[], context: BrandContext): GroundTruthQuestion[] {
    console.log(`📊 Scoring and ranking ${questions.length} questions`)

    return questions
      .map(q => {
        // Safety check for question text
        if (!q.text || typeof q.text !== 'string') {
          return { ...q, score: 0 }
        }
        
        let score = 0
        const textLower = q.text.toLowerCase()

        // Brand mention priority (highest weight)
        if (textLower.includes(context.brandName.toLowerCase())) {
          score += 50
        }

        // Category / product mention
        if (textLower.includes(context.businessCategory.toLowerCase())) {
          score += 30
        }

        // Products/services mention
        const productTerms = context.productsServices.toLowerCase().split(/[,\s]+/)
        for (const term of productTerms) {
          if (term.length > 2 && textLower.includes(term)) {
            score += 20
            break
          }
        }

        // Competitor mention
        if (context.competitors && context.competitors.length > 0) {
          // Flatten and filter competitors to handle nested arrays
          const flatCompetitors = context.competitors.flat().filter(c => c && typeof c === 'string' && c.trim().length > 0)
          if (flatCompetitors.some(c => textLower.includes(c.toLowerCase()))) {
            score += 15
          }
        }

        // Volume or forum engagement bonus
        if (q.volume && q.volume > 0) {
          score += Math.min(q.volume / 1000, 20)
        }

        // Source quality bonus
        const sourceBonus = {
          'PAA': 15,
          'Reddit': 12,
          'Quora': 10,
          'Autocomplete': 8,
          'SerpAPI': 8,
          'Forums': 5
        }
        score += sourceBonus[q.source] || 5

        // Intent classification and scoring (based on High-Intent Consumer Query Rankings)
        const transactionalDirectModifiers = ['buy', 'purchase', 'order', 'coupon', 'discount', 'deal', 'sale', 'price', 'cost']
        const transactionalLocalModifiers = ['near me', 'close by', 'open now', 'location', 'address']
        const commercialProductModifiers = ['vs', 'compare', 'review', 'best', 'top', 'affordable', 'cheapest', 'which']
        const commercialSolutionModifiers = ['for', 'with', 'that', 'to', 'how', 'what', 'why', 'when']

        if (transactionalDirectModifiers.some(m => textLower.includes(m))) {
          q.intentCategory = 'transactional_direct'
          score += 50
        } else if (transactionalLocalModifiers.some(m => textLower.includes(m))) {
          q.intentCategory = 'transactional_local'
          score += 40
        } else if (commercialProductModifiers.some(m => textLower.includes(m))) {
          q.intentCategory = 'commercial_product'
          score += 35
        } else if (commercialSolutionModifiers.some(m => textLower.includes(m))) {
          q.intentCategory = 'commercial_solution'
          score += 25
        } else if (context.brandName && textLower.includes(context.brandName.toLowerCase())) {
          q.intentCategory = 'navigational_branded'
          score += 30
        }

        // Question quality bonus (well-formed questions)
        if (q.text && q.text.includes('?') && q.text.length > 10 && q.text.length < 200) {
          score += 10
        }

        return { ...q, relevanceScore: score }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50) // Top 50 highest-intent questions
  }

  /**
   * Step 4: Remove duplicate questions
   */
  deduplicateQuestions(questions: GroundTruthQuestion[]): GroundTruthQuestion[] {
    const seen = new Set<string>()
    const unique: GroundTruthQuestion[] = []

    for (const question of questions) {
      // Safety check for question text
      if (!question.text || typeof question.text !== 'string') {
        continue
      }
      
      // Normalize text for comparison
      const normalized = question.text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!seen.has(normalized) && normalized.length > 10) {
        seen.add(normalized)
        unique.push(question)
      }
    }

    console.log(`🔄 Deduplicated ${questions.length} questions to ${unique.length} unique questions`)
    return unique
  }

  /**
   * Step 5: Generate analytics and insights
   */
  generateAnalytics(questions: GroundTruthQuestion[], context: BrandContext): {
    marketBreakdown: { [market: string]: number }
    intentBreakdown: { [intent: string]: number }
    topSources: string[]
    qualityScore: number
  } {
    const marketBreakdown: { [market: string]: number } = {}
    const intentBreakdown: { [intent: string]: number } = {}
    const sourceCount: { [source: string]: number } = {}

    for (const q of questions) {
      // Market breakdown
      const market = q.market || 'global'
      marketBreakdown[market] = (marketBreakdown[market] || 0) + 1

      // Intent breakdown
      intentBreakdown[q.intentCategory] = (intentBreakdown[q.intentCategory] || 0) + 1

      // Source count
      sourceCount[q.source] = (sourceCount[q.source] || 0) + 1
    }

    // Top sources
    const topSources = Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source]) => source)

    // Quality score (0-100)
    const highIntentCount = questions.filter(q => 
      q.intentCategory === 'transactional_direct' || 
      q.intentCategory === 'transactional_local' ||
      q.relevanceScore > 30
    ).length

    const qualityScore = Math.min(100, Math.round(
      (highIntentCount / Math.max(questions.length, 1)) * 100
    ))

    return {
      marketBreakdown,
      intentBreakdown,
      topSources,
      qualityScore
    }
  }

  /**
   * Public method to extract keywords from questions (used by API endpoints)
   */
  async extractKeywordsFromQuestions(
    brandContext: BrandContext, 
    questions: GroundTruthQuestion[]
  ): Promise<{ businessKeywords: string[]; categoryKeywords: string[] }> {
    return this.extractBusinessContextKeywords(brandContext, questions)
  }

  /**
   * Extract business context keywords from brand context and ground truth questions
   * PRIORITIZES actual brand services over generic category keywords
   * This happens in Step 1 (PAA Research) to provide keywords for Step 2 (Prompt Run)
   */
  private extractBusinessContextKeywords(
    brandContext: BrandContext, 
    questions: GroundTruthQuestion[]
  ): { businessKeywords: string[]; categoryKeywords: string[] } {
    console.log(`🔍 Extracting brand-specific keywords for ${brandContext.brandName}`)
    
    const businessKeywords: string[] = []
    const categoryKeywords: string[] = []
    
    // PRIORITY 1: Extract actual services from brand's products/services description
    const brandSpecificServices = this.extractBrandSpecificServiceKeywords(brandContext.productsServices)
    businessKeywords.push(...brandSpecificServices.slice(0, 8)) // Top 8 brand services
    console.log(`🎯 Brand-specific services: [${brandSpecificServices.join(', ')}]`)
    
    // PRIORITY 2: Extract keywords from ground truth questions (actual user queries)
    const groundTruthKeywords = this.extractGroundTruthSpecificKeywords(questions, brandContext)
    businessKeywords.push(...groundTruthKeywords.slice(0, 6)) // Top 6 from actual questions
    console.log(`📊 Ground truth keywords: [${groundTruthKeywords.join(', ')}]`)
    
    // PRIORITY 3: Add market-specific keywords (location-based)
    const marketKeywords = this.extractMarketSpecificKeywords(brandContext.markets)
    businessKeywords.push(...marketKeywords.slice(0, 6)) // Top 6 market terms
    
    // PRIORITY 4: Essential business action keywords (high commercial intent)
    const essentialBusinessKeywords = [
      'service', 'solution', 'provider', 'company', 'help', 'support',
      'best', 'top', 'compare', 'vs', 'review', 'recommend', 'price', 'cost'
    ]
    businessKeywords.push(...essentialBusinessKeywords.slice(0, 8))
    
    // PRIORITY 5: Only add category keywords if they relate to specific services
    const relevantCategoryKeywords = this.extractRelevantCategoryKeywords(brandContext, brandSpecificServices)
    categoryKeywords.push(...relevantCategoryKeywords.slice(0, 5))
    
    // Add brand name as primary keyword
    businessKeywords.unshift(brandContext.brandName.toLowerCase())
    
    const uniqueBusinessKeywords = [...new Set(businessKeywords)]
    const uniqueCategoryKeywords = [...new Set(categoryKeywords)]
    
    console.log(`✅ Extracted ${uniqueBusinessKeywords.length} brand-focused keywords, ${uniqueCategoryKeywords.length} relevant category keywords`)
    
    return {
      businessKeywords: uniqueBusinessKeywords,
      categoryKeywords: uniqueCategoryKeywords
    }
  }

  /**
   * Extract competitor keywords from brand context and questions
   * Used for generating VS prompts and alternative comparisons (PILLAR 2)
   */
  private extractCompetitorKeywords(brandContext: BrandContext, questions: GroundTruthQuestion[]): string[] {
    const competitorKeywords: string[] = []
    
    // Extract from explicit competitors list
    const competitors = (brandContext.competitors || [])
      .flat()
      .filter(c => c && typeof c === 'string' && c.trim().length > 0)
    
    competitors.forEach(competitor => {
      competitorKeywords.push(competitor.toLowerCase())
      competitorKeywords.push(`${competitor.toLowerCase()} vs`)
      competitorKeywords.push(`${competitor.toLowerCase()} alternative`)
    })
    
    // Extract competitor mentions from questions
    const questionText = questions.map(q => q.text.toLowerCase()).join(' ')
    const vsPattern = /\b([a-z]+)\s+vs\s+([a-z]+)/gi
    const matches = questionText.matchAll(vsPattern)
    
    for (const match of matches) {
      if (match[1] && match[1].length > 2) competitorKeywords.push(match[1])
      if (match[2] && match[2].length > 2) competitorKeywords.push(match[2])
    }
    
    return [...new Set(competitorKeywords)]
  }
  
  /**
   * Extract PAA question patterns (WHO, WHAT, HOW, BEST, VS, etc.)
   * Used for systematic variant generation in prompt simulator
   */
  private extractPAAPatterns(questions: GroundTruthQuestion[]): string[] {
    const patterns: string[] = []
    const patternRegexes = [
      { pattern: 'who', regex: /\b(who\s+(?:are|is|provides|offers|has)\s+[^?]+)/i },
      { pattern: 'what', regex: /\b(what\s+(?:is|are|does|makes)\s+[^?]+)/i },
      { pattern: 'how', regex: /\b(how\s+(?:to|do|does|can)\s+[^?]+)/i },
      { pattern: 'where', regex: /\b(where\s+(?:to|can|is|are)\s+[^?]+)/i },
      { pattern: 'best', regex: /\b(best\s+[^?]+)/i },
      { pattern: 'top', regex: /\b(top\s+\d*\s*[^?]+)/i },
      { pattern: 'vs', regex: /\b([a-z]+\s+vs\s+[a-z]+)/i },
      { pattern: 'alternative', regex: /\b(alternative(?:s)?\s+to\s+[^?]+)/i }
    ]
    
    questions.forEach(q => {
      const text = q.text.toLowerCase()
      patternRegexes.forEach(({ pattern, regex }) => {
        if (regex.test(text)) {
          patterns.push(pattern)
          // Extract specific pattern instance
          const match = text.match(regex)
          if (match && match[1] && match[1].length < 50) {
            patterns.push(match[1].trim())
          }
        }
      })
    })
    
    return [...new Set(patterns)]
  }
  
  /**
   * Extract brand-specific service keywords from products/services description
   */
  private extractBrandSpecificServiceKeywords(productsServices: string): string[] {
    if (!productsServices || productsServices.trim().length === 0) {
      return []
    }
    
    const text = productsServices.toLowerCase()
    const serviceKeywords: string[] = []
    
    // Extract 2-4 word service phrases (most valuable)
    const { primaryTerms, serviceTerms } = this.extractSearchableTerms(productsServices, '', [])
    serviceKeywords.push(...primaryTerms, ...serviceTerms)
    
    // Extract individual service-specific words
    const words = text.match(/\b[a-z]{3,}\b/g) || []
    const serviceWords = words.filter(word => {
      const serviceIndicatorWords = [
        'optimization', 'development', 'management', 'consulting', 'analysis',
        'strategy', 'implementation', 'monitoring', 'tracking', 'reporting',
        'automation', 'integration', 'intelligence', 'analytics', 'engineering'
      ]
      
      const domainSpecificWords = [
        'generative', 'artificial', 'machine', 'algorithmic', 'predictive',
        'conversational', 'cognitive', 'automated', 'intelligent', 'digital',
        'fintech', 'healthtech', 'edtech', 'proptech', 'ecommerce', 'saas'
      ]
      
      return serviceIndicatorWords.includes(word) || domainSpecificWords.includes(word)
    })
    
    serviceKeywords.push(...serviceWords)
    
    // Remove duplicates and prioritize longer, more specific terms
    const uniqueKeywords = [...new Set(serviceKeywords)]
    return uniqueKeywords.sort((a, b) => b.length - a.length).slice(0, 10)
  }

  /**
   * Extract specific keywords from ground truth questions (actual user queries)
   */
  private extractGroundTruthSpecificKeywords(questions: GroundTruthQuestion[], brandContext: BrandContext): string[] {
    if (!questions || questions.length === 0) {
      return []
    }
    
    const allQuestionText = questions.map(q => q.text.toLowerCase()).join(' ')
    const brandNameLower = brandContext.brandName.toLowerCase()
    
    // Extract meaningful words with brand relevance weighting
    const words = allQuestionText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'from', 'by', 'is', 'are', 'was', 'were', 'will', 'can', 'could', 'would', 'should', 'have', 'has', 'had', 'do', 'does', 'did', 'what', 'when', 'where', 'why', 'how', 'who', 'which', 'that', 'this', 'there', 'they', 'them', 'their'].includes(word)
      )
    
    // Count and weight words by brand relevance
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      let weight = 1
      
      // Higher weight for words near brand name
      if (allQuestionText.includes(`${brandNameLower} ${word}`) || 
          allQuestionText.includes(`${word} ${brandNameLower}`)) {
        weight += 3
      }
      
      // Higher weight for service-related words
      if (brandContext.productsServices?.toLowerCase().includes(word)) {
        weight += 2
      }
      
      // Higher weight for commercial intent words
      const commercialWords = ['best', 'top', 'compare', 'vs', 'review', 'price', 'cost', 'buy', 'need', 'help']
      if (commercialWords.includes(word)) {
        weight += 2
      }
      
      wordCount.set(word, (wordCount.get(word) || 0) + weight)
    })
    
    // Return most relevant words based on frequency and weight
    return Array.from(wordCount.entries())
      .filter(([word, count]) => count >= 2 && word.length > 3) // Quality threshold
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8) // Top 8 most relevant
      .map(([word]) => word)
  }

  /**
   * Extract market-specific keywords for location targeting
   */
  private extractMarketSpecificKeywords(markets: string[]): string[] {
    const marketKeywords: string[] = []
    
    markets.forEach(market => {
      const marketLower = market.toLowerCase()
      marketKeywords.push(
        marketLower,
        `in ${marketLower}`,
        `${marketLower} market`,
        `${marketLower} based`,
        `local ${marketLower}`
      )
    })
    
    return marketKeywords.slice(0, 10) // Limit to avoid too many location terms
  }

  /**
   * Extract only relevant category keywords that relate to specific brand services
   */
  private extractRelevantCategoryKeywords(brandContext: BrandContext, brandServices: string[]): string[] {
    const categoryKeywords: string[] = []
    const allCategories = [
      brandContext.businessCategory,
      ...(brandContext.businessCategories || [])
    ].map(cat => cat.toLowerCase())
    
    // Only add category keywords if they're specifically relevant to the brand's services
    const serviceLower = brandContext.productsServices?.toLowerCase() || ''
    
    // AI & Optimization services - only if actually mentioned in services
    if (brandServices.some(service => 
      service.includes('optimization') || service.includes('ai') || service.includes('intelligence')
    ) || serviceLower.includes('generative engine') || serviceLower.includes('ai optimization')) {
      categoryKeywords.push(
        'ai optimization', 'generative engine optimization', 'geo', 'ai discovery',
        'brand visibility', 'search optimization', 'ai marketing'
      )
    }
    
    // Financial services - only if actually mentioned in services
    if (brandServices.some(service => 
      service.includes('payment') || service.includes('money') || service.includes('transfer')
    ) || serviceLower.includes('fintech') || serviceLower.includes('payment')) {
      categoryKeywords.push(
        'money transfer', 'payment processing', 'digital wallet', 'mobile money',
        'fintech', 'remittance', 'financial services'
      )
    }
    
    // Technology services - only if actually mentioned in services
    if (brandServices.some(service => 
      service.includes('development') || service.includes('software') || service.includes('app')
    ) || serviceLower.includes('software') || serviceLower.includes('development')) {
      categoryKeywords.push(
        'software development', 'app development', 'web development', 'technology solutions'
      )
    }
    
    return categoryKeywords
  }

  /**
   * Enrich brand context with website information
   */
  async enrichBrandContextWithWebsite(context: BrandContext): Promise<BrandContext> {
    if (!context.website) {
      console.log('ℹ️ No website provided, skipping website context extraction')
      return context
    }

    try {
      console.log(`🌐 Extracting context from website: ${context.website}`)
      
      const extractor = new WebsiteContextExtractor()
      const websiteContext = await extractor.extractContext(context.website)
      
      if (!websiteContext) {
        console.log('⚠️ Could not extract website context')
        return context
      }

      // Enhance the context with website data
      const enrichedContext: BrandContext = {
        ...context,
        websiteContext
      }

      // Auto-suggest better business categories based on website content
      if (websiteContext.industries && websiteContext.industries.length > 0) {
        console.log(`📊 Website suggests industries: ${websiteContext.industries.join(', ')}`)
        
        // If no business categories are set, suggest based on website
        if (!enrichedContext.businessCategories || enrichedContext.businessCategories.length === 0) {
          const suggestedCategories = this.mapIndustriesToCategories(websiteContext.industries)
          if (suggestedCategories.length > 0) {
            console.log(`💡 Auto-suggesting categories: ${suggestedCategories.join(', ')}`)
            enrichedContext.businessCategories = suggestedCategories
            enrichedContext.businessCategory = suggestedCategories[0] // Primary category
          }
        }
      }

      // Enhance product/services description if empty or minimal
      if ((!context.productsServices || context.productsServices.length < 20) && websiteContext.description) {
        console.log(`📝 Enhancing product description from website`)
        enrichedContext.productsServices = websiteContext.description
      }

      // Add website-discovered target markets
      if (websiteContext.targetMarkets && websiteContext.targetMarkets.length > 0) {
        const existingMarkets = new Set(context.markets.map(m => m.toLowerCase()))
        const newMarkets = websiteContext.targetMarkets.filter(m => 
          !existingMarkets.has(m.toLowerCase())
        )
        
        if (newMarkets.length > 0) {
          console.log(`🎯 Adding website-discovered markets: ${newMarkets.join(', ')}`)
          enrichedContext.markets = [...context.markets, ...newMarkets]
        }
      }

      console.log(`✅ Successfully enriched brand context with website data`)
      return enrichedContext

    } catch (error) {
      console.error(`❌ Error enriching brand context with website:`, error)
      return context
    }
  }

  /**
   * Map website industries to business categories
   */
  private mapIndustriesToCategories(industries: string[]): string[] {
    const categoryMap: Record<string, string[]> = {
      'marketing': ['marketing_advertising', 'digital_marketing', 'seo_sem'],
      'technology': ['technology_software', 'ai_machine_learning', 'saas_platforms'],
      'finance': ['financial_services', 'fintech', 'payment_processing'],
      'healthcare': ['healthcare_medical', 'telemedicine', 'health_wellness'],
      'education': ['education_training', 'e_learning', 'professional_development'],
      'retail': ['e_commerce_retail', 'marketplace', 'consumer_goods'],
      'consulting': ['business_consulting', 'management_consulting', 'professional_services'],
      'media': ['media_entertainment', 'content_creation', 'digital_media']
    }

    const suggestedCategories: string[] = []
    
    for (const industry of industries) {
      const categories = categoryMap[industry.toLowerCase()]
      if (categories) {
        suggestedCategories.push(...categories)
      }
    }

    // Remove duplicates and limit to top 3
    return [...new Set(suggestedCategories)].slice(0, 3)
  }

  /**
   * Main method: Aggregate all ground truth questions ready for AI prompt expansion
   */
  async collectGroundTruth(context: BrandContext): Promise<GroundTruthResult> {
    console.log(`🚀 Starting ground truth collection for brand: "${context.brandName}"`)
    
    // Skip website enrichment for speed unless products/services is very generic
    let enrichedContext = context
    const needsWebsiteEnrichment = (!context.productsServices || 
      context.productsServices.length < 20 || 
      context.productsServices.toLowerCase().includes('various') ||
      context.productsServices.toLowerCase().includes('general'))
    
    if (needsWebsiteEnrichment && context.website) {
      console.log('🌐 Basic products/services detected, enriching with website context...')
      enrichedContext = await this.enrichBrandContextWithWebsite(context)
    } else {
      console.log('⚡ Sufficient brand context provided, skipping website extraction for speed')
    }
    
    console.log(`🌍 Target markets: [${enrichedContext.markets.join(', ')}] (${enrichedContext.markets.length} markets)`)
    console.log(`🏢 Business category: ${enrichedContext.businessCategory}`)
    console.log(`🔧 Products/Services: ${enrichedContext.productsServices}`)
    
    // Clean and display competitors
    let cleanCompetitors = (enrichedContext.competitors || []).flat().filter(c => c && typeof c === 'string' && c.trim().length > 0)
    console.log(`👥 Initial competitors: [${cleanCompetitors.join(', ')}] (${cleanCompetitors.length} valid competitors)`)
    
    // Automatically discover competitors if none provided or very few provided
    if (cleanCompetitors.length < 3) {
      console.log(`🔍 Auto-discovering competitors (current count: ${cleanCompetitors.length} < 3)`)
      const discoveredCompetitors = await this.discoverCompetitors(enrichedContext)
      
      // Merge discovered competitors with existing ones, avoiding duplicates
      const existingLower = cleanCompetitors.map(c => c.toLowerCase())
      const newCompetitors = discoveredCompetitors.filter(c => 
        !existingLower.includes(c.toLowerCase())
      )
      
      cleanCompetitors = [...cleanCompetitors, ...newCompetitors]
      console.log(`🎯 Enhanced competitors list: [${cleanCompetitors.join(', ')}] (${cleanCompetitors.length} total)`)
      
      // Update context with enhanced competitors for downstream processing
      enrichedContext.competitors = cleanCompetitors
    } else {
      console.log(`✅ Sufficient competitors provided (${cleanCompetitors.length} >= 3), skipping auto-discovery`)
    }
    
    // Initialize country cache for consistent country code lookups
    await this.initializeCountryCache()
    
    const startTime = Date.now()
    let allQuestions: GroundTruthQuestion[] = []

    // Build search queries using brand-specific services instead of broad categories
    const { primaryTerms, serviceTerms } = this.extractSearchableTerms(
      enrichedContext.productsServices || '', 
      enrichedContext.businessCategory || '',
      enrichedContext.businessCategories
    )
    const specificServices = [...primaryTerms, ...serviceTerms].slice(0, 3) // Top 3 most specific services
    const primaryService = specificServices[0] || enrichedContext.businessCategory || 'services'
    
    console.log(`🎯 Using brand-specific services for search: [${specificServices.join(', ')}]`)
    
    // Create highly targeted search queries focused on what the brand actually does
    const searchQueries = [
      // Core brand queries (unchanged)
      enrichedContext.brandName,
      `${enrichedContext.brandName} reviews`,
      `${enrichedContext.brandName} vs competitors`,
      
      // Brand + specific service queries (most important for discoverability)
      ...specificServices.map(service => `${enrichedContext.brandName} ${service}`),
      
      // Service-specific market queries (without brand - for competitor discovery)
      ...enrichedContext.markets.flatMap(market => 
        specificServices.slice(0, 2).map(service => `best ${service} in ${market}`)
      ).slice(0, 4), // Limit to top 2 services x 2 primary markets = 4 queries max
      
      // Brand-specific market queries
      ...enrichedContext.markets.slice(0, 2).map(market => `${enrichedContext.brandName} in ${market}`),
      
      // Service provider queries (specific service + location)
      ...enrichedContext.markets.slice(0, 2).map(market => `${primaryService} providers ${market}`),
      
      // Service comparison queries (specific service + comparison intent)
      ...specificServices.slice(0, 2).map(service => `${service} companies comparison`),
      
      // Problem-solution queries (what problems does the service solve)
      ...specificServices.slice(0, 2).map(service => `need ${service} help`),
      
      // Avoid generic category queries - only use if no specific services found
      ...(specificServices.length === 0 ? 
        enrichedContext.markets.slice(0, 2).map(market => `${enrichedContext.businessCategory} companies ${market}`) : 
        []
      )
    ].filter(q => q && q.length > 5 && q !== enrichedContext.brandName) // Remove very short or duplicate queries

    console.log(`📝 Generated ${searchQueries.length} service-specific search queries:`)
    searchQueries.forEach((query, index) => {
      console.log(`  ${index + 1}. "${query}"`)
    })

    // Process all markets in parallel for maximum speed
    console.log(`🚀 Processing ${context.markets.length} markets in parallel for optimal performance`)
    
    const marketTasks = context.markets.map(async (market, i) => {
      console.log(`🌍 Market ${i + 1}/${context.markets.length}: "${market}"`)
      
      let marketGoogleQuestions = 0
      let marketForumQuestions = 0

      // Process Google queries in parallel for this market
      const limitedQueries = searchQueries.slice(0, 4) // Top 4 queries for performance
      const googleTasks = limitedQueries.map(async (query, j) => {
        console.log(`  🔍 Query ${j + 1}/4: "${query}" in ${market}`)
        const googleQuestions = await this.fetchGoogleQuestions(query, market)
        console.log(`    ✅ Added ${googleQuestions.length} Google questions`)
        return googleQuestions
      })

      // Execute all Google queries for this market in parallel
      const googleResults = await Promise.all(googleTasks)
      const allGoogleQuestions = googleResults.flat()
      marketGoogleQuestions = allGoogleQuestions.length

      // Forum questions (Reddit / Quora) using targeted brand and service keywords
      const forumKeywords = [
        enrichedContext.brandName,
        // Use the extracted specific services instead of verbose descriptions
        ...specificServices.slice(0, 2), // Primary business services
        // Use the enhanced competitors list (including discovered ones) 
        ...cleanCompetitors.slice(0, 2) // Limit competitors for performance
      ].filter(keyword => keyword && keyword.length > 2).slice(0, 4) // Ensure quality and limit total

      console.log(`  🗣️ Forum search with keywords: [${forumKeywords.join(', ')}]`)
      const forumQuestions = await this.fetchForumQuestions(forumKeywords, market, enrichedContext)
      marketForumQuestions = forumQuestions.length
      console.log(`    ✅ Added ${forumQuestions.length} forum questions`)
      
      console.log(`  📈 Market "${market}" total: ${marketGoogleQuestions + marketForumQuestions} questions`)
      
      return [...allGoogleQuestions, ...forumQuestions]
    })

    // Wait for all markets to complete in parallel
    const allMarketResults = await Promise.all(marketTasks)
    allQuestions.push(...allMarketResults.flat())

    // Process collected questions
    console.log(`\n� Raw collection complete: ${allQuestions.length} total questions`)
    console.log(`🔄 Starting deduplication and processing...`)
    
    // Remove duplicates
    const uniqueQuestions = this.deduplicateQuestions(allQuestions)
    console.log(`🔍 After deduplication: ${uniqueQuestions.length} unique questions`)
    
    // Score and rank
    console.log(`📊 Scoring and ranking questions...`)
    const topQuestions = this.scoreAndRankQuestions(uniqueQuestions, enrichedContext)
    console.log(`🏆 Top-ranked questions: ${topQuestions.length}`)
    
    // Generate analytics
    console.log(`📈 Generating analytics...`)
    const analytics = this.generateAnalytics(topQuestions, enrichedContext)
    
    // Count high-intent questions
    const highIntentQuestions = topQuestions.filter(q => 
      q.intentCategory === 'transactional_direct' || 
      q.intentCategory === 'transactional_local' ||
      q.relevanceScore > 30
    ).length

    // Extract business context keywords for Step 2 (Prompt Run)
    const keywordExtraction = this.extractBusinessContextKeywords(enrichedContext, topQuestions)

    const collectionTime = Date.now() - startTime
    
    const result: GroundTruthResult = {
      brandContext: enrichedContext,
      questions: topQuestions,
      totalQuestions: topQuestions.length,
      highIntentQuestions,
      marketBreakdown: analytics.marketBreakdown,
      intentBreakdown: analytics.intentBreakdown,
      topSources: analytics.topSources,
      collectionTimestamp: new Date().toISOString(),
      qualityScore: analytics.qualityScore,
      businessKeywords: keywordExtraction.businessKeywords,
      categoryKeywords: keywordExtraction.categoryKeywords
    }

    console.log(`\n🎉 Ground truth collection completed in ${collectionTime}ms`)
    console.log(`📊 Final Results:`)
    console.log(`  • Total questions: ${topQuestions.length}`)
    console.log(`  • High-intent questions: ${highIntentQuestions}`)
    console.log(`  • Quality score: ${analytics.qualityScore}%`)
    console.log(`  • Markets processed: ${enrichedContext.markets.length}`)
    console.log(`  • Top sources: ${analytics.topSources.join(', ')}`)
    console.log(`\n🔑 Extracted Keywords for Prompt Simulator:`)
    console.log(`  • Business keywords (${keywordExtraction.businessKeywords.length}): ${keywordExtraction.businessKeywords.slice(0, 10).join(', ')}${keywordExtraction.businessKeywords.length > 10 ? '...' : ''}`)
    console.log(`  • Category keywords (${keywordExtraction.categoryKeywords.length}): ${keywordExtraction.categoryKeywords.slice(0, 10).join(', ')}${keywordExtraction.categoryKeywords.length > 10 ? '...' : ''}`)

    // Store results if userId provided
    if (enrichedContext.userId) {
      console.log(`💾 Storing results for user: ${enrichedContext.userId}`)
      await this.storeGroundTruthResults(enrichedContext.userId, result)
    }

    return result
  }

  /**
   * Store ground truth results in database with enhanced brand context
   */
  private async storeGroundTruthResults(userId: string, result: GroundTruthResult): Promise<void> {
    try {
      console.log(`💾 Storing enhanced ground truth results for ${result.brandContext.brandName}`)
      
      // Extract business categories (handle both single and multiple categories)
      const businessCategories = result.brandContext.businessCategories && result.brandContext.businessCategories.length > 0
        ? result.brandContext.businessCategories
        : [result.brandContext.businessCategory].filter(Boolean)
      
      // Extract keywords for enhanced searchability
      const extractedKeywords = [
        ...result.businessKeywords,
        ...result.categoryKeywords
      ].filter(Boolean).slice(0, 20) // Limit to top 20 keywords
      
      // Extract discovered competitors (including auto-discovered ones)
      const discoveredCompetitors = (result.brandContext.competitors || [])
        .flat()
        .filter(c => c && typeof c === 'string' && c.trim().length > 0)
        .slice(0, 10) // Limit competitors
      
      // Prepare competitor data for storage
      const competitorData = {
        discovered: discoveredCompetitors,
        auto_discovered: discoveredCompetitors.length > (result.brandContext.competitors?.length || 0),
        discovery_method: 'serp_api_tavily',
        discovery_timestamp: new Date().toISOString()
      }
      
      // Prepare source metadata
      const sourceMetadata = {
        collection_duration_ms: Date.now() - new Date(result.collectionTimestamp).getTime(),
        api_sources: result.topSources,
        markets_processed: result.brandContext.markets,
        search_queries_used: result.businessKeywords.slice(0, 5), // Top search terms used
        website_context: result.brandContext.websiteContext ? {
          url: result.brandContext.website,
          industries: result.brandContext.websiteContext.industries,
          target_markets: result.brandContext.websiteContext.targetMarkets
        } : null
      }
      
      // Use the enhanced database function with proper brand relationships
      const { data, error } = await this.supabase
        .rpc('store_enhanced_ground_truth_collection', {
          p_user_id: userId,
          p_brand_name: result.brandContext.brandName,
          p_business_category: result.brandContext.businessCategory,
          p_markets: result.brandContext.markets,
          p_total_questions: result.totalQuestions,
          p_high_intent_questions: result.highIntentQuestions,
          p_quality_score: result.qualityScore,
          p_market_breakdown: result.marketBreakdown,
          p_intent_breakdown: result.intentBreakdown,
          p_top_sources: result.topSources,
          p_questions_data: {
            questions: result.questions,
            collection_timestamp: result.collectionTimestamp,
            business_keywords: result.businessKeywords,
            category_keywords: result.categoryKeywords
          },
          p_business_categories: businessCategories,
          p_collection_type: 'comprehensive',
          p_competitor_data: competitorData,
          p_source_metadata: sourceMetadata,
          p_keywords_extracted: extractedKeywords,
          p_competitors_discovered: discoveredCompetitors
        })

      if (error) {
        console.error('❌ Error storing enhanced ground truth results:', error)
        
        // Fallback to basic storage if enhanced function fails
        console.log('🔄 Attempting fallback storage...')
        const { error: fallbackError } = await this.supabase
          .from('ground_truth_collections')
          .insert({
            clerk_id: userId,
            brand_name: result.brandContext.brandName,
            business_category: result.brandContext.businessCategory,
            markets: result.brandContext.markets,
            total_questions: result.totalQuestions,
            high_intent_questions: result.highIntentQuestions,
            quality_score: result.qualityScore,
            market_breakdown: result.marketBreakdown,
            intent_breakdown: result.intentBreakdown,
            top_sources: result.topSources,
            questions_data: result.questions,
            created_at: new Date().toISOString()
          })
        
        if (fallbackError) {
          console.error('❌ Fallback storage also failed:', fallbackError)
        } else {
          console.log('✅ Fallback storage succeeded')
        }
      } else {
        console.log(`✅ Enhanced ground truth results stored successfully with ID: ${data}`)
        console.log(`📊 Stored: ${result.totalQuestions} questions, ${discoveredCompetitors.length} competitors, ${extractedKeywords.length} keywords`)
      }
    } catch (error) {
      console.error('❌ Error in enhanced storeGroundTruthResults:', error)
    }
  }

  /**
   * Get country code for market using cached country data
   */
  private getCountryCodeFromCache(market?: string): string {
    if (!market || market === 'global') {
      console.log(`📍 Using default country code: us for market: ${market}`)
      return 'us'
    }

    const normalizedMarket = market.toLowerCase()
    const countryCode = this.countryCodeCache.get(normalizedMarket)
    
    if (countryCode) {
      console.log(`📍 Using country code: ${countryCode} for market: ${market}`)
      return countryCode
    }

    // Fallback to 'us' if not found
    console.log(`⚠️ Country not found for market: ${market}, using fallback: us`)
    return 'us'
  }

  /**
   * Quick ground truth collection for API responses
   * Now processes all markets instead of just the first one and includes competitor discovery
   */
  async collectQuickGroundTruth(context: BrandContext): Promise<GroundTruthQuestion[]> {
    console.log(`⚡ Quick ground truth collection for ${context.brandName}`)
    console.log(`🌍 Processing all markets: [${context.markets.join(', ')}]`)

    // Initialize country cache for consistent country code lookups
    await this.initializeCountryCache()

    // Quick competitor discovery if none provided
    let enhancedContext = { ...context }
    const existingCompetitors = (context.competitors || []).flat().filter(c => c && typeof c === 'string' && c.trim().length > 0)
    
    if (existingCompetitors.length < 2) {
      console.log(`🔍 Quick competitor discovery (${existingCompetitors.length} < 2)`)
      const quickCompetitors = await this.discoverCompetitors(context)
      enhancedContext.competitors = [...existingCompetitors, ...quickCompetitors.slice(0, 3)] // Limit for speed
      console.log(`🎯 Enhanced with ${quickCompetitors.slice(0, 3).length} discovered competitors`)
    }

    const allQuestions: GroundTruthQuestion[] = []

    // Process all markets in parallel for speed (maintaining rate limits)
    // Use targeted search queries combining brand, products/services, and markets for quick collection
    const { primaryTerms, serviceTerms } = this.extractSearchableTerms(
      enhancedContext.productsServices || '', 
      enhancedContext.businessCategory || '',
      enhancedContext.businessCategories
    )
    const searchableTerms = [...primaryTerms, ...serviceTerms].slice(0, 2)
    const primaryTerm = searchableTerms[0] || enhancedContext.businessCategory || 'services'
    
    // Create targeted quick queries focusing on brand + primary service/product
    const keyQueries = [
      enhancedContext.brandName, 
      `${enhancedContext.brandName} ${primaryTerm}`, // Brand + main service/product
      `best ${primaryTerm}`, // Competitive context in market
      `${primaryTerm} providers` // Industry providers for competitive intelligence
    ]
    console.log(`🔍 Key queries using specific business context: [${keyQueries.join(', ')}]`)
    console.log(`🚀 Processing ${enhancedContext.markets.length} markets in parallel`)

    // Create parallel market processing tasks
    const marketTasks = enhancedContext.markets.map(async (market, i) => {
      console.log(`  🌍 Market ${i + 1}/${enhancedContext.markets.length}: ${market}`)
      const marketQuestions: GroundTruthQuestion[] = []
      
      // Process Google queries for this market in parallel
      const googleTasks = keyQueries.map(async (query) => {
        console.log(`    🔍 Query: "${query}" in ${market}`)
        const questions = await this.fetchGoogleQuestions(query, market)
        console.log(`    ✅ Added ${Math.min(questions.length, 5)} questions`)
        return questions.slice(0, 5) // Limit results per query
      })
      
      // Execute Google queries in parallel for this market
      const googleResults = await Promise.all(googleTasks)
      marketQuestions.push(...googleResults.flat())
      
      // Quick forum search for this market using enhanced competitor list
      const forumKeyword = enhancedContext.competitors && enhancedContext.competitors.length > 0 
        ? enhancedContext.competitors[0] 
        : enhancedContext.brandName
      console.log(`    🗣️ Forum search for "${forumKeyword}" in ${market}`)
      
      // Small delay for API rate limiting (minimal)
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 25))
      
      const forumQuestions = await this.fetchForumQuestions([forumKeyword], market, enhancedContext)
      marketQuestions.push(...forumQuestions.slice(0, 3))
      console.log(`    ✅ Added ${Math.min(forumQuestions.length, 3)} forum questions`)
      
      return marketQuestions
    })

    // Wait for all markets to complete
    const allMarketResults = await Promise.all(marketTasks)
    allQuestions.push(...allMarketResults.flat())

    // Process and return top results
    const uniqueQuestions = this.deduplicateQuestions(allQuestions)
    const topQuestions = this.scoreAndRankQuestions(uniqueQuestions, enhancedContext).slice(0, 10)

    console.log(`⚡ Quick collection completed: ${topQuestions.length} top questions from ${enhancedContext.markets.length} markets`)
    return topQuestions
  }
}

export default PureGroundTruthCollector