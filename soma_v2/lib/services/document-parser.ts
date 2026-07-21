/**
 * Document Parser Service
 * Handles extraction of text from various document formats and URLs
 */

import { load } from 'cheerio'

export interface ParsedDocument {
  title: string
  content: string
  metadata: {
    author?: string
    date?: string
    url?: string
    wordCount: number
    format: 'pdf' | 'docx' | 'html' | 'text'
  }
}

export class DocumentParser {
  /**
   * Parse content from a URL and preserve HTML formatting
   */
  async parseURLWithFormatting(url: string): Promise<ParsedDocument> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`)
      }

      const html = await response.text()
      const $ = load(html)

      // Remove unwanted elements
      $('script, style, nav, footer, aside, .navigation, .menu, .sidebar, .comments, .advertisement, .social-share').remove()

      // Extract title
      const title = $('title').text() || $('h1').first().text() || 'Untitled'

      // Extract main content with formatting
      let contentHtml = ''
      
      // Try to find main content area
      const mainSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content'
      ]

      let contentElement = null
      for (const selector of mainSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          contentElement = element.first()
          break
        }
      }

      // Fallback to body if no main content found
      if (!contentElement) {
        contentElement = $('body')
      }

      // Process the content to preserve formatting
      contentElement.find('*').each((_, el) => {
        const $el = $(el)
        
        // Clean up attributes but keep essentials
        const tagName = el.name
        const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'b', 'i', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr']
        
        if (!allowedTags.includes(tagName)) {
          // Replace unwanted tags with their content
          $el.replaceWith($el.html() || '')
        } else {
          // Clean attributes
          const attrs = el.attribs
          Object.keys(attrs).forEach(attr => {
            if (attr !== 'href' && attr !== 'src' && attr !== 'alt') {
              $el.removeAttr(attr)
            }
          })
        }
      })

      contentHtml = contentElement.html() || ''

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

      return {
        title,
        content: contentHtml,
        metadata: {
          author,
          date,
          url,
          wordCount,
          format: 'html'
        }
      }
    } catch (error) {
      console.error('Error parsing URL:', error)
      throw new Error(`Failed to parse URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse content from a URL (legacy - plain text)
   */
  async parseURL(url: string): Promise<ParsedDocument> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`)
      }

      const html = await response.text()
      const $ = load(html)

      // Remove script and style tags
      $('script, style, nav, footer, aside').remove()

      // Extract title
      const title = $('title').text() || $('h1').first().text() || 'Untitled'

      // Extract main content
      let content = ''
      
      // Try to find main content area
      const mainSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.article-content',
        '#content'
      ]

      for (const selector of mainSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          content = element.text()
          break
        }
      }

      // Fallback to body if no main content found
      if (!content) {
        content = $('body').text()
      }

      // Clean up whitespace
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim()

      // Extract metadata
      const author = $('meta[name="author"]').attr('content') || 
                    $('meta[property="article:author"]').attr('content')
      
      const date = $('meta[property="article:published_time"]').attr('content') ||
                  $('meta[name="date"]').attr('content') ||
                  $('time').attr('datetime')

      const wordCount = content.split(/\s+/).length

      return {
        title,
        content,
        metadata: {
          author,
          date,
          url,
          wordCount,
          format: 'html'
        }
      }
    } catch (error) {
      console.error('Error parsing URL:', error)
      throw new Error(`Failed to parse URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse plain text file
   */
  async parseText(text: string, filename?: string): Promise<ParsedDocument> {
    const lines = text.split('\n')
    const title = filename?.replace(/\.(txt|md)$/, '') || lines[0]?.substring(0, 50) || 'Untitled'
    
    const wordCount = text.split(/\s+/).length

    return {
      title,
      content: text.trim(),
      metadata: {
        wordCount,
        format: 'text'
      }
    }
  }

  /**
   * Parse markdown content
   */
  async parseMarkdown(markdown: string, filename?: string): Promise<ParsedDocument> {
    // Extract title from first heading or filename
    const titleMatch = markdown.match(/^#\s+(.+)$/m)
    const title = titleMatch?.[1] || filename?.replace(/\.md$/, '') || 'Untitled'

    // Convert markdown to plain text (remove markdown syntax)
    let content = markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links but keep text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .trim()

    const wordCount = content.split(/\s+/).length

    return {
      title,
      content,
      metadata: {
        wordCount,
        format: 'text'
      }
    }
  }

  /**
   * Parse file based on extension
   */
  async parseFile(file: File): Promise<ParsedDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'txt') {
      const text = await file.text()
      return this.parseText(text, file.name)
    }

    if (extension === 'md' || extension === 'markdown') {
      const text = await file.text()
      return this.parseMarkdown(text, file.name)
    }

    if (extension === 'html' || extension === 'htm') {
      const text = await file.text()
      const $ = load(text)
      const title = $('title').text() || file.name.replace(/\.(html|htm)$/, '')
      const content = $('body').text().replace(/\s+/g, ' ').trim()
      const wordCount = content.split(/\s+/).length

      return {
        title,
        content,
        metadata: {
          wordCount,
          format: 'html'
        }
      }
    }

    // PDF and DOCX require server-side processing
    if (extension === 'pdf' || extension === 'docx' || extension === 'doc') {
      throw new Error('PDF and DOCX files must be processed server-side. Use the API endpoint instead.')
    }

    throw new Error(`Unsupported file format: ${extension}. Supported formats: txt, md, html`)
  }

  /**
   * Validate URL format
   */
  isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Extract key topics from content (simple keyword extraction)
   */
  extractKeyTopics(content: string, limit: number = 10): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4) // Only words > 4 chars

    // Count word frequency
    const frequency: Record<string, number> = {}
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1
    }

    // Sort by frequency and return top N
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word)
  }

  /**
   * Clean and normalize content
   */
  cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/[^\S\n]+/g, ' ') // Normalize spaces
      .trim()
  }
}

// Export singleton instance
export const documentParser = new DocumentParser()
