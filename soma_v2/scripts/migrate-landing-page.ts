/**
 * Landing Page Migration Script
 * ==============================
 * Migrates landing page content to Sanity CMS
 * 
 * Run: npx ts-node scripts/migrate-landing-page.ts
 */

import { createClient } from 'next-sanity'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_WRITE_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const landingPageData = {
  _id: 'landing-page-home',
  _type: 'landingPage',
  title: 'Home - Landing Page',
  slug: {
    _type: 'slug',
    current: 'home',
  },
  isActive: true,
  
  hero: {
    animatedText: 'ChatGPT',
    secondLine: 'Recommends',
    thirdLine: 'Your Competitors',
    subtitle: 'Change that.',
    videoUrl: 'https://www.youtube.com/embed/d54k28r9ROo?autoplay=1&mute=1&loop=1&playlist=d54k28r9ROo&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&cc_load_policy=0&playsinline=1&enablejsapi=0',
    ctaPrimary: 'Get Your Free AI Report',
    ctaSecondary: 'Schedule Demo',
    socialProofText: 'Currently in private beta with select brands and agencies.',
  },
  
  stats: {
    sectionTitle: 'The AI Revolution is Here',
    statistics: [
      {
        value: '25',
        suffix: '%',
        description: 'decline in search traffic by 2026—AI is taking over',
        source: 'Gartner Research',
      },
      {
        value: '2.9',
        suffix: 'B',
        description: 'users asking AI for business recommendations monthly',
        source: 'OpenAI, 2024',
      },
      {
        value: '64',
        suffix: '%',
        description: 'professionals rely on AI for business decisions',
        source: 'McKinsey, 2024',
      },
    ],
    trustIndicators: [
      'SOC 2 Compliant',
      'GDPR Ready',
      'Enterprise SSO',
      '99.9% Uptime',
    ],
  },
  
  howItWorks: {
    title: 'Three Steps to',
    titleHighlight: 'Regional Leadership',
    subtitle: 'Position your African or Middle Eastern brand as the go-to choice for global stakeholders',
    steps: [
      {
        number: '01',
        title: 'Monitor AI Visibility',
        description: 'Test thousands of industry queries across major AI platforms. Our LDI score reveals exactly where you rank against competitors.',
        icon: 'Search',
      },
      {
        number: '02',
        title: 'Optimize Content',
        description: 'Analyze your content for AI crawler optimization. Ensure proper indexing and citation opportunities.',
        icon: 'Pencil',
      },
      {
        number: '03',
        title: 'Track Performance',
        description: 'Monitor improvements in real-time. Watch your AI visibility grow with detailed analytics.',
        icon: 'BarChart3',
      },
    ],
  },
  
  enterprise: {
    sectionLabel: 'For Market Leaders',
    title: 'Built for',
    titleHighlight: 'Regional Markets',
    subtitle: "Whether you're serving customers in Africa, the Middle East, or targeting these markets globally—be the first choice AI recommends.",
    capabilities: [
      {
        title: 'Strategic Intelligence',
        description: 'Track how AI platforms discuss your target markets and customer regions. Position your brand ahead of competitors in key conversations.',
      },
      {
        title: 'Institutional Authority',
        description: "When consumers anywhere ask AI about your markets, ensure your brand is the authority they're directed to.",
      },
      {
        title: 'Enterprise Security',
        description: 'Enterprise-grade security and compliance. Built for global brands and regional market leaders.',
      },
    ],
    ctaText: 'Schedule Executive Briefing',
    ctaLink: '/contact',
  },
  
  faq: {
    title: 'Questions Leaders Ask',
    questions: [
      {
        question: 'How is this different from SEO?',
        answer: 'SEO gets you ranked in search results. GEO gets you directly recommended by AI as the answer. When someone asks ChatGPT for business recommendations, you become the response, not one of 10 links.',
      },
      {
        question: "What's the ROI for our marketing budget?",
        answer: 'Enterprise clients see 300-500% increase in qualified leads within 90 days. One Fortune 500 client tracked $2.3M in attributable pipeline from AI citations in Q1 alone.',
      },
      {
        question: 'Why should we act now rather than wait?',
        answer: 'First-mover advantage is everything in AI. Once AI models establish your competitors as authoritative sources, displacing them becomes exponentially harder. Act before the window closes.',
      },
      {
        question: 'How quickly can we deploy and see results?',
        answer: 'Most clients see measurable citation increases within 2-4 weeks. Enterprise deployment happens in days; our team handles the heavy lifting.',
      },
      {
        question: 'How do you handle security and compliance?',
        answer: 'SOC 2 Type II standards, enterprise SSO, encryption, and detailed audit trails. Built to meet Fortune 500 and government requirements.',
      },
      {
        question: 'Can we track what AI says about our competitors?',
        answer: 'Yes. We monitor AI responses across thousands of queries to show exactly when and how competitors are mentioned, providing real-time competitive intelligence.',
      },
      {
        question: 'What if AI says something negative about us?',
        answer: 'We alert you instantly to negative mentions and guide strategic content responses to shift sentiment positively.',
      },
      {
        question: 'How does this integrate with our existing marketing stack?',
        answer: 'Integrates with HubSpot, Salesforce, Google Analytics, and 50+ tools. Export reports or use our API directly.',
      },
      {
        question: 'How can government agencies use this for policy communication?',
        answer: 'Ensure citizens receive accurate, official information when they ask AI about services, policies, and initiatives—ideal for civic engagement and transparency.',
      },
      {
        question: 'How do we measure and attribute AI-driven leads?',
        answer: 'Advanced attribution links AI citations to traffic, leads, and revenue with detailed conversion tracking.',
      },
      {
        question: 'Do we need to create new content, or can you optimize existing content?',
        answer: 'Both. We first optimize existing assets, then identify strategic content gaps for maximum citation potential.',
      },
      {
        question: 'How do you help brands serving African and Middle Eastern markets?',
        answer: 'We position you as the trusted recommendation when AI is asked about products and services in these regions—driving regional authority and global trust.',
      },
      {
        question: 'Do you provide training for our marketing team?',
        answer: 'Yes. Strategy workshops, platform training, quarterly strategy reviews—your team becomes GEO experts.',
      },
    ],
  },
  
  seo: {
    metaTitle: 'Soma AI - Generative Engine Optimization for Regional Markets',
    metaDescription: 'Position your African or Middle Eastern brand as the go-to choice when AI recommends solutions. Enterprise GEO platform for market leaders.',
    keywords: [
      'generative engine optimization',
      'GEO platform',
      'AI visibility',
      'AI marketing',
      'ChatGPT optimization',
      'regional markets',
      'Africa marketing',
      'Middle East marketing',
      'enterprise AI',
    ],
  },
}

async function migrateLandingPage() {
  console.log('🚀 Starting landing page migration to Sanity...\n')
  
  try {
    // Create or update the landing page
    console.log('📄 Creating landing page document...')
    const result = await client.createOrReplace(landingPageData)
    console.log('✅ Landing page created/updated:', result._id)
    
    console.log('\n🎉 Landing page migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - Document ID:', result._id)
    console.log('   - Slug: home')
    console.log('   - Hero sections: ✓')
    console.log('   - Stats: 3 statistics')
    console.log('   - How It Works: 3 steps')
    console.log('   - Enterprise: 3 capabilities')
    console.log('   - FAQ: 13 questions')
    console.log('\n🌐 Visit: http://localhost:3000/home-sanity to view')
    console.log('📝 Edit in Sanity Studio: http://localhost:3333/structure/landingPage')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateLandingPage()
  .then(() => {
    console.log('\n✨ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
