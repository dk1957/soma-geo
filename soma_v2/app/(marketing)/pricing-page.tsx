/**
 * Pricing Page Component (Server Component)
 * ==========================================
 * Fetches and displays pricing data from Sanity CMS
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { PRICING_PAGE_QUERY } from '@/lib/sanity/queries'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PricingTier {
  name: string
  description?: string
  price: {
    amount?: number
    currency: string
    period: string
    displayText?: string
  }
  features: string[]
  cta: {
    text: string
    url: string
  }
  featured?: boolean
  badge?: string
}

interface PricingPageData {
  _id: string
  title: string
  hero: {
    headline: string
    subheadline?: string
    socialProof?: string
  }
  pricingTiers: PricingTier[]
  comparisonTable?: {
    enabled: boolean
    title?: string
    features?: Array<{
      feature: string
      availability: string[]
    }>
  }
  faq?: Array<{
    question: string
    answer: string
  }>
  finalCta?: {
    title: string
    description?: string
    primaryCta?: {
      text: string
      url: string
    }
    secondaryCta?: {
      text: string
      url: string
    }
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch<PricingPageData>(PRICING_PAGE_QUERY)

  if (!page) {
    return { title: 'Pricing Not Found' }
  }

  return {
    title: page.seo?.metaTitle || `${page.title} | Soma AI`,
    description: page.seo?.metaDescription || page.hero.subheadline,
    keywords: page.seo?.keywords?.join(', '),
    openGraph: {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.hero.subheadline || '',
      type: 'website',
    },
  }
}

export default async function PricingPageFromSanity() {
  const page = await client.fetch<PricingPageData>(PRICING_PAGE_QUERY)

  if (!page) {
    notFound()
  }

  const formatPrice = (tier: PricingTier) => {
    if (tier.price.displayText) {
      return tier.price.displayText
    }
    if (tier.price.amount === 0) {
      return 'Free'
    }
    if (!tier.price.amount) {
      return 'Custom'
    }
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      KES: 'KSh',
      GHS: '₵',
      ZAR: 'R',
      AED: 'د.إ',
      SAR: '﷼',
    }
    const symbol = currencySymbols[tier.price.currency] || tier.price.currency
    return `${symbol}${tier.price.amount}/${tier.price.period}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 border-b border-gray-200">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
              {page.hero.headline}
            </h1>

            {page.hero.subheadline && (
              <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                {page.hero.subheadline}
              </p>
            )}

            {page.hero.socialProof && (
              <p className="text-sm text-gray-500">
                {page.hero.socialProof}
              </p>
            )}
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className={`grid gap-8 ${
              page.pricingTiers.length === 3 
                ? 'md:grid-cols-3' 
                : page.pricingTiers.length === 4 
                ? 'md:grid-cols-2 lg:grid-cols-4' 
                : 'md:grid-cols-2'
            }`}>
              {page.pricingTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-lg border p-8 transition-all duration-200 ${
                    tier.featured
                      ? 'border-black shadow-lg bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-semibold px-4 py-1 rounded-full">
                      {tier.badge}
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-black mb-2">
                      {tier.name}
                    </h3>
                    {tier.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {tier.description}
                      </p>
                    )}
                    <div className="text-4xl font-bold text-black mb-2">
                      {formatPrice(tier)}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tier.cta.url} className="block">
                    <Button
                      className={`w-full transition-colors duration-200 ${
                        tier.featured
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-white hover:bg-black text-black hover:text-white border-2 border-black'
                      }`}
                    >
                      {tier.cta.text}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        {page.comparisonTable?.enabled && page.comparisonTable.features && (
          <section className="py-20 px-6 bg-gray-50 border-y border-gray-200">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-12 text-black">
                {page.comparisonTable.title || 'Compare Features'}
              </h2>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                        Feature
                      </th>
                      {page.pricingTiers.map((tier, idx) => (
                        <th
                          key={idx}
                          className="px-6 py-4 text-center text-sm font-semibold text-black"
                        >
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {page.comparisonTable.features.map((feature, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {feature.feature}
                        </td>
                        {page.pricingTiers.map((tier, tierIdx) => (
                          <td key={tierIdx} className="px-6 py-4 text-center">
                            {feature.availability.includes(tier.name) ? (
                              <Check className="w-5 h-5 text-black mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {page.faq && page.faq.length > 0 && (
          <section className="py-20 px-6">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-12 text-black">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {page.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                  >
                    <h3 className="font-bold text-black mb-3">
                      {item.question}
                    </h3>
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        {page.finalCta && (
          <section className="py-20 px-6 bg-black text-white border-t border-gray-200">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-bold mb-6">
                {page.finalCta.title}
              </h2>
              {page.finalCta.description && (
                <p className="text-xl text-gray-300 mb-8">
                  {page.finalCta.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {page.finalCta.primaryCta && (
                  <Link href={page.finalCta.primaryCta.url}>
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      {page.finalCta.primaryCta.text}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}
                {page.finalCta.secondaryCta && (
                  <Link href={page.finalCta.secondaryCta.url}>
                    <Button
                      size="lg"
                      className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
                    >
                      {page.finalCta.secondaryCta.text}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
