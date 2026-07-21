// Resources Sitemap Generator for Soma AI
// Dedicated sitemap for tools, guides, and educational content

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://withsoma.ai'
  const currentDate = new Date().toISOString()

  // Tool and calculator pages
  const toolPages = [
    { url: '/tools/llm-discoverability-audit', priority: '0.9', changefreq: 'weekly' },
    { url: '/tools/ai-visibility-calculator', priority: '0.8', changefreq: 'weekly' },
    { url: '/tools/brand-mention-tracker', priority: '0.8', changefreq: 'weekly' },
    { url: '/tools/competitive-analysis-tool', priority: '0.8', changefreq: 'weekly' },
    { url: '/tools/content-optimization-checker', priority: '0.8', changefreq: 'weekly' },
    { url: '/tools/prompt-optimization-analyzer', priority: '0.7', changefreq: 'weekly' },
  ]

  // Guide and educational pages
  const guidePages = [
    { url: '/guides/geo-getting-started', priority: '0.9', changefreq: 'monthly' },
    { url: '/guides/chatgpt-optimization-complete-guide', priority: '0.9', changefreq: 'monthly' },
    { url: '/guides/claude-ai-visibility-guide', priority: '0.9', changefreq: 'monthly' },
    { url: '/guides/perplexity-ranking-guide', priority: '0.9', changefreq: 'monthly' },
    { url: '/guides/gemini-search-optimization', priority: '0.9', changefreq: 'monthly' },
    { url: '/guides/ai-content-strategy', priority: '0.8', changefreq: 'monthly' },
    { url: '/guides/brand-monitoring-in-ai-era', priority: '0.8', changefreq: 'monthly' },
    { url: '/guides/enterprise-geo-implementation', priority: '0.8', changefreq: 'monthly' },
  ]

  // Template and resource downloads
  const templatePages = [
    { url: '/templates/geo-audit-template', priority: '0.7', changefreq: 'monthly' },
    { url: '/templates/ai-content-brief-template', priority: '0.7', changefreq: 'monthly' },
    { url: '/templates/brand-mention-report-template', priority: '0.7', changefreq: 'monthly' },
    { url: '/templates/competitive-analysis-template', priority: '0.7', changefreq: 'monthly' },
  ]

  // API documentation for developers
  const apiPages = [
    { url: '/api-docs', priority: '0.6', changefreq: 'weekly' },
    { url: '/api-docs/brand-monitoring', priority: '0.6', changefreq: 'weekly' },
    { url: '/api-docs/competitive-analysis', priority: '0.6', changefreq: 'weekly' },
    { url: '/api-docs/content-optimization', priority: '0.6', changefreq: 'weekly' },
  ]

  const allResourcePages = [...toolPages, ...guidePages, ...templatePages, ...apiPages]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                           http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allResourcePages.map(page => `  <url>
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