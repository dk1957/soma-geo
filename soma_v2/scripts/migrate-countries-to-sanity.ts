/**
 * Migration Script: Country Pages to Sanity
 * ==========================================
 * 
 * Migrates all country-specific landing pages to Sanity CMS.
 * 
 * Usage:
 *   npx tsx scripts/migrate-countries-to-sanity.ts
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
  token: process.env.SANITY_API_WRITE_TOKEN,
})

const countryPages = [
  {
    _id: 'country-nigeria',
    _type: 'countryPage',
    country: {
      name: 'Nigeria',
      code: 'NG',
      flag: '🇳🇬',
      currency: 'NGN',
      phoneCode: '+234'
    },
    slug: { _type: 'slug', current: 'nigeria' },
    hero: {
      headline: 'AI Brand Monitoring for',
      headlineHighlight: 'Nigerian Businesses',
      subheadline: 'Dominate AI search results across Nigeria. Track your fintech, e-commerce, or startup\'s visibility in ChatGPT and Claude recommendations.',
      ctaPrimary: 'Start Free AI Audit',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'View Lagos Case Studies',
      ctaSecondaryLink: '#case-studies',
      badges: ['Trusted by 50+ Nigerian Fintech Companies', 'NGN pricing available', 'Lagos timezone support']
    },
    stats: [
      { value: '50+', label: 'Nigerian Fintech Clients' },
      { value: '340%', label: 'Avg. AI Visibility Increase' },
      { value: 'Lagos', label: 'Local Market Expertise' },
      { value: '24/7', label: 'Nigeria Timezone Support' }
    ],
    specialization: {
      title: 'Built for Nigeria\'s Digital Economy',
      description: 'Specialized for Nigerian fintech, e-commerce, and startups competing in Lagos and beyond.',
      features: [
        {
          title: 'Nigerian Fintech Focus',
          description: 'Track AI mentions for payment platforms, digital banking, and financial services across Lagos, Abuja, and emerging Nigerian markets.',
          icon: 'DollarSign',
          colorScheme: 'green'
        },
        {
          title: 'Local Market Intelligence',
          description: 'Monitor how AI models recommend your brand for Nigeria-specific queries, including mobile money, crypto, and startup ecosystem mentions.',
          icon: 'Users',
          colorScheme: 'blue'
        },
        {
          title: 'NGN Pricing & Local Support',
          description: 'Transparent Naira pricing with Lagos business hours support. Understand local regulations and compliance requirements.',
          icon: 'BarChart3',
          colorScheme: 'purple'
        }
      ]
    },
    caseStudies: {
      title: 'Lagos Fintech Success',
      description: 'How a Lagos startup became #1 AI recommendation',
      stories: [
        {
          category: 'Fintech',
          title: 'NigeriaPay Solutions',
          subtitle: 'Payment Platform',
          quote: 'Soma AI helped us understand exactly how ChatGPT and Claude were positioning Nigerian fintech companies. Now we\'re the top recommendation.',
          author: 'Adebayo Ogundimu',
          authorTitle: 'CEO',
          company: 'NigeriaPay Solutions',
          metrics: [
            { label: 'AI Recommendation Rate', value: '89%' },
            { label: 'Lead Quality Increase', value: '400%' },
            { label: 'ChatGPT Position', value: '#1' }
          ]
        }
      ]
    },
    marketInsights: {
      title: 'Nigerian AI Search Insights',
      description: 'What Nigerian entrepreneurs are asking AI models about your industry',
      categories: [
        {
          title: 'Top Fintech Queries',
          queries: [
            'Best payment platform Nigeria',
            'Nigerian digital banking solutions',
            'Lagos fintech companies',
            'Mobile money Nigeria apps',
            'Crypto trading platforms Nigeria'
          ]
        },
        {
          title: 'E-commerce Questions',
          queries: [
            'Nigerian e-commerce platforms',
            'Lagos online shopping sites',
            'Nigerian logistics companies',
            'E-commerce payment Nigeria',
            'African marketplace platforms'
          ]
        },
        {
          title: 'Startup Ecosystem',
          queries: [
            'Nigerian startup accelerators',
            'Lagos tech companies',
            'Nigerian venture capital',
            'Tech hubs Nigeria',
            'African unicorn companies'
          ]
        }
      ]
    },
    industries: ['Fintech', 'E-commerce', 'Startups', 'Oil & Gas'],
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'],
    finalCta: {
      headline: 'Ready to Dominate Nigerian AI Search?',
      description: 'Join leading Nigerian fintech and e-commerce companies already optimizing their AI visibility in Lagos and beyond.',
      ctaPrimary: 'Start Your Nigeria AI Audit',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'Schedule Lagos Demo',
      ctaSecondaryLink: '/contact',
      features: ['Free 14-day trial', 'NGN pricing available', 'Lagos timezone support']
    },
    seo: {
      metaTitle: 'AI Brand Monitoring for Nigerian Businesses | Soma AI',
      metaDescription: 'Dominate AI search in Nigeria. Track fintech and e-commerce visibility across ChatGPT, Claude, and AI engines. Lagos-based support.',
      keywords: ['Nigeria AI marketing', 'Lagos fintech', 'Nigerian e-commerce', 'AI search Nigeria', 'ChatGPT Nigeria']
    },
    contactInfo: {
      email: 'hello@withsoma.ai',
      phone: '+254 0117094368',
      address: 'Serving Lagos, Abuja, and all Nigerian markets'
    },
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-germany',
    _type: 'countryPage',
    country: {
      name: 'Germany',
      code: 'DE',
      flag: '🇩🇪',
      currency: 'EUR',
      phoneCode: '+49'
    },
    slug: { _type: 'slug', current: 'germany' },
    hero: {
      headline: 'Dominate AI Search in',
      headlineHighlight: 'Deutschland',
      subheadline: 'From Berlin\'s vibrant startup ecosystem to Munich\'s industrial powerhouses, German businesses are embracing AI-first marketing. Ensure your brand leads when prospects search on ChatGPT, Claude, Gemini, and Perplexity.',
      ctaPrimary: 'Starten Sie Ihre KI-Optimierung',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'Deutsche Erfolgsgeschichten',
      ctaSecondaryLink: '#case-studies',
      badges: ['200+ deutsche Unternehmen', 'DSGVO-konform']
    },
    stats: [
      { value: '200+', label: 'German Companies' },
      { value: '456%', label: 'Average Growth' },
      { value: 'Berlin', label: 'Startup Hub' },
      { value: 'DSGVO', label: 'Fully Compliant' }
    ],
    specialization: {
      title: 'Why German Businesses Choose Soma AI',
      description: 'With Industry 4.0 leading digital transformation and Germany\'s position as Europe\'s economic powerhouse, German companies need sophisticated AI strategies.',
      features: [
        {
          title: 'Industry 4.0 Integration',
          description: 'AI optimization strategies specifically designed for German manufacturing, automotive, and industrial technology companies leading Industry 4.0.',
          icon: 'Building',
          colorScheme: 'red'
        },
        {
          title: 'DSGVO Compliance',
          description: 'Full DSGVO (GDPR) compliance for all AI optimization activities, ensuring your brand visibility strategies meet strict German data protection standards.',
          icon: 'Users',
          colorScheme: 'yellow'
        },
        {
          title: 'Mittelstand Focus',
          description: 'Specialized strategies for Germany\'s Mittelstand companies, helping medium-sized enterprises compete globally through AI search optimization.',
          icon: 'TrendingUp',
          colorScheme: 'black'
        }
      ]
    },
    caseStudies: {
      title: 'Deutsche Erfolgsgeschichten',
      description: 'Leading German companies are already winning in AI search',
      stories: [
        {
          category: 'Manufacturing',
          title: 'Bavaria Industrial Leader',
          subtitle: 'Smart Manufacturing Solutions in Germany',
          quote: 'Soma AI half uns dabei, bei allen Industrie 4.0-Anfragen führend zu sein. Unsere internationale Kundenakquise stieg um 400% in nur 5 Monaten.',
          author: 'Hans Mueller',
          authorTitle: 'CEO',
          company: 'Bavaria Manufacturing GmbH',
          metrics: [
            { label: 'AI Citations', value: '+389%' },
            { label: 'Brand Visibility', value: '+267%' },
            { label: 'Global Reach', value: '+234%' }
          ]
        },
        {
          category: 'Fintech',
          title: 'Berlin Fintech Startup',
          subtitle: 'Digital Banking Innovation in Europe',
          quote: 'Within 3 months, we became the default answer for "beste deutsche Neobank" across all AI platforms. Our customer acquisition costs dropped by 70%.',
          author: 'Anna Schmidt',
          authorTitle: 'Co-Founder',
          company: 'BerlinBank Digital',
          metrics: [
            { label: 'AI Citations', value: '+456%' },
            { label: 'Brand Visibility', value: '+312%' },
            { label: 'User Acquisition', value: '+523%' }
          ]
        }
      ]
    },
    industries: ['Manufacturing', 'Automotive', 'Fintech', 'Industrial Tech'],
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
    finalCta: {
      headline: 'Bereit, die KI-Suche in Deutschland zu führen?',
      description: 'Join the German companies already dominating AI-powered search. Start your transformation today with DSGVO-compliant strategies.',
      ctaPrimary: 'Kostenlose KI-Analyse starten',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'Kontaktieren Sie unser Team',
      ctaSecondaryLink: 'mailto:hello@withsoma.ai',
      features: ['DSGVO-compliant', 'German language support', 'EUR pricing']
    },
    seo: {
      metaTitle: 'AI Brand Monitoring for German Businesses | Soma AI Deutschland',
      metaDescription: 'Optimize your brand for AI search in Germany. Industry 4.0 strategies for Berlin, Munich, Hamburg. DSGVO-compliant.',
      keywords: ['Germany AI marketing', 'Berlin startup', 'Industry 4.0', 'DSGVO', 'German fintech']
    },
    contactInfo: {
      email: 'hello@withsoma.ai',
      phone: '+254 0117094368',
      address: 'Serving Berlin, Munich, Hamburg, Frankfurt'
    },
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  // Add more countries here...
  {
    _id: 'country-uae',
    _type: 'countryPage',
    country: {
      name: 'United Arab Emirates',
      code: 'AE',
      flag: '🇦🇪',
      currency: 'AED',
      phoneCode: '+971'
    },
    slug: { _type: 'slug', current: 'uae' },
    hero: {
      headline: 'AI Brand Leadership in the',
      headlineHighlight: 'UAE',
      subheadline: 'Dubai and Abu Dhabi businesses lead the Middle East in AI adoption. Ensure your brand dominates when prospects search on ChatGPT, Claude, and Gemini.',
      ctaPrimary: 'Start Your UAE AI Audit',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'Dubai Case Studies',
      ctaSecondaryLink: '#case-studies',
      badges: ['100+ UAE companies', 'Dubai & Abu Dhabi support']
    },
    stats: [
      { value: '100+', label: 'UAE Clients' },
      { value: '520%', label: 'Avg. Visibility Increase' },
      { value: 'Dubai', label: 'MENA Hub' },
      { value: 'AED', label: 'Local Pricing' }
    ],
    industries: ['Real Estate', 'Finance', 'Tourism', 'Technology'],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    finalCta: {
      headline: 'Ready to Lead AI Search in the UAE?',
      description: 'Join UAE businesses already dominating AI-powered search across Dubai, Abu Dhabi, and the MENA region.',
      ctaPrimary: 'Get Your UAE AI Audit',
      ctaPrimaryLink: '/signup',
      features: ['AED pricing', 'Dubai timezone', 'Arabic support']
    },
    seo: {
      metaTitle: 'AI Brand Monitoring UAE | Soma AI Dubai & Abu Dhabi',
      metaDescription: 'Optimize your brand for AI search in UAE. Dubai and Abu Dhabi AI marketing strategies. Track ChatGPT and Claude visibility.',
      keywords: ['UAE AI marketing', 'Dubai business', 'Abu Dhabi', 'MENA AI search']
    },
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-uk',
    _type: 'countryPage',
    country: {
      name: 'United Kingdom',
      code: 'GB',
      flag: '🇬🇧',
      currency: 'GBP',
      phoneCode: '+44'
    },
    slug: { _type: 'slug', current: 'united-kingdom' },
    hero: {
      headline: 'AI Search Leadership in the',
      headlineHighlight: 'United Kingdom',
      subheadline: 'From London\'s financial district to Manchester\'s tech scene, UK businesses are winning in AI search. Dominate ChatGPT, Claude, and Gemini recommendations.',
      ctaPrimary: 'Start Your UK AI Audit',
      ctaPrimaryLink: '/signup',
      ctaSecondary: 'London Success Stories',
      ctaSecondaryLink: '#case-studies',
      badges: ['300+ UK companies', 'FCA compliant']
    },
    stats: [
      { value: '300+', label: 'UK Clients' },
      { value: '420%', label: 'Average Growth' },
      { value: 'London', label: 'Financial Hub' },
      { value: 'GDPR', label: 'Fully Compliant' }
    ],
    industries: ['Fintech', 'Finance', 'Technology', 'Professional Services'],
    cities: ['London', 'Manchester', 'Edinburgh', 'Birmingham'],
    finalCta: {
      headline: 'Ready to Dominate UK AI Search?',
      description: 'Join leading UK brands already optimizing their AI visibility across London and beyond.',
      ctaPrimary: 'Get Your UK AI Audit',
      ctaPrimaryLink: '/signup',
      features: ['GBP pricing', 'UK timezone', 'GDPR compliant']
    },
    seo: {
      metaTitle: 'AI Brand Monitoring UK | Soma AI London & Manchester',
      metaDescription: 'Optimize your brand for AI search in UK. London fintech and tech companies trust Soma AI. GDPR compliant.',
      keywords: ['UK AI marketing', 'London fintech', 'Manchester tech', 'UK GDPR']
    },
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-ghana',
    _type: 'countryPage',
    country: {
      name: 'Ghana',
      code: 'GH',
      flag: '🇬🇭',
      currency: 'GHS',
      phoneCode: '+233'
    },
    slug: { _type: 'slug', current: 'ghana' },
    hero: {
      headline: 'AI Brand Monitoring for',
      headlineHighlight: 'Ghanaian Businesses',
      subheadline: 'Accra\'s growing tech scene needs AI visibility. Track your brand across ChatGPT, Claude, and AI engines serving West Africa.',
      ctaPrimary: 'Start Your Ghana AI Audit',
      ctaPrimaryLink: '/signup',
      badges: ['Accra-based support', 'GHS pricing available']
    },
    industries: ['Fintech', 'Agriculture', 'Technology', 'Mining'],
    cities: ['Accra', 'Kumasi', 'Takoradi'],
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-kenya',
    _type: 'countryPage',
    country: {
      name: 'Kenya',
      code: 'KE',
      flag: '🇰🇪',
      currency: 'KES',
      phoneCode: '+254'
    },
    slug: { _type: 'slug', current: 'kenya' },
    hero: {
      headline: 'AI Brand Leadership in',
      headlineHighlight: 'Kenya',
      subheadline: 'Nairobi is East Africa\'s tech capital. Ensure your brand dominates AI search results across ChatGPT, Claude, and Gemini.',
      ctaPrimary: 'Start Your Kenya AI Audit',
      ctaPrimaryLink: '/signup',
      badges: ['Nairobi HQ', 'KES pricing', 'M-Pesa payments']
    },
    industries: ['Mobile Money', 'Fintech', 'Agriculture', 'Technology'],
    cities: ['Nairobi', 'Mombasa', 'Kisumu'],
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-south-africa',
    _type: 'countryPage',
    country: {
      name: 'South Africa',
      code: 'ZA',
      flag: '🇿🇦',
      currency: 'ZAR',
      phoneCode: '+27'
    },
    slug: { _type: 'slug', current: 'south-africa' },
    hero: {
      headline: 'AI Search Excellence in',
      headlineHighlight: 'South Africa',
      subheadline: 'From Cape Town to Johannesburg, South African businesses lead Africa in digital transformation. Dominate AI-powered search.',
      ctaPrimary: 'Start Your SA AI Audit',
      ctaPrimaryLink: '/signup',
      badges: ['150+ SA clients', 'ZAR pricing']
    },
    industries: ['Fintech', 'Mining', 'Technology', 'Retail'],
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    isActive: true,
    publishedAt: new Date().toISOString()
  },
  {
    _id: 'country-saudi-arabia',
    _type: 'countryPage',
    country: {
      name: 'Saudi Arabia',
      code: 'SA',
      flag: '🇸🇦',
      currency: 'SAR',
      phoneCode: '+966'
    },
    slug: { _type: 'slug', current: 'saudi-arabia' },
    hero: {
      headline: 'AI Brand Leadership in',
      headlineHighlight: 'Saudi Arabia',
      subheadline: 'Vision 2030 demands AI-first strategies. Riyadh and Jeddah businesses need to dominate AI search across the Middle East.',
      ctaPrimary: 'Start Your KSA AI Audit',
      ctaPrimaryLink: '/signup',
      badges: ['Riyadh support', 'SAR pricing', 'Arabic available']
    },
    industries: ['Energy', 'Finance', 'Real Estate', 'Technology'],
    cities: ['Riyadh', 'Jeddah', 'Dammam'],
    isActive: true,
    publishedAt: new Date().toISOString()
  }
]

async function migrateCountries() {
  console.log('🌍 Starting country pages migration to Sanity...\n')
  
  for (const page of countryPages) {
    try {
      const result = await client.createOrReplace(page)
      console.log(`✅ Created/Updated: ${page.country.flag} ${page.country.name} (/${page.slug.current})`)
      console.log(`   Document ID: ${result._id}\n`)
    } catch (error) {
      console.error(`❌ Failed to create ${page.country.name}:`, error)
    }
  }
  
  console.log('\n✨ Country pages migration complete!')
  console.log(`\n📊 Summary: ${countryPages.length} country pages migrated`)
  console.log('\nCountries added:')
  countryPages.forEach(p => console.log(`  ${p.country.flag} ${p.country.name} → /${p.slug.current}`))
  
  console.log('\nNext steps:')
  console.log('1. Visit http://localhost:3000/welcome to view/edit country pages in Studio')
  console.log('2. Update country route files (app/nigeria/page.tsx, etc.) to use <CountryPageFromSanity />')
  console.log('3. Test each country page locally')
  console.log('4. Deploy and verify in production')
}

migrateCountries().catch(console.error)
