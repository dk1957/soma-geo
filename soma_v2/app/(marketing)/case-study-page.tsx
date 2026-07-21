/**
 * Case Study Detail Page (Server Component)
 * ==========================================
 * Individual case study with full details
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { CASE_STUDY_QUERY } from '@/lib/sanity/queries'
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface CaseStudyData {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  description: string
  client: {
    name: string
    industry: string
    location: string
    companySize?: string
    logo?: any
  }
  challenge: {
    headline: string
    description: any[]
    metrics?: Array<{ label: string; value: string }>
  }
  solution: {
    headline: string
    description: any[]
    strategies?: Array<{ title: string; description: string }>
    timeline?: string
  }
  results: {
    headline: string
    description?: any[]
    metrics: Array<{ label: string; value: string; highlight?: boolean }>
    quote?: {
      text: string
      author: string
      position: string
      photo?: any
    }
  }
  content?: any[]
  category: string
  tags?: string[]
  featuredImage?: any
  relatedCaseStudies?: any[]
  seo?: {
    metaTitle?: string
    keywords?: string[]
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const caseStudy = await client.fetch<CaseStudyData>(CASE_STUDY_QUERY, {
    slug: params.slug,
  })

  if (!caseStudy) {
    return { title: 'Case Study Not Found' }
  }

  return {
    title: caseStudy.seo?.metaTitle || `${caseStudy.title} | Soma AI`,
    description: caseStudy.description || caseStudy.excerpt,
    keywords: caseStudy.seo?.keywords?.join(', '),
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.description || caseStudy.excerpt,
      type: 'article',
      images: caseStudy.featuredImage ? [urlFor(caseStudy.featuredImage).width(1200).url()] : [],
    },
  }
}

export default async function CaseStudyPage({ slug }: { slug: string }) {
  const caseStudy = await client.fetch<CaseStudyData>(CASE_STUDY_QUERY, { slug })

  if (!caseStudy) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-black text-white pt-24 pb-12 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-6">
            <div className="mb-4">
              <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-semibold">
                Case Study
              </span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight" itemProp="headline">
              {caseStudy.title}
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">{caseStudy.excerpt}</p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-gray-400">Client</p>
                <p className="font-semibold">{caseStudy.client.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Industry</p>
                <p className="font-semibold">{caseStudy.client.industry}</p>
              </div>
              <div>
                <p className="text-gray-400">Location</p>
                <p className="font-semibold">{caseStudy.client.location}</p>
              </div>
              {caseStudy.solution.timeline && (
                <div>
                  <p className="text-gray-400">Timeline</p>
                  <p className="font-semibold">{caseStudy.solution.timeline}</p>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* Challenge */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-4">
          <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">
            The Challenge
          </span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {caseStudy.challenge.headline}
        </h2>
        <div className="prose prose-lg max-w-none text-gray-700">
          <PortableText value={caseStudy.challenge.description} />
        </div>

        {caseStudy.challenge.metrics && caseStudy.challenge.metrics.length > 0 && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {caseStudy.challenge.metrics.map((metric, idx) => (
              <div key={idx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <p className="text-3xl font-bold text-black mb-2">{metric.value}</p>
                <p className="text-sm text-gray-700">{metric.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Solution */}
      <section className="bg-gray-50 py-16 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-4">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              The Solution
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {caseStudy.solution.headline}
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 mb-8">
            <PortableText value={caseStudy.solution.description} />
          </div>

          {caseStudy.solution.strategies && caseStudy.solution.strategies.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {caseStudy.solution.strategies.map((strategy, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-black transition-colors">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-black mb-2">{strategy.title}</h3>
                      <p className="text-sm text-gray-600">{strategy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-4">
          <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">
            The Results
          </span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {caseStudy.results.headline}
        </h2>
        
        {caseStudy.results.description && (
          <div className="prose prose-lg max-w-none text-gray-700 mb-8">
            <PortableText value={caseStudy.results.description} />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {caseStudy.results.metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-6 ${
                metric.highlight
                  ? 'bg-black text-white border-2 border-black'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              <p className={`text-4xl font-bold mb-2 ${metric.highlight ? 'text-white' : 'text-black'}`}>
                {metric.value}
              </p>
              <p className={`text-sm ${metric.highlight ? 'text-gray-300' : 'text-gray-700'}`}>
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        {caseStudy.results.quote && (
          <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
            <p className="text-xl text-black italic mb-6">
              "{caseStudy.results.quote.text}"
            </p>
            <div className="flex items-center gap-4">
              {caseStudy.results.quote.photo && (
                <img
                  src={urlFor(caseStudy.results.quote.photo).width(80).url()}
                  alt={caseStudy.results.quote.author}
                  className="w-16 h-16 rounded-full border-2 border-gray-300"
                />
              )}
              <div>
                <p className="font-bold text-black">{caseStudy.results.quote.author}</p>
                <p className="text-sm text-gray-600">{caseStudy.results.quote.position}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Related Case Studies */}
      {caseStudy.relatedCaseStudies && caseStudy.relatedCaseStudies.length > 0 && (
        <section className="bg-gray-50 py-16 border-y border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-8">More Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {caseStudy.relatedCaseStudies.map((related: any) => (
                <Link
                  key={related._id}
                  href={`/case-studies/${related.slug.current}`}
                  className="bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-md transition-all p-6"
                >
                  {related.featuredImage && (
                    <img
                      src={urlFor(related.featuredImage).width(400).url()}
                      alt={related.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-bold text-black mb-2">{related.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{related.excerpt}</p>
                  <div className="flex items-center text-black text-sm font-semibold">
                    Read Case Study <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready for Similar Results?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Let's transform your AI visibility together.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Success Story
          </Link>
        </div>
      </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
