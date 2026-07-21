import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Prompt Topics API
 * =================
 * Manages topic-based organization for prompts
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const includePromptCounts = searchParams.get('include_counts') !== 'false'

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get topics for the brand
    const { data: topics, error: topicsError } = await supabase
      .from('prompt_topics')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (topicsError) {
      console.error('Error fetching topics:', topicsError)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    // Get default templates for suggestions
    const { data: templates } = await supabase
      .from('default_topic_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      success: true,
      topics: topics || [],
      templates: templates || []
    })

  } catch (error) {
    console.error('Topics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id, name, description, color, icon } = body

    if (!brand_id || !name) {
      return NextResponse.json({ error: 'Brand ID and name are required' }, { status: 400 })
    }

    // Verify user has access
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess || !['owner', 'admin', 'account_manager'].includes(hasAccess.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Get next sort order
    const { data: maxOrder } = await supabase
      .from('prompt_topics')
      .select('sort_order')
      .eq('brand_id', brand_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    // Create the topic
    const { data: newTopic, error: insertError } = await supabase
      .from('prompt_topics')
      .insert({
        brand_id,
        account_id: brand.account_id,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        color: color || '#6366f1',
        icon: icon || 'folder',
        sort_order: sortOrder
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'A topic with this name already exists' }, { status: 409 })
      }
      console.error('Error creating topic:', insertError)
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    return NextResponse.json({ success: true, topic: newTopic })

  } catch (error) {
    console.error('Topic creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, color, icon, sort_order, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 })
    }

    // Get topic and verify access
    const { data: topic, error: topicError } = await supabase
      .from('prompt_topics')
      .select('account_id')
      .eq('id', id)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('role')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', topic.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess || !['owner', 'admin', 'account_manager'].includes(hasAccess.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) {
      updateData.name = name.trim()
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedTopic, error: updateError } = await supabase
      .from('prompt_topics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'A topic with this name already exists' }, { status: 409 })
      }
      console.error('Error updating topic:', updateError)
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
    }

    return NextResponse.json({ success: true, topic: updatedTopic })

  } catch (error) {
    console.error('Topic update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get topic and verify access
    const { data: topic, error: topicError } = await supabase
      .from('prompt_topics')
      .select('account_id, prompt_count')
      .eq('id', id)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('role')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', topic.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess || !['owner', 'admin', 'account_manager'].includes(hasAccess.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't delete if topic has prompts - soft delete instead
    if (topic.prompt_count > 0) {
      const { error: softDeleteError } = await supabase
        .from('prompt_topics')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (softDeleteError) {
        console.error('Error soft-deleting topic:', softDeleteError)
        return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Topic archived (has associated prompts)',
        archived: true
      })
    }

    // Hard delete if no prompts
    const { error: deleteError } = await supabase
      .from('prompt_topics')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting topic:', deleteError)
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Topic deleted', archived: false })

  } catch (error) {
    console.error('Topic deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
