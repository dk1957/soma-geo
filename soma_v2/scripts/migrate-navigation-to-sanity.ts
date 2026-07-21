/**
 * Navigation Migration to Sanity
 * ===============================
 * Migrates marketing site navigation from hardcoded components to Sanity CMS
 */

import 'dotenv/config'
import { createClient } from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
})

const navigationConfigs = [
  // Main Header Navigation
  {
    _id: 'main-header',
    _type: 'navigation',
    title: 'Main Header Navigation',
    identifier: 'main-header',
    items: [
      {
        label: 'Platform',
        url: '/dashboard',
        openInNewTab: false,
      },
      {
        label: 'Solutions',
        url: '#',
        openInNewTab: false,
        children: [
          {
            label: 'For African Businesses',
            url: '/blog/geo-for-african-businesses',
            description: 'Dominate AI search in Kenya, Nigeria, Ghana, South Africa',
            icon: 'Globe',
          },
          {
            label: 'For Middle Eastern Markets',
            url: '/blog/geo-for-middle-eastern-businesses',
            description: 'Lead AI recommendations in UAE, Saudi Arabia, MENA',
            icon: 'Globe',
          },
          {
            label: 'For European Enterprises',
            url: '/blog/geo-for-european-businesses',
            description: 'AI visibility for UK, Germany, France, Netherlands',
            icon: 'Globe',
          },
          {
            label: 'Global Strategy',
            url: '/blog/global-geo-strategies',
            description: 'Worldwide AI optimization best practices',
            icon: 'TrendingUp',
          },
        ],
      },
      {
        label: 'Pricing',
        url: '/pricing',
        openInNewTab: false,
      },
      {
        label: 'Resources',
        url: '#',
        openInNewTab: false,
        children: [
          {
            label: 'Blog',
            url: '/blog',
            description: 'Latest insights on GEO and AI search',
            icon: 'FileText',
          },
          {
            label: 'Case Studies',
            url: '/case-studies',
            description: 'Success stories from our clients',
            icon: 'Award',
          },
          {
            label: 'Help & Documentation',
            url: '/help',
            description: 'Guides, tutorials, and support',
            icon: 'BookOpen',
          },
          {
            label: 'FAQ',
            url: '/faq',
            description: 'Frequently asked questions',
            icon: 'HelpCircle',
          },
        ],
      },
      {
        label: 'About',
        url: '/about',
        openInNewTab: false,
      },
    ],
    cta: {
      text: 'Get Started',
      url: '/signup',
      style: 'primary',
    },
    isActive: true,
  },

  // Footer - Company Section
  {
    _id: 'footer-company',
    _type: 'navigation',
    title: 'Footer - Company',
    identifier: 'footer-company',
    items: [
      { label: 'About', url: '/about', openInNewTab: false },
      { label: 'Careers', url: '/careers', openInNewTab: false, badge: 'Hiring' },
      { label: 'Contact', url: '/contact', openInNewTab: false },
      { label: 'Privacy', url: '/privacy', openInNewTab: false },
      { label: 'Terms', url: '/terms', openInNewTab: false },
    ],
    isActive: true,
  },

  // Footer - Platform Section
  {
    _id: 'footer-platform',
    _type: 'navigation',
    title: 'Footer - Platform',
    identifier: 'footer-solutions',
    items: [
      { label: 'Dashboard', url: '/dashboard', openInNewTab: false },
      { label: 'Pricing', url: '/pricing', openInNewTab: false },
      { label: 'API Docs', url: '/api-docs', openInNewTab: false, badge: 'Soon' },
      { label: 'Integrations', url: '/integrations', openInNewTab: false, badge: 'Soon' },
    ],
    isActive: true,
  },

  // Footer - Resources Section
  {
    _id: 'footer-resources',
    _type: 'navigation',
    title: 'Footer - Resources',
    identifier: 'footer-resources',
    items: [
      { label: 'Blog', url: '/blog', openInNewTab: false },
      { label: 'Case Studies', url: '/case-studies', openInNewTab: false },
      { label: 'Help & Documentation', url: '/help', openInNewTab: false },
      { label: 'FAQ', url: '/faq', openInNewTab: false },
      { label: 'Support', url: '/contact', openInNewTab: false },
    ],
    isActive: true,
  },

  // Footer - Regional Focus
  {
    _id: 'footer-regional',
    _type: 'navigation',
    title: 'Footer - Regional Markets',
    identifier: 'footer-company',
    items: [
      { label: '🇰🇪 Kenya', url: '/kenya', openInNewTab: false },
      { label: '🇿🇦 South Africa', url: '/south-africa', openInNewTab: false },
      { label: '🇳🇬 Nigeria', url: '/nigeria', openInNewTab: false },
      { label: '🇬🇭 Ghana', url: '/ghana', openInNewTab: false },
      { label: '🇦🇪 UAE', url: '/uae', openInNewTab: false },
      { label: '🇸🇦 Saudi Arabia', url: '/saudi-arabia', openInNewTab: false },
      { label: '🇬🇧 United Kingdom', url: '/united-kingdom', openInNewTab: false },
      { label: '🇩🇪 Germany', url: '/germany', openInNewTab: false },
    ],
    isActive: true,
  },
]

async function migrateNavigation() {
  console.log('🚀 Starting navigation migration to Sanity...\n')
  
  let successCount = 0
  let failCount = 0

  for (const nav of navigationConfigs) {
    try {
      console.log(`📝 Migrating: ${nav.title}`)
      
      await client.createOrReplace(nav)
      
      console.log(`✅ Successfully created/updated: ${nav._id}\n`)
      successCount++
    } catch (error) {
      console.error(`❌ Failed to migrate ${nav.title}:`, error)
      failCount++
    }
  }

  console.log('============================================================')
  console.log('📊 Migration Summary:')
  console.log('============================================================')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📄 Total: ${navigationConfigs.length}`)
  console.log('============================================================\n')

  if (failCount === 0) {
    console.log('🎉 All navigation items migrated successfully!')
    console.log('\n📍 Next steps:')
    console.log('1. Update site-header.tsx to fetch from Sanity')
    console.log('2. Update site-footer.tsx to fetch from Sanity')
    console.log('3. Test navigation on all pages')
  } else {
    console.log('⚠️  Some migrations failed. Please review errors above.')
    process.exit(1)
  }
}

migrateNavigation()
