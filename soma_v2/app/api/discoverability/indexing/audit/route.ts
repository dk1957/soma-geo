/**
 * Brand Indexing Audit API
 *
 * GET  - Retrieve latest audit or audit history
 * POST - Run a new audit using full brand context from the DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { BrandIndexingAuditService } from '@/lib/services/brand-indexing-audit'

const BRAND_SELECT = `
  id, name, slug, description, logo_url, industry, primary_domain, contact_info,
  brand_category, target_markets, products_services, business_type, business_model,
  target_audience, primary_value, business_stage, known_competitors, brand_website,
  entity_aliases, company_location
`

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const mode = searchParams.get('mode') || 'latest'

    if (!brandId) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const auditService = new BrandIndexingAuditService()

    if (mode === 'history') {
      const limit = parseInt(searchParams.get('limit') || '10')
      const history = await auditService.getAuditHistory(brandId, limit)
      return NextResponse.json({ success: true, data: history })
    }

    const audit = await auditService.getLatestAudit(brandId)
    return NextResponse.json({ success: true, data: audit })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(BRAND_SELECT)
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const siteUrl = brand.brand_website || brand.primary_domain || null

    // Fetch competitor domains for context
    const { data: competitors } = await supabase
      .from('competitors')
      .select('competitor_name, competitor_domain')
      .eq('brand_id', brand_id)

    const competitorDomains = (competitors || []).map(c => c.competitor_domain).filter(Boolean)

    const auditService = new BrandIndexingAuditService()
    const result = await auditService.runAudit(brand_id, siteUrl, {
      brandName: brand.name,
      description: brand.description || '',
      industry: brand.industry || brand.brand_category || '',
      products: brand.products_services || '',
      targetAudience: brand.target_audience || '',
      valueProposition: brand.primary_value || '',
      competitors: [...(brand.known_competitors || []), ...competitorDomains],
      targetMarkets: brand.target_markets || [],
      businessModel: brand.business_model || '',
      businessType: brand.business_type || '',
      entityAliases: brand.entity_aliases || [],
      primaryDomain: brand.primary_domain || '',
      slug: brand.slug || '',
      companyLocation: brand.company_location || '',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Audit POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
