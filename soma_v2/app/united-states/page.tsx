import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MultiStructuredData, buildBreadcrumb } from '@/components/marketing/structured-data'
import { US_STATES } from '@/lib/data/us-states'
import { ArrowRight, MapPin, Building2, TrendingUp, Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Brand Visibility for US Businesses | Soma AI — GEO by State',
  description:
    'Soma AI helps American businesses monitor and improve their visibility in ChatGPT, Claude, Gemini, and Perplexity. Localized GEO strategies for every major US state and market.',
  keywords: [
    'US AI marketing', 'American GEO platform', 'United States AI visibility',
    'US brand monitoring AI', 'AI search optimization USA', 'GEO platform United States',
    'ChatGPT visibility US businesses', 'American AI search ranking',
    'Soma AI United States', 'AI brand monitoring US',
  ].join(', '),
  openGraph: {
    title: 'AI Brand Visibility for US Businesses | Soma AI',
    description: 'Monitor and improve your brand visibility across ChatGPT, Claude, Gemini, and Perplexity. State-by-state GEO strategies.',
    type: 'website',
    url: 'https://withsoma.ai/united-states',
  },
  alternates: { canonical: 'https://withsoma.ai/united-states' },
}

export default function UnitedStatesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MultiStructuredData
        schemas={[
          buildBreadcrumb([
            { name: 'Home', url: 'https://withsoma.ai' },
            { name: 'United States', url: 'https://withsoma.ai/united-states' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Soma AI — AI Brand Visibility for US Businesses',
            description: 'Generative Engine Optimization platform for American businesses. State-by-state AI search visibility monitoring and optimization.',
            url: 'https://withsoma.ai/united-states',
            isPartOf: { '@type': 'WebSite', name: 'Soma AI', url: 'https://withsoma.ai' },
            about: {
              '@type': 'Organization',
              name: 'Soma AI',
              url: 'https://withsoma.ai',
              description: 'Generative Engine Optimization (GEO) platform that monitors brand visibility across ChatGPT, Claude, Gemini, and Perplexity.',
            },
          },
        ]}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white pt-24 pb-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            {/* Visible breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1 text-sm text-gray-500" itemScope itemType="https://schema.org/BreadcrumbList">
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href="/" className="hover:text-black transition-colors" itemProp="item">
                    <span itemProp="name">Home</span>
                  </Link>
                  <meta itemProp="position" content="1" />
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="text-black font-medium" itemProp="name">United States</span>
                  <meta itemProp="position" content="2" />
                </li>
              </ol>
            </nav>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🇺🇸</span>
              <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-semibold">
                UNITED STATES
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
              AI Brand Visibility<br />
              <span className="text-gray-500">for American Businesses</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mb-8 leading-relaxed">
              Soma AI is headquartered in Southern Pines, North Carolina. We help US companies across
              every state monitor, measure, and improve how ChatGPT, Claude, Gemini, and Perplexity
              talk about their brand — with localized strategies for each market.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/free-audit"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Your Free AI Audit <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        {/* US-specific value props */}
        <section className="py-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-black" />
                </div>
                <div className="text-3xl font-bold text-black mb-2">15 States</div>
                <div className="text-sm text-gray-600">Localized GEO Strategies</div>
              </div>
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-black" />
                </div>
                <div className="text-3xl font-bold text-black mb-2">6 AI Models</div>
                <div className="text-sm text-gray-600">ChatGPT, Claude, Gemini, Perplexity, Grok, Llama</div>
              </div>
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div className="text-3xl font-bold text-black mb-2">+50 pts</div>
                <div className="text-sm text-gray-600">Average LVI Improvement</div>
              </div>
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <div className="text-3xl font-bold text-black mb-2">$49/mo</div>
                <div className="text-sm text-gray-600">Starting Price (USD)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why US businesses need GEO */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-8">
              Why US Companies Need Generative Engine Optimization
            </h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                The United States is the world&apos;s largest market for AI-powered search. Over 180 million
                Americans use ChatGPT, Claude, Gemini, or Perplexity regularly. When they ask these AI
                assistants for product recommendations, vendor comparisons, or service providers, the
                AI&apos;s answer shapes their decision — often before a Google search happens.
              </p>
              <p>
                For US businesses competing in local, regional, or national markets, AI visibility is
                now a critical marketing metric. A company that ranks #1 on Google but is absent from
                ChatGPT&apos;s recommendations loses a growing share of potential customers who never reach
                the search results page.
              </p>
              <p>
                Soma AI was built in the US, for the US market first. We understand the competitive
                landscape across industries from Silicon Valley SaaS to Wall Street fintech to Houston
                energy tech. Our state-specific strategies account for local market dynamics, industry
                concentrations, and regional competitive patterns.
              </p>
            </div>
          </div>
        </section>

        {/* State grid */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-4">Explore by State</h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl">
              Localized GEO strategies for the biggest tech and business markets in America.
              Each state page includes industry-specific insights, local case studies, and
              tailored optimization recommendations.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {US_STATES.map((state) => (
                <Link
                  key={state.slug}
                  href={`/united-states/${state.slug}`}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-black hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors">
                        {state.name}
                      </h3>
                      <p className="text-sm text-gray-500">{state.abbreviation} · {state.population}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {state.topIndustries.slice(0, 3).map((ind) => (
                      <span
                        key={ind}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{state.majorCities.join(', ')}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-black text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              See What AI Says About Your Brand
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get a free AI visibility audit showing your LVI score, competitor recommendations,
              and optimization opportunities across ChatGPT, Claude, Gemini, and Perplexity.
            </p>
            <Link
              href="/free-audit"
              className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Your Free Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
