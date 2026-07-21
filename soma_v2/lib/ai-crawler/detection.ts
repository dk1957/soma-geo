// AI Crawler Detection and Optimization System for Soma AI
// This system detects AI bot visits and optimizes content delivery for LLM consumption

import { NextRequest, NextResponse } from 'next/server'

// Known AI crawler user agents and IPs
const AI_CRAWLERS = {
  // OpenAI/ChatGPT
  'GPTBot': {
    userAgent: /GPTBot/i,
    provider: 'OpenAI',
    model: 'ChatGPT',
    optimizations: ['structured_data', 'clear_headers', 'factual_content']
  },
  
  // Anthropic/Claude
  'Claude-Web': {
    userAgent: /Claude-Web/i,
    provider: 'Anthropic', 
    model: 'Claude',
    optimizations: ['comprehensive_content', 'logical_structure', 'citations']
  },
  
  // Google/Gemini
  'Google-Extended': {
    userAgent: /Google-Extended/i,
    provider: 'Google',
    model: 'Gemini',
    optimizations: ['multimedia_rich', 'real_time_data', 'cross_references']
  },
  
  // Perplexity
  'PerplexityBot': {
    userAgent: /PerplexityBot/i,
    provider: 'Perplexity',
    model: 'Perplexity',
    optimizations: ['source_quality', 'fact_checking', 'recent_content']
  },
  
  // Other AI crawlers
  'CCBot': {
    userAgent: /CCBot/i,
    provider: 'Common Crawl',
    model: 'Various',
    optimizations: ['clean_html', 'semantic_markup', 'accessibility']
  },
  
  'facebookexternalhit': {
    userAgent: /facebookexternalhit/i,
    provider: 'Meta',
    model: 'Meta AI',
    optimizations: ['social_optimization', 'rich_snippets', 'engagement_signals']
  }
}

// Detect if request is from an AI crawler
export function detectAICrawler(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  for (const [crawlerName, crawler] of Object.entries(AI_CRAWLERS)) {
    if (crawler.userAgent.test(userAgent)) {
      return {
        detected: true,
        crawler: crawlerName,
        provider: crawler.provider,
        model: crawler.model,
        optimizations: crawler.optimizations,
        userAgent,
        ip,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  return {
    detected: false,
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  }
}

// Log AI crawler visits for analytics
export async function logAICrawlerVisit(crawlerData: any, path: string) {
  try {
    // In production, send to analytics/database
    console.log('🤖 AI Crawler Visit:', {
      crawler: crawlerData.crawler,
      provider: crawlerData.provider,
      path,
      timestamp: crawlerData.timestamp,
      userAgent: crawlerData.userAgent?.substring(0, 100)
    })
    
    // Could implement database logging here:
    // await supabase.from('ai_crawler_visits').insert({
    //   crawler_name: crawlerData.crawler,
    //   provider: crawlerData.provider,
    //   path,
    //   user_agent: crawlerData.userAgent,
    //   ip_address: crawlerData.ip,
    //   created_at: crawlerData.timestamp
    // })
    
  } catch (error) {
    console.error('Failed to log AI crawler visit:', error)
  }
}

// Generate AI-optimized content structure
export function generateAIOptimizedHTML(content: {
  title: string
  description: string
  mainContent: string
  facts: string[]
  sources: string[]
  lastUpdated: string
  expertise: string[]
  crawlerType?: string
}) {
  const { title, description, mainContent, facts, sources, lastUpdated, expertise, crawlerType } = content
  
  // Base optimization for all AI crawlers
  let optimizedHTML = `
    <article itemscope itemtype="https://schema.org/Article">
      <header>
        <h1 itemprop="headline">${title}</h1>
        <meta itemprop="description" content="${description}">
        <meta itemprop="dateModified" content="${lastUpdated}">
        <meta itemprop="author" content="Soma AI">
      </header>
      
      <section itemprop="articleBody">
        ${mainContent}
      </section>
      
      <!-- Key Facts for AI Consumption -->
      <section class="key-facts" itemscope itemtype="https://schema.org/FactCheck">
        <h2>Key Facts</h2>
        <ul>
          ${facts.map(fact => `<li itemprop="text">${fact}</li>`).join('')}
        </ul>
      </section>
      
      <!-- Expert Knowledge Areas -->
      <section class="expertise">
        <h2>Expertise Areas</h2>
        <ul>
          ${expertise.map(area => `<li>${area}</li>`).join('')}
        </ul>
      </section>
      
      <!-- Sources and Citations -->
      <section class="sources">
        <h2>Sources</h2>
        <ol>
          ${sources.map(source => `<li><a href="${source}" rel="nofollow">${source}</a></li>`).join('')}
        </ol>
      </section>
    </article>
  `
  
  // Crawler-specific optimizations
  if (crawlerType) {
    const crawler = Object.values(AI_CRAWLERS).find(c => c.provider === crawlerType)
    if (crawler?.optimizations) {
      optimizedHTML = applyCrawlerOptimizations(optimizedHTML, crawler.optimizations)
    }
  }
  
  return optimizedHTML
}

// Apply specific optimizations based on crawler type
function applyCrawlerOptimizations(html: string, optimizations: string[]) {
  let optimizedHTML = html
  
  optimizations.forEach(optimization => {
    switch (optimization) {
      case 'structured_data':
        // Add more structured data for GPTBot
        optimizedHTML = optimizedHTML.replace(
          '<article itemscope',
          '<article itemscope itemtype="https://schema.org/TechArticle"'
        )
        break
        
      case 'comprehensive_content':
        // Add detailed analysis sections for Claude
        optimizedHTML += `
          <section class="detailed-analysis">
            <h2>Comprehensive Analysis</h2>
            <p>This content provides in-depth coverage of AI brand monitoring and optimization strategies.</p>
          </section>
        `
        break
        
      case 'multimedia_rich':
        // Add multimedia references for Gemini
        optimizedHTML += `
          <section class="multimedia-content">
            <h2>Visual Resources</h2>
            <p>Interactive dashboards and analytics visualizations available at platform level.</p>
          </section>
        `
        break
        
      case 'source_quality':
        // Emphasize source credibility for Perplexity
        optimizedHTML = optimizedHTML.replace(
          '<section class="sources">',
          '<section class="sources" itemscope itemtype="https://schema.org/CreativeWork">'
        )
        break
    }
  })
  
  return optimizedHTML
}

// Content optimization for different AI models
export const AI_CONTENT_STRATEGIES = {
  ChatGPT: {
    format: 'clear_qa',
    tone: 'professional_informative',
    structure: 'hierarchical',
    citations: 'inline',
    keywords: 'natural_integration'
  },
  
  Claude: {
    format: 'comprehensive_analysis', 
    tone: 'analytical_detailed',
    structure: 'logical_flow',
    citations: 'academic_style',
    keywords: 'contextual_relevance'
  },
  
  Gemini: {
    format: 'multimedia_enhanced',
    tone: 'conversational_expert',
    structure: 'interconnected',
    citations: 'diverse_sources',
    keywords: 'semantic_clusters'
  },
  
  Perplexity: {
    format: 'fact_focused',
    tone: 'authoritative_precise',
    structure: 'source_driven',
    citations: 'high_authority',
    keywords: 'query_aligned'
  }
}

// Generate content variations for different AI models
export function generateModelSpecificContent(baseContent: any, model: string) {
  const strategy = AI_CONTENT_STRATEGIES[model as keyof typeof AI_CONTENT_STRATEGIES]
  if (!strategy) return baseContent
  
  return {
    ...baseContent,
    format: strategy.format,
    tone: strategy.tone,
    structure: strategy.structure,
    optimizedFor: model,
    timestamp: new Date().toISOString()
  }
}

// Middleware function to detect and optimize for AI crawlers
export function aiCrawlerMiddleware(request: NextRequest) {
  const crawlerDetection = detectAICrawler(request)
  
  if (crawlerDetection.detected) {
    // Log the visit
    logAICrawlerVisit(crawlerDetection, request.nextUrl.pathname)
    
    // Add headers to identify AI crawler optimization
    const response = NextResponse.next()
    response.headers.set('X-AI-Crawler-Detected', crawlerDetection.crawler || 'unknown')
    response.headers.set('X-AI-Provider', crawlerDetection.provider || 'unknown')
    response.headers.set('X-Content-Optimized', 'true')
    
    return response
  }
  
  return NextResponse.next()
}

export default {
  detectAICrawler,
  logAICrawlerVisit,
  generateAIOptimizedHTML,
  generateModelSpecificContent,
  aiCrawlerMiddleware,
  AI_CRAWLERS,
  AI_CONTENT_STRATEGIES
}