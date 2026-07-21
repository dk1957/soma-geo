/**
 * Competitive Blog Posts Migration to Sanity
 * =============================================
 * Creates blog posts targeting search terms where competitors
 * (Semrush, Ahrefs, Peec.ai, The Prompting Company, Brandwatch,
 *  Cision, Sprout Social, Hootsuite, Ornico) currently appear.
 *
 * Run: npx tsx scripts/migrate-competitive-blogs.ts
 */

import 'dotenv/config'
import { createClient } from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '4de42y7s',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2025-09-30',
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN,
})

const author = {
  _key: 'soma-marketing',
  name: 'Soma AI Marketing Team',
  jobTitle: 'Soma AI',
  image: '',
  linkedin: 'https://www.linkedin.com/company/withsoma/',
}

// Helper to create Portable Text blocks
function text(t: string, marks: string[] = []) {
  return { _type: 'span', text: t, marks }
}

function block(style: string, ...spans: any[]) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style,
    children: spans.map((s, i) => ({
      ...s,
      _key: `s${i}`,
    })),
  }
}

function p(...spans: any[]) {
  return block('normal', ...spans)
}
function h2(t: string) {
  return block('h2', text(t))
}
function h3(t: string) {
  return block('h3', text(t))
}
function quote(t: string) {
  return block('blockquote', text(t))
}

function callout(type: string, title: string, content: string) {
  return {
    _type: 'callout',
    _key: Math.random().toString(36).slice(2, 10),
    type,
    title,
    content,
  }
}

function caseStudy(company: string, industry: string, challenge: string, solution: string, results: string[]) {
  return {
    _type: 'caseStudy',
    _key: Math.random().toString(36).slice(2, 10),
    company,
    industry,
    challenge,
    solution,
    results,
  }
}

// ============================================================
// POST 1: Best AEO Tools Comparison
// Targets: "best AEO tools", "answer engine optimization tools",
//          "Peec.ai alternative", "Prompting Company alternative",
//          "GEO platform comparison"
// ============================================================
const post1 = {
  _id: 'blog-best-aeo-tools-2026',
  _type: 'blogPost',
  title: 'Best Answer Engine Optimization (AEO) Tools in 2026: A Complete Comparison',
  slug: { _type: 'slug', current: 'best-aeo-tools-2026' },
  excerpt: 'Compare the top Answer Engine Optimization tools including Soma AI, Peec.ai, The Prompting Company, and more. Discover which GEO platform gives you the best AI search visibility across ChatGPT, Claude, Gemini, and Perplexity.',
  description: 'Complete comparison of the best AEO and GEO tools in 2026. Compare features, pricing, AI model coverage, and results.',
  featured: true,
  category: 'comparisons',
  tags: ['AEO Tools', 'GEO Tools', 'AI Search', 'Peec.ai', 'Prompting Company', 'Tool Comparison', 'Answer Engine Optimization'],
  authors: [author],
  publishedDate: '2026-04-10T00:00:00.000Z',
  readTime: '18 min read',
  content: [
    p(text('Answer Engine Optimization (AEO) is no longer optional. By 2026, over 40% of product research starts with an AI assistant — ChatGPT, Claude, Gemini, or Perplexity — instead of a traditional search engine. The question is no longer '), text('"should we optimize for AI?"', ['em']), text(' but '), text('"which tool does it best?"', ['em'])),
    p(text('We evaluated every major AEO and GEO (Generative Engine Optimization) platform on the market: what they track, how many AI models they cover, what insights they surface, and whether they actually help you improve rankings. This guide covers Soma AI, Peec.ai, The Prompting Company, and several adjacent tools from the SEO world that are expanding into AI monitoring.')),
    callout('info', 'What Is AEO vs. GEO?', 'Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) both refer to the practice of making your brand the answer AI models give when users ask relevant questions. AEO was the original term; GEO has gained traction since the 2024 Princeton/Georgia Tech research paper. In this guide we use both terms interchangeably.'),

    h2('What to Look For in an AEO Tool'),
    p(text('Before comparing individual platforms, here are the seven capabilities that separate serious GEO tools from marketing add-ons:')),
    p(text('1. Multi-model coverage', ['strong']), text(' — Does it monitor ChatGPT, Claude, Gemini, Perplexity, Grok, and Llama? Many tools only cover one or two models, which gives you a dangerously incomplete picture.')),
    p(text('2. Prompt-level tracking', ['strong']), text(' — Can you control the exact queries being monitored, or does the tool decide for you? The best platforms let you import real keyword research and expand it into natural-language prompts.')),
    p(text('3. Competitive intelligence', ['strong']), text(' — Do you see which competitors AI recommends instead of you? Can you track share of voice across specific topics?')),
    p(text('4. Actionable recommendations', ['strong']), text(' — Raw data is useless without guidance. The best tools generate prioritized recommendations ranked by expected impact on your visibility score.')),
    p(text('5. LVI or equivalent scoring', ['strong']), text(' — A composite visibility index that tracks progress over time. Without a single metric, optimization is guesswork.')),
    p(text('6. Structured data guidance', ['strong']), text(' — Does the tool tell you which JSON-LD schemas to add, which third-party profiles to build, and which content gaps to fill?')),
    p(text('7. Monitoring frequency', ['strong']), text(' — AI models update their knowledge regularly. Tools that check once a month miss critical shifts.')),

    h2('Soma AI: The Full-Stack GEO Platform'),
    p(text('Soma AI was purpose-built for Generative Engine Optimization from day one. It is not a traditional SEO tool with an AI tab bolted on — the entire platform is designed around how LLMs discover, evaluate, and cite brands.')),
    h3('What Soma AI Tracks'),
    p(text('Soma AI monitors brand mentions, position, sentiment, and citations across '), text('six AI models: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Perplexity, Grok (xAI), and Llama (Meta)', ['strong']), text('. Each model is queried independently with the same prompts, and results are compared side-by-side.')),
    h3('LLM Visibility Index (LVI)'),
    p(text('The LVI is a 0–100 composite score combining four weighted signals: Visibility (35% — how often AI mentions your brand), Position (30% — where in responses you appear), Citations (15% — whether AI links to your sources), and Sentiment (20% — how favorably AI describes you). This gives marketing teams a single number to report to executives and track over time.')),
    h3('Competitive Intelligence'),
    p(text('For every prompt, Soma AI shows exactly which brands the AI recommended instead of yours. You can track up to 25 competitors across 200 prompts, with share-of-voice breakdowns by model, topic, and time period.')),
    h3('Pricing'),
    p(text('Growth: $49/month (1 brand, 25 prompts, 3 competitors, 3 models). Pro: $149/month (3 brands, 75 prompts, 10 competitors, 6 models). Enterprise: $399/month (10 brands, 200 prompts, 25 competitors, daily runs).')),
    callout('success', 'Best For', 'Brands and agencies that want a dedicated GEO platform with multi-model coverage, competitive intelligence, and a clear visibility score. The LVI gives CMOs a number they can track quarterly alongside traditional SEO metrics.'),

    h2('Peec.ai: AI Search Monitoring'),
    p(text('Peec.ai is one of the earliest entrants in the AEO space, offering AI search monitoring with a focus on prompt analysis and citation tracking. Their platform helps brands understand how different AI models respond to industry-relevant queries.')),
    h3('Strengths'),
    p(text('Peec.ai offers clean dashboards and prompt-level analytics. Their citation tracking is solid, and they provide some competitive comparison features. The platform is easy to set up, and their team publishes useful educational content about AEO.')),
    h3('Limitations'),
    p(text('Model coverage is more limited compared to full-stack platforms. Competitive intelligence features are less developed — you can see mentions but may not get deep share-of-voice analysis. Recommendation engines tend to be more general, without the specificity needed for technical implementation.')),
    h3('Best For'),
    p(text('Teams getting started with AEO who want a straightforward monitoring dashboard. Good entry point for brands new to AI search optimization.')),

    h2('The Prompting Company: Prompt Strategy Consulting'),
    p(text('The Prompting Company takes a different approach — part tool, part consulting service. They help brands craft prompt strategies and optimize content for AI citation. Their focus is on understanding how prompts work and reverse-engineering what makes AI models cite specific brands.')),
    h3('Strengths'),
    p(text('Deep expertise in prompt engineering and AI behavior analysis. Their consulting approach means brands get hands-on guidance rather than just data. They focus heavily on the "why" behind AI citations, which can be valuable for content strategy teams.')),
    h3('Limitations'),
    p(text('The consulting-heavy model means it does not scale as easily as pure software solutions. Brands with multiple products, regions, or competitors may find it harder to get comprehensive monitoring without significant investment. Less automated competitive tracking.')),
    h3('Best For'),
    p(text('Brands that want deep strategic guidance on AI optimization alongside data. Best suited for teams with smaller prompt sets who want quality over quantity.')),

    h2('SEO Tools Expanding into AEO'),
    h3('Semrush'),
    p(text('Semrush, the $3.6 billion SEO giant, has begun adding AI-related features to its suite. Their position sensing tools now include some LLM visibility tracking, and their content optimization features have been updated to consider AI readability.')),
    p(text('However, Semrush\'s AI features remain secondary to their core SEO product. The AI monitoring is limited in model coverage, prompt customization is minimal, and there is no dedicated visibility index for AI search. For brands that already use Semrush for SEO and want a basic AI snapshot, it may be adequate. For serious GEO work, it is insufficient.')),
    h3('Ahrefs'),
    p(text('Ahrefs has taken a more cautious approach, focusing on content optimization signals that help with both traditional SEO and AI discoverability. Their Content Explorer can identify topics gaining AI traction, but they do not offer direct LLM monitoring or competitive AI visibility tracking.')),
    p(text('Ahrefs remains the best tool for backlink analysis and traditional SEO — but backlinks are not the primary signal AI models use. Entity clarity, structured data, factual specificity, and third-party citations matter more for GEO.')),

    h2('How the Tools Compare: Feature Matrix'),
    callout('info', 'Feature Comparison Summary', 'Multi-Model Coverage (6 models): Soma AI ✓, Peec.ai partial, The Prompting Company partial, Semrush limited, Ahrefs ✗\n\nCustom Prompt Libraries: Soma AI ✓, Peec.ai ✓, The Prompting Company ✓ (hand-crafted), Semrush ✗, Ahrefs ✗\n\nCompetitive Share-of-Voice: Soma AI ✓, Peec.ai partial, The Prompting Company limited, Semrush ✗, Ahrefs ✗\n\nVisibility Index Score: Soma AI ✓ (LVI), Peec.ai ✓, The Prompting Company ✗, Semrush ✗, Ahrefs ✗\n\nStructured Data Recommendations: Soma AI ✓, Peec.ai partial, The Prompting Company ✓, Semrush ✗, Ahrefs ✗\n\nPricing from: Soma AI $49/mo, Peec.ai varies, The Prompting Company custom, Semrush $139/mo (core), Ahrefs $99/mo (core)'),

    h2('Which Tool Should You Choose?'),
    p(text('The right AEO tool depends on your maturity and goals:')),
    p(text('If you are a brand or agency that needs comprehensive AI visibility monitoring with competitive intelligence'), text(' → Soma AI', ['strong']), text('. The six-model coverage, LVI scoring, and competitive tracking are unmatched. The pricing is also significantly lower than legacy SEO tools.')),
    p(text('If you are just starting to explore AEO and want a clean monitoring dashboard'), text(' → Peec.ai', ['strong']), text(' offers a solid entry point with good prompt analytics.')),
    p(text('If you need hands-on consulting and prompt strategy guidance'), text(' → The Prompting Company', ['strong']), text(' provides deep strategic support, especially for brands new to AI optimization.')),
    p(text('If you already pay for Semrush or Ahrefs and just want a basic AI pulse'), text(' — their emerging features may give you a starting point, but expect to outgrow them quickly as your GEO strategy matures.', ['em'])),

    h2('The Bottom Line'),
    p(text('Traditional SEO tools were built for a world of ten blue links. AEO tools are built for a world of synthesized answers. The brands that adopt dedicated GEO platforms in 2026 will own the AI search landscape by 2027. The ones that wait will spend years trying to catch up.')),
    callout('tip', 'Start Your Free Audit', 'Soma AI offers a free AI visibility audit that shows exactly where your brand stands across ChatGPT, Claude, Gemini, and Perplexity — including which competitors AI recommends instead of you. Visit withsoma.ai/free-audit to get started.'),
  ],
  seo: {
    metaTitle: 'Best AEO Tools 2026: Soma AI vs Peec.ai vs Semrush vs Ahrefs | Comparison',
    keywords: [
      'best AEO tools',
      'best answer engine optimization tools',
      'AEO platform comparison',
      'GEO tools 2026',
      'Peec.ai alternative',
      'Peec.ai vs Soma AI',
      'Prompting Company alternative',
      'Semrush AEO',
      'Semrush AI features',
      'Ahrefs AI search',
      'Ahrefs alternative for AI',
      'best GEO platform',
      'AI search optimization tools',
      'answer engine optimization platform',
      'generative engine optimization tools',
      'AI visibility tools comparison',
    ],
  },
  isActive: true,
}

// ============================================================
// POST 2: Why Traditional SEO Tools Can't Track AI Visibility
// Targets: "Semrush alternative", "Ahrefs limitations", "SEO tool for AI",
//          "track AI search visibility", "AI SEO tool"
// ============================================================
const post2 = {
  _id: 'blog-seo-tools-cant-track-ai',
  _type: 'blogPost',
  title: 'Why Semrush and Ahrefs Can\'t Track Your AI Search Visibility (And What Can)',
  slug: { _type: 'slug', current: 'semrush-ahrefs-cant-track-ai-visibility' },
  excerpt: 'SEO tools like Semrush and Ahrefs were built for Google\'s ten blue links. They cannot monitor what ChatGPT, Claude, or Gemini say about your brand. Here\'s what the AI visibility gap looks like and how to close it.',
  description: 'Why traditional SEO tools fail at AI search monitoring and what GEO platforms like Soma AI do differently.',
  featured: false,
  category: 'industry-analysis',
  tags: ['Semrush', 'Ahrefs', 'SEO Tools', 'AI Visibility', 'GEO', 'Tool Limitations', 'AI Search'],
  authors: [author],
  publishedDate: '2026-04-08T00:00:00.000Z',
  readTime: '14 min read',
  content: [
    p(text('Your brand ranks #1 on Google for your core keywords. Your Semrush dashboard is green. Ahrefs shows healthy backlink growth. Everything looks great — until a prospect tells you they asked ChatGPT for recommendations in your category and your brand was not mentioned at all.')),
    p(text('This is the AI visibility gap, and it is widening every day. Traditional SEO tools were engineered to measure performance in search engine result pages (SERPs). They track rankings, backlinks, domain authority, keyword difficulty, and organic traffic. But AI-powered search engines like ChatGPT, Claude, Gemini, and Perplexity do not generate SERPs. They synthesize answers. And no traditional SEO tool can tell you what those answers contain.')),

    h2('The Fundamental Problem: SERPs vs. Synthesized Answers'),
    p(text('When someone searches Google for "best project management software," Google returns a ranked list of pages. SEO tools track where your page appears in that list. The algorithm is well-understood: domain authority, backlinks, on-page optimization, page speed, mobile responsiveness.')),
    p(text('When someone asks ChatGPT the same question, there is no list of pages. ChatGPT reads its training data, retrieves context from Bing or its own tools, and writes a paragraph naming 3–5 products. Your brand is either in that paragraph or it is invisible.')),
    p(text('This is a fundamentally different game. The signals that determine inclusion are different:')),
    p(text('• Entity clarity', ['strong']), text(' — Does the AI understand what your brand does unambiguously?')),
    p(text('• Third-party validation', ['strong']), text(' — Are you mentioned on review sites (G2, Capterra), industry publications, and Wikipedia?')),
    p(text('• Structured data', ['strong']), text(' — Do you have proper JSON-LD schema markup (Organization, Product, FAQPage)?')),
    p(text('• Factual specificity', ['strong']), text(' — Do your pages contain concrete numbers, named features, and verifiable claims?')),
    p(text('• Content recency', ['strong']), text(' — Is your content current? Retrieval-augmented models favor fresh sources.')),
    p(text('Semrush and Ahrefs measure none of these signals in the context of AI answers.')),

    h2('What Semrush Gets Right — and Where It Stops'),
    p(text('Semrush is excellent at what it was built for: keyword research, backlink auditing, SERP tracking, competitive domain analysis, and content optimization for Google. With $330M+ in annual revenue and tools used by over 10 million marketers, its SEO capabilities are world-class.')),
    p(text('But when it comes to AI search:')),
    p(text('Semrush does not monitor ChatGPT, Claude, Gemini, or Perplexity responses.'), text(' It cannot tell you when a competitor is mentioned and you are not.', ['em'])),
    p(text('Semrush does not have an AI visibility index.'), text(' There is no equivalent of their "Visibility Score" for AI search.', ['em'])),
    p(text('Semrush does not generate AI-specific content recommendations.'), text(' Their content optimizer targets Google\'s algorithm, not LLM citation patterns.', ['em'])),
    p(text('Semrush tracks how you rank for "best CRM software" on Google. It cannot tell you what ChatGPT says when someone asks "what is the best CRM for small businesses?"', ['em'])),

    h2('What Ahrefs Gets Right — and Where It Stops'),
    p(text('Ahrefs is the gold standard for backlink analysis and content gap identification. Their Content Explorer and Site Explorer tools are unmatched for traditional SEO research.')),
    p(text('For AI search, Ahrefs faces the same fundamental limitation. Backlinks — their core metric — are '), text('not the primary signal AI models use to decide which brands to recommend', ['strong']), text('. ChatGPT does not count how many websites link to you. It evaluates whether your brand has clear entity definition, authoritative third-party mentions, and up-to-date factual content.')),
    p(text('Ahrefs\' Domain Rating (DR) does not correlate with AI recommendation frequency. We have seen brands with DR 30 mentioned by ChatGPT more than brands with DR 80, because the lower-DR brand had clearer entity markup, more G2 reviews, and fresher content.')),

    h2('The Metrics That Actually Matter for AI Visibility'),
    p(text('If you want to know where your brand stands in AI search, you need different metrics:')),
    p(text('1. Mention Rate', ['strong']), text(' — What percentage of relevant AI queries mention your brand? This is the most fundamental GEO metric. If ChatGPT answers 100 queries about your category and mentions you in 15, your mention rate is 15%.')),
    p(text('2. Position Index', ['strong']), text(' — When you are mentioned, where in the response do you appear? First recommendation, third, or buried in a list of alternatives? AI models front-load their strongest recommendations.')),
    p(text('3. Sentiment Score', ['strong']), text(' — Does the AI describe your brand positively, neutrally, or with caveats? "Brand X is the leading payment platform" vs. "Brand X is an option, though it has had reliability issues" — the difference is massive.')),
    p(text('4. Citation Rate', ['strong']), text(' — Does the AI link to your website or sources? Perplexity cites sources; ChatGPT sometimes links when using browsing. Citations drive traffic.')),
    p(text('5. Competitive Share of Voice', ['strong']), text(' — When you are not mentioned, who is? This is the most actionable metric because it shows exactly who you need to displace.')),

    h2('How GEO Platforms Like Soma AI Fill the Gap'),
    p(text('Soma AI was built from scratch to answer the question traditional SEO tools cannot: '), text('"What does AI say about my brand?"', ['strong'])),
    p(text('The platform queries six AI models (ChatGPT, Claude, Gemini, Perplexity, Grok, Llama) with prompts generated from your real keyword research. Every response is captured and analyzed for mention frequency, position, sentiment, citations, and competitor presence.')),
    p(text('The LLM Visibility Index (LVI) distills all of this into a single 0–100 score — the AI search equivalent of Semrush\'s Visibility Score or Ahrefs\' DR. Marketing teams can track LVI alongside their traditional SEO metrics and report a complete picture of search visibility to leadership.')),
    callout('tip', 'Complementary, Not Competitive', 'Soma AI does not replace Semrush or Ahrefs. It fills the gap they cannot cover. The ideal 2026 marketing stack uses a traditional SEO tool for Google optimization AND a GEO platform for AI search optimization. The brands winning in both channels use both types of tools.'),

    h2('Real-World Example: The Visibility Gap in Action'),
    caseStudy(
      'Mid-Market SaaS Company',
      'B2B Software',
      'Ranked #2 on Google for primary keyword with Semrush visibility score of 78. Yet ChatGPT, Claude, and Gemini mentioned three competitors but not them in 92% of relevant queries.',
      'Implemented Soma AI to identify AI visibility gaps. Found missing structured data, no G2 presence, and outdated product pages. Fixed entity markup, published comparison content, and built third-party review profiles.',
      [
        'AI mention rate went from 8% to 47% in 60 days',
        'LVI score increased from 12 to 64',
        'ChatGPT started recommending them as a top-3 option',
        '23% increase in demo requests attributed to AI-referred traffic',
      ],
    ),

    h2('What You Should Do Today'),
    p(text('1. Run a free AI visibility audit.'), text(' Before investing in any tool, know where you stand. Soma AI offers a free audit at withsoma.ai/free-audit that shows your mention rate, competitor recommendations, and LVI score across multiple AI models.', ['em'])),
    p(text('2. Do not stop using your SEO tools.'), text(' Google still matters. Semrush and Ahrefs are essential for traditional SEO. But recognize they cover half the search landscape.', ['em'])),
    p(text('3. Add a GEO platform to your stack.'), text(' The brands that monitor AI search today will own AI recommendations by next year. The ones that wait will spend years trying to displace entrenched competitors.', ['em'])),
    callout('success', 'The Two-Tool Stack', 'In 2026, the winning marketing stack includes Semrush or Ahrefs for traditional SEO AND Soma AI for AI search visibility. One without the other leaves you blind to half of how customers discover your brand.'),
  ],
  seo: {
    metaTitle: 'Why Semrush & Ahrefs Can\'t Track AI Visibility | Soma AI',
    keywords: [
      'Semrush AI visibility',
      'Ahrefs AI search',
      'Semrush alternative AI',
      'Semrush limitations',
      'Ahrefs limitations AI',
      'AI search monitoring tool',
      'AI visibility tracking',
      'SEO tool for ChatGPT',
      'track ChatGPT mentions',
      'GEO vs SEO tools',
      'Semrush vs Soma AI',
      'Ahrefs vs Soma AI',
      'AI SEO tool',
      'LLM visibility tracking',
      'ChatGPT brand monitoring',
    ],
  },
  isActive: true,
}

// ============================================================
// POST 3: Brand Monitoring for AI Search
// Targets: "brand monitoring tools", "Brandwatch alternative",
//          "Cision alternative", "Sprout Social vs", "brand mention tracking AI",
//          "Hootsuite alternative", "Ornico media monitoring"
// ============================================================
const post3 = {
  _id: 'blog-brand-monitoring-ai-search',
  _type: 'blogPost',
  title: 'Brand Monitoring in the Age of AI Search: Why Brandwatch, Cision, and Sprout Social Are Not Enough',
  slug: { _type: 'slug', current: 'brand-monitoring-ai-search-brandwatch-cision-sprout-social' },
  excerpt: 'Traditional brand monitoring tools like Brandwatch, Cision, Sprout Social, and Hootsuite track social media and news. They miss the fastest-growing channel: what AI search engines say about your brand.',
  description: 'Why brand monitoring tools miss AI search mentions and how to track what ChatGPT, Claude, and Gemini say about you.',
  featured: false,
  category: 'industry-analysis',
  tags: ['Brand Monitoring', 'Brandwatch', 'Cision', 'Sprout Social', 'Hootsuite', 'Ornico', 'AI Search', 'Social Listening'],
  authors: [author],
  publishedDate: '2026-04-06T00:00:00.000Z',
  readTime: '15 min read',
  content: [
    p(text('Brand monitoring used to mean tracking three channels: social media, news, and reviews. Tools like Brandwatch, Cision, Sprout Social, Hootsuite, and Ornico built massive businesses around listening to these channels. Their platforms scrape tweets, scan news articles, aggregate review scores, and alert you when someone mentions your brand.')),
    p(text('But in 2026, there is a fourth channel that none of these tools monitor: '), text('AI search engines.', ['strong'])),
    p(text('When a decision-maker asks ChatGPT "what are the best marketing analytics platforms?", the response names specific brands. When a traveler asks Claude "best hotels in Cape Town," they get curated recommendations. When a developer asks Perplexity "best API monitoring tools," Perplexity cites specific products with links.')),
    p(text('These AI-generated answers influence purchasing decisions, shape brand perception, and drive traffic. And traditional brand monitoring tools cannot see any of it.')),

    h2('What Traditional Brand Monitoring Tools Track'),
    p(text('Brandwatch', ['strong']), text(' — The enterprise social listening platform owned by Cision. Tracks mentions across social media, forums, blogs, and news sites. Excellent at sentiment analysis, trend detection, and consumer intelligence. Used by Fortune 500 companies worldwide.')),
    p(text('Cision', ['strong']), text(' — The PR and media monitoring giant. Tracks earned media coverage across 100,000+ outlets, press release distribution, and journalist outreach. Essential for PR teams managing reputation.')),
    p(text('Sprout Social', ['strong']), text(' — Social media management platform with strong listening capabilities. Tracks brand mentions across X (Twitter), Instagram, Facebook, LinkedIn, Reddit, and TikTok. Robust engagement and analytics tools.')),
    p(text('Hootsuite Insights', ['strong']), text(' — Social media listening powered by Brandwatch data. Tracks social conversations, trending topics, and competitive mentions across major social platforms.')),
    p(text('Ornico', ['strong']), text(' — Africa-focused media monitoring platform. Tracks brand mentions across African media, print, broadcast, and digital channels. Essential for brands operating in African markets.')),
    p(text('Each of these tools excels in its domain. But all of them share the same blind spot: '), text('none of them monitor what AI search engines say about your brand.', ['strong'])),

    h2('The AI Brand Monitoring Gap'),
    p(text('Consider this scenario: A marketing director at a mid-market company asks ChatGPT: "Compare Brandwatch vs Sprout Social for social listening." ChatGPT responds with a detailed comparison, recommending both — but also suggesting two alternatives the marketing director had never considered.')),
    p(text('Neither Brandwatch nor Sprout Social knows this conversation happened. Neither tool captured the mention. Neither tool can tell you what ChatGPT said about them — or whether it recommended a competitor instead.')),
    p(text('Now multiply this by millions of similar queries happening every day across ChatGPT, Claude, Gemini, Perplexity, and Grok. These AI responses are:')),
    p(text('• Directly influencing purchase decisions'), text(' — 62% of users trust AI recommendations as much as personal recommendations')),
    p(text('• Shaping brand perception at scale'), text(' — When ChatGPT says "Brandwatch is the industry leader" vs. "Brandwatch is expensive and complex," that perception spreads')),
    p(text('• Driving organic discovery'), text(' — Perplexity alone drives measurable referral traffic through cited links')),
    p(text('• Creating competitive displacement'), text(' — If AI recommends your competitor but not you, you are losing deals you never knew existed')),

    h2('Why Social Listening Tools Cannot Solve This'),
    p(text('Social listening tools work by scraping public content: tweets, posts, articles, forum threads. A user posts on X about your brand, and Brandwatch captures it. A journalist writes about you, and Cision logs the mention.')),
    p(text('AI search conversations are fundamentally different:')),
    p(text('1. They are private.'), text(' When someone asks ChatGPT about your brand, there is no public post to scrape.', ['em'])),
    p(text('2. They are dynamic.'), text(' The same query can produce different answers depending on timing, context, and model version.', ['em'])),
    p(text('3. They are synthesized.'), text(' AI does not link to your page — it integrates information from multiple sources into a novel response.', ['em'])),
    p(text('4. They are competitive.'), text(' Every AI response is a zero-sum game: if AI mentions your competitor, it often means it did not mention you.', ['em'])),
    p(text('You cannot monitor AI search with social listening. It requires a completely different approach: programmatically querying AI models with relevant prompts, capturing every response, analyzing mentions, and tracking changes over time.')),

    h2('How AI Brand Monitoring Works'),
    p(text('AI brand monitoring (also called Generative Engine Optimization or GEO) works by:')),
    p(text('1.'), text(' Generating natural-language prompts that mirror how real users ask AI about your industry, product category, and use cases.', ['em'])),
    p(text('2.'), text(' Querying multiple AI models (ChatGPT, Claude, Gemini, Perplexity, Grok, Llama) with those prompts on a regular schedule.', ['em'])),
    p(text('3.'), text(' Capturing and storing every AI response for analysis.', ['em'])),
    p(text('4.'), text(' Analyzing each response for: brand mentions, mention position, sentiment, citations, and competitor presence.', ['em'])),
    p(text('5.'), text(' Computing a visibility score (like Soma AI\'s LVI — LLM Visibility Index) that tracks your AI search presence over time.', ['em'])),
    p(text('6.'), text(' Generating recommendations: what content to create, which structured data to add, which third-party profiles to build.', ['em'])),

    h2('Soma AI: Purpose-Built AI Brand Monitoring'),
    p(text('Soma AI was built specifically for the channel that Brandwatch, Cision, and Sprout Social miss. The platform monitors your brand across six AI models with up to 200 custom prompts, tracks 25 competitors, and computes an LLM Visibility Index that tells you exactly where you stand.')),
    p(text('Key differences from traditional tools:')),
    p(text('• Monitors AI responses, not social posts'), text(' — Captures what ChatGPT, Claude, Gemini, and Perplexity actually say about your brand')),
    p(text('• Competitive AI intelligence'), text(' — Shows which competitors AI recommends instead of you on every query')),
    p(text('• Sentiment in AI context'), text(' — Tracks how favorably AI describes your brand, not just whether it is mentioned')),
    p(text('• Actionable optimization'), text(' — Recommends structured data, content gaps, and third-party presence fixes that improve AI visibility')),
    p(text('• LVI scoring'), text(' — Single metric that tracks AI brand visibility over time, comparable to traditional brand health scores')),

    h2('The Complete Brand Monitoring Stack for 2026'),
    p(text('Smart brands do not choose between traditional monitoring and AI monitoring — they use both:')),
    p(text('Social & News Monitoring:', ['strong']), text(' Brandwatch, Sprout Social, or Hootsuite for social mentions, earned media, and public sentiment.')),
    p(text('PR & Media Monitoring:', ['strong']), text(' Cision or Ornico for press coverage, journalist relationships, and media analytics.')),
    p(text('AI Search Monitoring:', ['strong']), text(' Soma AI for tracking what ChatGPT, Claude, Gemini, and Perplexity say about your brand, competitive positioning in AI answers, and optimization recommendations.')),
    callout('success', 'Full Coverage', 'In 2026, a brand monitoring strategy that ignores AI search is like a media monitoring strategy that ignored social media in 2015. The channel may be new, but it is growing faster than any channel before it. Soma AI fills the gap that no traditional tool covers.'),

    p(text('Get your free AI visibility audit at withsoma.ai/free-audit and see exactly what AI search engines say about your brand today.')),
  ],
  seo: {
    metaTitle: 'Brand Monitoring for AI Search: Beyond Brandwatch, Cision & Sprout Social | Soma AI',
    keywords: [
      'brand monitoring AI search',
      'Brandwatch alternative',
      'Brandwatch AI monitoring',
      'Cision alternative',
      'Sprout Social alternative',
      'Hootsuite alternative',
      'Ornico alternative',
      'AI brand monitoring',
      'brand mention tracking AI',
      'social listening AI',
      'ChatGPT brand monitoring',
      'AI search monitoring tool',
      'what does AI say about my brand',
      'brand reputation AI search',
      'monitor ChatGPT mentions',
    ],
  },
  isActive: true,
}

// ============================================================
// POST 4: How to Rank in ChatGPT, Claude & Gemini
// Targets: "how to rank in ChatGPT", "how to appear in AI search",
//          "GEO strategy guide", "AI search optimization guide",
//          "ChatGPT SEO", "get mentioned by AI"
// ============================================================
const post4 = {
  _id: 'blog-how-to-rank-in-chatgpt-claude-gemini',
  _type: 'blogPost',
  title: 'How to Rank in ChatGPT, Claude & Gemini: The Definitive GEO Strategy Guide for 2026',
  slug: { _type: 'slug', current: 'how-to-rank-in-chatgpt-claude-gemini-2026' },
  excerpt: 'Step-by-step guide to getting your brand recommended by ChatGPT, Claude, Gemini, and Perplexity. Covers structured data, entity optimization, content strategy, third-party presence, and measurement with real examples.',
  description: 'Complete guide to ranking in AI search engines. Learn the exact strategies to get ChatGPT, Claude, and Gemini to recommend your brand.',
  featured: true,
  category: 'geo-guides',
  tags: ['GEO Strategy', 'ChatGPT Ranking', 'Claude SEO', 'Gemini Ranking', 'AI Search Guide', 'Perplexity SEO', 'How To'],
  authors: [author],
  publishedDate: '2026-04-12T00:00:00.000Z',
  readTime: '22 min read',
  content: [
    p(text('There is no Google Search Console for ChatGPT. No rank tracker for Claude. No keyword difficulty score for Gemini. And yet, AI search is now responsible for an estimated 25–40% of product discovery for knowledge workers, developers, and early adopters.')),
    p(text('The brands that appear in AI answers get traffic, trust, and conversions. The ones that do not might as well be invisible to an entire generation of searchers.')),
    p(text('This guide breaks down every tactic we have seen work across hundreds of brands using Soma AI to track and improve their AI visibility. These are not theories — they are patterns extracted from real LVI data across six AI models.')),

    h2('Understanding How AI Models Select Brands to Recommend'),
    p(text('Before optimizing, you need to understand what AI models actually do when someone asks "what is the best X for Y?"')),
    p(text('1. Training data scan.'), text(' The model searches its parametric knowledge (information baked in during training) for entities related to the query. Brands that appeared frequently in high-quality training data have an advantage.', ['em'])),
    p(text('2. Retrieval augmentation.'), text(' Most models now use tools to access current information — Bing for ChatGPT, Google for Gemini, direct web fetching for Perplexity. Your live web presence matters.', ['em'])),
    p(text('3. Entity resolution.'), text(' The model identifies which entities (brands) are relevant and disambiguates them. Brands with clear, consistent identity across sources are favored.', ['em'])),
    p(text('4. Authority assessment.'), text(' The model weighs source credibility. Third-party mentions on review sites, industry publications, and encyclopedic sources carry more weight than your own website.', ['em'])),
    p(text('5. Response synthesis.'), text(' The model composes a coherent response, typically mentioning 2–5 brands with brief descriptions. Front-loaded brands get the most cognitive weight from users.', ['em'])),
    p(text('Each of these steps represents an optimization opportunity.')),

    h2('Step 1: Build Unambiguous Entity Identity'),
    p(text('AI models need to understand what your brand is, unambiguously. If "your brand name" could refer to multiple things, the model may not include you or may confuse you with something else.')),
    h3('Structured Data (JSON-LD)'),
    p(text('Add comprehensive JSON-LD schema markup to your website. At minimum:')),
    p(text('• Organization schema', ['strong']), text(' — name, description, URL, logo, foundingDate, contactPoint, address, sameAs links to all social profiles.')),
    p(text('• Product/SoftwareApplication schema', ['strong']), text(' — features, pricing, category, aggregateRating if you have reviews.')),
    p(text('• FAQPage schema', ['strong']), text(' — common questions and answers about your product. This directly feeds AI models\' understanding of your product.')),
    p(text('• BreadcrumbList schema', ['strong']), text(' — site structure helps AI understand your content hierarchy.')),
    callout('tip', 'Schema Test', 'Use Google\'s Rich Results Test to validate your schema. But remember: schema is not just for Google. AI models read JSON-LD during retrieval, making it one of the highest-leverage GEO investments.'),

    h3('Consistent NAP+D Across the Web'),
    p(text('NAP+D: Name, Address, Phone, Description. Your brand should have identical information on your website, Google Business Profile, LinkedIn, Crunchbase, G2, Capterra, and every other profile. Inconsistency confuses entity resolution.')),

    h2('Step 2: Dominate Third-Party Sources'),
    p(text('AI models trust third-party sources more than your own website. This is the biggest difference between SEO and GEO. In SEO, your own content can rank. In GEO, third-party mentions determine whether AI cites you.')),
    h3('Review Sites'),
    p(text('Generate authentic reviews on G2, Capterra, TrustRadius, and Gartner Peer Insights. AI models reference these platforms extensively when making product recommendations. Volume matters: brands with 100+ reviews get mentioned more than brands with 10.')),
    h3('Industry Publications'),
    p(text('Get featured in industry-specific publications, comparison articles, and expert roundups. When TechCrunch, VentureBeat, or a respected industry blog mentions your brand, AI models weigh that heavily.')),
    h3('Wikipedia and Wikidata'),
    p(text('If your brand meets Wikipedia\'s notability criteria, a Wikipedia article dramatically increases AI visibility. At minimum, ensure your brand has a Wikidata entry with structured properties (inception date, website, industry, headquarters).')),
    h3('Community Platforms'),
    p(text('Establish presence on Reddit, Stack Overflow (if technical), Quora, and industry-specific forums. AI models train on and retrieve from these platforms. Genuine, helpful responses that mention your brand in relevant contexts are invaluable.')),

    h2('Step 3: Create Content That AI Models Can Extract'),
    p(text('AI models favor content that is:')),
    p(text('• Factually specific:', ['strong']), text(' "Our platform processes 2.3 million API calls per day with 99.97% uptime" beats "our platform is fast and reliable."')),
    p(text('• Comparatively positioned:', ['strong']), text(' Content that explicitly compares your product to alternatives helps AI models understand your competitive position.')),
    p(text('• Question-answer structured:', ['strong']), text(' Pages that directly answer common questions in your category are more extractable by AI.')),
    p(text('• Regularly updated:', ['strong']), text(' Retrieval-augmented models pull recent content. Pages last updated in 2023 lose to pages updated this month.')),
    p(text('• Semantically rich:', ['strong']), text(' Use clear headings, bullet points, tables, and structured formatting. AI models parse structure better than walls of text.')),

    h2('Step 4: Optimize for Each AI Model Separately'),
    p(text('Different AI models have different knowledge sources and biases:')),
    p(text('ChatGPT (OpenAI)', ['strong']), text(' — Uses Bing for retrieval. Favors well-known brands and authoritative sources. Benefits from Microsoft/Bing ecosystem presence.')),
    p(text('Claude (Anthropic)', ['strong']), text(' — Trained on a broad corpus with strong emphasis on accuracy. Responds well to factual specificity and disclaims uncertainty more than other models.')),
    p(text('Gemini (Google)', ['strong']), text(' — Uses Google Search for retrieval. Google\'s knowledge graph, Google Business Profile, and structured data in Google\'s ecosystem carry extra weight.')),
    p(text('Perplexity', ['strong']), text(' — Citation-heavy model that always links to sources. Optimizing for Perplexity means making your content the most citable source for relevant queries.')),
    p(text('Grok (xAI)', ['strong']), text(' — Uses X (Twitter) data and real-time information. Strong X presence and trending topic participation help visibility in Grok.')),

    h2('Step 5: Measure and Iterate'),
    p(text('You cannot optimize what you do not measure. This is where an AI visibility platform like Soma AI becomes essential.')),
    p(text('Track your LLM Visibility Index (LVI) over time. Break it down by model, by prompt category, and by competitor. Identify which prompts you are winning and which you are losing. Focus optimization efforts on the highest-value queries where you are currently absent.')),
    p(text('Soma AI\'s platform runs your prompts across all six models on a regular cadence, computes your LVI, shows competitive share-of-voice, and generates prioritized recommendations. You can start with a free audit at withsoma.ai/free-audit to see where you stand today.')),

    h2('The GEO Implementation Timeline'),
    p(text('Week 1:', ['strong']), text(' Run AI visibility audit. Implement Organization, Product, and FAQ schema. Fix NAP+D inconsistencies.')),
    p(text('Weeks 2–4:', ['strong']), text(' Launch G2/Capterra review campaigns. Publish comparison content. Update product pages with factual specifics.')),
    p(text('Weeks 4–8:', ['strong']), text(' Build third-party presence (guest posts, PR, community engagement). Create question-answer content for high-value queries.')),
    p(text('Weeks 8–12:', ['strong']), text(' Measure LVI changes. Double down on what is working. Address model-specific gaps.')),
    p(text('Ongoing:', ['strong']), text(' Monthly monitoring, content refresh, competitive tracking, prompt library expansion.')),

    callout('success', 'Start With a Free Audit', 'Don\'t optimize blind. Soma AI\'s free audit shows your current AI visibility score, which models mention you, what they say, and which competitors they recommend instead. Visit withsoma.ai/free-audit.'),
  ],
  seo: {
    metaTitle: 'How to Rank in ChatGPT, Claude & Gemini: Complete GEO Guide 2026 | Soma AI',
    keywords: [
      'how to rank in ChatGPT',
      'how to appear in AI search',
      'ChatGPT SEO',
      'Claude SEO',
      'Gemini SEO',
      'Perplexity SEO',
      'GEO strategy guide',
      'rank in AI search engines',
      'get mentioned by ChatGPT',
      'AI search optimization guide',
      'generative engine optimization strategy',
      'how to get recommended by AI',
      'AI search ranking factors',
      'ChatGPT brand mentions',
      'optimize for AI answers',
      'GEO implementation guide',
    ],
  },
  isActive: true,
}

// ============================================================
// POST 5: What Is Generative Engine Optimization
// Targets: "what is GEO", "generative engine optimization explained",
//          "GEO vs SEO", "answer engine optimization",
//          "AEO explained", "do I need GEO"
// ============================================================
const post5 = {
  _id: 'blog-what-is-geo-guide',
  _type: 'blogPost',
  title: 'What Is Generative Engine Optimization (GEO)? The Complete Guide for Marketing Teams',
  slug: { _type: 'slug', current: 'what-is-generative-engine-optimization-geo' },
  excerpt: 'Generative Engine Optimization (GEO) is how brands get recommended by ChatGPT, Claude, Gemini, and Perplexity. This guide explains what GEO is, how it differs from SEO, why it matters in 2026, and how to implement it.',
  description: 'Complete guide to Generative Engine Optimization (GEO). Learn what GEO is, how it works, and why your brand needs it.',
  featured: true,
  category: 'geo-guides',
  tags: ['GEO', 'Generative Engine Optimization', 'AEO', 'Answer Engine Optimization', 'AI Search', 'Marketing Strategy', 'SEO vs GEO'],
  authors: [author],
  publishedDate: '2026-04-04T00:00:00.000Z',
  readTime: '16 min read',
  content: [
    p(text('In 2024, a team of researchers from Princeton, Georgia Tech, IIT Delhi, and the Allen Institute for AI published a paper that coined the term "Generative Engine Optimization" (GEO). Their insight was simple but profound: as AI-powered search engines replace traditional search, the rules for brand visibility must change with them.')),
    p(text('Two years later, GEO is no longer an academic concept. It is a $2 billion market with dedicated platforms, agencies, and in-house teams. Brands that invested early are dominating AI search results. Brands that did not are invisible to a growing share of potential customers.')),
    p(text('This guide explains what GEO is, how it works, how it differs from SEO and AEO, and what your marketing team needs to do about it.')),

    h2('GEO Defined'),
    quote('Generative Engine Optimization (GEO) is the practice of optimizing a brand\'s digital presence so that AI-powered search engines — including ChatGPT, Claude, Gemini, and Perplexity — cite, recommend, or mention the brand in their responses to user queries.'),
    p(text('In traditional SEO, you optimize to appear in a list of search results. In GEO, you optimize to become part of the answer itself.')),
    p(text('When someone asks ChatGPT "what is the best project management tool for remote teams?", ChatGPT does not return a list of links. It writes a paragraph recommending 3–5 tools by name, with brief explanations of why each is good. If your tool is in that paragraph, you get direct awareness, trust, and often a website visit. If you are not, you are invisible.')),

    h2('GEO vs. SEO: Key Differences'),
    p(text('The table below captures the fundamental differences:')),
    callout('info', 'GEO vs. SEO Comparison', 'What you optimize: SEO → web pages for search engine crawlers | GEO → brand presence across the entire web for AI models\n\nPrimary metric: SEO → keyword rank position (1–10) | GEO → mention rate and position in AI answers\n\nKey signals: SEO → backlinks, on-page optimization, page speed | GEO → entity clarity, third-party citations, structured data, factual specificity\n\nCompetition model: SEO → compete for position in a list of 10 | GEO → compete for inclusion in a synthesized answer of 3–5 brands\n\nTime to results: SEO → 3–6 months typical | GEO → 2–8 weeks for initial improvements\n\nMeasurement tools: SEO → Semrush, Ahrefs, Google Search Console | GEO → Soma AI, dedicated GEO platforms'),

    h2('GEO vs. AEO: Same Concept, Different Names'),
    p(text('Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) refer to essentially the same practice. AEO was the earlier term, emphasizing the "answer" that AI engines provide. GEO gained traction after the 2024 research paper and emphasizes the "generative" nature of AI search.')),
    p(text('In practice, both terms describe: monitoring what AI says about your brand, understanding why, and optimizing your digital presence to improve those responses. At Soma AI, we use both terms because marketers search for both.')),

    h2('Why GEO Matters in 2026'),
    h3('AI Search Is Replacing Traditional Search'),
    p(text('Gartner predicted that traditional search volume would drop 25% by 2026 due to AI assistants. That prediction is tracking. ChatGPT handles over 1 billion queries per week. Perplexity is the fastest-growing search product in Silicon Valley. Claude and Gemini are integrated into enterprise workflows. The shift is not hypothetical — it is measurable.')),
    h3('There Is No Page Two in AI Search'),
    p(text('In traditional search, ranking #11 means you are on page two — not great, but you exist. In AI search, there is no page two. ChatGPT mentions 3–5 brands. If you are not one of them, you are invisible. There is no organic equivalent of scrolling past the first page.')),
    h3('AI Recommendations Carry Extreme Trust'),
    p(text('Research shows that 62% of users trust AI recommendations as much as personal recommendations from friends. When ChatGPT says "Brand X is the leading platform for Y," that carries the weight of an expert endorsement. The trust premium of being mentioned by AI exceeds any ad or search listing.')),
    h3('First-Mover Advantage Is Real'),
    p(text('AI models learn from patterns. The brands that establish themselves as authorities now will be harder to displace as models continue training on web data that reflects their dominance. Waiting means competing against entrenched incumbents later.')),

    h2('How GEO Works: The Five Pillars'),
    h3('1. Entity Optimization'),
    p(text('Make your brand unambiguously identifiable to AI models. This means consistent naming, comprehensive structured data (JSON-LD), Wikidata entries, and a clear "about" narrative across all digital properties. If an AI model cannot confidently identify what your brand does, it will not recommend you.')),
    h3('2. Authority Building'),
    p(text('AI models determine authority through third-party signals: review sites (G2, Capterra, TrustRadius), industry publications, Wikipedia, and expert the web. Unlike SEO where your own content can rank, GEO requires others to vouch for you.')),
    h3('3. Content Optimization'),
    p(text('Create content that is factually specific, question-answer structured, regularly updated, and semantically rich. AI models extract information from well-structured content more effectively. Comparison pages, definitive guides, and FAQ sections are high-value GEO content.')),
    h3('4. Multi-Model Strategy'),
    p(text('Different AI models use different retrieval and ranking mechanisms. ChatGPT uses Bing, Gemini uses Google Search, Perplexity uses its own web crawler. A comprehensive GEO strategy optimizes for each model\'s specific signals.')),
    h3('5. Measurement and Iteration'),
    p(text('Track your brand\'s AI visibility with a dedicated GEO platform. Soma AI\'s LLM Visibility Index (LVI) provides a 0–100 score combining mention rate, position, sentiment, and citations across six AI models. Without measurement, optimization is guesswork.')),

    h2('Getting Started with GEO'),
    p(text('The fastest way to start is with a free AI visibility audit. Soma AI\'s audit takes your brand name and automatically:')),
    p(text('• Queries ChatGPT, Claude, Gemini, and Perplexity with relevant prompts')),
    p(text('• Captures every AI response and analyzes it for brand mentions')),
    p(text('• Shows which competitors AI recommends instead of you')),
    p(text('• Computes your initial LVI score')),
    p(text('• Identifies the highest-impact optimization opportunities')),
    p(text('Visit withsoma.ai/free-audit to get your free audit. It takes 30 seconds to submit and delivers results showing exactly where your brand stands in AI search today.')),

    h2('The Bottom Line'),
    p(text('GEO is not a future concern — it is a current reality. Every day that your brand is not visible in AI search, your competitors are capturing the attention and trust of your potential customers. The brands that invest in GEO today will own AI search tomorrow. The question is not whether GEO matters, but how quickly you will act.')),
    callout('success', 'Take the First Step', 'Get your free AI visibility audit at withsoma.ai/free-audit. See where your brand stands, which competitors AI recommends, and what you need to fix first.'),
  ],
  seo: {
    metaTitle: 'What Is Generative Engine Optimization (GEO)? Complete Guide | Soma AI',
    keywords: [
      'what is generative engine optimization',
      'what is GEO',
      'GEO explained',
      'generative engine optimization guide',
      'answer engine optimization',
      'what is AEO',
      'AEO explained',
      'GEO vs SEO',
      'AEO vs SEO',
      'do I need GEO',
      'AI search optimization',
      'how to optimize for AI search',
      'ChatGPT optimization',
      'generative engine optimization Princeton',
      'GEO marketing',
      'AI SEO guide',
    ],
  },
  isActive: true,
}

const allPosts = [post1, post2, post3, post4, post5]

async function migrate() {
  console.log(`\nMigrating ${allPosts.length} competitive blog posts to Sanity...\n`)

  for (const post of allPosts) {
    try {
      await client.createOrReplace(post)
      console.log(`✓ Created: ${post.title}`)
      console.log(`  → /blog/${post.slug._type === 'slug' ? post.slug.current : post.slug}`)
    } catch (err: any) {
      console.error(`✗ Failed: ${post.title}`)
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log('\nDone! Blog posts available at:')
  allPosts.forEach(p => {
    console.log(`  https://withsoma.ai/blog/${p.slug.current}`)
  })
}

migrate().catch(console.error)
