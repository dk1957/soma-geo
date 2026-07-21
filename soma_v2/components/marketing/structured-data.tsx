// Structured Data Component for AI Crawlers
import { ORG_CONTACT, SOCIAL_LINKS, ORGANIZATION_NAME } from '@/lib/constants/contact'
// Provides JSON-LD structured data for better content understanding

// ================= Enhanced Structured Data Utilities =================
// Added multi-schema support and helper builders for richer semantic coverage.

export type BaseSchemaTypes =
  | 'Organization'
  | 'WebApplication'
  | 'SoftwareApplication'
  | 'Article'
  | 'Service'
  | 'HowTo'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'ItemList'
  | 'SiteNavigationElement'
  | 'WebSite'
  | 'Blog'
  | 'BlogPosting'
  | 'Person'
  | 'CreativeWorkSeries'

interface StructuredDataProps<T = Record<string, any>> {
  type: BaseSchemaTypes
  data?: T
  // Optionally pass an already-built schema object (overrides type+data composition)
  schemaObject?: Record<string, any>
}

const BASE_CONTEXT = 'https://schema.org'

function composeSchema(type: BaseSchemaTypes, data: Record<string, any> = {}): Record<string, any> {
  const base = { '@context': BASE_CONTEXT, '@type': type }
  switch (type) {
    case 'Organization':
        return {
          ...base,
          name: ORGANIZATION_NAME,
          alternateName: 'Soma Artificial Intelligence',
          description:
            'Generative Engine Optimization (GEO) platform helping brands rank higher in AI-driven search engines like ChatGPT, Gemini, Claude, and Perplexity.',
          url: 'https://withsoma.ai/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://withsoma.ai/logo.png',
            width: 512,
            height: 512,
          },
          image: 'https://withsoma.ai/og-image.png',
          sameAs: [
            SOCIAL_LINKS.twitter,
            SOCIAL_LINKS.linkedin,
            SOCIAL_LINKS.github,
          ],
          foundingDate: ORG_CONTACT.foundingDate,
          founder: { '@type': 'Organization', name: 'Soma AI' },
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              email: ORG_CONTACT.email,
              telephone: ORG_CONTACT.phone,
              availableLanguage: ['English'],
            },
            {
              '@type': 'ContactPoint',
              contactType: 'sales',
              email: ORG_CONTACT.email,
              telephone: ORG_CONTACT.phone,
              availableLanguage: ['English'],
            },
          ],
          address: {
            '@type': 'PostalAddress',
            streetAddress: ORG_CONTACT.address.street,
            addressLocality: ORG_CONTACT.address.city,
            addressRegion: ORG_CONTACT.address.state,
            postalCode: ORG_CONTACT.address.postalCode,
            addressCountry: ORG_CONTACT.address.country,
          },
          numberOfEmployees: { '@type': 'QuantitativeValue', value: '10-50' },
          knowsAbout: [
            'Generative Engine Optimization',
            'Answer Engine Optimization',
            'AI Search Optimization',
            'LLM Brand Visibility',
            'AI SEO',
          ],
          areaServed: 'Worldwide',
          ...data,
      }
    case 'WebApplication':
    case 'SoftwareApplication':
      return {
        ...base,
        name: 'Soma AI Platform',
        description:
          'AI-powered Generative Engine Optimization (GEO) platform for improving brand visibility in ChatGPT, Claude, Gemini, and Perplexity search results.',
        url: 'https://withsoma.ai',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free trial available' },
        creator: { '@type': 'Organization', name: 'Soma AI' },
        featureList: [
          'AI Search Engine Optimization',
          'Brand Mention Monitoring',
          'Competitive Analysis',
          'Content Optimization',
          'LLM Discoverability Audit',
          'Real-time AI Ranking Tracking',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '150',
          bestRating: '5',
          worstRating: '1',
        },
        screenshot: 'https://withsoma.ai/dashboard-screenshot.png',
        ...data,
      }
    case 'Article':
      return {
        ...base,
        headline: data.title || data.headline || 'Soma AI: Generative Engine Optimization',
        description:
          data.description ||
          "Learn about Generative Engine Optimization and how to improve your brand's visibility in AI-driven search engines.",
        author: data.author || { '@type': 'Organization', name: 'Soma AI' },
        publisher: {
          '@type': 'Organization',
          name: 'Soma AI',
          logo: { '@type': 'ImageObject', url: 'https://withsoma.ai/logo.png' },
          ...data.publisher,
        },
        datePublished: data.datePublished || new Date().toISOString(),
        dateModified: data.dateModified || new Date().toISOString(),
        mainEntityOfPage: data.url || 'https://withsoma.ai',
        image: data.image || 'https://withsoma.ai/og-image.png',
        articleSection: data.articleSection,
        wordCount: data.wordCount,
        ...data,
      }
    case 'Service':
      return {
        ...base,
        name: 'Generative Engine Optimization (GEO)',
        description:
          'Professional AI search engine optimization services to improve brand visibility in ChatGPT, Claude, Gemini, and Perplexity.',
        provider: { '@type': 'Organization', name: 'Soma AI' },
        areaServed: 'Worldwide',
        audience: { '@type': 'Audience', audienceType: 'Business' },
        serviceType: 'AI SEO Optimization',
        category: 'Digital Marketing',
        ...data,
      }
    case 'HowTo':
      return { ...base, ...data }
    case 'FAQPage':
      return { ...base, mainEntity: data.mainEntity }
    case 'BreadcrumbList':
      return { ...base, itemListElement: data.itemListElement }
    case 'ItemList':
      return { ...base, itemListElement: data.itemListElement, numberOfItems: data.numberOfItems }
    case 'SiteNavigationElement':
      return { ...base, name: data.name, url: data.url, about: data.about }
    case 'WebSite':
      return {
        ...base,
        name: data.name || 'Soma AI',
        url: 'https://withsoma.ai',
        potentialAction: data.potentialAction,
        description:
          data.description ||
          'Soma AI GEO platform improves brand visibility in AI-driven search engines (ChatGPT, Gemini, Claude, Perplexity).',
        inLanguage: 'en-US',
      }
    case 'Blog':
      return {
        ...base,
        name: data.name || 'Soma AI Blog',
        description: data.description,
        url: data.url || 'https://withsoma.ai/blog',
        publisher: data.publisher,
      }
    case 'BlogPosting':
      return {
        ...base,
        headline: data.headline || data.title,
        description: data.description,
        author: data.author,
        datePublished: data.datePublished,
        dateModified: data.dateModified || data.datePublished,
        image: data.image,
        articleSection: data.articleSection,
        wordCount: data.wordCount,
        mainEntityOfPage: data.url,
        isPartOf: data.isPartOf,
        publisher: data.publisher || { '@type': 'Organization', name: 'Soma AI' },
      }
    case 'Person':
      return {
        ...base,
        name: data.name,
        jobTitle: data.jobTitle,
        worksFor: data.worksFor,
        sameAs: data.sameAs,
        image: data.image,
        knowsAbout: data.knowsAbout,
        url: data.url,
      }
    case 'CreativeWorkSeries':
      return {
        ...base,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        creator: data.creator,
      }
    default:
      return { ...base, ...data }
  }
}

export function StructuredData({ type, data = {}, schemaObject }: StructuredDataProps) {
  const schema = schemaObject || composeSchema(type, data)
  return (
    <script
      type="application/ld+json"
      // Avoid pretty-print to reduce payload; crawlers don't need indentation.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Support injecting multiple schemas at once (single script tag or multiple). Using multiple tags is fine.
export function MultiStructuredData({ schemas }: { schemas: Array<Record<string, any>> }) {
  if (!schemas?.length) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  )
}

// ---------------- Helper Builders ----------------
export function buildHowTo({
  name,
  description,
  steps,
}: {
  name: string
  description?: string
  steps: Array<{ position?: number; name: string; text?: string; image?: string }>
}) {
  return composeSchema('HowTo', {
    name,
    description,
    step: steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: s.position ?? idx + 1,
      name: s.name,
      text: s.text,
      image: s.image,
    })),
  })
}

export function buildFAQ(mainEntity: Array<{ question: string; answer: string }>, name?: string) {
  return composeSchema('FAQPage', {
    ...(name && { name }),
    mainEntity: mainEntity.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    })),
  })
}

export function buildBreadcrumb(items: Array<{ name: string; url: string }>) {
  return composeSchema('BreadcrumbList', {
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

export function buildSiteNavigation(items: Array<{ name: string; url: string }>) {
  // Represent navigation as an ItemList of SiteNavigationElement entries (Google also recommends WebSite + potentialAction)
  return composeSchema('ItemList', {
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      '@type': 'SiteNavigationElement',
      position: idx + 1,
      name: item.name,
      url: item.url,
    })),
  })
}

export function buildWebsiteSchema() {
  return composeSchema('WebSite', {
    name: 'Soma AI',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://withsoma.ai/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  })
}

export function buildSeries({
  name,
  description,
  startDate,
  creator = { '@type': 'Organization', name: 'Soma AI' },
}: {
  name: string
  description?: string
  startDate?: string
  creator?: Record<string, any>
}) {
  return composeSchema('CreativeWorkSeries', { name, description, startDate, creator })
}

// ---------------- Convenience Composites ----------------
export function HomepageStructuredData() {
  const schemas = [
    composeSchema('Organization'),
    composeSchema('WebApplication'),
    composeSchema('Service'),
    buildWebsiteSchema(),
  ]
  return <MultiStructuredData schemas={schemas} />
}

export function ProductStructuredData() {
  return (
    <StructuredData
      type="SoftwareApplication"
      data={{
        name: 'Soma AI GEO Platform',
        version: '2.0',
        releaseNotes: 'Advanced AI crawler analytics and real-time optimization features',
        downloadUrl: 'https://withsoma.ai/signup',
        softwareVersion: '2.0',
        requirements: 'Modern web browser with JavaScript enabled',
      }}
    />
  )
}