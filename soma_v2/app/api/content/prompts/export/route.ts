import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id, workspace_id, format = 'csv', filters = {} } = body

    if (!brand_id || !workspace_id) {
      return NextResponse.json({ error: 'Brand ID and Workspace ID are required' }, { status: 400 })
    }

    // Verify user has access to this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brands')
      .select('name, account_id')
      .eq('id', brand_id)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Verify user has access to this account
    const { data: accountAccess, error: accountAccessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', brandAccess.account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accountAccessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    // Build query with filters - use user_prompts table instead of prompts
    let query = supabase
      .from('user_prompts')
      .select('*')
      .eq('account_id', brandAccess.account_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.search) {
      query = query.or(`prompt_text.ilike.%${filters.search}%`)
    }

    const { data: prompts, error } = await query

    if (error) {
      console.error('Error fetching prompts for export:', error)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Prompt Text',
        'Category',
        'Priority',
        'Rationale',
        'Is Selected',
        'Created Date',
        'Last Updated'
      ].join(',')

      const csvRows = prompts.map((prompt: any) => {
        return [
          `"${prompt.prompt_text.replace(/"/g, '""')}"`,
          prompt.category || 'general',
          prompt.priority || 1,
          `"${(prompt.rationale || '').replace(/"/g, '""')}"`,
          prompt.is_selected ? 'Yes' : 'No',
          new Date(prompt.created_at).toISOString().split('T')[0],
          new Date(prompt.updated_at).toISOString().split('T')[0]
        ].join(',')
      })

      const csvContent = [csvHeaders, ...csvRows].join('\n')

      // Log export activity
      await supabase
        .from('usage_logs')
        .insert({
          account_id: brandAccess.account_id,
          clerk_id: user.clerkUserId,
          feature: 'prompts',
          action: 'export',
          metadata: {
            format,
            count: prompts.length,
            filters
          }
        })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="prompts-${brandAccess.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } 
    
    if (format === 'json') {
      // Return JSON format
      const jsonData = prompts.map((prompt: any) => ({
        id: prompt.id,
        prompt_text: prompt.prompt_text,
        category: prompt.category,
        priority: prompt.priority,
        rationale: prompt.rationale,
        is_selected: prompt.is_selected,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
      }))

      // Log export activity
      await supabase
        .from('usage_logs')
        .insert({
          account_id: brandAccess.account_id,
          clerk_id: user.clerkUserId,
          feature: 'prompts',
          action: 'export',
          metadata: {
            format,
            count: prompts.length,
            filters
          }
        })

      return NextResponse.json({
        success: true,
        data: jsonData,
        exported_at: new Date().toISOString(),
        brand_name: brandAccess.name,
        total_count: prompts.length
      })
    }

    return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })

  } catch (error) {
    console.error('Error in prompts export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}