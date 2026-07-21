import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate', 'update_category', 'update_priority']),
  prompt_ids: z.array(z.string().uuid()).min(1),
  brand_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  // Optional fields for updates
  category: z.enum(['product_features', 'infrastructure', 'safety', 'pricing', 'technology', 'comparison', 'general']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bulkOperationSchema.parse(body)

    // Verify user has access to this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brand_managers')
      .select('role')
      .eq('brand_id', validatedData.brand_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    // Check permissions for the operation
    if (validatedData.action === 'delete' && !['primary_manager', 'manager'].includes(brandAccess.role)) {
      return NextResponse.json({ error: 'Only managers can delete prompts' }, { status: 403 })
    }

    if (!['primary_manager', 'manager', 'contributor'].includes(brandAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions for bulk operations' }, { status: 403 })
    }

    // Verify all prompts belong to the specified brand and workspace
    const { data: promptsCheck, error: checkError } = await supabase
      .from('prompts')
      .select('id')
      .eq('brand_id', validatedData.brand_id)
      .eq('workspace_id', validatedData.workspace_id)
      .in('id', validatedData.prompt_ids)
      .eq('is_active', true)

    if (checkError || promptsCheck.length !== validatedData.prompt_ids.length) {
      return NextResponse.json({ error: 'Some prompts not found or access denied' }, { status: 400 })
    }

    let updateData: any = { updated_at: new Date().toISOString() }
    let successMessage = ''

    // Prepare update data based on action
    switch (validatedData.action) {
      case 'delete':
        updateData.is_active = false
        updateData.deleted_at = new Date().toISOString()
        successMessage = 'Prompts deleted successfully'
        break
      case 'activate':
        updateData.is_active = true
        updateData.deleted_at = null
        successMessage = 'Prompts activated successfully'
        break
      case 'deactivate':
        updateData.is_active = false
        successMessage = 'Prompts deactivated successfully'
        break
      case 'update_category':
        if (!validatedData.category) {
          return NextResponse.json({ error: 'Category is required for category update' }, { status: 400 })
        }
        updateData.category = validatedData.category
        successMessage = 'Prompts category updated successfully'
        break
      case 'update_priority':
        if (!validatedData.priority) {
          return NextResponse.json({ error: 'Priority is required for priority update' }, { status: 400 })
        }
        updateData.priority = validatedData.priority
        successMessage = 'Prompts priority updated successfully'
        break
    }

    // Perform bulk update
    const { error: updateError } = await supabase
      .from('prompts')
      .update(updateData)
      .in('id', validatedData.prompt_ids)

    if (updateError) {
      console.error('Error performing bulk operation:', updateError)
      return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 })
    }

    // Log usage
    await supabase
      .from('usage_logs')
      .insert({
        brand_id: validatedData.brand_id,
        clerk_id: user.clerkUserId,
        feature: 'prompts',
        action: `bulk_${validatedData.action}`,
        metadata: {
          prompt_count: validatedData.prompt_ids.length,
          action: validatedData.action,
          category: validatedData.category,
          priority: validatedData.priority
        }
      })

    return NextResponse.json({
      success: true,
      message: successMessage,
      affected_count: validatedData.prompt_ids.length
    })

  } catch (error) {
    console.error('Error in prompts bulk POST:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}