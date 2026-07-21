import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Internal reference (not displayed on page)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Set to true to publish this landing page',
      initialValue: true,
    }),

    // Hero Section
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({
          name: 'animatedText',
          title: 'Animated Text (First Line)',
          type: 'string',
          description: 'Text that animates through different AI platforms',
          initialValue: 'ChatGPT',
        }),
        defineField({
          name: 'secondLine',
          title: 'Second Line',
          type: 'string',
          initialValue: 'Recommends',
        }),
        defineField({
          name: 'thirdLine',
          title: 'Third Line (Bold)',
          type: 'string',
          initialValue: 'Your Competitors',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
          initialValue: 'Change that.',
        }),
        defineField({
          name: 'videoUrl',
          title: 'Background Video URL',
          type: 'url',
          description: 'YouTube embed URL for background video',
        }),
        defineField({
          name: 'ctaPrimary',
          title: 'Primary CTA Text',
          type: 'string',
          initialValue: 'Get Your Free AI Report',
        }),
        defineField({
          name: 'ctaSecondary',
          title: 'Secondary CTA Text',
          type: 'string',
          initialValue: 'Schedule Demo',
        }),
        defineField({
          name: 'socialProofText',
          title: 'Social Proof Text',
          type: 'text',
          rows: 2,
          initialValue: 'Currently in private beta with select brands and agencies.',
        }),
      ],
    }),

    // Stats Section
    defineField({
      name: 'stats',
      title: 'Statistics Section',
      type: 'object',
      fields: [
        defineField({
          name: 'sectionTitle',
          title: 'Section Title',
          type: 'string',
          initialValue: 'The AI Revolution is Here',
        }),
        defineField({
          name: 'statistics',
          title: 'Statistics',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'value', title: 'Value', type: 'string', validation: (Rule) => Rule.required() },
                { name: 'suffix', title: 'Suffix', type: 'string', description: '%, B, M, etc.' },
                { name: 'description', title: 'Description', type: 'text', rows: 2, validation: (Rule) => Rule.required() },
                { name: 'source', title: 'Source', type: 'string', description: 'e.g., Gartner Research' },
              ],
            },
          ],
          validation: (Rule) => Rule.max(3),
        }),
        defineField({
          name: 'trustIndicators',
          title: 'Trust Indicators',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Security/compliance badges',
          initialValue: ['SOC 2 Compliant', 'GDPR Ready', 'Enterprise SSO', '99.9% Uptime'],
        }),
      ],
    }),

    // How It Works Section
    defineField({
      name: 'howItWorks',
      title: 'How It Works Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Three Steps to',
        }),
        defineField({
          name: 'titleHighlight',
          title: 'Title Highlight (Second Line)',
          type: 'string',
          initialValue: 'Regional Leadership',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle',
          type: 'text',
          rows: 2,
          initialValue: 'Position your African or Middle Eastern brand as the go-to choice for global stakeholders',
        }),
        defineField({
          name: 'steps',
          title: 'Steps',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'number', title: 'Step Number', type: 'string', validation: (Rule) => Rule.required() },
                { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
                { name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.required() },
                { 
                  name: 'icon', 
                  title: 'Icon', 
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Search', value: 'Search' },
                      { title: 'Pencil', value: 'Pencil' },
                      { title: 'Bar Chart', value: 'BarChart3' },
                      { title: 'Bot', value: 'Bot' },
                      { title: 'Zap', value: 'Zap' },
                    ],
                  },
                },
              ],
            },
          ],
          validation: (Rule) => Rule.max(3).min(3),
        }),
      ],
    }),

    // Enterprise Section
    defineField({
      name: 'enterprise',
      title: 'Enterprise Section',
      type: 'object',
      fields: [
        defineField({
          name: 'sectionLabel',
          title: 'Section Label',
          type: 'string',
          initialValue: 'For Market Leaders',
        }),
        defineField({
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Built for',
        }),
        defineField({
          name: 'titleHighlight',
          title: 'Title Highlight',
          type: 'string',
          initialValue: 'Regional Markets',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'capabilities',
          title: 'Core Capabilities',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
                { name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.required() },
              ],
            },
          ],
          validation: (Rule) => Rule.max(3).min(3),
        }),
        defineField({
          name: 'ctaText',
          title: 'CTA Text',
          type: 'string',
          initialValue: 'Schedule Executive Briefing',
        }),
        defineField({
          name: 'ctaLink',
          title: 'CTA Link',
          type: 'string',
          initialValue: '/contact',
        }),
      ],
    }),

    // FAQ Section
    defineField({
      name: 'faq',
      title: 'FAQ Section',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Questions Leaders Ask',
        }),
        defineField({
          name: 'questions',
          title: 'Questions',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() },
                { name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (Rule) => Rule.required() },
              ],
            },
          ],
        }),
      ],
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Title for search engines and social media',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Description for search engines and social media',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'SEO keywords',
        }),
        defineField({
          name: 'ogImage',
          title: 'Social Share Image',
          type: 'image',
          description: 'Image for social media sharing',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'hero.thirdLine',
      active: 'isActive',
    },
    prepare({ title, subtitle, active }) {
      return {
        title: title || 'Landing Page',
        subtitle: `${subtitle || ''} ${active ? '✓' : '(Inactive)'}`,
      }
    },
  },
})
