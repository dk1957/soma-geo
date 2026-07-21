import {defineField, defineType} from 'sanity'

/**
 * Country Page Schema for Regional Landing Pages
 * ==============================================
 * 
 * Supports country-specific landing pages with localized content,
 * statistics, case studies, and market insights.
 */

export default defineType({
  name: 'countryPage',
  title: 'Country Page',
  type: 'document',
  fields: [
    // Country Identification
    defineField({
      name: 'country',
      title: 'Country',
      type: 'object',
      fields: [
        defineField({name: 'name', title: 'Country Name', type: 'string', validation: Rule => Rule.required()}),
        defineField({name: 'code', title: 'Country Code (ISO)', type: 'string', description: 'e.g., NG, DE, GB'}),
        defineField({name: 'flag', title: 'Flag Emoji', type: 'string', description: 'e.g., 🇳🇬, 🇩🇪'}),
        defineField({name: 'currency', title: 'Currency', type: 'string', description: 'e.g., NGN, EUR, GBP'}),
        defineField({name: 'phoneCode', title: 'Phone Code', type: 'string', description: 'e.g., +234, +49'}),
      ]
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path (e.g., "nigeria", "germany")',
      options: {
        source: 'country.name',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),

    // Hero Section
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({name: 'headline', title: 'Headline', type: 'string'}),
        defineField({name: 'headlineHighlight', title: 'Headline Highlight Text', type: 'string', description: 'The colorized/highlighted part'}),
        defineField({name: 'subheadline', title: 'Subheadline', type: 'text', rows: 3}),
        defineField({name: 'ctaPrimary', title: 'Primary CTA Text', type: 'string', initialValue: 'Start Free Trial'}),
        defineField({name: 'ctaPrimaryLink', title: 'Primary CTA Link', type: 'string', initialValue: '/signup'}),
        defineField({name: 'ctaSecondary', title: 'Secondary CTA Text', type: 'string'}),
        defineField({name: 'ctaSecondaryLink', title: 'Secondary CTA Link', type: 'string'}),
        defineField({
          name: 'badges',
          title: 'Hero Badges',
          type: 'array',
          of: [{type: 'string'}],
          description: 'e.g., "200+ companies", "GDPR compliant"'
        }),
      ]
    }),

    // Statistics
    defineField({
      name: 'stats',
      title: 'Statistics',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g., "50+", "340%", "24/7"'}),
          defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g., "Fintech Clients"'}),
        ]
      }]
    }),

    // Market Specialization
    defineField({
      name: 'specialization',
      title: 'Market Specialization',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Section Title', type: 'string'}),
        defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
        defineField({
          name: 'features',
          title: 'Features',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({name: 'title', title: 'Title', type: 'string'}),
              defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
              defineField({name: 'icon', title: 'Icon Name', type: 'string', description: 'Lucide icon name'}),
              defineField({name: 'colorScheme', title: 'Color Scheme', type: 'string', description: 'e.g., "green", "blue", "purple"'}),
            ]
          }]
        }),
      ]
    }),

    // Case Studies / Success Stories
    defineField({
      name: 'caseStudies',
      title: 'Case Studies',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Section Title', type: 'string'}),
        defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
        defineField({
          name: 'stories',
          title: 'Success Stories',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({name: 'category', title: 'Category', type: 'string', description: 'e.g., "Fintech", "Manufacturing"'}),
              defineField({name: 'title', title: 'Title', type: 'string'}),
              defineField({name: 'subtitle', title: 'Subtitle', type: 'string'}),
              defineField({name: 'quote', title: 'Quote', type: 'text', rows: 3}),
              defineField({name: 'author', title: 'Author Name', type: 'string'}),
              defineField({name: 'authorTitle', title: 'Author Title', type: 'string'}),
              defineField({name: 'company', title: 'Company Name', type: 'string'}),
              defineField({
                name: 'metrics',
                title: 'Key Metrics',
                type: 'array',
                of: [{
                  type: 'object',
                  fields: [
                    defineField({name: 'label', title: 'Label', type: 'string'}),
                    defineField({name: 'value', title: 'Value', type: 'string'}),
                  ]
                }]
              }),
            ]
          }]
        }),
      ]
    }),

    // Market Insights
    defineField({
      name: 'marketInsights',
      title: 'Market Insights',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Section Title', type: 'string'}),
        defineField({name: 'description', title: 'Description', type: 'string'}),
        defineField({
          name: 'categories',
          title: 'Insight Categories',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({name: 'title', title: 'Category Title', type: 'string'}),
              defineField({
                name: 'queries',
                title: 'Popular Queries',
                type: 'array',
                of: [{type: 'string'}]
              }),
            ]
          }]
        }),
      ]
    }),

    // Industries & Cities
    defineField({
      name: 'industries',
      title: 'Key Industries',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g., "Fintech", "E-commerce", "Manufacturing"'
    }),

    defineField({
      name: 'cities',
      title: 'Major Cities',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g., "Lagos", "Berlin", "London"'
    }),

    // CTA Section
    defineField({
      name: 'finalCta',
      title: 'Final CTA Section',
      type: 'object',
      fields: [
        defineField({name: 'headline', title: 'Headline', type: 'string'}),
        defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
        defineField({name: 'ctaPrimary', title: 'Primary CTA Text', type: 'string'}),
        defineField({name: 'ctaPrimaryLink', title: 'Primary CTA Link', type: 'string'}),
        defineField({name: 'ctaSecondary', title: 'Secondary CTA Text', type: 'string'}),
        defineField({name: 'ctaSecondaryLink', title: 'Secondary CTA Link', type: 'string'}),
        defineField({
          name: 'features',
          title: 'Feature Badges',
          type: 'array',
          of: [{type: 'string'}],
          description: 'e.g., "Free 14-day trial", "No credit card required"'
        }),
      ]
    }),

    // SEO & Contact
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        defineField({name: 'metaTitle', title: 'Meta Title', type: 'string', validation: Rule => Rule.max(60)}),
        defineField({name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3, validation: Rule => Rule.max(160)}),
        defineField({name: 'keywords', title: 'Keywords', type: 'array', of: [{type: 'string'}]}),
        defineField({name: 'ogImage', title: 'Social Share Image', type: 'image'}),
      ]
    }),

    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        defineField({name: 'email', title: 'Email', type: 'string'}),
        defineField({name: 'phone', title: 'Phone', type: 'string'}),
        defineField({name: 'address', title: 'Address', type: 'text', rows: 2}),
      ]
    }),

    // Publishing
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),

    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
      description: 'Uncheck to hide this country page'
    }),
  ],
  preview: {
    select: {
      title: 'country.name',
      slug: 'slug.current',
      flag: 'country.flag',
      active: 'isActive'
    },
    prepare({title, slug, flag, active}) {
      return {
        title: `${flag || '🌍'} ${title}`,
        subtitle: `/${slug}${!active ? ' (Inactive)' : ''}`,
      }
    }
  }
})
