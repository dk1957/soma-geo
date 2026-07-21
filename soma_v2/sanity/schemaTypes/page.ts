import {defineField, defineType} from 'sanity'

/**
 * Page Schema for Marketing/Landing Pages
 * =======================================
 * 
 * This schema supports all non-dashboard pages (landing, about, pricing, etc.)
 * Editors can manage content via Sanity Studio without touching code.
 */

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path (e.g., "about" for /about)',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Page Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of the page (for internal use and meta)'
    }),
    
    // Hero Section
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          description: 'Main headline (H1)'
        }),
        defineField({
          name: 'subheadline',
          title: 'Subheadline',
          type: 'text',
          rows: 2
        }),
        defineField({
          name: 'ctaText',
          title: 'CTA Button Text',
          type: 'string',
          initialValue: 'Get Started'
        }),
        defineField({
          name: 'ctaLink',
          title: 'CTA Link',
          type: 'string',
          initialValue: '/signup'
        }),
        defineField({
          name: 'image',
          title: 'Hero Image',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility'
            }
          ]
        }),
        defineField({
          name: 'backgroundGradient',
          title: 'Background Gradient',
          type: 'string',
          description: 'Tailwind gradient classes (e.g., "from-blue-500 to-purple-600")',
          initialValue: 'from-blue-50 to-indigo-100'
        })
      ]
    }),

    // Main Content (Portable Text - rich text with images, code blocks, etc.)
    defineField({
      name: 'content',
      title: 'Page Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL'
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        }
      ]
    }),

    // Features Section (for landing page)
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'string', title: 'Feature Title'}),
            defineField({name: 'description', type: 'text', title: 'Description', rows: 3}),
            defineField({name: 'icon', type: 'string', title: 'Icon Name', description: 'Lucide icon name (e.g., "Zap", "Shield", "TrendingUp")'}),
          ]
        }
      ]
    }),

    // SEO Metadata
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Override page title for search engines (recommended: 50-60 chars)',
          validation: Rule => Rule.max(60)
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Description for search results (recommended: 150-160 chars)',
          validation: Rule => Rule.max(160)
        }),
        defineField({
          name: 'ogImage',
          title: 'Social Share Image',
          type: 'image',
          description: 'Image shown when page is shared on social media (1200x630px recommended)'
        }),
        defineField({
          name: 'noIndex',
          title: 'Hide from Search Engines',
          type: 'boolean',
          initialValue: false,
          description: 'Prevent search engines from indexing this page'
        })
      ]
    }),

    // Navigation & Publishing
    defineField({
      name: 'showInNav',
      title: 'Show in Navigation',
      type: 'boolean',
      initialValue: false,
      description: 'Display this page in the main site navigation'
    }),
    defineField({
      name: 'navOrder',
      title: 'Navigation Order',
      type: 'number',
      description: 'Sort order in navigation (lower numbers appear first)',
      initialValue: 0
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'When this page was published'
    })
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      media: 'hero.image'
    },
    prepare({title, slug, media}) {
      return {
        title,
        subtitle: `/${slug}`,
        media
      }
    }
  }
})
