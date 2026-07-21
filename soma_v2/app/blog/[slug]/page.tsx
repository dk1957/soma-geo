/**
 * Dynamic Blog Post Route
 * Renders individual blog posts from Sanity by slug
 */

import BlogPostPageFromSanity, { generateMetadata as generateBlogMetadata } from '@/app/(marketing)/blog-post-page'
import { client } from '@/sanity/lib/client'
import { BLOG_SLUGS_QUERY } from '@/lib/sanity/queries'

export const revalidate = 60 // Revalidate every 60 seconds

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await client.fetch<Array<{ slug: string }>>(BLOG_SLUGS_QUERY)
  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

// Generate metadata for the post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateBlogMetadata({ params: { slug } })
}

export default async function BlogPostRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPostPageFromSanity slug={slug} />
}
