import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI Visibility Audit | Check Your Brand in ChatGPT, Gemini & Claude | Soma AI',
  description: 'Get a free audit of how your brand appears in AI search engines. See what ChatGPT, Gemini, Claude, and Perplexity say about your business. Instant results, no credit card required.',
  keywords: [
    'free AI audit', 'AI visibility check', 'ChatGPT brand audit', 'Gemini brand visibility',
    'Claude brand mentions', 'Perplexity brand check', 'GEO audit', 'AEO audit',
    'AI search optimization', 'brand visibility AI', 'generative engine optimization audit',
    'free brand audit tool', 'AI brand monitoring', 'LLM visibility check'
  ],
  openGraph: {
    title: 'Free AI Visibility Audit | Soma AI',
    description: 'Discover how visible your brand is across AI search engines. Get a free report showing what ChatGPT, Gemini, Claude, and Perplexity say about your business.',
    type: 'website',
    url: 'https://withsoma.ai/free-audit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Visibility Audit | Soma AI',
    description: 'Check what AI search engines say about your brand. Free instant audit across ChatGPT, Gemini, Claude & Perplexity.',
  },
  alternates: {
    canonical: 'https://withsoma.ai/free-audit',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function FreeAuditLayout({ children }: { children: React.ReactNode }) {
  return children
}
