// Meta tags and structured data utility for Soma AI
import { ORG_CONTACT, SOCIAL_LINKS, ORGANIZATION_NAME } from '@/lib/constants/contact'
// Provides SEO-optimized meta tags and JSON-LD structured data

export interface PageSEO {
  title: string
  description: string
  keywords: string[]
  canonical?: string
  ogImage?: string
  jsonLd?: any
  locale?: string
  region?: string
}

export function generateMetaTags({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  jsonLd,
  locale = 'en',
  region
}: PageSEO) {
  const baseUrl = 'https://withsoma.ai'
  const defaultOgImage = '/og-image.png'
  
  const metaTags = {
    title: `${title} | Soma AI - LLM Discoverability Platform`,
    description,
    keywords: keywords.join(', '),
    canonical: canonical || baseUrl,
    
    // Open Graph
    'og:title': title,
    'og:description': description,
    'og:image': ogImage || `${baseUrl}${defaultOgImage}`,
    'og:url': canonical || baseUrl,
    'og:type': 'website',
    'og:site_name': 'Soma AI',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': ogImage || `${baseUrl}${defaultOgImage}`,
    'twitter:site': '@SomaAI',
    
    // Additional SEO
    'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    'language': locale,
    'author': 'Soma AI',
    
    // Geo-targeting
    ...(region && {
      'geo.region': region,
      'geo.placename': getPlaceName(region)
    })
  }

  return metaTags
}

export function generateStructuredData(type: string, data: any) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  }

  switch (type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: ORGANIZATION_NAME,
        description: 'AI discoverability platform that monitors and optimizes brand visibility across LLMs like ChatGPT, Claude, Gemini, and Perplexity',
        url: 'https://withsoma.ai',
        logo: 'https://withsoma.ai/logo.png',
        foundingDate: ORG_CONTACT.foundingDate,
        founder: {
          '@type': 'Person',
          name: 'Soma AI Team'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: ORG_CONTACT.email,
        },
        sameAs: [
          SOCIAL_LINKS.twitter,
          SOCIAL_LINKS.linkedin,
          SOCIAL_LINKS.github
        ],
        ...data
      }

    case 'SoftwareApplication':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Soma AI Platform',
        description: 'Monitor and optimize your brand\'s visibility across AI platforms like ChatGPT, Claude, Gemini, and Perplexity',
        url: 'https://withsoma.ai',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '29',
          priceCurrency: 'USD',
          priceValidUntil: '2025-12-31'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '250'
        },
        ...data
      }

    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image || 'https://withsoma.ai/og-image.png',
        author: {
          '@type': 'Organization',
          name: 'Soma AI',
          url: 'https://withsoma.ai'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Soma AI',
          logo: {
            '@type': 'ImageObject',
            url: 'https://withsoma.ai/logo.png'
          }
        },
        datePublished: data.datePublished || new Date().toISOString(),
        dateModified: data.dateModified || new Date().toISOString(),
        ...data
      }

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.questions?.map((q: any) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer
          }
        })) || [],
        ...data
      }

    default:
      return baseStructuredData
  }
}

export function getRegionalSEO(region: string) {
  const regionalData = {
    'ZA': {
      country: 'South Africa',
      language: 'en-ZA',
      currency: 'ZAR',
      keywords: ['South Africa', 'Cape Town', 'Johannesburg', 'AI marketing South Africa', 'brand monitoring South Africa'],
      description: 'AI brand monitoring and discoverability platform for South African businesses and marketing teams'
    },
    'NG': {
      country: 'Nigeria',
      language: 'en-NG', 
      currency: 'NGN',
      keywords: ['Nigeria', 'Lagos', 'Abuja', 'AI marketing Nigeria', 'brand monitoring Nigeria', 'fintech Nigeria'],
      description: 'AI brand monitoring and discoverability platform for Nigerian businesses and marketing teams'
    },
    'GB': {
      country: 'United Kingdom',
      language: 'en-GB',
      currency: 'GBP', 
      keywords: ['UK', 'London', 'Manchester', 'AI marketing UK', 'brand monitoring UK', 'marketing technology UK'],
      description: 'AI brand monitoring and discoverability platform for UK businesses and marketing agencies'
    },
    'AE': {
      country: 'United Arab Emirates',
      language: 'en-AE',
      currency: 'AED',
      keywords: ['UAE', 'Dubai', 'Abu Dhabi', 'AI marketing UAE', 'brand monitoring UAE', 'digital marketing Dubai'],
      description: 'AI brand monitoring and discoverability platform for UAE businesses and marketing teams'
    }
  }

  return regionalData[region as keyof typeof regionalData] || regionalData['ZA']
}

function getPlaceName(region: string) {
  const placeNames = {
    'ZA': 'South Africa',
    'NG': 'Nigeria', 
    'GB': 'United Kingdom',
    'AE': 'United Arab Emirates'
  }
  return placeNames[region as keyof typeof placeNames] || 'Global'
}

// Generate regional metadata for market-specific pages
export function generateRegionalMetadata(region: string, pageType: string = 'landing') {
  const regionalData = getRegionalSEO(region)
  const baseUrl = 'https://withsoma.ai'
  
  const titles = {
    'ZA': 'AI Brand Monitoring for South African Businesses | Soma AI',
    'NG': 'AI Brand Monitoring for Nigerian Businesses | Soma AI', 
    'GB': 'AI Brand Monitoring for UK Businesses | Soma AI',
    'AE': 'AI Brand Monitoring for UAE Businesses | Soma AI'
  }

  const descriptions = {
    'ZA': 'Monitor your brand across ChatGPT, Claude, and other AI platforms. Trusted by 500+ South African businesses to track AI mentions and optimize LLM visibility.',
    'NG': 'Monitor your brand across ChatGPT, Claude, and other AI platforms. Trusted by 300+ Nigerian businesses and fintech companies to track AI mentions.',
    'GB': 'Monitor your brand across ChatGPT, Claude, and other AI platforms. Trusted by 800+ UK businesses and marketing agencies to optimize LLM visibility.',
    'AE': 'Monitor your brand across ChatGPT, Claude, and other AI platforms. Trusted by 200+ UAE businesses to track AI mentions and digital presence.'
  }

  return {
    title: titles[region as keyof typeof titles] || titles['ZA'],
    description: descriptions[region as keyof typeof descriptions] || descriptions['ZA'],
    keywords: [
      'AI brand monitoring',
      'LLM optimization',
      'ChatGPT marketing',
      'Claude monitoring', 
      'Perplexity optimization',
      ...regionalData.keywords
    ],
    canonical: `${baseUrl}/${region.toLowerCase()}`,
    locale: regionalData.language,
    region: region,
    openGraph: {
      title: titles[region as keyof typeof titles] || titles['ZA'],
      description: descriptions[region as keyof typeof descriptions] || descriptions['ZA'],
      url: `${baseUrl}/${region.toLowerCase()}`,
      siteName: 'Soma AI',
      locale: regionalData.language,
      type: 'website',
      images: [{
        url: `${baseUrl}/og-${region.toLowerCase()}.png`,
        width: 1200,
        height: 630,
        alt: `Soma AI - AI Brand Monitoring for ${regionalData.country}`
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[region as keyof typeof titles] || titles['ZA'],
      description: descriptions[region as keyof typeof descriptions] || descriptions['ZA'],
      images: [`${baseUrl}/og-${region.toLowerCase()}.png`]
    },
    robots: 'index, follow, max-image-preview:large',
    other: {
      'geo.region': region,
      'geo.placename': regionalData.country,
      'language': regionalData.language
    }
  }
}

// AI-specific structured data for LLM consumption
export function generateAIOptimizedContent(data: {
  topic: string
  expertise: string[]
  facts: string[]
  sources: string[]
  lastUpdated: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.topic,
    expertise: data.expertise,
    factualClaims: data.facts,
    sources: data.sources.map(source => ({
      '@type': 'WebPage',
      url: source
    })),
    dateModified: data.lastUpdated,
    inLanguage: 'en',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Soma AI',
      expertise: [
        'AI Marketing',
        'Brand Monitoring', 
        'LLM Optimization',
        'Digital Marketing',
        'Competitive Intelligence'
      ]
    }
  }
}