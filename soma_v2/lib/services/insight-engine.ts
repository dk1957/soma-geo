/**
 * Insight Engine Service
 *
 * Generates actionable recommendations by cross-referencing three data sources:
 * 1. Response Analysis (LVI, per-model metrics, citations, competitors)
 * 2. Discoverability Audit (7-pillar AEO readiness)
 * 3. Google Search Console (organic queries, clicks, impressions, gaps)
 *
 * Each analyzer produces Insight objects with specific, data-backed actions.
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { AuditResult, AuditPillar, AuditCheck } from './brand-indexing-audit'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Insight {
  id: string
  action: string
  insight: string
  metrics: Array<{ label: string; value: string; warn?: boolean }>
  impact: 'critical' | 'high' | 'medium'
  category: 'visibility' | 'content' | 'citations' | 'competitive' | 'sentiment' | 'technical' | 'seo'
  source: 'response-analysis' | 'audit' | 'gsc' | 'cross-reference'
  /** Optional: specific URL or page to act on */
  targetUrl?: string
}

/** Shape of GSC data stored in gsc_performance_data (aggregated) */
interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  totalQueries: number
  totalPages: number
  opportunityQueries: number
  pagesToOptimize: number
}

interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPage {
  pageUrl: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  queryCount: number
}

interface GSCData {
  connected: boolean
  summary: GSCSummary | null
  topQueries: GSCQuery[]
  opportunityQueries: GSCQuery[]
  protectQueries: GSCQuery[]
  questionQueries: GSCQuery[]
  topPages: GSCPage[]
  pagesToOptimize: GSCPage[]
}

interface ResponseData {
  lvi: number
  models: Array<{
    model_name: string
    lvi_score: number
    mention_count: number
    response_count: number
    mention_rate: number
    avg_sentiment: number
    avg_position: number
    citation_count: number
  }>
  totalResponses: number
  totalMentions: number
  mentionRate: number
  avgSentiment: number
  topDomains: Array<{ domain: string; citation_count: number; avg_authority: number }>
  competitors: Array<{ name: string; mentions: number; share_percentage: number; avg_sentiment: number }>
  shareOfVoice: number
  totalCitations: number
  uniqueDomains: number
}

export interface InsightEngineResult {
  insights: Insight[]
  dataSources: {
    responseAnalysis: boolean
    discoverabilityAudit: boolean
    searchConsole: boolean
  }
  generatedAt: string
}

// ─── Model display names ────────────────────────────────────────────────────

const MODEL_NAMES: Record<string, string> = {
  'openai/gpt-4o-mini:online': 'ChatGPT',
  'meta-llama/llama-4-8b-instruct:online': 'Llama',
  'google/gemini-2.5-flash:online': 'Gemini',
  'x-ai/grok-3-mini:online': 'Grok',
  'perplexity/sonar': 'Perplexity',
}

function modelName(key: string): string {
  return MODEL_NAMES[key] || key.split('/').pop()?.split(':')[0] || key
}

// ─── Main Engine ────────────────────────────────────────────────────────────

export async function generateInsights(brandId: string): Promise<InsightEngineResult> {
  const supabase = createServiceClient()

  // Fetch all three data sources in parallel
  const [responseData, auditData, gscData] = await Promise.all([
    fetchResponseData(supabase, brandId),
    fetchAuditData(supabase, brandId),
    fetchGSCData(supabase, brandId),
  ])

  const insights: Insight[] = []

  // ── Run analyzers ─────────────────────────────────────────────────────
  if (auditData) {
    insights.push(...analyzeAuditPillars(auditData))
  }

  if (gscData?.connected && gscData.summary) {
    insights.push(...analyzeGSCData(gscData))
  }

  if (responseData) {
    insights.push(...analyzeResponseData(responseData))
  }

  // Cross-reference: combine signals from multiple sources
  if (responseData && auditData) {
    insights.push(...crossReferenceAuditAndResponses(responseData, auditData))
  }

  if (responseData && gscData?.connected) {
    insights.push(...crossReferenceGSCAndResponses(responseData, gscData))
  }

  // Sort by impact (critical > high > medium), then deduplicate similar actions
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
  insights.sort((a, b) => (priorityOrder[a.impact] ?? 3) - (priorityOrder[b.impact] ?? 3))

  // Deduplicate based on category — keep the highest-impact per category, max 8 total
  const seen = new Set<string>()
  const deduped: Insight[] = []
  for (const ins of insights) {
    const key = `${ins.category}:${ins.id}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(ins)
    }
  }

  return {
    insights: deduped.slice(0, 8),
    dataSources: {
      responseAnalysis: !!responseData,
      discoverabilityAudit: !!auditData,
      searchConsole: !!gscData?.connected,
    },
    generatedAt: new Date().toISOString(),
  }
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

async function fetchResponseData(supabase: any, brandId: string): Promise<ResponseData | null> {
  // Get latest daily brand metrics
  const { data: brandMetrics } = await supabase
    .from('daily_brand_metrics')
    .select('*')
    .eq('brand_id', brandId)
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!brandMetrics) return null

  // Get model metrics
  const { data: modelMetrics } = await supabase
    .from('daily_model_metrics')
    .select('*')
    .eq('brand_id', brandId)
    .order('run_date', { ascending: false })
    .limit(10)

  // Get brand account_id for citations
  const { data: brand } = await supabase
    .from('brands')
    .select('account_id')
    .eq('id', brandId)
    .maybeSingle()

  // Get top citations
  const { data: topDomains } = brand?.account_id ? await supabase
    .from('aeo_citations')
    .select('domain, times_referenced, is_high_authority')
    .eq('account_id', brand.account_id)
    .order('times_referenced', { ascending: false })
    .limit(15) : { data: [] }

  // Get competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, competitor_name')
    .eq('brand_id', brandId)

  const competitorIds = (competitors || []).map((c: any) => c.id)
  let competitorData: Array<{ name: string; mentions: number; share_percentage: number; avg_sentiment: number }> = []

  if (competitorIds.length > 0) {
    const { data: compMetrics } = await supabase
      .from('daily_competitor_metrics')
      .select('competitor_id, share_of_voice, responses_with_mention, avg_sentiment')
      .in('competitor_id', competitorIds)
      .order('run_date', { ascending: false })

    const compMap = new Map<string, any>()
    for (const row of (compMetrics || [])) {
      if (!compMap.has(row.competitor_id)) compMap.set(row.competitor_id, row)
    }

    competitorData = (competitors || []).map((c: any) => {
      const cm = compMap.get(c.id)
      return {
        name: c.competitor_name,
        mentions: cm?.responses_with_mention ?? 0,
        share_percentage: (cm?.share_of_voice ?? 0) * 100,
        avg_sentiment: cm?.avg_sentiment ?? 0,
      }
    }).sort((a: any, b: any) => b.share_percentage - a.share_percentage)
  }

  // Deduplicate model metrics (keep latest per model)
  const modelMap = new Map<string, any>()
  for (const row of (modelMetrics || [])) {
    if (!modelMap.has(row.model_name)) modelMap.set(row.model_name, row)
  }

  const models = Array.from(modelMap.values()).map((m: any) => ({
    model_name: m.model_name,
    lvi_score: m.lvi_score ?? 0,
    mention_count: m.responses_with_mention ?? 0,
    response_count: m.total_responses ?? 0,
    mention_rate: m.visibility_rate ?? 0,
    avg_sentiment: m.avg_sentiment ?? 0,
    avg_position: m.avg_brand_rank ?? 0,
    citation_count: m.total_citations ?? 0,
  }))

  const totalCitations = (topDomains || []).reduce((s: number, d: any) => s + d.times_referenced, 0)

  return {
    lvi: brandMetrics.lvi_score ?? 0,
    models,
    totalResponses: brandMetrics.total_responses ?? 0,
    totalMentions: brandMetrics.total_brand_mentions ?? 0,
    mentionRate: brandMetrics.visibility_rate ?? 0,
    avgSentiment: brandMetrics.avg_sentiment ?? 0,
    topDomains: (topDomains || []).map((d: any) => ({
      domain: d.domain,
      citation_count: d.times_referenced,
      avg_authority: d.is_high_authority ? 80 : 40,
    })),
    competitors: competitorData,
    shareOfVoice: (brandMetrics.share_of_voice ?? 0) * 100,
    totalCitations,
    uniqueDomains: (topDomains || []).length,
  }
}

async function fetchAuditData(supabase: any, brandId: string): Promise<AuditResult | null> {
  const { data, error } = await supabase
    .from('discoverability_audits')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  // Parse stored audit into AuditResult shape
  const results = data.audit_results || {}
  return {
    id: data.id,
    brandId: data.brand_id,
    siteUrl: data.site_url || '',
    overallScore: data.overall_score || 0,
    grade: scoreToGrade(data.overall_score || 0),
    pillars: results.pillars || [],
    issues: results.issues || [],
    evidence: results.evidence || {},
    summary: results.summary || { totalChecks: 0, passed: 0, warnings: 0, failed: 0, criticalIssues: 0 },
    citationVerification: results.citationVerification,
    createdAt: data.created_at,
  }
}

async function fetchGSCData(supabase: any, brandId: string): Promise<GSCData> {
  // Check if GSC is connected
  const { data: connection } = await supabase
    .from('gsc_connections')
    .select('id, site_url, is_active')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .maybeSingle()

  if (!connection || !connection.is_active || connection.site_url === 'pending_selection') {
    return { connected: false, summary: null, topQueries: [], opportunityQueries: [], protectQueries: [], questionQueries: [], topPages: [], pagesToOptimize: [] }
  }

  // Fetch last 30 days of GSC data from stored performance data
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: queryRows } = await supabase
    .from('gsc_performance_data')
    .select('query, page_url, clicks, impressions, ctr, position')
    .eq('brand_id', brandId)
    .not('query', 'is', null)
    .gte('date', startDate)
    .order('impressions', { ascending: false })
    .limit(3000)

  // Aggregate queries
  const queryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>()
  const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number; queries: Set<string> }>()

  for (const row of (queryRows || [])) {
    if (row.query) {
      const existing = queryMap.get(row.query) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
      queryMap.set(row.query, {
        clicks: existing.clicks + row.clicks,
        impressions: existing.impressions + row.impressions,
        ctr: existing.ctr + row.ctr,
        position: existing.position + row.position,
        count: existing.count + 1,
      })
    }
    if (row.page_url) {
      const existing = pageMap.get(row.page_url) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0, queries: new Set<string>() }
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.ctr += row.ctr
      existing.position += row.position
      existing.count += 1
      if (row.query) existing.queries.add(row.query)
      pageMap.set(row.page_url, existing)
    }
  }

  const topQueries = Array.from(queryMap.entries())
    .map(([query, d]) => ({
      query,
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: d.count > 0 ? d.ctr / d.count : 0,
      position: d.count > 0 ? d.position / d.count : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)

  const topPages = Array.from(pageMap.entries())
    .map(([pageUrl, d]) => ({
      pageUrl,
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: d.count > 0 ? d.ctr / d.count : 0,
      position: d.count > 0 ? d.position / d.count : 0,
      queryCount: d.queries.size,
    }))
    .sort((a, b) => b.impressions - a.impressions)

  const opportunityQueries = topQueries
    .filter(q => q.impressions > 50 && q.position > 5)
    .slice(0, 15)

  const protectQueries = topQueries
    .filter(q => q.position <= 3 && q.clicks > 5)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15)

  const questionWords = /^(who|what|where|when|why|how|is|are|can|do|does|should|which|will|would|could|has|have|was|were)\b/i
  const questionQueries = topQueries
    .filter(q => questionWords.test(q.query) || q.query.includes('?'))
    .slice(0, 20)

  const pagesToOptimize = topPages
    .filter(p => p.impressions > 100 && p.ctr < 0.04 && p.position > 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)

  const allQueries = Array.from(queryMap.values())
  const sumClicks = allQueries.reduce((s, q) => s + q.clicks, 0)
  const sumImpressions = allQueries.reduce((s, q) => s + q.impressions, 0)
  const sumPosition = allQueries.reduce((s, q) => s + (q.position / q.count), 0)

  return {
    connected: true,
    summary: {
      totalClicks: sumClicks,
      totalImpressions: sumImpressions,
      avgCtr: sumImpressions > 0 ? sumClicks / sumImpressions : 0,
      avgPosition: queryMap.size > 0 ? sumPosition / queryMap.size : 0,
      totalQueries: queryMap.size,
      totalPages: pageMap.size,
      opportunityQueries: opportunityQueries.length,
      pagesToOptimize: pagesToOptimize.length,
    },
    topQueries: topQueries.slice(0, 50),
    opportunityQueries,
    protectQueries,
    questionQueries,
    topPages: topPages.slice(0, 30),
    pagesToOptimize,
  }
}

// ─── Analyzers ──────────────────────────────────────────────────────────────

function analyzeAuditPillars(audit: AuditResult): Insight[] {
  const insights: Insight[] = []

  // Find critical/failed checks across all pillars
  const failedChecks = audit.issues.filter(c => c.status === 'fail' && c.priority === 'critical')
  const warningChecks = audit.issues.filter(c => c.status === 'fail' && c.priority === 'high')

  // ── 1. Crawlability Issues (robots.txt, sitemaps, AI bot access) ──
  const crawlPillar = audit.pillars.find(p => p.id === 'crawlability')
  if (crawlPillar && crawlPillar.score < crawlPillar.maxScore * 0.5) {
    const blockedBots = crawlPillar.checks.filter(c => c.status === 'fail' && c.id.includes('bot'))
    const sitemapIssue = crawlPillar.checks.find(c => c.status === 'fail' && c.id.includes('sitemap'))
    const robotsIssue = crawlPillar.checks.find(c => c.status === 'fail' && c.id.includes('robots'))

    const issues: string[] = []
    if (blockedBots.length > 0) issues.push(`AI crawlers blocked (${blockedBots.map(b => b.name).join(', ')})`)
    if (sitemapIssue) issues.push('missing or broken sitemap')
    if (robotsIssue) issues.push('robots.txt issues')

    insights.push({
      id: 'audit-crawlability',
      action: `Fix crawlability: ${issues.join(', ')}`,
      insight: blockedBots.length > 0
        ? `AI bots like GPTBot or Google-Extended can't crawl your site. This directly prevents AI engines from indexing your content. Update your robots.txt to allow these crawlers.`
        : `Search engines and AI crawlers have trouble discovering your pages. ${sitemapIssue ? 'Add a valid XML sitemap. ' : ''}${robotsIssue ? 'Fix robots.txt configuration.' : ''}`,
      metrics: [
        { label: 'Crawlability score', value: `${crawlPillar.score}/${crawlPillar.maxScore}`, warn: true },
        ...blockedBots.slice(0, 2).map(b => ({ label: b.name, value: 'Blocked', warn: true })),
      ],
      impact: blockedBots.length > 0 ? 'critical' : 'high',
      category: 'technical',
      source: 'audit',
    })
  }

  // ── 2. Structured Data Issues ──
  const schemasPillar = audit.pillars.find(p => p.id === 'structured-data')
  if (schemasPillar && schemasPillar.score < schemasPillar.maxScore * 0.5) {
    const missingSchemas = schemasPillar.checks.filter(c => c.status === 'fail')
    const schemaNames = missingSchemas.slice(0, 3).map(c => c.name).join(', ')

    insights.push({
      id: 'audit-structured-data',
      action: `Add structured data: ${schemaNames}`,
      insight: `${missingSchemas.length} schema types are missing from your site. Structured data helps AI engines understand your brand, products, and authority. Add JSON-LD Organization, Product, and FAQ schemas.`,
      metrics: [
        { label: 'Schema score', value: `${schemasPillar.score}/${schemasPillar.maxScore}`, warn: true },
        { label: 'Missing schemas', value: `${missingSchemas.length}`, warn: true },
        ...(audit.evidence?.schemaTypesFound?.length > 0
          ? [{ label: 'Found', value: audit.evidence.schemaTypesFound.slice(0, 3).join(', ') }]
          : []),
      ],
      impact: 'high',
      category: 'technical',
      source: 'audit',
    })
  }

  // ── 3. Content Authority ──
  const contentPillar = audit.pillars.find(p => p.id === 'content-authority')
  if (contentPillar && contentPillar.score < contentPillar.maxScore * 0.5) {
    const failedContent = contentPillar.checks.filter(c => c.status === 'fail')
    const topRec = failedContent[0]?.recommendation || 'Publish more authoritative, in-depth content'

    insights.push({
      id: 'audit-content-authority',
      action: `Strengthen content authority — ${contentPillar.score}/${contentPillar.maxScore} score`,
      insight: topRec,
      metrics: [
        { label: 'Authority score', value: `${contentPillar.score}/${contentPillar.maxScore}`, warn: true },
        { label: 'Failed checks', value: `${failedContent.length}`, warn: failedContent.length > 2 },
      ],
      impact: failedContent.length > 2 ? 'critical' : 'high',
      category: 'content',
      source: 'audit',
    })
  }

  // ── 4. Source Footprint (3rd party mentions) ──
  const sourcePillar = audit.pillars.find(p => p.id === 'source-footprint')
  if (sourcePillar && sourcePillar.score < sourcePillar.maxScore * 0.6) {
    const mentionChecks = sourcePillar.checks.filter(c => c.status === 'fail')
    const exaMentions = audit.evidence?.exaMentions?.length || 0

    insights.push({
      id: 'audit-source-footprint',
      action: `Expand third-party footprint — only ${exaMentions} external mentions found`,
      insight: `AI engines trust brands that appear on many independent sources. ${mentionChecks[0]?.recommendation || 'Get featured on industry publications, review sites, directories, and expert blogs.'}`,
      metrics: [
        { label: 'Source score', value: `${sourcePillar.score}/${sourcePillar.maxScore}`, warn: true },
        { label: 'External mentions', value: `${exaMentions}`, warn: exaMentions < 5 },
      ],
      impact: exaMentions < 3 ? 'critical' : 'high',
      category: 'citations',
      source: 'audit',
    })
  }

  // ── 5. Knowledge Graph Presence ──
  const kgPillar = audit.pillars.find(p => p.id === 'knowledge-graph')
  if (kgPillar && kgPillar.score < kgPillar.maxScore * 0.4) {
    const hasKG = audit.evidence?.knowledgeGraph?.title
    const hasWiki = (audit.evidence?.wikiPages?.length || 0) > 0

    insights.push({
      id: 'audit-knowledge-graph',
      action: hasKG ? 'Enrich your Knowledge Graph entry' : 'Build Knowledge Graph presence from scratch',
      insight: !hasKG
        ? `Google has no Knowledge Graph entry for your brand. Create a Wikipedia article, claim your Google Business Profile, and add Wikidata entries to establish entity recognition.`
        : `Your Knowledge Graph entry exists but is incomplete. Add structured data, ensure consistency across platforms, and link to authoritative sources.`,
      metrics: [
        { label: 'KG score', value: `${kgPillar.score}/${kgPillar.maxScore}`, warn: true },
        { label: 'Knowledge Graph', value: hasKG ? 'Partial' : 'Missing', warn: !hasKG },
        { label: 'Wikipedia', value: hasWiki ? 'Found' : 'Missing', warn: !hasWiki },
      ],
      impact: !hasKG ? 'high' : 'medium',
      category: 'technical',
      source: 'audit',
    })
  }

  // ── 6. Social Proof ──
  const socialPillar = audit.pillars.find(p => p.id === 'social-proof')
  if (socialPillar && socialPillar.score < socialPillar.maxScore * 0.4) {
    const reviews = audit.evidence?.reviewListings?.length || 0
    const reddit = audit.evidence?.redditThreads?.length || 0

    insights.push({
      id: 'audit-social-proof',
      action: `Build social proof — ${reviews} review listings, ${reddit} community discussions found`,
      insight: `AI engines value brands with strong community signals. ${reviews < 3 ? 'Get listed on review platforms like G2, Trustpilot, or Capterra. ' : ''}${reddit < 2 ? 'Build presence in Reddit and relevant forums.' : ''}`,
      metrics: [
        { label: 'Social proof score', value: `${socialPillar.score}/${socialPillar.maxScore}`, warn: true },
        { label: 'Review listings', value: `${reviews}`, warn: reviews < 3 },
        { label: 'Community threads', value: `${reddit}`, warn: reddit < 2 },
      ],
      impact: reviews < 2 && reddit < 2 ? 'high' : 'medium',
      category: 'citations',
      source: 'audit',
    })
  }

  // ── 7. Brand Consistency ──
  const consistencyPillar = audit.pillars.find(p => p.id === 'brand-consistency')
  if (consistencyPillar && consistencyPillar.score < consistencyPillar.maxScore * 0.5) {
    insights.push({
      id: 'audit-brand-consistency',
      action: `Improve brand consistency across the web`,
      insight: `Inconsistent brand information across platforms confuses AI engines. Ensure your brand name, description, and contact info are identical everywhere.`,
      metrics: [
        { label: 'Consistency score', value: `${consistencyPillar.score}/${consistencyPillar.maxScore}`, warn: true },
      ],
      impact: 'medium',
      category: 'technical',
      source: 'audit',
    })
  }

  return insights
}

function analyzeGSCData(gsc: GSCData): Insight[] {
  const insights: Insight[] = []
  if (!gsc.summary) return insights

  // ── 1. High-impression opportunity queries (Google sees them, you don't rank) ──
  if (gsc.opportunityQueries.length > 0) {
    const top3 = gsc.opportunityQueries.slice(0, 3)
    const totalOppImpressions = gsc.opportunityQueries.reduce((s, q) => s + q.impressions, 0)

    insights.push({
      id: 'gsc-opportunity-queries',
      action: `${gsc.opportunityQueries.length} high-potential queries where you rank poorly`,
      insight: `These queries get thousands of impressions on Google but you're ranked position 5+. Optimizing content for these could capture significant traffic that AI engines will also see.`,
      metrics: [
        ...top3.map(q => ({
          label: q.query.length > 35 ? q.query.substring(0, 35) + '…' : q.query,
          value: `${q.impressions.toLocaleString()} imp · pos ${q.position.toFixed(1)}`,
          warn: q.position > 10,
        })),
        { label: 'Total opportunity', value: `${totalOppImpressions.toLocaleString()} impressions` },
      ],
      impact: totalOppImpressions > 5000 ? 'critical' : 'high',
      category: 'seo',
      source: 'gsc',
    })
  }

  // ── 2. Question queries (high AI overlap) ──
  if (gsc.questionQueries.length > 5) {
    const topQ = gsc.questionQueries.slice(0, 3)
    insights.push({
      id: 'gsc-question-queries',
      action: `${gsc.questionQueries.length} question-style queries people ask about your category`,
      insight: `These are the exact types of questions people ask AI engines too. Create dedicated FAQ pages and blog posts that directly answer these questions with your brand as the solution.`,
      metrics: topQ.map(q => ({
        label: q.query.length > 40 ? q.query.substring(0, 40) + '…' : q.query,
        value: `${q.impressions.toLocaleString()} imp`,
      })),
      impact: 'high',
      category: 'content',
      source: 'gsc',
    })
  }

  // ── 3. Pages that need optimization (high impressions, low CTR) ──
  if (gsc.pagesToOptimize.length > 0) {
    const top3 = gsc.pagesToOptimize.slice(0, 3)
    insights.push({
      id: 'gsc-pages-to-optimize',
      action: `${gsc.pagesToOptimize.length} pages get impressions but few clicks`,
      insight: `These pages appear in Google search results but users rarely click. Improve titles, meta descriptions, and content quality — high-CTR pages tend to also get cited more by AI engines.`,
      metrics: top3.map(p => {
        const shortUrl = p.pageUrl.replace(/^https?:\/\/[^/]+/, '').substring(0, 40)
        return {
          label: shortUrl || '/',
          value: `${p.impressions.toLocaleString()} imp · ${(p.ctr * 100).toFixed(1)}% CTR`,
          warn: p.ctr < 0.02,
        }
      }),
      impact: 'high',
      category: 'seo',
      source: 'gsc',
    })
  }

  // ── 4. Protect top-performing queries ──
  if (gsc.protectQueries.length > 3) {
    const topProtect = gsc.protectQueries.slice(0, 3)
    insights.push({
      id: 'gsc-protect-rankings',
      action: `Protect your top ${gsc.protectQueries.length} high-performing search queries`,
      insight: `You rank in the top 3 for these queries with good click volume. Keep this content updated, add FAQ schema, and ensure AI engines can access these pages so you maintain visibility in both traditional and AI search.`,
      metrics: topProtect.map(q => ({
        label: q.query.length > 35 ? q.query.substring(0, 35) + '…' : q.query,
        value: `pos ${q.position.toFixed(1)} · ${q.clicks} clicks`,
      })),
      impact: 'medium',
      category: 'seo',
      source: 'gsc',
    })
  }

  return insights
}

function analyzeResponseData(rd: ResponseData): Insight[] {
  const insights: Insight[] = []

  // ── 1. Competitor Dominance ──
  const platformNames = new Set([
    'facebook', 'google', 'google ads', 'meta', 'instagram', 'linkedin', 'twitter',
    'x', 'tiktok', 'youtube', 'reddit', 'pinterest', 'snapchat', 'whatsapp',
    'telegram', 'bing', 'yahoo', 'amazon', 'microsoft', 'apple', 'chatgpt',
    'openai', 'anthropic', 'perplexity', 'gemini', 'hubspot', 'salesforce',
    'mailchimp', 'wordpress', 'shopify', 'stripe', 'zapier', 'slack', 'zoom', 'canva',
  ])
  const realCompetitors = rd.competitors.filter(c => !platformNames.has(c.name.toLowerCase()))

  if (realCompetitors.length > 0 && realCompetitors[0].share_percentage > rd.shareOfVoice + 15) {
    const top = realCompetitors[0]
    insights.push({
      id: 'response-competitor-dominance',
      action: `${top.name} dominates with ${top.share_percentage.toFixed(0)}% share vs your ${rd.shareOfVoice.toFixed(0)}%`,
      insight: `${top.name} appears in AI responses far more than your brand. Analyze their content strategy, backlink profile, and structured data to understand what gives them an edge.`,
      metrics: [
        { label: top.name, value: `${top.share_percentage.toFixed(0)}% · ${top.mentions} mentions` },
        { label: 'Your brand', value: `${rd.shareOfVoice.toFixed(0)}% · ${rd.totalMentions} mentions`, warn: true },
        ...realCompetitors.slice(1, 3).map(c => ({ label: c.name, value: `${c.share_percentage.toFixed(0)}%` })),
      ],
      impact: top.share_percentage > rd.shareOfVoice + 40 ? 'critical' : 'high',
      category: 'competitive',
      source: 'response-analysis',
    })
  }

  // ── 2. Citation Gap ──
  if (rd.totalCitations < 5 && rd.totalResponses > 0) {
    insights.push({
      id: 'response-citation-gap',
      action: rd.totalCitations === 0 ? 'No sources cite your brand in AI' : `Only ${rd.totalCitations} citations found`,
      insight: `AI engines aren't citing your brand's content. Get mentioned on industry publications, review sites, and expert blogs. Brands with 10+ citations see 3-5× higher visibility.`,
      metrics: [
        { label: 'Citations', value: `${rd.totalCitations}`, warn: true },
        { label: 'Citing domains', value: `${rd.uniqueDomains}`, warn: rd.uniqueDomains < 3 },
        ...rd.topDomains.slice(0, 2).map(d => ({ label: d.domain, value: `${d.citation_count}×` })),
      ],
      impact: rd.totalCitations === 0 ? 'critical' : 'high',
      category: 'citations',
      source: 'response-analysis',
    })
  }

  // ── 3. Negative Sentiment ──
  if (rd.avgSentiment < -0.1 && rd.totalMentions > 0) {
    const negModels = rd.models.filter(m => m.avg_sentiment < -0.1)
    insights.push({
      id: 'response-negative-sentiment',
      action: 'Negative brand sentiment in AI responses',
      insight: `AI platforms describe your brand with negative language. This reduces your visibility score and makes AI less likely to recommend you. Publish positive case studies and customer success stories.`,
      metrics: [
        { label: 'Sentiment', value: `${((rd.avgSentiment + 1) * 5).toFixed(1)}/10`, warn: true },
        ...negModels.slice(0, 2).map(m => ({
          label: modelName(m.model_name),
          value: `${((m.avg_sentiment + 1) * 5).toFixed(1)}/10`,
          warn: true,
        })),
      ],
      impact: 'high',
      category: 'sentiment',
      source: 'response-analysis',
    })
  }

  return insights
}

// ─── Cross-Reference Analyzers ──────────────────────────────────────────────

function crossReferenceAuditAndResponses(rd: ResponseData, audit: AuditResult): Insight[] {
  const insights: Insight[] = []

  // If crawlability is failing AND visibility is low → direct causal link
  const crawlPillar = audit.pillars.find(p => p.id === 'crawlability')
  if (crawlPillar && crawlPillar.score < crawlPillar.maxScore * 0.5 && rd.lvi < 30) {
    const blockedBots = crawlPillar.checks.filter(c => c.status === 'fail' && c.id.includes('bot'))
    if (blockedBots.length > 0) {
      insights.push({
        id: 'xref-crawl-visibility',
        action: `AI bots are blocked → directly causing low ${rd.lvi}/100 visibility`,
        insight: `Your robots.txt blocks AI crawlers, which is a primary reason your LVI is only ${rd.lvi}/100. Unblocking GPTBot and Google-Extended should have immediate impact on your AI discoverability.`,
        metrics: [
          { label: 'LVI Score', value: `${rd.lvi}/100`, warn: true },
          ...blockedBots.slice(0, 2).map(b => ({ label: b.name, value: 'Blocked', warn: true })),
          { label: 'Audit score', value: `${audit.overallScore}/100`, warn: audit.overallScore < 50 },
        ],
        impact: 'critical',
        category: 'technical',
        source: 'cross-reference',
      })
    }
  }

  // If audit shows good technical score but visibility is still low → content problem
  if (audit.overallScore > 60 && rd.lvi < 30) {
    insights.push({
      id: 'xref-technical-ok-visibility-low',
      action: `Technical readiness is good (${audit.overallScore}/100) but AI visibility remains low (${rd.lvi}/100)`,
      insight: `Your site is technically ready for AI discovery but you're still not being mentioned. The gap is likely content quality, topical authority, or missing third-party citations. Focus on creating definitive content for your key topics.`,
      metrics: [
        { label: 'Audit score', value: `${audit.overallScore}/100` },
        { label: 'LVI Score', value: `${rd.lvi}/100`, warn: true },
        { label: 'Citations', value: `${rd.totalCitations}`, warn: rd.totalCitations < 5 },
      ],
      impact: 'high',
      category: 'content',
      source: 'cross-reference',
    })
  }

  // If source footprint in audit is weak AND citations in responses are low → need more 3rd party content
  const sourcePillar = audit.pillars.find(p => p.id === 'source-footprint')
  if (sourcePillar && sourcePillar.score < sourcePillar.maxScore * 0.4 && rd.totalCitations < 5) {
    insights.push({
      id: 'xref-source-citation-gap',
      action: `Weak web footprint (${sourcePillar.score}/${sourcePillar.maxScore}) correlates with low AI citations (${rd.totalCitations})`,
      insight: `There's a direct link: AI engines cite brands that appear across many independent sources. Invest in PR, guest posts, industry directory listings, and partnerships to build your source footprint.`,
      metrics: [
        { label: 'Source footprint', value: `${sourcePillar.score}/${sourcePillar.maxScore}`, warn: true },
        { label: 'AI citations', value: `${rd.totalCitations}`, warn: true },
        { label: 'External mentions', value: `${audit.evidence?.exaMentions?.length || 0}`, warn: true },
      ],
      impact: 'critical',
      category: 'citations',
      source: 'cross-reference',
    })
  }

  return insights
}

function crossReferenceGSCAndResponses(rd: ResponseData, gsc: GSCData): Insight[] {
  const insights: Insight[] = []

  // If top GSC queries are question-style AND brand has low AI mention rate → content-to-AI bridge
  if (gsc.questionQueries.length > 3 && rd.mentionRate < 0.3) {
    const topQ = gsc.questionQueries.slice(0, 3)
    insights.push({
      id: 'xref-gsc-questions-ai',
      action: `Bridge the gap: ${gsc.questionQueries.length} Google questions, ${(rd.mentionRate * 100).toFixed(0)}% AI mention rate`,
      insight: `People already ask questions about your category on Google and you appear in results. But AI engines aren't mentioning you for similar queries. Restructure your top-ranking pages with clear, direct answers that AI can extract.`,
      metrics: [
        { label: 'Google questions', value: `${gsc.questionQueries.length}` },
        { label: 'AI mention rate', value: `${(rd.mentionRate * 100).toFixed(0)}%`, warn: true },
        ...topQ.slice(0, 2).map(q => ({
          label: q.query.length > 30 ? q.query.substring(0, 30) + '…' : q.query,
          value: `pos ${q.position.toFixed(1)}`,
        })),
      ],
      impact: 'high',
      category: 'content',
      source: 'cross-reference',
    })
  }

  // If brand has high Google impressions but low AI visibility → missed AI opportunity
  if (gsc.summary && gsc.summary.totalImpressions > 10000 && rd.lvi < 40) {
    insights.push({
      id: 'xref-google-strong-ai-weak',
      action: `${gsc.summary.totalImpressions.toLocaleString()} Google impressions but only ${rd.lvi}/100 AI visibility`,
      insight: `You have strong Google presence but AI engines aren't reflecting this. Ensure your content is structured for AI extraction: use clear headings, direct answers, and JSON-LD schemas. Also check that AI crawlers are not blocked.`,
      metrics: [
        { label: 'Google impressions', value: gsc.summary.totalImpressions.toLocaleString() },
        { label: 'Google clicks', value: gsc.summary.totalClicks.toLocaleString() },
        { label: 'AI LVI Score', value: `${rd.lvi}/100`, warn: true },
      ],
      impact: 'high',
      category: 'visibility',
      source: 'cross-reference',
    })
  }

  return insights
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}
