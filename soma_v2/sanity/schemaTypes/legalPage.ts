import { defineType, defineField } from 'sanity'
import { FileText } from 'lucide-react'

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal Page',
  type: 'document',
  icon: FileText,
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
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Short description for SEO',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'badges',
      title: 'Top Badges',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Text',
              type: 'string',
            },
            {
              name: 'icon',
              title: 'Icon Name',
              type: 'string',
              description: 'lucide-react icon name (e.g., Shield, Lock, Eye)',
            },
            {
              name: 'color',
              title: 'Icon Color',
              type: 'string',
              options: {
                list: [
                  { title: 'Green', value: 'text-green-600' },
                  { title: 'Blue', value: 'text-blue-600' },
                  { title: 'Purple', value: 'text-purple-600' },
                  { title: 'Red', value: 'text-red-600' },
                  { title: 'Orange', value: 'text-orange-600' },
                ],
              },
            },
          ],
        },
      ],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Section Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'icon',
              title: 'Icon Name',
              type: 'string',
              description: 'lucide-react icon name (optional)',
            },
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [
                { type: 'block' },
                {
                  type: 'object',
                  name: 'subsection',
                  title: 'Subsection',
                  fields: [
                    {
                      name: 'heading',
                      title: 'Heading',
                      type: 'string',
                    },
                    {
                      name: 'content',
                      title: 'Content',
                      type: 'array',
                      of: [{ type: 'block' }],
                    },
                  ],
                },
                {
                  type: 'object',
                  name: 'list',
                  title: 'List',
                  fields: [
                    {
                      name: 'items',
                      title: 'Items',
                      type: 'array',
                      of: [{ type: 'string' }],
                    },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'title',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'contactSection',
      title: 'Contact Section',
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
          rows: 3,
        },
        {
          name: 'showContactInfo',
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
      description: 'Set to false to hide this page',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      isActive: 'isActive',
    },
    prepare({ title, slug, isActive }) {
      return {
        title: `${isActive ? '✅' : '❌'} ${title}`,
        subtitle: `/${slug}`,
      }
    },
  },
})
