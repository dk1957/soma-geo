/**
 * Help & Documentation Page Migration to Sanity
 * ==============================================
 * Creates comprehensive help/documentation content
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

const helpPage = {
  _id: 'help-page',
  _type: 'page',
  title: 'Help & Documentation',
  slug: {
    _type: 'slug',
    current: 'help',
  },
  description: 'Comprehensive guides and documentation for getting the most out of Soma AI GEO platform',
  
  hero: {
    headline: 'How Can We Help You?',
    subheadline: 'Get started quickly with our comprehensive guides, tutorials, and support resources. Whether you\'re new to GEO or an advanced user, we\'ve got you covered.',
    ctaText: 'Contact Support',
    ctaLink: '/contact',
    backgroundGradient: 'from-blue-50 to-purple-50',
  },

  content: [
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '🚀 Getting Started' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { 
          _type: 'span', 
          text: 'New to Generative Engine Optimization? Start here to understand how Soma AI helps your brand dominate AI-driven search engines like ChatGPT, Claude, Gemini, and Perplexity.' 
        },
      ],
    },

    // Getting Started Section
    {
      _type: 'callout',
      style: 'info',
      title: 'Quick Start Guide',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '1. ' },
            { _type: 'span', text: 'Sign Up: ', marks: ['strong'] },
            { _type: 'span', text: 'Create your account at ' },
            { _type: 'span', text: '/signup', marks: ['code'] },
            { _type: 'span', text: ' and complete your brand profile' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '2. ' },
            { _type: 'span', text: 'Run Your First Audit: ', marks: ['strong'] },
            { _type: 'span', text: 'Discover how AI currently sees your brand with our free visibility audit' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '3. ' },
            { _type: 'span', text: 'Review Your LDI Score: ', marks: ['strong'] },
            { _type: 'span', text: 'Understand your Language-based Discovery Index and benchmark against competitors' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '4. ' },
            { _type: 'span', text: 'Implement Optimizations: ', marks: ['strong'] },
            { _type: 'span', text: 'Follow our recommendations to improve your AI visibility' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '5. ' },
            { _type: 'span', text: 'Track Progress: ', marks: ['strong'] },
            { _type: 'span', text: 'Monitor improvements through your dashboard analytics' },
          ],
        },
      ],
    },

    // Core Concepts
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '📚 Core Concepts' }],
    },

    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'What is GEO (Generative Engine Optimization)?' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { 
          _type: 'span', 
          text: 'Generative Engine Optimization (GEO) is the practice of optimizing your brand\'s digital presence to rank higher and get recommended more frequently by AI-powered search engines and chatbots. Unlike traditional SEO that focuses on search result rankings, GEO ensures your brand becomes the ' 
        },
        { _type: 'span', text: 'direct answer', marks: ['strong'] },
        { _type: 'span', text: ' AI provides to users.' },
      ],
    },

    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'Understanding Your LDI Score' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { 
          _type: 'span', 
          text: 'Your Language-based Discovery Index (LDI) is a proprietary metric that measures how visible and favorably your brand is represented across AI platforms. It considers:' 
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [{ _type: 'span', text: 'Mention frequency: How often AI mentions your brand' }],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [{ _type: 'span', text: 'Recommendation quality: Position and context of mentions' }],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [{ _type: 'span', text: 'Competitive positioning: How you rank vs competitors' }],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [{ _type: 'span', text: 'Sentiment analysis: Positive vs negative mentions' }],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [{ _type: 'span', text: 'Query relevance: Alignment with high-value search queries' }],
    },

    // Platform Features
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '🎯 Platform Features' }],
    },

    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'Dashboard Overview' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Your dashboard provides real-time insights into your AI visibility performance:' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'LDI Score: ', marks: ['strong'] },
        { _type: 'span', text: 'Your overall AI visibility metric with trend analysis' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Mention Tracking: ', marks: ['strong'] },
        { _type: 'span', text: 'See when and where AI mentions your brand' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Competitor Analysis: ', marks: ['strong'] },
        { _type: 'span', text: 'Benchmark against industry leaders' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Query Performance: ', marks: ['strong'] },
        { _type: 'span', text: 'Track specific queries and your ranking' },
      ],
    },

    {
      _type: 'block',
      style: 'h3',
      children: [{ _type: 'span', text: 'Reports & Analytics' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Generate comprehensive reports for stakeholders with detailed insights on visibility trends, competitive positioning, and ROI metrics. Export as PDF or share via secure link.' },
      ],
    },

    // Best Practices
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '✨ Best Practices' }],
    },

    {
      _type: 'callout',
      style: 'success',
      title: 'Content Optimization Tips',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '• ', marks: ['strong'] },
            { _type: 'span', text: 'Create authoritative content: AI favors well-researched, expert content with clear sources' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '• ', marks: ['strong'] },
            { _type: 'span', text: 'Use structured data: Implement schema markup to help AI understand your content' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '• ', marks: ['strong'] },
            { _type: 'span', text: 'Focus on quotable snippets: Format key insights as clear, standalone statements' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '• ', marks: ['strong'] },
            { _type: 'span', text: 'Answer specific questions: Create FAQ-style content addressing user queries' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '• ', marks: ['strong'] },
            { _type: 'span', text: 'Build topical authority: Cover topics comprehensively with interlinked content' },
          ],
        },
      ],
    },

    // Regional Guides
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '🌍 Regional Optimization Guides' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Soma AI specializes in helping brands dominate AI search in specific markets:' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: '🇰🇪🇿🇦🇳🇬🇬🇭 African Markets: ', marks: ['strong'] },
        { _type: 'span', text: 'Strategies for Kenya, South Africa, Nigeria, Ghana - ' },
        { 
          _type: 'span', 
          text: 'Read Guide',
          marks: ['strong', {
            _type: 'link',
            href: '/blog/geo-for-african-businesses'
          }]
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: '🇦🇪🇸🇦 Middle East: ', marks: ['strong'] },
        { _type: 'span', text: 'UAE, Saudi Arabia, and MENA optimization - ' },
        { 
          _type: 'span', 
          text: 'Read Guide',
          marks: ['strong', {
            _type: 'link',
            href: '/blog/geo-for-middle-eastern-businesses'
          }]
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: '🇬🇧🇩🇪 European Markets: ', marks: ['strong'] },
        { _type: 'span', text: 'UK, Germany, France strategies - ' },
        { 
          _type: 'span', 
          text: 'Read Guide',
          marks: ['strong', {
            _type: 'link',
            href: '/blog/geo-for-european-businesses'
          }]
        },
      ],
    },

    // Support
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '💬 Support & Contact' }],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Need help? Our team is here for you:' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Email Support: ', marks: ['strong'] },
        { _type: 'span', text: 'support@withsoma.ai (24-hour response time)' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Live Chat: ', marks: ['strong'] },
        { _type: 'span', text: 'Available in-app during business hours' },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'Schedule a Call: ', marks: ['strong'] },
        { 
          _type: 'span', 
          text: 'Book time with our team',
          marks: [{
            _type: 'link',
            href: '/contact'
          }]
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { _type: 'span', text: 'FAQ: ', marks: ['strong'] },
        { 
          _type: 'span', 
          text: 'Check frequently asked questions',
          marks: [{
            _type: 'link',
            href: '/faq'
          }]
        },
      ],
    },

    // Common Issues
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '🔧 Troubleshooting Common Issues' }],
    },

    {
      _type: 'callout',
      style: 'warning',
      title: 'Low LDI Score?',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: 'If your LDI score is lower than expected:' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '1. Ensure your website is accessible to AI crawlers (check robots.txt)' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '2. Add structured data to key pages' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '3. Create high-quality, quotable content addressing common queries' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '4. Build authoritative backlinks from trusted sources' },
          ],
        },
        {
          _type: 'block',
          style: 'normal',
          children: [
            { _type: 'span', text: '5. Contact our team for a personalized audit' },
          ],
        },
      ],
    },

    // Additional Resources
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: '📖 Additional Resources' }],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { 
          _type: 'span', 
          text: 'Blog: Latest GEO insights and strategies',
          marks: [{
            _type: 'link',
            href: '/blog'
          }]
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { 
          _type: 'span', 
          text: 'Case Studies: Real results from real brands',
          marks: [{
            _type: 'link',
            href: '/case-studies'
          }]
        },
      ],
    },
    {
      _type: 'block',
      listItem: 'bullet',
      children: [
        { 
          _type: 'span', 
          text: 'Pricing: Choose the right plan for your needs',
          marks: [{
            _type: 'link',
            href: '/pricing'
          }]
        },
      ],
    },
  ],

  seo: {
    metaTitle: 'Help & Documentation | Soma AI',
    metaDescription: 'Comprehensive guides, tutorials, and support for Soma AI GEO platform. Learn how to optimize your brand for AI-driven search engines.',
    keywords: ['GEO help', 'documentation', 'support', 'tutorials', 'guides', 'AI optimization'],
  },

  publishedAt: new Date().toISOString(),
}

async function migrateHelpPage() {
  console.log('🚀 Starting help page migration to Sanity...\n')
  
  try {
    console.log('📝 Creating Help & Documentation page...')
    
    await client.createOrReplace(helpPage)
    
    console.log('✅ Successfully created help page!\n')
    
    console.log('============================================================')
    console.log('📊 Migration Complete!')
    console.log('============================================================')
    console.log('✅ Help & Documentation page created')
    console.log('============================================================\n')
    
    console.log('📍 Next steps:')
    console.log('1. Visit http://localhost:3000/welcome to view in Sanity Studio')
    console.log('2. Create /app/help/page.tsx route')
    console.log('3. Test help page at http://localhost:3000/help')
    console.log('4. Add help link to navigation')
  } catch (error) {
    console.error('❌ Failed to migrate help page:', error)
    process.exit(1)
  }
}

migrateHelpPage()
