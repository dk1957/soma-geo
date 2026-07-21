/**
 * Case Studies Migration to Sanity
 * =================================
 * Migrate sample case studies with full data
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

const caseStudies = [
  {
    _id: 'case-study-fintech-africa',
    _type: 'caseStudy',
    title: 'How a Leading African Fintech Increased AI Visibility by 450%',
    slug: { _type: 'slug', current: 'african-fintech-ai-visibility' },
    excerpt: 'Major West African payment processor transforms from invisible to dominant in AI search results across ChatGPT, Claude, and Perplexity.',
    description: 'See how we helped a leading African fintech company achieve 450% increase in AI visibility and become the #1 recommendation for African payment solutions.',
    client: {
      name: 'Leading West African Payment Processor',
      industry: 'Fintech - Digital Payments',
      location: 'West Africa (Nigeria, Ghana, Kenya)',
      companySize: 'enterprise',
    },
    challenge: {
      headline: 'Invisible in AI Search Despite Market Leadership',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'Despite processing over $200M monthly and being a household name in West Africa, this fintech leader was virtually invisible when potential customers, investors, or partners asked AI chatbots about African payment solutions.',
          }],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'Their competitors with smaller market share were being recommended instead, leading to lost business opportunities and declining brand recognition among international stakeholders.',
          }],
        },
      ],
      metrics: [
        { label: 'AI Mention Rate', value: '12%', icon: 'TrendingDown' },
        { label: 'ChatGPT Recommendations', value: 'Rarely mentioned', icon: 'AlertCircle' },
        { label: 'Brand Recognition Score', value: '3.2/10', icon: 'BarChart2' },
      ],
    },
    solution: {
      headline: 'Comprehensive GEO Strategy Implementation',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'We implemented a multi-phase Generative Engine Optimization strategy focusing on authoritative content, technical SEO for AI crawlers, and strategic partnerships.',
          }],
        },
      ],
      strategies: [
        {
          title: 'Content Authority Building',
          description: 'Created comprehensive, AI-optimized content highlighting unique African market expertise and innovation stories.',
          icon: 'FileText',
        },
        {
          title: 'Technical AI Optimization',
          description: 'Restructured website architecture for optimal AI crawler indexing with structured data and semantic markup.',
          icon: 'Settings',
        },
        {
          title: 'Strategic Partnerships',
          description: 'Established partnerships with authoritative publications to amplify brand mentions in trusted sources.',
          icon: 'Users',
        },
        {
          title: 'Continuous Monitoring',
          description: 'Real-time tracking of AI mentions across all major LLMs with weekly optimization iterations.',
          icon: 'Activity',
        },
      ],
      timeline: '6 months',
    },
    results: {
      headline: '450% Increase in AI Visibility Within 6 Months',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'The transformation was remarkable. Within 6 months, the company went from being virtually invisible to becoming the #1 recommendation for African payment solutions across all major AI platforms.',
          }],
        },
      ],
      metrics: [
        { label: 'AI Mention Rate', value: '89%', icon: 'TrendingUp', highlight: true },
        { label: 'ChatGPT Position', value: '#1 Recommendation', icon: 'Award', highlight: true },
        { label: 'Qualified Leads', value: '+340%', icon: 'Users', highlight: true },
        { label: 'Brand Recognition', value: '9.1/10', icon: 'Star', highlight: false },
        { label: 'Partnership Inquiries', value: '+12x', icon: 'Mail', highlight: false },
        { label: 'International Visibility', value: '+580%', icon: 'Globe', highlight: false },
      ],
      quote: {
        text: 'Soma AI transformed how the world discovers us. We went from explaining who we are to being the go-to recommendation when anyone asks about African fintech. The ROI has been phenomenal.',
        author: 'Chief Marketing Officer',
        position: 'Leading West African Payment Processor',
      },
    },
    content: [
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'The Challenge: Invisible Despite Market Leadership' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: 'In early 2024, this leading fintech company faced a paradox: they were a household name in West Africa but virtually unknown in AI-driven search results. When potential partners asked ChatGPT or Claude about African payment solutions, competitors with fraction of their market share were recommended instead.',
        }],
      },
    ],
    category: 'fintech',
    tags: ['GEO', 'Fintech', 'African Business', 'AI Optimization', 'Payment Processing'],
    region: 'africa',
    featured: true,
    publishedDate: '2024-09-15T00:00:00.000Z',
    seo: {
      metaTitle: 'Case Study: 450% AI Visibility Increase for African Fintech | Soma AI',
      keywords: [
        'fintech case study',
        'GEO case study',
        'African fintech',
        'AI visibility',
        'ChatGPT optimization',
      ],
    },
    isActive: true,
  },
  {
    _id: 'case-study-ecommerce-mena',
    _type: 'caseStudy',
    title: 'E-commerce Giant Dominates AI Search in MENA Region',
    slug: { _type: 'slug', current: 'ecommerce-mena-ai-dominance' },
    excerpt: 'Leading Middle Eastern e-commerce platform becomes the default AI recommendation for online shopping in UAE, Saudi Arabia, and Egypt.',
    description: 'How we helped a MENA e-commerce leader achieve 95% AI recommendation rate and 4x increase in organic discovery.',
    client: {
      name: 'Major MENA E-commerce Platform',
      industry: 'E-commerce - Retail',
      location: 'Middle East (UAE, Saudi Arabia, Egypt)',
      companySize: 'enterprise',
    },
    challenge: {
      headline: 'Lost in Translation: Regional Leader, Global Unknown',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'Despite being the largest e-commerce platform in the MENA region with millions of active users, AI chatbots consistently recommended global competitors like Amazon instead, even for region-specific queries.',
          }],
        },
      ],
      metrics: [
        { label: 'AI Recommendation Rate', value: '8%', icon: 'TrendingDown' },
        { label: 'Regional Queries', value: 'Rarely first choice', icon: 'MapPin' },
      ],
    },
    solution: {
      headline: 'Regional Expertise + AI Optimization',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'We positioned the client as the regional expert with deep cultural understanding, local logistics expertise, and Arabic language support—factors global competitors couldn\'t match.',
          }],
        },
      ],
      strategies: [
        {
          title: 'Cultural Positioning',
          description: 'Emphasized unique regional advantages: Arabic interface, local payment methods, cultural product curation.',
          icon: 'Globe',
        },
        {
          title: 'Multilingual Optimization',
          description: 'Optimized content in both Arabic and English for comprehensive AI model coverage.',
          icon: 'Languages',
        },
        {
          title: 'Local Success Stories',
          description: 'Showcased thousands of MENA seller success stories and regional market insights.',
          icon: 'Award',
        },
      ],
      timeline: '4 months',
    },
    results: {
      headline: '95% AI Recommendation Rate for MENA Shopping Queries',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'Within 4 months, the platform became the default recommendation for e-commerce in the MENA region, with AI models consistently citing their regional expertise and logistics capabilities.',
          }],
        },
      ],
      metrics: [
        { label: 'AI Recommendation Rate', value: '95%', icon: 'Target', highlight: true },
        { label: 'Organic Discovery', value: '+400%', icon: 'TrendingUp', highlight: true },
        { label: 'New Seller Signups', value: '+230%', icon: 'Users', highlight: true },
        { label: 'International Recognition', value: '+8x', icon: 'Globe', highlight: false },
      ],
      quote: {
        text: 'The impact was immediate. When people ask AI about shopping in Dubai or Saudi Arabia, we\'re now the first recommendation. Soma AI helped us own our regional authority.',
        author: 'VP of Marketing',
        position: 'Major MENA E-commerce Platform',
      },
    },
    category: 'ecommerce',
    tags: ['E-commerce', 'MENA', 'Regional GEO', 'Multilingual', 'Retail'],
    region: 'middle-east',
    featured: true,
    publishedDate: '2024-08-22T00:00:00.000Z',
    seo: {
      metaTitle: 'Case Study: E-commerce AI Dominance in MENA | Soma AI',
      keywords: ['ecommerce case study', 'MENA e-commerce', 'AI optimization', 'regional SEO'],
    },
    isActive: true,
  },
  {
    _id: 'case-study-saas-europe',
    _type: 'caseStudy',
    title: 'European SaaS Startup Achieves Enterprise Recognition Through AI',
    slug: { _type: 'slug', current: 'european-saas-ai-recognition' },
    excerpt: 'Unknown startup becomes ChatGPT\'s top recommendation in their category within 3 months.',
    description: 'How a European B2B SaaS company leveraged GEO to compete with enterprise giants and achieve 600% lead growth.',
    client: {
      name: 'Emerging European SaaS Company',
      industry: 'SaaS - B2B Software',
      location: 'Europe (Germany, UK)',
      companySize: 'startup',
    },
    challenge: {
      headline: 'Startup vs. Enterprise Giants in AI Recommendations',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'As a startup with limited marketing budget, competing against established enterprise software companies for AI recommendations seemed impossible. Their innovative solution was unknown to AI models.',
          }],
        },
      ],
      metrics: [
        { label: 'AI Visibility', value: 'Not mentioned', icon: 'EyeOff' },
        { label: 'Lead Generation', value: '12/month', icon: 'Users' },
      ],
    },
    solution: {
      headline: 'Innovation Storytelling + Technical Excellence',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'We focused on their unique innovation angle, GDPR compliance advantages, and European data sovereignty—factors increasingly important to AI-savvy buyers.',
          }],
        },
      ],
      strategies: [
        {
          title: 'Innovation Positioning',
          description: 'Highlighted unique technical approaches and next-generation features competitors lacked.',
          icon: 'Zap',
        },
        {
          title: 'Thought Leadership',
          description: 'Published authoritative technical content positioning founders as industry experts.',
          icon: 'BookOpen',
        },
        {
          title: 'GDPR Advantage',
          description: 'Emphasized European data privacy compliance as key differentiator.',
          icon: 'Shield',
        },
      ],
      timeline: '3 months',
    },
    results: {
      headline: 'From Unknown to #1 Recommendation in 3 Months',
      description: [
        {
          _type: 'block',
          style: 'normal',
          children: [{
            _type: 'span',
            text: 'The startup became ChatGPT\'s top recommendation in their software category, consistently beating enterprise competitors. Their innovative approach and GDPR compliance resonated with AI models.',
          }],
        },
      ],
      metrics: [
        { label: 'ChatGPT Position', value: '#1 in Category', icon: 'Award', highlight: true },
        { label: 'Qualified Leads', value: '+600%', icon: 'TrendingUp', highlight: true },
        { label: 'Enterprise Demos', value: '+890%', icon: 'Calendar', highlight: true },
        { label: 'Monthly ARR', value: '+45%', icon: 'DollarSign', highlight: false },
      ],
      quote: {
        text: 'We couldn\'t compete with enterprise budgets, but Soma AI helped us win on innovation and trust. Being ChatGPT\'s top recommendation changed our entire trajectory.',
        author: 'CEO & Co-Founder',
        position: 'Emerging European SaaS Company',
      },
    },
    category: 'saas',
    tags: ['SaaS', 'Startup', 'B2B', 'Europe', 'GDPR', 'Enterprise'],
    region: 'europe',
    featured: true,
    publishedDate: '2024-07-10T00:00:00.000Z',
    seo: {
      metaTitle: 'Case Study: SaaS Startup AI Success | Soma AI',
      keywords: ['SaaS case study', 'startup growth', 'B2B SaaS', 'ChatGPT optimization'],
    },
    isActive: true,
  },
]

async function migrateCaseStudies() {
  console.log('🚀 Starting case studies migration to Sanity...\n')

  let successCount = 0
  let errorCount = 0

  for (const caseStudy of caseStudies) {
    try {
      console.log(`📝 Migrating: ${caseStudy.title}`)
      const result = await client.createOrReplace(caseStudy as any)
      console.log(`✅ Successfully created/updated: ${result._id}`)
      successCount++
    } catch (error) {
      console.error(`❌ Error creating case study ${caseStudy._id}:`, error)
      errorCount++
    }
    console.log('')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📄 Total: ${caseStudies.length}`)
  console.log('='.repeat(60))

  if (successCount === caseStudies.length) {
    console.log('\n🎉 All case studies migrated successfully!')
    console.log('\n📍 Next steps:')
    console.log('1. Visit http://localhost:3000/welcome to view in Sanity Studio')
    console.log('2. Create case studies page component')
    console.log('3. Add case study detail page with dynamic routing')
  }
}

migrateCaseStudies().catch(console.error)
