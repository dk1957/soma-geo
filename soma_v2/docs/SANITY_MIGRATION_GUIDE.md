# Sanity CMS Migration Guide

## Overview

This guide walks you through moving your landing page and marketing pages from static React components to Sanity CMS, enabling non-technical team members to manage content without code changes.

## What You've Got Now

✅ **Page Schema** (`sanity/schemaTypes/page.ts`)
- Supports hero sections, features, rich content, SEO metadata
- Ready for landing, about, pricing, and other marketing pages

✅ **Portable Text Renderer** (`components/portable-text-renderer.tsx`)
- Renders rich text from Sanity with images, links, headings, lists
- Styled with Tailwind CSS matching your design system

✅ **Migration Script** (`scripts/migrate-landing-to-sanity.ts`)
- Creates initial page documents (home, about, pricing)
- Run once to populate Sanity with starter content

✅ **Reusable Page Component** (`app/(marketing)/sanity-page.tsx`)
- Server component that fetches pages from Sanity
- Handles SEO, hero sections, features, content blocks

✅ **GROQ Queries** (`lib/sanity/queries.ts`)
- Pre-built queries for pages, navigation, sitemaps

## Step-by-Step Migration

### 1. Get Sanity Write Token

You need a token to run the migration script:

1. Visit https://sanity.io/manage
2. Log in with **withsoma.ai@gmail.com** (the account with project access)
3. Go to your project (ID: `4de42y7s`)
4. Navigate to **API** → **Tokens**
5. Create a new token with **Editor** permissions
6. Copy the token

Add to your `.env.local`:
```bash
SANITY_API_WRITE_TOKEN=your_token_here
```

### 2. Run Migration Script

This creates initial page documents in Sanity:

```bash
# Install dependencies if needed
pnpm install

# Run the migration
npx tsx scripts/migrate-landing-to-sanity.ts
```

You should see:
```
🚀 Starting Sanity migration...
✅ Created/Updated: Soma AI - Generative Engine Optimization Platform (/home)
✅ Created/Updated: About Soma AI (/about)
✅ Created/Updated: Pricing - Soma AI (/pricing)
✨ Migration complete!
```

### 3. View Pages in Sanity Studio

```bash
pnpm dev
```

Open http://localhost:3000/welcome in your browser.

You should see:
- **Page** document type in the sidebar
- Three pages: Home, About, Pricing
- Click any page to edit content, images, SEO settings

### 4. Update Your Landing Page

Replace static content in `app/page.tsx`:

```tsx
import SanityPage from '@/app/(marketing)/sanity-page'

export const revalidate = 60 // ISR - revalidate every 60 seconds

export default function HomePage() {
  return <SanityPage slug="home" />
}
```

Or for more control, fetch directly:

```tsx
import { client } from '@/sanity/lib/client'
import { PAGE_QUERY } from '@/lib/sanity/queries'
import { PortableTextRenderer } from '@/components/marketing/portable-text-renderer'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 60

async function getHomePage() {
  return await client.fetch(PAGE_QUERY, { slug: 'home' })
}

export default async function HomePage() {
  const page = await getHomePage()

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            {page.hero.headline}
          </h1>
          <p className="text-xl mb-8">
            {page.hero.subheadline}
          </p>
          <a href={page.hero.ctaLink} className="btn btn-primary">
            {page.hero.ctaText}
          </a>
        </div>
      </section>

      {/* Features */}
      {page.features?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {page.features.map((feature: any, i: number) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content */}
      {page.content && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <PortableTextRenderer content={page.content} />
          </div>
        </section>
      )}
    </main>
  )
}
```

### 5. Migrate Other Pages

Repeat for `/about`, `/pricing`, etc:

**app/about/page.tsx:**
```tsx
import SanityPage from '@/app/(marketing)/sanity-page'

export default function AboutPage() {
  return <SanityPage slug="about" />
}
```

**app/pricing/page.tsx:**
```tsx
import SanityPage from '@/app/(marketing)/sanity-page'

export default function PricingPage() {
  return <SanityPage slug="pricing" />
}
```

### 6. Add New Pages in Studio

To create new marketing pages:

1. Open Studio: http://localhost:3000/welcome
2. Click **Page** → **Create**
3. Fill in:
   - Title: "Features Overview"
   - Slug: "features"
   - Hero headline, subheadline, CTA
   - Features list
   - Rich content blocks
   - SEO metadata
4. Save and publish

5. Create the Next.js route:

**app/features/page.tsx:**
```tsx
import SanityPage from '@/app/(marketing)/sanity-page'

export default function FeaturesPage() {
  return <SanityPage slug="features" />
}
```

## How Editors Use Sanity

### Editing Existing Pages

1. Open Studio: http://localhost:3000/welcome (or https://withsoma.ai/welcome in production)
2. Click **Page** in sidebar
3. Select the page to edit
4. Make changes:
   - Update headlines, copy, CTAs
   - Upload new hero images
   - Add/remove feature cards
   - Edit rich text content (headings, paragraphs, images, links)
   - Update SEO metadata
5. Click **Publish** (changes go live after revalidation period)

### Preview Changes Before Publishing

Sanity supports draft/published states. To enable live previews:

1. Install presentation tool: `pnpm add @sanity/presentation`
2. Update `sanity.config.ts` to add presentation plugin
3. Editors can see changes in real-time before publishing

## Advanced Features

### Dynamic Navigation from Sanity

Fetch nav links from pages with `showInNav: true`:

```tsx
// components/navigation.tsx
import { client } from '@/sanity/lib/client'
import { NAV_PAGES_QUERY } from '@/lib/sanity/queries'

export async function Navigation() {
  const pages = await client.fetch(NAV_PAGES_QUERY)

  return (
    <nav>
      {pages.map((page: any) => (
        <a key={page._id} href={`/${page.slug}`}>
          {page.title}
        </a>
      ))}
    </nav>
  )
}
```

### Dynamic Sitemap from Sanity

```tsx
// app/sitemap.xml/route.ts
import { client } from '@/sanity/lib/client'
import { ALL_PAGES_QUERY } from '@/lib/sanity/queries'

export async function GET() {
  const pages = await client.fetch(ALL_PAGES_QUERY)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map((page: any) => `
  <url>
    <loc>https://withsoma.ai/${page.slug}</loc>
    <lastmod>${page._updatedAt}</lastmod>
  </url>
  `).join('')}
</urlset>`

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  })
}
```

### Add Custom Content Types

To support blog posts, case studies, etc.:

**sanity/schemaTypes/blogPost.ts:**
```typescript
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'author', type: 'string'}),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'excerpt', type: 'text', rows: 3}),
    defineField({name: 'coverImage', type: 'image'}),
    defineField({name: 'content', type: 'array', of: [{type: 'block'}, {type: 'image'}]}),
    defineField({name: 'category', type: 'string', options: {
      list: ['GEO', 'AI Search', 'Marketing', 'Product Updates']
    }}),
  ]
})
```

Register in `sanity/schemaTypes/index.ts`:
```typescript
import blogPost from './blogPost'

export const schema = {
  types: [page, blogPost]
}
```

## Deployment Checklist

### Before Deploying

- [ ] Run migration script with production token
- [ ] Test all pages load correctly in dev
- [ ] Verify images render via Sanity CDN
- [ ] Check SEO metadata in page source
- [ ] Test Studio access at /welcome route

### Vercel Environment Variables

Add to Vercel project settings:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=4de42y7s
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=sk_production_xxxxx  # Only if needed for preview API
```

### Give Editors Access

1. Go to https://sanity.io/manage
2. Select your project
3. Go to **Members** → **Invite**
4. Add editor emails with **Editor** role
5. They can access Studio at: https://withsoma.ai/welcome

### Enable Preview/Draft Mode (Optional)

Create an API route for previews:

**app/api/draft/route.ts:**
```typescript
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  draftMode().enable()
  redirect(`/${slug}`)
}
```

## Troubleshooting

### "Project not found" Error

- Verify you're logged in with **withsoma.ai@gmail.com**
- Check project ID in `.env.local` matches Sanity dashboard
- Run: `npx @sanity/cli logout` then `npx @sanity/cli login`

### Images Not Loading

- Check `NEXT_PUBLIC_SANITY_PROJECT_ID` is set correctly
- Verify images are uploaded in Studio (not just pasted)
- Confirm `urlFor()` helper is imported from `@/sanity/lib/image`

### Content Not Updating

- Check revalidate period (default 60 seconds)
- Clear Next.js cache: `rm -rf .next && pnpm dev`
- Force revalidation via Vercel dashboard or API

### Studio Won't Load

- Ensure `/welcome/[[...tool]]` catch-all route exists
- Check Sanity config has correct project ID
- Verify no route conflicts with `/welcome` path

## Next Steps

1. **Run the migration**: `npx tsx scripts/migrate-landing-to-sanity.ts`
2. **Test in Studio**: Open http://localhost:3000/welcome
3. **Update app/page.tsx**: Use `SanityPage` component
4. **Migrate other pages**: Repeat for /about, /pricing, etc.
5. **Train editors**: Show team how to edit content in Studio
6. **Deploy**: Push to production and set environment variables

## Benefits You'll Get

✅ **No-code content updates** - Marketing team edits without waiting for deploys
✅ **Preview before publish** - See changes before they go live
✅ **Version control** - Rollback to previous versions
✅ **Image optimization** - Automatic CDN delivery and resizing
✅ **SEO management** - Centralized meta tags and OG images
✅ **Scheduled publishing** - Set content to go live at specific times
✅ **Multi-language support** - Easy to add translations later
✅ **Structured content** - Consistent formatting across pages

Questions? Check the [Sanity docs](https://www.sanity.io/docs) or ask in this chat!
