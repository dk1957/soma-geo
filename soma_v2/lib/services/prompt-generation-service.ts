/**
 * Unified Prompt Generation Service
 * ==================================
 * Single source of truth for ALL prompt generation across Soma AI.
 *
 * Consolidates three previous systems:
 *   1. HighIntentPromptSimulator (lib/services/high-intent-prompt-simulator.ts)
 *   2. Suggestions route (app/api/content/prompts/suggestions/route.ts)
 *   3. Free-audit route (app/api/onboarding/free-audit/generate-prompts/route.ts)
 *
 * Goal: understand the brand, industry, services, products, and the questions
 * their current and potential customers/audiences will ask — questions likely
 * to lead to the brand or competitors being mentioned, recommended, or discussed.
 *
 * Three-Pillar Strategy (SEO-inspired):
 *   1. Brand Defense  (2 prompts) — user already knows the brand
 *   2. Category Capture (3 prompts) — user shopping the category
 *   3. Solution Discovery (3 prompts) — user describing a problem
 */

import { getSystemPrompt, getPromptPair } from '@/lib/services/config-service'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchSearchTrends, formatTrendsForPrompt, type SearchTrendsResult } from '@/lib/services/search-trends-service'

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface PromptGenerationInput {
  brandName: string
  brandCategory?: string
  productsServices?: string
  targetMarkets?: string[]
  competitors?: string[]
  brandWebsite?: string
  brandDescription?: string
  brandKeywords?: string[]
  targetAudience?: string
  businessModel?: string
  businessType?: string
  topics?: string[]
  selectedStates?: string[]
  /** Max prompts to return (default 8) */
  maxPrompts?: number
  /** Scrape brand website for richer context (default false) */
  scrapeWebsite?: boolean
}

export interface GeneratedPrompt {
  id: string
  text: string
  category: 'brand_defense' | 'category_capture' | 'solution_discovery'
  priority: number
  rationale: string
  intent?: string
  confidence?: number
  market?: string
}

export interface PromptGenerationResult {
  prompts: GeneratedPrompt[]
  source: 'llm' | 'fallback'
  websiteScraped: boolean
  model?: string
  /** Whether real search trends data was used to enhance prompt generation */
  searchTrendsUsed: boolean
  /** Number of real search trends fed to the LLM */
  searchTrendsCount?: number
}

// ────────────────────────────────────────────────────────────────────
// Country & Category Expansion Maps
// ────────────────────────────────────────────────────────────────────

const COUNTRY_CONTEXT: Record<string, { name: string; cities: string[]; context: string }> = {
  // Africa
  ng: { name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'], context: 'West African' },
  gh: { name: 'Ghana', cities: ['Accra', 'Kumasi', 'Tema'], context: 'West African' },
  ke: { name: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu'], context: 'East African' },
  za: { name: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'], context: 'Southern African' },
  eg: { name: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza'], context: 'North African' },
  ug: { name: 'Uganda', cities: ['Kampala', 'Entebbe', 'Jinja'], context: 'East African' },
  tz: { name: 'Tanzania', cities: ['Dar es Salaam', 'Dodoma', 'Arusha'], context: 'East African' },
  rw: { name: 'Rwanda', cities: ['Kigali', 'Butare', 'Gisenyi'], context: 'East African' },
  et: { name: 'Ethiopia', cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle'], context: 'East African' },
  // Europe
  uk: { name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'], context: 'British' },
  gb: { name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'], context: 'British' },
  de: { name: 'Germany', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'], context: 'German' },
  fr: { name: 'France', cities: ['Paris', 'Lyon', 'Marseille'], context: 'French' },
  // Americas
  us: { name: 'United States', cities: ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin'], context: 'American' },
  ca: { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal'], context: 'Canadian' },
  br: { name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'], context: 'Brazilian' },
  mx: { name: 'Mexico', cities: ['Mexico City', 'Guadalajara', 'Monterrey'], context: 'Mexican' },
  // Middle East
  ae: { name: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah'], context: 'Middle Eastern' },
  sa: { name: 'Saudi Arabia', cities: ['Riyadh', 'Jeddah', 'Dammam'], context: 'Middle Eastern' },
  il: { name: 'Israel', cities: ['Tel Aviv', 'Jerusalem', 'Haifa'], context: 'Middle Eastern' },
  // Asia Pacific
  in: { name: 'India', cities: ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad'], context: 'Indian' },
  sg: { name: 'Singapore', cities: ['Singapore'], context: 'Southeast Asian' },
  au: { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane'], context: 'Australian' },
  nz: { name: 'New Zealand', cities: ['Auckland', 'Wellington', 'Christchurch'], context: 'New Zealand' },
  jp: { name: 'Japan', cities: ['Tokyo', 'Osaka', 'Yokohama'], context: 'Japanese' },
  kr: { name: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon'], context: 'South Korean' },
}

const CATEGORY_EXPANSION: Record<string, { products: string[]; services: string[]; keywords: string[] }> = {
  food_beverages: { products: ['beverages', 'alcoholic drinks', 'soft drinks', 'snacks', 'food products'], services: ['food delivery', 'catering', 'beverage distribution'], keywords: ['beer brands', 'soft drink brands', 'food brands', 'beverage companies', 'drink options'] },
  beverages: { products: ['beer', 'soft drinks', 'energy drinks', 'alcoholic beverages', 'spirits'], services: ['beverage distribution', 'bar services', 'drink catering'], keywords: ['best beer', 'popular drinks', 'refreshing beverages', 'drink brands'] },
  beer: { products: ['lager beer', 'craft beer', 'light beer', 'premium beer', 'imported beer'], services: ['beer delivery', 'bar supplies', 'brewery tours'], keywords: ['best beer brands', 'popular beer', 'light beer options', 'beer recommendations'] },
  alcohol: { products: ['beer', 'wine', 'spirits', 'whiskey', 'vodka'], services: ['alcohol delivery', 'bar services', 'liquor distribution'], keywords: ['best alcohol brands', 'popular drinks', 'premium spirits'] },
  saas: { products: ['cloud software', 'subscription platforms', 'web applications'], services: ['software delivery', 'cloud hosting', 'API services'], keywords: ['enterprise software', 'business tools', 'productivity apps'] },
  fintech: { products: ['payment processors', 'digital wallets', 'lending platforms'], services: ['payment processing', 'financial APIs', 'banking services'], keywords: ['mobile payments', 'digital banking', 'financial technology'] },
  ai: { products: ['AI tools', 'machine learning platforms', 'automation software'], services: ['AI consulting', 'ML model development', 'data analysis'], keywords: ['artificial intelligence', 'smart automation', 'predictive analytics'] },
  analytics: { products: ['analytics dashboards', 'reporting tools', 'data visualization'], services: ['data analytics', 'business intelligence', 'insights reporting'], keywords: ['metrics tracking', 'performance analysis', 'data-driven decisions'] },
  marketing: { products: ['marketing automation', 'CRM systems', 'email platforms'], services: ['digital marketing', 'campaign management', 'lead generation'], keywords: ['marketing tools', 'customer engagement', 'brand awareness'] },
  ecommerce: { products: ['online stores', 'shopping platforms', 'inventory systems'], services: ['e-commerce solutions', 'payment integration', 'fulfillment'], keywords: ['online retail', 'digital commerce', 'marketplace'] },
  consulting: { products: ['advisory services', 'strategy frameworks', 'assessment tools'], services: ['business consulting', 'strategy development', 'change management'], keywords: ['expert advice', 'business transformation', 'strategic planning'] },
  legal: { products: ['legal tech', 'contract management', 'compliance tools'], services: ['legal advisory', 'corporate law', 'regulatory compliance'], keywords: ['legal services', 'law firms', 'legal counsel'] },
  accounting: { products: ['accounting software', 'bookkeeping tools', 'tax platforms'], services: ['accounting services', 'audit support', 'financial reporting'], keywords: ['financial management', 'tax planning', 'bookkeeping'] },
  healthcare: { products: ['dental care', 'primary care', 'urgent care', 'specialist clinics', 'patient portals'], services: ['dental services', 'family medicine', 'cosmetic dentistry', 'pediatrics', 'telemedicine'], keywords: ['best dentist', 'doctor near me', 'family doctor', 'dental clinic', 'healthcare provider'] },
  wellness: { products: ['wellness apps', 'fitness platforms', 'health trackers'], services: ['wellness programs', 'fitness coaching', 'mental health support'], keywords: ['health and wellness', 'fitness solutions', 'wellbeing'] },
  edtech: { products: ['learning platforms', 'educational software', 'course tools'], services: ['online education', 'training delivery', 'skills development'], keywords: ['e-learning', 'digital education', 'online courses'] },
  'real estate': { products: ['property platforms', 'real estate software', 'listing tools'], services: ['property management', 'real estate brokerage', 'property investment'], keywords: ['property solutions', 'real estate services', 'property tech'] },
  retail: { products: ['consumer goods', 'retail products', 'shopping items'], services: ['retail services', 'customer support', 'delivery'], keywords: ['best brands', 'top products', 'popular items', 'consumer reviews'] },
  fashion: { products: ['clothing', 'apparel', 'accessories', 'footwear'], services: ['fashion retail', 'styling services', 'clothing delivery'], keywords: ['best fashion brands', 'popular clothing', 'style recommendations'] },
  travel: { products: ['travel packages', 'flight bookings', 'hotel stays'], services: ['travel planning', 'tour services', 'vacation packages'], keywords: ['best travel deals', 'vacation destinations', 'travel recommendations'] },
  hospitality: { products: ['hotel accommodations', 'resort stays', 'dining experiences'], services: ['hotel services', 'restaurant services', 'event hosting'], keywords: ['best hotels', 'top restaurants', 'hospitality recommendations'] },
  dental: { products: ['dental care', 'teeth whitening', 'dental implants', 'braces', 'cosmetic dentistry'], services: ['general dentistry', 'cosmetic dentistry', 'pediatric dentistry', 'emergency dental'], keywords: ['best dentist', 'dentist near me', 'affordable dental care', 'dental clinic reviews'] },
  restaurant: { products: ['dining experiences', 'takeout', 'catering menus', 'meal kits'], services: ['dine-in', 'delivery', 'catering', 'reservations'], keywords: ['best restaurants', 'top rated restaurants', 'places to eat', 'restaurant recommendations'] },
  restaurants: { products: ['dining experiences', 'takeout', 'catering menus', 'meal kits'], services: ['dine-in', 'delivery', 'catering', 'reservations'], keywords: ['best restaurants', 'top rated restaurants', 'places to eat', 'restaurant recommendations'] },
  fitness: { products: ['gym memberships', 'fitness equipment', 'workout programs', 'supplements'], services: ['personal training', 'group fitness', 'yoga classes', 'nutrition coaching'], keywords: ['best gym', 'fitness near me', 'personal trainer', 'workout recommendations'] },
  beauty: { products: ['skincare', 'hair products', 'cosmetics', 'treatments'], services: ['hair styling', 'spa treatments', 'nail services', 'facials'], keywords: ['best salon', 'beauty services', 'hair stylist near me', 'spa recommendations'] },
}

// Consumer-facing categories for B2C vs B2B detection
const CONSUMER_CATEGORIES = [
  'food_beverages', 'beverages', 'beer', 'alcohol', 'fashion', 'retail',
  'travel', 'hospitality', 'wellness', 'entertainment', 'media', 'sports',
  'automotive', 'beauty', 'consumer_goods', 'restaurants', 'restaurant',
  'healthcare', 'health', 'dental', 'fitness', 'salon', 'spa', 'cleaning',
  'plumbing', 'roofing', 'landscaping', 'pest_control', 'hvac', 'moving',
  'photography', 'real_estate', 'tutoring', 'daycare', 'pet', 'veterinary',
  'auto_repair', 'home_services',
]

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function expandMarket(market: string): { fullName: string; cities: string[]; context: string; isGlobal: boolean } {
  const normalized = market.toLowerCase().trim()
  if (COUNTRY_CONTEXT[normalized]) {
    return { ...COUNTRY_CONTEXT[normalized], fullName: COUNTRY_CONTEXT[normalized].name, isGlobal: false }
  }
  const byName = Object.values(COUNTRY_CONTEXT).find(c => c.name.toLowerCase() === normalized)
  if (byName) return { ...byName, fullName: byName.name, isGlobal: false }
  if (['global', 'worldwide', ''].includes(normalized)) {
    return { fullName: 'Global', cities: [], context: 'international', isGlobal: true }
  }
  return { fullName: market, cities: [], context: market, isGlobal: false }
}

function expandCategory(category: string): { products: string[]; services: string[]; keywords: string[] } {
  const normalized = category.toLowerCase().trim()
  if (CATEGORY_EXPANSION[normalized]) return CATEGORY_EXPANSION[normalized]
  for (const [key, value] of Object.entries(CATEGORY_EXPANSION)) {
    if (normalized.includes(key) || key.includes(normalized)) return value
  }
  return {
    products: [`${category} solutions`, `${category} platforms`, `${category} tools`],
    services: [`${category} services`, `${category} consulting`, `${category} support`],
    keywords: [category, `${category} providers`, `best ${category}`],
  }
}

function isConsumerBrand(category: string): boolean {
  const lc = category.toLowerCase()
  return CONSUMER_CATEGORIES.some(cat => lc.includes(cat))
}

// ────────────────────────────────────────────────────────────────────
// Website Scraper (lightweight — meta tags + key text, max 5 s)
// ────────────────────────────────────────────────────────────────────

async function scrapeWebsiteContext(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SomaAI-AuditBot/1.0 (+https://withsoma.ai)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return null

    const reader = res.body?.getReader()
    if (!reader) return null

    let html = ''
    const decoder = new TextDecoder()
    const MAX_BYTES = 80_000
    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
    }
    reader.cancel()

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch?.[1]?.trim() || ''

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const description = descMatch?.[1]?.trim() || ''

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
    const ogDesc = ogDescMatch?.[1]?.trim() || ''

    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
    const metaKeywords = keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean).slice(0, 10) || []

    const headings: string[] = []
    const headingRegex = /<h[12][^>]*>([^<]+)<\/h[12]>/gi
    let m: RegExpExecArray | null
    while ((m = headingRegex.exec(html)) !== null && headings.length < 8) {
      const text = m[1].replace(/\s+/g, ' ').trim()
      if (text.length > 3 && text.length < 200) headings.push(text)
    }

    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
    const paragraphs: string[] = []
    const pRegex = /<p[^>]*>([^<]{20,})<\/p>/gi
    while ((m = pRegex.exec(cleanHtml)) !== null && paragraphs.length < 5) {
      const text = m[1].replace(/\s+/g, ' ').trim()
      if (text.length > 30) paragraphs.push(text)
    }

    const parts: string[] = []
    if (title) parts.push(`Site title: ${title}`)
    if (ogDesc || description) parts.push(`Description: ${ogDesc || description}`)
    if (headings.length > 0) parts.push(`Key headings: ${headings.slice(0, 5).join(', ')}`)
    if (metaKeywords.length > 0) parts.push(`Meta keywords: ${metaKeywords.join(', ')}`)
    const snippet = paragraphs.join(' ').slice(0, 300)
    if (snippet) parts.push(`About: ${snippet}`)
    return parts.length > 0 ? parts.join('\n') : null
  } catch {
    return null
  }
}

// ────────────────────────────────────────────────────────────────────
// LLM Prompt Building
// ────────────────────────────────────────────────────────────────────

function buildUserPrompt(input: PromptGenerationInput, marketOverride?: string, websiteContext?: string | null, searchTrendsContext?: string | null): string {
  const brandName = input.brandName
  const category = (input.brandCategory || '').replace(/_/g, ' ')
  const market = marketOverride
    ? expandMarket(marketOverride)
    : input.targetMarkets?.[0]
      ? expandMarket(input.targetMarkets[0])
      : { fullName: 'Global', cities: [], context: 'international', isGlobal: true }
  const marketName = market.fullName
  const marketCities = market.cities
  const isGlobal = market.isGlobal
  const selectedStates = input.selectedStates || []
  const hasStates = selectedStates.length > 0
  const isBtoC = isConsumerBrand(input.brandCategory || '')
  const categoryInfo = expandCategory(input.brandCategory || category || 'business solutions')
  const specificProducts = categoryInfo.products.slice(0, 3).join(', ')
  const maxPrompts = input.maxPrompts || 8

  // Build industry context WITHOUT the brand name — prevents LLM leaking it into queries
  const industryParts: string[] = []
  industryParts.push(`Industry: ${category || 'business services'}`)
  if (input.productsServices) industryParts.push(`Products/services in this space: ${input.productsServices.slice(0, 300)}`)
  if (input.brandDescription) {
    // Strip the brand name from the description to prevent leakage
    const sanitizedDesc = input.brandDescription.replace(new RegExp(brandName, 'gi'), 'this company')
    industryParts.push(`Business context: ${sanitizedDesc.slice(0, 200)}`)
  }
  if (input.topics?.length) industryParts.push(`Key topics customers care about: ${input.topics.slice(0, 5).join(', ')}`)
  if (input.targetAudience) industryParts.push(`Target customers: ${input.targetAudience.slice(0, 200)}`)
  if (input.competitors?.length) {
    // Include competitors as category context, not names to mention
    industryParts.push(`Competitive landscape includes: ${input.competitors.slice(0, 5).join(', ')}`)
  }
  if (websiteContext) {
    // Strip brand name from scraped website content too
    const sanitizedWebContext = websiteContext.replace(new RegExp(brandName, 'gi'), '[brand]')
    industryParts.push(`Industry intel:\n${sanitizedWebContext}`)
  }

  // Build market geography line — prioritize states over national when selected
  let geographyLine: string
  if (hasStates) {
    const stateList = selectedStates.slice(0, 5).join(', ')
    geographyLine = `Geography: ${stateList}, United States (state-level focus)`
  } else if (!isGlobal) {
    geographyLine = `Geography: ${marketName}${marketCities.length > 0 ? ` (key cities: ${marketCities.slice(0, 3).join(', ')})` : ''}`
  } else {
    geographyLine = 'Geography: Global/International'
  }

  // State-aware market guidance for query requirements
  const locationGuidance = hasStates
    ? `Queries MUST reference specific locations — use state names like "${selectedStates[0]}"${selectedStates.length > 1 ? `, "${selectedStates[1]}"` : ''} and cities within those states`
    : (!isGlobal ? `Include ${marketName}-specific context naturally — people often search for local options` : 'Keep queries globally relevant')

  // Build optional search trends intelligence block
  const searchIntelBlock = searchTrendsContext
    ? `\n\n${searchTrendsContext}\n`
    : ''

  return `You are simulating how real consumers and business buyers search AI assistants (ChatGPT, Claude, Gemini, Perplexity) when they have a genuine need.

=== GOAL ===
Generate ${maxPrompts} search queries that someone would ACTUALLY type into an AI chatbot when looking for ${isBtoC ? 'products or services' : 'business solutions'} in this industry. These queries will be sent to AI models to measure which brands appear organically.

=== INDUSTRY CONTEXT (understand the space, do NOT put brand names in queries) ===
${industryParts.join('\n')}

=== MARKET ===
${geographyLine}${searchIntelBlock}

=== AEO METHODOLOGY ===
This is Answer Engine Optimization testing. Like SEO uses generic keyword searches to see which sites rank, AEO uses generic questions to see which brands AI recommends. The queries must NEVER contain any brand or company name — we measure organic visibility only.

=== QUERY DISTRIBUTION ===
- ${Math.ceil(maxPrompts * 0.4)} DISCOVERY queries: "What are the best...", "Top options for...", "Which ... should I consider?"
- ${Math.ceil(maxPrompts * 0.3)} PROBLEM queries: "I need help with...", "How do I solve...", "What's the best way to..."
- ${Math.floor(maxPrompts * 0.3)} COMPARISON queries: "What's better for X vs Y type of need?", "Which option works best if I need..."

=== RULES ===
1. ZERO brand names, company names, or product names in any query
2. ${locationGuidance}
3. ${isBtoC ? 'Write as a CONSUMER — someone buying, trying, or getting recommendations' : 'Write as a BUSINESS DECISION-MAKER — someone evaluating solutions'}
4. Each query should be 8-20 words, natural and conversational
5. Avoid generic filler — each query should reflect a specific, realistic need
6. Think about the JOBS TO BE DONE — what problem is the searcher trying to solve?
7. Mix specificity levels: some broad category queries, some very specific use-case queries

=== BAD EXAMPLES (never generate these) ===
- "Is [BrandName] good?" (contains brand name)
- "What is ${category}?" (too generic, no intent)
- "Best ${category}" (too short, not natural)

=== GOOD EXAMPLES (this style) ===
- "What's the best way to handle [specific task] for a small business in ${hasStates ? selectedStates[0] : marketName}?"
- "I'm looking for a [solution] that can [specific capability] — what do people recommend?"
- "Which [category] tools are actually worth paying for in ${new Date().getFullYear()}?"

Return ONLY the queries, one per line, no numbering, no bullets, no quotes, no explanation.`
}

// ────────────────────────────────────────────────────────────────────
// LLM Response Parsing
// ────────────────────────────────────────────────────────────────────

function parseLLMResponse(raw: string, brandName: string): GeneratedPrompt[] {
  const ts = Date.now()
  const brandLower = brandName.toLowerCase()
  // Only filter the full brand name and brand-unique words (not generic industry terms)
  // e.g. for "Sunrise Dental" → filter "sunrise dental", "sunrise" but NOT "dental"
  // Common industry/category words that should NOT be filtered even if they appear in brand name
  const GENERIC_WORDS = new Set([
    'dental', 'medical', 'health', 'fitness', 'beauty', 'auto', 'tech', 'digital',
    'creative', 'global', 'national', 'local', 'premier', 'elite', 'pro', 'plus',
    'solutions', 'services', 'group', 'partners', 'associates', 'consulting',
    'restaurant', 'cafe', 'bar', 'grill', 'kitchen', 'food', 'legal', 'law',
    'home', 'care', 'clean', 'smart', 'design', 'studio', 'media', 'marketing',
    'financial', 'insurance', 'realty', 'property', 'construction', 'energy',
    'travel', 'logistics', 'education', 'academy', 'clinic', 'wellness', 'spa',
  ])
  const brandWords = brandLower.split(/\s+/).filter(w => w.length > 2 && !GENERIC_WORDS.has(w))

  const lines = raw
    .split('\n')
    .map(line => line
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^[-•]\s*/, '')
      .replace(/^["']|["']$/g, '')
      .trim()
    )
    .filter(line => {
      if (line.length < 10 || line.length > 300) return false
      if (/^(generate|note:|here|brand defense|category capture|solution discovery)/i.test(line)) return false
      // Hard filter: reject any query that contains the full brand name
      const lineLower = line.toLowerCase()
      if (lineLower.includes(brandLower)) return false
      // Also reject if any brand-unique word appears as a standalone word
      if (brandWords.length > 0 && brandWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(line))) return false
      return true
    })

  const categorize = (text: string): GeneratedPrompt['category'] => {
    if (/best|top|recommend|compare|which|review|popular|rated|options/i.test(text)) return 'category_capture'
    return 'solution_discovery'
  }

  const rationales: Record<string, string> = {
    category_capture: 'Category query — tests whether the brand appears when users search the category without naming it',
    solution_discovery: 'Solution query — tests whether the brand surfaces when users describe a problem to solve',
  }

  return lines.map((text, i) => {
    const cat = categorize(text)
    return {
      id: `gen_${ts}_${i}`,
      text,
      category: cat,
      priority: i + 1,
      rationale: rationales[cat],
      confidence: 0.85,
    }
  })
}

// ────────────────────────────────────────────────────────────────────
// Smart Fallback (no LLM needed)
// ────────────────────────────────────────────────────────────────────

function generateFallback(input: PromptGenerationInput, marketOverride?: string): GeneratedPrompt[] {
  const { brandName, brandCategory = '', brandKeywords = [], competitors = [], selectedStates = [] } = input
  const year = new Date().getFullYear()
  const ts = Date.now()
  const marketInfo = expandMarket(marketOverride || input.targetMarkets?.[0] || 'global')
  const market = selectedStates.length > 0 ? selectedStates[0] : marketInfo.fullName
  const altMarket = selectedStates.length > 1 ? selectedStates[1] : (input.targetMarkets?.[1] ? expandMarket(input.targetMarkets[1]).fullName : market)
  const rawCategory = brandCategory.replace(/_/g, ' ') || 'services'
  const isBtoC = isConsumerBrand(brandCategory)

  // Build natural service terms from keywords (prefer keyword[0] over raw category)
  const service = brandKeywords[0]?.toLowerCase() || input.productsServices?.split(/[,&]+/)[0]?.trim()?.toLowerCase() || rawCategory
  const service2 = brandKeywords[1]?.toLowerCase() || service

  // For consumer-facing businesses, use the specific service/keyword instead of the raw category
  // e.g., "dentist" not "hospital health care", "plumber" not "home services"
  const naturalCategory = isBtoC
    ? (service !== rawCategory ? service : rawCategory)
    : rawCategory
  // Entity word: consumers search for "dentists" or "restaurants", businesses search for "providers" or "companies"
  const entityWord = isBtoC ? 'options' : 'providers'
  const audiencePhrase = isBtoC ? 'people' : 'businesses'

  const prompts: Array<{ text: string; cat: GeneratedPrompt['category']; rationale: string }> = []

  // Pillar 1: Category Capture (5 prompts)
  if (isBtoC) {
    // Consumer-oriented prompts — sound like real people asking AI for help
    prompts.push({
      text: `What are the best ${naturalCategory} ${entityWord} in ${market} for ${year}?`,
      cat: 'category_capture',
      rationale: `Category discovery — brand should appear in AI recommendations for ${market}`,
    })
    prompts.push({
      text: `I'm looking for a good ${service} in ${altMarket} — who do people recommend?`,
      cat: 'category_capture',
      rationale: 'Recommendation-seeking — user is comparison shopping in the category',
    })
    prompts.push({
      text: service2 !== service
        ? `Which ${naturalCategory} in ${market} are known for ${service2}?`
        : `Which ${naturalCategory} ${entityWord} in ${market} have the best reviews?`,
      cat: 'category_capture',
      rationale: 'Trust-focused category query — user looking for quality signals',
    })
    prompts.push({
      text: `Top rated ${service} in ${market} — who should I consider?`,
      cat: 'category_capture',
      rationale: 'Shortlist query — user building a consideration set in the category',
    })
    prompts.push({
      text: `Can you recommend a ${service} near ${altMarket} that ${service2 !== service ? `also does ${service2}` : 'is affordable and has good reviews'}?`,
      cat: 'category_capture',
      rationale: 'Specific need query — user has a real constraint to satisfy',
    })
  } else {
    // B2B-oriented prompts
    prompts.push({
      text: `What are the best ${naturalCategory} ${entityWord} in ${market} for ${year}?`,
      cat: 'category_capture',
      rationale: `Category discovery — brand should appear in AI recommendations for ${market}`,
    })
    prompts.push({
      text: `I need ${service} for my business — what do ${audiencePhrase} actually recommend in ${altMarket}?`,
      cat: 'category_capture',
      rationale: 'Recommendation-seeking — user is comparison shopping in the category',
    })
    prompts.push({
      text: service2 !== service
        ? `Which ${naturalCategory} companies are strong at ${service2} in ${market}?`
        : `Which ${naturalCategory} companies are most trusted in ${market}?`,
      cat: 'category_capture',
      rationale: 'Trust-focused category query — user looking for reliability signals',
    })
    prompts.push({
      text: `Top rated ${service} ${entityWord} in ${market} — who should I consider?`,
      cat: 'category_capture',
      rationale: 'Shortlist query — user building a consideration set in the category',
    })
    prompts.push({
      text: `What ${naturalCategory} solutions are popular with growing businesses in ${altMarket}?`,
      cat: 'category_capture',
      rationale: 'Peer-driven category query — user wants to know what others chose',
    })
  }

  // Pillar 2: Solution Discovery (3 prompts)
  if (isBtoC) {
    prompts.push({
      text: `How do I find a good ${service}? What should I look for before choosing?`,
      cat: 'solution_discovery',
      rationale: 'Problem-solving — user needs guidance on selecting in the category',
    })
    prompts.push({
      text: service2 !== service
        ? `What questions should I ask a ${service} about ${service2} before committing?`
        : `What are the signs of a really good ${service} vs a bad one?`,
      cat: 'solution_discovery',
      rationale: 'Evaluation query — user wants decision-making criteria',
    })
    prompts.push({
      text: brandKeywords.length >= 3
        ? `I need ${brandKeywords[2].toLowerCase()} — any good ${entityWord} in ${altMarket}?`
        : `Best ${service} for someone new to ${altMarket} who doesn't know where to start?`,
      cat: 'solution_discovery',
      rationale: 'Specific need query — tests whether brand surfaces for niche offerings',
    })
  } else {
    prompts.push({
      text: `How do I choose the right ${service} for my business? What should I look for?`,
      cat: 'solution_discovery',
      rationale: 'Problem-solving — user needs guidance on selecting in the category',
    })
    prompts.push({
      text: `What do mid-size companies in ${market} typically use for ${service2}?`,
      cat: 'solution_discovery',
      rationale: 'Peer validation — user wants to know what similar businesses chose',
    })
    prompts.push({
      text: brandKeywords.length >= 3
        ? `I'm looking for help with ${brandKeywords[2].toLowerCase()} — any good options in ${altMarket}?`
        : `Best ${service} for a company just starting out in ${altMarket}?`,
      cat: 'solution_discovery',
      rationale: 'Specific need query — tests whether brand surfaces for niche offerings',
    })
  }

  return prompts.slice(0, input.maxPrompts || 8).map((p, i) => ({
    id: `fb_${ts}_${i}`,
    text: p.text,
    category: p.cat,
    priority: i + 1,
    rationale: p.rationale,
    confidence: 0.7,
    market,
  }))
}

// ────────────────────────────────────────────────────────────────────
// OpenRouter Call with Fallback
// ────────────────────────────────────────────────────────────────────

const FALLBACK_MODELS = [
  'openrouter/free',
  'google/gemini-2.5-flash-lite',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
]

/**
 * Load admin-configured prompt generation models from llm_model_configs.
 * These are managed via the Prompt Design tab in /admin.
 * Returns models sorted by fallback_priority.
 */
async function getAdminPromptGenerationModels(): Promise<Array<{ openrouter_id: string; temperature: number; max_tokens: number }>> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('llm_model_configs')
      .select('openrouter_id, model_id, temperature, max_tokens, fallback_priority')
      .eq('purpose', 'prompt_generation')
      .eq('is_active', true)
      .order('fallback_priority', { ascending: true })

    if (error || !data?.length) return []
    return data.map(m => ({
      openrouter_id: m.openrouter_id || m.model_id,
      temperature: Number(m.temperature ?? 0.8),
      max_tokens: m.max_tokens ?? 2000,
    }))
  } catch {
    return []
  }
}

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number }
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const timeoutMs = options?.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://withsoma.ai',
        'X-Title': 'Soma AI Prompt Generation',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.8,
        stream: false,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.status === 429) {
      console.warn(`⏳ Rate limited on ${model}`)
      return null
    }
    if (!res.ok) {
      console.warn(`⚠️ ${model} returned HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch (err) {
    clearTimeout(timer)
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`⚠️ ${model} call failed: ${msg}`)
    return null
  }
}

async function callWithFallback(
  systemPrompt: string,
  userPrompt: string,
  primaryModel: string | null,
  options?: { temperature?: number; maxTokens?: number; adminFallbackModels?: string[] }
): Promise<{ content: string; model: string } | null> {
  const adminFallbacks = options?.adminFallbackModels || []
  const models = primaryModel
    ? [primaryModel, ...adminFallbacks, ...FALLBACK_MODELS.filter(m => m !== primaryModel && !adminFallbacks.includes(m))]
    : FALLBACK_MODELS

  for (const model of models) {
    const content = await callOpenRouter(model, systemPrompt, userPrompt, options)
    if (content) return { content, model }
    // try next model in fallback chain
  }
  return null
}

// ────────────────────────────────────────────────────────────────────
// Main Service
// ────────────────────────────────────────────────────────────────────

export async function generatePrompts(input: PromptGenerationInput): Promise<PromptGenerationResult> {
  const maxPrompts = Math.min(input.maxPrompts || 8, 20)
  const markets = input.targetMarkets?.length ? input.targetMarkets : ['global']

  // 1. Optionally scrape website for richer context
  let websiteContext: string | null = null
  if (input.scrapeWebsite && input.brandWebsite?.startsWith('http')) {
    websiteContext = await scrapeWebsiteContext(input.brandWebsite)
  }

  // 1b. Fetch real search trends from SerpAPI
  let searchTrendsContext: string | null = null
  let searchTrendsResult: SearchTrendsResult | null = null
  try {
    searchTrendsResult = await fetchSearchTrends({
      brandName: input.brandName,
      brandCategory: input.brandCategory,
      brandDescription: input.brandDescription,
      productsServices: input.productsServices,
      topics: input.topics,
      targetMarkets: input.targetMarkets,
      competitors: input.competitors,
      targetAudience: input.targetAudience,
    })
    if (searchTrendsResult.success) {
      searchTrendsContext = formatTrendsForPrompt(searchTrendsResult)
      console.log(`[prompt-gen] Search trends: ${searchTrendsResult.trends.length} trends from ${searchTrendsResult.apiCalls} API calls`)
    }
  } catch (err) {
    console.warn('[prompt-gen] Search trends fetch failed, continuing without:', err instanceof Error ? err.message : String(err))
  }

  // 2. Load admin-configured model & system prompt
  //    Priority: Prompt Design models (llm_model_configs) > agent_model_configs > hardcoded fallback
  let primaryModel: string | null = null
  let adminFallbackModels: string[] = []
  let temperature = 0.8
  let maxTokens = 2000
  try {
    const adminModels = await getAdminPromptGenerationModels()
    if (adminModels.length > 0) {
      primaryModel = adminModels[0].openrouter_id
      temperature = adminModels[0].temperature
      maxTokens = adminModels[0].max_tokens
      adminFallbackModels = adminModels.slice(1).map(m => m.openrouter_id)
    }
  } catch { /* use fallback models */ }

  let systemPrompt: string
  try {
    systemPrompt = await getSystemPrompt('prompt_generation', 'system')
  } catch {
    systemPrompt = `You are an expert at writing the exact kind of questions real people type into ChatGPT, Claude, Gemini, and Perplexity when they are genuinely trying to solve a problem or make a buying decision. Write each query on its own line, no numbering, no bullets, no quotes. Each query should be 8-20 words, natural and conversational.`
  }

  // 3. Generate prompts — per-market in parallel if multiple markets
  const allPrompts: GeneratedPrompt[] = []
  const perMarketCount = markets.length > 1 ? Math.max(3, Math.ceil(maxPrompts / markets.length)) : maxPrompts

  let usedModel: string | null = null
  const marketResults = await Promise.all(markets.map(async (market) => {
    const userPrompt = buildUserPrompt({ ...input, maxPrompts: perMarketCount }, market, websiteContext, searchTrendsContext)

    const llmResult = await callWithFallback(systemPrompt, userPrompt, primaryModel, { temperature, maxTokens, adminFallbackModels })

    if (llmResult) {
      const parsed = parseLLMResponse(llmResult.content, input.brandName)
      if (parsed.length >= Math.min(3, perMarketCount)) {
        parsed.forEach(p => { p.market = expandMarket(market).fullName })
        usedModel = usedModel || llmResult.model
        return parsed
      }
      console.warn(`[prompt-gen] LLM returned only ${parsed.length} valid prompts for market ${market}, falling back to templates`)
    }

    // Fallback for this market
    const fb = generateFallback(input, market)
    fb.forEach(p => { p.market = expandMarket(market).fullName })
    return fb
  }))

  for (const result of marketResults) {
    allPrompts.push(...result)
  }

  // 4. Deduplicate by text (case-insensitive)
  const seen = new Set<string>()
  const unique = allPrompts.filter(p => {
    const key = p.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 5. Ensure we have at least the requested count (pad with fallback if needed)
  if (unique.length < maxPrompts) {
    const fb = generateFallback(input)
    for (const p of fb) {
      if (unique.length >= maxPrompts) break
      if (!seen.has(p.text.toLowerCase())) {
        unique.push(p)
        seen.add(p.text.toLowerCase())
      }
    }
  }

  // 6. Re-prioritize
  const final = unique.slice(0, maxPrompts).map((p, i) => ({ ...p, priority: i + 1 }))

  const hasLLM = allPrompts.some(p => p.id.startsWith('gen_'))
  const source = hasLLM ? 'llm' : 'template'
  const trendsUsed = !!searchTrendsContext
  const trendsCount = searchTrendsResult?.trends.length || 0
  const modelLabel = primaryModel
    ? `admin:${primaryModel}`
    : usedModel
      ? `auto:${usedModel}`
      : 'no-llm (template only)'
  console.log(`[prompt-gen] ${final.length} prompts (${source}) for "${input.brandName}" | model: ${modelLabel} | markets: ${markets.join(', ')} | search trends: ${trendsUsed ? trendsCount : 'none'}`)

  return {
    prompts: final,
    source,
    websiteScraped: !!websiteContext,
    model: primaryModel || undefined,
    searchTrendsUsed: trendsUsed,
    searchTrendsCount: trendsUsed ? trendsCount : undefined,
  }
}
