// Enhanced layout with SEO optimization for Soma AI
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { generateMetaTags, generateStructuredData } from '@/lib/seo/meta-tags'

const inter = Inter({ subsets: ['latin'] })

// Default SEO configuration
const defaultSEO = generateMetaTags({
  title: 'AI Brand Monitoring & LLM Discoverability Platform',
  description: 'Monitor and optimize your brand\'s visibility across AI platforms like ChatGPT, Claude, Gemini, and Perplexity. Track citations, measure LDI scores, and dominate AI search results.',
  keywords: [
    'AI brand monitoring',
    'LLM discoverability',
    'ChatGPT brand mentions',
    'AI search optimization', 
    'brand visibility AI',
    'competitor AI analysis',
    'LLM optimization platform',
    'AI marketing tool',
    'brand discoverability',
    'AI mention tracking'
  ],
  canonical: 'https://withsoma.ai'
})

export const metadata: Metadata = {
  title: defaultSEO.title,
  description: defaultSEO.description,
  keywords: defaultSEO.keywords,
  authors: [{ name: 'Soma AI Team' }],
  creator: 'Soma AI',
  publisher: 'Soma AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://withsoma.ai'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'en-GB': '/en-GB',
      'en-ZA': '/en-ZA',
      'en-NG': '/en-NG',
      'en-AE': '/en-AE',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://withsoma.ai',
    title: defaultSEO['og:title'],
    description: defaultSEO['og:description'],
    siteName: 'Soma AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Soma AI - LLM Discoverability Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultSEO['twitter:title'],
    description: defaultSEO['twitter:description'],
    site: '@SomaAI',
    creator: '@SomaAI',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Organization structured data
  const organizationSchema = generateStructuredData('Organization', {
    name: 'Soma AI',
    description: 'AI discoverability platform that monitors and optimizes brand visibility across LLMs like ChatGPT, Claude, Gemini, and Perplexity',
    url: 'https://withsoma.ai',
    logo: 'https://withsoma.ai/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ZA'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@withsoma.ai'
    },
    sameAs: [
      'https://twitter.com/SomaAI',
      'https://linkedin.com/company/soma-ai'
    ]
  })

  // Software application structured data
  const softwareSchema = generateStructuredData('SoftwareApplication', {
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
    }
  })

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//withsoma.ai" />
        <link rel="dns-prefetch" href="//vercel.com" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://withsoma.ai" />

        {/* Additional meta for AI crawlers */}
        <meta name="author" content="Soma AI Team" />
        <meta name="copyright" content="© 2024 Soma AI. All rights reserved." />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Geo-targeting */}
        <meta name="geo.region" content="ZA-WC" />
        <meta name="geo.placename" content="Cape Town, South Africa" />
        <meta name="geo.position" content="-33.9249;18.4241" />
        <meta name="ICBM" content="-33.9249, 18.4241" />

        {/* Verification tags (add your verification codes) */}
        {/* <meta name="google-site-verification" content="your-google-verification-code" /> */}
        {/* <meta name="msvalidate.01" content="your-bing-verification-code" /> */}
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}