/**
 * Reusable Legal Page Component from Sanity
 * ==========================================
 * 
 * Server component for legal documents (Privacy, Terms, etc.)
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PortableText } from '@portabletext/react'
import * as Icons from 'lucide-react'

interface LegalPageProps {
  slug: string
}

export const revalidate = 60

const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && slug.current == $slug][0]{
  _id,
  title,
  description,
  lastUpdated,
  effectiveDate,
  badges,
  sections,
  contactSection,
  seo
}`

async function getLegalPage(slug: string) {
  return await client.fetch(LEGAL_PAGE_QUERY, { slug })
}

export async function generateLegalMetadata({ slug }: LegalPageProps): Promise<Metadata> {
  const page = await getLegalPage(slug)
  
  if (!page) return {}

  return {
    title: page.seo?.metaTitle || `${page.title} | Soma AI`,
    description: page.seo?.metaDescription || page.description,
    keywords: page.seo?.keywords?.join(', '),
    openGraph: {
      title: page.seo?.metaTitle || page.title,
      description: page.seo?.metaDescription || page.description,
      images: page.seo?.ogImage?.asset?.url ? [{ url: page.seo.ogImage.asset.url }] : [],
    },
  }
}

export default async function LegalPageFromSanity({ slug }: LegalPageProps) {
  const page = await getLegalPage(slug)

  if (!page) {
    notFound()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {page.title}
            </h1>
            
            {page.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {page.description}
              </p>
            )}
            
            {/* Badges */}
            {page.badges && page.badges.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {page.badges.map((badge: any, i: number) => {
                  const IconComponent = badge.icon && (Icons as any)[badge.icon]
                  return (
                    <Badge key={i} variant="outline" className="px-4 py-2">
                      {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                      {badge.label}
                    </Badge>
                  )
                })}
              </div>
            )}
            
            {/* Dates */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {page.effectiveDate && (
                <div>
                  <span className="font-semibold">Effective Date:</span>{' '}
                  {formatDate(page.effectiveDate)}
                </div>
              )}
              {page.lastUpdated && (
                <div>
                  <span className="font-semibold">Last Updated:</span>{' '}
                  {formatDate(page.lastUpdated)}
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          {page.sections && page.sections.map((section: any, i: number) => (
            <section key={i} className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {section.title}
              </h2>
              
              {section.subsections && section.subsections.map((subsection: any, j: number) => (
                <div key={j} className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {subsection.title}
                  </h3>
                  
                  {subsection.content && (
                    <div className="prose prose-lg max-w-none text-muted-foreground">
                      <PortableText value={subsection.content} />
                    </div>
                  )}
                  
                  {subsection.bulletPoints && subsection.bulletPoints.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      {subsection.bulletPoints.map((point: string, k: number) => (
                        <li key={k}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}

          {/* Contact Section */}
          {page.contactSection && (
            <Card className="mt-12">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {page.contactSection.title}
                </h2>
                
                {page.contactSection.description && (
                  <p className="text-muted-foreground mb-4">
                    {page.contactSection.description}
                  </p>
                )}
                
                {page.contactSection.email && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">Email:</span>{' '}
                    <a href={`mailto:${page.contactSection.email}`} className="text-primary hover:underline">
                      {page.contactSection.email}
                    </a>
                  </p>
                )}
                
                {page.contactSection.address && (
                  <p className="text-muted-foreground mt-2">
                    <span className="font-semibold">Address:</span> {page.contactSection.address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
