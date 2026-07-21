# Sanity CMS Architecture Guide

## 📋 Schema Overview

We now have **10 schemas** organized into three categories:

### 1. Main Content (User-Facing)
- **`page`** - Generic landing pages
- **`blogPost`** - Blog articles with rich content
- **`caseStudy`** - Client success stories ⭐ NEW

### 2. Specialized Pages
- **`countryPage`** - Country-specific landing pages
- **`legalPage`** - Legal documents (Privacy, Terms)
- **`pricingPage`** - Pricing tiers and plans
- **`contactPage`** - Contact information and offices
- **`faqPage`** - Frequently asked questions

### 3. Site Configuration
- **`navigation`** - Header/footer navigation ⭐ NEW
- **`snippet`** - Reusable content blocks ⭐ NEW

---

## 🎯 Your Questions Answered

### Q1: "Do we need navigation in Sanity?"

**Answer: YES, and here's why:**

#### Benefits of Managing Navigation in Sanity:

✅ **No Code Deployments**
- Marketing team can update menus without developer help
- Add/remove/reorder menu items instantly

✅ **Consistency Across Site**
- Single source of truth for all navigation
- Changes reflect everywhere automatically

✅ **A/B Testing & Personalization**
- Test different menu structures
- Show different menus for different regions
- Seasonal menu updates (e.g., holiday offers)

✅ **Dynamic Menus**
- Auto-populate from blog categories
- Show latest case studies in mega menu
- Badge new features ("New", "Beta")

#### What We Can Manage:

**Header Navigation:**
```typescript
// Example: Main header with dropdown
{
  identifier: 'main-header',
  items: [
    {
      label: 'Solutions',
      children: [
        { label: 'For Fintech', url: '/fintech', icon: 'CreditCard' },
        { label: 'For E-commerce', url: '/ecommerce', icon: 'ShoppingCart' },
      ]
    },
    { label: 'Case Studies', url: '/case-studies' },
    { label: 'Blog', url: '/blog' },
  ],
  cta: {
    text: 'Get Started',
    url: '/contact',
    style: 'primary'
  }
}
```

**Footer Sections:**
```typescript
// Multiple footer columns
{
  identifier: 'footer-company',
  items: [
    { label: 'About', url: '/about' },
    { label: 'Careers', url: '/careers' },
    { label: 'Contact', url: '/contact' },
  ]
}

{
  identifier: 'footer-resources',
  items: [
    { label: 'Blog', url: '/blog' },
    { label: 'Case Studies', url: '/case-studies' },
    { label: 'Help Center', url: '/help' },
  ]
}
```

---

### Q2: "What about showing snippets of FAQs, blogs, case studies?"

**Answer: Use the `snippet` schema!**

#### Content Snippets Schema

This schema lets you create **reusable content blocks** that can appear anywhere:

#### Use Cases:

**1. Featured Blog Posts Section**
```typescript
{
  name: 'Homepage Featured Blogs',
  identifier: 'home-featured-blogs',
  type: 'featured-items',
  featuredItems: {
    title: 'Latest Insights',
    itemType: 'blog',
    filterBy: 'fintech', // Show only fintech blogs
    limit: 3,
    showFeaturedOnly: true
  }
}
```

**2. Related Case Studies**
```typescript
{
  name: 'Fintech Case Studies',
  identifier: 'fintech-case-studies',
  type: 'featured-items',
  featuredItems: {
    title: 'Success Stories',
    itemType: 'caseStudy',
    filterBy: 'fintech',
    limit: 3
  }
}
```

**3. CTA Buttons**
```typescript
{
  name: 'Primary CTA',
  identifier: 'cta-get-started',
  type: 'cta-button',
  cta: {
    text: 'Start Free Trial',
    url: '/signup',
    style: 'primary',
    icon: 'ArrowRight'
  }
}
```

**4. Tags/Badges**
```typescript
{
  name: 'New Feature Badge',
  identifier: 'badge-new-feature',
  type: 'tag',
  tag: {
    text: 'New',
    color: 'blue',
    icon: 'Sparkles'
  }
}
```

**5. Announcement Banners**
```typescript
{
  name: 'Holiday Offer Banner',
  identifier: 'banner-holiday-2025',
  type: 'banner',
  banner: {
    message: '50% off all plans this December!',
    type: 'success',
    link: {
      text: 'Learn More',
      url: '/pricing'
    },
    dismissible: true
  }
}
```

---

## 🏗️ Architecture Patterns

### Pattern 1: Dynamic Content Injection

**Component Code:**
```typescript
// Fetch and display snippet anywhere
import { client } from '@/sanity/lib/client'

const SNIPPET_QUERY = `*[_type == "snippet" && identifier.current == $id && isActive == true][0]`

export async function FeaturedBlogsSection() {
  const snippet = await client.fetch(SNIPPET_QUERY, { id: 'home-featured-blogs' })
  
  if (snippet?.featuredItems) {
    // Fetch the actual blog posts based on filters
    const posts = await fetchFilteredPosts(snippet.featuredItems)
    return <BlogGrid posts={posts} title={snippet.featuredItems.title} />
  }
}
```

### Pattern 2: Navigation Component

**Header Component:**
```typescript
// Fetch navigation once, use everywhere
const NAV_QUERY = `*[_type == "navigation" && identifier == "main-header" && isActive == true][0]`

export async function SiteHeader() {
  const nav = await client.fetch(NAV_QUERY)
  
  return (
    <header>
      <nav>
        {nav.items.map(item => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>
      {nav.cta && <Button {...nav.cta} />}
    </header>
  )
}
```

### Pattern 3: Contextual Content

**Show Different Content By Page:**
```typescript
// Blog page shows blog-specific snippets
const SNIPPETS_QUERY = `*[_type == "snippet" && 
  isActive == true && 
  ("blog" in displaySettings.showOn || !defined(displaySettings.showOn))
]`

// Automatically show relevant CTAs, featured items, banners
```

---

## 📊 Schema Relationships

```
Case Study
├── Related Case Studies (references)
├── Related Blog Posts (references)
└── Featured Image

Blog Post
├── Related Posts (references)
├── Authors (array of objects)
└── Content Blocks (portable text)

Navigation
├── Items (nested menu structure)
├── Sub-items (dropdowns)
└── CTA button

Snippet
├── Display Settings (which pages)
├── Content Config (varies by type)
└── Featured Items (references to blog/case studies)
```

---

## 🎨 Use Case Examples

### Example 1: Dynamic Footer

**Before (Hardcoded):**
```tsx
// 50+ lines of hardcoded links
<footer>
  <div>
    <h3>Company</h3>
    <a href="/about">About</a>
    <a href="/careers">Careers</a>
    // ... etc
  </div>
</footer>
```

**After (Sanity):**
```tsx
// 5 lines, fully manageable
export async function Footer() {
  const columns = await client.fetch(`*[_type == "navigation" && identifier starts with "footer-"]`)
  return <FooterColumns data={columns} />
}
```

### Example 2: Featured Content Everywhere

**Blog Page:**
```tsx
// Show featured case studies in sidebar
<Sidebar>
  <SnippetRenderer id="blog-sidebar-case-studies" />
</Sidebar>
```

**Homepage:**
```tsx
// Show latest blog posts
<Section>
  <SnippetRenderer id="home-featured-blogs" />
</Section>
```

**Case Study Page:**
```tsx
// Show related FAQs
<Section>
  <SnippetRenderer id="case-study-related-faqs" />
</Section>
```

### Example 3: A/B Testing CTAs

Create multiple CTA snippets, test which performs better:

**Version A:**
```typescript
{ identifier: 'cta-trial-a', text: 'Start Free Trial', url: '/signup' }
```

**Version B:**
```typescript
{ identifier: 'cta-trial-b', text: 'Get Started Free', url: '/signup' }
```

Switch in code or via feature flag, measure conversions.

---

## 🚀 Implementation Priority

### Phase 1 (High Priority)
✅ Case Study Schema - **DONE**
✅ Navigation Schema - **DONE**
✅ Snippet Schema - **DONE**

### Phase 2 (Recommended)
- [ ] Create case study migration script
- [ ] Build CaseStudyPage component
- [ ] Create navigation fetch utilities
- [ ] Build SnippetRenderer component

### Phase 3 (Enhancement)
- [ ] Add navigation to header/footer
- [ ] Create snippet admin UI
- [ ] Implement featured content sections
- [ ] A/B test different configurations

---

## 💡 Best Practices

### 1. Navigation
- Keep main menu to 5-7 items max
- Use mega menus for complex hierarchies
- Update seasonally (holiday promos, etc.)

### 2. Snippets
- Give clear, descriptive names
- Use identifiers consistently (kebab-case)
- Set appropriate display settings
- Test on multiple pages

### 3. Case Studies
- Always include client testimonials
- Use real metrics (450% increase, etc.)
- Add high-quality images
- Link to related content

### 4. Content Relationships
- Always set 2-3 related items
- Use categories/tags for auto-suggestions
- Keep relationships bidirectional

---

## 🔍 Query Examples

### Fetch Navigation
```typescript
const NAV_QUERY = `*[_type == "navigation" && identifier == $id][0]{
  ...,
  items[]{
    ...,
    children[]
  }
}`
```

### Fetch Snippet with Content
```typescript
const SNIPPET_QUERY = `*[_type == "snippet" && identifier.current == $id][0]{
  ...,
  featuredItems{
    ...,
    itemType == "blog" => {
      "items": *[_type == "blogPost" && category == ^.filterBy][0...^.limit]
    },
    itemType == "caseStudy" => {
      "items": *[_type == "caseStudy" && category == ^.filterBy][0...^.limit]
    }
  }
}`
```

### Fetch Case Study with Relations
```typescript
const CASE_STUDY_QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]{
  ...,
  relatedCaseStudies[]->{title, slug, excerpt},
  relatedBlogPosts[]->{title, slug, excerpt}
}`
```

---

## 📖 Summary

### You Now Have:

1. **Case Studies** - Full client success story management
2. **Navigation** - Dynamic menu system for header/footer
3. **Snippets** - Reusable content blocks for anywhere

### Benefits:

- ✅ No code deployments for content updates
- ✅ Consistent branding across site
- ✅ Easy A/B testing
- ✅ Marketing team independence
- ✅ Better SEO through structured data
- ✅ Faster page loads (cached queries)

### Next Actions:

1. Review the schemas in Sanity Studio (`/welcome`)
2. Create your first case study
3. Set up main navigation
4. Create featured content snippets
5. Build the corresponding components

---

**Questions?** Check these docs:
- Case Study: `sanity/schemaTypes/caseStudy.ts`
- Navigation: `sanity/schemaTypes/navigation.ts`  
- Snippets: `sanity/schemaTypes/snippet.ts`

**Total Schemas**: 10  
**Total Code**: ~2,000 lines of configuration  
**Deployment Time**: Instant updates via Sanity  
**Developer Dependency**: Minimal 🎉
