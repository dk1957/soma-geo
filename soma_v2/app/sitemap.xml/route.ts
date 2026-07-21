// Sitemap Generator for Soma AI
// This will automatically generate XML sitemaps for better search engine crawling

import { NextResponse } from 'next/server'
import { getAllStateSlugs } from '@/lib/data/us-states'

export async function GET() {
  const baseUrl = 'https://withsoma.ai'
  const currentDate = new Date().toISOString()

  // Core pages with priorities and update frequencies
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'weekly' }, // homepage
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
    { url: '/contact', priority: '0.9', changefreq: 'weekly' },
    { url: '/signin', priority: '0.8', changefreq: 'monthly' },
    { url: '/signup', priority: '0.9', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms', priority: '0.5', changefreq: 'monthly' },
    { url: '/faq', priority: '0.7', changefreq: 'monthly' },
    { url: '/solutions', priority: '0.9', changefreq: 'weekly' },
    { url: '/free-audit', priority: '1.0', changefreq: 'weekly' },
    { url: '/onboarding', priority: '0.7', changefreq: 'monthly' },
    { url: '/dashboard', priority: '0.6', changefreq: 'daily' },
    { url: '/competitive', priority: '0.8', changefreq: 'weekly' },
    { url: '/reports', priority: '0.7', changefreq: 'daily' },
  ]

  // Regional landing pages for SEO
  const regionalPages = [
    { url: '/south-africa', priority: '0.9', changefreq: 'weekly' },
    { url: '/nigeria', priority: '0.9', changefreq: 'weekly' },
    { url: '/united-kingdom', priority: '0.9', changefreq: 'weekly' },
    { url: '/uae', priority: '0.9', changefreq: 'weekly' },
    { url: '/saudi-arabia', priority: '0.8', changefreq: 'weekly' },
    { url: '/kenya', priority: '0.8', changefreq: 'weekly' },
    { url: '/ghana', priority: '0.8', changefreq: 'weekly' },
    { url: '/germany', priority: '0.8', changefreq: 'weekly' },
  ]

  // US state pages
  const usPages = [
    { url: '/united-states', priority: '0.9', changefreq: 'weekly' },
    ...getAllStateSlugs().map((slug) => ({
      url: `/united-states/${slug}`,
      priority: '0.8',
      changefreq: 'weekly' as const,
    })),
  ]

  // Industry-specific pages
  const industryPages = [
    { url: '/fintech', priority: '0.8', changefreq: 'weekly' },
    { url: '/e-commerce', priority: '0.8', changefreq: 'weekly' },
    { url: '/saas', priority: '0.8', changefreq: 'weekly' },
    { url: '/agencies', priority: '0.8', changefreq: 'weekly' },
    { url: '/enterprise', priority: '0.8', changefreq: 'weekly' },
  ]

  // Resources and content pages
  const resourcePages = [
    { url: '/resources', priority: '0.7', changefreq: 'weekly' },
    { url: '/case-studies', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.7', changefreq: 'daily' },
    { url: '/guides', priority: '0.7', changefreq: 'weekly' },
    { url: '/ai-optimization-guide', priority: '0.8', changefreq: 'monthly' },
    { url: '/llm-discoverability-index', priority: '0.8', changefreq: 'monthly' },
  ]

  const allPages = [...staticPages, ...regionalPages, ...usPages, ...industryPages, ...resourcePages]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                           http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => `  <url>
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