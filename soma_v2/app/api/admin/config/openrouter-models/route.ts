import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    let models = (result.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      description: m.description || '',
      context_length: m.context_length,
      pricing: {
        prompt: m.pricing?.prompt || '0',
        completion: m.pricing?.completion || '0',
      },
      top_provider: m.top_provider?.max_completion_tokens || null,
      architecture: m.architecture?.modality || null,
    }))

    // Filter by query if provided
    if (query) {
      const q = query.toLowerCase()
      models = models.filter((m: any) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      )
    }

    // Sort by name
    models.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({ success: true, data: models })
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models from OpenRouter' },
      { status: 500 }
    )
  }
}
