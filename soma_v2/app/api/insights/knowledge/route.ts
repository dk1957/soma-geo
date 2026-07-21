/**
 * Brand Knowledge Facts API
 *
 * GET    /api/insights/knowledge?brand_id=<id>          — Get all facts
 * POST   /api/insights/knowledge?brand_id=<id>          — Create/update a fact
 * DELETE /api/insights/knowledge?brand_id=<id>&id=<fid>  — Delete a fact
 * PATCH  /api/insights/knowledge?brand_id=<id>&action=extract  — Auto-extract from profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { BrandKnowledgeService } from '@/lib/services/brand-knowledge-service'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = new BrandKnowledgeService()
    const grouped = await service.getFactsByCategory(brandId)
    const allFacts = await service.getFacts(brandId)

    return NextResponse.json({
      data: {
        facts: allFacts,
        by_category: grouped,
        total: allFacts.length,
      },
    })
  } catch (error) {
    console.error('[Knowledge GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch facts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { category, fact_key, fact_value, fact_context, source, source_url, confidence } = body

    if (!category || !fact_key || !fact_value) {
      return NextResponse.json(
        { error: 'category, fact_key, and fact_value are required' },
        { status: 400 }
      )
    }

    // Get account_id from brand
    const supabase = createServiceClient()
    const { data: brand } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const service = new BrandKnowledgeService()
    const fact = await service.upsertFact({
      brand_id: brandId,
      account_id: brand.account_id,
      category,
      fact_key,
      fact_value,
      fact_context,
      source: source || 'manual',
      source_url,
      confidence: confidence ?? 1.0,
      verified: true, // manual entries are verified by default
    })

    return NextResponse.json({ data: fact })
  } catch (error) {
    console.error('[Knowledge POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save fact' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const factId = request.nextUrl.searchParams.get('id')
  if (!factId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = new BrandKnowledgeService()
    await service.deleteFact(factId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Knowledge DELETE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete fact' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')
  const action = request.nextUrl.searchParams.get('action')

  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (action === 'extract') {
      // Auto-extract from brand profile
      const supabase = createServiceClient()
      const { data: brand } = await supabase
        .from('brands')
        .select('account_id')
        .eq('id', brandId)
        .single()

      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }

      const service = new BrandKnowledgeService()
      const count = await service.extractFromBrandProfile(brandId, brand.account_id)
      return NextResponse.json({ data: { extracted: count } })
    }

    // Update a specific fact
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'fact id is required in body' }, { status: 400 })
    }

    const service = new BrandKnowledgeService()
    const fact = await service.updateFact(id, updates)
    return NextResponse.json({ data: fact })
  } catch (error) {
    console.error('[Knowledge PATCH] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    )
  }
}
