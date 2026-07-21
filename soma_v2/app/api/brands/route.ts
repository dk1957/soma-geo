import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')
    const includeStats = searchParams.get('include_stats') === 'true'

    if (!accountId) {
      return NextResponse.json({ error: 'account_id parameter is required' }, { status: 400 })
    }

    // Verify user has access to this account via clerk_id
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    // Get brands for this account
    let query = supabase
      .from('brands')
      .select(`
        *,
        account:accounts(id, name, account_type)
      `)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const { data: brands, error: brandsError } = await query

    if (brandsError) {
      console.error('Error fetching brands:', brandsError)
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }

    // Add stats if requested
    if (includeStats && brands && brands.length > 0) {
      const brandIds = brands.map(brand => brand.id)
      
      // Get workspace counts for each brand
      const { data: workspaceCounts } = await supabase
        .from('workspaces')
        .select('brand_id, id')
        .in('brand_id', brandIds)
        .eq('is_active', true)

      const workspaceCountMap = workspaceCounts?.reduce((acc, workspace) => {
        acc[workspace.brand_id] = (acc[workspace.brand_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Add stats to each brand
      brands.forEach(brand => {
        brand.stats = {
          workspaces: workspaceCountMap[brand.id] || 0,
          team_members: 0, // Could add this if needed
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: brands || []
    })

  } catch (error) {
    console.error('Error in brands API:', error)
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

    // Rate limit: brand creation
    const limited = applyRateLimit(request, 'brands:create', RATE_LIMITS.write, user.clerkUserId)
    if (limited) return limited

    const body = await request.json()
    const { 
      account_id, 
      name, 
      description, 
      industry, 
      brand_type = 'client',
      primary_domain,
      brand_categories,
      brandCategories,
      businessType,
      businessModel,
      businessStage,
      productsServices,
      targetAudience,
      primaryValue,
      targetMarkets,
      knownCompetitors,
      brandTopics,
      // Company details (for both agency and in-house)
      company_name,
      company_website,
      company_location
    } = body

    if (!account_id || !name) {
      return NextResponse.json({ error: 'account_id and name are required' }, { status: 400 })
    }

    // Verify user has access to create brands in this account via clerk_id
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create brands' }, { status: 403 })
    }

    // Check brand quota before creation
    const { data: quotaAllowed, error: quotaError } = await supabase.rpc('can_create_brand', {
      p_account_id: account_id
    })

    if (quotaError) {
      console.error('Error checking brand quota:', quotaError)
      return NextResponse.json({ error: 'Failed to check brand quota' }, { status: 500 })
    }

    if (!quotaAllowed) {
      // Get quota details for error message
      const { data: quotas } = await supabase.rpc('get_account_subscription_quotas', {
        p_account_id: account_id
      })
      const q = quotas?.[0]
      const maxBrands = q?.max_brands || 0
      return NextResponse.json({ 
        error: `Brand limit reached. Your plan allows ${maxBrands} brand${maxBrands !== 1 ? 's' : ''}. Upgrade your plan to add more brands.`,
        quota_exceeded: true,
        max_brands: maxBrands,
        plan_name: q?.plan_name || null,
        plan_tier: q?.plan_tier || null,
      }, { status: 403 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check if slug already exists in this account
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('account_id', account_id)
      .eq('slug', slug)
      .single()

    if (existingBrand) {
      return NextResponse.json({ error: 'A brand with this name already exists' }, { status: 400 })
    }

    // Use brand_categories or brandCategories, ensure at least one category
    const categories = brand_categories || brandCategories || []
    const category = categories.length > 0 ? categories[0] : industry || 'technology'

    // Build brand data - only include brand_topics if we have topics
    // (the column may not exist if migration hasn't been run)
    const brandData: Record<string, any> = {
      account_id,
      name,
      slug,
      description: description || null, // Rich description for AI prompt generation
      industry: industry || category,
      brand_type,
      primary_domain,
      brand_category: category,
      brand_categories: categories.length > 0 ? categories : [category],
      products_services: productsServices,
      business_type: businessType,
      business_stage: businessStage,
      target_audience: targetAudience,
      primary_value: primaryValue,
      target_markets: targetMarkets || [],
      known_competitors: knownCompetitors || [],
      business_model: businessModel,
      // Company details - set for both agency and in-house brands
      company_name: company_name || null,
      company_website: company_website || null,
      company_location: company_location || null
    }

    // Create brand
    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert([brandData])
      .select()
      .single()

    if (createError) {
      console.error('Error creating brand:', createError)
      return NextResponse.json({ error: 'Failed to create brand', details: createError.message }, { status: 500 })
    }

    // Create default workspace for the brand
    const { data: newWorkspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([
        {
          account_id,
          brand_id: newBrand.id,
          name: `${newBrand.name} Workspace`,
          slug: `${slug}-workspace`,
          is_default: true
        }
      ])
      .select()
      .single()

    if (workspaceError) {
      console.error('Error creating default workspace:', workspaceError)
      return NextResponse.json({ error: 'Failed to create default workspace', details: workspaceError.message }, { status: 500 })
    }

    // Insert known competitors into the competitors table
    if (knownCompetitors && knownCompetitors.length > 0) {
      const competitorInserts = knownCompetitors
        .filter((name: string) => name && name.trim().length > 0)
        .map((competitorName: string) => ({
          brand_id: newBrand.id,
          account_id: account_id,
          competitor_name: competitorName.trim(),
          competitor_domain: null,
          competitor_category: null,
          is_direct_competitor: true,
          competitive_threat_level: 'medium' as const,
          mention_frequency: 0,
          avg_sentiment: 0,
          avg_position: 0
        }))

      if (competitorInserts.length > 0) {
        const { error: competitorsError } = await supabase
          .from('competitors')
          .insert(competitorInserts)

        if (competitorsError) {
          console.error('Error inserting competitors:', competitorsError)
          // Don't fail brand creation if competitors insertion fails
        } else {
          console.log(`✅ Inserted ${competitorInserts.length} competitors for brand ${newBrand.id}`)
        }
      }
    }

    // Create prompt_topics for each brand topic so they appear in the prompts page
    if (brandTopics && brandTopics.length > 0) {
      const topicsToInsert = brandTopics
        .filter((topic: string) => topic && topic.trim().length > 0)
        .map((topic: string, index: number) => {
          // Generate slug from topic name
          const topicSlug = topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          return {
            brand_id: newBrand.id,
            account_id: account_id, // Required for RLS policy
            name: topic.trim(),
            slug: topicSlug || `topic-${index}`,
            description: `Topic: ${topic.trim()}`,
            sort_order: index,
            is_active: true
          }
        })

      if (topicsToInsert.length > 0) {
        const { error: topicsError } = await supabase
          .from('prompt_topics')
          .insert(topicsToInsert)

        if (topicsError) {
          console.error('Error creating prompt topics:', topicsError)
          // Don't fail brand creation if topics fail - just log it
        }
      }
    }

    // Return brand with workspace information
    const brandWithWorkspace = {
      ...newBrand,
      workspaces: [newWorkspace]
    }

    return NextResponse.json({
      success: true,
      data: brandWithWorkspace
    })

  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}