/**
 * Blog Post Page Component (Server)
 * ==================================
 * Fetches and renders individual blog posts from Sanity
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { BLOG_POST_QUERY } from '@/lib/sanity/queries'
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Calendar, Clock, User, Linkedin, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BlogPostData {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  description: string
  category: string
  tags?: string[]
  authors: Array<{
    name: string
    jobTitle: string
    image?: string
    linkedin?: string
  }>
  publishedDate: string
  readTime: string
  content: any[]
  featured?: boolean
  relatedPosts?: Array<{
    _id: string
    title: string
    slug: { current: string }
    excerpt: string
    category: string
    publishedDate: string
    readTime: string
  }>
  seo?: {
    metaTitle?: string
    keywords?: string[]
    ogImage?: any
  }
}

// Portable Text components for rich content rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null
      return (
        <figure className="my-8">
          <img
            src={urlFor(value).width(1200).url()}
            alt={value.alt || ''}
            className="rounded-lg w-full"
          />
          {value.caption && (
            <figcaption className="text-sm text-gray-600 mt-2 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    caseStudy: ({ value }: any) => (
      <div className="my-8 border-l-4 border-black bg-gray-50 p-6 rounded-r-lg">
        <h3 className="text-xl font-bold mb-4 text-black">
          Case Study: {value.company}
        </h3>
        <div className="space-y-4">
          <div>
            <span className="font-semibold text-black">Industry:</span>{' '}
            <span className="text-gray-700">{value.industry}</span>
          </div>
          <div>
            <span className="font-semibold text-black">Challenge:</span>{' '}
            <p className="text-gray-700 mt-1">{value.challenge}</p>
          </div>
          <div>
            <span className="font-semibold text-black">Solution:</span>{' '}
            <p className="text-gray-700 mt-1">{value.solution}</p>
          </div>
          {value.results && (
            <div>
              <span className="font-semibold text-black">Results:</span>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {value.results.map((result: string, idx: number) => (
                  <li key={idx} className="text-gray-700">
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    ),
    callout: ({ value }: any) => {
      return (
        <div className="my-6 border-l-4 border-black bg-gray-50 p-6 rounded-r-lg">
          {value.title && <h4 className="font-bold text-lg mb-2 text-black">{value.title}</h4>}
          <div className="text-sm text-gray-700">{value.content}</div>
        </div>
      )
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold mt-12 mb-6 text-black">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold mt-8 mb-4 text-black">{children}</h3>
    ),
    normal: ({ children }: any) => (
      <p className="text-lg text-gray-700 leading-relaxed mb-6">{children}</p>
    ),
  },
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await client.fetch<BlogPostData>(BLOG_POST_QUERY, {
    slug: params.slug,
  })

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.seo?.metaTitle || `${post.title} | Soma AI Blog`,
    description: post.description || post.excerpt,
    keywords: post.seo?.keywords?.join(', '),
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.description || post.excerpt,
      type: 'article',
      publishedTime: post.publishedDate,
      authors: post.authors.map((a: { name: string }) => a.name),
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ slug }: { slug: string }) {
  const post = await client.fetch<BlogPostData>(BLOG_POST_QUERY, { slug })

  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.publishedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white pt-24 pb-12 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            {/* Visible breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1 text-sm text-gray-500" itemScope itemType="https://schema.org/BreadcrumbList">
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href="/" className="hover:text-black transition-colors" itemProp="item">
                    <span itemProp="name">Home</span>
                  </Link>
                  <meta itemProp="position" content="1" />
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href="/blog" className="hover:text-black transition-colors" itemProp="item">
                    <span itemProp="name">Blog</span>
                  </Link>
                  <meta itemProp="position" content="2" />
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></li>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="text-black font-medium truncate max-w-[300px] inline-block" itemProp="name">{post.title}</span>
                  <meta itemProp="position" content="3" />
                </li>
              </ol>
            </nav>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-semibold">
                {post.category.replace('-', ' ').toUpperCase()}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-black mb-6 leading-tight">
              {post.title}
            </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">{post.excerpt}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Authors */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-6">
              {post.authors.map((author: { name: string; jobTitle: string; image?: string; linkedin?: string }, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  {author.image && (
                    <img
                      src={author.image}
                      alt={author.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-300"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">{author.name}</span>
                      {author.linkedin && (
                        <a
                          href={author.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-gray-600"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{author.jobTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-12" itemScope itemType="https://schema.org/BlogPosting">
        <div className="prose prose-lg max-w-none" itemProp="articleBody">
          <PortableText value={post.content} components={portableTextComponents} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-black mb-4">TAGS</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-black text-white rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Posts */}
      {post.relatedPosts && post.relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16 border-y border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-black mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {post.relatedPosts.map((related: NonNullable<BlogPostData['relatedPosts']>[0]) => (
                <Link
                  key={related._id}
                  href={`/blog/${related.slug.current}`}
                  className="bg-white border border-gray-200 p-6 rounded-lg hover:border-black hover:shadow-md transition-all"
                >
                  <span className="text-xs font-semibold text-black uppercase">
                    {related.category.replace('-', ' ')}
                  </span>
                  <h3 className="text-xl font-bold text-black mt-2 mb-3">
                    {related.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{related.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(related.publishedDate).toLocaleDateString()}</span>
                    <span>{related.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      </main>
      
      <SiteFooter />
    </div>
  )
}
