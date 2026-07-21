// Blog Sitemap Generator for Soma AI
// Dedicated sitemap for blog content and resources

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://withsoma.ai'
  const currentDate = new Date().toISOString()

  // Blog posts and content pages
  const blogPosts = [
    // Featured expert content
    { url: '/blog/geo-for-african-businesses', priority: '0.9', changefreq: 'monthly' },
    { url: '/blog/african-fintech-ai-search', priority: '0.9', changefreq: 'monthly' },
    
    // Competitive comparison articles
    { url: '/blog/best-aeo-tools-2026', priority: '0.9', changefreq: 'monthly' },
    { url: '/blog/semrush-ahrefs-cant-track-ai-visibility', priority: '0.9', changefreq: 'monthly' },
    { url: '/blog/brand-monitoring-ai-search-brandwatch-cision-sprout-social', priority: '0.9', changefreq: 'monthly' },
    { url: '/blog/how-to-rank-in-chatgpt-claude-gemini-2026', priority: '0.9', changefreq: 'monthly' },
    { url: '/blog/what-is-generative-engine-optimization-geo', priority: '0.9', changefreq: 'monthly' },

    // Core GEO content
    { url: '/blog/what-is-generative-engine-optimization', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/chatgpt-seo-optimization-guide', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/claude-ai-search-optimization', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/perplexity-ai-ranking-strategies', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/gemini-search-optimization-tips', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/ai-content-optimization-best-practices', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/future-of-ai-search-engines', priority: '0.7', changefreq: 'monthly' },
    { url: '/blog/llm-discoverability-strategies', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/brand-visibility-in-ai-era', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/geo-vs-seo-comparison', priority: '0.7', changefreq: 'monthly' },
  ]

  // Resource pages
  const resourcePages = [
    { url: '/resources/geo-checklist', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/ai-optimization-toolkit', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/llm-prompt-library', priority: '0.7', changefreq: 'weekly' },
    { url: '/resources/brand-mention-templates', priority: '0.7', changefreq: 'monthly' },
    { url: '/resources/ai-content-guidelines', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/competitive-analysis-framework', priority: '0.7', changefreq: 'monthly' },
  ]

  // Case studies
  const caseStudies = [
    { url: '/case-studies/fintech-geo-success', priority: '0.8', changefreq: 'monthly' },
    { url: '/case-studies/ecommerce-ai-optimization', priority: '0.8', changefreq: 'monthly' },
    { url: '/case-studies/saas-brand-visibility', priority: '0.8', changefreq: 'monthly' },
    { url: '/case-studies/agency-client-results', priority: '0.7', changefreq: 'monthly' },
  ]

  const allContentPages = [...blogPosts, ...resourcePages, ...caseStudies]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                           http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allContentPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}