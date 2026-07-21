import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

const SERP_API_KEY = process.env.SERP_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

// Rate limit: minimum 4 hours between analyses per brand
const MIN_INTERVAL_MS = 4 * 60 * 60 * 1000

interface SerpResult {
  position: number
  title: string
  link: string
  snippet: string
  domain: string
}

interface GapQuery {
  query: string
  intent: string
  brandFound: boolean
  brandPosition: number | null
  results: SerpResult[]
}

// ─── Generate search queries from brand profile via OpenAI ─────────────────

async function generateSearchQueries(brand: Record<string, any>): Promise<{ query: string; intent: string }[]> {
  if (!OPENAI_API_KEY) {
    return fallbackQueries(brand)
  }

  const markets = (brand.target_markets || []).join(', ') || brand.company_location || ''
  const competitors = (brand.known_competitors || []).join(', ')

  const prompt = `You are a search strategist. Given a brand profile, generate 10 Google search queries that potential customers would realistically type when looking for products/services in this brand's category. These should be queries where the brand SHOULD appear but might NOT currently rank.

Brand Profile:
- Name: ${brand.name}
- Category: ${brand.brand_category || brand.industry || 'general'}
- Products/Services: ${brand.products_services || 'N/A'}
- Target Markets: ${markets || 'global'}
- Target Audience: ${brand.target_audience || 'N/A'}
- Value Proposition: ${brand.primary_value || 'N/A'}
- Business Model: ${brand.business_model || 'N/A'}
${competitors ? `- Known Competitors: ${competitors}` : ''}

Rules:
1. Do NOT include the brand name in any query - these are generic category searches
2. Include location-specific queries using the target markets
3. Mix query types: "best X", "top X", comparison queries, problem-solving queries, "X near me" style
4. Make queries specific and realistic - what a real buyer would type
5. Focus on high commercial intent (someone ready to buy/hire)

Return ONLY a JSON array of objects with "query" and "intent" fields.
Intent should be one of: "commercial", "comparison", "local", "problem-solving", "informational"

Example output:
[{"query": "best travel agents in Kenya for safari tours", "intent": "commercial"}, {"query": "affordable luxury safari packages East Africa", "intent": "commercial"}]`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', response.status)
      return fallbackQueries(brand)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 12).map((q: any) => ({
          query: String(q.query || ''),
          intent: String(q.intent || 'commercial'),
        })).filter((q: { query: string }) => q.query.length > 3)
      }
    }

    return fallbackQueries(brand)
  } catch (err) {
    console.error('Error generating queries:', err)
    return fallbackQueries(brand)
  }
}

function fallbackQueries(brand: Record<string, any>): { query: string; intent: string }[] {
  const category = brand.brand_category || brand.industry || 'services'
  const markets = brand.target_markets || []
  const products = brand.products_services || category
  const market = markets[0] || ''

  const queries = [
    { query: `best ${category} companies`, intent: 'commercial' },
    { query: `top ${products} providers`, intent: 'commercial' },
    { query: `${category} vs alternatives comparison`, intent: 'comparison' },
    { query: `affordable ${products}`, intent: 'commercial' },
    { query: `${category} for small businesses`, intent: 'commercial' },
  ]

  if (market) {
    queries.push(
      { query: `best ${category} in ${market}`, intent: 'local' },
      { query: `top ${products} companies ${market}`, intent: 'local' },
    )
  }

  return queries.slice(0, 10)
}

// ─── Fetch SERP results via SerpAPI ────────────────────────────────────────

async function fetchSerpResults(query: string, market?: string): Promise<SerpResult[]> {
  if (!SERP_API_KEY) return []

  try {
    const params = new URLSearchParams({
      q: query,
      api_key: SERP_API_KEY,
      engine: 'google',
      num: '10',
    })

    // Add location context if available
    if (market) {
      const countryCode = marketToGl(market)
      if (countryCode) params.set('gl', countryCode)
    }

    const response = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.error(`SerpAPI error for "${query}": ${response.status}`)
      return []
    }

    const data = await response.json()
    return (data.organic_results || []).slice(0, 10).map((r: any) => ({
      position: r.position || 0,
      title: r.title || '',
      link: r.link || '',
      snippet: r.snippet || '',
      domain: extractDomain(r.link || ''),
    }))
  } catch (err) {
    console.error(`SerpAPI fetch error for "${query}":`, err)
    return []
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function marketToGl(market: string): string {
  const map: Record<string, string> = {
    'united states': 'us', 'usa': 'us', 'us': 'us',
    'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb',
    'kenya': 'ke', 'nigeria': 'ng', 'ghana': 'gh',
    'south africa': 'za', 'uae': 'ae', 'saudi arabia': 'sa',
    'germany': 'de', 'france': 'fr', 'india': 'in',
    'canada': 'ca', 'australia': 'au', 'brazil': 'br',
    'japan': 'jp', 'singapore': 'sg', 'indonesia': 'id',
    'mexico': 'mx', 'spain': 'es', 'italy': 'it',
    'netherlands': 'nl', 'turkey': 'tr', 'egypt': 'eg',
    'north carolina': 'us', 'california': 'us', 'texas': 'us',
    'new york': 'us', 'florida': 'us', 'london': 'gb',
    'nairobi': 'ke', 'lagos': 'ng', 'accra': 'gh',
  }
  return map[market.toLowerCase()] || ''
}

// ─── GET - Fetch stored analysis history ───────────────────────────────────

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Return latest analysis + history summary
  const { data: analyses, error } = await supabase
    .from('competitive_gap_analyses')
    .select('id, total_queries, brand_visible_in, gap_count, visibility_rate, brand_domain, gap_queries, visible_queries, top_competitors, search_queries_used, primary_market, created_at')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching gap analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }

  if (!analyses || analyses.length === 0) {
    return NextResponse.json({ latest: null, history: [] })
  }

  const latest = analyses[0]
  const history = analyses.map(a => ({
    id: a.id,
    date: a.created_at,
    totalQueries: a.total_queries,
    gapCount: a.gap_count,
    visibilityRate: a.visibility_rate,
  }))

  // Compute trend if we have 2+ snapshots
  let trend = null
  if (analyses.length >= 2) {
    const prev = analyses[1]
    trend = {
      visibilityRateChange: latest.visibility_rate - prev.visibility_rate,
      gapCountChange: latest.gap_count - prev.gap_count,
      previousDate: prev.created_at,
    }
  }

  return NextResponse.json({
    latest: {
      brand: { name: '', domain: latest.brand_domain },
      summary: {
        totalQueries: latest.total_queries,
        brandVisibleIn: latest.brand_visible_in,
        gapCount: latest.gap_count,
        visibilityRate: latest.visibility_rate,
      },
      gapQueries: latest.gap_queries,
      visibleQueries: latest.visible_queries,
      topCompetitors: latest.top_competitors,
      analyzedAt: latest.created_at,
    },
    history,
    trend,
  })
}

// ─── POST - Run new analysis ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { brand_id } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // ── Rate limit check ────────────────────────────────────────────────
    const { data: lastRun } = await supabase
      .from('competitive_gap_analyses')
      .select('created_at')
      .eq('brand_id', brand_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastRun) {
      const elapsed = Date.now() - new Date(lastRun.created_at).getTime()
      if (elapsed < MIN_INTERVAL_MS) {
        const hoursLeft = Math.ceil((MIN_INTERVAL_MS - elapsed) / (60 * 60 * 1000))
        return NextResponse.json({
          error: `Analysis was run recently. Please wait ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} before running again.`,
          retryAfterHours: hoursLeft,
        }, { status: 429 })
      }
    }

    // ── Fetch brand profile ─────────────────────────────────────────────
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        id, name, brand_website, primary_domain, domain,
        brand_category, brand_categories, industry, industry_category,
        products_services, target_markets, target_audience,
        primary_value, business_model, known_competitors,
        company_location, description
      `)
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const brandDomain = extractDomain(
      brand.brand_website || brand.primary_domain || brand.domain || ''
    )

    // ── Generate search queries ─────────────────────────────────────────
    const searchQueries = await generateSearchQueries(brand)

    if (searchQueries.length === 0) {
      return NextResponse.json({
        error: 'Could not generate search queries. Please ensure brand profile is complete.',
      }, { status: 422 })
    }

    // ── Fetch SERP results (sequential for rate limits) ─────────────────
    const primaryMarket = (brand.target_markets || [])[0] || brand.company_location || ''
    const gapQueries: GapQuery[] = []

    for (const sq of searchQueries) {
      const results = await fetchSerpResults(sq.query, primaryMarket)

      const brandResult = results.find(r =>
        brandDomain && r.domain.includes(brandDomain)
      )

      gapQueries.push({
        query: sq.query,
        intent: sq.intent,
        brandFound: !!brandResult,
        brandPosition: brandResult?.position ?? null,
        results,
      })

      // Rate limit between SerpAPI calls
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // ── Aggregate competitors ───────────────────────────────────────────
    const competitorMap = new Map<string, { count: number; totalPosition: number; queries: string[] }>()

    for (const gq of gapQueries) {
      for (const result of gq.results) {
        if (brandDomain && result.domain.includes(brandDomain)) continue

        const existing = competitorMap.get(result.domain)
        if (existing) {
          existing.count++
          existing.totalPosition += result.position
          if (!existing.queries.includes(gq.query)) existing.queries.push(gq.query)
        } else {
          competitorMap.set(result.domain, {
            count: 1,
            totalPosition: result.position,
            queries: [gq.query],
          })
        }
      }
    }

    const topCompetitors = Array.from(competitorMap.entries())
      .map(([domain, data]) => ({
        domain,
        appearances: data.count,
        avgPosition: Math.round(data.totalPosition / data.count * 10) / 10,
        queries: data.queries,
      }))
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 15)

    // ── Build response ──────────────────────────────────────────────────
    const totalQueries = gapQueries.length
    const brandVisibleCount = gapQueries.filter(q => q.brandFound).length
    const gapQueriesResult = gapQueries.filter(q => !q.brandFound)
    const visibleQueries = gapQueries.filter(q => q.brandFound)

    const summaryData = {
      totalQueries,
      brandVisibleIn: brandVisibleCount,
      gapCount: totalQueries - brandVisibleCount,
      visibilityRate: totalQueries > 0
        ? Math.round((brandVisibleCount / totalQueries) * 100)
        : 0,
    }

    // ── Persist to Supabase ─────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from('competitive_gap_analyses')
      .insert({
        brand_id,
        total_queries: summaryData.totalQueries,
        brand_visible_in: summaryData.brandVisibleIn,
        gap_count: summaryData.gapCount,
        visibility_rate: summaryData.visibilityRate,
        brand_domain: brandDomain,
        gap_queries: gapQueriesResult,
        visible_queries: visibleQueries,
        top_competitors: topCompetitors,
        search_queries_used: searchQueries,
        primary_market: primaryMarket,
      })

    if (insertError) {
      console.error('Error saving gap analysis:', insertError)
      // Non-fatal — still return results even if save fails
    }

    // ── Compute trend from previous run ─────────────────────────────────
    let trend = null
    if (lastRun) {
      const { data: prevAnalysis } = await supabase
        .from('competitive_gap_analyses')
        .select('visibility_rate, gap_count, created_at')
        .eq('brand_id', brand_id)
        .order('created_at', { ascending: false })
        .range(1, 1)
        .maybeSingle()

      if (prevAnalysis) {
        trend = {
          visibilityRateChange: summaryData.visibilityRate - prevAnalysis.visibility_rate,
          gapCountChange: summaryData.gapCount - prevAnalysis.gap_count,
          previousDate: prevAnalysis.created_at,
        }
      }
    }

    return NextResponse.json({
      brand: { name: brand.name, domain: brandDomain },
      summary: summaryData,
      gapQueries: gapQueriesResult,
      visibleQueries,
      topCompetitors,
      analyzedAt: new Date().toISOString(),
      trend,
    })
  } catch (err) {
    console.error('Competitive gap analysis error:', err)
    return NextResponse.json({ error: 'Failed to run competitive gap analysis' }, { status: 500 })
  }
}
