/**
 * Portable Text Renderer for Sanity Content
 * ==========================================
 * 
 * Renders rich text content from Sanity with custom components
 * for headings, links, images, and other block types.
 */

import { PortableText, PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import type { ReactNode } from 'react'

const components: PortableTextComponents = {
  block: {
    h2: ({children}: {children?: ReactNode}) => (
      <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900">{children}</h2>
    ),
    h3: ({children}: {children?: ReactNode}) => (
      <h3 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">{children}</h3>
    ),
    h4: ({children}: {children?: ReactNode}) => (
      <h4 className="text-xl font-semibold mt-6 mb-2 text-gray-900">{children}</h4>
    ),
    normal: ({children}: {children?: ReactNode}) => (
      <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
    ),
    blockquote: ({children}: {children?: ReactNode}) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({children, value}: {children?: ReactNode; value?: any}) => {
      const rel = value.blank ? 'noopener noreferrer' : undefined
      const target = value.blank ? '_blank' : undefined
      
      // Internal links
      if (value.href.startsWith('/')) {
        return (
          <Link 
            href={value.href} 
            className="text-blue-600 hover:text-blue-700 underline"
          >
            {children}
          </Link>
        )
      }
      
      // External links
      return (
        <a 
          href={value.href} 
          target={target} 
          rel={rel}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          {children}
        </a>
      )
    },
    strong: ({children}: {children?: ReactNode}) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({children}: {children?: ReactNode}) => (
      <em className="italic">{children}</em>
    ),
    code: ({children}: {children?: ReactNode}) => (
      <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
  },
  types: {
    image: ({value}: {value?: any}) => {
      if (!value?.asset) return null
      
      const imageUrl = urlFor(value)
        .width(1200)
        .height(800)
        .fit('max')
        .auto('format')
        .url()

      return (
        <figure className="my-8">
          <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={value.alt || 'Content image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-600 mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  list: {
    bullet: ({children}: {children?: ReactNode}) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">
        {children}
      </ul>
    ),
    number: ({children}: {children?: ReactNode}) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({children}: {children?: ReactNode}) => (
      <li className="ml-4">{children}</li>
    ),
    number: ({children}: {children?: ReactNode}) => (
      <li className="ml-4">{children}</li>
    ),
  },
}

interface PortableTextRendererProps {
  content: any
  className?: string
}

export function PortableTextRenderer({ content, className = '' }: PortableTextRendererProps) {
  if (!content) return null
  
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <PortableText value={content} components={components} />
    </div>
  )
}
