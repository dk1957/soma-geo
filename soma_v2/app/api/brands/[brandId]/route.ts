import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const UpdateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  brand_type: z.enum(['own', 'client']).optional(),
  industry: z.string().optional(),
  primary_domain: z.string().url().optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  headquarters: z.string().optional(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employee_count: z.enum(['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+']).optional(),
  annual_revenue: z.enum(['<1M', '1M-10M', '10M-50M', '50M-100M', '100M-500M', '500M+']).optional(),
  target_markets: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  locale_settings: z.object({
    primary_locale: z.string(),
    supported_locales: z.array(z.string())
  }).optional(),
  monitoring_keywords: z.array(z.string()).optional(),
  notification_settings: z.object({
    email_alerts: z.boolean(),
    slack_webhook: z.string().url().optional(),
    alert_threshold: z.number().min(0).max(100)
  }).optional(),
  is_active: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('include_stats') === 'true'
    const includeMonitoring = searchParams.get('include_monitoring') === 'true'

    // Get brand with access check
    let selectQuery = `
      *,
      accounts!inner(
        id,
        name,
        account_users!inner(clerk_id, role)
      ),
      workspaces(
        id,
        name,
        slug,
        is_default
      ),
      brand_managers(
        clerk_id,
        role,
        assigned_at
      )
    `

    if (includeStats) {
      selectQuery += `,
      ldi_snapshots(
        overall_score,
        provider_scores,
        mention_count,
        citation_count,
        sentiment_breakdown,
        created_at
      )`
    }

    if (includeMonitoring) {
      selectQuery += `,
      llm_query_results(
        provider,
        query,
        brand_mentions,
        sentiment,
        created_at
      )`
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .select(selectQuery)
      .eq('id', brandId)
      .eq('accounts.account_users.clerk_id', currentUser.clerkUserId)
      .single()

    if (error || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    // Cast brand to any to avoid TypeScript issues with dynamic select
    const brandData = brand as any

    // Format response
    const formattedBrand: any = {
      id: brandData.id,
      name: brandData.name,
      slug: brandData.slug,
      brand_type: brandData.brand_type,
      industry: brandData.industry,
      primary_domain: brandData.primary_domain,
      description: brandData.description,
      logo_url: brandData.logo_url,
      headquarters: brandData.headquarters,
      founded_year: brandData.founded_year,
      employee_count: brandData.employee_count,
      annual_revenue: brandData.annual_revenue,
      target_markets: brandData.target_markets || [],
      competitors: brandData.competitors || [],
      locale_settings: brandData.locale_settings || { primary_locale: 'en-US', supported_locales: ['en-US'] },
      monitoring_keywords: brandData.monitoring_keywords || [],
      notification_settings: brandData.notification_settings || { email_alerts: true, alert_threshold: 10 },
      is_active: brandData.is_active,
      created_at: brandData.created_at,
      updated_at: brandData.updated_at,
      account: {
        id: brandData.accounts.id,
        name: brandData.accounts.name
      },
      workspaces: brandData.workspaces || [],
      managers: brandData.brand_managers || [],
      user_role: brandData.brand_managers?.find((m: any) => m.clerk_id === currentUser.clerkUserId)?.role || 'viewer'
    }

    if (includeStats && brandData.ldi_snapshots?.length > 0) {
      const snapshots = brandData.ldi_snapshots.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const latest = snapshots[0]
      
      formattedBrand.stats = {
        latest_ldi_score: latest.overall_score,
        provider_scores: latest.provider_scores,
        mention_count: latest.mention_count,
        citation_count: latest.citation_count,
        sentiment_breakdown: latest.sentiment_breakdown,
        last_monitored: latest.created_at,
        trend_data: snapshots.slice(0, 30).map((s: any) => ({
          date: s.created_at.split('T')[0],
          score: s.overall_score
        }))
      }
    }

    if (includeMonitoring && brandData.llm_query_results?.length > 0) {
      const recentResults = brandData.llm_query_results
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)

      formattedBrand.monitoring_summary = {
        total_queries: recentResults.length,
        mentioned_queries: recentResults.filter((r: any) => r.brand_mentions.length > 0).length,
        providers_monitored: [...new Set(recentResults.map((r: any) => r.provider))],
        sentiment_distribution: {
          positive: recentResults.filter((r: any) => r.sentiment === 'positive').length,
          neutral: recentResults.filter((r: any) => r.sentiment === 'neutral').length,
          negative: recentResults.filter((r: any) => r.sentiment === 'negative').length
        },
        recent_queries: recentResults.slice(0, 10).map((r: any) => ({
          query: r.query,
          provider: r.provider,
          mentioned: r.brand_mentions.length > 0,
          sentiment: r.sentiment,
          date: r.created_at.split('T')[0]
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedBrand
    })

  } catch (error) {
    console.error('Error in brand GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const validatedData = UpdateBrandSchema.parse(body)

    // Check if user has permission to update this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brands')
      .select(`
        id,
        account_id,
        accounts!inner(
          account_users!inner(clerk_id, role)
        ),
        brand_managers!inner(clerk_id, role)
      `)
      .eq('id', brandId)
      .or(`accounts.account_users.clerk_id.eq.${currentUser.clerkUserId},brand_managers.clerk_id.eq.${currentUser.clerkUserId}`)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    // Check role permissions
    const brandAccessData = brandAccess as any
    const accountRole = brandAccessData.accounts.account_users?.find((au: any) => au.clerk_id === currentUser.clerkUserId)?.role
    const brandRole = brandAccessData.brand_managers?.find((bm: any) => bm.clerk_id === currentUser.clerkUserId)?.role
    
    const canEdit = accountRole && ['owner', 'admin', 'manager'].includes(accountRole) ||
                   brandRole && ['primary_manager', 'manager'].includes(brandRole)

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions to update this brand' }, { status: 403 })
    }

    // Update brand
    const { data: updatedBrand, error: updateError } = await supabase
      .from('brands')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', brandId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating brand:', updateError)
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand
    })

  } catch (error) {
    console.error('Error in brand PUT:', error)
    
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
    const { brandId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if user has permission to delete this brand (only account owners/admins or primary brand managers)
    const { data: brandAccess, error: accessError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        account_id,
        accounts!inner(
          account_users!inner(clerk_id, role)
        ),
        brand_managers!inner(clerk_id, role)
      `)
      .eq('id', brandId)
      .or(`accounts.account_users.clerk_id.eq.${currentUser.clerkUserId},brand_managers.clerk_id.eq.${currentUser.clerkUserId}`)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    // Check role permissions (only owners/admins and primary managers can delete)
    const brandAccessData = brandAccess as any
    const accountRole = brandAccessData.accounts.account_users?.find((au: any) => au.clerk_id === currentUser.clerkUserId)?.role
    const brandRole = brandAccessData.brand_managers?.find((bm: any) => bm.clerk_id === currentUser.clerkUserId)?.role
    
    const canDelete = accountRole && ['owner', 'admin'].includes(accountRole) ||
                     brandRole && brandRole === 'primary_manager'

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to delete this brand. Only account owners/admins or primary brand managers can delete brands.' 
      }, { status: 403 })
    }

    // Soft delete the brand (mark as inactive)
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

    return NextResponse.json({
      success: true,
      message: `Brand "${brandAccess.name}" has been deleted successfully`
    })

  } catch (error) {
    console.error('Error in brand DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}