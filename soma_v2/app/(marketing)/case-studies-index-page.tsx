/**
 * Case Studies Index Page (Server Component)
 * ===========================================
 * Displays all case studies with filtering
 */

import { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { CASE_STUDIES_INDEX_QUERY, FEATURED_CASE_STUDIES_QUERY } from '@/lib/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'

interface CaseStudy {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  client: {
    name: string
    industry: string
    location: string
    logo?: any
  }
  category: string
  tags?: string[]
  region?: string
  featured?: boolean
  featuredImage?: any
  results: {
    metrics: Array<{
      label: string
      value: string
      highlight?: boolean
    }>
  }
  publishedDate: string
}

export const metadata: Metadata = {
  title: 'Case Studies | Soma AI - GEO Success Stories',
  description:
    'See how leading brands achieve 300-600% increases in AI visibility with Soma AI. Real results from fintech, e-commerce, and SaaS companies worldwide.',
  openGraph: {
    title: 'Case Studies | Soma AI',
    description: 'Real GEO success stories with proven results',
    type: 'website',
  },
}

export default async function CaseStudiesIndexPage() {
  const [featured, allCaseStudies] = await Promise.all([
    client.fetch<CaseStudy[]>(FEATURED_CASE_STUDIES_QUERY),
    client.fetch<CaseStudy[]>(CASE_STUDIES_INDEX_QUERY),
  ])

  // Get featured IDs to avoid showing duplicates, but show all if list is small
  const featuredIds = new Set(featured.map(f => f._id))
  const regularCaseStudies = allCaseStudies.length > 3 
    ? allCaseStudies.filter((cs) => !featuredIds.has(cs._id))
    : allCaseStudies

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-black text-white pt-24 pb-16 border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-5xl font-bold mb-6">
              Real Results from Real Companies
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              See how leading brands transform their AI visibility with Soma AI.
              Proven strategies, measurable results.
            </p>
          </div>
        </section>

      {/* Featured Case Studies */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Success Stories</h2>
          <p className="text-gray-600 mb-8">Industry-leading transformations</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featured.map((cs) => (
              <Link
                key={cs._id}
                href={`/case-studies/${cs.slug.current}`}
                className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black hover:shadow-lg transition-all"
              >
                {cs.featuredImage && (
                  <img
                    src={urlFor(cs.featuredImage).width(600).url()}
                    alt={cs.featuredImage.alt || cs.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-semibold">
                    {cs.category.replace('-', ' ').toUpperCase()}
                  </span>
                  {cs.region && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {cs.region.replace('-', ' ')}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-black mb-3 group-hover:text-gray-600 transition-colors">
                  {cs.title}
                </h3>

                <p className="text-gray-700 text-sm mb-4">{cs.excerpt}</p>

                {/* Key Metric */}
                {cs.results?.metrics && cs.results.metrics.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-black">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-bold text-lg">
                        {cs.results.metrics.find((m) => m.highlight)?.value || cs.results.metrics[0].value}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {cs.results.metrics.find((m) => m.highlight)?.label || cs.results.metrics[0].label}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center text-black font-semibold text-sm group-hover:gap-2 transition-all">
                  Read Case Study <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Case Studies */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold text-black mb-8">
          {regularCaseStudies.length === allCaseStudies.length ? 'All Case Studies' : 'More Success Stories'}
        </h2>
        
        {regularCaseStudies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">More case studies coming soon!</p>
            <Link
              href="/contact"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Discuss Your Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {regularCaseStudies.map((cs) => (
            <article
              key={cs._id}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-black transition-all"
            >
              <Link href={`/case-studies/${cs.slug.current}`} className="block">
              {cs.featuredImage && (
                <img
                  src={urlFor(cs.featuredImage).width(800).url()}
                  alt={cs.featuredImage.alt || cs.title}
                  className="w-full h-56 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-semibold">
                    {cs.category.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-gray-600 transition-colors">
                  {cs.title}
                </h3>

                <p className="text-gray-600 mb-4">{cs.excerpt}</p>

                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{cs.client.name}</span>
                    <br />
                    {cs.client.industry} • {cs.client.location}
                  </p>
                </div>

                {cs.results?.metrics && cs.results.metrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {cs.results.metrics.slice(0, 2).map((metric, idx) => (
                      <div key={idx}>
                        <p className="text-2xl font-bold text-black">{metric.value}</p>
                        <p className="text-xs text-gray-600">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center text-black font-semibold group-hover:gap-2 transition-all">
                  View Full Case Study <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
              </Link>
            </article>
          ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join these industry leaders and transform your AI visibility.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
