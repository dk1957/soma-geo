import { defineType, defineField } from 'sanity'
import { CreditCard } from 'lucide-react'

export const pricingPage = defineType({
  name: 'pricingPage',
  title: 'Pricing Page',
  type: 'document',
  icon: CreditCard,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Pricing',
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
      initialValue: { current: 'pricing' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'subheadline',
          title: 'Subheadline',
          type: 'text',
          rows: 2,
        },
        {
          name: 'socialProof',
          title: 'Social Proof Text',
          type: 'string',
          description: 'e.g., "Join 500+ marketing leaders..."',
        },
      ],
    }),
    defineField({
      name: 'pricingTiers',
      title: 'Pricing Tiers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Tier Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'price',
              title: 'Price',
              type: 'object',
              fields: [
                {
                  name: 'amount',
                  title: 'Amount',
                  type: 'number',
                },
                {
                  name: 'currency',
                  title: 'Currency',
                  type: 'string',
                  options: {
                    list: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR', 'AED', 'SAR'],
                  },
                  initialValue: 'USD',
                },
                {
                  name: 'period',
                  title: 'Period',
                  type: 'string',
                  options: {
                    list: ['month', 'year', 'quarter', 'one-time'],
                  },
                  initialValue: 'month',
                },
                {
                  name: 'displayText',
                  title: 'Display Text',
                  type: 'string',
                  description: 'Custom display text (e.g., "Starting at $X/mo")',
                },
              ],
            },
            {
              name: 'features',
              title: 'Features',
              type: 'array',
              of: [{ type: 'string' }],
            },
            {
              name: 'cta',
              title: 'Call to Action',
              type: 'object',
              fields: [
                {
                  name: 'text',
                  title: 'Button Text',
                  type: 'string',
                  initialValue: 'Get Started',
                },
                {
                  name: 'url',
                  title: 'URL',
                  type: 'string',
                },
              ],
            },
            {
              name: 'featured',
              title: 'Featured Tier',
              type: 'boolean',
              initialValue: false,
              description: 'Highlight this tier',
            },
            {
              name: 'badge',
              title: 'Badge',
              type: 'string',
              description: 'e.g., "Most Popular", "Best Value"',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'price.displayText',
              featured: 'featured',
            },
            prepare({ title, subtitle, featured }) {
              return {
                title: `${featured ? '⭐ ' : ''}${title}`,
                subtitle,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'comparisonTable',
      title: 'Feature Comparison Table',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Show Comparison Table',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'title',
          title: 'Table Title',
          type: 'string',
        },
        {
          name: 'features',
          title: 'Features',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'feature',
                  title: 'Feature Name',
                  type: 'string',
                },
                {
                  name: 'availability',
                  title: 'Tier Availability',
                  type: 'array',
                  of: [{ type: 'string' }],
                  description: 'Tier names where this feature is available',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'faq',
      title: 'Pricing FAQ',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'finalCta',
      title: 'Final CTA Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'text',
          rows: 2,
        },
        {
          name: 'primaryCta',
          title: 'Primary CTA',
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Text',
              type: 'string',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
            },
          ],
        },
        {
          name: 'secondaryCta',
          title: 'Secondary CTA',
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Text',
              type: 'string',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          validation: (Rule) => Rule.max(60),
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.max(160),
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      isActive: 'isActive',
    },
    prepare({ title, isActive }) {
      return {
        title: `${isActive ? '✅' : '❌'} ${title}`,
        subtitle: 'Pricing Page',
      }
    },
  },
})
