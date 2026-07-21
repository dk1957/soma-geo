import { defineField, defineType } from 'sanity'

/**
 * Case Study Schema
 * =================
 * Full case study documents with client results, challenges, solutions
 */

export default defineType({
  name: 'caseStudy',
  title: 'Case Studies',
  type: 'document',
  fields: [
    // Basic Information
    defineField({
      name: 'title',
      title: 'Case Study Title',
      type: 'string',
      description: 'e.g., "How Flutterwave Increased AI Visibility by 450%"',
      validation: (Rule) => Rule.required().max(100),
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
      name: 'excerpt',
      title: 'Short Excerpt',
      type: 'text',
      description: 'Brief summary for cards/previews (max 200 chars)',
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      description: 'SEO meta description (max 160 chars)',
      rows: 2,
      validation: (Rule) => Rule.required().max(160),
    }),

    // Client Information
    defineField({
      name: 'client',
      title: 'Client',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Client Name',
          type: 'string',
          description: 'e.g., "Flutterwave" or "Anonymous Fintech Leader"',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'logo',
          title: 'Client Logo',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
            },
          ],
        },
        {
          name: 'industry',
          title: 'Industry',
          type: 'string',
          description: 'e.g., "Fintech", "E-commerce", "SaaS"',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'location',
          title: 'Location',
          type: 'string',
          description: 'e.g., "Nigeria", "West Africa", "Global"',
        },
        {
          name: 'companySize',
          title: 'Company Size',
          type: 'string',
          options: {
            list: [
              { title: 'Startup (1-50)', value: 'startup' },
              { title: 'Small (51-200)', value: 'small' },
              { title: 'Medium (201-1000)', value: 'medium' },
              { title: 'Enterprise (1000+)', value: 'enterprise' },
            ],
          },
        },
        {
          name: 'website',
          title: 'Website URL',
          type: 'url',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // Challenge Section
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Challenge Headline',
          type: 'string',
          description: 'e.g., "Low AI Search Visibility"',
          validation: (Rule) => Rule.required().max(100),
        },
        {
          name: 'description',
          title: 'Challenge Description',
          type: 'array',
          of: [{ type: 'block' }],
          description: 'Detailed description of the problem',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'metrics',
          title: 'Before Metrics',
          type: 'array',
          description: 'Key metrics before working with Soma AI',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'label', type: 'string', title: 'Metric Label' },
                { name: 'value', type: 'string', title: 'Value' },
                {
                  name: 'icon',
                  type: 'string',
                  title: 'Icon Name (optional)',
                  description: 'Lucide icon name',
                },
              ],
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // Solution Section
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Solution Headline',
          type: 'string',
          description: 'e.g., "Comprehensive GEO Strategy Implementation"',
          validation: (Rule) => Rule.required().max(100),
        },
        {
          name: 'description',
          title: 'Solution Description',
          type: 'array',
          of: [{ type: 'block' }],
          description: 'What we did to solve the problem',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'strategies',
          title: 'Key Strategies',
          type: 'array',
          description: 'List of strategies implemented',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', type: 'string', title: 'Strategy Title' },
                { name: 'description', type: 'text', title: 'Description', rows: 2 },
                { name: 'icon', type: 'string', title: 'Icon Name (optional)' },
              ],
            },
          ],
        },
        {
          name: 'timeline',
          title: 'Timeline',
          type: 'string',
          description: 'e.g., "6 months", "3-month sprint"',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // Results Section
    defineField({
      name: 'results',
      title: 'Results',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Results Headline',
          type: 'string',
          description: 'e.g., "450% Increase in AI Visibility"',
          validation: (Rule) => Rule.required().max(100),
        },
        {
          name: 'description',
          title: 'Results Description',
          type: 'array',
          of: [{ type: 'block' }],
          description: 'Overall impact and outcomes',
        },
        {
          name: 'metrics',
          title: 'After Metrics',
          type: 'array',
          description: 'Key metrics after working with Soma AI',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'label', type: 'string', title: 'Metric Label' },
                { name: 'value', type: 'string', title: 'Value' },
                { name: 'icon', type: 'string', title: 'Icon Name (optional)' },
                {
                  name: 'highlight',
                  type: 'boolean',
                  title: 'Highlight This Metric',
                  description: 'Show prominently',
                  initialValue: false,
                },
              ],
            },
          ],
          validation: (Rule) => Rule.required().min(1),
        },
        {
          name: 'quote',
          title: 'Client Testimonial',
          type: 'object',
          fields: [
            { name: 'text', type: 'text', title: 'Quote', rows: 3 },
            { name: 'author', type: 'string', title: 'Author Name' },
            { name: 'position', type: 'string', title: 'Position/Title' },
            { name: 'photo', type: 'image', title: 'Photo' },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // Rich Content
    defineField({
      name: 'content',
      title: 'Full Case Study Content',
      type: 'array',
      description: 'Detailed case study content with images, quotes, etc.',
      of: [
        { type: 'block' },
        {
          type: 'image',
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
    }),

    // Categories & Tags
    defineField({
      name: 'category',
      title: 'Primary Category',
      type: 'string',
      options: {
        list: [
          { title: 'Fintech', value: 'fintech' },
          { title: 'E-commerce', value: 'ecommerce' },
          { title: 'SaaS', value: 'saas' },
          { title: 'Healthcare', value: 'healthcare' },
          { title: 'Education', value: 'education' },
          { title: 'Real Estate', value: 'real-estate' },
          { title: 'Technology', value: 'technology' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'region',
      title: 'Region Focus',
      type: 'string',
      options: {
        list: [
          { title: 'Africa', value: 'africa' },
          { title: 'Europe', value: 'europe' },
          { title: 'Middle East', value: 'middle-east' },
          { title: 'North America', value: 'north-america' },
          { title: 'Asia', value: 'asia' },
          { title: 'Global', value: 'global' },
        ],
      },
    }),

    // Media
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      description: 'Hero image for the case study',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      description: 'Additional images (screenshots, charts, etc.)',
      of: [
        {
          type: 'image',
          fields: [
            { name: 'alt', type: 'string', title: 'Alt Text' },
            { name: 'caption', type: 'string', title: 'Caption' },
          ],
        },
      ],
    }),

    // Metadata
    defineField({
      name: 'featured',
      title: 'Featured Case Study',
      type: 'boolean',
      description: 'Show prominently on homepage/case studies page',
      initialValue: false,
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'relatedCaseStudies',
      title: 'Related Case Studies',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'caseStudy' }] }],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'relatedBlogPosts',
      title: 'Related Blog Posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
      validation: (Rule) => Rule.max(3),
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          title: 'Meta Title',
          description: 'Override default title for SEO',
          validation: (Rule) => Rule.max(60),
        },
        {
          name: 'keywords',
          type: 'array',
          title: 'Keywords',
          of: [{ type: 'string' }],
        },
        {
          name: 'ogImage',
          type: 'image',
          title: 'Open Graph Image',
          description: 'Social media share image',
        },
      ],
    }),

    // Status
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Show this case study on the website',
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      clientName: 'client.name',
      category: 'category',
      featured: 'featured',
      media: 'featuredImage',
    },
    prepare(selection) {
      const { title, clientName, category, featured, media } = selection
      return {
        title: title || 'Untitled Case Study',
        subtitle: `${clientName} | ${category}${featured ? ' ⭐' : ''}`,
        media,
      }
    },
  },
})
