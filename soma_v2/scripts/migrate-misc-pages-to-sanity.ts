import { createClient } from 'next-sanity'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '4de42y7s',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

/**
 * Migration script for miscellaneous pages: Legal (Privacy, Terms), Pricing, Contact, FAQ
 * Run: npx tsx scripts/migrate-misc-pages-to-sanity.ts
 */

const legalPages = [
  {
    _type: 'legalPage',
    _id: 'privacy-policy',
    title: 'Privacy Policy',
    slug: { current: 'privacy', _type: 'slug' },
    description: 'How Soma AI protects your privacy and handles your data',
    lastUpdated: '2024-12-15',
    effectiveDate: '2024-12-15',
    badges: [
      {
        text: 'GDPR Compliant',
        icon: 'Shield',
        color: 'text-green-600',
      },
      {
        text: 'Secure by Design',
        icon: 'Lock',
        color: 'text-blue-600',
      },
      {
        text: 'Transparent Practices',
        icon: 'Eye',
        color: 'text-purple-600',
      },
    ],
    sections: [
      {
        title: 'Introduction',
        icon: 'FileText',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'At Soma AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Generative Engine Optimization (GEO) platform and services.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Information We Collect',
        icon: 'Database',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We collect information that you provide directly to us, including:',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
          {
            _type: 'list',
            items: [
              'Account information (name, email, company details)',
              'Brand and business information for GEO optimization',
              'Usage data and analytics',
              'Communication preferences',
              'Payment and billing information',
            ],
          },
        ],
      },
      {
        title: 'How We Use Your Information',
        icon: 'Target',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We use the information we collect to:',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
          {
            _type: 'list',
            items: [
              'Provide and improve our GEO services',
              'Analyze AI platform visibility and generate reports',
              'Communicate with you about our services',
              'Process transactions and send related information',
              'Detect and prevent fraud or technical issues',
              'Comply with legal obligations',
            ],
          },
        ],
      },
      {
        title: 'Data Security',
        icon: 'Shield',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Your Rights',
        icon: 'Users',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'You have the right to:',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
          {
            _type: 'list',
            items: [
              'Access your personal data',
              'Correct inaccurate data',
              'Request deletion of your data',
              'Object to data processing',
              'Export your data',
              'Withdraw consent at any time',
            ],
          },
        ],
      },
      {
        title: 'Cookies and Tracking',
        icon: 'Cookie',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'International Data Transfers',
        icon: 'Globe',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Your information may be transferred to and maintained on computers located outside of your country or jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Changes to This Policy',
        icon: 'RefreshCw',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
    ],
    contactSection: {
      title: 'Contact Us About Privacy',
      description:
        'If you have questions about this Privacy Policy or how we handle your data, please contact us.',
      showContactInfo: true,
    },
    seo: {
      metaTitle: 'Privacy Policy | Soma AI - Data Protection & Privacy',
      metaDescription:
        "Soma AI's comprehensive privacy policy. Learn how we protect your data, handle personal information, and ensure GDPR compliance.",
      keywords: [
        'Soma AI privacy policy',
        'data protection',
        'GDPR compliance',
        'privacy practices',
        'data security',
      ],
    },
    isActive: true,
  },
  {
    _type: 'legalPage',
    _id: 'terms-of-service',
    title: 'Terms of Service',
    slug: { current: 'terms', _type: 'slug' },
    description: 'Legal terms and conditions for using Soma AI services',
    lastUpdated: '2024-12-15',
    effectiveDate: '2024-12-15',
    badges: [
      {
        text: 'Fair & Transparent',
        icon: 'Scale',
        color: 'text-blue-600',
      },
      {
        text: 'Rights Protected',
        icon: 'Shield',
        color: 'text-green-600',
      },
      {
        text: 'Clear Terms',
        icon: 'FileText',
        color: 'text-purple-600',
      },
    ],
    sections: [
      {
        title: 'Agreement to Terms',
        icon: 'FileSignature',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'By accessing and using Soma AI\'s platform and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Use of Services',
        icon: 'Settings',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'You agree to use our services only for lawful purposes and in accordance with these terms. You are responsible for:',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
          {
            _type: 'list',
            items: [
              'Maintaining the security of your account',
              'All activities that occur under your account',
              'Ensuring your use complies with applicable laws',
              'Not interfering with or disrupting the services',
              'Not attempting unauthorized access to our systems',
            ],
          },
        ],
      },
      {
        title: 'Intellectual Property',
        icon: 'Copyright',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'The Soma AI platform, including all content, features, and functionality, is owned by Soma AI and protected by international copyright, trademark, and other intellectual property laws. You retain ownership of your brand data and content.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Service Availability',
        icon: 'Activity',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We strive to provide continuous service availability, but we do not guarantee uninterrupted access. We may modify, suspend, or discontinue services with reasonable notice.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Payment Terms',
        icon: 'CreditCard',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Subscription fees are billed in advance. You authorize us to charge your payment method for all fees. Refunds are provided according to our 90-day guarantee policy.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Limitation of Liability',
        icon: 'AlertTriangle',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'To the maximum extent permitted by law, Soma AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the services.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Termination',
        icon: 'XCircle',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Either party may terminate these terms at any time. Upon termination, your right to use the services will immediately cease. We may retain certain data as required by law or for legitimate business purposes.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
      {
        title: 'Governing Law',
        icon: 'Scale',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'These terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
    ],
    contactSection: {
      title: 'Questions About Terms',
      description:
        'If you have questions about these Terms of Service, please contact our legal team.',
      showContactInfo: true,
    },
    seo: {
      metaTitle: 'Terms of Service | Soma AI - Legal Terms & Conditions',
      metaDescription:
        "Soma AI's terms of service and conditions of use. Understand your rights and obligations when using our GEO platform.",
      keywords: [
        'Soma AI terms of service',
        'terms and conditions',
        'user agreement',
        'service terms',
        'legal conditions',
      ],
    },
    isActive: true,
  },
]

const pricingPage = {
  _type: 'pricingPage',
  _id: 'pricing',
  title: 'Pricing',
  slug: { current: 'pricing', _type: 'slug' },
  hero: {
    headline: 'Choose Your AI Dominance Plan',
    subheadline: 'Simple, transparent pricing for every stage of your AI visibility journey',
    socialProof: 'Join 500+ marketing leaders already dominating AI search',
  },
  pricingTiers: [
    {
      name: 'Starter',
      description: 'Perfect for brands just starting their AI visibility journey',
      price: {
        amount: 997,
        currency: 'USD',
        period: 'month',
        displayText: '$997/month',
      },
      features: [
        'Monthly AI Visibility Audit (3 platforms)',
        'LVI Score tracking',
        'Up to 50 keyword queries monitored',
        'Basic competitor analysis (2 competitors)',
        'Monthly optimization recommendations',
        'Email support',
      ],
      cta: {
        text: 'Start Free Trial',
        url: '/signup?plan=starter',
      },
      featured: false,
    },
    {
      name: 'Professional',
      description: 'For growing brands serious about AI dominance',
      price: {
        amount: 2497,
        currency: 'USD',
        period: 'month',
        displayText: '$2,497/month',
      },
      features: [
        'Bi-weekly AI Visibility Audits (7 platforms)',
        'Advanced LVI Score tracking with trends',
        'Up to 200 keyword queries monitored',
        'Comprehensive competitor analysis (5 competitors)',
        'Bi-weekly optimization recommendations',
        'Content optimization guidance',
        'Priority email & chat support',
        'Quarterly strategy sessions',
      ],
      cta: {
        text: 'Get Started',
        url: '/signup?plan=professional',
      },
      featured: true,
      badge: 'Most Popular',
    },
    {
      name: 'Enterprise',
      description: 'For market leaders requiring white-glove service',
      price: {
        displayText: 'Custom Pricing',
      },
      features: [
        'Weekly AI Visibility Audits (all platforms)',
        'Real-time LVI Score monitoring',
        'Unlimited keyword queries',
        'Full competitive intelligence suite',
        'Weekly optimization recommendations',
        'Dedicated content optimization team',
        'Custom integration support',
        'Dedicated account manager',
        'Monthly executive reports',
        'On-demand strategy sessions',
      ],
      cta: {
        text: 'Contact Sales',
        url: '/contact?inquiry=enterprise',
      },
      featured: false,
    },
  ],
  comparisonTable: {
    enabled: false,
  },
  faq: [
    {
      question: 'Can I change plans later?',
      answer:
        'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
    },
    {
      question: 'What is your refund policy?',
      answer:
        'We offer a 90-day money-back guarantee. If your LVI score doesn\'t improve within 90 days, we\'ll refund your investment in full.',
    },
    {
      question: 'Do you offer regional pricing?',
      answer:
        'Yes, we offer pricing in local currencies for Nigeria, Kenya, Ghana, South Africa, UAE, and Saudi Arabia. Contact us for regional rates.',
    },
    {
      question: 'Are there any setup fees?',
      answer:
        'No setup fees. You only pay the monthly subscription cost.',
    },
  ],
  finalCta: {
    title: 'Ready to Dominate AI Search?',
    description:
      'Start your 14-day free trial today. No credit card required. Cancel anytime.',
    primaryCta: {
      text: 'Start Free Trial',
      url: '/signup',
    },
    secondaryCta: {
      text: 'Schedule a Demo',
      url: '/contact',
    },
  },
  seo: {
    metaTitle: 'Pricing | Soma AI - AI Visibility Plans & Pricing',
    metaDescription:
      'Transparent pricing for Soma AI\'s Generative Engine Optimization platform. Choose the perfect plan for your AI visibility goals.',
    keywords: [
      'Soma AI pricing',
      'GEO pricing',
      'AI visibility pricing',
      'ChatGPT optimization cost',
    ],
  },
  isActive: true,
}

const contactPage = {
  _type: 'contactPage',
  _id: 'contact',
  title: 'Contact',
  slug: { current: 'contact', _type: 'slug' },
  hero: {
    headline: 'Get in Touch with Our GEO Experts',
    subheadline:
      'Ready to transform your AI search visibility? Schedule a consultation with our team.',
  },
  contactMethods: [
    {
      icon: 'Mail',
      title: 'Email Us',
      value: 'hello@withsoma.ai',
      link: 'mailto:hello@withsoma.ai',
    },
    {
      icon: 'Phone',
      title: 'Call Us',
      value: '+254 700 000 000',
      link: 'tel:+254700000000',
    },
    {
      icon: 'MapPin',
      title: 'Visit Us',
      value: 'Nairobi, Kenya\nWest Africa offices in Lagos & Accra',
    },
    {
      icon: 'Clock',
      title: 'Business Hours',
      value: 'Monday - Friday: 9:00 AM - 6:00 PM EAT\nWeekends: By appointment',
    },
  ],
  offices: [
    {
      city: 'Nairobi',
      country: 'Kenya',
      address: 'Westlands, Nairobi\nKenya',
      isHeadquarters: true,
    },
    {
      city: 'Lagos',
      country: 'Nigeria',
      address: 'Victoria Island, Lagos\nNigeria',
      isHeadquarters: false,
    },
    {
      city: 'Accra',
      country: 'Ghana',
      address: 'Airport City, Accra\nGhana',
      isHeadquarters: false,
    },
  ],
  formSettings: {
    enabled: true,
    title: 'Send Us a Message',
    description: 'Fill out the form below and we\'ll get back to you within 24 hours.',
    submitButtonText: 'Send Message',
    inquiryTypes: [
      'General Inquiry',
      'Sales & Pricing',
      'Technical Support',
      'Partnership Opportunities',
      'Enterprise Solutions',
      'Media & Press',
    ],
  },
  faq: [
    {
      question: 'How quickly will I receive a response?',
      answer:
        'We typically respond to all inquiries within 24 hours during business days.',
    },
    {
      question: 'Can I schedule a demo?',
      answer:
        'Yes! Select "Sales & Pricing" as your inquiry type and mention your preferred time in the message.',
    },
    {
      question: 'Do you offer technical support?',
      answer:
        'Yes, all paid plans include technical support. Enterprise customers receive priority support.',
    },
  ],
  seo: {
    metaTitle: 'Contact Soma AI | Get in Touch with Our GEO Experts',
    metaDescription:
      'Contact Soma AI for expert guidance on Generative Engine Optimization. Schedule a consultation to transform your AI search visibility.',
    keywords: [
      'contact Soma AI',
      'GEO consultation',
      'AI optimization experts',
      'soma ai support',
    ],
  },
  isActive: true,
}

const faqPage = {
  _type: 'faqPage',
  _id: 'faq',
  title: 'Frequently Asked Questions',
  slug: { current: 'faq', _type: 'slug' },
  hero: {
    headline: 'Frequently Asked Questions',
    subheadline:
      'Everything you need to know about AI brand monitoring and Generative Engine Optimization',
  },
  categories: [
    {
      categoryName: 'Getting Started',
      categoryIcon: 'Rocket',
      questions: [
        {
          question: 'What is AI brand monitoring?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'AI brand monitoring tracks how artificial intelligence models like ChatGPT, Claude, Gemini, and Perplexity mention your brand when users ask relevant questions about your industry or products. It helps you understand and improve your brand\'s visibility in AI-powered search results.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        {
          question: 'How does AI brand monitoring differ from traditional SEO?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Traditional SEO optimizes for search engine rankings with multiple results. AI brand monitoring focuses on being mentioned in AI responses, which typically provide just 2-3 definitive recommendations. This requires different optimization strategies focused on authority, credibility, and structured information.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        {
          question: 'What is the LVI (LLM Visibility Index)?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'The LVI is a proprietary metric (scored 0-100) that measures how often and how favorably AI language models mention your brand across different queries and contexts. A higher LVI score indicates stronger AI visibility and authority in your market.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
      ],
    },
    {
      categoryName: 'Platform & Features',
      categoryIcon: 'Settings',
      questions: [
        {
          question: 'Which AI platforms do you monitor?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'We monitor all major AI platforms including ChatGPT, Claude, Google Gemini, Perplexity, Microsoft Copilot, Meta AI, and other emerging LLMs. Different plans offer different levels of platform coverage.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        {
          question: 'How often is my LVI score updated?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Update frequency depends on your plan: Starter plans receive monthly updates, Professional plans get bi-weekly updates, and Enterprise customers receive weekly or real-time monitoring.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        {
          question: 'Can I track my competitors?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Yes! All plans include competitor analysis. You can track 2-5 competitors depending on your plan, seeing their LVI scores, visibility trends, and what strategies they\'re using.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
      ],
    },
    {
      categoryName: 'Results & ROI',
      categoryIcon: 'TrendingUp',
      questions: [
        {
          question: 'How quickly will I see results?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Most clients see measurable improvements in their LVI score within 60-90 days. However, results vary based on your starting position, industry competitiveness, and implementation speed. Our 90-day guarantee ensures you see meaningful progress.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        {
          question: 'What kind of ROI can I expect?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Our clients typically see a 3-5x ROI within the first year through increased high-intent leads, improved brand authority, and reduced customer acquisition costs. Enterprise clients often achieve 10x+ ROI through market dominance.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
      ],
    },
    {
      categoryName: 'Pricing & Plans',
      categoryIcon: 'CreditCard',
      questions: [
        {
          question: 'Can I try before I buy?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'Yes! We offer a 14-day free trial with no credit card required. You can also request a free AI Visibility Audit to see your current LVI score before committing.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
          relatedLinks: [
            {
              text: 'Start Free Trial',
              url: '/signup',
            },
          ],
        },
        {
          question: 'What is your refund policy?',
          answer: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'We offer a 90-day money-back guarantee. If your LVI score doesn\'t meaningfully improve within 90 days, we\'ll refund your investment in full—no questions asked.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
      ],
    },
  ],
  ctaSection: {
    title: 'Still Have Questions?',
    description:
      'Our team is here to help. Get in touch and we\'ll answer all your questions about AI visibility and GEO.',
    primaryCta: {
      text: 'Contact Us',
      url: '/contact',
    },
    contactInfo: true,
  },
  seo: {
    metaTitle: 'FAQ | Soma AI - AI Brand Monitoring Questions Answered',
    metaDescription:
      'Get answers to common questions about AI brand monitoring, LLM discoverability, and Generative Engine Optimization with Soma AI.',
    keywords: [
      'AI brand monitoring FAQ',
      'GEO questions',
      'ChatGPT optimization questions',
      'LVI score explained',
    ],
  },
  isActive: true,
}

async function migratePages() {
  console.log('🚀 Starting migration of miscellaneous pages to Sanity...\n')

  try {
    // Migrate legal pages
    for (const page of legalPages) {
      await client.createOrReplace(page)
      console.log(`✅ Created/Updated: ${page.title} (/${page.slug.current})`)
    }

    // Migrate pricing page
    await client.createOrReplace(pricingPage)
    console.log(`✅ Created/Updated: ${pricingPage.title} (/${pricingPage.slug.current})`)

    // Migrate contact page
    await client.createOrReplace(contactPage)
    console.log(`✅ Created/Updated: ${contactPage.title} (/${contactPage.slug.current})`)

    // Migrate FAQ page
    await client.createOrReplace(faqPage)
    console.log(`✅ Created/Updated: ${faqPage.title} (/${faqPage.slug.current})`)

    console.log('\n✨ All pages migrated successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Open Sanity Studio: http://localhost:3000/welcome')
    console.log('2. Review and edit the migrated content')
    console.log('3. Update route files to use new Sanity components')
    console.log('4. Test pages locally before deploying')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migratePages()
