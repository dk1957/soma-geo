import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { load } from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const extension = fileName.split('.').pop()?.toLowerCase()

    let title = fileName.replace(/\.[^/.]+$/, '')
    let content = ''
    let format: 'pdf' | 'docx' | 'html' | 'text' = 'text'

    // Parse based on file type
    if (extension === 'pdf') {
      // Use eval to hide import from webpack
      const pdfParse = await eval('import("pdf-parse")').then((m: any) => m.default)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const data = await pdfParse(buffer)
      content = data.text.trim()
      format = 'pdf'
    } else if (extension === 'docx' || extension === 'doc') {
      // Use eval to hide import from webpack
      const mammothLib = await eval('import("mammoth")')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammothLib.default.extractRawText({ arrayBuffer })
      content = result.value.trim()
      format = 'docx'
    } else if (extension === 'html' || extension === 'htm') {
      const text = await file.text()
      const $ = load(text)
      title = $('title').text() || title
      content = $('body').text().replace(/\s+/g, ' ').trim()
      format = 'html'
    } else if (extension === 'md' || extension === 'markdown') {
      const text = await file.text()
      // Extract title from first heading
      const titleMatch = text.match(/^#\s+(.+)$/m)
      if (titleMatch) title = titleMatch[1]
      
      // Convert markdown to plain text
      content = text
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`(.+?)`/g, '$1')
        .trim()
      format = 'text'
    } else if (extension === 'txt') {
      content = await file.text()
      format = 'text'
    } else {
      return NextResponse.json(
        { error: `Unsupported file format: ${extension}. Supported formats: txt, md, html, pdf, docx` },
        { status: 400 }
      )
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length

    return NextResponse.json({
      title,
      content,
      metadata: {
        fileName,
        wordCount,
        format
      }
    })
  } catch (error) {
    console.error('File parsing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to parse file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
