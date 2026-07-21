/**
 * Blog Posts Migration to Sanity
 * ================================
 * Migrates all blog posts with full content
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

const blogPosts = [
  {
    _id: 'blog-african-businesses',
    _type: 'blogPost',
    title: 'The Complete Guide to Generative Engine Optimization for African Businesses',
    slug: { _type: 'slug', current: 'geo-for-african-businesses' },
    excerpt: 'Expert guide to GEO strategies for African businesses by Soma AI founders Danny Kofi-Armah and Dela Agbenyegah. Learn how African companies can dominate AI search results across ChatGPT, Claude, Gemini, and Perplexity.',
    description: 'How African companies can leverage AI-driven search engines to gain unprecedented visibility and compete on a global scale.',
    featured: true,
    category: 'business-strategy',
    tags: ['GEO', 'African Business', 'AI Strategy', 'ChatGPT', 'Digital Transformation'],
    authors: [
      {
        name: 'Danny Kofi-Armah',
        jobTitle: 'Co-Founder & CEO, Soma AI',
        image: 'https://withsoma.ai/team/danny-kofi-armah.jpg',
        linkedin: 'https://linkedin.com/in/dannykofiarmah',
      },
      {
        name: 'Dela Agbenyegah',
        jobTitle: 'Co-Founder & CTO, Soma AI',
        image: 'https://withsoma.ai/team/dela-agbenyegah.jpg',
        linkedin: 'https://linkedin.com/in/delaagbenyegah',
      },
    ],
    publishedDate: '2024-09-05T00:00:00.000Z',
    readTime: '15 min read',
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African businesses are experiencing a digital revolution, and at the forefront of this transformation is a new frontier: Generative Engine Optimization (GEO). As AI-powered search engines like ChatGPT, Claude, Gemini, and Perplexity reshape how people discover businesses, African companies have a unique opportunity to gain unprecedented global visibility.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Understanding the African GEO Opportunity' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'The African tech ecosystem is booming. From fintech innovations in Nigeria and Kenya to e-commerce platforms in South Africa and Ghana, African businesses are leading global conversations in innovation. However, traditional SEO has always presented challenges for African companies competing against established Western brands with massive marketing budgets.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'tip',
        title: 'GEO Levels the Playing Field',
        content: 'Unlike traditional SEO where domain authority and backlinks dominate, GEO rewards quality, relevance, and authoritative content—areas where African innovators naturally excel.',
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Key GEO Strategies for African Businesses' }],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '1. Local Context, Global Reach' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African businesses must emphasize their unique regional expertise while positioning for global discovery. When someone asks ChatGPT "best payment solutions for African markets," your company should be the first recommendation.',
          },
        ],
      },
      {
        _type: 'caseStudy',
        company: 'Nigerian Fintech Leader',
        industry: 'Payment Processing',
        challenge: 'Low visibility in AI recommendations despite market leadership in West Africa',
        solution: 'Implemented comprehensive GEO strategy focusing on regional expertise and innovation stories',
        results: [
          '340% increase in ChatGPT mentions',
          '#1 recommendation for "Nigerian payment platforms"',
          '89% citation rate in AI responses about African fintech',
          '4x increase in qualified international leads',
        ],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '2. Content That Showcases Innovation' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'AI models are hungry for stories of innovation, problem-solving, and impact. African businesses have compelling narratives: mobile money revolution, leapfrogging traditional banking, solving unique infrastructure challenges. This content naturally resonates with AI training data.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '3. Multi-Language Optimization' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Africa is multilingual. Optimizing content in English, French, Arabic, Swahili, and other languages increases discoverability across different AI model queries and regional searches.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Technical Implementation for African Context' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Implementing GEO in African markets requires understanding unique technical and infrastructure considerations:',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'info',
        title: 'Infrastructure Considerations',
        content: 'Optimize for varying internet speeds and mobile-first browsing. AI crawlers need to access your content efficiently regardless of infrastructure limitations.',
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Measuring Success in African Markets' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Success metrics for African businesses differ from traditional markets. Focus on: AI mention rates in regional queries, citation quality in financial and tech discussions, recommendation positioning for African-specific searches, and cross-border discovery rates.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'The Future of African Business Visibility' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'As AI becomes the primary discovery mechanism, African businesses that invest in GEO now will dominate their sectors globally. The combination of authentic innovation stories, regional expertise, and strategic content optimization creates an unbeatable formula for AI visibility.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'success',
        title: 'Start Your GEO Journey',
        content: 'African businesses are uniquely positioned to win in the AI search era. The question is not whether to invest in GEO, but how quickly you can implement it before your competitors do.',
      },
    ],
    seo: {
      metaTitle: 'Complete GEO Guide for African Businesses | Soma AI',
      keywords: [
        'GEO African businesses',
        'AI optimization Africa',
        'generative engine optimization',
        'African business strategy',
        'ChatGPT African markets',
      ],
    },
    isActive: true,
  },
  {
    _id: 'blog-african-fintech',
    _type: 'blogPost',
    title: 'How African Fintech Companies Are Dominating AI Search Results',
    slug: { _type: 'slug', current: 'african-fintech-ai-search' },
    excerpt: 'Learn how African fintech leaders like Flutterwave, Paystack, and M-Pesa are leveraging GEO strategies to dominate ChatGPT, Claude, and Gemini search results.',
    description: 'Case studies and strategies from leading African fintech companies optimizing for AI search.',
    featured: true,
    category: 'fintech-strategy',
    tags: ['Fintech', 'African Innovation', 'AI Optimization', 'Payment Systems', 'Mobile Money'],
    authors: [
      {
        name: 'Danny Kofi-Armah',
        jobTitle: 'Co-Founder & CEO, Soma AI',
        image: 'https://withsoma.ai/team/danny-kofi-armah.jpg',
        linkedin: 'https://linkedin.com/in/dannykofiarmah',
      },
      {
        name: 'Dela Agbenyegah',
        jobTitle: 'Co-Founder & CTO, Soma AI',
        image: 'https://withsoma.ai/team/dela-agbenyegah.jpg',
        linkedin: 'https://linkedin.com/in/delaagbenyegah',
      },
    ],
    publishedDate: '2024-08-20T00:00:00.000Z',
    readTime: '12 min read',
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African fintech is experiencing explosive growth, with the continent leading global innovation in mobile money, digital payments, and financial inclusion. Now, these same companies are becoming early adopters of Generative Engine Optimization (GEO), positioning themselves as the definitive answers when AI models discuss payment solutions, digital banking, and financial technology.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'The African Fintech Advantage in AI Search' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African fintech companies have a natural advantage in GEO: they are solving real, unique problems that AI models recognize as valuable and authoritative content. When ChatGPT or Claude analyzes financial innovation, African success stories like M-Pesa, Flutterwave, and Paystack represent groundbreaking solutions that AI models naturally cite.',
          },
        ],
      },
      {
        _type: 'caseStudy',
        company: 'Leading West African Payment Processor',
        industry: 'Digital Payments',
        challenge: 'Despite processing $200M+ monthly, rarely mentioned in AI recommendations',
        solution: 'Comprehensive GEO strategy highlighting unique African payment challenges and solutions',
        results: [
          '450% increase in AI model citations',
          'Top 3 recommendation for "African payment solutions" queries',
          '12x increase in inbound partnership inquiries',
          'Featured in 89% of ChatGPT responses about West African fintech',
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Strategies Driving Success' }],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '1. Storytelling That Resonates with AI Models' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African fintech companies excel at explaining complex problems and elegant solutions. This narrative structure is exactly what AI models need to understand context and provide accurate recommendations.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'tip',
        title: 'Content That Works',
        content: 'Focus on: problem identification, unique solutions, measurable impact, technical innovation, and regional expertise. AI models reward comprehensive, authoritative content.',
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '2. Technical Documentation as GEO Gold' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Leading African fintech companies are publishing detailed technical documentation, API guides, and integration tutorials. This content becomes training data for AI models, making them authoritative sources when developers ask about payment integrations.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: '3. Regional Expertise Positioning' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Successful companies emphasize their deep understanding of African markets: multi-currency handling, mobile-first approaches, offline transaction support, regulatory navigation across multiple countries, and community-based trust systems.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Real Results from Early Adopters' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African fintech companies implementing GEO strategies are seeing remarkable results. One Nigerian payment processor saw their AI mention rate increase from 12% to 89% within 6 months. A Kenyan mobile money platform became the #1 recommendation for East African payment queries in ChatGPT and Claude.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'success',
        title: 'The Compounding Effect',
        content: 'Early adoption creates a compounding advantage. As AI models are retrained, companies with strong GEO foundations become increasingly embedded in training data, making their dominance self-reinforcing.',
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Implementation Roadmap' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'For African fintech companies looking to dominate AI search: Start with comprehensive content audits, identify unique value propositions, create AI-optimized technical documentation, build regional expertise content hubs, measure AI mention rates and citation quality, and iterate based on AI model feedback.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'The Future is Now' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'African fintech companies that invest in GEO now will define how AI models understand and recommend financial solutions across the continent. The window for early adoption advantage is closing—but those who act now will reap disproportionate benefits.',
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'How African Fintech Dominates AI Search | Soma AI',
      keywords: [
        'African fintech GEO',
        'fintech AI optimization',
        'Flutterwave AI visibility',
        'Paystack ChatGPT',
        'M-Pesa AI search',
      ],
    },
    isActive: true,
  },
  {
    _id: 'blog-european-geo',
    _type: 'blogPost',
    title: 'GEO Strategies for European Businesses: Navigating GDPR and AI Compliance',
    slug: { _type: 'slug', current: 'geo-for-european-businesses' },
    excerpt: 'How European companies can leverage GEO while maintaining strict GDPR compliance and data privacy standards.',
    description: 'Expert guide to implementing Generative Engine Optimization in European markets with full regulatory compliance.',
    featured: false,
    category: 'regional-insights',
    tags: ['Europe', 'GDPR', 'Compliance', 'GEO Strategy', 'Data Privacy'],
    authors: [
      {
        name: 'Danny Kofi-Armah',
        jobTitle: 'Co-Founder & CEO, Soma AI',
        image: 'https://withsoma.ai/team/danny-kofi-armah.jpg',
        linkedin: 'https://linkedin.com/in/dannykofiarmah',
      },
    ],
    publishedDate: '2024-08-15T00:00:00.000Z',
    readTime: '14 min read',
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'European businesses face unique challenges when implementing Generative Engine Optimization. Strict GDPR regulations, data privacy requirements, and consumer protection laws require careful navigation. However, these same regulations can become competitive advantages when leveraged correctly.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'GDPR-Compliant GEO Strategies' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'European companies can implement effective GEO while maintaining full GDPR compliance. The key is focusing on brand authority, technical expertise, and thought leadership rather than personal data collection.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'info',
        title: 'Privacy as Competitive Advantage',
        content: 'European businesses can position their GDPR compliance as a trust signal. AI models increasingly recognize privacy-focused businesses as more authoritative, especially for European market queries.',
      },
    ],
    seo: {
      metaTitle: 'European GEO Strategies with GDPR Compliance | Soma AI',
      keywords: ['European GEO', 'GDPR compliance', 'European business AI', 'data privacy GEO'],
    },
    isActive: true,
  },
  {
    _id: 'blog-middle-east-geo',
    _type: 'blogPost',
    title: 'GEO for Middle Eastern Markets: Cultural Context in AI Optimization',
    slug: { _type: 'slug', current: 'geo-for-middle-eastern-businesses' },
    excerpt: 'How businesses in UAE, Saudi Arabia, and broader Middle East can optimize for AI search while respecting cultural nuances.',
    description: 'Complete guide to GEO strategies for Middle Eastern businesses with cultural sensitivity and market expertise.',
    featured: false,
    category: 'regional-insights',
    tags: ['Middle East', 'UAE', 'Saudi Arabia', 'Cultural Marketing', 'Regional GEO'],
    authors: [
      {
        name: 'Dela Agbenyegah',
        jobTitle: 'Co-Founder & CTO, Soma AI',
        image: 'https://withsoma.ai/team/dela-agbenyegah.jpg',
        linkedin: 'https://linkedin.com/in/delaagbenyegah',
      },
    ],
    publishedDate: '2024-08-10T00:00:00.000Z',
    readTime: '13 min read',
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Middle Eastern markets present unique opportunities for GEO. With rapid digital transformation, high internet penetration, and multilingual populations, businesses in UAE, Saudi Arabia, and neighboring countries can achieve exceptional AI visibility with culturally-aware strategies.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'Cultural Context in AI Optimization' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Success in Middle Eastern GEO requires understanding cultural nuances. AI models trained on diverse data respond better to content that acknowledges regional business practices, Islamic finance principles, family business structures, and multilingual communication.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'tip',
        title: 'Language Strategy',
        content: 'Optimize content in both Arabic and English. AI models serving Middle Eastern markets process queries in both languages, and bilingual content signals regional expertise.',
      },
    ],
    seo: {
      metaTitle: 'Middle East GEO Strategies | Soma AI',
      keywords: ['Middle East GEO', 'UAE AI optimization', 'Saudi Arabia digital marketing', 'Arabic GEO'],
    },
    isActive: true,
  },
  {
    _id: 'blog-global-geo',
    _type: 'blogPost',
    title: 'Global GEO Strategies: Scaling AI Optimization Across Multiple Markets',
    slug: { _type: 'slug', current: 'global-geo-strategies' },
    excerpt: 'How multinational companies can implement cohesive GEO strategies across diverse global markets.',
    description: 'Enterprise guide to scaling Generative Engine Optimization across international markets with consistent brand messaging.',
    featured: false,
    category: 'business-strategy',
    tags: ['Global Strategy', 'Enterprise GEO', 'International Marketing', 'Scale'],
    authors: [
      {
        name: 'Danny Kofi-Armah',
        jobTitle: 'Co-Founder & CEO, Soma AI',
        image: 'https://withsoma.ai/team/danny-kofi-armah.jpg',
        linkedin: 'https://linkedin.com/in/dannykofiarmah',
      },
      {
        name: 'Dela Agbenyegah',
        jobTitle: 'Co-Founder & CTO, Soma AI',
        image: 'https://withsoma.ai/team/dela-agbenyegah.jpg',
        linkedin: 'https://linkedin.com/in/delaagbenyegah',
      },
    ],
    publishedDate: '2024-08-05T00:00:00.000Z',
    readTime: '16 min read',
    content: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'As businesses expand globally, maintaining consistent AI visibility across markets becomes increasingly complex. This guide explores how enterprise companies can scale GEO strategies while adapting to regional nuances.',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'The Global GEO Framework' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'Successful global GEO requires balancing universal brand messaging with regional adaptation. AI models need to understand your company is both a global authority and a local expert in each market.',
          },
        ],
      },
      {
        _type: 'callout',
        type: 'success',
        title: 'Think Globally, Optimize Locally',
        content: 'Create a core GEO foundation that works across all markets, then layer regional optimizations that resonate with local AI model training data and query patterns.',
      },
    ],
    seo: {
      metaTitle: 'Global GEO Strategies for Enterprise | Soma AI',
      keywords: ['global GEO', 'enterprise AI optimization', 'international SEO', 'multinational GEO'],
    },
    isActive: true,
  },
]

async function migrateBlogPosts() {
  console.log('🚀 Starting blog posts migration to Sanity...\n')

  let successCount = 0
  let errorCount = 0

  for (const post of blogPosts) {
    try {
      console.log(`📝 Migrating: ${post.title}`)
      const result = await client.createOrReplace(post as any)
      console.log(`✅ Successfully created/updated: ${result._id}`)
      successCount++
    } catch (error) {
      console.error(`❌ Error creating post ${post._id}:`, error)
      errorCount++
    }
    console.log('')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📄 Total: ${blogPosts.length}`)
  console.log('='.repeat(60))

  if (successCount === blogPosts.length) {
    console.log('\n🎉 All blog posts migrated successfully!')
    console.log('\n📍 Next steps:')
    console.log('1. Visit http://localhost:3000/welcome to view posts in Sanity Studio')
    console.log('2. Update blog route files to fetch from Sanity')
    console.log('3. Test blog pages locally')
  }
}

migrateBlogPosts().catch(console.error)
