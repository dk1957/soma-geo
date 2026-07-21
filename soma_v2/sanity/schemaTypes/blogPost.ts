import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
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
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Post',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Business Strategy', value: 'business-strategy' },
          { title: 'Fintech Strategy', value: 'fintech-strategy' },
          { title: 'GEO Guides', value: 'geo-guides' },
          { title: 'Case Studies', value: 'case-studies' },
          { title: 'Regional Insights', value: 'regional-insights' },
          { title: 'Comparisons', value: 'comparisons' },
          { title: 'Industry Analysis', value: 'industry-analysis' },
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Name' },
            { name: 'jobTitle', type: 'string', title: 'Job Title' },
            { name: 'image', type: 'url', title: 'Image URL' },
            { name: 'linkedin', type: 'url', title: 'LinkedIn URL' },
          ],
        },
      ],
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time',
      type: 'string',
      description: 'E.g., "10 min read"',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
        {
          type: 'object',
          name: 'caseStudy',
          title: 'Case Study Box',
          fields: [
            { name: 'company', type: 'string', title: 'Company Name' },
            { name: 'industry', type: 'string', title: 'Industry' },
            { name: 'challenge', type: 'text', title: 'Challenge' },
            { name: 'solution', type: 'text', title: 'Solution' },
            { name: 'results', type: 'array', of: [{ type: 'string' }], title: 'Results' },
          ],
        },
        {
          type: 'object',
          name: 'callout',
          title: 'Callout Box',
          fields: [
            { 
              name: 'type', 
              type: 'string', 
              title: 'Type',
              options: {
                list: ['info', 'warning', 'success', 'tip']
              }
            },
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'content', type: 'text', title: 'Content' },
          ],
        },
      ],
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', type: 'string', title: 'Meta Title' },
        { name: 'keywords', type: 'array', of: [{ type: 'string' }], title: 'Keywords' },
        { name: 'ogImage', type: 'image', title: 'Open Graph Image' },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      date: 'publishedDate',
      featured: 'featured',
    },
    prepare(selection) {
      const { title, category, date, featured } = selection
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date'
      return {
        title,
        subtitle: `${category || 'Uncategorized'} • ${formattedDate}${featured ? ' • ⭐ Featured' : ''}`,
      }
    },
  },
})
