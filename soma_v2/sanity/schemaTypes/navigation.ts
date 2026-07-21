import { defineField, defineType } from 'sanity'

/**
 * Navigation Schema
 * =================
 * Manages header navigation, footer, and CTAs
 */

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Navigation Title',
      type: 'string',
      description: 'Internal name (e.g., "Main Header", "Footer")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'identifier',
      title: 'Identifier',
      type: 'string',
      description: 'Unique ID: main-header, footer, mobile-menu',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Main Header', value: 'main-header' },
          { title: 'Footer - Company', value: 'footer-company' },
          { title: 'Footer - Resources', value: 'footer-resources' },
          { title: 'Footer - Solutions', value: 'footer-solutions' },
          { title: 'Footer - Legal', value: 'footer-legal' },
          { title: 'Mobile Menu', value: 'mobile-menu' },
        ],
      },
    }),
    defineField({
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navItem',
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Internal: /about or External: https://...',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'openInNewTab',
              title: 'Open in New Tab',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'icon',
              title: 'Icon (optional)',
              type: 'string',
              description: 'Lucide icon name',
            },
            {
              name: 'badge',
              title: 'Badge (optional)',
              type: 'string',
              description: 'e.g., "New", "Beta"',
            },
            {
              name: 'children',
              title: 'Sub-menu Items',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', type: 'string', title: 'Label' },
                    { name: 'url', type: 'string', title: 'URL' },
                    { name: 'description', type: 'text', title: 'Description', rows: 2 },
                    { name: 'icon', type: 'string', title: 'Icon' },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action Button',
      type: 'object',
      description: 'Primary CTA in navigation',
      fields: [
        {
          name: 'text',
          title: 'Button Text',
          type: 'string',
        },
        {
          name: 'url',
          title: 'Button URL',
          type: 'string',
        },
        {
          name: 'style',
          title: 'Button Style',
          type: 'string',
          options: {
            list: [
              { title: 'Primary', value: 'primary' },
              { title: 'Secondary', value: 'secondary' },
              { title: 'Outline', value: 'outline' },
            ],
          },
          initialValue: 'primary',
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
      identifier: 'identifier',
    },
  },
})
