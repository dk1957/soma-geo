import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  price_range: z.string().max(50, 'Price range too long').optional(),
  locale: z.enum(['en-GB', 'en-ZA', 'fr-FR', 'fr-MA', 'de-DE', 'it-IT', 'es-ES', 'nl-NL', 'sv-SE', 'no-NO', 'ar-AE', 'ar-SA', 'he-IL', 'tr-TR', 'en-US']).optional(),
  target_markets: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  metadata: z.record(z.any()).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string; productId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { brandId, productId } = await params
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Verify user has access to this brand and product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(account_id)
      `)
      .eq('id', productId)
      .eq('brand_id', brandId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check access
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', product.brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['owner', 'admin', 'member'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit products' }, { status: 403 })
    }

    // Check for SKU uniqueness if SKU is being updated
    if (validatedData.sku && validatedData.sku !== product.sku) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', brandId)
        .eq('sku', validatedData.sku)
        .eq('locale', validatedData.locale || product.locale)
        .neq('id', productId)
        .single()

      if (existingProduct) {
        return NextResponse.json({ error: 'A product with this SKU already exists for this locale' }, { status: 400 })
      }
    }

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating product:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Log the update
    await supabase
      .from('usage_logs')
      .insert({
        account_id: product.brand.account_id,
        clerk_id: currentUser.clerkUserId,
        feature: 'product_management',
        action: 'update',
        metadata: {
          brand_id: brandId,
          product_id: productId,
          updated_fields: Object.keys(validatedData)
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string; productId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { brandId, productId } = await params

    // Verify user has access to this brand and product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(account_id)
      `)
      .eq('id', productId)
      .eq('brand_id', brandId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check access
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', product.brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Only owners and admins can delete products' }, { status: 403 })
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    // Log the deletion
    await supabase
      .from('usage_logs')
      .insert({
        account_id: product.brand.account_id,
        clerk_id: currentUser.clerkUserId,
        feature: 'product_management',
        action: 'delete',
        metadata: {
          brand_id: brandId,
          product_id: productId,
          product_name: product.name
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}