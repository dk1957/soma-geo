/**
 * Brand Indexing Audit Service
 *
 * AEO Readiness Benchmark — 7 Pillars:
 * 1. Crawlability — robots.txt, sitemap, AI bot access
 * 2. Structured Data — Schema.org, JSON-LD completeness
 * 3. Content Authority — quality, freshness, topical depth
 * 4. Source Footprint — 3rd party mentions, citations, earned media
 * 5. Knowledge Graph Presence — Wikipedia, Wikidata, entity signals
 * 6. Social Proof — Reddit, forums, reviews, UGC signals
 * 7. Brand Consistency — NAP, messaging alignment, identity coherence
 *
 * Uses: Exa API (web search), SerpAPI (Google presence), OpenAI (content quality),
 *        Supabase (internal data), direct HTTP (crawlability checks)
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditPillar {
  id: string
  name: string
  score: number
  maxScore: number
  status: 'pass' | 'warning' | 'fail' | 'unknown'
  checks: AuditCheck[]
  description: string
}

export interface AuditCheck {
  id: string
  name: string
  status: 'pass' | 'warning' | 'fail' | 'unknown'
  score: number
  maxScore: number
  details: string
  recommendation?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effort: 'trivial' | 'easy' | 'moderate' | 'complex'
  category: string
  metadata?: Record<string, any>
}

export interface AuditEvidence {
  crawledUrls: Array<{ url: string; status: 'ok' | 'error'; type: string }>
  serpResults: Array<{ url: string; title: string; position: number }>
  exaMentions: Array<{ url: string; title: string; domain: string; date?: string }>
  sitemapUrls: string[]
  robotsTxtUrl: string
  robotsTxtContent: string
  schemaTypesFound: string[]
  socialProfiles: Array<{ url: string; platform: string }>
  reviewListings: Array<{ url: string; title: string; platform: string }>
  redditThreads: Array<{ url: string; title: string }>
  wikiPages: Array<{ url: string; title: string }>
  knowledgeGraph?: { title?: string; description?: string; type?: string }
}

export interface ContentAssessment {
  index: number
  isAboutBrand: boolean
  mentionType: 'substantive' | 'passing' | 'irrelevant'
  qualityScore: number       // 1–10
  sentiment: 'positive' | 'neutral' | 'negative'
  reason?: string            // brief LLM rationale
}

export interface AuditResult {
  id: string
  brandId: string
  siteUrl: string
  overallScore: number
  grade: string
  pillars: AuditPillar[]
  issues: AuditCheck[]
  evidence: AuditEvidence
  summary: {
    totalChecks: number
    passed: number
    warnings: number
    failed: number
    criticalIssues: number
  }
  citationVerification?: {
    citationRate: number          // 0.0 – 1.0
    queriesTested: number
    queriesCited: number
    calibrationMultiplier: number // applied to technical score
    rawTechnicalScore: number    // score before calibration
    probes: Array<{
      query: string
      model: string
      cited: boolean
      snippet?: string           // excerpt where brand was mentioned
    }>
    source: 'run' | 'live-probe' | 'both'
  }
  createdAt: string
}

export interface BrandContext {
  brandName: string
  description: string
  industry: string
  products: string
  targetAudience: string
  valueProposition: string
  competitors: string[]
  targetMarkets: string[]
  businessModel: string
  businessType: string
  entityAliases: string[]
  primaryDomain: string
  slug: string
  companyLocation: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * LLM Citation Weight Model
 *
 * Based on research into how LLMs (GPT-4, Claude, Gemini, Perplexity) select
 * domains and content to cite in AI-generated answers:
 *
 * 1. Source Authority & Footprint (25%) — Most impactful. LLMs favour domains
 *    with high-authority backlinks, citations across credible publications,
 *    and earned media. Peer-cited sources rank highest in retrieval.
 *
 * 2. Content Authority & E-E-A-T (20%) — LLMs evaluate content depth,
 *    expertise signals, freshness, and whether content is structured for
 *    direct extraction (FAQs, definitions, how-tos).
 *
 * 3. Knowledge Graph & Entity Recognition (20%) — LLMs heavily rely on
 *    structured knowledge (Wikipedia, Wikidata, Google KG) for entity
 *    resolution and fact-checking. Brands with clear entity signals get cited.
 *
 * 4. Structured Data & Schema (15%) — JSON-LD, sameAs, Organization schema
 *    directly feed LLM entity understanding. Critical for disambiguation.
 *
 * 5. Crawlability & LLM Access (10%) — Baseline requirement. If your content
 *    can't be crawled (robots.txt blocks, no sitemap, no llms.txt), it can't
 *    be indexed. Necessary but not sufficient.
 *
 * 6. Social Proof & Community (7%) — Forum mentions, Reddit threads, reviews
 *    act as validation signals. LLMs use these for sentiment & popularity.
 *
 * 7. Brand Consistency (3%) — Consistent naming across web properties helps
 *    entity resolution but has lower direct citation impact.
 */
const PILLAR_WEIGHTS: Record<string, number> = {
  'source-footprint': 0.25,
  'content-authority': 0.20,
  'knowledge-graph': 0.20,
  'structured-data': 0.15,
  'crawlability': 0.10,
  'social-proof': 0.07,
  'brand-consistency': 0.03,
}

const AI_CRAWLERS = [
  { name: 'GPTBot', userAgent: 'GPTBot', company: 'OpenAI / ChatGPT' },
  { name: 'ChatGPT-User', userAgent: 'ChatGPT-User', company: 'OpenAI / ChatGPT' },
  { name: 'Claude-Web', userAgent: 'Claude-Web', company: 'Anthropic / Claude' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', company: 'Google / Gemini' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', company: 'Perplexity AI' },
  { name: 'CCBot', userAgent: 'CCBot', company: 'Common Crawl' },
  { name: 'Amazonbot', userAgent: 'Amazonbot', company: 'Amazon' },
  { name: 'Bytespider', userAgent: 'Bytespider', company: 'ByteDance' },
]

const KNOWLEDGE_DOMAINS = [
  'wikipedia.org', 'wikidata.org', 'crunchbase.com', 'linkedin.com',
  'bloomberg.com', 'reuters.com', 'g2.com', 'trustpilot.com',
  'glassdoor.com', 'pitchbook.com', 'github.com',
  'medium.com', 'substack.com', 'reddit.com', 'quora.com',
  'youtube.com', 'twitter.com', 'x.com', 'instagram.com',
  'facebook.com', 'tiktok.com', 'threads.net', 'bsky.app',
  'producthunt.com', 'stackoverflow.com', 'news.ycombinator.com',
  'discord.com', 'spotify.com', 'podcasts.apple.com',
]

const REVIEW_DOMAINS_TECH = [
  'g2.com', 'capterra.com', 'trustpilot.com', 'trustradius.com',
  'getapp.com', 'softwareadvice.com', 'glassdoor.com',
]

// ─── Industry-aware platform configuration ─────────────────────────────────
//
// Brands span every vertical — from beer to SaaS, personal brands to FMCG.
// Review sites, community platforms, and social channels differ by industry.

type IndustryCategory =
  | 'tech'       // SaaS, software, dev tools
  | 'food-bev'   // food, beverages, alcohol, restaurants
  | 'retail'     // e-commerce, fashion, consumer goods, FMCG
  | 'travel'     // hospitality, airlines, tourism
  | 'health'     // healthcare, fitness, wellness, pharma
  | 'finance'    // fintech, banking, insurance, crypto
  | 'education'  // edtech, courses, universities
  | 'media'      // entertainment, gaming, publishing
  | 'services'   // consulting, agencies, professional services
  | 'general'    // fallback

const INDUSTRY_KEYWORDS: Record<IndustryCategory, string[]> = {
  'tech':      ['software', 'saas', 'app', 'platform', 'tech', 'developer', 'api', 'cloud', 'ai', 'tool', 'automation', 'devops', 'startup', 'digital product'],
  'food-bev':  ['food', 'beverage', 'beer', 'wine', 'spirit', 'drink', 'restaurant', 'bar', 'brewing', 'distill', 'taste', 'cuisine', 'snack', 'coffee', 'tea', 'alcohol', 'lager', 'ale', 'cocktail', 'juice'],
  'retail':    ['retail', 'ecommerce', 'e-commerce', 'fashion', 'clothing', 'apparel', 'shop', 'store', 'consumer', 'fmcg', 'cpg', 'beauty', 'cosmetic', 'luxury', 'goods', 'brand', 'merchandise'],
  'travel':    ['travel', 'hotel', 'hospitality', 'airline', 'tourism', 'booking', 'resort', 'vacation', 'flight'],
  'health':    ['health', 'fitness', 'wellness', 'pharma', 'medical', 'healthcare', 'supplement', 'nutrition', 'gym', 'therapy'],
  'finance':   ['finance', 'fintech', 'bank', 'insurance', 'invest', 'crypto', 'payment', 'lending', 'trading', 'money'],
  'education': ['education', 'edtech', 'learning', 'course', 'university', 'training', 'school', 'tutor', 'academy'],
  'media':     ['media', 'entertainment', 'gaming', 'game', 'music', 'film', 'movie', 'publish', 'news', 'podcast', 'stream'],
  'services':  ['consulting', 'agency', 'service', 'freelance', 'professional', 'legal', 'accounting', 'marketing', 'real estate'],
  'general':   [],
}

const REVIEW_DOMAINS_BY_INDUSTRY: Record<IndustryCategory, string[]> = {
  'tech':      ['g2.com', 'capterra.com', 'trustpilot.com', 'trustradius.com', 'getapp.com', 'softwareadvice.com', 'glassdoor.com', 'sourceforge.net', 'alternativeto.net', 'saasworthy.com', 'crozdesk.com'],
  'food-bev':  ['yelp.com', 'tripadvisor.com', 'trustpilot.com', 'untappd.com', 'beeradvocate.com', 'vivino.com', 'ratebeer.com', 'google.com', 'opentable.com', 'doordash.com', 'ubereats.com', 'grubhub.com', 'happycow.net'],
  'retail':    ['trustpilot.com', 'yelp.com', 'amazon.com', 'sitejabber.com', 'bbb.org', 'influenster.com', 'google.com', 'consumeraffairs.com', 'pissedconsumer.com', 'resellerratings.com', 'reviews.io', 'judge.me'],
  'travel':    ['tripadvisor.com', 'booking.com', 'trustpilot.com', 'yelp.com', 'google.com', 'kayak.com', 'hotels.com', 'expedia.com', 'lonelyplanet.com', 'hostelworld.com', 'airbnb.com', 'viator.com'],
  'health':    ['healthgrades.com', 'webmd.com', 'trustpilot.com', 'yelp.com', 'google.com', 'vitals.com', 'zocdoc.com', 'realself.com', 'ratemds.com', 'wellness.com', 'practo.com'],
  'finance':   ['trustpilot.com', 'nerdwallet.com', 'bankrate.com', 'g2.com', 'investopedia.com', 'google.com', 'creditkarma.com', 'wallethub.com', 'finder.com', 'moneywise.com', 'thebalancemoney.com'],
  'education': ['trustpilot.com', 'coursera.org', 'g2.com', 'sitejabber.com', 'google.com', 'niche.com', 'classcentral.com', 'edarabia.com', 'studyportals.com', 'usnews.com'],
  'media':     ['metacritic.com', 'rottentomatoes.com', 'imdb.com', 'trustpilot.com', 'google.com', 'commonsensemedia.org', 'letterboxd.com', 'goodreads.com', 'rateyourmusic.com', 'opencritic.com'],
  'services':  ['trustpilot.com', 'yelp.com', 'glassdoor.com', 'bbb.org', 'clutch.co', 'google.com', 'g2.com', 'bark.com', 'thumbtack.com', 'angi.com', 'expertise.com'],
  'general':   ['trustpilot.com', 'yelp.com', 'google.com', 'sitejabber.com', 'bbb.org', 'g2.com', 'consumeraffairs.com', 'reviews.io'],
}

const COMMUNITY_DOMAINS_BY_INDUSTRY: Record<IndustryCategory, string[]> = {
  'tech':      ['producthunt.com', 'medium.com', 'dev.to', 'hackernoon.com', 'substack.com', 'github.com', 'stackoverflow.com', 'news.ycombinator.com', 'hashnode.dev', 'huggingface.co', 'kaggle.com', 'discord.com', 'slack.com', 'npm.js.com', 'pypi.org'],
  'food-bev':  ['medium.com', 'substack.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'pinterest.com', 'youtube.com', 'reddit.com', 'threads.net', 'foodnetwork.com', 'allrecipes.com', 'bonappetit.com'],
  'retail':    ['medium.com', 'substack.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'pinterest.com', 'youtube.com', 'reddit.com', 'threads.net', 'ltkapp.com', 'poshmark.com', 'depop.com'],
  'travel':    ['medium.com', 'substack.com', 'instagram.com', 'tripadvisor.com', 'youtube.com', 'facebook.com', 'pinterest.com', 'reddit.com', 'threads.net', 'tiktok.com', 'atlasoscura.com'],
  'health':    ['medium.com', 'substack.com', 'instagram.com', 'youtube.com', 'facebook.com', 'healthline.com', 'reddit.com', 'threads.net', 'tiktok.com', 'mindbodygreen.com'],
  'finance':   ['medium.com', 'substack.com', 'producthunt.com', 'youtube.com', 'facebook.com', 'linkedin.com', 'reddit.com', 'threads.net', 'seekingalpha.com', 'fool.com'],
  'education': ['medium.com', 'substack.com', 'youtube.com', 'coursera.org', 'facebook.com', 'producthunt.com', 'reddit.com', 'threads.net', 'edx.org', 'udemy.com', 'skillshare.com'],
  'media':     ['medium.com', 'substack.com', 'youtube.com', 'instagram.com', 'tiktok.com', 'twitch.tv', 'discord.com', 'reddit.com', 'threads.net', 'spotify.com', 'soundcloud.com', 'bandcamp.com'],
  'services':  ['medium.com', 'substack.com', 'producthunt.com', 'clutch.co', 'linkedin.com', 'youtube.com', 'reddit.com', 'threads.net', 'upwork.com', 'fiverr.com'],
  'general':   ['medium.com', 'substack.com', 'youtube.com', 'instagram.com', 'facebook.com', 'producthunt.com', 'reddit.com', 'threads.net', 'tiktok.com', 'linkedin.com'],
}

const REVIEW_RECS_BY_INDUSTRY: Record<IndustryCategory, string> = {
  'tech':      'Create profiles on G2, Trustpilot, Capterra — top sources for AI product recommendations',
  'food-bev':  'Get listed on Yelp, TripAdvisor, Untappd, or Vivino — LLMs reference consumer review platforms for food & beverage brands',
  'retail':    'Build presence on Trustpilot, Amazon reviews, and Google — AI models cite these for consumer product recommendations',
  'travel':    'Get reviews on TripAdvisor, Booking.com, and Google — key sources for AI travel recommendations',
  'health':    'Build profiles on Healthgrades, WebMD, and Google — AI models cite these for health-related queries',
  'finance':   'Get listed on Trustpilot, NerdWallet, and Bankrate — top sources for AI financial recommendations',
  'education': 'Build presence on Trustpilot, Coursera, and Niche — AI models cite these for education recommendations',
  'media':     'Get listed on Metacritic, IMDb, or Rotten Tomatoes — AI models reference these for entertainment queries',
  'services':  'Build profiles on Trustpilot, Clutch, and Google — key sources for AI service recommendations',
  'general':   'Create profiles on Trustpilot, Yelp, and Google Reviews — LLMs cite these to validate brand quality',
}

const COMMUNITY_RECS_BY_INDUSTRY: Record<IndustryCategory, string> = {
  'tech':      'Launch on Product Hunt, contribute to Medium/Substack — LLMs index these heavily',
  'food-bev':  'Build presence on Instagram, YouTube, and food blogs — AI models index visual and editorial food content',
  'retail':    'Create content on Instagram, YouTube, and lifestyle blogs — AI models cite these for consumer brand discovery',
  'travel':    'Share content on YouTube, Instagram, and travel blogs — LLMs index visual and editorial travel content',
  'health':    'Publish on Medium, YouTube, and health platforms — AI models cite expert health content',
  'finance':   'Contribute to Medium, Substack, and financial publications — LLMs cite authoritative finance content',
  'education': 'Create content on YouTube, Medium, and course platforms — AI models index educational content heavily',
  'media':     'Build presence on YouTube, TikTok, and Twitch — AI models cite these for entertainment discovery',
  'services':  'Publish on Medium, LinkedIn, and Clutch — LLMs cite thought leadership content',
  'general':   'Create content on YouTube, Medium, and social platforms — LLMs index community content for brand signals',
}

/**
 * Classify a brand's industry into a broad category for platform selection.
 * Uses industry field, products, description, and business type for matching.
 */
function classifyIndustry(ctx: BrandContext): IndustryCategory {
  const text = [ctx.industry, ctx.products, ctx.description, ctx.businessType, ctx.valueProposition]
    .filter(Boolean).join(' ').toLowerCase()

  let bestCategory: IndustryCategory = 'general'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(INDUSTRY_KEYWORDS) as [IndustryCategory, string[]][]) {
    if (category === 'general') continue
    const score = keywords.filter(kw => text.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return bestCategory
}

// ─── Region classification ──────────────────────────────────────────────────

type GeoRegion = 'africa' | 'mena' | 'asia' | 'europe' | 'latam' | 'north-america' | 'oceania' | 'global'

/** Map target_markets codes and company_location to a primary region. */
function classifyRegion(ctx: BrandContext): GeoRegion {
  const locationText = [ctx.companyLocation, ...(ctx.targetMarkets || [])].join(' ').toLowerCase()
  if (!locationText.trim()) return 'global'

  const regionPatterns: [GeoRegion, RegExp][] = [
    ['africa',        /\b(kenya|nigeria|ghana|south.?africa|tanzania|uganda|ethiopia|rwanda|senegal|cameroon|ivory.?coast|angola|mozambique|zambia|zimbabwe|botswana|namibia|malawi|africa|za|ke|ng|gh|tz|ug|et|rw|sn|cm|ao|mz|zm|zw|bw|na|mw)\b/],
    ['mena',          /\b(saudi|uae|emirates|dubai|qatar|bahrain|oman|kuwait|egypt|morocco|tunisia|jordan|lebanon|iraq|iran|israel|turkey|middle.?east|mena|arab|sa|ae|qa|bh|om|kw|eg|ma|tn|jo|lb|iq|ir|il|tr)\b/],
    ['asia',          /\b(india|china|japan|korea|indonesia|malaysia|thailand|vietnam|philippines|singapore|pakistan|bangladesh|sri.?lanka|myanmar|cambodia|taiwan|hong.?kong|asia|in|cn|jp|kr|id|my|th|vn|ph|sg|pk|bd|lk|mm|kh|tw|hk)\b/],
    ['europe',        /\b(uk|united.?kingdom|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|austria|switzerland|ireland|portugal|poland|czech|romania|hungary|greece|europe|gb|de|fr|es|it|nl|be|se|no|dk|fi|at|ch|ie|pt|pl|cz|ro|hu|gr)\b/],
    ['latam',         /\b(brazil|mexico|argentina|colombia|chile|peru|venezuela|ecuador|bolivia|paraguay|uruguay|costa.?rica|panama|latin.?america|latam|br|mx|ar|co|cl|pe|ve|ec|bo|py|uy|cr|pa)\b/],
    ['north-america', /\b(usa|united.?states|canada|us|ca|america|american)\b/],
    ['oceania',       /\b(australia|new.?zealand|au|nz|oceania|pacific)\b/],
  ]

  for (const [region, pattern] of regionPatterns) {
    if (pattern.test(locationText)) return region
  }
  return 'global'
}

/**
 * Region-specific review/community platform additions.
 * These are merged with industry-specific platforms to ensure coverage
 * across different geographies. Global brands get all defaults.
 */
const REGION_REVIEW_EXTRAS: Record<GeoRegion, string[]> = {
  'africa':        ['google.com', 'facebook.com', 'jumia.com', 'hellopeter.com', 'google.co.za', 'google.co.ke'],
  'mena':          ['google.com', 'facebook.com', 'talabat.com', 'careem.com', 'google.ae', 'google.com.sa', 'google.com.eg'],
  'asia':          ['google.com', 'justdial.com', 'zomato.com', 'lazada.com', 'shopee.com', 'flipkart.com', 'kakaku.com', 'google.co.in', 'google.co.jp'],
  'europe':        ['google.com', 'trustpilot.com', 'glassdoor.com', 'google.co.uk', 'google.de', 'google.fr', 'ekomi.com', 'avis-verifies.com'],
  'latam':         ['google.com', 'mercadolibre.com', 'reclameaqui.com.br', 'google.com.br', 'google.com.mx'],
  'north-america': ['google.com', 'bbb.org', 'yelp.com', 'consumeraffairs.com', 'google.ca'],
  'oceania':       ['google.com', 'productreview.com.au', 'trustpilot.com', 'google.com.au', 'google.co.nz'],
  'global':        ['google.com', 'trustpilot.com'],
}

const REGION_COMMUNITY_EXTRAS: Record<GeoRegion, string[]> = {
  'africa':        ['facebook.com', 'tiktok.com', 'instagram.com', 'whatsapp.com', 'threads.net', 'twitter.com', 'x.com'],
  'mena':          ['facebook.com', 'tiktok.com', 'instagram.com', 'snapchat.com', 'threads.net', 'twitter.com', 'x.com'],
  'asia':          ['facebook.com', 'line.me', 'wechat.com', 'tiktok.com', 'kakao.com', 'bilibili.com', 'xiaohongshu.com', 'threads.net'],
  'europe':        ['facebook.com', 'instagram.com', 'tiktok.com', 'threads.net', 'mastodon.social'],
  'latam':         ['facebook.com', 'instagram.com', 'tiktok.com', 'whatsapp.com', 'threads.net', 'twitter.com', 'x.com'],
  'north-america': ['facebook.com', 'instagram.com', 'tiktok.com', 'threads.net', 'bsky.app', 'nextdoor.com'],
  'oceania':       ['facebook.com', 'instagram.com', 'tiktok.com', 'threads.net', 'bsky.app'],
  'global':        ['facebook.com', 'instagram.com', 'tiktok.com', 'threads.net'],
}

const REGION_SOCIAL_EXTRAS: Record<GeoRegion, string[]> = {
  'africa':        ['tiktok.com', 'facebook.com', 'instagram.com', 'whatsapp.com', 'threads.net'],
  'mena':          ['tiktok.com', 'snapchat.com', 'instagram.com', 'facebook.com', 'threads.net'],
  'asia':          ['tiktok.com', 'weibo.com', 'line.me', 'instagram.com', 'facebook.com', 'bilibili.com', 'xiaohongshu.com', 'kakao.com', 'naver.com'],
  'europe':        ['threads.net', 'mastodon.social'],
  'latam':         ['tiktok.com', 'facebook.com', 'instagram.com', 'threads.net'],
  'north-america': ['threads.net', 'bsky.app', 'nextdoor.com'],
  'oceania':       ['threads.net', 'bsky.app'],
  'global':        ['threads.net'],
}

/**
 * Get the full set of review, community, and social domains for a brand,
 * merging industry-specific and region-specific platforms.
 */
function getBrandPlatforms(ctx: BrandContext): {
  reviewDomains: string[]
  communityDomains: string[]
  socialDomains: string[]
  industryCategory: IndustryCategory
  region: GeoRegion
} {
  const industryCategory = classifyIndustry(ctx)
  const region = classifyRegion(ctx)

  const dedup = (arr: string[]) => [...new Set(arr)]

  return {
    reviewDomains: dedup([
      ...REVIEW_DOMAINS_BY_INDUSTRY[industryCategory],
      ...REGION_REVIEW_EXTRAS[region],
    ]),
    communityDomains: dedup([
      ...COMMUNITY_DOMAINS_BY_INDUSTRY[industryCategory],
      ...REGION_COMMUNITY_EXTRAS[region],
    ]),
    socialDomains: dedup([
      // Primary social platforms — LLMs actively crawl and cite these
      'twitter.com', 'x.com', 'linkedin.com', 'youtube.com',
      'instagram.com', 'facebook.com', 'tiktok.com', 'pinterest.com',
      // Newer/expanded platforms LLMs index for brand signals
      'threads.net', 'bsky.app', 'mastodon.social',
      'reddit.com', 'quora.com',
      // Professional & creator platforms
      'github.com', 'medium.com', 'substack.com',
      // Audio/video platforms
      'spotify.com', 'podcasts.apple.com', 'open.spotify.com',
      'twitch.tv', 'vimeo.com',
      // Messaging platforms (brand presence signals)
      'discord.com', 'discord.gg', 't.me',
      // Regional (always included, deduped with region extras)
      'wa.me', 'whatsapp.com',
      ...REGION_SOCIAL_EXTRAS[region],
    ]),
    industryCategory,
    region,
  }
}

const EXA_API_KEY = process.env.EXA_API_KEY || ''
const SERP_API_KEY = process.env.SERP_API_KEY || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

/** Free auto-routed model — used as fallback when primary is unavailable */
const FREE_FALLBACK_MODEL = 'openrouter/free'

// Citation verification now uses existing LLM run data only — no live probes.

/** Primary model for content assessment — free router picks best available */
const ASSESSMENT_MODEL = 'openrouter/free'

// ─── External API helpers ──────────────────────────────────────────────────

/**
 * Call OpenRouter with automatic fallback to free model routing.
 * Tries the requested model first; on 402 (billing) or 429 (rate limit),
 * retries with `openrouter/auto` which routes to available free models.
 */
async function openRouterChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { maxTokens?: number; temperature?: number; timeout?: number } = {},
): Promise<{ ok: boolean; content: string; model: string; status: number }> {
  if (!OPENROUTER_API_KEY) {
    return { ok: false, content: '', model, status: 0 }
  }

  const maxTokens = opts.maxTokens ?? 1500
  const temperature = opts.temperature ?? 0.1
  const timeout = opts.timeout ?? 30000

  // Try primary model first, then fallback
  const models = model === FREE_FALLBACK_MODEL ? [model] : [model, FREE_FALLBACK_MODEL]
  for (const targetModel of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://withsoma.ai',
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(timeout),
      })

      if (res.ok) {
        const data = await res.json()
        const content = (data.choices?.[0]?.message?.content || '').trim()
        return { ok: true, content, model: targetModel, status: res.status }
      }

      // If billing/rate-limit error on paid model, try free fallback
      if ((res.status === 402 || res.status === 429) && targetModel !== FREE_FALLBACK_MODEL) {
        console.warn(`[AEO Audit] Model ${targetModel} returned ${res.status} — falling back to ${FREE_FALLBACK_MODEL}`)
        continue
      }

      return { ok: false, content: '', model: targetModel, status: res.status }
    } catch {
      // Network/timeout on paid model → try free fallback
      if (targetModel !== FREE_FALLBACK_MODEL) {
        console.warn(`[AEO Audit] Model ${targetModel} timed out — falling back to ${FREE_FALLBACK_MODEL}`)
        continue
      }
      return { ok: false, content: '', model: targetModel, status: 0 }
    }
  }

  return { ok: false, content: '', model, status: 0 }
}

async function exaSearch(
  query: string,
  opts: { numResults?: number; type?: string; includeDomains?: string[]; excludeDomains?: string[] } = {}
): Promise<Array<{ url: string; title: string; text?: string; publishedDate?: string }>> {
  if (!EXA_API_KEY) return []
  try {
    const body: Record<string, unknown> = {
      query,
      numResults: opts.numResults || 10,
      type: opts.type || 'neural',
      useAutoprompt: false, // Disabled: we need exact brand queries, not Exa-modified ones
      contents: { text: { maxCharacters: 500 } }, // 500 chars for better LLM verification
    }
    if (opts.includeDomains?.length) body.includeDomains = opts.includeDomains
    if (opts.excludeDomains?.length) body.excludeDomains = opts.excludeDomains

    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      url: r.url,
      title: r.title || '',
      text: r.text || '',
      publishedDate: r.publishedDate || null,
    }))
  } catch {
    return []
  }
}

async function serpSearch(query: string): Promise<{
  organic: Array<{ link: string; title: string; snippet: string; position: number }>
  knowledgeGraph?: { title?: string; description?: string; type?: string }
  totalResults: number
}> {
  if (!SERP_API_KEY) return { organic: [], totalResults: 0 }
  try {
    const params = new URLSearchParams({
      q: query,
      api_key: SERP_API_KEY,
      engine: 'google',
      num: '10',
    })
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { organic: [], totalResults: 0 }
    const data = await res.json()
    return {
      organic: (data.organic_results || []).map((r: any) => ({
        link: r.link,
        title: r.title,
        snippet: r.snippet || '',
        position: r.position,
      })),
      knowledgeGraph: data.knowledge_graph
        ? {
            title: data.knowledge_graph.title,
            description: data.knowledge_graph.description,
            type: data.knowledge_graph.type,
          }
        : undefined,
      totalResults: data.search_information?.total_results || 0,
    }
  } catch {
    return { organic: [], totalResults: 0 }
  }
}

// ─── Relevance filtering ────────────────────────────────────────────────────

// Generic industry suffixes common in brand names — stripped when extracting
// core brand keywords so that "Soma AI" ➜ ["soma"], "Acme Labs" ➜ ["acme"]
const GENERIC_BRAND_SUFFIXES = new Set([
  'ai', 'tech', 'labs', 'lab', 'app', 'hq', 'io', 'co', 'inc', 'ltd',
  'digital', 'global', 'group', 'studio', 'studios', 'media', 'pro',
  'cloud', 'data', 'platform', 'software', 'solutions', 'systems',
  'works', 'hub', 'net', 'dev', 'bot', 'agent', 'stack',
])

/**
 * Extract the core distinguishing keywords from a brand name.
 * Removes generic industry suffixes so "Soma AI" → ["soma"], "Acme Tech" → ["acme"].
 * Returns the original slug as fallback if every word is generic.
 */
function extractCoreKeywords(brandName: string): string[] {
  const words = brandName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length >= 2)
  const core = words.filter(w => !GENERIC_BRAND_SUFFIXES.has(w))
  return core.length > 0 ? core : words
}

/**
 * Detect whether a result's domain belongs to a different company
 * that happens to share the same brand keyword.
 * e.g. for brand "Soma AI" (withsoma.ai): somalabs.ai, getsoma.ai → true
 */
function isCompetingDomain(
  resultUrl: string,
  ownedDomainRoot: string,
  ctx: BrandContext,
  ownedDomains?: Set<string>,
): boolean {
  let resultHost: string
  try {
    resultHost = new URL(resultUrl).hostname.replace(/^www\./, '')
  } catch { return false }

  // If it's our own domain (or a subdomain), it's not competing
  const ownedSlug = ownedDomainRoot.split('.')[0].replace(/[^a-z0-9]/g, '')
  const resultSlug = resultHost.split('.')[0].replace(/[^a-z0-9]/g, '')
  if (resultSlug === ownedSlug) return false
  if (ownedDomains && isOwnedDomain(resultHost, ownedDomains)) return false

  // Non-brand domains (reddit, wikipedia, techcrunch, etc.) are never competing
  const coreKeywords = extractCoreKeywords(ctx.brandName)
  const hasAnyKeyword = coreKeywords.some(kw => resultSlug.includes(kw))
  if (!hasAnyKeyword) return false

  // The result domain contains our core keyword but is a DIFFERENT domain ➜ competing
  // e.g. "somalabs" contains "soma" but isn't "withsoma" → true
  return true
}

/**
 * Determine if a brand name is "common" — likely shared by multiple entities.
 * Goes beyond simple length: multi-word names like "Soma AI" have common
 * core words ("soma") and need disambiguation just like short names.
 */
function isBrandNameCommon(brandName: string, siteDomain: string): boolean {
  const brandLower = brandName.toLowerCase()
  // Single-word short names are always common
  if (brandLower.length <= 5) return true
  // Multi-word: check if any core keyword is ≤5 chars
  const core = extractCoreKeywords(brandName)
  if (core.some(w => w.length <= 5)) return true
  // Domain doesn't resemble the brand slug → brand had to get creative
  const brandSlug = brandLower.replace(/[^a-z0-9]/g, '')
  const domSlug = siteDomain.split('.')[0].replace(/[^a-z0-9]/g, '')
  if (domSlug !== brandSlug && !domSlug.includes(brandSlug)) return true
  return false
}

/**
 * Check whether a search result actually refers to THIS brand (not a similarly-named entity).
 * Uses brand name, entity aliases, AND site domain for precise matching.
 *
 * Three layers of disambiguation:
 * 1. Competing-entity detection: reject results from look-alike brand domains
 * 2. Domain-based matching: owned domain appears in URL or content
 * 3. Name-based matching: brand name + industry context for common names
 */
function isRelevantResult(
  result: { url: string; title: string; text?: string },
  ctx: BrandContext,
  siteDomain: string,
): boolean {
  const textLower = (result.text || '').toLowerCase()
  const titleLower = (result.title || '').toLowerCase()
  const urlLower = result.url.toLowerCase()
  const combined = `${titleLower} ${textLower}`

  // Domain root without subdomains (e.g. "withsoma.ai")
  const domainRoot = siteDomain.replace(/^(www\.)?/, '')
  const domainName = domainRoot.split('.')[0] // "withsoma"

  // 1. URL contains our actual domain → always relevant
  if (urlLower.includes(domainRoot)) return true

  // 2. COMPETING ENTITY CHECK — if the result URL belongs to a different
  //    company with a similar name (somalabs.ai vs withsoma.ai), reject it
  //    unless the content explicitly references OUR domain or specific aliases
  if (isCompetingDomain(result.url, domainRoot, ctx)) {
    // Content must mention our actual domain to be relevant
    if (combined.includes(domainRoot)) return true
    // Check if content mentions a domain-like entity alias (e.g. "withsoma.ai")
    for (const alias of (ctx.entityAliases || [])) {
      const aliasLower = alias.toLowerCase()
      if (aliasLower.includes('.') && combined.includes(aliasLower)) return true
    }
    return false
  }

  // 3. Domain name appears in text → strong signal
  //    BUT for short domain names (e.g. "nala"), require it as a standalone word
  //    to avoid matching "nalarocks", "nalaart", etc. as this brand
  if (domainName.length >= 6) {
    // Longer domain names are specific enough for substring matching
    if (combined.includes(domainRoot) || combined.includes(domainName)) return true
  } else if (domainName.length >= 4) {
    // Short domain names: require the full domain (with TLD) in text, OR
    // require the domain name as a word boundary match (not a prefix of another word)
    if (combined.includes(domainRoot)) return true
    const wordBoundaryRegex = new RegExp(`\\b${domainName}\\b`, 'i')
    if (wordBoundaryRegex.test(combined)) {
      // Even with word boundary, short names need industry context
      // (handled below in the brand name check section)
    }
  }

  // 4. Check name/alias matches, but for common names require industry context
  const brandLower = ctx.brandName.toLowerCase()
  const isCommonWord = isBrandNameCommon(ctx.brandName, siteDomain)

  // Build industry context terms for disambiguation
  const industryTerms: string[] = []
  if (isCommonWord) {
    const fields = [ctx.industry, ctx.products, ctx.description, ctx.valueProposition]
      .filter(Boolean).join(' ').toLowerCase()
    // Extract meaningful terms (3+ chars, skip stopwords)
    const stopwords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'our', 'are', 'was', 'been',
      'have', 'has', 'will', 'can', 'more', 'most', 'than', 'into', 'also', 'their', 'about', 'them', 'they',
      'which', 'would', 'could', 'should', 'each', 'other', 'some', 'best', 'well', 'just', 'like', 'very'])
    const words = [...new Set(fields.split(/[\s,;/|.]+/).filter(w => w.length >= 3 && !stopwords.has(w)))]
    industryTerms.push(...words.slice(0, 15))
  }

  const hasIndustryContext = industryTerms.length === 0 || industryTerms.some(term => combined.includes(term))

  // Full brand name match
  if (combined.includes(brandLower)) {
    return isCommonWord ? hasIndustryContext : true
  }

  // 4. Entity aliases match (e.g. "withsoma", "soma geo", "soma.ai")
  for (const alias of (ctx.entityAliases || [])) {
    const aliasLower = alias.toLowerCase()
    if (aliasLower.length >= 3 && (combined.includes(aliasLower) || urlLower.includes(aliasLower))) {
      // Aliases like "nala.money" or "nala fintech" are specific enough
      const isSpecificAlias = aliasLower.includes('.') || aliasLower.includes(' ') || aliasLower.length >= 8
      return isSpecificAlias ? true : (isCommonWord ? hasIndustryContext : true)
    }
  }

  return false
}

/**
 * Build all name variants for Exa/SERP queries.
 * Returns the most specific variant suitable for search.
 */
function buildSearchQuery(ctx: BrandContext, siteDomain: string): string {
  // Always use quoted brand name + domain for precision
  return siteDomain ? `"${ctx.brandName}" ${siteDomain}` : `"${ctx.brandName}"`
}

/**
 * Build a comprehensive set of domains owned by this brand.
 * Brands often use multiple domains (e.g. nala.com + nala.money,
 * or withsoma.ai + soma.ai). We need to exclude ALL of them from
 * third-party analysis to avoid counting own content as external citations.
 */
function buildOwnedDomains(siteDomain: string, ctx: BrandContext): Set<string> {
  const domains = new Set<string>()
  if (siteDomain) domains.add(siteDomain)

  // Add primary domain from brand context
  if (ctx.primaryDomain) {
    try {
      const pd = ctx.primaryDomain.includes('://')
        ? new URL(ctx.primaryDomain).hostname.replace(/^www\./, '')
        : ctx.primaryDomain.replace(/^www\./, '').replace(/\/.*$/, '')
      if (pd) domains.add(pd)
    } catch { /* ignore */ }
  }

  // Check entity aliases for domain-like values (contain dots, no spaces)
  for (const alias of (ctx.entityAliases || [])) {
    const cleaned = alias.trim().toLowerCase()
    if (cleaned.includes('.') && !cleaned.includes(' ')) {
      try {
        const d = cleaned.includes('://')
          ? new URL(cleaned).hostname.replace(/^www\./, '')
          : cleaned.replace(/^www\./, '').replace(/\/.*$/, '')
        if (d) domains.add(d)
      } catch { /* ignore */ }
    }
  }

  // Common TLD variants of the brand name for detection
  const brandSlug = (ctx.slug || ctx.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (brandSlug.length >= 3) {
    const commonTLDs = ['com', 'money', 'io', 'ai', 'co', 'app', 'tech', 'net', 'org']
    for (const tld of commonTLDs) {
      const variant = `${brandSlug}.${tld}`
      // Only add if it's a known alias (appears in entity aliases, primary domain, or site domain)
      if (domains.has(variant) || siteDomain.split('.')[0] === brandSlug) {
        // Already handled or matches site domain root
      }
    }
  }

  return domains
}

/**
 * Check if a hostname belongs to a brand's owned domains.
 * Handles subdomain matching (e.g. app.nala.money matches nala.money).
 */
function isOwnedDomain(hostname: string, ownedDomains: Set<string>): boolean {
  const host = hostname.replace(/^www\./, '')
  if (ownedDomains.has(host)) return true
  // Check subdomain match: app.nala.money → nala.money
  for (const owned of ownedDomains) {
    if (host.endsWith('.' + owned)) return true
  }
  return false
}

// ─── Service ────────────────────────────────────────────────────────────────

export class BrandIndexingAuditService {
  private supabase

  constructor() {
    this.supabase = createServiceClient()
  }

  async runAudit(brandId: string, siteUrl: string | null, brand?: BrandContext): Promise<AuditResult> {
    const hasWebsite = !!siteUrl
    const url = hasWebsite ? (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`) : ''
    const ctx: BrandContext = brand || { brandName: '', description: '', industry: '', products: '', targetAudience: '', valueProposition: '', competitors: [], targetMarkets: [], businessModel: '', businessType: '', entityAliases: [], primaryDomain: '', slug: '', companyLocation: '' }

    const robotsTxtUrl = hasWebsite ? new URL('/robots.txt', url).toString() : ''

    // Extract domain for filtering
    const siteDomain = hasWebsite ? new URL(url).hostname.replace(/^www\./, '') : ''

    // Build comprehensive set of owned domains — needed because brands often
    // own multiple domains (e.g. nala.com AND nala.money for the same brand)
    const ownedDomains = buildOwnedDomains(siteDomain, ctx)

    // Pre-fetch shared data in parallel — use precise search queries
    const searchQuery = buildSearchQuery(ctx, siteDomain)
    // SerpAPI query — never use site: operator, it restricts results to own domain
    // and prevents us from seeing third-party ranking positions
    const serpQuery = ctx.industry && ctx.industry.length > 3 && ctx.industry.toLowerCase() !== 'other'
      ? `"${ctx.brandName}" ${ctx.industry}`
      : `"${ctx.brandName}"`

    const [homepageResult, robotsTxt, serpResult, exaBrandMentions] = await Promise.all([
      hasWebsite ? this.fetchPageWithRedirect(url) : Promise.resolve({ html: '', finalUrl: '' }),
      hasWebsite ? this.fetchPage(robotsTxtUrl) : Promise.resolve(''),
      serpSearch(serpQuery),
      exaSearch(searchQuery, { numResults: 20, excludeDomains: [...ownedDomains] }),
    ])

    const homepageHtml = homepageResult.html

    // Detect redirect-based domain aliases (e.g. nala.com → nala.money)
    if (hasWebsite) try {
      const redirectDomain = new URL(homepageResult.finalUrl).hostname.replace(/^www\./, '')
      if (redirectDomain !== siteDomain) {
        ownedDomains.add(redirectDomain)
      }
    } catch { /* ignore */ }

    // Detect alternate domains from homepage HTML (canonical links, og:url, linked domains)
    if (hasWebsite) {
    const canonicalMatch = homepageHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    if (canonicalMatch?.[1]) {
      try {
        const canonicalDomain = new URL(canonicalMatch[1]).hostname.replace(/^www\./, '')
        if (canonicalDomain !== siteDomain) ownedDomains.add(canonicalDomain)
      } catch { /* ignore */ }
    }
    const ogUrlMatch = homepageHtml.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)
    if (ogUrlMatch?.[1]) {
      try {
        const ogDomain = new URL(ogUrlMatch[1]).hostname.replace(/^www\./, '')
        if (ogDomain !== siteDomain) ownedDomains.add(ogDomain)
      } catch { /* ignore */ }
    }

    // Detect brand-owned alternate domains from homepage href links
    // e.g. nala.com → app.nala.money (NALA's app domain)
    const brandSlug = (ctx.slug || ctx.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (brandSlug.length >= 3) {
      const hrefMatches = homepageHtml.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)
      const linkedDomains = new Set<string>()
      for (const match of hrefMatches) {
        try {
          const linkedHost = new URL(match[1]).hostname.replace(/^www\./, '')
          // If the root of the linked domain matches the brand slug, it's likely owned
          const linkedRoot = linkedHost.split('.').slice(-2, -1)[0] || ''
          if (linkedRoot === brandSlug && !ownedDomains.has(linkedHost)) {
            // Extract just the registerable domain (e.g. nala.money from app.nala.money)
            const parts = linkedHost.split('.')
            if (parts.length >= 2) {
              const regDomain = parts.slice(-2).join('.')
              linkedDomains.add(regDomain)
            }
          }
        } catch { /* ignore */ }
      }
      for (const d of linkedDomains) ownedDomains.add(d)
    }
    } // end hasWebsite domain detection

    // Post-filter Exa results: remove owned domains, then check brand relevance
    const nonOwnedExaMentions = exaBrandMentions.filter(r => {
      try {
        const host = new URL(r.url).hostname.replace(/^www\./, '')
        return !isOwnedDomain(host, ownedDomains)
      } catch { return true }
    })
    const filteredExaMentions = nonOwnedExaMentions.filter(r => isRelevantResult(r, ctx, siteDomain))

    // Build evidence collector
    const evidence: AuditEvidence = {
      crawledUrls: hasWebsite ? [
        { url, status: homepageHtml.length > 0 ? 'ok' : 'error', type: 'homepage' },
        { url: robotsTxtUrl, status: robotsTxt.length > 10 ? 'ok' : 'error', type: 'robots.txt' },
      ] : [],
      serpResults: serpResult.organic.map(r => ({ url: r.link, title: r.title, position: r.position })),
      exaMentions: filteredExaMentions.map(r => ({
        url: r.url,
        title: r.title,
        domain: (() => { try { return new URL(r.url).hostname } catch { return r.url } })(),
        date: r.publishedDate || undefined,
      })),
      sitemapUrls: [],
      robotsTxtUrl: robotsTxtUrl || undefined,
      robotsTxtContent: robotsTxt.substring(0, 2000),
      schemaTypesFound: [],
      socialProfiles: [],
      reviewListings: [],
      redditThreads: [],
      wikiPages: [],
      knowledgeGraph: serpResult.knowledgeGraph,
    }

    // Website-dependent pillars: return "not applicable" when no website
    const noWebsitePillar = (id: string, name: string, description: string): AuditPillar => ({
      id, name, description,
      score: 0, maxScore: 0, status: 'fail',
      checks: [{
        id: `${id}-no-website`, name: 'No Website',
        status: 'fail', score: 0, maxScore: 0,
        details: 'No website configured — this pillar requires a website to audit',
        recommendation: 'Create and publish a website for your brand. A website is the primary signal AI engines use to verify your brand exists and understand what you do.',
        priority: 'critical', effort: 'high', category: id,
      }],
    })

    const [
      crawlability,
      structuredData,
      contentAuthority,
      sourceFootprint,
      knowledgeGraph,
      socialProof,
      brandConsistency,
    ] = await Promise.all([
      hasWebsite ? this.auditCrawlability(url, robotsTxt, evidence) : Promise.resolve(noWebsitePillar('crawlability', 'Crawlability', 'Can AI crawlers access and read your website?')),
      hasWebsite ? this.auditStructuredData(url, homepageHtml, evidence) : Promise.resolve(noWebsitePillar('structured-data', 'Structured Data', 'Is your brand information machine-readable?')),
      hasWebsite ? this.auditContentAuthority(brandId, ctx, filteredExaMentions, siteDomain, url, homepageHtml) : Promise.resolve(noWebsitePillar('content-authority', 'Content Authority', 'Does your content signal expertise to AI?')),
      this.auditSourceFootprint(brandId, ctx, filteredExaMentions, siteDomain, ownedDomains),
      hasWebsite ? this.auditKnowledgeGraph(brandId, url, homepageHtml, ctx, serpResult, evidence, siteDomain) : this.auditKnowledgeGraph(brandId, '', '', ctx, serpResult, evidence, ''),
      this.auditSocialProof(brandId, ctx, filteredExaMentions, evidence, siteDomain),
      hasWebsite ? this.auditBrandConsistency(brandId, url, homepageHtml, ctx, evidence) : Promise.resolve(noWebsitePillar('brand-consistency', 'Brand Consistency', 'Is your brand identity clear and consistent?')),
    ])

    const pillars = [crawlability, structuredData, contentAuthority, sourceFootprint, knowledgeGraph, socialProof, brandConsistency]

    // Weighted AEO score — each pillar contributes proportionally to LLM citation importance
    const weightedScore = pillars.reduce((total, p) => {
      const weight = PILLAR_WEIGHTS[p.id] || 0
      const pillarPct = p.maxScore > 0 ? p.score / p.maxScore : 0
      return total + (pillarPct * weight * 100)
    }, 0)
    const rawTechnicalScore = Math.round(weightedScore)

    // ── Citation Reality Check ──
    // Verify that AI engines actually cite this brand. Technical readiness
    // without real citations means the score is aspirational, not actual.
    const citationVerification = await this.verifyCitationReality(brandId, ctx)
    citationVerification.rawTechnicalScore = rawTechnicalScore

    // Apply calibration: if citation rate is known, adjust the score
    // Unknown (-1) = no penalty, 0% citation = cap at 50%, 100% = full score
    const overallScore = citationVerification.citationRate >= 0
      ? Math.round(rawTechnicalScore * citationVerification.calibrationMultiplier)
      : rawTechnicalScore

    const issues = pillars
      .flatMap(p => p.checks.filter(c => c.status === 'fail' || c.status === 'warning'))
      .sort((a, b) => {
        const prio: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        return (prio[a.priority] ?? 3) - (prio[b.priority] ?? 3)
      })

    const allChecks = pillars.flatMap(p => p.checks)
    const result: AuditResult = {
      id: crypto.randomUUID(),
      brandId,
      siteUrl: url || 'no-website',
      overallScore,
      grade: this.scoreToGrade(overallScore),
      pillars,
      issues,
      evidence,
      summary: {
        totalChecks: allChecks.length,
        passed: allChecks.filter(c => c.status === 'pass').length,
        warnings: allChecks.filter(c => c.status === 'warning').length,
        failed: allChecks.filter(c => c.status === 'fail').length,
        criticalIssues: issues.filter(i => i.priority === 'critical').length,
      },
      citationVerification,
      createdAt: new Date().toISOString(),
    }

    await this.storeAuditResult(result)
    return result
  }

  async getLatestAudit(brandId: string): Promise<AuditResult | null> {
    const { data, error } = await this.supabase
      .from('discoverability_audits')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return this.parseStoredAudit(data)
  }

  async getAuditHistory(brandId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('discoverability_audits')
      .select('id, overall_score, audit_results, created_at')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((d: any) => ({
      id: d.id,
      score: d.overall_score || 0,
      grade: this.scoreToGrade(d.overall_score || 0),
      createdAt: d.created_at,
    }))
  }

  // ─── Shared helpers ─────────────────────────────────────────────────────

  private async fetchPage(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Soma-AI-Auditor/1.0' },
        signal: AbortSignal.timeout(12000),
        redirect: 'follow',
      })
      if (res.ok) return await res.text()
    } catch { /* ignore */ }
    return ''
  }

  /**
   * Fetch a page and return both the HTML and the final URL after redirects.
   * Useful for detecting brand domain aliases (e.g. nala.com → nala.money).
   */
  private async fetchPageWithRedirect(url: string): Promise<{ html: string; finalUrl: string }> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Soma-AI-Auditor/1.0' },
        signal: AbortSignal.timeout(12000),
        redirect: 'follow',
      })
      if (res.ok) {
        const html = await res.text()
        return { html, finalUrl: res.url }
      }
    } catch { /* ignore */ }
    return { html: '', finalUrl: url }
  }

  // ─── Pillar 1: Crawlability ─────────────────────────────────────────────

  private async auditCrawlability(siteUrl: string, robotsContent: string, evidence: AuditEvidence): Promise<AuditPillar> {
    const checks: AuditCheck[] = []
    const robotsExists = robotsContent.length > 10

    checks.push({
      id: 'robots-exists', name: 'robots.txt File',
      status: robotsExists ? 'pass' : 'fail',
      score: robotsExists ? 10 : 0, maxScore: 10,
      details: robotsExists ? 'robots.txt is accessible' : 'robots.txt not found or empty',
      recommendation: robotsExists ? undefined : 'Create a robots.txt file at the root of your domain to control crawler access',
      priority: 'critical', effort: 'easy', category: 'crawlability',
      metadata: { sourceUrl: new URL('/robots.txt', siteUrl).toString(), contentPreview: robotsContent.substring(0, 500) },
    })

    // AI crawler access
    const crawlerRules = this.parseRobotsTxt(robotsContent)
    const allowed = crawlerRules.filter(r => r.status === 'allowed')
    const blocked = crawlerRules.filter(r => r.status === 'blocked')
    const crawlerScore = AI_CRAWLERS.length > 0 ? Math.round((allowed.length / AI_CRAWLERS.length) * 20) : 0

    checks.push({
      id: 'ai-crawler-access', name: 'AI Crawler Access',
      status: blocked.length === 0 ? 'pass' : blocked.length <= 2 ? 'warning' : 'fail',
      score: crawlerScore, maxScore: 20,
      details: `${allowed.length}/${AI_CRAWLERS.length} AI crawlers can access your site`,
      recommendation: blocked.length > 0 ? `Unblock: ${blocked.map(c => c.crawler).join(', ')}` : undefined,
      priority: blocked.length > 3 ? 'critical' : 'high', effort: 'easy', category: 'crawlability',
      metadata: { crawlerRules, allowedCrawlers: allowed.length, blockedCrawlers: blocked.length },
    })

    // Sitemap
    const sitemapUrl = this.extractSitemapUrl(robotsContent, siteUrl)
    const sitemapContent = sitemapUrl ? await this.fetchPage(sitemapUrl) : ''
    const sitemapExists = sitemapContent.includes('<loc>')
    const sitemapUrlCount = (sitemapContent.match(/<loc>/gi) || []).length

    // Extract actual sitemap URLs for evidence
    const sitemapLocMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/gi) || []
    const extractedSitemapUrls = sitemapLocMatches
      .map(m => m.replace(/<\/?loc>/gi, '').trim())
      .slice(0, 50) // Cap at 50 for display
    evidence.sitemapUrls = extractedSitemapUrls
    if (sitemapUrl) {
      evidence.crawledUrls.push({ url: sitemapUrl, status: sitemapExists ? 'ok' : 'error', type: 'sitemap' })
    }

    checks.push({
      id: 'sitemap', name: 'XML Sitemap',
      status: sitemapExists ? (sitemapUrlCount > 0 ? 'pass' : 'warning') : 'fail',
      score: sitemapExists ? (sitemapUrlCount > 0 ? 10 : 5) : 0, maxScore: 10,
      details: sitemapExists ? `Sitemap with ${sitemapUrlCount} URLs` : 'No XML sitemap found',
      recommendation: !sitemapExists ? 'Create an XML sitemap and reference it in robots.txt' : undefined,
      priority: 'high', effort: 'easy', category: 'crawlability',
      metadata: { sitemapUrl, sitemapUrlCount, sampleUrls: extractedSitemapUrls.slice(0, 10) },
    })

    // HTTPS
    const isHttps = siteUrl.startsWith('https://')
    checks.push({
      id: 'https', name: 'HTTPS Security',
      status: isHttps ? 'pass' : 'fail',
      score: isHttps ? 5 : 0, maxScore: 5,
      details: isHttps ? 'Site uses HTTPS' : 'Site does not use HTTPS',
      recommendation: isHttps ? undefined : 'Migrate to HTTPS for security and trust signals',
      priority: 'critical', effort: 'moderate', category: 'crawlability',
    })

    // Crawl delay
    const hasCrawlDelay = robotsContent.toLowerCase().includes('crawl-delay')
    checks.push({
      id: 'crawl-delay', name: 'No Excessive Crawl Delay',
      status: hasCrawlDelay ? 'warning' : 'pass',
      score: hasCrawlDelay ? 3 : 5, maxScore: 5,
      details: hasCrawlDelay ? 'Crawl-delay directive found' : 'No crawl-delay restrictions',
      recommendation: hasCrawlDelay ? 'Remove or reduce crawl-delay for AI bots' : undefined,
      priority: 'medium', effort: 'trivial', category: 'crawlability',
    })

    // LLM-specific files — llms.txt + llms-full.txt
    // Note: As of 2026, llms.txt is a community proposal (llmstxt.org) by Jeremy Howard.
    // No major AI platform (ChatGPT, Gemini, Claude, Perplexity) has confirmed using it
    // for ranking or retrieval. Google's John Mueller has called it "unnecessary".
    // It may help LLMs parse documentation at inference time, but has zero proven
    // impact on AI search visibility. We check for it as a forward-looking signal
    // but score it low and don't alarm users about its absence.
    const [llmsTxt, llmsFullTxt] = await Promise.all([
      this.fetchPage(new URL('/llms.txt', siteUrl).toString()),
      this.fetchPage(new URL('/llms-full.txt', siteUrl).toString()),
    ])
    const hasLlmsTxt = llmsTxt.length > 20
    const hasLlmsFullTxt = llmsFullTxt.length > 20

    checks.push({
      id: 'llms-txt', name: 'LLM Files (llms.txt)',
      status: hasLlmsTxt ? 'pass' : 'unknown',
      score: hasLlmsTxt ? (hasLlmsFullTxt ? 5 : 3) : 0, maxScore: 5,
      details: hasLlmsTxt
        ? `llms.txt found${hasLlmsFullTxt ? ' + llms-full.txt found' : ''} — forward-looking LLM accessibility signal`
        : 'No llms.txt found — this is an emerging proposal (not yet adopted by major AI platforms)',
      recommendation: !hasLlmsTxt
        ? 'Consider creating /llms.txt with a markdown summary of your brand and key content — an emerging community standard that may help LLMs parse your site in the future'
        : (!hasLlmsFullTxt ? 'Consider adding /llms-full.txt with comprehensive content for deeper LLM context' : undefined),
      priority: 'low', effort: 'easy', category: 'crawlability',
      metadata: { llmsTxtExists: hasLlmsTxt, llmsFullTxtExists: hasLlmsFullTxt },
    })

    return this.buildPillar('crawlability', 'Crawlability', checks, 'Can AI crawlers access and index your site?')
  }

  // ─── Pillar 2: Structured Data ──────────────────────────────────────────

  private async auditStructuredData(siteUrl: string, html: string, evidence: AuditEvidence): Promise<AuditPillar> {
    const checks: AuditCheck[] = []

    // Parse JSON-LD
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    const schemas: any[] = []
    for (const match of jsonLdMatches) {
      const inner = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
      if (inner?.[1]) {
        try { schemas.push(JSON.parse(inner[1].trim())) } catch { /* skip */ }
      }
    }

    checks.push({
      id: 'jsonld-present', name: 'JSON-LD Markup',
      status: schemas.length > 0 ? 'pass' : 'fail',
      score: schemas.length > 0 ? 10 : 0, maxScore: 10,
      details: schemas.length > 0 ? `${schemas.length} JSON-LD block(s) found` : 'No JSON-LD structured data',
      recommendation: schemas.length === 0 ? 'Add JSON-LD structured data to help AI models understand your brand entity' : undefined,
      priority: 'critical', effort: 'moderate', category: 'structured-data',
      metadata: schemas.length > 0 ? { schemas: schemas.map(s => JSON.stringify(s).substring(0, 500)), sourceUrl: siteUrl } : { sourceUrl: siteUrl },
    })

    const types = schemas.flatMap(s => {
      if (Array.isArray(s['@graph'])) return s['@graph'].map((g: any) => g['@type'])
      return [s['@type']]
    }).filter(Boolean).flat()

    evidence.schemaTypesFound = types

    const hasOrg = types.some((t: string) => ['Organization', 'LocalBusiness', 'Corporation'].includes(t))
    checks.push({
      id: 'org-schema', name: 'Organization Schema',
      status: hasOrg ? 'pass' : 'fail',
      score: hasOrg ? 15 : 0, maxScore: 15,
      details: hasOrg ? 'Organization schema found' : 'No Organization schema — AI models cannot reliably identify your brand',
      recommendation: hasOrg ? undefined : 'Add Organization schema with name, url, logo, description, sameAs',
      priority: 'critical', effort: 'easy', category: 'structured-data',
    })

    const hasWebSite = types.some((t: string) => t === 'WebSite')
    checks.push({
      id: 'website-schema', name: 'WebSite Schema',
      status: hasWebSite ? 'pass' : 'warning',
      score: hasWebSite ? 5 : 0, maxScore: 5,
      details: hasWebSite ? 'WebSite schema found' : 'No WebSite schema',
      recommendation: hasWebSite ? undefined : 'Add WebSite schema with SearchAction',
      priority: 'medium', effort: 'easy', category: 'structured-data',
    })

    const hasFAQ = types.some((t: string) => t === 'FAQPage')
    checks.push({
      id: 'faq-schema', name: 'FAQ Schema',
      status: hasFAQ ? 'pass' : 'warning',
      score: hasFAQ ? 10 : 0, maxScore: 10,
      details: hasFAQ ? 'FAQ schema found — high AI answer potential' : 'No FAQ schema — missing direct answer opportunity',
      recommendation: hasFAQ ? undefined : 'Add FAQPage schema to Q&A content for direct AI answers',
      priority: 'high', effort: 'easy', category: 'structured-data',
    })

    const hasBreadcrumb = types.some((t: string) => t === 'BreadcrumbList')
    checks.push({
      id: 'breadcrumb-schema', name: 'Breadcrumb Schema',
      status: hasBreadcrumb ? 'pass' : 'warning',
      score: hasBreadcrumb ? 5 : 0, maxScore: 5,
      details: hasBreadcrumb ? 'BreadcrumbList schema found' : 'No BreadcrumbList',
      recommendation: hasBreadcrumb ? undefined : 'Add BreadcrumbList schema',
      priority: 'low', effort: 'easy', category: 'structured-data',
    })

    const hasMetaDesc = /<meta[^>]*name=["']description["'][^>]*>/i.test(html)
    const hasOG = /<meta[^>]*property=["']og:/i.test(html)
    const metaScore = (hasMetaDesc ? 3 : 0) + (hasOG ? 2 : 0)
    checks.push({
      id: 'meta-tags', name: 'Meta & Open Graph Tags',
      status: metaScore >= 5 ? 'pass' : metaScore >= 3 ? 'warning' : 'fail',
      score: metaScore, maxScore: 5,
      details: `${hasMetaDesc ? '✓' : '✗'} Meta description, ${hasOG ? '✓' : '✗'} Open Graph`,
      recommendation: metaScore < 5 ? 'Add meta description and Open Graph tags' : undefined,
      priority: 'medium', effort: 'trivial', category: 'structured-data',
    })

    return this.buildPillar('structured-data', 'Structured Data', checks, "Can AI models understand your brand's entity and content?")
  }

  // ─── Pillar 3: Content Authority ────────────────────────────────────────
  //
  // Enhanced: Adds on-site content quality assessment via LLM — evaluates
  // structure, depth, E-E-A-T signals, and LLM-readiness (FAQs, definitions,
  // comparison tables) that directly influence whether an LLM chooses to cite.

  private async auditContentAuthority(
    brandId: string,
    ctx: BrandContext,
    exaResults: Array<{ url: string; title: string; text?: string; publishedDate?: string }>,
    siteDomain: string,
    siteUrl: string,
    homepageHtml: string
  ): Promise<AuditPillar> {
    const checks: AuditCheck[] = []

    // AI response presence — count responses that actually mention the brand (name or aliases)
    const brandNameLower = ctx.brandName.toLowerCase()
    const aliasesLower = (ctx.entityAliases || []).map(a => a.toLowerCase()).filter(a => a.length >= 3)
    const domainName = siteDomain.split('.')[0]

    const { data: allResponses } = await this.supabase
      .from('llm_response_files')
      .select('response_preview')
      .eq('brand_id', brandId)
      .eq('success', true)
      .limit(500)

    const mentionedResponses = (allResponses || []).filter((r: any) => {
      const text = (r.response_preview || '').toLowerCase()
      if (text.includes(brandNameLower)) return true
      if (domainName.length >= 4 && text.includes(domainName)) return true
      return aliasesLower.some(alias => text.includes(alias))
    })
    const responseCount = mentionedResponses.length
    const totalResponses = allResponses?.length || 0

    const mentionRate = Math.min(responseCount, 100)
    checks.push({
      id: 'ai-mentions', name: 'AI Response Presence',
      status: mentionRate > 20 ? 'pass' : mentionRate > 5 ? 'warning' : 'fail',
      score: Math.min(Math.round(mentionRate / 5), 15), maxScore: 15,
      details: `Brand mentioned in ${responseCount} of ${totalResponses} tracked AI responses`,
      recommendation: mentionRate <= 5 ? 'Run LLM runs and increase authoritative content' : undefined,
      priority: 'high', effort: 'complex', category: 'content-authority',
    })

    // Third-party web presence — filter out own domain, verify reachability,
    // and use LLM verification to confirm results are about THIS brand
    const domainRoot = siteDomain.replace(/^(www\.)?/, '').split('.').slice(-2).join('.')
    const thirdPartyMentions = exaResults.filter(r => {
      try { return !new URL(r.url).hostname.includes(domainRoot) } catch { return true }
    })

    // LLM-verify mentions to eliminate false positives from similarly-named brands
    const webAssessments = await this.assessContentWithLLM(thirdPartyMentions, ctx, siteDomain)
    const brandVerifiedMentions = thirdPartyMentions.filter((_, i) => {
      const a = webAssessments[i]
      return a?.isAboutBrand && a.mentionType !== 'irrelevant'
    })

    const verifiedMentions: typeof brandVerifiedMentions = []
    const mentionChecks = await Promise.all(
      brandVerifiedMentions.slice(0, 10).map(async (m) => {
        try {
          const res = await fetch(m.url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Soma-AI-Auditor/1.0' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
          })
          return { mention: m, ok: res.ok }
        } catch {
          return { mention: m, ok: false }
        }
      })
    )
    for (const check of mentionChecks) {
      if (check.ok) verifiedMentions.push(check.mention)
    }
    if (brandVerifiedMentions.length > 10) {
      verifiedMentions.push(...brandVerifiedMentions.slice(10))
    }

    const mentionCount = verifiedMentions.length
    const deadLinks = mentionChecks.filter(c => !c.ok).length
    const filteredCount = thirdPartyMentions.length - brandVerifiedMentions.length
    checks.push({
      id: 'web-presence', name: 'Web Presence (Exa)',
      status: mentionCount >= 10 ? 'pass' : mentionCount >= 3 ? 'warning' : 'fail',
      score: Math.min(mentionCount * 2, 10), maxScore: 10,
      details: `${mentionCount} verified third-party page${mentionCount !== 1 ? 's' : ''} mention the brand${deadLinks > 0 ? ` (${deadLinks} dead links excluded)` : ''}${filteredCount > 0 ? ` (${filteredCount} were for other brands)` : ''}`,
      recommendation: mentionCount < 3 ? 'Publish guest posts, press releases, and get featured on industry sites' : undefined,
      priority: 'high', effort: 'complex', category: 'content-authority',
      metadata: { topMentions: verifiedMentions.slice(0, 5).map(m => ({ url: m.url, title: m.title })) },
    })

    // ── On-site Content Quality Assessment (LLM) ─────────────────────
    // Fetch key pages and assess structure, depth, and LLM-friendliness
    const siteAssessment = await this.assessOwnSiteContent(siteUrl, ctx, homepageHtml)

    const structurePts = Math.round(siteAssessment.structureScore * 0.5) // 0–5
    const depthPts = Math.round(siteAssessment.depthScore * 0.5)        // 0–5
    const totalContentQuality = structurePts + depthPts
    checks.push({
      id: 'content-quality', name: 'Content Quality (E-E-A-T)',
      status: totalContentQuality >= 8 ? 'pass' : totalContentQuality >= 4 ? 'warning' : 'fail',
      score: totalContentQuality, maxScore: 10,
      details: siteAssessment.details,
      recommendation: totalContentQuality < 6
        ? 'Improve content depth: add expert analysis, specific data, case studies, and author credentials'
        : undefined,
      priority: 'high', effort: 'moderate', category: 'content-authority',
      metadata: { structure: siteAssessment.structureScore, depth: siteAssessment.depthScore, llmReadiness: siteAssessment.llmReadiness },
    })

    // ── LLM-Readiness: content patterns LLMs prefer to cite ──────────
    const llmReadinessScore = Math.round(siteAssessment.llmReadiness * 0.5) // 0–5
    checks.push({
      id: 'llm-readiness', name: 'LLM-Ready Content Patterns',
      status: llmReadinessScore >= 4 ? 'pass' : llmReadinessScore >= 2 ? 'warning' : 'fail',
      score: llmReadinessScore, maxScore: 5,
      details: `LLM-readiness: ${siteAssessment.llmReadiness}/10 — ${siteAssessment.llmReadiness >= 7 ? 'strong FAQ/how-to/definition content' : siteAssessment.llmReadiness >= 4 ? 'some extractable content' : 'lacks structured answer content'}`,
      recommendation: llmReadinessScore < 3
        ? 'Add FAQ sections, comparison tables, definitions, and how-to guides — these are what LLMs extract and cite'
        : undefined,
      priority: 'high', effort: 'moderate', category: 'content-authority',
    })

    // Multi-model coverage (from DB)
    const { data: platformData } = await this.supabase
      .from('ldi_scores')
      .select('platform')
      .eq('brand_id', brandId)
    const platforms = new Set(platformData?.map((d: any) => d.platform) || [])
    checks.push({
      id: 'multi-model', name: 'Multi-Model Coverage',
      status: platforms.size >= 3 ? 'pass' : platforms.size >= 1 ? 'warning' : 'fail',
      score: Math.min(platforms.size * 3, 10), maxScore: 10,
      details: `Brand tracked across ${platforms.size} AI model${platforms.size !== 1 ? 's' : ''}`,
      recommendation: platforms.size < 3 ? 'Ensure discoverability across ChatGPT, Gemini, Claude, and Perplexity' : undefined,
      priority: 'medium', effort: 'moderate', category: 'content-authority',
    })

    // Content freshness — recent mentions
    const recentMentions = verifiedMentions.filter(m => {
      if (!m.publishedDate) return false
      const d = new Date(m.publishedDate)
      return !isNaN(d.getTime()) && d > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    })
    checks.push({
      id: 'content-freshness', name: 'Content Freshness',
      status: recentMentions.length >= 3 ? 'pass' : recentMentions.length > 0 ? 'warning' : 'fail',
      score: Math.min(recentMentions.length * 3, 10), maxScore: 10,
      details: `${recentMentions.length} mention${recentMentions.length !== 1 ? 's' : ''} in last 90 days`,
      recommendation: recentMentions.length === 0 ? 'Regularly publish and promote content to signal freshness to LLMs' : undefined,
      priority: 'medium', effort: 'moderate', category: 'content-authority',
    })

    return this.buildPillar('content-authority', 'Content Authority', checks, 'Does your content signal expertise and authority to AI models?')
  }

  // ─── Pillar 4: Source Footprint ─────────────────────────────────────────
  //
  // Enhanced: Assess quality of third-party mentions, not just count them.
  // Uses LLM to evaluate whether mentions are substantive recommendations
  // (which LLMs will cite) vs. passing directory listings (which they won't).

  private async auditSourceFootprint(
    brandId: string,
    ctx: BrandContext,
    exaResults: Array<{ url: string; title: string; text?: string }>,
    siteDomain: string,
    ownedDomains?: Set<string>,
  ): Promise<AuditPillar> {
    const checks: AuditCheck[] = []

    // Citation data from aeo_citations table
    let citationCount = 0
    let uniqueDBDomains = new Set<string>()
    let ownedSources = 0
    let earnedSources = 0
    let highAuth = 0

    try {
      const { data: citations, count: totalCitations } = await this.supabase
        .from('aeo_citations')
        .select('domain, source_type, domain_authority', { count: 'exact' })
        .eq('benefits_brand_id', brandId)
        .limit(500)

      citationCount = totalCitations || 0
      uniqueDBDomains = new Set(citations?.map((c: any) => c.domain) || [])
      ownedSources = citations?.filter((c: any) => c.source_type === 'owned').length || 0
      earnedSources = citations?.filter((c: any) => c.source_type === 'earned').length || 0
      highAuth = citations?.filter((c: any) => (c.domain_authority || 0) >= 60).length || 0
    } catch {
      // Table may not exist — continue with Exa data only
    }

    // Filter Exa results to third-party only (exclude ALL owned domains)
    const thirdPartyExa = exaResults.filter(r => {
      try {
        const host = new URL(r.url).hostname.replace(/^www\./, '')
        if (ownedDomains) {
          return !isOwnedDomain(host, ownedDomains)
        }
        // Fallback: simple domain root check
        const domainRoot = siteDomain.replace(/^(www\.)?/, '').split('.').slice(-2).join('.')
        return !host.includes(domainRoot)
      } catch { return true }
    })

    // LLM assess quality of third-party Exa mentions
    const mentionAssessments = await this.assessContentWithLLM(thirdPartyExa, ctx, siteDomain)

    const substantiveMentions = mentionAssessments.filter(a => a.isAboutBrand && a.mentionType === 'substantive')
    const passingMentions = mentionAssessments.filter(a => a.isAboutBrand && a.mentionType === 'passing')
    const verifiedMentions = mentionAssessments.filter(a => a.isAboutBrand && a.mentionType !== 'irrelevant')

    const exaDomains = new Set(
      thirdPartyExa
        .filter((_, i) => mentionAssessments[i]?.isAboutBrand)
        .map(r => { try { return new URL(r.url).hostname } catch { return '' } })
        .filter(Boolean)
    )
    const allUniqueDomains = new Set([...uniqueDBDomains, ...exaDomains])

    // Average mention quality
    const avgMentionQuality = verifiedMentions.length > 0
      ? verifiedMentions.reduce((s, a) => s + a.qualityScore, 0) / verifiedMentions.length
      : 0

    // 4.1 Mention quality — weighted: substantive mentions count more
    const qualityWeightedCount = substantiveMentions.length * 3 + passingMentions.length
    checks.push({
      id: 'mention-quality', name: 'Mention Quality',
      status: substantiveMentions.length >= 3 ? 'pass' : substantiveMentions.length > 0 ? 'warning' : 'fail',
      score: Math.min(Math.round(qualityWeightedCount * 1.5 + avgMentionQuality), 15), maxScore: 15,
      details: substantiveMentions.length > 0
        ? `${substantiveMentions.length} substantive mention${substantiveMentions.length !== 1 ? 's' : ''}, ${passingMentions.length} passing (avg quality ${avgMentionQuality.toFixed(1)}/10)`
        : `${passingMentions.length} passing mention${passingMentions.length !== 1 ? 's' : ''} — no substantive coverage found`,
      recommendation: substantiveMentions.length === 0
        ? 'Get featured in in-depth articles, reviews, and comparison guides — substantive mentions are what LLMs cite'
        : undefined,
      priority: 'critical', effort: 'complex', category: 'source-footprint',
      metadata: {
        topMentions: thirdPartyExa.slice(0, 5).map((r, i) => ({
          url: r.url, title: r.title,
          type: mentionAssessments[i]?.mentionType,
          quality: mentionAssessments[i]?.qualityScore,
          sentiment: mentionAssessments[i]?.sentiment,
        })),
      },
    })

    // 4.2 Source diversity
    checks.push({
      id: 'source-diversity', name: 'Source Diversity',
      status: allUniqueDomains.size > 15 ? 'pass' : allUniqueDomains.size > 5 ? 'warning' : 'fail',
      score: Math.min(Math.round(allUniqueDomains.size / 3), 10), maxScore: 10,
      details: `Brand referenced from ${allUniqueDomains.size} unique domain${allUniqueDomains.size !== 1 ? 's' : ''}`,
      recommendation: allUniqueDomains.size <= 5
        ? 'Diversify presence across editorial, UGC, and review platforms'
        : undefined,
      priority: 'high', effort: 'moderate', category: 'source-footprint',
    })

    // 4.3 Earned media (from DB when available, supplemented by Exa assessment)
    // Only count Exa mentions as earned if they are substantive third-party coverage
    const exaSubstantiveEarned = substantiveMentions.length
    const totalSources = citationCount + verifiedMentions.length
    const totalEarned = earnedSources + exaSubstantiveEarned
    const earnedRatio = totalSources > 0 ? Math.min(totalEarned / totalSources, 1) : 0
    checks.push({
      id: 'earned-media', name: 'Earned Media Signal',
      status: earnedRatio > 0.3 ? 'pass' : earnedRatio > 0.1 ? 'warning' : 'fail',
      score: Math.min(Math.round(earnedRatio * 15), 15), maxScore: 15,
      details: totalSources > 0
        ? `${Math.round(earnedRatio * 100)}% earned media (${totalEarned} earned of ${totalSources} total sources)`
        : 'No source data available — run LLM runs to build citation data',
      recommendation: earnedRatio <= 0.1
        ? 'Build earned media through PR, guest posts, and industry publications — LLMs trust third-party sources over owned content'
        : undefined,
      priority: 'high', effort: 'complex', category: 'source-footprint',
    })

    // 4.4 High-authority presence — check Exa results for authoritative domains
    const authorityDomains = new Set([
      'techcrunch.com', 'forbes.com', 'bloomberg.com', 'reuters.com', 'wired.com',
      'theverge.com', 'arstechnica.com', 'venturebeat.com', 'thenextweb.com',
      'inc.com', 'entrepreneur.com', 'fastcompany.com', 'businessinsider.com',
      'nytimes.com', 'wsj.com', 'bbc.com', 'theguardian.com',
      ...KNOWLEDGE_DOMAINS,
    ])
    const exaAuthDomains = thirdPartyExa
      .filter((_, i) => mentionAssessments[i]?.isAboutBrand)
      .map(r => { try { return new URL(r.url).hostname.replace('www.', '') } catch { return '' } })
      .filter(d => authorityDomains.has(d))
    const totalHighAuth = highAuth + new Set(exaAuthDomains).size
    checks.push({
      id: 'high-authority', name: 'High-Authority Sources',
      status: totalHighAuth >= 3 ? 'pass' : totalHighAuth > 0 ? 'warning' : 'fail',
      score: Math.min(totalHighAuth * 3, 10), maxScore: 10,
      details: totalHighAuth > 0
        ? `${totalHighAuth} high-authority source${totalHighAuth !== 1 ? 's' : ''} reference the brand`
        : 'No presence on high-authority editorial or knowledge domains',
      recommendation: totalHighAuth === 0
        ? 'Get featured on major publications and industry outlets — LLMs heavily weight authoritative sources'
        : undefined,
      priority: 'high', effort: 'complex', category: 'source-footprint',
      metadata: { authorityDomains: [...new Set(exaAuthDomains)] },
    })

    return this.buildPillar('source-footprint', 'Source Footprint', checks, 'Are third-party sources substantively citing your brand?')
  }

  // ─── Pillar 5: Knowledge Graph ──────────────────────────────────────────

  private async auditKnowledgeGraph(
    brandId: string, siteUrl: string, html: string, ctx: BrandContext,
    serpResult: { organic: any[]; knowledgeGraph?: { title?: string; description?: string; type?: string }; totalResults: number },
    evidence: AuditEvidence,
    siteDomain: string
  ): Promise<AuditPillar> {
    const checks: AuditCheck[] = []

    // Google Knowledge Panel (from SerpAPI)
    const hasKnowledgePanel = !!serpResult.knowledgeGraph?.title
    checks.push({
      id: 'knowledge-panel', name: 'Google Knowledge Panel',
      status: hasKnowledgePanel ? 'pass' : 'warning',
      score: hasKnowledgePanel ? 15 : 0, maxScore: 15,
      details: hasKnowledgePanel
        ? `Knowledge panel found: "${serpResult.knowledgeGraph!.title}" (${serpResult.knowledgeGraph!.type || 'entity'})`
        : 'No Google Knowledge Panel detected',
      recommendation: !hasKnowledgePanel ? 'Build entity signals through Wikipedia, structured data, and consistent NAP across the web' : undefined,
      priority: 'high', effort: 'complex', category: 'knowledge-graph',
      metadata: hasKnowledgePanel ? { knowledgeGraph: serpResult.knowledgeGraph } : undefined,
    })

    // Wikipedia presence — search with full brand name; add domain for tech brands for precision
    const kgIndustry = classifyIndustry(ctx)
    const wikiQuery = kgIndustry === 'tech'
      ? `"${ctx.brandName}" ${siteDomain}`
      : `"${ctx.brandName}" ${ctx.industry || ''}`
    const wikiResults = await exaSearch(wikiQuery.trim(), { numResults: 5, includeDomains: ['wikipedia.org'] })
    // Validate wiki results: isRelevantResult + LLM verification to prevent
    // false matches (e.g. "Ai Soma" Japanese city for brand "Soma AI")
    const relevantWikiPre = wikiResults.filter(r => isRelevantResult(r, ctx, siteDomain))
    const wikiAssessments = await this.assessContentWithLLM(relevantWikiPre, ctx, siteDomain)
    const relevantWiki = relevantWikiPre.filter((_, i) => {
      const a = wikiAssessments[i]
      return a?.isAboutBrand && a.mentionType !== 'irrelevant'
    })
    const hasWikipedia = relevantWiki.length > 0
    evidence.wikiPages = relevantWiki.map(r => ({ url: r.url, title: r.title }))
    checks.push({
      id: 'wikipedia', name: 'Wikipedia Presence',
      status: hasWikipedia ? 'pass' : 'warning',
      score: hasWikipedia ? 10 : 0, maxScore: 10,
      details: hasWikipedia ? `Wikipedia article found: ${relevantWiki[0]?.title || 'Linked page'}` : 'No Wikipedia article found',
      recommendation: !hasWikipedia ? 'Build notability for a Wikipedia article — strongest entity signal for LLMs' : undefined,
      priority: 'high', effort: 'complex', category: 'knowledge-graph',
      metadata: hasWikipedia ? { url: relevantWiki[0]?.url } : undefined,
    })

    // SerpAPI — Google search presence & ranking
    const ownDomain = new URL(siteUrl).hostname
    const ownResults = serpResult.organic.filter(r => { try { return new URL(r.link).hostname.includes(ownDomain) } catch { return false } })
    const firstPosition = ownResults[0]?.position || 0
    checks.push({
      id: 'google-ranking', name: 'Google Brand Search Ranking',
      status: firstPosition === 1 ? 'pass' : firstPosition <= 3 ? 'warning' : 'fail',
      score: firstPosition === 1 ? 10 : firstPosition <= 3 ? 7 : firstPosition <= 10 ? 3 : 0, maxScore: 10,
      details: firstPosition > 0 ? `Your site ranks #${firstPosition} for "${ctx.brandName}"` : 'Your site does not rank in the top 10 for your brand name',
      recommendation: firstPosition > 3 ? 'Improve branded search optimization — your own site should rank #1 for your brand name' : undefined,
      priority: firstPosition === 0 ? 'critical' : 'medium', effort: 'moderate', category: 'knowledge-graph',
      metadata: { firstPosition, totalResults: serpResult.totalResults, topResults: serpResult.organic.slice(0, 5).map(r => ({ url: r.link, title: r.title, position: r.position })) },
    })

    // sameAs entity linking
    const hasSameAs = html.includes('"sameAs"') || html.includes("'sameAs'")
    checks.push({
      id: 'sameas-linking', name: 'Entity Linking (sameAs)',
      status: hasSameAs ? 'pass' : 'fail',
      score: hasSameAs ? 15 : 0, maxScore: 15,
      details: hasSameAs ? 'sameAs property found — linking brand to external profiles' : 'No sameAs found — AI models cannot connect your entity across platforms',
      recommendation: !hasSameAs ? 'Add sameAs to Organization schema with links to your official social profiles, Wikipedia, and industry directories' : undefined,
      priority: 'critical', effort: 'easy', category: 'knowledge-graph',
    })

    return this.buildPillar('knowledge-graph', 'Knowledge Graph', checks, 'Does your brand exist as a recognized entity in knowledge bases?')
  }

  // ─── Pillar 6: Social Proof ─────────────────────────────────────────────
  //
  // Rewritten to use LLM content assessment: every Reddit/forum/review result
  // is verified by an LLM to confirm it's actually about THIS brand (not a
  // similarly-named entity). Quality and sentiment are scored, and only
  // substantive, verified mentions contribute to the score.

  private async auditSocialProof(
    brandId: string,
    ctx: BrandContext,
    exaResults: Array<{ url: string; title: string; text?: string }>,
    evidence: AuditEvidence,
    siteDomain: string
  ): Promise<AuditPillar> {
    const checks: AuditCheck[] = []
    const platforms = getBrandPlatforms(ctx)
    const { industryCategory, region } = platforms

    // ── 6.1  Reddit & Forum Discussions ───────────────────────────────
    // For consumer brands, people discuss the brand name without referencing the domain.
    // Use domain only for tech/SaaS brands where it adds precision.
    // Search across all major discussion platforms LLMs crawl for citations.
    const forumDomains = [
      'reddit.com', 'quora.com',
      // Tech forums
      ...(industryCategory === 'tech' ? ['stackoverflow.com', 'news.ycombinator.com', 'dev.to', 'hashnode.dev', 'discord.com'] : []),
      // Industry-specific forums
      ...(industryCategory === 'travel' ? ['tripadvisor.com', 'lonelyplanet.com'] : []),
      ...(industryCategory === 'health' ? ['healthunlocked.com', 'patient.info'] : []),
      ...(industryCategory === 'finance' ? ['bogleheads.org', 'wallstreetoasis.com'] : []),
      ...(industryCategory === 'media' ? ['resetera.com', 'neogaf.com'] : []),
    ]
    const forumQuery = industryCategory === 'tech'
      ? `"${ctx.brandName}" ${siteDomain}`
      : `"${ctx.brandName}"`
    const redditResultsRaw = await exaSearch(forumQuery, {
      numResults: 15,
      includeDomains: forumDomains,
    })
    // First pass: lightweight string filter
    const redditPrefiltered = redditResultsRaw.filter(r => isRelevantResult(r, ctx, siteDomain))

    // Second pass: LLM verification — confirm content is about THIS brand
    const forumAssessments = await this.assessContentWithLLM(redditPrefiltered, ctx, siteDomain)

    const verifiedForumResults = redditPrefiltered.filter((_, i) => {
      const a = forumAssessments[i]
      return a?.isAboutBrand && a.mentionType !== 'irrelevant'
    })
    const substantiveForums = forumAssessments.filter(a => a.isAboutBrand && a.mentionType === 'substantive').length
    const redditCount = verifiedForumResults.filter(r => r.url.includes('reddit.com')).length
    const forumCount = verifiedForumResults.filter(r => !r.url.includes('reddit.com')).length
    const totalVerified = redditCount + forumCount

    // Average quality of verified results
    const verifiedAssessments = forumAssessments.filter(a => a.isAboutBrand && a.mentionType !== 'irrelevant')
    const avgForumQuality = verifiedAssessments.length > 0
      ? verifiedAssessments.reduce((s, a) => s + a.qualityScore, 0) / verifiedAssessments.length
      : 0

    evidence.redditThreads = verifiedForumResults.map(r => ({ url: r.url, title: r.title }))

    // Score: base points for verified presence + bonus for substantive, high-quality discussions
    const forumBaseScore = Math.min(totalVerified * 2, 8)
    const qualityBonus = substantiveForums > 0 ? Math.min(Math.round(avgForumQuality * 0.7), 7) : 0
    const forumScore = Math.min(forumBaseScore + qualityBonus, 15)

    const filtered = redditPrefiltered.length - verifiedForumResults.length
    checks.push({
      id: 'reddit-forums', name: 'Reddit & Forum Discussions',
      status: totalVerified >= 3 ? 'pass' : totalVerified > 0 ? 'warning' : 'fail',
      score: forumScore, maxScore: 15,
      details: totalVerified > 0
        ? `${totalVerified} verified discussion${totalVerified !== 1 ? 's' : ''} (${substantiveForums} substantive, avg quality ${avgForumQuality.toFixed(1)}/10)${filtered > 0 ? ` — ${filtered} irrelevant result${filtered !== 1 ? 's' : ''} filtered out` : ''}`
        : `No verified discussions found${filtered > 0 ? ` (${filtered} result${filtered !== 1 ? 's' : ''} were about other entities)` : ''}`,
      recommendation: totalVerified === 0
        ? `Participate in relevant subreddits and Quora topics about ${ctx.industry || 'your industry'} — LLMs heavily cite community discussions`
        : (substantiveForums === 0 ? 'Encourage in-depth community discussions — substantive threads are cited more by LLMs' : undefined),
      priority: 'high', effort: 'moderate', category: 'social-proof',
      metadata: {
        topThreads: verifiedForumResults.slice(0, 5).map((r) => {
          // Find the original index from pre-filtered array to get correct assessment
          const origIdx = redditPrefiltered.indexOf(r)
          const assessment = origIdx >= 0 ? forumAssessments[origIdx] : undefined
          return {
            url: r.url, title: r.title,
            quality: assessment?.qualityScore,
            sentiment: assessment?.sentiment,
            type: assessment?.mentionType,
          }
        }),
        filteredCount: filtered,
      },
    })

    // ── 6.2  Review Site Presence ─────────────────────────────────────
    const reviewDomains = platforms.reviewDomains
    const reviewQuery = industryCategory === 'tech'
      ? `"${ctx.brandName}" ${siteDomain} review`
      : `"${ctx.brandName}" review`
    const reviewResultsRaw = await exaSearch(reviewQuery, {
      numResults: 10,
      includeDomains: reviewDomains,
    })
    const reviewPrefiltered = reviewResultsRaw.filter(r => isRelevantResult(r, ctx, siteDomain))

    // LLM verification for reviews — critical for common names
    const reviewAssessments = await this.assessContentWithLLM(reviewPrefiltered, ctx, siteDomain)
    const verifiedReviews = reviewPrefiltered.filter((_, i) => {
      const a = reviewAssessments[i]
      return a?.isAboutBrand && a.mentionType !== 'irrelevant'
    })

    const reviewFiltered = reviewPrefiltered.length - verifiedReviews.length
    evidence.reviewListings = verifiedReviews.map(r => ({
      url: r.url,
      title: r.title,
      platform: (() => { try { return new URL(r.url).hostname.replace('www.', '') } catch { return '' } })(),
    }))

    const avgReviewQuality = (() => {
      const relevant = reviewAssessments.filter(a => a.isAboutBrand && a.mentionType !== 'irrelevant')
      return relevant.length > 0 ? relevant.reduce((s, a) => s + a.qualityScore, 0) / relevant.length : 0
    })()

    const reviewScore = Math.min(verifiedReviews.length * 3 + Math.round(avgReviewQuality * 0.5), 15)
    checks.push({
      id: 'review-sites', name: 'Review Site Presence',
      status: verifiedReviews.length >= 3 ? 'pass' : verifiedReviews.length > 0 ? 'warning' : 'fail',
      score: reviewScore, maxScore: 15,
      details: verifiedReviews.length > 0
        ? `${verifiedReviews.length} verified listing${verifiedReviews.length !== 1 ? 's' : ''} (quality ${avgReviewQuality.toFixed(1)}/10)${reviewFiltered > 0 ? ` — ${reviewFiltered} irrelevant filtered` : ''}`
        : `No verified review listings${reviewFiltered > 0 ? ` (${reviewFiltered} were for other brands)` : ''}`,
      recommendation: verifiedReviews.length === 0
        ? REVIEW_RECS_BY_INDUSTRY[industryCategory]
        : undefined,
      priority: 'high', effort: 'moderate', category: 'social-proof',
      metadata: {
        reviews: verifiedReviews.map((r) => {
          const origIdx = reviewPrefiltered.indexOf(r)
          const assessment = origIdx >= 0 ? reviewAssessments[origIdx] : undefined
          return {
            url: r.url, title: r.title,
            quality: assessment?.qualityScore,
            sentiment: assessment?.sentiment,
          }
        }),
        filteredCount: reviewFiltered,
      },
    })

    // ── 6.3  Community & Industry Platforms ──────────────────────────
    const communityDomains = platforms.communityDomains
    const communityMentions = exaResults.filter(r => communityDomains.some(d => r.url.includes(d)))
    checks.push({
      id: 'community-platforms', name: 'Community Platform Presence',
      status: communityMentions.length > 0 ? 'pass' : 'warning',
      score: communityMentions.length > 0 ? 10 : 0, maxScore: 10,
      details: communityMentions.length > 0
        ? `Found on ${communityMentions.length} community platform${communityMentions.length !== 1 ? 's' : ''}`
        : 'Not found on community platforms',
      recommendation: communityMentions.length === 0
        ? COMMUNITY_RECS_BY_INDUSTRY[industryCategory]
        : undefined,
      priority: 'medium', effort: 'moderate', category: 'social-proof',
    })

    // ── 6.4  Social Media Citations ───────────────────────────────────
    const socialDomains = platforms.socialDomains
    const socialMentions = exaResults.filter(r => socialDomains.some(d => r.url.includes(d)))
    checks.push({
      id: 'social-signals', name: 'Social Media Citations',
      status: socialMentions.length >= 3 ? 'pass' : socialMentions.length > 0 ? 'warning' : 'fail',
      score: Math.min(socialMentions.length * 3, 10), maxScore: 10,
      details: `${socialMentions.length} social mention${socialMentions.length !== 1 ? 's' : ''}`,
      recommendation: socialMentions.length === 0
        ? 'Maintain active social profiles — AI models use social proof for verification'
        : undefined,
      priority: 'medium', effort: 'easy', category: 'social-proof',
    })

    return this.buildPillar('social-proof', 'Social Proof', checks, 'Do real users discuss and recommend your brand?')
  }

  // ─── Pillar 7: Brand Consistency ────────────────────────────────────────

  private async auditBrandConsistency(
    brandId: string, siteUrl: string, html: string, ctx: BrandContext, evidence: AuditEvidence
  ): Promise<AuditPillar> {
    const checks: AuditCheck[] = []

    // ── About page detection ──────────────────────────────────────────
    // 1. Check common about page paths
    // 2. Scan homepage HTML for navigation links to about pages
    // 3. Fall back to GET if HEAD is rejected
    let hasAboutPage = false
    let aboutPageUrl = ''
    const aboutPaths = ['/about', '/about-us', '/company', '/our-story', '/who-we-are', '/team']
    const checkedUrls: string[] = []

    for (const path of aboutPaths) {
      const testUrl = new URL(path, siteUrl).toString()
      checkedUrls.push(testUrl)
      try {
        // Try HEAD first, fall back to GET (many servers/CDNs block HEAD)
        let res = await fetch(testUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Soma-AI-Auditor/1.0)' },
          signal: AbortSignal.timeout(5000),
          redirect: 'follow',
        })
        if (!res.ok && res.status === 405) {
          res = await fetch(testUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Soma-AI-Auditor/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
          })
        }
        if (res.ok) { hasAboutPage = true; aboutPageUrl = testUrl; break }
        evidence.crawledUrls.push({ url: testUrl, status: 'error', type: 'about-page' })
      } catch {
        evidence.crawledUrls.push({ url: testUrl, status: 'error', type: 'about-page' })
      }
    }

    // If path checks failed, scan homepage HTML for about-page links in navigation
    if (!hasAboutPage) {
      const aboutLinkRegex = /href=["']([^"']*\b(?:about|our-story|who-we-are|company|team)\b[^"']*)/gi
      let linkMatch
      while ((linkMatch = aboutLinkRegex.exec(html)) !== null) {
        const href = linkMatch[1]
        try {
          const resolved = new URL(href, siteUrl).toString()
          // Only count links on the same domain
          if (new URL(resolved).hostname === new URL(siteUrl).hostname) {
            const res = await fetch(resolved, {
              method: 'HEAD',
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Soma-AI-Auditor/1.0)' },
              signal: AbortSignal.timeout(5000),
              redirect: 'follow',
            })
            if (res.ok) { hasAboutPage = true; aboutPageUrl = resolved; break }
          }
        } catch { /* skip broken links */ }
      }
    }

    if (hasAboutPage) {
      evidence.crawledUrls.push({ url: aboutPageUrl, status: 'ok', type: 'about-page' })
    }

    checks.push({
      id: 'about-page', name: 'About Page Exists',
      status: hasAboutPage ? 'pass' : 'fail',
      score: hasAboutPage ? 10 : 0, maxScore: 10,
      details: hasAboutPage ? `About page found at ${aboutPageUrl}` : 'No about page found — checked common paths and homepage navigation links',
      recommendation: !hasAboutPage ? 'Create a detailed /about page with brand story, team, mission, and founding date' : undefined,
      priority: 'critical', effort: 'easy', category: 'brand-consistency',
      metadata: { checkedPaths: checkedUrls, foundAt: aboutPageUrl || null },
    })

    // ── Contact information ───────────────────────────────────────────
    const hasContact = html.includes('mailto:') || html.includes('tel:') || /<a[^>]*href=["'][^"']*contact/i.test(html)
    checks.push({
      id: 'contact-info', name: 'Contact Information',
      status: hasContact ? 'pass' : 'warning',
      score: hasContact ? 5 : 0, maxScore: 5,
      details: hasContact ? 'Contact info found' : 'No visible contact info on homepage',
      recommendation: !hasContact ? 'Add visible contact information for legitimacy' : undefined,
      priority: 'medium', effort: 'trivial', category: 'brand-consistency',
    })

    // ── Brand naming consistency ──────────────────────────────────────
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const pageTitle = titleMatch?.[1] || ''
    const nameInTitle = ctx.brandName ? pageTitle.toLowerCase().includes(ctx.brandName.toLowerCase()) : false
    const nameInContent = ctx.brandName ? html.toLowerCase().includes(ctx.brandName.toLowerCase()) : false
    checks.push({
      id: 'brand-naming', name: 'Consistent Brand Naming',
      status: nameInTitle && nameInContent ? 'pass' : nameInContent ? 'warning' : 'fail',
      score: (nameInTitle ? 5 : 0) + (nameInContent ? 5 : 0), maxScore: 10,
      details: nameInTitle ? 'Brand name in page title and content' : 'Brand name not in homepage title tag',
      recommendation: !nameInTitle ? 'Include your exact brand name in the title tag for entity recognition' : undefined,
      priority: 'high', effort: 'trivial', category: 'brand-consistency',
    })

    // ── Social profile linking ────────────────────────────────────────
    // Extract actual profile links (not tweets/hashtags/posts)
    const socialUrlRegex = /href=["'](https?:\/\/(?:www\.)?(?:linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|github\.com|tiktok\.com)[^"']*)/gi
    const foundSocialUrls: Array<{ url: string; platform: string }> = []
    let socialMatch
    while ((socialMatch = socialUrlRegex.exec(html)) !== null) {
      const url = socialMatch[1]
      if (/\/(status|hashtag|watch\?v=|post|comments|tweet)\b/i.test(url)) continue
      const platform = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return '' } })()
      if (platform && !foundSocialUrls.some(s => s.url === url)) {
        foundSocialUrls.push({ url, platform })
      }
    }
    evidence.socialProfiles = foundSocialUrls

    // Count unique platforms with actual profile links (not raw domain mentions)
    const uniquePlatforms = new Set(foundSocialUrls.map(s => s.platform.replace('twitter.com', 'x.com')))
    const profileCount = uniquePlatforms.size

    checks.push({
      id: 'social-linking', name: 'Social Profile Linking',
      status: profileCount >= 3 ? 'pass' : profileCount > 0 ? 'warning' : 'fail',
      score: Math.min(profileCount * 3, 10), maxScore: 10,
      details: `${profileCount} social profile${profileCount !== 1 ? 's' : ''} linked from website`,
      recommendation: profileCount < 3 ? 'Link to all official social profiles from your footer and Organization schema' : undefined,
      priority: 'medium', effort: 'trivial', category: 'brand-consistency',
      metadata: { linkedProfiles: Array.from(uniquePlatforms), socialUrls: foundSocialUrls },
    })

    // ── Industry/Category clarity ─────────────────────────────────────
    // Use brand context fields and check for meaningful industry terms (min 3 chars)
    const industryTerms = [ctx.industry, ctx.products, ctx.valueProposition, ctx.description]
      .filter(Boolean).join(' ').toLowerCase()
    // Extract unique meaningful terms (3+ chars, skip common stopwords)
    const stopwords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'our', 'are', 'was', 'been', 'have', 'has', 'will', 'can', 'more', 'most', 'than', 'into', 'also', 'their', 'about', 'them', 'they', 'which', 'would', 'could', 'should', 'each', 'other', 'some'])
    const industryWords = [...new Set(
      industryTerms.split(/[\s,;/|]+/).filter(w => w.length >= 3 && !stopwords.has(w))
    )].slice(0, 10)
    const htmlLow = html.toLowerCase()
    const matchedWords = industryWords.filter(w => htmlLow.includes(w))
    const industryScore = industryWords.length > 0 ? matchedWords.length / industryWords.length : 0
    checks.push({
      id: 'industry-clarity', name: 'Industry/Category Clarity',
      status: industryScore > 0.4 ? 'pass' : industryScore > 0 ? 'warning' : 'fail',
      score: Math.round(industryScore * 10), maxScore: 10,
      details: industryScore > 0 ? `${matchedWords.length}/${industryWords.length} industry terms found on homepage` : 'Industry terms not found on homepage',
      recommendation: industryScore <= 0.4 ? 'Clearly state your industry and services on homepage — LLMs use this for topic classification' : undefined,
      priority: 'medium', effort: 'trivial', category: 'brand-consistency',
      metadata: { matched: matchedWords, checked: industryWords },
    })

    return this.buildPillar('brand-consistency', 'Brand Identity', checks, 'Is your brand identity clear and consistent for AI entity recognition?')
  }

  // ─── Utility Methods ────────────────────────────────────────────────────

  private buildPillar(id: string, name: string, checks: AuditCheck[], description: string): AuditPillar {
    const totalScore = checks.reduce((s, c) => s + c.score, 0)
    const totalMax = checks.reduce((s, c) => s + c.maxScore, 0)
    return {
      id, name, score: totalScore, maxScore: totalMax,
      status: totalScore >= totalMax * 0.8 ? 'pass' : totalScore >= totalMax * 0.5 ? 'warning' : 'fail',
      checks, description,
    }
  }

  private parseRobotsTxt(content: string) {
    if (!content || content.length < 10) return AI_CRAWLERS.map(c => ({ crawler: c.name, company: c.company, status: 'allowed' as const }))

    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    const rules: Array<{ userAgent: string; type: string; path: string }> = []
    let currentUserAgent = '*'

    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        currentUserAgent = line.substring(11).trim()
      } else if (line.toLowerCase().startsWith('disallow:')) {
        rules.push({ userAgent: currentUserAgent, type: 'disallow', path: line.substring(9).trim() })
      } else if (line.toLowerCase().startsWith('allow:')) {
        rules.push({ userAgent: currentUserAgent, type: 'allow', path: line.substring(6).trim() })
      }
    }

    return AI_CRAWLERS.map(crawler => {
      const relevant = rules.filter(r =>
        r.userAgent === crawler.userAgent || r.userAgent === '*' || r.userAgent.toLowerCase() === crawler.userAgent.toLowerCase()
      )
      const blocked = relevant.some(r => r.type === 'disallow' && (r.path === '/' || r.path === ''))
      const allowed = !blocked || relevant.some(r => r.type === 'allow')
      return { crawler: crawler.name, company: crawler.company, status: (blocked && !allowed ? 'blocked' : 'allowed') as 'allowed' | 'blocked' }
    })
  }

  private extractSitemapUrl(robotsContent: string, siteUrl: string): string | null {
    const match = robotsContent.match(/sitemap:\s*(.+)/i)
    if (match?.[1]) return match[1].trim()
    return new URL('/sitemap.xml', siteUrl).toString()
  }

  private scoreToGrade(s: number): string {
    if (s >= 90) return 'A+'
    if (s >= 80) return 'A'
    if (s >= 70) return 'B+'
    if (s >= 60) return 'B'
    if (s >= 50) return 'C+'
    if (s >= 40) return 'C'
    if (s >= 30) return 'D'
    return 'F'
  }

  // ─── LLM Content Assessment ──────────────────────────────────────────
  //
  // Uses a cheap, fast LLM (Gemini Flash) to verify whether content found via
  // Exa/SERP is actually about THIS brand — critical for brands with common
  // names (e.g., "NALA" matches fintech, cats, dogs, baby products).
  //
  // Also assesses content quality: depth, structure, authority signals, and
  // sentiment — the same factors LLMs weigh when choosing sources to cite.

  private async assessContentWithLLM(
    items: Array<{ url: string; title: string; text?: string }>,
    ctx: BrandContext,
    siteDomain: string,
  ): Promise<ContentAssessment[]> {
    if (items.length === 0) return []

    // For common/short brand names, default to conservative (not about brand)
    // For longer names, default to optimistic (likely about brand)
    const isCommonName = isBrandNameCommon(ctx.brandName, siteDomain)

    if (!OPENROUTER_API_KEY) {
      return items.map((item, i) => this.heuristicAssessment(item, i, ctx, siteDomain, isCommonName))
    }

    const BATCH_SIZE = 8
    const allResults: ContentAssessment[] = []
    let apiAvailable = true  // Track if API is working for this run

    const aliasStr = (ctx.entityAliases || []).filter(a => a.length >= 2).join(', ')

    for (let batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
      const batch = items.slice(batchStart, batchStart + BATCH_SIZE)

      // If API already failed (402, 429, etc.), skip and use heuristics for remaining batches
      if (!apiAvailable) {
        for (let i = 0; i < batch.length; i++) {
          allResults.push(this.heuristicAssessment(batch[i], batchStart + i, ctx, siteDomain, isCommonName))
        }
        continue
      }

      const itemLines = batch.map((item, i) => {
        const excerpt = (item.text || '').substring(0, 400).replace(/\n/g, ' ')
        return `[${i}] URL: ${item.url}\nTitle: ${item.title}\nExcerpt: ${excerpt}`
      }).join('\n\n')

      const prompt = `You are verifying whether web content is about a specific brand and assessing content quality.

BRAND:
- Name: ${ctx.brandName}
- Industry: ${ctx.industry || 'unknown'}
- Description: ${(ctx.description || '').substring(0, 200)}
- Products: ${(ctx.products || '').substring(0, 150)}
- Website domain: ${siteDomain}
${aliasStr ? `- Also known as: ${aliasStr}` : ''}

IMPORTANT: The brand name "${ctx.brandName}" may also be a common word, pet name, personal name, or used by unrelated companies. Only mark content as "about this brand" if it clearly refers to THIS specific company/product in the ${ctx.industry || 'technology'} industry, or links to ${siteDomain}.

For each item, assess:
1. isAboutBrand: Is this content actually about THIS brand (not a different entity)?
2. mentionType: "substantive" (detailed review/analysis/recommendation), "passing" (brief mention in a list or tangential context), or "irrelevant" (not about this brand at all)
3. qualityScore: 1-10 where 10 = expert-level authoritative content, 5 = average, 1 = spam/thin content
4. sentiment: "positive", "neutral", or "negative" toward the brand

ITEMS:
${itemLines}

Respond with ONLY a JSON array (no markdown, no explanation):
[{"index":0,"isAboutBrand":true,"mentionType":"substantive","qualityScore":7,"sentiment":"positive","reason":"brief reason"}]`

      const result = await openRouterChat(
        ASSESSMENT_MODEL,
        [{ role: 'user', content: prompt }],
        { maxTokens: 1500, temperature: 0.1 },
      )

      if (result.ok) {
          // Strip markdown code fences if present
          let content = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

          try {
            const parsed = JSON.parse(content)
            const arr = Array.isArray(parsed) ? parsed : (parsed.items || parsed.results || [])
            for (const item of arr) {
              allResults.push({
                index: batchStart + (item.index ?? 0),
                isAboutBrand: !!item.isAboutBrand,
                mentionType: (['substantive', 'passing', 'irrelevant'].includes(item.mentionType) ? item.mentionType : 'passing'),
                qualityScore: Math.max(1, Math.min(10, item.qualityScore ?? 5)),
                sentiment: (['positive', 'neutral', 'negative'].includes(item.sentiment) ? item.sentiment : 'neutral'),
                reason: item.reason || undefined,
              })
            }
          } catch {
            // JSON parse failed — use heuristics for this batch
            for (let i = 0; i < batch.length; i++) {
              allResults.push(this.heuristicAssessment(batch[i], batchStart + i, ctx, siteDomain, isCommonName))
            }
          }
        } else {
          // Both paid and free models failed — switch to heuristics
          console.warn(`[AEO Audit] LLM assessment unavailable (status ${result.status}) — falling back to heuristic assessment`)
          apiAvailable = false
          for (let i = 0; i < batch.length; i++) {
            allResults.push(this.heuristicAssessment(batch[i], batchStart + i, ctx, siteDomain, isCommonName))
          }
        }
    }

    // Fill in any missing indices
    for (let i = 0; i < items.length; i++) {
      if (!allResults.find(r => r.index === i)) {
        allResults.push(this.heuristicAssessment(items[i], i, ctx, siteDomain, isCommonName))
      }
    }

    return allResults.sort((a, b) => a.index - b.index)
  }

  /**
   * Heuristic-based content assessment — used when LLM API is unavailable.
   * Checks URL domain, title keywords, and text content to determine if
   * a result is about this brand. Less accurate than LLM but much better
   * than blanket false for short names.
   */
  private heuristicAssessment(
    item: { url: string; title: string; text?: string },
    index: number,
    ctx: BrandContext,
    siteDomain: string,
    isCommonName: boolean,
  ): ContentAssessment {
    const urlLower = item.url.toLowerCase()
    const titleLower = (item.title || '').toLowerCase()
    const textLower = (item.text || '').toLowerCase()
    const combined = `${titleLower} ${textLower}`
    const brandLower = ctx.brandName.toLowerCase()
    const domainRoot = siteDomain.replace(/^www\./, '')

    // Known authority domains where brand info is curated/verified
    const baseAuthorityDomains = [
      'linkedin.com', 'forbes.com', 'bloomberg.com',
      'play.google.com', 'apps.apple.com', 'trustpilot.com',
      'wikipedia.org', 'wikidata.org',
    ]
    // Add industry-specific authority domains
    const assessIndustry = classifyIndustry(ctx)
    const industryAuthority: Record<string, string[]> = {
      'tech':      ['crunchbase.com', 'ycombinator.com', 'cbinsights.com', 'pitchbook.com', 'techcrunch.com', 'g2.com', 'capterra.com', 'producthunt.com', 'angel.co', 'wellfound.com'],
      'food-bev':  ['yelp.com', 'tripadvisor.com', 'untappd.com', 'beeradvocate.com', 'vivino.com', 'ratebeer.com'],
      'retail':    ['amazon.com', 'yelp.com', 'bbb.org', 'sitejabber.com', 'influenster.com'],
      'travel':    ['tripadvisor.com', 'booking.com', 'kayak.com', 'lonelyplanet.com'],
      'health':    ['healthgrades.com', 'webmd.com', 'zocdoc.com', 'vitals.com'],
      'finance':   ['crunchbase.com', 'nerdwallet.com', 'bankrate.com', 'investopedia.com'],
      'education': ['coursera.org', 'niche.com', 'usnews.com'],
      'media':     ['imdb.com', 'rottentomatoes.com', 'metacritic.com'],
      'services':  ['clutch.co', 'bbb.org', 'yelp.com'],
      'general':   ['yelp.com', 'bbb.org'],
    }
    const authorityDomains = [...baseAuthorityDomains, ...(industryAuthority[assessIndustry] || industryAuthority['general'])]

    // Build industry keywords for matching — use 5+ char words to avoid
    // generic matches (e.g. "send" matching skincare apps)
    const industryKeywords = [ctx.industry, ctx.products, ctx.description, ctx.valueProposition]
      .filter(Boolean).join(' ').toLowerCase()
      .split(/[\s,;/|.]+/)
      .filter(w => w.length >= 5)
      .slice(0, 15)

    let hostname = ''
    try { hostname = new URL(item.url).hostname.replace(/^www\./, '') } catch { /* ignore */ }

    // 1. URL is on an authority domain AND title/URL references brand → high confidence
    const isAuthorityDomain = authorityDomains.some(d => hostname.includes(d))
    const titleHasBrand = titleLower.includes(brandLower)
    const urlHasBrand = urlLower.includes(brandLower) || urlLower.includes(domainRoot)

    if (isAuthorityDomain && (titleHasBrand || urlHasBrand)) {
      // Authority domain + brand reference → very likely about this brand
      const hasIndustryMatch = industryKeywords.some(k => combined.includes(k))
      if (hasIndustryMatch || !isCommonName) {
        return {
          index,
          isAboutBrand: true,
          mentionType: textLower.length > 200 ? 'substantive' : 'passing',
          qualityScore: 7,
          sentiment: 'neutral',
          reason: `Authority domain (${hostname}) with brand reference`,
        }
      }
    }

    // 2. Text mentions domain root explicitly → strong signal
    if (combined.includes(domainRoot)) {
      return {
        index,
        isAboutBrand: true,
        mentionType: textLower.length > 200 ? 'substantive' : 'passing',
        qualityScore: 6,
        sentiment: 'neutral',
        reason: `Content references ${domainRoot}`,
      }
    }

    // 3. For common names: require brand name + industry context in content
    if (isCommonName) {
      const hasIndustryContext = industryKeywords.some(k => combined.includes(k))
      if (titleHasBrand && hasIndustryContext) {
        return {
          index,
          isAboutBrand: true,
          mentionType: textLower.length > 200 ? 'substantive' : 'passing',
          qualityScore: 5,
          sentiment: 'neutral',
          reason: 'Brand name + industry context match',
        }
      }
      // No industry context → conservative for short names
      return {
        index,
        isAboutBrand: false,
        mentionType: 'irrelevant',
        qualityScore: 3,
        sentiment: 'neutral',
        reason: 'Short brand name without industry context (heuristic)',
      }
    }

    // 4. Longer brand names: title match is sufficient
    if (titleHasBrand) {
      return {
        index,
        isAboutBrand: true,
        mentionType: textLower.length > 200 ? 'substantive' : 'passing',
        qualityScore: 5,
        sentiment: 'neutral',
      }
    }

    return {
      index,
      isAboutBrand: false,
      mentionType: 'irrelevant',
      qualityScore: 3,
      sentiment: 'neutral',
      reason: 'No strong brand signals found (heuristic)',
    }
  }

  /**
   * Fetch and assess the brand's own key pages for content quality.
   * Checks structure, depth, and LLM-readiness of on-site content.
   * Accepts pre-fetched homepage HTML to avoid redundant requests.
   */
  private async assessOwnSiteContent(
    siteUrl: string,
    ctx: BrandContext,
    existingHomepageHtml?: string,
  ): Promise<{ structureScore: number; depthScore: number; llmReadiness: number; details: string }> {
    if (!OPENROUTER_API_KEY) {
      return { structureScore: 5, depthScore: 5, llmReadiness: 5, details: 'Assessment skipped (no API key)' }
    }

    // Fetch key pages — about, blog/resources landing, homepage
    const pagePaths = ['/about', '/blog', '/resources', '/faq', '/pricing']
    const pageContents: Array<{ path: string; text: string }> = []

    // Use pre-fetched homepage HTML if available
    if (existingHomepageHtml && existingHomepageHtml.length > 200) {
      const text = existingHomepageHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      pageContents.push({ path: '/', text: text.substring(0, 800) })
    }

    const fetches = await Promise.all(
      pagePaths.map(async (path) => {
        const pageUrl = new URL(path, siteUrl).toString()
        const html = await this.fetchPage(pageUrl)
        if (html.length > 200) {
          // Extract text content, strip HTML tags
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          return { path, text: text.substring(0, 800) }
        }
        return null
      })
    )

    for (const f of fetches) {
      if (f) pageContents.push(f)
    }

    if (pageContents.length === 0) {
      return { structureScore: 2, depthScore: 2, llmReadiness: 2, details: 'Could not fetch site pages for assessment' }
    }

    const pageDigest = pageContents.slice(0, 4).map(p =>
      `[${p.path}]: ${p.text.substring(0, 600)}`
    ).join('\n\n')

    const prompt = `You are an expert in content quality assessment for AI discoverability (AEO/GEO).

Analyze these pages from ${ctx.brandName} (${new URL(siteUrl).hostname}), a ${ctx.industry || 'technology'} company.

PAGES:
${pageDigest}

Score each dimension 1-10:
1. structureScore: Heading hierarchy, lists, tables, clear sections — content structure that LLMs can easily parse and extract from
2. depthScore: Topical depth, expertise signals (E-E-A-T), specific data/examples, not thin/generic content
3. llmReadiness: FAQ sections, definitions, how-to guides, comparison tables — content patterns LLMs love to cite
4. details: One sentence summary of key findings

Respond with ONLY JSON (no markdown):
{"structureScore":7,"depthScore":6,"llmReadiness":5,"details":"Good heading structure but lacks FAQ and comparison content"}`

    const result = await openRouterChat(
      ASSESSMENT_MODEL,
      [{ role: 'user', content: prompt }],
      { maxTokens: 300, temperature: 0.1 },
    )

    if (result.ok) {
      try {
        let content = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
        const parsed = JSON.parse(content)
        return {
          structureScore: Math.max(1, Math.min(10, parsed.structureScore ?? 5)),
          depthScore: Math.max(1, Math.min(10, parsed.depthScore ?? 5)),
          llmReadiness: Math.max(1, Math.min(10, parsed.llmReadiness ?? 5)),
          details: parsed.details || 'Assessment complete',
        }
      } catch { /* fall through */ }
    }

    return { structureScore: 5, depthScore: 5, llmReadiness: 5, details: 'LLM assessment unavailable' }
  }

  // ─── Citation Reality Verification ──────────────────────────────────────
  //
  // This is the critical grounding step. Technical readiness is meaningless if
  // AI engines don't actually cite your brand. We verify by:
  // 1. Checking existing LLM run data (llm_response_files table)
  // 2. Computing a citation rate that calibrates the final score
  //
  // Formula: finalScore = technicalScore × (0.5 + 0.5 × citationRate)
  // - 0% citation → score capped at 50% ("ready but invisible")
  // - 50% citation → score at 75%
  // - 100% citation → score unchanged (fully validated)

  private async verifyCitationReality(
    brandId: string, ctx: BrandContext
  ): Promise<AuditResult['citationVerification']> {
    const probes: NonNullable<AuditResult['citationVerification']>['probes'] = []
    let source: 'run' | 'live-probe' | 'both' = 'run'
    let simCited = 0
    let simTotal = 0
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // ── Check llm_response_files from existing LLM runs ──
    try {
        const { data: responses } = await this.supabase
          .from('llm_response_files')
          .select('prompt_text, model_name, response_preview')
          .eq('brand_id', brandId)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(30)

        if (responses && responses.length > 0) {
          const brandLower = ctx.brandName.toLowerCase()
          const allNames = [brandLower, ...(ctx.entityAliases || []).map(a => a.toLowerCase())].filter(n => n.length >= 3)
          const domainName = ctx.primaryDomain?.replace(/^(www\.)?/, '').split('.')[0] || ''
          if (domainName.length >= 4) allNames.push(domainName.toLowerCase())

          for (const r of responses) {
            const responseText = (r.response_preview || '').toLowerCase()
            const cited = allNames.some(name => responseText.includes(name))
            simTotal++
            if (cited) simCited++

            if (probes.length < 6) {
              let snippet: string | undefined
              if (cited) {
                for (const name of allNames) {
                  const idx = responseText.indexOf(name)
                  if (idx >= 0) {
                    snippet = responseText.substring(Math.max(0, idx - 50), Math.min(responseText.length, idx + name.length + 100))
                    break
                  }
                }
              }
              probes.push({
                query: r.prompt_text || 'Run query',
                model: r.model_name || 'unknown',
                cited,
                snippet,
              })
            }
          }
        }
      } catch {
        // llm_response_files may not exist — continue
      }

    // ── Calculate citation rate from existing data ──
    // No live LLM probes — the LLM run system handles that separately.
    if (simTotal === 0) {
      return {
        citationRate: -1, // -1 = unknown, no calibration applied
        queriesTested: 0,
        queriesCited: 0,
        calibrationMultiplier: 1.0,
        rawTechnicalScore: 0,
        probes: [],
        source: 'run',
      }
    }

    const citationRate = simCited / simTotal
    // Calibration: 0% citation → 0.5x, 50% → 0.75x, 100% → 1.0x
    const calibrationMultiplier = 0.5 + 0.5 * citationRate

    return {
      citationRate,
      queriesTested: simTotal,
      queriesCited: simCited,
      calibrationMultiplier,
      rawTechnicalScore: 0,
      probes,
      source,
    }
  }

  private async storeAuditResult(result: AuditResult): Promise<void> {
    try {
      await this.supabase
        .from('discoverability_audits')
        .insert({
          brand_id: result.brandId,
          site_url: result.siteUrl,
          audit_type: 'full',
          audit_status: 'completed',
          overall_score: result.overallScore,
          crawlability_score: result.pillars.find(p => p.id === 'crawlability')?.score || 0,
          schema_score: result.pillars.find(p => p.id === 'structured-data')?.score || 0,
          indexability_score: result.pillars.find(p => p.id === 'content-authority')?.score || 0,
          performance_score: result.pillars.find(p => p.id === 'source-footprint')?.score || 0,
          total_pages_checked: result.summary.totalChecks,
          pages_with_issues: result.summary.failed + result.summary.warnings,
          critical_issues: result.summary.criticalIssues,
          warnings: result.summary.warnings,
          recommendations: result.issues.length,
          audit_results: result as any,
          completed_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Failed to store audit result:', error)
    }
  }

  private parseStoredAudit(data: any): AuditResult | null {
    if (data.audit_results) return data.audit_results as AuditResult
    return {
      id: data.id,
      brandId: data.brand_id,
      siteUrl: data.site_url,
      overallScore: data.overall_score || 0,
      grade: this.scoreToGrade(data.overall_score || 0),
      pillars: [], issues: [],
      summary: { totalChecks: data.total_pages_checked || 0, passed: 0, warnings: data.warnings || 0, failed: data.critical_issues || 0, criticalIssues: data.critical_issues || 0 },
      createdAt: data.created_at,
    }
  }
}
