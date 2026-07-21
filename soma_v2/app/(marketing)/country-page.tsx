/**
 * Reusable Country Page Component from Sanity
 * ===========================================
 * 
 * Server component that fetches and renders country-specific pages from Sanity.
 * Use this to replace static country landing pages.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import * as Icons from 'lucide-react'
import { ChevronRight } from 'lucide-react'

interface CountryPageProps {
  slug: string
}

export const revalidate = 60

const COUNTRY_PAGE_QUERY = `*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
  _id,
  country,
  slug,
  hero,
  stats,
  specialization,
  caseStudies,
  marketInsights,
  industries,
  cities,
  finalCta,
  seo,
  contactInfo
}`

async function getCountryPage(slug: string) {
  return await client.fetch(COUNTRY_PAGE_QUERY, { slug })
}

export async function generateCountryMetadata({ slug }: CountryPageProps): Promise<Metadata> {
  const page = await getCountryPage(slug)
  
  if (!page) return {}

  const metaTitle = page.seo?.metaTitle || `AI Brand Monitoring in ${page.country.name} | Soma AI`
  const metaDescription = page.seo?.metaDescription || page.hero?.subheadline
  const ogImage = page.seo?.ogImage?.asset?.url

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: page.seo?.keywords?.join(', '),
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
  }
}

export default async function CountryPageFromSanity({ slug }: CountryPageProps) {
  const page = await getCountryPage(slug)

  if (!page) {
    notFound()
  }

  const { country, hero, stats, specialization, caseStudies, marketInsights, finalCta } = page

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 lg:px-8">
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
                  <span className="text-black font-medium" itemProp="name">{country.name}</span>
                  <meta itemProp="position" content="2" />
                </li>
              </ol>
            </nav>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                {hero.badges && hero.badges.length > 0 && (
                  <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <span className="text-2xl">{country.flag}</span>
                    <span>{hero.badges[0]}</span>
                  </div>
                )}
                
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  {hero.headline}
                  <span className="text-primary block">{hero.headlineHighlight}</span>
                </h1>
                
                {hero.subheadline && (
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    {hero.subheadline}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {hero.ctaPrimary && (
                    <Button size="lg" asChild>
                      <Link href={hero.ctaPrimaryLink || '/signup'}>
                        {hero.ctaPrimary}
                        <Icons.ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  {hero.ctaSecondary && (
                    <Button variant="outline" size="lg" asChild>
                      <Link href={hero.ctaSecondaryLink || '#case-studies'}>
                        {hero.ctaSecondary}
                      </Link>
                    </Button>
                  )}
                </div>
                
                {hero.badges && hero.badges.length > 1 && (
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    {hero.badges.slice(1).map((badge: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="lg:pl-12">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">{country.flag}</div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {country.name} AI Visibility
                    </div>
                    <div className="text-3xl font-bold text-primary">Live Monitoring</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ChatGPT Mentions</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-black h-2 rounded-full w-20"></div>
                        </div>
                        <span className="text-sm font-semibold">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Claude Citations</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-black h-2 rounded-full w-18"></div>
                        </div>
                        <span className="text-sm font-semibold">78%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Market Position</span>
                      <span className="text-sm font-semibold text-black">Leading</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6" asChild>
                    <Link href="/signup">
                      Get Your {country.name} AI Audit
                      <Icons.ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <section className="py-16 bg-background border-b">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat: any, i: number) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Specialization Section */}
        {specialization?.features && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {specialization.title}
                </h2>
                {specialization.description && (
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    {specialization.description}
                  </p>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {specialization.features.map((feature: any, i: number) => {
                  const IconComponent = feature.icon && (Icons as any)[feature.icon]
                  const colorClass = 'bg-gray-100 text-black'
                  
                  return (
                    <div key={i} className="text-center group">
                      <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                        {IconComponent && <IconComponent className="h-8 w-8" />}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Case Studies Section */}
        {caseStudies?.stories && caseStudies.stories.length > 0 && (
          <section id="case-studies" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {caseStudies.title}
                </h2>
                {caseStudies.description && (
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    {caseStudies.description}
                  </p>
                )}
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12">
                {caseStudies.stories.map((story: any, i: number) => (
                  <Card key={i} className="p-8">
                    <div className="mb-6">
                      {story.category && (
                        <Badge variant="outline" className="mb-4">{story.category}</Badge>
                      )}
                      <h3 className="text-2xl font-bold mb-2 text-foreground">
                        {story.title || story.company}
                      </h3>
                      {story.subtitle && (
                        <p className="text-muted-foreground">{story.subtitle}</p>
                      )}
                    </div>
                    
                    {story.metrics && story.metrics.length > 0 && (
                      <div className="space-y-4 mb-6">
                        {story.metrics.map((metric: any, j: number) => (
                          <div key={j} className="flex justify-between">
                            <span className="text-muted-foreground">{metric.label}</span>
                            <span className="font-bold text-black">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {story.quote && (
                      <blockquote className="text-muted-foreground italic border-l-4 border-primary pl-4 mb-4">
                        {story.quote}
                      </blockquote>
                    )}
                    
                    {story.author && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold">{story.author}</span>
                        {story.authorTitle && `, ${story.authorTitle}`}
                        {story.company && ` • ${story.company}`}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Market Insights Section */}
        {marketInsights?.categories && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {marketInsights.title}
                </h2>
                {marketInsights.description && (
                  <p className="text-xl text-muted-foreground">{marketInsights.description}</p>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {marketInsights.categories.map((category: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-foreground mb-3">{category.title}</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {category.queries?.map((query: string, j: number) => (
                        <li key={j}>• {query}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA Section */}
        {finalCta && (
          <section className="py-20 bg-primary text-primary-foreground">
            <div className="container mx-auto px-6 lg:px-8 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                {finalCta.headline}
              </h2>
              {finalCta.description && (
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  {finalCta.description}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                {finalCta.ctaPrimary && (
                  <Button size="lg" variant="secondary" asChild>
                    <Link href={finalCta.ctaPrimaryLink || '/signup'}>
                      {finalCta.ctaPrimary}
                      <Icons.ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
                {finalCta.ctaSecondary && (
                  <Button size="lg" variant="outline" asChild>
                    <Link href={finalCta.ctaSecondaryLink || '/contact'}>
                      {finalCta.ctaSecondary}
                    </Link>
                  </Button>
                )}
              </div>
              
              {finalCta.features && finalCta.features.length > 0 && (
                <div className="text-sm opacity-75">
                  {finalCta.features.map((f: string, i: number) => (
                    <span key={i}>
                      ✓ {f}
                      {i < finalCta.features.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      
      <SiteFooter />
    </div>
  )
}
