/**
 * Sanity GROQ Queries
 * ===================
 * 
 * Centralized queries for fetching page content from Sanity.
 * Use these in server components or API routes.
 */

import { groq } from 'next-sanity'

// Navigation Queries
export const NAVIGATION_QUERY = groq`
  *[_type == "navigation" && identifier == $identifier && isActive == true][0] {
    _id,
    title,
    identifier,
    items,
    cta,
    isActive
  }
`

export const ALL_NAVIGATION_QUERY = groq`
  *[_type == "navigation" && isActive == true] {
    _id,
    title,
    identifier,
    items,
    cta,
    isActive
  }
`

// Get a single page by slug
export const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  description,
  hero{
    headline,
    subheadline,
    ctaText,
    ctaLink,
    image{
      asset->{
        _id,
        url,
        metadata{dimensions, lqip}
      },
      alt
    },
    backgroundGradient
  },
  features[]{
    title,
    description,
    icon
  },
  content[]{
    ...,
    _type == "image" => {
      ...,
      asset->{
        _id,
        url,
        metadata{dimensions, lqip}
      }
    }
  },
  seo{
    metaTitle,
    metaDescription,
    ogImage{
      asset->{url}
    },
    noIndex
  },
  publishedAt
}`

// Get all pages for navigation
export const NAV_PAGES_QUERY = `*[_type == "page" && showInNav == true] | order(navOrder asc){
  _id,
  title,
  "slug": slug.current,
  navOrder
}`

// Get all pages (for sitemap generation)
export const ALL_PAGES_QUERY = `*[_type == "page"]{
  "slug": slug.current,
  title,
  publishedAt,
  _updatedAt
}`

// Country Page Queries
export const COUNTRY_PAGE_QUERY = `*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
  _id,
  country,
  slug,
  hero,
  stats,
  specialization,
  caseStudies,
  marketInsights,
  industries,
  cities,
  finalCta,
  seo,
  contactInfo
}`

// All active country pages (for navigation/sitemap)
export const ALL_COUNTRY_PAGES_QUERY = `*[_type == "countryPage" && isActive == true] | order(country.name asc){
  _id,
  country,
  slug
}`

// Legal page query
export const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && slug.current == $slug][0]{
  _id,
  title,
  description,
  lastUpdated,
  effectiveDate,
  badges,
  sections,
  contactSection,
  seo
}`

// Pricing page query
export const PRICING_PAGE_QUERY = `*[_type == "pricingPage" && isActive == true][0]{
  _id,
  title,
  hero,
  pricingTiers,
  comparisonTable,
  faq,
  finalCta,
  seo
}`

// Contact page query
export const CONTACT_PAGE_QUERY = `*[_type == "contactPage" && isActive == true][0]{
  _id,
  title,
  hero,
  contactMethods,
  offices,
  formSettings,
  faq,
  seo
}`

// FAQ page query
export const FAQ_PAGE_QUERY = `*[_type == "faqPage" && isActive == true][0]{
  _id,
  title,
  hero,
  categories,
  ctaSection,
  seo
}`

// Blog queries
export const BLOG_POST_QUERY = `*[_type == "blogPost" && slug.current == $slug && isActive == true][0]{
  _id,
  title,
  slug,
  excerpt,
  description,
  category,
  tags,
  authors,
  publishedDate,
  readTime,
  content,
  featured,
  relatedPosts[]->{
    _id,
    title,
    slug,
    excerpt,
    category,
    publishedDate,
    readTime
  },
  seo
}`

export const BLOG_INDEX_QUERY = `*[_type == "blogPost" && isActive == true] | order(publishedDate desc){
  _id,
  title,
  slug,
  excerpt,
  description,
  category,
  tags,
  authors,
  publishedDate,
  readTime,
  featured
}`

export const FEATURED_POSTS_QUERY = `*[_type == "blogPost" && featured == true && isActive == true] | order(publishedDate desc)[0...3]{
  _id,
  title,
  slug,
  excerpt,
  description,
  category,
  authors,
  publishedDate,
  readTime
}`

export const BLOG_SLUGS_QUERY = `*[_type == "blogPost" && isActive == true]{
  "slug": slug.current
}`

// Case Study Queries
export const CASE_STUDY_QUERY = groq`
  *[_type == "caseStudy" && slug.current == $slug && isActive == true][0] {
    _id,
    title,
    slug,
    excerpt,
    description,
    client,
    challenge,
    solution,
    results,
    content,
    category,
    region,
    tags,
    featuredImage,
    gallery,
    relatedCaseStudies[]->{
      _id,
      title,
      slug,
      excerpt,
      category,
      featuredImage,
      results {
        metrics
      }
    },
    relatedBlogPosts[]->{
      _id,
      title,
      slug,
      excerpt,
      publishedAt
    },
    seo,
    publishedDate
  }
`

export const CASE_STUDIES_INDEX_QUERY = groq`*[_type == "caseStudy" && isActive == true] | order(publishedDate desc){
  _id,
  title,
  slug,
  excerpt,
  client,
  category,
  tags,
  region,
  featured,
  featuredImage,
  results {
    metrics
  },
  publishedDate
}`

export const FEATURED_CASE_STUDIES_QUERY = groq`*[_type == "caseStudy" && featured == true && isActive == true] | order(publishedDate desc)[0...3]{
  _id,
  title,
  slug,
  excerpt,
  client,
  category,
  featuredImage,
  results {
    metrics
  }
}`

export const CASE_STUDY_SLUGS_QUERY = groq`*[_type == "caseStudy" && isActive == true]{
  "slug": slug.current
}`

// Home Page Query
export const HOME_PAGE_QUERY = groq`*[_type == "home" && isActive == true][0]{
  _id,
  title,
  hero {
    aiPlatforms[] {
      name,
      "logo": logo.asset->url,
      textColor,
      order
    },
    secondLine,
    thirdLine,
    subtitle,
    videoUrl,
    ctaPrimary,
    ctaSecondary,
    socialProofText
  },
  stats {
    sectionTitle,
    statistics[] {
      value,
      suffix,
      description,
      source
    },
    trustIndicators
  },
  howItWorks {
    title,
    titleHighlight,
    subtitle,
    steps[] {
      number,
      title,
      description,
      icon
    }
  },
  enterprise {
    sectionLabel,
    title,
    titleHighlight,
    subtitle,
    capabilities[] {
      title,
      description
    },
    ctaText,
    ctaLink
  },
  faq {
    title,
    questions[] {
      question,
      answer
    }
  },
  seo {
    metaTitle,
    metaDescription,
    keywords,
    ogImage {
      asset-> {
        _id,
        url
      }
    }
  }
}`
