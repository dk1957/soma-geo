/**
 * Blog Index Page Component (Server)
 * ===================================
 * Fetches and displays all blog posts from Sanity
 */

import { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { BLOG_INDEX_QUERY, FEATURED_POSTS_QUERY } from '@/lib/sanity/queries'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  description: string
  category: string
  tags?: string[]
  authors: Array<{
    name: string
    jobTitle: string
    image?: string
  }>
  publishedDate: string
  readTime: string
  featured?: boolean
}

export const metadata: Metadata = {
  title: 'Blog | Soma AI - Generative Engine Optimization Insights',
  description:
    'Expert insights on GEO, AI search optimization, and digital marketing strategies from the Soma AI team.',
  openGraph: {
    title: 'Blog | Soma AI',
    description:
      'Expert insights on GEO, AI search optimization, and digital marketing strategies',
    type: 'website',
  },
}

// Static blog posts not stored in Sanity
const STATIC_BLOG_POSTS: BlogPost[] = [
  {
    _id: 'static-what-is-aeo',
    title: 'What Is Answer Engine Optimization (AEO)? Everything You Need to Know',
    slug: { current: 'what-is-answer-engine-optimization-aeo' },
    excerpt: 'AEO is the practice of making your brand the answer AI search engines give. This guide covers what it means, how it differs from SEO, and what you need to do right now.',
    description: 'Complete guide to Answer Engine Optimization (AEO) for marketing teams.',
    category: 'geo-guides',
    tags: ['AEO', 'Answer Engine Optimization', 'AEO vs SEO', 'AI Search', 'GEO'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-12T00:00:00.000Z',
    readTime: '12 min read',
    featured: true,
  },
  {
    _id: 'static-chatgpt-recommend-brand',
    title: 'How to Get ChatGPT to Recommend Your Brand: A Step-by-Step Guide',
    slug: { current: 'how-to-get-chatgpt-to-recommend-your-brand' },
    excerpt: 'AI models like ChatGPT, Claude, and Gemini now influence how millions of people choose products. This guide shows you exactly how these models decide what to recommend — and what you can do about it.',
    description: 'Step-by-step guide to getting AI search engines to recommend your brand.',
    category: 'geo-guides',
    tags: ['ChatGPT', 'AI Search', 'Brand Recommendations', 'AEO', 'GEO'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-12T00:00:00.000Z',
    readTime: '15 min read',
    featured: true,
  },
  {
    _id: 'static-aeo-africa',
    title: 'AEO and GEO Strategy for African Businesses: The Definitive Guide to AI Search Visibility in Africa',
    slug: { current: 'aeo-geo-strategy-africa' },
    excerpt: 'AI search adoption is growing fast across Africa, but almost no African brands are optimising for it. That creates a rare first-mover opportunity. Here is the playbook for African businesses.',
    description: 'Complete AEO and GEO strategy guide for businesses in Africa.',
    category: 'regional-insights',
    tags: ['Africa', 'AEO', 'GEO', 'South Africa', 'Nigeria', 'Ghana', 'Kenya'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-12T00:00:00.000Z',
    readTime: '16 min read',
    featured: true,
  },
  {
    _id: 'static-best-aeo-tools-2026',
    title: 'Best Answer Engine Optimization (AEO) Tools in 2026: A Complete Comparison',
    slug: { current: 'best-aeo-tools-2026' },
    excerpt: 'Compare the top AEO tools including Soma AI, Peec.ai, The Prompting Company, Semrush, and Ahrefs. Discover which GEO platform gives you the best AI search visibility.',
    description: 'Complete comparison of AEO and GEO tools in 2026.',
    category: 'comparisons',
    tags: ['AEO Tools', 'GEO Tools', 'AI Search', 'Tool Comparison'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-10T00:00:00.000Z',
    readTime: '18 min read',
    featured: true,
  },
  {
    _id: 'static-semrush-ahrefs',
    title: "Why Semrush and Ahrefs Can't Track Your AI Search Visibility",
    slug: { current: 'semrush-ahrefs-cant-track-ai-visibility' },
    excerpt: "Semrush and Ahrefs are excellent SEO tools. But they were built for Google's ten blue links. Here's why they can't solve the AI search challenge.",
    description: 'Why traditional SEO tools cannot track AI search visibility.',
    category: 'industry-analysis',
    tags: ['Semrush', 'Ahrefs', 'SEO Tools', 'AI Search'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-08T00:00:00.000Z',
    readTime: '14 min read',
    featured: true,
  },
  {
    _id: 'static-brand-monitoring',
    title: 'Brand Monitoring in the Age of AI Search: Why Brandwatch, Cision, and Sprout Social Are Not Enough',
    slug: { current: 'brand-monitoring-ai-search-brandwatch-cision-sprout-social' },
    excerpt: "Your brand monitoring stack covers social media and news. But when ChatGPT recommends your competitor, none of your tools will catch it.",
    description: 'Why traditional brand monitoring tools miss AI search visibility.',
    category: 'industry-analysis',
    tags: ['Brand Monitoring', 'Brandwatch', 'Cision', 'Sprout Social'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-06T00:00:00.000Z',
    readTime: '16 min read',
  },
  {
    _id: 'static-how-to-rank',
    title: 'How to Rank in ChatGPT, Claude & Gemini: The Definitive GEO Strategy Guide for 2026',
    slug: { current: 'how-to-rank-in-chatgpt-claude-gemini-2026' },
    excerpt: 'Everything we know about how AI models choose which brands to recommend. A practical guide covering entity optimization, structured data, and the signals that move the needle.',
    description: 'Step-by-step guide to ranking in AI search engines.',
    category: 'geo-strategy',
    tags: ['GEO Strategy', 'ChatGPT', 'Claude', 'Gemini'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-04T00:00:00.000Z',
    readTime: '22 min read',
  },
  {
    _id: 'static-what-is-geo',
    title: 'What Is Generative Engine Optimization (GEO)? The Complete Guide for Marketing Teams',
    slug: { current: 'what-is-generative-engine-optimization-geo' },
    excerpt: 'GEO is the practice of making your brand the answer AI gives when people ask relevant questions. This guide covers everything marketing teams need to know.',
    description: 'Complete guide to Generative Engine Optimization for marketing teams.',
    category: 'geo-strategy',
    tags: ['GEO', 'AI Search', 'Marketing Strategy', 'Complete Guide'],
    authors: [{ name: 'Soma AI Marketing Team', jobTitle: 'Soma AI' }],
    publishedDate: '2026-04-02T00:00:00.000Z',
    readTime: '20 min read',
  },
]

export default async function BlogIndexPage() {
  const [featuredPosts, allPosts] = await Promise.all([
    client.fetch<BlogPost[]>(FEATURED_POSTS_QUERY),
    client.fetch<BlogPost[]>(BLOG_INDEX_QUERY),
  ])

  // Merge Sanity posts with static posts, sort by date
  const staticFeatured = STATIC_BLOG_POSTS.filter((p) => p.featured)
  const mergedFeatured = [...featuredPosts, ...staticFeatured].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  )

  const allMerged = [...allPosts, ...STATIC_BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  )
  const regularPosts = allMerged.filter((post: BlogPost) => !post.featured)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white pt-24 pb-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-5xl font-bold text-black mb-6">
              Insights on Generative Engine Optimization
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Expert analysis, case studies, and strategies for dominating AI search results.
              Written by the Soma AI team.
            </p>
          </div>
        </section>

        {/* Featured Posts */}
        {mergedFeatured.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-black mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {mergedFeatured.map((post: BlogPost) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="group bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-black hover:shadow-lg transition-all"
                >
                  {/* Category Badge */}
                  <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-semibold mb-4">
                    {post.category.replace('-', ' ').toUpperCase()}
                  </span>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-gray-600 transition-colors">
                    {post.title}
                  </h3>

                {/* Excerpt */}
                <p className="text-gray-700 mb-6 leading-relaxed">{post.excerpt}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(post.publishedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                  {/* Authors */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      {post.authors[0]?.image && (
                        <img
                          src={post.authors[0].image}
                          alt={post.authors[0].name}
                          className="w-10 h-10 rounded-full border-2 border-gray-300"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-black">
                          {post.authors.map((a: { name: string }) => a.name).join(' & ')}
                        </p>
                        <p className="text-sm text-gray-600">{post.authors[0]?.jobTitle}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-black mb-8">All Articles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {regularPosts.map((post: BlogPost) => (
              <article key={post._id} className="group bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-black transition-all">
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="block p-6"
                >
                {/* Category */}
                <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-semibold mb-4">
                  {post.category.replace('-', ' ').toUpperCase()}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-black mb-3 group-hover:text-gray-600 transition-colors">
                  {post.title}
                </h3>

              {/* Excerpt */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{new Date(post.publishedDate).toLocaleDateString()}</span>
                <span>{post.readTime}</span>
              </div>

                {/* Author */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-black font-medium">
                    {post.authors[0]?.name}
                    {post.authors.length > 1 && ` +${post.authors.length - 1}`}
                  </p>
                </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {regularPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No articles found. Check back soon!</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Stay Updated on AI Search Trends</h2>
            <p className="text-xl mb-8 text-gray-300">
              Subscribe to get the latest insights on Generative Engine Optimization.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe Now
            </Link>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
