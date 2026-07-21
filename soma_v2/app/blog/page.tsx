/**
 * Blog Index Route
 * Fetches all blog posts from Sanity
 */

import BlogIndexPageFromSanity, { metadata as blogMetadata } from '@/app/(marketing)/blog-index-page'

export const revalidate = 60 // Revalidate every 60 seconds

export const metadata = blogMetadata

export default function BlogPage() {
  return <BlogIndexPageFromSanity />
}
