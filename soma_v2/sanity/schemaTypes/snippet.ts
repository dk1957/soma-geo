import { defineField, defineType } from 'sanity'

/**
 * Content Snippets Schema
 * ========================
 * Reusable content blocks for tags, buttons, CTAs, small sections
 * that appear across multiple pages
 */

export default defineType({
  name: 'snippet',
  title: 'Content Snippets',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Snippet Name',
      type: 'string',
      description: 'Internal name to identify this snippet',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'identifier',
      title: 'Unique Identifier',
      type: 'slug',
      description: 'Unique ID for querying (e.g., "latest-blog-posts", "featured-case-studies")',
      options: {
        source: 'name',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Snippet Type',
      type: 'string',
      options: {
        list: [
          { title: 'CTA Button', value: 'cta-button' },
          { title: 'Tag/Badge', value: 'tag' },
          { title: 'Featured Items', value: 'featured-items' },
          { title: 'Text Block', value: 'text-block' },
          { title: 'Announcement Banner', value: 'banner' },
          { title: 'Social Proof', value: 'social-proof' },
          { title: 'Stats Counter', value: 'stats' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // CTA Button Configuration
    defineField({
      name: 'cta',
      title: 'CTA Button Config',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'cta-button',
      fields: [
        {
          name: 'text',
          title: 'Button Text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'url',
          title: 'URL',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'style',
          title: 'Style',
          type: 'string',
          options: {
            list: [
              { title: 'Primary', value: 'primary' },
              { title: 'Secondary', value: 'secondary' },
              { title: 'Outline', value: 'outline' },
              { title: 'Ghost', value: 'ghost' },
            ],
          },
        },
        {
          name: 'icon',
          title: 'Icon (optional)',
          type: 'string',
          description: 'Lucide icon name',
        },
        {
          name: 'openInNewTab',
          title: 'Open in New Tab',
          type: 'boolean',
          initialValue: false,
        },
      ],
    }),

    // Tag/Badge Configuration
    defineField({
      name: 'tag',
      title: 'Tag/Badge Config',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'tag',
      fields: [
        {
          name: 'text',
          title: 'Tag Text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'color',
          title: 'Color',
          type: 'string',
          options: {
            list: [
              { title: 'Blue', value: 'blue' },
              { title: 'Green', value: 'green' },
              { title: 'Red', value: 'red' },
              { title: 'Yellow', value: 'yellow' },
              { title: 'Purple', value: 'purple' },
              { title: 'Gray', value: 'gray' },
            ],
          },
        },
        {
          name: 'icon',
          title: 'Icon (optional)',
          type: 'string',
        },
      ],
    }),

    // Featured Items (Blog Posts, Case Studies, etc.)
    defineField({
      name: 'featuredItems',
      title: 'Featured Items',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'featured-items',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
        },
        {
          name: 'itemType',
          title: 'Item Type',
          type: 'string',
          options: {
            list: [
              { title: 'Blog Posts', value: 'blog' },
              { title: 'Case Studies', value: 'caseStudy' },
              { title: 'FAQs', value: 'faq' },
            ],
          },
        },
        {
          name: 'filterBy',
          title: 'Filter By',
          type: 'string',
          description: 'Category or tag to filter',
        },
        {
          name: 'limit',
          title: 'Number of Items',
          type: 'number',
          initialValue: 3,
          validation: (Rule) => Rule.min(1).max(10),
        },
        {
          name: 'showFeaturedOnly',
          title: 'Show Featured Only',
          type: 'boolean',
          initialValue: false,
        },
      ],
    }),

    // Text Block
    defineField({
      name: 'textContent',
      title: 'Text Content',
      type: 'array',
      hidden: ({ parent }) => parent?.type !== 'text-block',
      of: [{ type: 'block' }],
    }),

    // Banner Configuration
    defineField({
      name: 'banner',
      title: 'Banner Config',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'banner',
      fields: [
        {
          name: 'message',
          title: 'Banner Message',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'type',
          title: 'Banner Type',
          type: 'string',
          options: {
            list: [
              { title: 'Info', value: 'info' },
              { title: 'Success', value: 'success' },
              { title: 'Warning', value: 'warning' },
              { title: 'Error', value: 'error' },
            ],
          },
        },
        {
          name: 'link',
          title: 'Link (optional)',
          type: 'object',
          fields: [
            { name: 'text', title: 'Link Text', type: 'string' },
            { name: 'url', title: 'URL', type: 'string' },
          ],
        },
        {
          name: 'dismissible',
          title: 'Dismissible',
          type: 'boolean',
          initialValue: true,
        },
      ],
    }),

    // Social Proof
    defineField({
      name: 'socialProof',
      title: 'Social Proof Config',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'social-proof',
      fields: [
        {
          name: 'items',
          title: 'Proof Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'text', title: 'Text', type: 'string' },
                { name: 'icon', title: 'Icon', type: 'string' },
              ],
            },
          ],
        },
      ],
    }),

    // Stats
    defineField({
      name: 'stats',
      title: 'Stats Config',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'stats',
      fields: [
        {
          name: 'items',
          title: 'Stat Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'value', title: 'Value', type: 'string', description: 'e.g., "450%", "1000+"' },
                { name: 'label', title: 'Label', type: 'string' },
                { name: 'icon', title: 'Icon (optional)', type: 'string' },
              ],
            },
          ],
        },
      ],
    }),

    // Display Settings
    defineField({
      name: 'displaySettings',
      title: 'Display Settings',
      type: 'object',
      fields: [
        {
          name: 'showOn',
          title: 'Show On Pages',
          type: 'array',
          description: 'Leave empty to show everywhere',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Homepage', value: 'home' },
              { title: 'Blog Pages', value: 'blog' },
              { title: 'Case Studies', value: 'case-studies' },
              { title: 'Country Pages', value: 'country' },
              { title: 'Contact', value: 'contact' },
            ],
          },
        },
        {
          name: 'position',
          title: 'Position',
          type: 'string',
          options: {
            list: [
              { title: 'Top', value: 'top' },
              { title: 'Bottom', value: 'bottom' },
              { title: 'Sidebar', value: 'sidebar' },
              { title: 'Inline', value: 'inline' },
            ],
          },
        },
      ],
    }),

    // Status
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Show this snippet on the website',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      name: 'name',
      type: 'type',
      isActive: 'isActive',
    },
    prepare(selection) {
      const { name, type, isActive } = selection
      return {
        title: name,
        subtitle: `${type}${isActive ? '' : ' (Inactive)'}`,
      }
    },
  },
})
