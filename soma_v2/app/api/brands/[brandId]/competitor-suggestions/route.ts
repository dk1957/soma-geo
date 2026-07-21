import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { CompetitorExtractor } from '@/lib/utils/competitor-extractor'

export async function GET(request: Request) {
  // Get brandId from URL
  const url = new URL(request.url)
  const brandId = url.pathname.split('/')[3] // Extracts brandId from /api/brands/[brandId]/competitor-suggestions
  try {
  const supabase = createServiceClient()
  if (!brandId) {
    return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
  }

    // Get user from Clerk
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id, name')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user access to the account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get existing competitors to exclude from suggestions
    const { data: existingCompetitors, error: competitorsError } = await supabase
      .from('competitors')
      .select('competitor_name')
      .eq('brand_id', brandId)

    if (competitorsError) {
      console.error('Error fetching existing competitors:', competitorsError)
      return NextResponse.json({ error: 'Failed to fetch existing competitors' }, { status: 500 })
    }

    const existingCompetitorNames = (existingCompetitors || []).map((c: { competitor_name: string }) => c.competitor_name.toLowerCase())

    // Load co-mentioned brands from response_data (primary brand rows only)
    const { data: responseRows, error: responseError } = await supabase
      .from('response_data')
      .select('response_id, co_mentioned_brands')
      .eq('brand_id', brandId)
      .is('competitor_id', null) // Only primary brand rows
      .not('co_mentioned_brands', 'eq', '{}') // Skip empty arrays

    if (responseError) {
      console.error('Error fetching response data for suggestions:', responseError)
    }

    const analysisData = (responseRows || []).map(r => ({
      response_id: r.response_id,
      competitors_in_response: r.co_mentioned_brands || [],
    }))

    if (!analysisData || analysisData.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: []
      })
    }

    // Extract competitors from competitors_in_response array field
    const competitorFrequency: Record<string, { 
      count: number; 
      sources: string[] 
    }> = {}

    for (const analysis of analysisData) {
      if (!analysis.competitors_in_response || !Array.isArray(analysis.competitors_in_response)) continue

      for (const competitorName of analysis.competitors_in_response) {
        if (!competitorName || typeof competitorName !== 'string') continue

        const trimmedName = competitorName.trim()
        if (!trimmedName) continue

        const normalizedName = trimmedName.toLowerCase()
        
        // Skip if it's a URL, email, or other non-brand entity
        if (normalizedName.includes('http://') || 
            normalizedName.includes('https://') || 
            normalizedName.includes('www.') ||
            normalizedName.includes('@') ||
            normalizedName.length < 2 ||
            normalizedName.length > 100) {
          continue
        }

        // Skip if it's an existing competitor or the brand itself
        if (existingCompetitorNames.includes(normalizedName) ||
            normalizedName.includes(brand.name.toLowerCase()) ||
            brand.name.toLowerCase().includes(normalizedName)) {
          continue
        }

        // Skip common generic terms
        const genericTerms = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'about', 'other', 'more', 'best', 'top']
        if (genericTerms.includes(normalizedName)) {
          continue
        }

        if (!competitorFrequency[trimmedName]) {
          competitorFrequency[trimmedName] = { 
            count: 0, 
            sources: [] 
          }
        }

        competitorFrequency[trimmedName].count++
        competitorFrequency[trimmedName].sources.push(analysis.response_id || analysis.id)
      }
    }

    // Prepare suggestions
    const suggestions = Object.entries(competitorFrequency)
      .filter(([_, data]) => data.count >= 2) // Only suggest if mentioned in at least 2 responses
      .map(([name, data]) => {
        return {
          name,
          frequency: data.count,
          confidence: Math.min(data.count / 20, 1), // Confidence based on frequency, max 1.0
          context: `Mentioned across ${data.count} responses`,
          sources: [...new Set(data.sources)].slice(0, 5) // Unique sources, limit to 5
        }
      })
      .sort((a, b) => {
        // Sort by frequency first, then by total mentions
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return b.sources.length - a.sources.length
      })
      .slice(0, 15) // Top 15 suggestions

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('Error in GET /api/brands/[brandId]/competitor-suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}