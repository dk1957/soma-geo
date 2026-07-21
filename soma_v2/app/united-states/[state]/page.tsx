import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MultiStructuredData, buildBreadcrumb } from '@/components/marketing/structured-data'
import { US_STATES, getStateBySlug, getAllStateSlugs } from '@/lib/data/us-states'
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'

export function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) return { title: 'Not Found' }

  return {
    title: state.metaTitle,
    description: state.metaDescription,
    keywords: state.keywords.join(', '),
    openGraph: {
      title: state.metaTitle,
      description: state.metaDescription,
      type: 'website',
      url: `https://withsoma.ai/united-states/${state.slug}`,
    },
    alternates: { canonical: `https://withsoma.ai/united-states/${state.slug}` },
  }
}

export default async function USStatePage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MultiStructuredData
        schemas={[
          buildBreadcrumb([
            { name: 'Home', url: 'https://withsoma.ai' },
            { name: 'United States', url: 'https://withsoma.ai/united-states' },
            { name: state.name, url: `https://withsoma.ai/united-states/${state.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Soma AI — AI Brand Visibility in ${state.name}`,
            description: state.metaDescription,
            url: `https://withsoma.ai/united-states/${state.slug}`,
            isPartOf: { '@type': 'WebSite', name: 'Soma AI', url: 'https://withsoma.ai' },
            about: {
              '@type': 'Organization',
              name: 'Soma AI',
              url: 'https://withsoma.ai',
              description:
                'Generative Engine Optimization (GEO) platform — withsoma.ai — that monitors brand visibility across ChatGPT, Claude, Gemini, and Perplexity. Not to be confused with Soma Intimates, Soma FM, SOMA San Francisco, or any other entity.',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `AI Brand Visibility Monitoring — ${state.name}`,
            description: `Generative Engine Optimization (GEO) services for ${state.name} businesses. Monitors brand visibility across ChatGPT, Claude, Gemini, Perplexity, Grok, and Llama.`,
            provider: {
              '@type': 'Organization',
              name: 'Soma AI',
              url: 'https://withsoma.ai',
            },
            areaServed: {
              '@type': 'State',
              name: state.name,
              containedInPlace: { '@type': 'Country', name: 'United States' },
            },
            serviceType: 'Generative Engine Optimization',
          },
        ]}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white pt-24 pb-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            {/* Visible breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center gap-1 text-sm text-gray-500" itemScope itemType="https://schema.org/BreadcrumbList">
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href="/" className="hover:text-black transition-colors" itemProp="item">
                    <span itemProp="name">Home</span>
                  </Link>
                  <meta itemProp="position" content="1" />
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href="/united-states" className="hover:text-black transition-colors" itemProp="item">
                    <span itemProp="name">United States</span>
                  </Link>
                  <meta itemProp="position" content="2" />
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="text-black font-medium" itemProp="name">{state.name}</span>
                  <meta itemProp="position" content="3" />
                </li>
              </ol>
            </nav>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">🇺🇸</span>
                  <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-sm font-semibold">
                    {state.abbreviation} · {state.name.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                  AI Brand Visibility<br />
                  <span className="text-gray-500">for {state.name} Businesses</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {state.aiAdoptionContext}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/free-audit"
                    className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Get Your {state.abbreviation} AI Audit <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-black rounded-full animate-pulse" /> 6 AI Models Monitored</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-black rounded-full animate-pulse" /> {state.majorCities[0]}-focused prompts</span>
                </div>
              </div>

              {/* Stats card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="text-center mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">{state.name} AI Visibility</div>
                  <div className="text-3xl font-bold text-black">Live Monitoring</div>
                </div>
                <div className="space-y-5">
                  {state.stats.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                      <span className="text-sm font-bold text-black">{stat.value}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/free-audit"
                  className="flex items-center justify-center w-full mt-6 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Get Your {state.name} AI Audit <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* GEO Opportunity */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-6">
              The GEO Opportunity in {state.name}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">{state.geoOpportunity}</p>
            <p className="text-lg text-gray-700 leading-relaxed">{state.localCompetitorLandscape}</p>
          </div>
        </section>

        {/* Industries */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-4">
              {state.name} Industries We Serve
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl">
              Soma AI provides industry-specific GEO strategies tailored to {state.name}&apos;s
              leading sectors.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {state.industries.map((ind, i) => {
                const IconComponent = (Icons as any)[ind.icon] || Icons.Building2
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-8 text-center group hover:border-black transition-colors">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-4">{ind.name}</h3>
                    <p className="text-gray-600">{ind.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Key prompts */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-4">
              What {state.name} Buyers Ask AI
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              These are the kinds of prompts your potential customers in {state.name} are asking
              ChatGPT, Claude, and Perplexity right now. If your brand is not in the answer, you are
              invisible to these buyers.
            </p>
            <div className="space-y-4">
              {state.keyPrompts.map((prompt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-gray-50 rounded-lg p-5 border border-gray-200"
                >
                  <div className="bg-black text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-gray-800 font-medium italic">&quot;{prompt}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case study */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-8">
              {state.name} Case Study
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {state.caseStudyIndustry}
                </span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">The Challenge</h3>
              <p className="text-gray-700 mb-8">{state.caseStudyChallenge}</p>

              <h3 className="text-xl font-bold text-black mb-4">Results with Soma AI</h3>
              <div className="space-y-3">
                {state.caseStudyResults.map((result, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{result}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Other states */}
        <section className="py-16 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-lg font-bold text-black mb-6">Explore Other US Markets</h3>
            <div className="flex flex-wrap gap-3">
              {US_STATES.filter((s) => s.slug !== state.slug)
                .slice(0, 8)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/united-states/${s.slug}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-black hover:text-white transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              <Link
                href="/united-states"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-black hover:text-white transition-colors"
              >
                All States →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-black text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              See What AI Says About Your Brand in {state.name}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get a free AI visibility audit showing your LVI score, competitor recommendations,
              and {state.name}-specific optimization opportunities.
            </p>
            <Link
              href="/free-audit"
              className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Your Free {state.abbreviation} Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
