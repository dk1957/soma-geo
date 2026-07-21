import { client } from '@/sanity/lib/client'
import { HOME_PAGE_QUERY } from '@/lib/sanity/queries'
import HomePage from './home'

export const revalidate = 60 // Revalidate every 60 seconds

export async function generateMetadata() {
  const pageData = await client.fetch(HOME_PAGE_QUERY)
  
  return {
    title: pageData?.seo?.metaTitle || 'Soma AI - Generative Engine Optimization Platform',
    description: pageData?.seo?.metaDescription || 'Get recommended by ChatGPT, Claude, and Gemini. The GEO platform for brands.',
  }
}

export default async function LandingPage() {
  const pageData = await client.fetch(HOME_PAGE_QUERY)
  
  if (!pageData) {
    return <div>Loading...</div>
  }
  
  return <HomePage pageData={pageData} />
}
