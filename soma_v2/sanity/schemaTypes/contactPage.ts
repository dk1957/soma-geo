import { defineType, defineField } from 'sanity'
import { Mail } from 'lucide-react'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  icon: Mail,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Contact',
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
      initialValue: { current: 'contact' },
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
      name: 'contactMethods',
      title: 'Contact Methods',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Email', value: 'Mail' },
                  { title: 'Phone', value: 'Phone' },
                  { title: 'Location', value: 'MapPin' },
                  { title: 'Clock', value: 'Clock' },
                  { title: 'Message', value: 'MessageSquare' },
                  { title: 'Calendar', value: 'Calendar' },
                ],
              },
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              name: 'value',
              title: 'Value',
              type: 'text',
              rows: 2,
            },
            {
              name: 'link',
              title: 'Link',
              type: 'string',
              description: 'Optional link (e.g., mailto:, tel:)',
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'value',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'offices',
      title: 'Office Locations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'city',
              title: 'City',
              type: 'string',
            },
            {
              name: 'country',
              title: 'Country',
              type: 'string',
            },
            {
              name: 'address',
              title: 'Address',
              type: 'text',
              rows: 2,
            },
            {
              name: 'isHeadquarters',
              title: 'Headquarters',
              type: 'boolean',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              city: 'city',
              country: 'country',
              isHq: 'isHeadquarters',
            },
            prepare({ city, country, isHq }) {
              return {
                title: `${isHq ? '🏢 ' : ''}${city}`,
                subtitle: country,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Show Contact Form',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'title',
          title: 'Form Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Form Description',
          type: 'text',
          rows: 2,
        },
        {
          name: 'submitButtonText',
          title: 'Submit Button Text',
          type: 'string',
          initialValue: 'Send Message',
        },
        {
          name: 'inquiryTypes',
          title: 'Inquiry Types',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Dropdown options for inquiry type',
        },
      ],
    }),
    defineField({
      name: 'faq',
      title: 'Contact FAQ',
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
        subtitle: 'Contact Page',
      }
    },
  },
})
