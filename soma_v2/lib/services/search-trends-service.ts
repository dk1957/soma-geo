/**
 * Search Trends Intelligence Service
 * ====================================
 * Uses SerpAPI to fetch real Google search data (autocomplete, related searches,
 * People Also Ask) and distills it into search intelligence that powers
 * hyper-realistic AI chat prompt generation.
 *
 * The core insight: what people type into Google is the best proxy for what they
 * will type into ChatGPT, Gemini, Claude, and Perplexity. By grounding prompt
 * generation in real search behaviour, we create prompts that almost exactly match
 * what real users are already searching for.
 *
 * API budget per generation: 3-5 SerpAPI calls (autocomplete is cheapest)
 */

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface SearchTrendsInput {
  brandName: string
  brandCategory?: string
  brandDescription?: string
  productsServices?: string
  topics?: string[]
  targetMarkets?: string[]
  competitors?: string[]
  targetAudience?: string
}

export interface SearchTrend {
  query: string
  source: 'autocomplete' | 'related_search' | 'people_also_ask' | 'related_question'
  /** Relevance score 0-1, higher = more relevant to the brand context */
  relevance: number
}

export interface SearchTrendsResult {
  trends: SearchTrend[]
  seedQueries: string[]
  /** Total SerpAPI calls made */
  apiCalls: number
  /** Whether the service was able to fetch real data */
  success: boolean
}

// ────────────────────────────────────────────────────────────────────
// Seed Query Generation
// ────────────────────────────────────────────────────────────────────

/**
 * Generate smart seed queries from brand context.
 * These seeds are used to mine Google for real search patterns.
 *
 * Priority order:
 *   1. Topics — the most specific & valuable (user-provided, maps to real search terms)
 *   2. Products / services — what the audience actually searches for
 *   3. Category — broader but still useful for discovery queries
 *   4. Description-derived — last resort
 *
 * The seeds themselves never contain the brand name.
 */
function generateSeedQueries(input: SearchTrendsInput): string[] {
  const seeds: string[] = []
  const category = (input.brandCategory || '').replace(/_/g, ' ').trim()
  const topics = input.topics || []
  const products = input.productsServices || ''

  // ── Strategy 1 (highest value): Topics as direct search seeds ──
  // Topics are what users actually search for — they should dominate the seed list.
  for (const topic of topics.slice(0, 5)) {
    const clean = topic.toLowerCase().trim()
    if (clean.length > 2 && clean.length < 60) {
      seeds.push(clean) // direct: "answer engine optimization"
    }
  }
  // Add one intent-modified topic if we have any
  if (topics.length > 0) {
    const firstTopic = topics[0].toLowerCase().trim()
    seeds.push(`best ${firstTopic} tools`)
    if (topics.length > 1) {
      seeds.push(`how to improve ${topics[1].toLowerCase().trim()}`)
    }
  }

  // ── Strategy 2: Products/services as search seeds ──
  if (products) {
    const productList = products.split(/[,;&]+/).map(p => p.trim()).filter(p => p.length > 2)
    for (const product of productList.slice(0, 2)) {
      seeds.push(product.toLowerCase())
    }
  }

  // ── Strategy 3: Category (only if not too generic) ──
  // Categories like "Information Technology & Services" are too broad — skip them.
  // Only use category if it's specific enough (under ~35 chars, no "&" chains).
  if (category && category.length <= 35 && !category.includes('&')) {
    seeds.push(`best ${category}`)
    seeds.push(`${category} comparison`)
  }

  // ── Strategy 4: Competitor landscape queries ──
  if (input.competitors?.length) {
    // Use most specific context available for alternatives query
    const altContext = topics.length > 0
      ? topics[0].toLowerCase().trim()
      : category || ''
    if (altContext) {
      seeds.push(`${altContext} alternatives`)
    }
  }

  // ── Strategy 5: Audience-specific queries ──
  if (input.targetAudience) {
    const audience = input.targetAudience.toLowerCase().trim()
    const context = topics.length > 0 ? topics[0].toLowerCase().trim() : category
    if (context) {
      seeds.push(`${context} for ${audience}`)
    }
  }

  // Deduplicate and limit
  const unique = [...new Set(seeds.filter(s => s.length >= 3 && s.length <= 80))]
  return unique.slice(0, 8)
}

// ────────────────────────────────────────────────────────────────────
// SerpAPI Calls
// ────────────────────────────────────────────────────────────────────

const SERP_API_BASE = 'https://serpapi.com/search.json'

/**
 * Fetch Google Autocomplete suggestions for a query.
 * This is the cheapest SerpAPI call and returns what users see as they type.
 */
async function fetchAutocomplete(
  query: string,
  apiKey: string,
  options?: { gl?: string; hl?: string }
): Promise<string[]> {
  const params = new URLSearchParams({
    engine: 'google_autocomplete',
    q: query,
    api_key: apiKey,
    ...(options?.gl && { gl: options.gl }),
    ...(options?.hl && { hl: options.hl }),
  })

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(`${SERP_API_BASE}?${params}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[search-trends] Autocomplete API returned ${res.status} for "${query}"`)
      return []
    }

    const data = await res.json()
    const suggestions: string[] = (data.suggestions || [])
      .map((s: { value?: string }) => s.value?.trim())
      .filter((s: string | undefined): s is string => !!s && s.length > 3)

    return suggestions
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[search-trends] Autocomplete failed for "${query}": ${msg}`)
    return []
  }
}

/**
 * Fetch Google Search results for related_searches and related_questions.
 * More expensive but yields People Also Ask and Related Searches.
 */
async function fetchSearchIntelligence(
  query: string,
  apiKey: string,
  options?: { gl?: string; hl?: string; location?: string }
): Promise<{ relatedSearches: string[]; relatedQuestions: string[] }> {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: '10',
    ...(options?.gl && { gl: options.gl }),
    ...(options?.hl && { hl: options.hl }),
    ...(options?.location && { location: options.location }),
  })

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(`${SERP_API_BASE}?${params}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[search-trends] Search API returned ${res.status} for "${query}"`)
      return { relatedSearches: [], relatedQuestions: [] }
    }

    const data = await res.json()

    const relatedSearches: string[] = (data.related_searches || [])
      .map((rs: { query?: string }) => rs.query?.trim())
      .filter((q: string | undefined): q is string => !!q && q.length > 3)

    const relatedQuestions: string[] = (data.related_questions || [])
      .map((rq: { question?: string }) => rq.question?.trim())
      .filter((q: string | undefined): q is string => !!q && q.length > 5)

    return { relatedSearches, relatedQuestions }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[search-trends] Search failed for "${query}": ${msg}`)
    return { relatedSearches: [], relatedQuestions: [] }
  }
}

// ────────────────────────────────────────────────────────────────────
// Market → SerpAPI Location Mapping
// ────────────────────────────────────────────────────────────────────

const MARKET_TO_GL: Record<string, string> = {
  us: 'us', 'united states': 'us',
  uk: 'uk', gb: 'uk', 'united kingdom': 'uk',
  ng: 'ng', nigeria: 'ng',
  gh: 'gh', ghana: 'gh',
  ke: 'ke', kenya: 'ke',
  za: 'za', 'south africa': 'za',
  ae: 'ae', 'united arab emirates': 'ae', uae: 'ae',
  sa: 'sa', 'saudi arabia': 'sa',
  de: 'de', germany: 'de',
  in: 'in', india: 'in',
  au: 'au', australia: 'au',
  ca: 'ca', canada: 'ca',
  sg: 'sg', singapore: 'sg',
}

function getGlCode(market: string): string | undefined {
  return MARKET_TO_GL[market.toLowerCase().trim()]
}

// ────────────────────────────────────────────────────────────────────
// Relevance Scoring
// ────────────────────────────────────────────────────────────────────

/**
 * Score how relevant a discovered search query is to the brand context.
 * Higher score = more useful for prompt generation.
 */
function scoreRelevance(
  query: string,
  brandContext: { category: string; topics: string[]; products: string; audience: string }
): number {
  const q = query.toLowerCase()
  let score = 0.5 // base score for any real search query

  // Boost for containing category keywords
  if (brandContext.category && q.includes(brandContext.category.toLowerCase())) {
    score += 0.15
  }

  // Boost for containing topic keywords
  for (const topic of brandContext.topics) {
    if (q.includes(topic.toLowerCase())) {
      score += 0.1
      break
    }
  }

  // Boost for intent signals (questions, recommendations, comparisons)
  if (/\b(best|top|recommend|how to|which|compare|should i|what is|vs|alternative)\b/i.test(q)) {
    score += 0.1
  }

  // Boost for conversational / question form (matches AI chatbot usage pattern)
  if (/\b(what|how|why|where|when|which|can i|should i|is it|do i)\b/i.test(q)) {
    score += 0.1
  }

  // Penalise very short queries (less conversational)
  if (q.split(/\s+/).length < 3) {
    score -= 0.1
  }

  // Penalise overly commercial queries (buy, price, coupon)
  if (/\b(buy|price|coupon|discount|sale|cheap|free|download)\b/i.test(q)) {
    score -= 0.05
  }

  return Math.max(0, Math.min(1, score))
}

// ────────────────────────────────────────────────────────────────────
// Brand Name Filter
// ────────────────────────────────────────────────────────────────────

/**
 * Filter out queries that contain brand names (ours or competitors).
 * We want generic category/problem queries, not branded ones.
 */
function filterBrandedQueries(queries: string[], brandName: string, competitors: string[]): string[] {
  const blocked = [brandName, ...competitors]
    .map(n => n.toLowerCase().trim())
    .filter(n => n.length > 1)

  return queries.filter(q => {
    const lq = q.toLowerCase()
    return !blocked.some(b => lq.includes(b))
  })
}

// ────────────────────────────────────────────────────────────────────
// Main Service
// ────────────────────────────────────────────────────────────────────

/**
 * Fetch real search trends from SerpAPI and return ranked search intelligence.
 *
 * Budget: ~3-5 API calls per invocation
 *  - 2-3 autocomplete calls (cheapest)
 *  - 1-2 full search calls (for People Also Ask + Related Searches)
 */
export async function fetchSearchTrends(input: SearchTrendsInput): Promise<SearchTrendsResult> {
  const apiKey = process.env.SERP_API_KEY
  if (!apiKey) {
    console.warn('[search-trends] SERP_API_KEY not configured — skipping search trends')
    return { trends: [], seedQueries: [], apiCalls: 0, success: false }
  }

  const seeds = generateSeedQueries(input)
  if (seeds.length === 0) {
    console.warn('[search-trends] No seed queries generated — insufficient brand context')
    return { trends: [], seedQueries: [], apiCalls: 0, success: false }
  }

  console.log(`[search-trends] Generated ${seeds.length} seed queries: ${seeds.slice(0, 4).join(', ')}...`)

  // Determine market geo for API calls
  const primaryMarket = input.targetMarkets?.[0]
  const gl = primaryMarket ? getGlCode(primaryMarket) : undefined

  const allTrends: SearchTrend[] = []
  let apiCalls = 0

  // ── Phase 1: Autocomplete for top 3 seeds (cheap, high-value) ──
  const autocompleteSeedsCount = Math.min(seeds.length, 3)
  for (let i = 0; i < autocompleteSeedsCount; i++) {
    const suggestions = await fetchAutocomplete(seeds[i], apiKey, { gl })
    apiCalls++

    for (const suggestion of suggestions) {
      allTrends.push({
        query: suggestion,
        source: 'autocomplete',
        relevance: 0, // scored below
      })
    }
  }

  // ── Phase 2: Full search for top 1-2 seeds (richer data) ──
  const searchSeedsCount = Math.min(seeds.length, 2)
  for (let i = 0; i < searchSeedsCount; i++) {
    const { relatedSearches, relatedQuestions } = await fetchSearchIntelligence(
      seeds[i], apiKey, { gl }
    )
    apiCalls++

    for (const rs of relatedSearches) {
      allTrends.push({ query: rs, source: 'related_search', relevance: 0 })
    }
    for (const rq of relatedQuestions) {
      allTrends.push({ query: rq, source: 'people_also_ask', relevance: 0 })
    }
  }

  console.log(`[search-trends] Fetched ${allTrends.length} raw trends from ${apiCalls} API calls`)

  // ── Phase 3: Filter branded queries ──
  const brandContext = {
    category: (input.brandCategory || '').replace(/_/g, ' '),
    topics: input.topics || [],
    products: input.productsServices || '',
    audience: input.targetAudience || '',
  }

  const filteredQueries = filterBrandedQueries(
    allTrends.map(t => t.query),
    input.brandName,
    input.competitors || []
  )
  const filteredSet = new Set(filteredQueries.map(q => q.toLowerCase()))

  // ── Phase 4: Deduplicate & score relevance ──
  const seen = new Set<string>()
  const scoredTrends: SearchTrend[] = []

  for (const trend of allTrends) {
    const key = trend.query.toLowerCase().trim()
    if (seen.has(key)) continue
    if (!filteredSet.has(key)) continue
    seen.add(key)

    trend.relevance = scoreRelevance(trend.query, brandContext)
    scoredTrends.push(trend)
  }

  // ── Phase 5: Sort by relevance and return top results ──
  scoredTrends.sort((a, b) => b.relevance - a.relevance)
  const topTrends = scoredTrends.slice(0, 30) // keep top 30 for LLM context

  console.log(`[search-trends] Returning ${topTrends.length} scored trends (${apiCalls} API calls)`)

  return {
    trends: topTrends,
    seedQueries: seeds,
    apiCalls,
    success: topTrends.length > 0,
  }
}

// ────────────────────────────────────────────────────────────────────
// Format trends for LLM consumption
// ────────────────────────────────────────────────────────────────────

/**
 * Format search trends into a context block for the LLM prompt.
 * This is the bridge between raw search data and prompt generation.
 */
export function formatTrendsForPrompt(result: SearchTrendsResult): string | null {
  if (!result.success || result.trends.length === 0) return null

  // Group by source for richer context
  const autocomplete = result.trends.filter(t => t.source === 'autocomplete')
  const relatedSearches = result.trends.filter(t => t.source === 'related_search')
  const peopleAlsoAsk = result.trends.filter(t => t.source === 'people_also_ask')

  const parts: string[] = []
  parts.push('=== REAL SEARCH INTELLIGENCE (from Google — use this to craft queries) ===')
  parts.push('People are actively searching for these things right now:')

  if (autocomplete.length > 0) {
    parts.push('')
    parts.push('AUTOCOMPLETE SUGGESTIONS (what Google suggests as users type):')
    for (const t of autocomplete.slice(0, 10)) {
      parts.push(`  • ${t.query}`)
    }
  }

  if (relatedSearches.length > 0) {
    parts.push('')
    parts.push('RELATED SEARCHES (what Google shows after a search):')
    for (const t of relatedSearches.slice(0, 8)) {
      parts.push(`  • ${t.query}`)
    }
  }

  if (peopleAlsoAsk.length > 0) {
    parts.push('')
    parts.push('PEOPLE ALSO ASK (real questions people ask Google):')
    for (const t of peopleAlsoAsk.slice(0, 8)) {
      parts.push(`  • ${t.query}`)
    }
  }

  parts.push('')
  parts.push('USE THESE PATTERNS: Transform these real search behaviours into natural AI chatbot queries.')
  parts.push('People searching Google for these terms will also ask AI chatbots similar questions.')
  parts.push('Your generated queries should capture the same INTENT and LANGUAGE patterns.')

  return parts.join('\n')
}
