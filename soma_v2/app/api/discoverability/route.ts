/**
 * Unified Discoverability API
 * 
 * Handles various discoverability actions including:
 * - robots.txt analysis and generation
 * - Schema.org markup analysis, validation, and generation
 * - Site crawling and indexing operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

// ─── LLM completion helper with OpenRouter → free model → OpenAI fallback ──

async function llmComplete(
  messages: { role: string; content: string }[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const maxTokens = opts?.maxTokens ?? 1500
  const temperature = opts?.temperature ?? 0.7
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
  }

  // 1. Try OpenRouter paid model
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content) return content
      } else {
        const errText = await res.text()
        console.warn('OpenRouter paid model failed, trying free model:', errText)
      }
    } catch (e) {
      console.warn('OpenRouter paid error, trying free model:', e)
    }

    // 2. Fallback to OpenRouter free auto-router (no credits needed)
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'openrouter/free',
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content) {
          console.log('Used openrouter/free model')
          return content
        }
      } else {
        const errText = await res.text()
        console.warn('OpenRouter free failed:', errText)
      }
    } catch (e) {
      console.warn('OpenRouter free error:', e)
    }
    console.warn('OpenRouter free failed, trying OpenAI')
  }

  // 3. Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    }
    const errText = await res.text()
    console.error('OpenAI fallback also failed:', errText)
  }

  throw new Error('All LLM providers failed')
}

// Known AI crawlers and their user-agents
const AI_CRAWLERS = [
  { name: 'GPTBot', userAgent: 'GPTBot', company: 'OpenAI' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', company: 'Google' },
  { name: 'Claude-Web', userAgent: 'Claude-Web', company: 'Anthropic' },
  { name: 'CCBot', userAgent: 'CCBot', company: 'Common Crawl' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', company: 'Perplexity' },
  { name: 'Amazonbot', userAgent: 'Amazonbot', company: 'Amazon' },
  { name: 'FacebookBot', userAgent: 'FacebookBot', company: 'Meta' },
  { name: 'Bytespider', userAgent: 'Bytespider', company: 'ByteDance' },
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, brand_id, url, config, schema, template_id, data } = body

    const supabase = createServiceClient()

    switch (action) {
      case 'analyze-robots':
        return await analyzeRobotsTxt(url, brand_id, supabase)

      case 'generate-robots':
        return await generateRobotsTxt(config, brand_id, supabase)

      case 'analyze-schema':
        return await analyzeSchema(url, brand_id, supabase)

      case 'validate-schema':
        return await validateSchema(schema)

      case 'generate-schema':
        return await generateSchema(template_id, data, brand_id, supabase)

      case 'generate-content':
        return await generateOutreachContent(body, brand_id, supabase)

      case 'generate-how-to':
        return await generateHowToGuide(body, brand_id, supabase)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Discoverability API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function analyzeRobotsTxt(url: string, brandId: string, supabase: any) {
  try {
    // Normalize URL
    const siteUrl = url.startsWith('http') ? url : `https://${url}`
    const robotsUrl = new URL('/robots.txt', siteUrl).toString()

    // Fetch robots.txt
    let robotsContent = ''
    let fetchError = null

    try {
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': 'Soma-AI-Analyzer/1.0' },
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok) {
        robotsContent = await response.text()
      } else {
        fetchError = `HTTP ${response.status}`
      }
    } catch (e: any) {
      fetchError = e.message || 'Failed to fetch'
    }

    // Analyze the robots.txt content
    const analysis = analyzeRobotsContent(robotsContent, fetchError)

    // Store the analysis
    if (brandId) {
      await supabase
        .from('robots_txt_analyses')
        .upsert({
          brand_id: brandId,
          url: siteUrl,
          raw_content: robotsContent,
          analysis: analysis,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'brand_id,url'
        })
    }

    return NextResponse.json({ 
      success: true, 
      analysis: {
        ...analysis,
        raw_content: robotsContent,
        url: robotsUrl
      }
    })
  } catch (error) {
    console.error('Robots.txt analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze robots.txt' }, { status: 500 })
  }
}

function analyzeRobotsContent(content: string, fetchError: string | null) {
  if (fetchError) {
    return {
      exists: false,
      error: fetchError,
      ai_crawler_rules: [],
      issues: ['robots.txt not found or not accessible'],
      recommendations: ['Create a robots.txt file to control crawler access']
    }
  }

  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  const rules: any[] = []
  let currentUserAgent = '*'

  for (const line of lines) {
    if (line.toLowerCase().startsWith('user-agent:')) {
      currentUserAgent = line.substring(11).trim()
    } else if (line.toLowerCase().startsWith('disallow:')) {
      const path = line.substring(9).trim()
      rules.push({ userAgent: currentUserAgent, type: 'disallow', path })
    } else if (line.toLowerCase().startsWith('allow:')) {
      const path = line.substring(6).trim()
      rules.push({ userAgent: currentUserAgent, type: 'allow', path })
    }
  }

  // Check AI crawler rules
  const aiCrawlerRules = AI_CRAWLERS.map(crawler => {
    const crawlerRules = rules.filter(r => 
      r.userAgent === crawler.userAgent || 
      r.userAgent === '*' ||
      r.userAgent.toLowerCase() === crawler.userAgent.toLowerCase()
    )
    
    const blocked = crawlerRules.some(r => r.type === 'disallow' && (r.path === '/' || r.path === ''))
    const allowed = !blocked || crawlerRules.some(r => r.type === 'allow')

    return {
      crawler: crawler.name,
      company: crawler.company,
      status: blocked && !allowed ? 'blocked' : 'allowed',
      rules: crawlerRules
    }
  })

  const issues: string[] = []
  const recommendations: string[] = []

  // Check for common issues
  const blockedAICrawlers = aiCrawlerRules.filter(r => r.status === 'blocked')
  if (blockedAICrawlers.length > 0) {
    issues.push(`${blockedAICrawlers.length} AI crawlers are blocked`)
    recommendations.push('Consider allowing AI crawlers to improve discoverability in AI search engines')
  }

  if (!content.includes('Sitemap:')) {
    issues.push('No sitemap reference found')
    recommendations.push('Add a Sitemap directive to help crawlers discover your content')
  }

  return {
    exists: true,
    ai_crawler_rules: aiCrawlerRules,
    total_rules: rules.length,
    issues,
    recommendations,
    crawl_delay: content.match(/crawl-delay:\s*(\d+)/i)?.[1] || null
  }
}

async function generateRobotsTxt(config: any, brandId: string, supabase: any) {
  const lines: string[] = []
  
  // Add header comment
  lines.push('# Robots.txt generated by Soma AI')
  lines.push(`# Generated: ${new Date().toISOString()}`)
  lines.push('')

  // Default rules for all bots
  lines.push('User-agent: *')
  lines.push('Allow: /')
  lines.push('')

  // AI crawler specific rules
  if (config?.allow_gptbot !== false) {
    lines.push('User-agent: GPTBot')
    lines.push('Allow: /')
    lines.push('')
  } else {
    lines.push('User-agent: GPTBot')
    lines.push('Disallow: /')
    lines.push('')
  }

  if (config?.allow_google_extended !== false) {
    lines.push('User-agent: Google-Extended')
    lines.push('Allow: /')
    lines.push('')
  } else {
    lines.push('User-agent: Google-Extended')
    lines.push('Disallow: /')
    lines.push('')
  }

  if (config?.allow_claudebot !== false) {
    lines.push('User-agent: Claude-Web')
    lines.push('Allow: /')
    lines.push('')
  } else {
    lines.push('User-agent: Claude-Web')
    lines.push('Disallow: /')
    lines.push('')
  }

  if (config?.allow_ccbot !== false) {
    lines.push('User-agent: CCBot')
    lines.push('Allow: /')
    lines.push('')
  } else {
    lines.push('User-agent: CCBot')
    lines.push('Disallow: /')
    lines.push('')
  }

  // Add sitemap if provided
  if (config?.sitemap_url) {
    lines.push(`Sitemap: ${config.sitemap_url}`)
  }

  const robotsTxt = lines.join('\n')

  return NextResponse.json({ 
    success: true, 
    robots_txt: robotsTxt 
  })
}

async function analyzeSchema(url: string, brandId: string, supabase: any) {
  try {
    const siteUrl = url.startsWith('http') ? url : `https://${url}`

    // Fetch the page
    let htmlContent = ''
    try {
      console.log(`[analyzeSchema] Fetching URL: ${siteUrl}`)
      const response = await fetch(siteUrl, {
        headers: { 'User-Agent': 'Soma-AI-Analyzer/1.0' },
        signal: AbortSignal.timeout(15000)
      })
      
      if (response.ok) {
        htmlContent = await response.text()
      } else {
        console.error(`[analyzeSchema] Failed to fetch page: HTTP ${response.status} ${response.statusText}`)
        return NextResponse.json({ 
          error: `Failed to fetch page: HTTP ${response.status}` 
        }, { status: 400 })
      }
    } catch (e: any) {
      console.error(`[analyzeSchema] Fetch error:`, e)
      return NextResponse.json({ 
        error: `Failed to fetch page: ${e.message}` 
      }, { status: 400 })
    }

    // Extract JSON-LD schemas
    const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    const schemas: any[] = []
    const errors: any[] = []

    for (const match of jsonLdMatches) {
      const jsonMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim())
          schemas.push(parsed)
        } catch (e) {
          errors.push({ type: 'parse_error', message: 'Invalid JSON in script tag' })
        }
      }
    }

    // Analyze found schemas
    const schemaTypes = schemas.map(s => s['@type'] || 'Unknown')
    const hasOrganization = schemaTypes.some(t => t === 'Organization' || t === 'LocalBusiness')
    const hasWebSite = schemaTypes.some(t => t === 'WebSite')
    const hasBreadcrumb = schemaTypes.some(t => t === 'BreadcrumbList')
    const hasFAQ = schemaTypes.some(t => t === 'FAQPage')
    const hasArticle = schemaTypes.some(t => t === 'Article' || t === 'NewsArticle' || t === 'BlogPosting')
    const hasProduct = schemaTypes.some(t => t === 'Product')

    const recommendations: string[] = []
    if (!hasOrganization) recommendations.push('Add Organization or LocalBusiness schema')
    if (!hasWebSite) recommendations.push('Add WebSite schema with SearchAction')
    if (!hasBreadcrumb) recommendations.push('Add BreadcrumbList for navigation structure')

    const analysis = {
      url: siteUrl,
      schemas_found: schemas.length,
      schema_types: schemaTypes,
      schemas,
      has_organization: hasOrganization,
      has_website: hasWebSite,
      has_breadcrumb: hasBreadcrumb,
      has_faq: hasFAQ,
      has_article: hasArticle,
      has_product: hasProduct,
      errors,
      recommendations,
      score: calculateSchemaScore(schemas, {
        hasOrganization,
        hasWebSite,
        hasBreadcrumb,
        hasFAQ,
        hasArticle,
        hasProduct
      })
    }

    // Store the analysis
    if (brandId) {
      await supabase
        .from('schema_analyses')
        .upsert({
          brand_id: brandId,
          url: siteUrl,
          analysis,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'brand_id,url'
        })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Schema analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze schema' }, { status: 500 })
  }
}

function calculateSchemaScore(schemas: any[], flags: any): number {
  let score = 0
  const maxScore = 100

  // Base score for having any schema
  if (schemas.length > 0) score += 20

  // Points for important schema types
  if (flags.hasOrganization) score += 20
  if (flags.hasWebSite) score += 15
  if (flags.hasBreadcrumb) score += 10
  if (flags.hasFAQ) score += 15
  if (flags.hasArticle) score += 10
  if (flags.hasProduct) score += 10

  return Math.min(score, maxScore)
}

async function validateSchema(schema: any) {
  const errors: any[] = []
  const warnings: any[] = []

  // Check for required @context
  if (!schema['@context']) {
    errors.push({ path: '@context', message: 'Missing @context property' })
  } else if (!schema['@context'].includes('schema.org')) {
    warnings.push({ path: '@context', message: '@context should reference schema.org' })
  }

  // Check for @type
  if (!schema['@type']) {
    errors.push({ path: '@type', message: 'Missing @type property' })
  }

  // Type-specific validation
  const schemaType = schema['@type']
  
  if (schemaType === 'Organization' || schemaType === 'LocalBusiness') {
    if (!schema.name) warnings.push({ path: 'name', message: 'Organization should have a name' })
    if (!schema.url) warnings.push({ path: 'url', message: 'Organization should have a url' })
    if (!schema.logo) warnings.push({ path: 'logo', message: 'Organization should have a logo' })
  }

  if (schemaType === 'Product') {
    if (!schema.name) errors.push({ path: 'name', message: 'Product must have a name' })
    if (!schema.offers) warnings.push({ path: 'offers', message: 'Product should have offers' })
  }

  if (schemaType === 'Article' || schemaType === 'NewsArticle' || schemaType === 'BlogPosting') {
    if (!schema.headline) errors.push({ path: 'headline', message: 'Article must have a headline' })
    if (!schema.author) warnings.push({ path: 'author', message: 'Article should have an author' })
    if (!schema.datePublished) warnings.push({ path: 'datePublished', message: 'Article should have datePublished' })
  }

  if (schemaType === 'FAQPage') {
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      errors.push({ path: 'mainEntity', message: 'FAQPage must have mainEntity array' })
    }
  }

  return NextResponse.json({
    validation: {
      valid: errors.length === 0,
      errors,
      warnings
    }
  })
}

async function generateSchema(templateId: string, formData: any, brandId: string, supabase: any) {
  const templates: Record<string, any> = {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: formData?.name || '',
      url: formData?.url || '',
      logo: formData?.logo || '',
      description: formData?.description || '',
      sameAs: formData?.socialLinks || [],
      contactPoint: formData?.contactEmail ? {
        '@type': 'ContactPoint',
        email: formData.contactEmail,
        contactType: 'customer service'
      } : undefined
    },
    local_business: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: formData?.name || '',
      url: formData?.url || '',
      image: formData?.image || '',
      telephone: formData?.phone || '',
      address: formData?.address ? {
        '@type': 'PostalAddress',
        streetAddress: formData.address.street,
        addressLocality: formData.address.city,
        addressRegion: formData.address.state,
        postalCode: formData.address.zip,
        addressCountry: formData.address.country
      } : undefined
    },
    product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: formData?.name || '',
      description: formData?.description || '',
      image: formData?.image || '',
      brand: formData?.brand ? {
        '@type': 'Brand',
        name: formData.brand
      } : undefined,
      offers: formData?.price ? {
        '@type': 'Offer',
        price: formData.price,
        priceCurrency: formData?.currency || 'USD',
        availability: 'https://schema.org/InStock'
      } : undefined
    },
    article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: formData?.headline || '',
      description: formData?.description || '',
      image: formData?.image || '',
      author: formData?.author ? {
        '@type': 'Person',
        name: formData.author
      } : undefined,
      datePublished: formData?.datePublished || new Date().toISOString(),
      publisher: formData?.publisher ? {
        '@type': 'Organization',
        name: formData.publisher
      } : undefined
    },
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (formData?.questions || []).map((q: any) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer
        }
      }))
    },
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: formData?.name || '',
      url: formData?.url || '',
      potentialAction: formData?.searchUrl ? {
        '@type': 'SearchAction',
        target: `${formData.searchUrl}?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      } : undefined
    },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: (formData?.items || []).map((item: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }
  }

  const schema = templates[templateId]
  
  if (!schema) {
    return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  // Clean undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema))

  return NextResponse.json({ 
    success: true, 
    schema: cleanSchema 
  })
}

// ─── Generate Outreach Content ────────────────────────────────────────────

interface ContentRequest {
  content_type: 'outreach-email' | 'guest-post-pitch' | 'reddit-post' | 'review-profile' | 'press-release' | 'faq-content' | 'partnership-proposal'
  issue_id: string
  issue_category: string
  issue_name: string
  issue_details: string
  issue_recommendation: string
  target_domain?: string
  target_url?: string
  evidence_urls?: Array<{ url: string; title?: string }>
}

const CONTENT_PROMPTS: Record<string, string> = {
  'outreach-email': `Write a professional outreach email to the editor/owner of the target website. The goal is to propose a collaboration, guest contribution, or feature that would benefit both parties. Keep it concise (under 200 words), personalized to the target domain, and value-first — explain what you can offer them, not just what you want.`,
  'guest-post-pitch': `Write a guest post pitch email. Propose 2-3 specific article ideas that would resonate with the target site's audience. Each idea should have a title and 1-sentence description. Keep the pitch under 200 words, professional, and focused on the value you'll deliver to their readers.`,
  'reddit-post': `Write an authentic Reddit post or comment for a relevant subreddit. The tone should be genuine, helpful, and community-first — NOT promotional. Share real expertise, answer a question, or start a discussion. Add brand mention only naturally if appropriate. Include a suggested subreddit name. Keep it under 250 words.`,
  'review-profile': `Write compelling profile copy for a review/listing platform. Include: a concise company description (2-3 sentences), key features/benefits (bullet points), target audience, and a call-to-action. Keep it under 200 words, factual, and professional.`,
  'press-release': `Write a press release draft that helps establish the brand as a recognized entity. Focus on a newsworthy angle (milestone, partnership, product launch, research finding, or industry insight). Follow standard press release format with headline, dateline, lead paragraph, quotes, and boilerplate. Keep it under 400 words.`,
  'faq-content': `Write 5 FAQ entries that address common questions in the brand's industry. Each Q&A should be: concise (2-3 sentence answers), naturally incorporate brand expertise, be structured for AI engines to easily extract, and target questions users actually ask AI assistants. Use schema-ready formatting.`,
  'partnership-proposal': `Write a brief partnership proposal to the target platform/domain. Include: introduction of the brand, the mutual value proposition, specific collaboration ideas (content swap, co-marketing, integration, etc.), and a clear next step. Keep it under 250 words, professional but warm.`,
}

async function generateOutreachContent(
  body: { content_type: string; brand_id: string } & Partial<ContentRequest>,
  brandId: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const { content_type, issue_category, issue_name, issue_details, issue_recommendation, target_domain, target_url, evidence_urls } = body as ContentRequest

  if (!content_type || !CONTENT_PROMPTS[content_type]) {
    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 })
  }

  // Fetch brand context
  const { data: brand } = await supabase
    .from('brands')
    .select('name, company_name, company_website, description, industry, entity_type, company_location, brand_categories, brand_voice')
    .eq('id', brandId)
    .single()

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const brandContext = [
    `Brand: ${brand.company_name || brand.name}`,
    brand.company_website ? `Website: ${brand.company_website}` : '',
    brand.description ? `Description: ${brand.description}` : '',
    brand.industry ? `Industry: ${brand.industry}` : '',
    brand.entity_type ? `Type: ${brand.entity_type}` : '',
    brand.company_location ? `Location: ${brand.company_location}` : '',
    brand.brand_voice ? `Brand voice: ${brand.brand_voice}` : '',
  ].filter(Boolean).join('\n')

  const evidenceContext = evidence_urls?.length
    ? `\n\nRelevant sources/evidence:\n${evidence_urls.slice(0, 8).map(e => `- ${e.url}${e.title ? ` (${e.title})` : ''}`).join('\n')}`
    : ''

  const targetContext = target_domain
    ? `\n\nTarget domain: ${target_domain}${target_url ? `\nTarget URL: ${target_url}` : ''}`
    : ''

  const issueContext = issue_name
    ? `\n\nAudit issue: ${issue_name}\nCategory: ${issue_category || 'N/A'}\nDetails: ${issue_details || 'N/A'}\nRecommendation: ${issue_recommendation || 'N/A'}`
    : ''

  const systemPrompt = `You are an expert brand strategist and content writer specializing in AI Engine Optimization (AEO). You help brands improve their visibility in AI search engines like ChatGPT, Gemini, Claude, and Perplexity.

Your writing is: professional but human, concise, value-focused, and tailored to the specific platform and audience. Never be generic or spammy. Always focus on genuine value exchange.

Brand context:
${brandContext}${issueContext}${targetContext}${evidenceContext}`

  const userPrompt = CONTENT_PROMPTS[content_type]

  try {
    const content = await llmComplete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1500, temperature: 0.7 }
    )

    return NextResponse.json({ success: true, content, content_type })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 502 })
  }
}

async function generateHowToGuide(
  body: { issue_name: string; issue_category: string; issue_details: string; issue_recommendation: string; issue_priority: string; issue_effort: string; brand_id: string },
  brandId: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const { issue_name, issue_category, issue_details, issue_recommendation, issue_priority, issue_effort } = body

  if (!issue_name || !issue_recommendation) {
    return NextResponse.json({ error: 'Missing issue details' }, { status: 400 })
  }

  // Fetch brand context
  const { data: brand } = await supabase
    .from('brands')
    .select('name, company_name, company_website, description, industry, entity_type')
    .eq('id', brandId)
    .single()

  const brandContext = brand
    ? [
        `Brand: ${brand.company_name || brand.name}`,
        brand.company_website ? `Website: ${brand.company_website}` : '',
        brand.industry ? `Industry: ${brand.industry}` : '',
      ].filter(Boolean).join('\n')
    : ''

  const systemPrompt = `You are an expert technical SEO and AI Engine Optimization (AEO) consultant. You provide clear, step-by-step implementation guides that even non-technical users can follow.

Your guides should be:
- Practical and actionable — every step should be something the user can do right now
- Include specific code snippets, file paths, or platform instructions where relevant
- Explain WHY each step matters for AI visibility
- Tailored to the brand's specific situation
- Formatted with numbered steps, clear headings, and code blocks where appropriate

${brandContext ? `\nBrand context:\n${brandContext}` : ''}`

  const userPrompt = `Create a step-by-step implementation guide for fixing this AEO audit issue:

**Issue:** ${issue_name}
**Category:** ${issue_category || 'General'}
**Priority:** ${issue_priority || 'Medium'}
**Effort level:** ${issue_effort || 'Moderate'}
**Current problem:** ${issue_details}
**Recommendation:** ${issue_recommendation}

Provide:
1. A brief explanation of why this matters for AI visibility (2-3 sentences)
2. Step-by-step implementation instructions (numbered, with code/config examples where applicable)
3. How to verify the fix worked
4. Expected impact on AI engine discoverability

Keep the guide concise but thorough. Use markdown formatting for readability.`

  try {
    const guide = await llmComplete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 2000, temperature: 0.5 }
    )

    return NextResponse.json({ success: true, guide, issue_name })
  } catch (error) {
    console.error('How-to guide generation error:', error)
    return NextResponse.json({ error: 'Guide generation failed' }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const action = searchParams.get('action')

    const supabase = createServiceClient()

    if (action === 'dashboard') {
      // Return dashboard summary data
      const [ldiResult, alertsResult, opportunitiesResult] = await Promise.all([
        supabase
          .from('ldi_scores')
          .select('*')
          .eq('brand_id', brandId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('visibility_alerts')
          .select('*')
          .eq('brand_id', brandId)
          .eq('status', 'active')
          .limit(5),
        supabase
          .from('optimization_opportunities')
          .select('*')
          .eq('brand_id', brandId)
          .neq('status', 'completed')
          .limit(10)
      ])

      return NextResponse.json({
        ldi_score: ldiResult.data,
        active_alerts: alertsResult.data || [],
        opportunities: opportunitiesResult.data || []
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Discoverability GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
