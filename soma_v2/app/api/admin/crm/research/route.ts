import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/admin/crm/research - Run AI-powered prospect research
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()
    const { query, industry, location, researchType = 'company' } = body

    if (!query) {
      return NextResponse.json({ error: 'Research query is required' }, { status: 400 })
    }

    const [exaResults, serpResults, serpMapsResults, braveResults, mapsResults, gscSignals] = await Promise.all([
      searchWithExa(query, industry, location),
      searchWithSerp(query, industry, location),
      searchSerpMaps(query, industry, location),
      searchWithBrave(query, industry, location),
      searchWithOverpass(query, industry, location),
      searchWithGSCSignals(supabase, query, industry),
    ])

    console.log(`[CRM Research] Sources: exa=${exaResults.length}, serp=${serpResults.length}, serp_maps=${serpMapsResults.length}, brave=${braveResults.length}, osm=${mapsResults.length}, gsc=${gscSignals.length}`)

    // ── Step 3: Use OpenRouter to analyze, qualify prospects, and find contacts
    const combinedResults = [
      ...exaResults,
      ...serpResults,
      ...serpMapsResults,
      ...braveResults,
      ...mapsResults,
      ...gscSignals,
    ]

    if (combinedResults.length === 0) {
      console.warn('[CRM Research] All search engines returned 0 results. Check API keys: EXA_API_KEY, SERP_API_KEY, BRAVE_SEARCH_API_KEY')
      return NextResponse.json({
        success: true,
        totalFound: 0,
        qualified: 0,
        contactsCreated: 0,
        prospects: [],
        contacts: [],
        debug: {
          exa: exaResults.length,
          serp: serpResults.length,
          serp_maps: serpMapsResults.length,
          brave: braveResults.length,
          osm: mapsResults.length,
          gsc: gscSignals.length,
          hasExaKey: !!process.env.EXA_API_KEY,
          hasSerpKey: !!process.env.SERP_API_KEY,
          hasBraveKey: !!process.env.BRAVE_SEARCH_API_KEY,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        },
      })
    }

    const qualifiedProspects = await qualifyProspectsWithAI(combinedResults, query, industry)

    console.log(`[CRM Research] ${combinedResults.length} raw results → ${qualifiedProspects.length} qualified prospects`)

    // ── Step 4: For each prospect, try to find key contacts/people ─────
    for (const prospect of qualifiedProspects) {
      if (prospect.domain) {
        const contacts = await findCompanyContacts(prospect.domain, prospect.company_name)
        prospect.key_contacts = contacts
      }
    }

    // ── Step 5: Store results and create contacts ───────────────────────
    const createdContacts = []

    for (const prospect of qualifiedProspects) {
      const geo = await resolveProspectGeo(prospect)
      prospect.location_address = prospect.location_address || geo.location_address
      prospect.latitude = prospect.latitude ?? geo.latitude
      prospect.longitude = prospect.longitude ?? geo.longitude

      // Check if contact already exists by domain
      const { data: existing } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('company_domain', prospect.domain)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Create contact
      const geoAddress = await parseLocationParts(prospect.location, prospect.location_address)
      const { data: contact, error } = await supabase
        .from('crm_contacts')
        .insert({
          full_name: prospect.company_name || null,
          company_name: prospect.company_name,
          company_domain: prospect.domain,
          company_industry: prospect.industry || industry,
          company_country: geoAddress.country || prospect.location || location,
          company_city: geoAddress.city || null,
          company_address: prospect.location_address || geoAddress.fullAddress || null,
          company_latitude: prospect.latitude || null,
          company_longitude: prospect.longitude || null,
          company_description: prospect.description || null,
          email: prospect.email || null,
          phone: prospect.phone || null,
          contact_type: 'prospect',
          lead_source: 'research',
          lead_status: 'new',
          lead_score: prospect.fit_score || 0,
          pain_points: prospect.fit_reasons || [],
          research_data: {
            ...(prospect.raw_data || {}),
            key_contacts: prospect.key_contacts || [],
            rating: prospect.rating || null,
            reviews_count: prospect.reviews_count || null,
            roi_potential: prospect.roi_potential || null,
            visibility_score: prospect.visibility_score || null,
            visibility_gap: prospect.visibility_gap || null,
            recommended_approach: prospect.recommended_approach || null,
            recommended_plan: prospect.recommended_plan || null,
            social_links: prospect.social_links || null,
            business_type: prospect.business_type || null,
          },
          visibility_score: prospect.visibility_score,
          estimated_mrr: prospect.estimated_mrr,
          tags: ['ai-researched', researchType],
          notes: prospect.recommended_approach,
        })
        .select()
        .single()

      if (!error && contact) {
        createdContacts.push(contact)
        // Link contact ID back to prospect so the frontend can reference it
        prospect.contact_id = contact.id

        // Store detailed research
        await supabase.from('crm_prospect_research').insert({
          contact_id: contact.id,
          research_query: query,
          research_type: researchType,
          company_name: prospect.company_name,
          domain: prospect.domain,
          description: prospect.description,
          industry: prospect.industry,
          employee_count: prospect.employee_count,
          location: prospect.location,
          location_address: prospect.location_address || null,
          latitude: prospect.latitude || null,
          longitude: prospect.longitude || null,
          current_ai_visibility_score: prospect.visibility_score,
          estimated_monthly_ai_searches: prospect.monthly_ai_searches,
          competitor_visibility_gap: prospect.visibility_gap,
          roi_potential: prospect.roi_potential || {},
          search_data: prospect.search_data || {},
          ai_mentions: prospect.ai_mentions || {},
          fit_score: prospect.fit_score,
          fit_reasons: prospect.fit_reasons || [],
          recommended_plan: prospect.recommended_plan,
          recommended_approach: prospect.recommended_approach,
          sources_used: prospect.sources_used || [],
          raw_data: {
            ...(prospect.raw_data || {}),
            key_contacts: prospect.key_contacts || [],
          },
          status: 'completed',
        })

        // Create individual person contacts for key people found
        if (prospect.key_contacts && prospect.key_contacts.length > 0) {
          for (const person of prospect.key_contacts) {
            if (!person.name) continue
            // Skip if a contact with this email already exists
            if (person.email) {
              const { data: exists } = await supabase
                .from('crm_contacts')
                .select('id')
                .eq('email', person.email)
                .limit(1)
              if (exists && exists.length > 0) continue
            }

            await supabase.from('crm_contacts').insert({
              email: person.email || null,
              full_name: person.name,
              job_title: person.title || null,
              linkedin_url: person.linkedin || null,
              company_name: prospect.company_name,
              company_domain: prospect.domain,
              company_industry: prospect.industry || industry,
              company_country: geoAddress.country || prospect.location || location,
              company_city: geoAddress.city || null,
              company_address: prospect.location_address || geoAddress.fullAddress || null,
              company_latitude: prospect.latitude || null,
              company_longitude: prospect.longitude || null,
              company_description: prospect.description || null,
              contact_type: 'prospect',
              lead_source: 'research',
              lead_status: 'new',
              lead_score: Math.min(prospect.fit_score || 0, 70),
              pain_points: prospect.fit_reasons || [],
              tags: ['ai-researched', 'key-contact', researchType],
              notes: `${person.title || 'Contact'} at ${prospect.company_name}. ${prospect.recommended_approach || ''}`,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: combinedResults.length,
      qualified: qualifiedProspects.length,
      contactsCreated: createdContacts.length,
      prospects: qualifiedProspects,
      contacts: createdContacts,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/research:', error)
    return NextResponse.json({ error: 'Research failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}

// GET /api/admin/crm/research - Get past research results
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabase
      .from('crm_prospect_research')
      .select(`
        *,
        contact:crm_contacts(id, full_name, email, company_name, lead_status, lead_score)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching research:', error)
      return NextResponse.json({ error: 'Failed to fetch research' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/research:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/research - Remove a research record and optionally its contacts
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const researchId = searchParams.get('id')
    const removeContacts = searchParams.get('removeContacts') !== 'false'

    if (!researchId) {
      return NextResponse.json({ error: 'Research ID is required' }, { status: 400 })
    }

    // Fetch the research record to find associated contact
    const { data: record } = await supabase
      .from('crm_prospect_research')
      .select('id, contact_id, domain')
      .eq('id', researchId)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Research record not found' }, { status: 404 })
    }

    // Delete the research record
    const { error: deleteError } = await supabase
      .from('crm_prospect_research')
      .delete()
      .eq('id', researchId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete research record' }, { status: 500 })
    }

    let contactsDeleted = 0

    // Optionally remove all contacts with the same domain
    if (removeContacts && record.domain) {
      const { data: domainContacts } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('company_domain', record.domain)

      if (domainContacts && domainContacts.length > 0) {
        const { error: contactError } = await supabase
          .from('crm_contacts')
          .delete()
          .eq('company_domain', record.domain)

        if (!contactError) contactsDeleted = domainContacts.length
      }
    }

    return NextResponse.json({ success: true, contactsDeleted })
  } catch (error) {
    console.error('Error in DELETE /api/admin/crm/research:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Research engine functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Nominatim returns verbose strings like "Chicago, South Chicago Township, Cook County, Illinois, United States".
 * SerpAPI only accepts clean locations like "Chicago, Illinois, United States".
 * This extracts city + state + country from a comma-separated display_name.
 */
function simplifyLocation(location: string): string {
  if (!location) return ''
  const parts = location.split(',').map(p => p.trim())
  if (parts.length <= 3) return location
  // Nominatim format: city, township/suburb, county, state, country
  // We want: first part (city), second-to-last (state), last (country)
  const city = parts[0]
  const state = parts[parts.length - 2]
  const country = parts[parts.length - 1]
  return `${city}, ${state}, ${country}`
}

async function searchWithExa(query: string, industry?: string, location?: string): Promise<any[]> {
  const exaKey = process.env.EXA_API_KEY
  if (!exaKey) return []

  try {
    const searchQuery = [
      query,
      industry ? `${industry} company` : '',
      location ? `based in ${simplifyLocation(location)}` : '',
    ].filter(Boolean).join(' ')

    console.log('[CRM Research] Exa query:', searchQuery)

    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaKey,
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: 15,
        type: 'auto',
        category: 'company',
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: 500 },
          highlights: { numSentences: 3 },
          summary: true,
        },
      }),
    })

    if (!res.ok) {
      console.error('Exa search failed:', res.status, await res.text().catch(() => ''))
      return []
    }

    const data = await res.json()

    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      domain: extractDomain(r.url),
      text: r.summary || r.text,
      highlights: r.highlights,
      score: r.score,
      source: 'exa',
    }))
  } catch (err) {
    console.error('Exa search error:', err)
    return []
  }
}

async function searchWithSerp(query: string, industry?: string, location?: string): Promise<any[]> {
  const serpKey = process.env.SERP_API_KEY
  if (!serpKey) return []

  try {
    const searchQuery = [
      query,
      industry || '',
      location ? `in ${simplifyLocation(location)}` : '',
    ].filter(Boolean).join(' ')

    console.log('[CRM Research] SerpAPI query:', searchQuery)

    const params = new URLSearchParams({
      api_key: serpKey,
      q: searchQuery,
      engine: 'google',
      num: '15',
    })
    if (location) {
      const clean = simplifyLocation(location)
      params.set('location', clean)
    }

    const res = await fetch(`https://serpapi.com/search?${params}`)
    if (!res.ok) {
      console.error('SerpAPI search failed:', res.status, await res.text().catch(() => ''))
      return []
    }
    const data = await res.json()

    return (data.organic_results || []).map((r: any) => ({
      title: r.title,
      url: r.link,
      domain: extractDomain(r.link),
      text: r.snippet,
      position: r.position,
      source: 'serp',
    }))
  } catch (err) {
    console.error('SerpAPI search error:', err)
    return []
  }
}

async function searchSerpMaps(query: string, industry?: string, location?: string): Promise<any[]> {
  const serpKey = process.env.SERP_API_KEY
  if (!serpKey) return []

  try {
    const cleanLocation = location ? simplifyLocation(location) : ''
    const mapQuery = [query, industry || '', cleanLocation ? `in ${cleanLocation}` : ''].filter(Boolean).join(' ')

    const params = new URLSearchParams({
      api_key: serpKey,
      q: mapQuery,
      engine: 'google_maps',
      type: 'search',
    })

    console.log('[CRM Research] SerpAPI Maps query:', mapQuery)

    const res = await fetch(`https://serpapi.com/search?${params}`)
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`SerpAPI Maps failed: ${res.status}`, errText)
      return []
    }
    const data = await res.json()

    return (data.local_results || []).map((place: any) => ({
      title: place.title || 'Business',
      url: place.website || '',
      domain: place.website ? extractDomain(place.website) : '',
      text: [
        place.type,
        place.address,
        place.rating ? `Rating: ${place.rating}/5 (${place.reviews || 0} reviews)` : null,
        place.phone,
        place.description,
        place.hours ? `Hours: ${typeof place.hours === 'string' ? place.hours : JSON.stringify(place.hours)}` : null,
      ].filter(Boolean).join(' • '),
      rating: place.rating,
      reviews_count: place.reviews,
      phone: place.phone,
      email: null,
      business_type: place.type || null,
      hours: place.hours || null,
      social_links: {
        facebook: place.links?.facebook || null,
        instagram: place.links?.instagram || null,
        twitter: place.links?.twitter || null,
        linkedin: place.links?.linkedin || null,
        youtube: place.links?.youtube || null,
        yelp: place.links?.yelp || null,
      },
      location_address: place.address || null,
      latitude: place.gps_coordinates?.latitude ?? null,
      longitude: place.gps_coordinates?.longitude ?? null,
      source: 'serp_maps',
    })).filter((r: any) => r.domain)
  } catch (err) {
    console.error('SerpAPI Maps error:', err)
    return []
  }
}

async function searchWithBrave(query: string, industry?: string, location?: string): Promise<any[]> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY
  if (!braveKey) return []

  try {
    const searchQuery = [query, industry || '', location || ''].filter(Boolean).join(' ')
    const params = new URLSearchParams({
      q: searchQuery,
      count: '10',
      search_lang: 'en',
      country: 'us',
      safesearch: 'moderate',
    })

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': braveKey,
      },
    })

    if (!response.ok) return []
    const data = await response.json()

    return (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      domain: extractDomain(result.url),
      text: result.description,
      source: 'brave',
    }))
  } catch (error) {
    console.error('Brave search error:', error)
    return []
  }
}

async function searchWithOverpass(query: string, industry?: string, location?: string): Promise<any[]> {
  try {
    const searchQuery = [query, industry || '', location || ''].filter(Boolean).join(' ')
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'jsonv2',
      addressdetails: '1',
      extratags: '1',
      limit: '15',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': process.env.OPENSTREETMAP_USER_AGENT || 'SomaAI-CRM/1.0',
      },
    })

    if (!response.ok) {
      console.error('Nominatim search error:', response.status)
      return []
    }

    const data = await response.json()

    return (data || [])
      .filter((place: any) => place.extratags?.website || place.extratags?.['contact:website'])
      .map((place: any) => {
        const website = place.extratags?.website || place.extratags?.['contact:website'] || ''
        return {
          title: place.display_name?.split(',')[0] || place.name || 'Business',
          url: website,
          domain: extractDomain(website),
          text: [place.type, place.display_name, place.extratags?.description].filter(Boolean).join(' • '),
          rating: place.extratags?.stars ? parseFloat(place.extratags.stars) : undefined,
          location_address: place.display_name || null,
          latitude: place.lat ? parseFloat(place.lat) : null,
          longitude: place.lon ? parseFloat(place.lon) : null,
          phone: place.extratags?.phone || place.extratags?.['contact:phone'] || null,
          email: place.extratags?.email || place.extratags?.['contact:email'] || null,
          business_type: place.type || null,
          hours: place.extratags?.opening_hours || null,
          social_links: {
            facebook: place.extratags?.['contact:facebook'] || null,
            instagram: place.extratags?.['contact:instagram'] || null,
            twitter: place.extratags?.['contact:twitter'] || null,
            linkedin: place.extratags?.['contact:linkedin'] || null,
          },
          source: 'openstreetmap',
        }
      })
  } catch (error) {
    console.error('Nominatim/OSM search error:', error)
    return []
  }
}

async function searchWithGSCSignals(
  supabase: ReturnType<typeof createServiceClient>,
  query: string,
  industry?: string
): Promise<any[]> {
  try {
    let gscQuery = supabase
      .from('gsc_performance_data')
      .select('query, page, clicks, impressions, ctr, position')
      .not('query', 'is', null)
      .order('impressions', { ascending: false })
      .limit(20)

    if (industry) {
      gscQuery = gscQuery.ilike('query', `%${industry}%`)
    }

    const { data, error } = await gscQuery
    if (error || !data) return []

    return data.map((row: any) => ({
      title: row.query,
      url: row.page || '',
      domain: extractDomain(row.page || ''),
      text: `GSC demand signal for ${query}. Impressions: ${row.impressions || 0}, clicks: ${row.clicks || 0}, CTR: ${row.ctr || 0}, position: ${row.position || 0}`,
      source: 'gsc',
    }))
  } catch (error) {
    console.error('GSC signal search error:', error)
    return []
  }
}

async function qualifyProspectsWithAI(
  results: any[],
  query: string,
  industry?: string
): Promise<any[]> {
  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey || results.length === 0) return []

  // Deduplicate by domain
  const uniqueDomains = new Map<string, any>()
  for (const r of results) {
    if (r.domain && !uniqueDomains.has(r.domain)) {
      uniqueDomains.set(r.domain, r)
    } else if (r.domain && uniqueDomains.has(r.domain)) {
      // Merge additional data like reviews, location, emails, social
      const existing = uniqueDomains.get(r.domain)!
      if (r.rating && !existing.rating) existing.rating = r.rating
      if (r.reviews_count && !existing.reviews_count) existing.reviews_count = r.reviews_count
      if (r.phone && !existing.phone) existing.phone = r.phone
      if (r.email && !existing.email) existing.email = r.email
      if (r.business_type && !existing.business_type) existing.business_type = r.business_type
      if (r.hours && !existing.hours) existing.hours = r.hours
      if (r.location_address && !existing.location_address) existing.location_address = r.location_address
      if (r.latitude && !existing.latitude) existing.latitude = r.latitude
      if (r.longitude && !existing.longitude) existing.longitude = r.longitude
      if (r.text && existing.text) existing.text += ` | ${r.text}`
      // Merge social links
      if (r.social_links) {
        existing.social_links = existing.social_links || {}
        for (const [platform, url] of Object.entries(r.social_links)) {
          if (url && !existing.social_links[platform]) existing.social_links[platform] = url
        }
      }
      existing.sources_used = [...(existing.sources_used || [existing.source]), r.source]
    }
  }

  const prospects = Array.from(uniqueDomains.values()).slice(0, 20)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are an elite B2B Data Scraper & AI Visibility Analyst for Soma AI. Soma AI is a Generative Engine Optimization (GEO) platform that boosts businesses' rankings in AI-driven tools (ChatGPT, Gemini, Claude, Perplexity).

You are receiving highly detailed scraped data from Google Maps, Exa, Brave, SERP APIs, and Google Search Console. 
Your primary directive is to rank, qualify, and synthesize this raw web intelligence.

FOCUS: We are selling to BUSINESSES. Prioritize businesses that:
- Have revenue and can afford $99-$999/mo (look for established businesses, not hobby bloggers)
- Are in competitive industries where AI visibility matters (services, healthcare, legal, SaaS, real estate, restaurants, etc.)
- Have a website but weak AI/content/SEO presence (biggest opportunity)
- Have poor reviews or online reputation issues (opportunity to help them)

Assess every prospect according to:
1. Company relevance & digital footprint based on the scrape
2. AI visibility gap (how invisible are they right now vs competitors?)
3. Estimated monthly recurring revenue (MRR) they could pay Soma AI (Growth $99, Pro $299, Enterprise $999)
4. Run a "mini visibility and ROI" calculation
5. Strict Qualification: Fit score (0-100)
6. Provide a ruthless, direct outreach hook leveraging their specific weak points

CRITICAL: For each business, you MUST extract and include ALL available contact information:
- Business email address (look for info@, contact@, hello@ patterns from website text)
- Phone number (from the scraped data)
- Business description (2-3 sentences about what they do)
- Social media links (Facebook, Instagram, LinkedIn, Twitter, YouTube, Yelp)
- Key decision-makers (CEO, Owner, Marketing Director, etc.) with their names, titles, and LinkedIn profiles
- Business type/category

Output a highly refined JSON array containing strictly qualified businesses (fit_score >= 40) using the exact structure below:
[{
  "company_name": "...",
  "domain": "...",
  "description": "2-3 sentence description of what this business does and their market position",
  "industry": "...",
  "business_type": "specific business category",
  "employee_count": "...",
  "location": "City, State, Country",
  "location_address": "full street address if available",
  "latitude": null,
  "longitude": null,
  "phone": "business phone number",
  "email": "business email address",
  "social_links": {
    "facebook": "url or null",
    "instagram": "url or null",
    "linkedin": "url or null",
    "twitter": "url or null",
    "youtube": "url or null",
    "yelp": "url or null"
  },
  "visibility_score": 0-100,
  "monthly_ai_searches": 0,
  "visibility_gap": "description",
  "estimated_mrr": 299,
  "roi_potential": {
    "monthly_visibility_lift": "...",
    "estimated_new_leads": "...",
    "payback_period": "..."
  },
  "fit_score": 0-100,
  "fit_reasons": ["reason 1", "reason 2"],
  "recommended_plan": "growth|pro|enterprise",
  "recommended_approach": "1-2 sentence outreach hook",
  "key_contacts": [
    { "name": "Full Name", "title": "CEO/Owner/Marketing Director", "email": "guessed email", "linkedin": "linkedin url" }
  ],
  "sources_used": ["exa", "serp_maps"]
}]
Only return the raw JSON array.`
          },
          {
            role: 'user',
            content: `Research query: "${query}"
Industry focus: ${industry || 'general'}

Here are the search results to analyze:

${prospects.map((p, i) => {
  const socialStr = p.social_links
    ? Object.entries(p.social_links).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
    : ''
  return `${i + 1}. ${p.title}\n   URL: ${p.url}\n   Domain: ${p.domain}\n   ${p.text || ''}\n   ${p.rating ? `Rating: ${p.rating}/5` : ''}${p.reviews_count ? ` (${p.reviews_count} reviews)` : ''}\n   ${p.phone ? `Phone: ${p.phone}` : ''}\n   ${p.email ? `Email: ${p.email}` : ''}\n   ${p.location_address ? `Address: ${p.location_address}` : ''}\n   ${p.business_type ? `Type: ${p.business_type}` : ''}\n   ${p.hours ? `Hours: ${typeof p.hours === 'string' ? p.hours : JSON.stringify(p.hours)}` : ''}\n   ${socialStr ? `Social: ${socialStr}` : ''}\n   Source: ${p.sources_used?.join(', ') || p.source}`
}).join('\n\n')}

Analyze these and return qualified prospects as JSON. Include ALL contact details, emails, phone numbers, social media links, and key people you can find or infer for each business.`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      console.error('OpenRouter error:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed.map((p: any) => {
      const source = prospects.find(pr => pr.domain === p.domain)
      const sourceGeo = pickGeoFromSearchResult(source)

      // Merge social links from source data and AI output
      const mergedSocial = { ...(source?.social_links || {}), ...(p.social_links || {}) }
      // Remove null values
      for (const key of Object.keys(mergedSocial)) {
        if (!mergedSocial[key]) delete mergedSocial[key]
      }

      return {
        ...p,
        phone: p.phone || source?.phone || null,
        email: p.email || source?.email || null,
        business_type: p.business_type || source?.business_type || null,
        social_links: Object.keys(mergedSocial).length > 0 ? mergedSocial : null,
        location_address: p.location_address || sourceGeo.location_address || null,
        latitude: normalizeCoord(p.latitude) ?? sourceGeo.latitude,
        longitude: normalizeCoord(p.longitude) ?? sourceGeo.longitude,
        raw_data: {
          search_results: source || {},
          ai_analysis: true,
        },
        search_data: source || {},
      }
    }) : []
  } catch (err) {
    console.error('AI qualification error:', err)
    return []
  }
}

function pickGeoFromSearchResult(result: any) {
  if (!result) return {}

  return {
    location_address: result.location_address || null,
    latitude: typeof result.latitude === 'number' ? result.latitude : null,
    longitude: typeof result.longitude === 'number' ? result.longitude : null,
  }
}

async function resolveProspectGeo(prospect: any): Promise<{ location_address: string | null; latitude: number | null; longitude: number | null }> {
  const fromProspect = {
    location_address: prospect.location_address || null,
    latitude: normalizeCoord(prospect.latitude),
    longitude: normalizeCoord(prospect.longitude),
  }

  if (fromProspect.latitude != null && fromProspect.longitude != null) {
    return fromProspect
  }

  // Strategy 1: Geocode the street address if we have one
  if (prospect.location_address) {
    const byAddress = await geocodeWithOpenStreetMap(prospect.location_address)
    if (byAddress.latitude != null && byAddress.longitude != null) {
      console.log(`[CRM Geo] Resolved "${prospect.company_name}" via address: ${prospect.location_address}`)
      return { ...byAddress, location_address: fromProspect.location_address || byAddress.location_address }
    }
  }

  // Strategy 2: Geocode the city/state/country location string
  if (prospect.location && prospect.location !== 'Unknown location') {
    const byLocation = await geocodeWithOpenStreetMap(prospect.location)
    if (byLocation.latitude != null && byLocation.longitude != null) {
      console.log(`[CRM Geo] Resolved "${prospect.company_name}" via location: ${prospect.location}`)
      return { ...byLocation, location_address: fromProspect.location_address || byLocation.location_address }
    }
  }

  // Strategy 3: Try company name + location together (for specific business lookups)
  if (prospect.company_name && prospect.location && prospect.location !== 'Unknown location') {
    const byNameAndLocation = await geocodeWithOpenStreetMap(`${prospect.company_name}, ${prospect.location}`)
    if (byNameAndLocation.latitude != null && byNameAndLocation.longitude != null) {
      console.log(`[CRM Geo] Resolved "${prospect.company_name}" via name+location`)
      return { ...byNameAndLocation, location_address: fromProspect.location_address || byNameAndLocation.location_address }
    }
  }

  console.warn(`[CRM Geo] Could not geocode "${prospect.company_name}" (location: ${prospect.location || 'none'}, address: ${prospect.location_address || 'none'})`)
  return fromProspect
}

async function geocodeWithOpenStreetMap(query: string): Promise<{ location_address: string | null; latitude: number | null; longitude: number | null }> {
  try {
    // Nominatim rate limit: 1 req/sec — small delay to stay compliant
    await new Promise(resolve => setTimeout(resolve, 1100))

    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '1',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': process.env.OPENSTREETMAP_USER_AGENT || 'SomaAI-CRM/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`[CRM Geo] Nominatim HTTP ${response.status} for query: "${query}"`)
      return { location_address: null, latitude: null, longitude: null }
    }

    const data = await response.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first) {
      console.warn(`[CRM Geo] Nominatim returned 0 results for: "${query}"`)
      return { location_address: null, latitude: null, longitude: null }
    }

    return {
      location_address: first.display_name || null,
      latitude: normalizeCoord(first.lat),
      longitude: normalizeCoord(first.lon),
    }
  } catch (err) {
    console.error(`[CRM Geo] Nominatim error for "${query}":`, err)
    return { location_address: null, latitude: null, longitude: null }
  }
}

function normalizeCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

async function parseLocationParts(
  locationHint?: string,
  addressHint?: string
): Promise<{ city: string | null; state: string | null; country: string | null; fullAddress: string | null }> {
  const empty = { city: null, state: null, country: null, fullAddress: null }
  const query = addressHint || locationHint
  if (!query) return empty

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '1',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': process.env.OPENSTREETMAP_USER_AGENT || 'SomaAI-CRM/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return empty

    const data = await response.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first?.address) return empty

    const addr = first.address
    return {
      city: addr.city || addr.town || addr.village || addr.municipality || null,
      state: addr.state || addr.region || null,
      country: addr.country || null,
      fullAddress: first.display_name || null,
    }
  } catch {
    return empty
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Find key contacts/people at a company using Exa and SerpAPI.
 * Searches LinkedIn, about pages, team pages to find decision-makers.
 */
async function findCompanyContacts(
  domain: string,
  companyName: string
): Promise<Array<{ name: string; title: string; email?: string; linkedin?: string }>> {
  const contacts: Array<{ name: string; title: string; email?: string; linkedin?: string }> = []

  // Search Exa for team/about pages and LinkedIn profiles
  const exaKey = process.env.EXA_API_KEY
  if (exaKey) {
    try {
      const queries = [
        `site:linkedin.com/in "${companyName}" CEO OR CMO OR "VP Marketing" OR "Head of Marketing" OR "Marketing Director" OR Founder`,
        `site:${domain} team OR about OR leadership`,
      ]

      for (const q of queries) {
        const res = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': exaKey },
          body: JSON.stringify({
            query: q,
            numResults: 5,
            type: 'auto',
            useAutoprompt: false,
            contents: { text: { maxCharacters: 300 } },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          for (const r of data.results || []) {
            // Parse LinkedIn profiles
            if (r.url?.includes('linkedin.com/in/')) {
              const nameMatch = r.title?.replace(/ [-–|].*$/, '').trim()
              const titleMatch = r.text?.match(/(CEO|CMO|CTO|COO|Founder|Co-Founder|VP|Director|Head|Manager|Chief)\s*(of\s*)?[A-Za-z\s]*/i)
              if (nameMatch) {
                contacts.push({
                  name: nameMatch,
                  title: titleMatch ? titleMatch[0].trim() : 'Executive',
                  linkedin: r.url,
                })
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Exa contact search error:', err)
    }
  }

  // Also search with SerpAPI for LinkedIn profiles
  const serpKey = process.env.SERP_API_KEY
  if (serpKey && contacts.length < 3) {
    try {
      const params = new URLSearchParams({
        api_key: serpKey,
        q: `site:linkedin.com/in "${companyName}" marketing OR CEO OR founder`,
        engine: 'google',
        num: '5',
      })

      const res = await fetch(`https://serpapi.com/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        for (const r of data.organic_results || []) {
          if (r.link?.includes('linkedin.com/in/')) {
            const nameMatch = r.title?.replace(/ [-–|].*$/, '').trim()
            const titleSnippet = r.snippet || r.title || ''
            const titleMatch = titleSnippet.match(/(CEO|CMO|CTO|COO|Founder|Co-Founder|VP|Director|Head|Manager|Chief)\s*(of\s*)?[A-Za-z\s]*/i)
            // Skip if already found this person
            if (nameMatch && !contacts.some(c => c.name === nameMatch)) {
              contacts.push({
                name: nameMatch,
                title: titleMatch ? titleMatch[0].trim() : 'Professional',
                linkedin: r.link,
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('Serp contact search error:', err)
    }
  }

  // Try to guess email patterns for found contacts
  for (const contact of contacts) {
    if (!contact.email && domain) {
      const nameParts = contact.name.toLowerCase().split(' ').filter(p => p.length > 1)
      if (nameParts.length >= 2) {
        // Most common B2B format: first.last@domain
        contact.email = `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${domain}`
      }
    }
  }

  return contacts.slice(0, 5) // Return up to 5 contacts
}
