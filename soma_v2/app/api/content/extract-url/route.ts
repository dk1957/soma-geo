import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { load } from 'cheerio'

/**
 * POST /api/v1/content/extract-url
 * Extract content from a URL with formatting preserved (server-side to avoid CORS)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format and prevent SSRF
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }
      // Block internal/private network requests (SSRF prevention)
      const hostname = parsedUrl.hostname.toLowerCase()
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^0\./,
        /^169\.254\./,
        /^\[::1\]$/,
        /^\[fc/i,
        /^\[fd/i,
        /^\[fe80/i,
        /\.internal$/i,
        /\.local$/i,
      ]
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return NextResponse.json(
          { error: 'URL targets a private/internal network address' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the URL content with timeout and size limit
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SomaGEO/1.0; +https://soma.ai)'
        },
        signal: controller.signal,
        redirect: 'follow',
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    // Check content-length to prevent downloading huge files (5MB limit)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'URL content exceeds maximum size (5MB)' },
        { status: 400 }
      )
    }

    const html = await response.text()
    
    // Double-check actual size
    if (html.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'URL content exceeds maximum size (5MB)' },
        { status: 400 }
      )
    }

    const $ = load(html)

    // Remove unwanted elements
    $('script, style, nav, footer, aside, .navigation, .menu, .sidebar, .comments, .advertisement, .social-share, .ad, .ads').remove()

    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'Untitled'

    // Extract main content with formatting
    let contentElement = null
    
    // Try to find main content area
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.post',
      '.article'
    ]

    for (const selector of mainSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        contentElement = element.first()
        break
      }
    }

    // Fallback to body if no main content found
    if (!contentElement || contentElement.length === 0) {
      contentElement = $('body')
    }

    // Get the base URL for resolving relative paths
    const baseUrl = new URL(url)
    
    // Process the content to preserve formatting
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'b', 'i', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr', 'span', 'div']

    contentElement.find('*').each((_, el) => {
      const $el = $(el)
      const tagName = el.name

      if (!allowedTags.includes(tagName)) {
        // Replace unwanted tags with their content
        $el.replaceWith($el.html() || '')
      } else {
        // Handle images - convert relative URLs to absolute
        if (tagName === 'img') {
          const src = $el.attr('src')
          if (src && !src.startsWith('http') && !src.startsWith('data:')) {
            try {
              const absoluteUrl = new URL(src, baseUrl.origin).href
              $el.attr('src', absoluteUrl)
            } catch (e) {
              // If URL resolution fails, keep original
            }
          }
        }
        
        // Handle links - convert relative URLs to absolute
        if (tagName === 'a') {
          const href = $el.attr('href')
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            try {
              const absoluteUrl = new URL(href, baseUrl.origin).href
              $el.attr('href', absoluteUrl)
            } catch (e) {
              // If URL resolution fails, keep original
            }
          }
        }
        
        // Preserve math notation in span/div elements
        if ((tagName === 'span' || tagName === 'div') && $el.attr('class')) {
          const className = $el.attr('class') || ''
          if (className.includes('math') || className.includes('katex') || className.includes('mjx') || className.includes('formula')) {
            // Keep class attribute for math elements
            return
          }
        }
        
        // Clean attributes, keep only essential ones
        const attrs = Object.keys(el.attribs || {})
        attrs.forEach(attr => {
          if (attr !== 'href' && attr !== 'src' && attr !== 'alt' && attr !== 'title') {
            // Keep class for special elements like code blocks and math
            if (attr === 'class' && (tagName === 'code' || tagName === 'pre' || tagName === 'span' || tagName === 'div')) {
              const className = $el.attr('class') || ''
              if (className.includes('math') || className.includes('katex') || className.includes('language-') || className.includes('formula')) {
                return // Keep this class
              }
            }
            $el.removeAttr(attr)
          }
        })
      }
    })

    let contentHtml = contentElement.html() || ''

    // Clean up the HTML
    contentHtml = contentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()

    // Extract metadata
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content')
    
    const date = $('meta[property="article:published_time"]').attr('content') ||
                $('meta[name="date"]').attr('content') ||
                $('time').attr('datetime')

    // Calculate word count from text content
    const textContent = contentElement.text()
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

    return NextResponse.json({
      success: true,
      title,
      content: contentHtml,
      metadata: {
        author,
        date,
        url,
        wordCount,
        format: 'html'
      }
    })

  } catch (error) {
    console.error('URL extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract content from URL', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
