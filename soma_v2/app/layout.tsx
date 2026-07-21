import type React from "react"
import type { Metadata } from "next"
import { Urbanist } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { ClerkProvider } from "@clerk/nextjs"
import { HomepageStructuredData } from "@/components/marketing/structured-data"
import { Toaster } from "sonner"
import "./globals.css"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
})

export const metadata: Metadata = {
  title: "Soma AI – Answer Engine Optimization (AEO/GEO) for ChatGPT, Gemini, Claude & Perplexity",
  description: "Soma AI helps your brand rank higher and be discoverable in AI-driven search engines like ChatGPT, Gemini, Claude, and Perplexity using Answer Engine Optimization (AEO). Be the brand AI recommends first.",
  keywords: [
    "Answer Engine Optimization",
    "Generative Engine Optimization",
    "GEO",
    "AEO",
    "GEO platform",
    "AEO platform",
    "GEO capabilities",
    "AEO tools",
    "answer engine optimization tools",
    "generative engine optimization platform",
    "AI SEO",
    "AI search optimization",
    "AI discoverability",
    "AI ranking",
    "AI answer engines",
    "AI search results",
    "LLM visibility",
    "LLM optimization",
    "ChatGPT SEO",
    "Claude SEO",
    "Perplexity SEO",
    "Gemini SEO",
    "Soma AI",
    "AI brand visibility",
    "AI brand optimization",
    "AI content optimization",
    "rank in ChatGPT",
    "rank in Gemini",
    "rank in Claude",
    "rank in Perplexity",
    "be the brand AI recommends",
    "improve AI search ranking",
    "low ranking in AI search results",
    "brand visibility in AI answer engines",
    "generative engine optimization strategies",
    "AI search optimization tools",
    "AI SEO platform",
    "AI recommendation optimization",
    "large language model SEO",
    "AI content strategy",
    "GEO for US businesses",
    "AEO New York",
    "AEO San Francisco",
    "GEO for agencies",
    "GEO for SaaS",
    "GEO for e-commerce",
    "AI-driven search marketing",
    "AI search engine marketing",
    "AI content visibility",
    "AI SEO best practices",
    "AI crawler optimization",
    "brand optimization for AI",
    "enterprise AI search",
    "AI-powered search optimization",
    "Generative AI optimization",
    "generative engine optimization vs traditional SEO"
  ],
  metadataBase: new URL('https://withsoma.ai'),
  generator: "Soma AI",
  authors: [{ name: "Soma AI" }],
  applicationName: "Soma AI",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
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
  other: {
    "msvalidate.01": "A23E03C8AE24D2CBA044712174F0F9AC",
    // AI-specific meta tags for better crawler understanding
    "ai-content-type": "business-application",
    "ai-primary-topic": "generative-engine-optimization",
    "ai-target-audience": "business-marketing-professionals",
    "ai-content-category": "software-as-a-service",
    "chatgpt-discoverable": "true",
    "claude-indexable": "true",
    "perplexity-crawlable": "true",
    "gemini-accessible": "true"
  },
  openGraph: {
    title: "Soma AI – Be the Brand AI Recommends | Generative Engine Optimization",
    description: "Rank higher and be discoverable in ChatGPT, Gemini, Claude, and Perplexity with Soma AI's Generative Engine Optimization (GEO). Professional AI SEO platform trusted by leading brands.",
    siteName: "Soma AI",
    type: "website",
    url: "https://withsoma.ai",
    images: [
      {
        url: "https://withsoma.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Soma AI - Generative Engine Optimization Platform"
      }
    ],
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Soma AI – AI SEO with Generative Engine Optimization",
    description: "Dominate AI-driven search results across ChatGPT, Gemini, Claude & Perplexity.",
    images: ["https://withsoma.ai/twitter-image.png"],
    creator: "@withsomaai",
    site: "@withsomaai"
  },
  alternates: {
    canonical: "https://withsoma.ai"
  },
  verification: {
    google: "your-google-site-verification-code",
    yandex: "your-yandex-verification-code",
    other: {
      "msvalidate.01": "A23E03C8AE24D2CBA044712174F0F9AC"
    }
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
          card: 'shadow-none',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          formFieldInput: 'border border-input bg-background',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    >
      <html lang="en">
        <head>
          <HomepageStructuredData />
          {/* AI Crawler specific meta tags */}
          <meta name="ai-content-type" content="business-application" />
          <meta name="ai-primary-topic" content="generative-engine-optimization" />
          <meta name="ai-target-audience" content="business-marketing-professionals" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          
          {/* Favicon and app icons handled by Next.js metadata.icons */}
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* DNS prefetch for performance */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
          <link rel="dns-prefetch" href="//clerk.com" />
          
          {/* Google Analytics - Only in production */}
          {process.env.NODE_ENV === 'production' && (
            <>
              <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y0Z4679WJY"></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-Y0Z4679WJY', {
                      send_page_view: false,
                      allow_ad_personalization_signals: false,
                      allow_google_signals: false,
                      anonymize_ip: true
                    });
                    // Disable automatic form interaction tracking to prevent hydration issues
                    gtag('config', 'G-Y0Z4679WJY', {
                      custom_map: {'custom_parameter': 'custom_value'}
                    });
                  `,
                }}
              />
            </>
          )}
        </head>
        <body className={`font-sans ${urbanist.variable} ${GeistMono.variable}`}>
          {children}
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
