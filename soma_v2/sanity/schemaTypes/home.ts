import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'home',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Internal reference',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),

    // Hero Section
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {
          name: 'aiPlatforms',
          title: 'AI Platforms (Animated)',
          type: 'array',
          description: 'Add/remove AI platforms that will rotate in the hero text',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Platform Name',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'logo',
                  title: 'Logo',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'textColor',
                  title: 'Text Color (Hex)',
                  type: 'string',
                  description: 'e.g., #10a37f or #CC785C',
                  initialValue: '#000000',
                },
                {
                  name: 'order',
                  title: 'Display Order',
                  type: 'number',
                  initialValue: 0,
                },
              ],
              preview: {
                select: {
                  title: 'name',
                  media: 'logo',
                  order: 'order',
                },
                prepare({ title, media, order }) {
                  return {
                    title: `${order}. ${title}`,
                    media,
                  }
                },
              },
            },
          ],
          validation: (Rule) => Rule.required().min(1).max(10),
        },
        {
          name: 'secondLine',
          title: 'Second Line',
          type: 'string',
          initialValue: 'Recommends',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'thirdLine',
          title: 'Third Line (Bold)',
          type: 'string',
          initialValue: 'Your Competitors',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
          initialValue: 'Change that.',
        },
        {
          name: 'videoUrl',
          title: 'Background Video URL',
          type: 'url',
          description: 'YouTube embed URL',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'ctaPrimary',
          title: 'Primary CTA Text',
          type: 'string',
          initialValue: 'Get Your Free AI Report',
        },
        {
          name: 'ctaSecondary',
          title: 'Secondary CTA Text',
          type: 'string',
          initialValue: 'Schedule Demo',
        },
        {
          name: 'socialProofText',
          title: 'Social Proof Text',
          type: 'text',
          rows: 2,
        },
      ],
    }),

    // Stats Section
    defineField({
      name: 'stats',
      title: 'Statistics Section',
      type: 'object',
      fields: [
        {
          name: 'sectionTitle',
          title: 'Section Title',
          type: 'string',
          initialValue: 'The AI Revolution is Here',
        },
        {
          name: 'statistics',
          title: 'Statistics',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'value',
                  title: 'Value',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'suffix',
                  title: 'Suffix',
                  type: 'string',
                  description: '%, B, M, etc.',
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'text',
                  rows: 2,
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'source',
                  title: 'Source',
                  type: 'string',
                  description: 'e.g., Gartner Research',
                },
              ],
              preview: {
                select: {
                  title: 'value',
                  subtitle: 'description',
                },
              },
            },
          ],
          validation: (Rule) => Rule.max(3),
        },
        {
          name: 'trustIndicators',
          title: 'Trust Indicators',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'e.g., SOC 2 Compliant, GDPR Ready',
        },
      ],
    }),

    // How It Works
    defineField({
      name: 'howItWorks',
      title: 'How It Works Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          initialValue: 'Three Steps to',
        },
        {
          name: 'titleHighlight',
          title: 'Title Highlight (Second Line)',
          type: 'string',
          initialValue: 'Regional Leadership',
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'text',
          rows: 2,
        },
        {
          name: 'steps',
          title: 'Steps',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'number',
                  title: 'Step Number',
                  type: 'string',
                  description: '01, 02, 03',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'text',
                  rows: 3,
                  validation: (Rule) => Rule.required(),
                },
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
              preview: {
                select: {
                  number: 'number',
                  title: 'title',
                },
                prepare({ number, title }) {
                  return {
                    title: `${number}. ${title}`,
                  }
                },
              },
            },
          ],
          validation: (Rule) => Rule.max(3),
        },
      ],
    }),

    // Enterprise Section
    defineField({
      name: 'enterprise',
      title: 'Enterprise Section',
      type: 'object',
      fields: [
        {
          name: 'sectionLabel',
          title: 'Section Label',
          type: 'string',
          initialValue: 'For Market Leaders',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          initialValue: 'Built for',
        },
        {
          name: 'titleHighlight',
          title: 'Title Highlight (Second Line)',
          type: 'string',
          initialValue: 'Regional Markets',
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'text',
          rows: 3,
        },
        {
          name: 'capabilities',
          title: 'Capabilities',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'text',
                  rows: 3,
                  validation: (Rule) => Rule.required(),
                },
              ],
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'description',
                },
              },
            },
          ],
          validation: (Rule) => Rule.max(3),
        },
        {
          name: 'ctaText',
          title: 'CTA Button Text',
          type: 'string',
          initialValue: 'Schedule Executive Briefing',
        },
        {
          name: 'ctaLink',
          title: 'CTA Link',
          type: 'string',
          initialValue: '/contact',
        },
      ],
    }),

    // FAQ Section
    defineField({
      name: 'faq',
      title: 'FAQ Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          initialValue: 'Questions Leaders Ask',
        },
        {
          name: 'questions',
          title: 'Questions',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'question',
                  title: 'Question',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'answer',
                  title: 'Answer',
                  type: 'text',
                  rows: 3,
                  validation: (Rule) => Rule.required(),
                },
              ],
              preview: {
                select: {
                  title: 'question',
                  subtitle: 'answer',
                },
              },
            },
          ],
        },
      ],
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'ogImage',
          title: 'OG Image',
          type: 'image',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      active: 'isActive',
    },
    prepare({ title, active }) {
      return {
        title: title || 'Home Page',
        subtitle: active ? '✅ Active' : '❌ Inactive',
      }
    },
  },
})
