import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  logo_url: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    return val;
  }),
  industry: z.string().max(50, 'Industry too long').optional().nullable(),
  industry_category: z.string().optional().nullable(),
  brand_category: z.string().max(100, 'Brand category too long').optional().nullable(),
  brand_type: z.enum(['client', 'own']).optional(),
  // Entity type for report language adaptation (company, personality, campaign, etc.)
  entity_type: z.enum(['company', 'product', 'service', 'personality', 'organization', 'government', 'campaign', 'location']).optional().nullable(),
  primary_domain: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    return val;
  }),
  contact_info: z.record(z.any()).optional().nullable(),
  // Onboarding fields
  products_services: z.string().max(2000, 'Products & services description too long').optional().nullable(),
  target_audience: z.string().max(2000, 'Target audience description too long').optional().nullable(),
  brand_categories: z.array(z.string()).optional().nullable(),
  brand_topics: z.array(z.string()).optional().nullable(),
  target_markets: z.array(z.string()).optional().nullable(),
  known_competitors: z.array(z.string()).optional().nullable(),
  entity_aliases: z.array(z.string()).optional().nullable(),
  // Business fields
  business_type: z.enum(['brand', 'business', 'product', 'organization']).optional().nullable(),
  business_stage: z.enum(['startup', 'growth', 'established', 'enterprise']).optional().nullable(),
  business_model: z.enum(['b2b', 'b2c', 'b2b2c', 'marketplace']).optional().nullable(),
  company_size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional().nullable(),
  primary_value: z.string().optional().nullable(),
  // Company info
  company_name: z.string().max(200, 'Company name too long').optional().nullable(),
  company_website: z.string().optional().nullable().transform(val => {
    if (!val || val.trim() === '') return null;
    return val;
  }),
  company_location: z.string().max(200, 'Company location too long').optional().nullable(),
  // Brand voice/tone
  tone: z.string().max(50, 'Tone too long').optional().nullable(),
  // Settings
  timezone: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  is_active: z.boolean().optional()
})

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

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        *,
        account:accounts(id, name, account_type)
      `)
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if user has access to this brand through account membership
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

    // Get brand statistics
    const [workspaceCount, teamMemberCount] = await Promise.all([
      supabase
        .from('workspaces')
        .select('id', { count: 'exact' })
        .eq('brand_id', brandId)
        .eq('is_active', true),
      supabase
        .from('account_users')
        .select('id', { count: 'exact' })
        .eq('account_id', brand.account_id)
        .eq('is_active', true)
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...brand,
        stats: {
          workspaces: workspaceCount.count || 0,
          team_members: teamMemberCount.count || 0
        },
        user_role: accountAccess.role,
        can_edit: ['owner', 'admin'].includes(accountAccess.role),
        can_delete: accountAccess.role === 'owner'
      }
    })

  } catch (error) {
    console.error('Error fetching brand settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const validatedData = updateBrandSchema.parse(body)

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, name, account:accounts(id, name, account_type)')
      .eq('id', brandId)
      .maybeSingle() // Use maybeSingle() to handle 0 results

    if (brandError) {
      console.error('Error fetching brand for update:', brandError)
      return NextResponse.json({ error: 'Database error while fetching brand' }, { status: 500 })
    }

    if (!brand) {
      console.error('Brand not found for update:', brandId)
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if user has edit permissions
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .maybeSingle() // Use maybeSingle() to handle 0 results

    if (accessError) {
      console.error('Error checking account access:', accessError)
      return NextResponse.json({ error: 'Database error while checking permissions' }, { status: 500 })
    }

    if (!accountAccess) {
      console.error('User has no access to account:', { clerkUserId: currentUser.clerkUserId, accountId: brand.account_id })
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(accountAccess.role)) {
      console.error('User has insufficient permissions:', { clerkUserId: currentUser.clerkUserId, role: accountAccess.role })
      return NextResponse.json({ error: 'Insufficient permissions to edit brand' }, { status: 403 })
    }

    // Check for slug uniqueness if slug is being updated
    if (validatedData.slug) {
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('account_id', brand.account_id)
        .eq('slug', validatedData.slug)
        .neq('id', brandId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 results

      if (existingBrand) {
        return NextResponse.json({ error: 'A brand with this slug already exists in your account' }, { status: 400 })
      }
    }

    // Update brand - try using a service role client to bypass RLS for this specific update
    console.log('Attempting to update brand:', {
      brandId,
      clerkUserId: currentUser.clerkUserId,
      accountId: brand.account_id,
      updateFields: Object.keys(validatedData)
    })

    // Use service role client for the update (bypasses RLS)
    const serviceSupabase = createServiceClient()

    const { data: updatedBrand, error: updateError } = await serviceSupabase
      .from('brands')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', brandId)
      .eq('account_id', brand.account_id) // Double-check account ownership
      .select(`
        *,
        account:accounts(id, name, account_type)
      `)
      .maybeSingle()

    if (updateError) {
      console.error('Error updating brand with service role:', updateError)
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }

    if (!updatedBrand) {
      console.error('Brand update with service role returned no rows')
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    console.log('Brand updated successfully:', { brandId, updatedFields: Object.keys(validatedData) })

    // Log the update
    await supabase
      .from('usage_logs')
      .insert({
        account_id: brand.account_id,
        clerk_id: currentUser.clerkUserId,
        feature: 'brand_management',
        action: 'update',
        metadata: {
          brand_id: brandId,
          updated_fields: Object.keys(validatedData)
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand
    })

  } catch (error) {
    console.error('Error updating brand:', error)
    
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
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { brandId } = await params

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, name')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if user is the account owner (only owners can delete brands)
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

    if (accountAccess.role !== 'owner') {
      return NextResponse.json({ error: 'Only account owners can delete brands' }, { status: 403 })
    }

    // Check if this is the last brand in the account
    const { count: brandCount } = await supabase
      .from('brands')
      .select('id', { count: 'exact' })
      .eq('account_id', brand.account_id)
      .eq('is_active', true)

    if (brandCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the last brand in your account. Create another brand first.' 
      }, { status: 400 })
    }

    // Soft delete the brand (set is_active to false)
    const { error: deleteError } = await supabase
      .from('brands')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', brandId)

    if (deleteError) {
      console.error('Error deleting brand:', deleteError)
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
    }

    // Log the deletion
    await supabase
      .from('usage_logs')
      .insert({
        account_id: brand.account_id,
        clerk_id: currentUser.clerkUserId,
        feature: 'brand_management',
        action: 'delete',
        metadata: {
          brand_id: brandId,
          brand_name: brand.name
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}