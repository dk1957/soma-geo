/**
 * Reusable Sanity Page Component
 * ===============================
 * 
 * Server component that fetches and renders pages from Sanity.
 * Use this as a template for dynamic marketing pages.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { PAGE_QUERY } from '@/lib/sanity/queries'
import { PortableTextRenderer } from '@/components/marketing/portable-text-renderer'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import * as Icons from 'lucide-react'

interface SanityPageProps {
  slug: string
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

async function getPage(slug: string) {
  return await client.fetch(PAGE_QUERY, { slug })
}

export async function generateMetadata({ slug }: SanityPageProps): Promise<Metadata> {
  const page = await getPage(slug)
  
  if (!page) return {}

  const metaTitle = page.seo?.metaTitle || page.title
  const metaDescription = page.seo?.metaDescription || page.description
  const ogImage = page.seo?.ogImage?.asset?.url || page.hero?.image?.asset?.url

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: ogImage ? [ogImage] : [],
    },
    robots: page.seo?.noIndex ? 'noindex,nofollow' : 'index,follow',
  }
}

export default async function SanityPage({ slug }: SanityPageProps) {
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  const { hero, features, content } = page

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        {hero && (
          <section className="relative py-20 px-4 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
                    {hero.headline}
                  </h1>
                  {hero.subheadline && (
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      {hero.subheadline}
                    </p>
                  )}
                  {hero.ctaText && hero.ctaLink && (
                    <Link
                      href={hero.ctaLink}
                      className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
                    >
                      {hero.ctaText}
                    </Link>
                  )}
                </div>
                {hero.image?.asset && (
                  <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                    <Image
                      src={urlFor(hero.image).width(800).height(600).url()}
                      alt={hero.image.alt || hero.headline}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {features && features.length > 0 && (
          <section className="py-20 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature: any, index: number) => {
                  const IconComponent = feature.icon && (Icons as any)[feature.icon]
                  
                  return (
                    <div
                      key={index}
                      className="p-6 bg-white border border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all"
                    >
                      {IconComponent && (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <IconComponent className="w-6 h-6 text-black" />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-black mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        {content && content.length > 0 && (
          <section className="py-20 px-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <PortableTextRenderer content={content} />
            </div>
          </section>
        )}
      </main>
      
      <SiteFooter />
    </div>
  )
}
