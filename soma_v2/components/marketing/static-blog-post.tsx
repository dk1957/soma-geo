/**
 * Static Blog Post Layout Component
 * Shared layout for static blog posts (non-Sanity)
 */
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MultiStructuredData, buildBreadcrumb } from '@/components/marketing/structured-data'
import { Calendar, Clock, Linkedin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface BlogPostLayoutProps {
  title: string
  excerpt: string
  category: string
  tags: string[]
  publishedDate: string
  readTime: string
  slug: string
  children: ReactNode
}

export function StaticBlogPost({
  title,
  excerpt,
  category,
  tags,
  publishedDate,
  readTime,
  slug,
  children,
}: BlogPostLayoutProps) {
  const formattedDate = new Date(publishedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MultiStructuredData
        schemas={[
          buildBreadcrumb([
            { name: 'Home', url: 'https://withsoma.ai' },
            { name: 'Blog', url: 'https://withsoma.ai/blog' },
            { name: title, url: `https://withsoma.ai/blog/${slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            description: excerpt,
            datePublished: publishedDate,
            dateModified: publishedDate,
            author: { '@type': 'Organization', name: 'Soma AI' },
            publisher: {
              '@type': 'Organization',
              name: 'Soma AI',
              logo: { '@type': 'ImageObject', url: 'https://withsoma.ai/logo.png' },
            },
            mainEntityOfPage: `https://withsoma.ai/blog/${slug}`,
            isPartOf: { '@type': 'Blog', name: 'Soma AI Blog', url: 'https://withsoma.ai/blog' },
          },
        ]}
      />
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
                  <span className="text-black font-medium truncate max-w-[300px] inline-block" itemProp="name">{title}</span>
                  <meta itemProp="position" content="3" />
                </li>
              </ol>
            </nav>

            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-semibold">
                {category.replace(/-/g, ' ').toUpperCase()}
              </span>
            </div>

            <h1 className="text-5xl font-bold text-black mb-6 leading-tight">{title}</h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">{excerpt}</p>

            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{readTime}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black">Soma AI Marketing Team</span>
                    <a
                      href="https://www.linkedin.com/company/withsoma/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-gray-600"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-sm text-gray-600">Soma AI</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <article
          className="max-w-4xl mx-auto px-6 py-12"
          itemScope
          itemType="https://schema.org/BlogPosting"
        >
          <div
            className="[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:text-black [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-black [&_p]:text-lg [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-black [&_blockquote]:bg-gray-50 [&_blockquote]:p-6 [&_blockquote]:rounded-r-lg [&_blockquote]:my-8 [&_blockquote]:text-lg [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_ul]:space-y-2 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-lg [&_ul]:text-gray-700 [&_ol]:space-y-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-lg [&_ol]:text-gray-700 [&_strong]:text-black [&_em]:text-gray-600 [&_table]:w-full [&_table]:my-8 [&_table]:border-collapse [&_table]:text-sm [&_thead]:bg-black [&_thead]:text-white [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-gray-200 [&_tbody_tr:hover]:bg-gray-50"
            itemProp="articleBody"
          >
            {children}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-4">TAGS</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-black rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              See What AI Says About Your Brand
            </h3>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              Get a free AI visibility audit showing your LVI score, competitor recommendations, and
              optimization opportunities across ChatGPT, Claude, Gemini, and Perplexity.
            </p>
            <Link
              href="/free-audit"
              className="inline-flex items-center px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Get Your Free Audit
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}

/** Callout box reusable component */
export function Callout({
  type,
  title,
  children,
}: {
  type: 'info' | 'tip' | 'success' | 'warning'
  title: string
  children: ReactNode
}) {
  return (
    <div className="my-6 border-l-4 border-black bg-gray-50 p-6 rounded-r-lg">
      <h4 className="font-bold text-lg mb-2 text-black">{title}</h4>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  )
}

/** Case study box */
export function CaseStudy({
  company,
  industry,
  challenge,
  solution,
  results,
}: {
  company: string
  industry: string
  challenge: string
  solution: string
  results: string[]
}) {
  return (
    <div className="my-8 border-l-4 border-black bg-gray-50 p-6 rounded-r-lg">
      <h3 className="text-xl font-bold mb-4 text-black">Case Study: {company}</h3>
      <div className="space-y-4">
        <div>
          <span className="font-semibold text-black">Industry:</span>{' '}
          <span className="text-gray-700">{industry}</span>
        </div>
        <div>
          <span className="font-semibold text-black">Challenge:</span>
          <p className="text-gray-700 mt-1">{challenge}</p>
        </div>
        <div>
          <span className="font-semibold text-black">Solution:</span>
          <p className="text-gray-700 mt-1">{solution}</p>
        </div>
        <div>
          <span className="font-semibold text-black">Results:</span>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {results.map((result, idx) => (
              <li key={idx} className="text-gray-700">
                {result}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** Comparison table — renders a proper HTML table for feature matrices */
export function ComparisonTable({
  title,
  headers,
  rows,
}: {
  title?: string
  headers: string[]
  rows: Array<{ feature: string; values: string[] }>
}) {
  /** Render a cell value with semantic icons */
  function renderCell(value: string) {
    const trimmed = value.trim()
    if (trimmed === '✓') return <span className="text-green-600 font-bold text-base">✓</span>
    if (trimmed === '✗') return <span className="text-red-400 font-bold text-base">✗</span>
    if (trimmed.toLowerCase() === 'partial') return <span className="text-amber-600 font-semibold">Partial</span>
    if (trimmed.toLowerCase() === 'limited') return <span className="text-amber-600 font-semibold">Limited</span>
    return <span>{trimmed}</span>
  }

  return (
    <div className="my-10 overflow-x-auto rounded-xl border border-gray-200">
      {title && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-bold text-black">{title}</h4>
        </div>
      )}
      <table className="w-full text-sm border-collapse" role="table">
        <thead className="bg-black text-white">
          <tr>
            <th className="px-5 py-3 text-left font-semibold">Feature</th>
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 text-center font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-5 py-3 font-medium text-black border-b border-gray-200">{row.feature}</td>
              {row.values.map((v, j) => (
                <td key={j} className="px-5 py-3 text-center border-b border-gray-200">{renderCell(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
