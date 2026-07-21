import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const createProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  price_range: z.string().max(50, 'Price range too long').optional(),
  locale: z.enum(['en-GB', 'en-ZA', 'fr-FR', 'fr-MA', 'de-DE', 'it-IT', 'es-ES', 'nl-NL', 'sv-SE', 'no-NO', 'ar-AE', 'ar-SA', 'he-IL', 'tr-TR', 'en-US']).default('en-GB'),
  target_markets: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  metadata: z.record(z.any()).default({})
})

const updateProductSchema = createProductSchema.partial()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { brandId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check access
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error in products GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { brandId } = await params
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check edit permissions
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['owner', 'admin', 'member'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create products' }, { status: 403 })
    }

    // Check for SKU uniqueness if provided
    if (validatedData.sku) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', brandId)
        .eq('sku', validatedData.sku)
        .eq('locale', validatedData.locale)
        .single()

      if (existingProduct) {
        return NextResponse.json({ error: 'A product with this SKU already exists for this locale' }, { status: 400 })
      }
    }

    // Create product
    const { data: product, error: createError } = await supabase
      .from('products')
      .insert({
        brand_id: brandId,
        ...validatedData
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating product:', createError)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Log the creation
    await supabase
      .from('usage_logs')
      .insert({
        account_id: brand.account_id,
        clerk_id: currentUser.clerkUserId,
        feature: 'product_management',
        action: 'create',
        metadata: {
          brand_id: brandId,
          product_id: product.id,
          product_name: product.name
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product
    })

  } catch (error) {
    console.error('Error creating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}