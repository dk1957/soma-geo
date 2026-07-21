/**
 * Migration Script: Landing Page to Sanity
 * =========================================
 * 
 * This script creates initial page documents in Sanity based on
 * existing static page content. Run once to populate the CMS.
 * 
 * Usage:
 *   npx tsx scripts/migrate-landing-to-sanity.ts
 */

import { createClient } from 'next-sanity'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '4de42y7s',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN, // Get from sanity.io/manage
})

const pages = [
  {
    _id: 'page-home',
    _type: 'page',
    title: 'Soma AI - Generative Engine Optimization Platform',
    slug: { _type: 'slug', current: 'home' },
    description: 'Rank higher in AI-driven search with Soma AI. Optimize your brand visibility across ChatGPT, Gemini, Claude, and Perplexity.',
    hero: {
      headline: 'Rank Higher in AI-Driven Search',
      subheadline: 'Soma AI helps brands optimize their visibility across ChatGPT, Gemini, Claude, and Perplexity. Monitor, analyze, and improve your AI search rankings with our comprehensive GEO platform.',
      ctaText: 'Start Free Trial',
      ctaLink: '/signup',
      backgroundGradient: 'from-blue-50 via-indigo-50 to-purple-50'
    },
    features: [
      {
        title: 'AI Search Monitoring',
        description: 'Track your brand mentions across 50+ AI models in real-time. See exactly how ChatGPT, Gemini, and Claude respond to queries about your industry.',
        icon: 'Search'
      },
      {
        title: 'Competitive Intelligence',
        description: 'Benchmark against competitors. Discover who\'s winning in AI search results and identify content gaps to exploit.',
        icon: 'TrendingUp'
      },
      {
        title: 'Content Optimization',
        description: 'Get actionable insights to improve your digital footprint. Our AI analyzes what content drives better visibility in generative engines.',
        icon: 'Zap'
      },
      {
        title: 'Citation Tracking',
        description: 'Monitor which sources AI models cite when mentioning your brand. Understand and strengthen your authority signals.',
        icon: 'Link'
      },
      {
        title: 'Multi-Brand Dashboard',
        description: 'Manage multiple brands from one account. Perfect for agencies and enterprises with diverse portfolios.',
        icon: 'LayoutDashboard'
      },
      {
        title: 'Custom Runs',
        description: 'Run targeted runs with your own prompts. Test how AI models respond to specific queries about your products.',
        icon: 'FlaskConical'
      }
    ],
    content: [
      {
        _type: 'block',
        style: 'h2',
        children: [{_type: 'span', text: 'Why Generative Engine Optimization Matters'}]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'AI-powered search engines like ChatGPT, Google Gemini, and Perplexity are changing how people discover brands. Traditional SEO isn\'t enough anymore—you need to optimize for how AI models understand, cite, and recommend your brand.'
        }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'Soma AI gives you the visibility and tools to succeed in this new landscape. Our platform monitors your brand across leading AI engines, identifies optimization opportunities, and helps you track improvements over time.'
        }]
      }
    ],
    seo: {
      metaTitle: 'Soma AI - GEO Platform for AI Search Optimization',
      metaDescription: 'Monitor and optimize your brand visibility across ChatGPT, Gemini, Claude, and Perplexity. Track AI search rankings, analyze competitors, and improve your citations.',
      noIndex: false
    },
    showInNav: true,
    navOrder: 0,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'page-about',
    _type: 'page',
    title: 'About Soma AI',
    slug: { _type: 'slug', current: 'about' },
    description: 'Learn about Soma AI and our mission to help brands succeed in the age of AI-powered search.',
    hero: {
      headline: 'Building the Future of Brand Visibility',
      subheadline: 'We\'re helping brands navigate the shift from traditional search to AI-powered discovery engines.',
      ctaText: 'Get Started',
      ctaLink: '/signup',
      backgroundGradient: 'from-purple-50 to-pink-50'
    },
    content: [
      {
        _type: 'block',
        style: 'h2',
        children: [{_type: 'span', text: 'Our Mission'}]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'Soma AI was founded to solve a critical challenge: as AI models like ChatGPT and Gemini become primary research tools, brands need a way to monitor and optimize their presence in AI-generated responses.'
        }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'We provide the tools, insights, and analytics that modern brands need to succeed in Generative Engine Optimization (GEO).'
        }]
      }
    ],
    seo: {
      metaTitle: 'About Soma AI - GEO Platform',
      metaDescription: 'Learn about Soma AI\'s mission to help brands optimize their visibility in AI-powered search engines.',
      noIndex: false
    },
    showInNav: true,
    navOrder: 1,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'page-pricing',
    _type: 'page',
    title: 'Pricing - Soma AI',
    slug: { _type: 'slug', current: 'pricing' },
    description: 'Flexible pricing plans for teams of all sizes. Start free, scale as you grow.',
    hero: {
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that fits your needs. All plans include core GEO monitoring and analytics.',
      ctaText: 'Start Free Trial',
      ctaLink: '/signup',
      backgroundGradient: 'from-green-50 to-teal-50'
    },
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'All plans include: AI search monitoring, competitive analysis, citation tracking, and monthly runs. Upgrade anytime as your needs grow.'
        }]
      }
    ],
    seo: {
      metaTitle: 'Soma AI Pricing - GEO Platform Plans',
      metaDescription: 'Flexible pricing for AI search optimization. Start free and scale with your brand visibility needs.',
      noIndex: false
    },
    showInNav: true,
    navOrder: 2,
    publishedAt: new Date().toISOString()
  }
]

async function migrate() {
  console.log('🚀 Starting Sanity migration...\n')
  
  for (const page of pages) {
    try {
      const result = await client.createOrReplace(page)
      console.log(`✅ Created/Updated: ${page.title} (/${page.slug.current})`)
      console.log(`   Document ID: ${result._id}\n`)
    } catch (error) {
      console.error(`❌ Failed to create ${page.title}:`, error)
    }
  }
  
  console.log('\n✨ Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Visit http://localhost:3000/welcome to view pages in Sanity Studio')
  console.log('2. Update app/page.tsx to fetch from Sanity')
  console.log('3. Deploy and give editors access to the Studio')
}

migrate().catch(console.error)
