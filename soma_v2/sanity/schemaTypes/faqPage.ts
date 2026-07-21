import { defineType, defineField } from 'sanity'
import { HelpCircle } from 'lucide-react'

export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ Page',
  type: 'document',
  icon: HelpCircle,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Frequently Asked Questions',
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
      initialValue: { current: 'faq' },
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
        },
        {
          name: 'subheadline',
          title: 'Subheadline',
          type: 'text',
          rows: 2,
        },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'FAQ Categories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'categoryName',
              title: 'Category Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'categoryIcon',
              title: 'Category Icon',
              type: 'string',
              description: 'lucide-react icon name',
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
                      type: 'array',
                      of: [{ type: 'block' }],
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'relatedLinks',
                      title: 'Related Links',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          fields: [
                            {
                              name: 'text',
                              title: 'Link Text',
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
                    },
                  ],
                  preview: {
                    select: {
                      title: 'question',
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'categoryName',
              questions: 'questions',
            },
            prepare({ title, questions }) {
              const count = questions?.length || 0
              return {
                title,
                subtitle: `${count} question${count !== 1 ? 's' : ''}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
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
          name: 'contactInfo',
          title: 'Show Contact Info',
          type: 'boolean',
          initialValue: true,
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
      categories: 'categories',
      isActive: 'isActive',
    },
    prepare({ title, categories, isActive }) {
      const categoryCount = categories?.length || 0
      return {
        title: `${isActive ? '✅' : '❌'} ${title}`,
        subtitle: `${categoryCount} categor${categoryCount !== 1 ? 'ies' : 'y'}`,
      }
    },
  },
})
