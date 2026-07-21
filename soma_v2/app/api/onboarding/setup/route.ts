import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const companySetupSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  company_location: z.string().optional(),
  account_type: z.enum(['agency', 'in_house']).default('in_house'),
  brand_name: z.string().min(2, 'Brand name is required'),
  brand_category: z.string().optional(),
  brand_categories: z.array(z.string()).default([]),
  brand_website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')).transform(val => val === '' ? undefined : val), // Keep for backward compatibility
  // Brand company information (for agencies)
  brand_company_name: z.string().optional(),
  brand_company_website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  brand_company_location: z.string().optional(),
  target_markets: z.array(z.string()).default([]),
  products_services: z.string().optional(),
  brand_topics: z.array(z.string()).default([]), // Brand topics for AI visibility monitoring
  business_type: z.enum(['brand', 'business', 'product', 'organization']).default('brand'),
  entity_type: z.enum(['company', 'product', 'service', 'personality', 'organization', 'government', 'campaign', 'location']).default('company'), // Entity type for report language
  business_model: z.enum(['b2b', 'b2c', 'b2b2c', 'marketplace', 'other']).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  target_audience: z.string().optional(),
  primary_value: z.string().optional(),
  business_stage: z.enum(['startup', 'growth', 'established', 'enterprise']).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  known_competitors: z.array(z.string()).default([]),
  region: z.enum(['africa', 'europe', 'middle_east', 'north_america', 'asia_pacific', 'latin_america']).optional(),
  industry: z.string().optional(),
  company_size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = companySetupSchema.parse(body)
    
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    // Get current user
    if (!user?.clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // CRITICAL: Ensure profile exists for this user
    // This is a fallback in case Clerk webhook didn't fire or failed
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, clerk_id, email')
      .eq('clerk_id', user.clerkUserId)
      .maybeSingle()

    if (!existingProfile) {
      console.log('⚠️ Profile does not exist for clerk_id, creating one...')
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          clerk_id: user.clerkUserId,
          email: user.clerkUser?.email || `${user.clerkUserId}@clerk.user`,
          full_name: user.clerkUser?.fullName || null,
          avatar_url: user.clerkUser?.imageUrl || null,
          auth_provider: 'clerk',
          role: 'user',
          onboarding_status: 'in_progress',
          onboarding_step: 1,
          timezone: 'UTC',
          language_preference: 'en'
        })
        .select('id, clerk_id, email')
        .single()

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        )
      }
      
      console.log('✅ Profile created successfully:', newProfile)
    } else {
      console.log('✅ Profile exists for clerk_id:', user.clerkUserId)
    }

    // Check if user already has company setup
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id, name, slug, account_type, is_active')
      .eq('owner_clerk_id', user.clerkUserId)
      .single()

    let account = existingAccount

    // Reactivate account if it was previously deactivated
    if (existingAccount && !existingAccount.is_active) {
      await supabase
        .from('accounts')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existingAccount.id)
      console.log('✅ Reactivated previously deactivated account:', existingAccount.id)
    }

    // If no account exists, create one
    if (!existingAccount) {
      // Create account using database function to bypass RLS policies
      const accountSlug = generateAccountSlug(validatedData.company_name)
      
      const { data: accountResult, error: accountError } = await supabase
        .rpc('create_account_with_owner', {
          p_name: validatedData.company_name,
          p_slug: accountSlug,
          p_account_type: validatedData.account_type,
          p_owner_id: user.clerkUserId,
          p_industry: validatedData.industry,
          p_company_size: validatedData.company_size
        })

      if (accountError || !accountResult || accountResult.error) {
        console.error('Account creation error:', accountError || (accountResult && accountResult.error ? accountResult : 'Unknown error'))
        return NextResponse.json(
          { error: 'Failed to create company account' },
          { status: 500 }
        )
      }

      account = accountResult
    }

    // Ensure account exists at this point
    if (!account) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve account' },
        { status: 500 }
      )
    }

    // Ensure account_users record exists (required for LLM run API)
    const { data: existingAccountUser } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', account.id)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!existingAccountUser) {
      console.log('Creating account_users record for account:', account.id)
      const { error: accountUserError } = await supabase
        .from('account_users')
        .insert({
          account_id: account.id,
          clerk_id: user.clerkUserId,
          role: 'owner',
          is_active: true
        })

      if (accountUserError) {
        console.error('Failed to create account_users record:', accountUserError)
        return NextResponse.json(
          { error: 'Failed to link user to account' },
          { status: 500 }
        )
      } else {
        console.log('Successfully created account_users record')
      }
    } else {
      // Reactivate if previously deactivated
      if (!existingAccountUser.is_active) {
        await supabase
          .from('account_users')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existingAccountUser.id)
        console.log('✅ Reactivated account_users record')
      } else {
        console.log('Account_users record already exists')
      }
    }

    // Check for existing subscription (active or trialing)
    const { data: existingSubscription } = await supabase
      .from('account_subscriptions')
      .select('id')
      .eq('account_id', account.id)
      .in('status', ['active', 'trialing'])
      .single()

    // If no active/trial subscription, create a 14-day free trial on the Growth plan
    if (!existingSubscription) {
      console.log('Creating 14-day trial subscription for account:', account.id)
      
      // Look up the Growth plan dynamically instead of hardcoding
      const { data: growthPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('plan_slug', 'growth')
        .eq('is_active', true)
        .single()
      
      const trialPlanId = growthPlan?.id || 'a34e6cf6-bc46-4519-929c-5f405038d5ce'
      
      const startDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

      const { error: subError } = await supabase
        .from('account_subscriptions')
        .insert({
          account_id: account.id,
          plan_id: trialPlanId,
          status: 'trialing',
          billing_cycle: 'monthly',
          current_period_start: startDate.toISOString(),
          current_period_end: trialEndDate.toISOString(),
          auto_renew: false,
          metadata: {
            created_via: 'onboarding_trial',
            is_trial: true,
            trial_days: 14,
          }
        })

      if (subError) {
        console.error('Failed to create trial subscription:', subError)
        // Don't fail the whole setup, but log it
      } else {
        console.log('Successfully created 14-day trial subscription')
        
        // Log trial started event in subscription history
        await supabase.from('subscription_history').insert({
          account_id: account.id,
          event_type: 'trial_started',
          new_plan_id: trialPlanId,
          new_status: 'trialing',
          event_data: { 
            created_via: 'onboarding',
            trial_days: 14,
            triggered_by: user.clerkUserId,
          },
          triggered_by: user.clerkUserId,
        }).then(() => {}).catch(e => console.warn('Failed to log trial event:', e))
      }
    }

    // Detect region from IP if not provided
    let detectedRegion = validatedData.region
    if (!detectedRegion) {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
      detectedRegion = await detectRegionFromIP(ip || '') as typeof validatedData.region
    }

    // Update user profile with region
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        region: detectedRegion,
        preferences: {
          company_size: validatedData.company_size,
          industry: validatedData.industry,
        },
      })
      .eq('clerk_id', user.clerkUserId)

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError)
    }

    // Check if brand with same name already exists in this account
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id, name, slug, is_active')
      .eq('account_id', account.id)
      .ilike('name', validatedData.brand_name)
      .single()

    if (existingBrand) {
      // Reactivate brand if previously deactivated
      if (!existingBrand.is_active) {
        await supabase
          .from('brands')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existingBrand.id)
        console.log('✅ Reactivated previously deactivated brand:', existingBrand.id)
      }

      // Fetch the workspace for the existing brand
      const { data: existingWorkspace } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .eq('brand_id', existingBrand.id)
        .single()
      
      return NextResponse.json({
        message: 'Brand already exists',
        account: {
          id: account.id,
          name: account.name,
          slug: account.slug,
        },
        brand: {
          id: existingBrand.id,
          name: existingBrand.name,
          slug: existingBrand.slug,
        },
        workspace: existingWorkspace || null,
        existing: true
      })
    }

    // Create default brand with all onboarding data
    const brandSlug = generateBrandSlug(validatedData.brand_name)
    const brandWebsiteUrl = validatedData.brand_website || validatedData.website
    
    // Safely parse domain from URL
    let primaryDomain = ''
    if (brandWebsiteUrl) {
      try {
        primaryDomain = new URL(brandWebsiteUrl).hostname
      } catch (urlError) {
        console.warn('Invalid brand website URL, using empty domain:', brandWebsiteUrl)
      }
    }
    
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        account_id: account.id,
        name: validatedData.brand_name,
        slug: brandSlug,
        brand_type: validatedData.account_type === 'agency' ? 'client' : 'own',
        industry: validatedData.industry,
        primary_domain: primaryDomain,
        // Company information fields (for agencies, this will be the brand's company; for in-house, this will be the same as account)
        company_name: validatedData.account_type === 'agency' ? validatedData.brand_company_name || validatedData.company_name : validatedData.company_name,
        company_website: validatedData.account_type === 'agency' ? validatedData.brand_company_website || validatedData.company_website : validatedData.company_website,
        company_location: validatedData.account_type === 'agency' ? validatedData.brand_company_location || validatedData.company_location : validatedData.company_location,
        // Brand onboarding fields
        brand_category: validatedData.brand_categories?.length > 0 ? validatedData.brand_categories[0] : validatedData.brand_category,
        brand_categories: validatedData.brand_categories,
        brand_website: validatedData.brand_website,
        target_markets: validatedData.target_markets,
        products_services: validatedData.products_services,
        brand_topics: validatedData.brand_topics, // Store brand topics
        business_type: validatedData.business_type,
        entity_type: validatedData.entity_type, // Entity type for report language (company, personality, etc.)
        business_model: validatedData.business_model,
        target_audience: validatedData.target_audience,
        primary_value: validatedData.primary_value,
        business_stage: validatedData.business_stage,
        known_competitors: validatedData.known_competitors,
      })
      .select()
      .single()

    if (brandError) {
      console.error('Brand creation error:', brandError)
      console.error('Brand creation error details:', JSON.stringify(brandError, null, 2))
      console.error('Attempted brand data:', JSON.stringify({
        account_id: account.id,
        name: validatedData.brand_name,
        slug: brandSlug,
        brand_type: validatedData.account_type === 'agency' ? 'client' : 'own',
        industry: validatedData.industry,
        primary_domain: brandWebsiteUrl ? new URL(brandWebsiteUrl).hostname : '',
      }, null, 2))
      return NextResponse.json(
        { error: 'Failed to create brand', details: brandError.message || brandError },
        { status: 500 }
      )
    }

    // Brand ownership is implicit via account_id on the brands table
    // (brand belongs to account, user belongs to account via account_users)

    // Insert known competitors into the competitors table
    if (validatedData.known_competitors && validatedData.known_competitors.length > 0) {
      const competitorInserts = validatedData.known_competitors
        .filter(name => name && name.trim().length > 0)
        .map(competitorName => ({
          brand_id: brand.id,
          account_id: account.id,
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
          console.error('Competitors insertion error:', competitorsError)
          // Don't fail the whole setup if competitors insertion fails
        } else {
          console.log(`✅ Inserted ${competitorInserts.length} competitors for brand ${brand.id}`)
        }
      }
    }

    // Create prompt_topics for each brand topic so they appear in the prompts page
    if (validatedData.brand_topics && validatedData.brand_topics.length > 0) {
      const topicsToInsert = validatedData.brand_topics
        .filter(topic => topic && topic.trim().length > 0)
        .map((topic, index) => {
          const topicSlug = topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          return {
            brand_id: brand.id,
            account_id: account.id, // Required for RLS policy
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
          console.error('Prompt topics insertion error:', topicsError)
          // Don't fail the whole setup if topics insertion fails
        } else {
          console.log(`✅ Inserted ${topicsToInsert.length} prompt topics for brand ${brand.id}`)
        }
      }
    }

    // Create default workspace for the brand
    const workspaceSlug = generateWorkspaceSlug(validatedData.brand_name)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        account_id: account.id,
        brand_id: brand.id,
        name: `${validatedData.brand_name} workspace`, // Use "{Brand Name} workspace" format
        slug: workspaceSlug,
        is_default: true,
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('Workspace creation error:', workspaceError)
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      )
    }

    // Add user to workspace
    const { error: workspaceMembershipError } = await supabase
      .from('workspace_users')
      .insert({
        workspace_id: workspace.id,
        clerk_id: user.clerkUserId,
        role: 'admin',
        joined_at: new Date(),
      })

    if (workspaceMembershipError) {
      console.error('Workspace membership error:', workspaceMembershipError)
    }

    // Create default notification preferences
    await supabase
      .from('notification_preferences')
      .insert({
        clerk_id: user.clerkUserId,
        account_id: account.id,
        brand_id: brand.id,
        event_types: ['citation_drop', 'citation_spike', 'competitor_gain', 'keyword_opportunity'],
        frequency: 'daily',
      })

    // Track usage for analytics
    await supabase
      .from('usage_logs')
      .insert({
        account_id: account.id,
        brand_id: brand.id,
        clerk_id: user.clerkUserId,
        feature: 'onboarding',
        action: 'company_setup',
        metadata: {
          account_type: validatedData.account_type,
          region: detectedRegion,
          company_size: validatedData.company_size,
          industry: validatedData.industry,
        },
      })

    return NextResponse.json({
      message: 'Company setup completed successfully',
      account: {
        id: account.id,
        name: account.name,
        slug: account.slug,
        account_type: account.account_type,
      },
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    })

  } catch (error) {
    console.error('Company setup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to detect region from IP
async function detectRegionFromIP(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return 'north_america' // default
  }

  try {
    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=continentCode`)
    const data = await response.json()
    
    const continentMap: Record<string, string> = {
      'AF': 'africa',
      'EU': 'europe',
      'AS': 'asia_pacific',
      'NA': 'north_america',
      'SA': 'latin_america',
      'OC': 'asia_pacific',
    }

    return continentMap[data.continentCode] || 'north_america'
  } catch (error) {
    console.error('IP detection error:', error)
    return 'north_america'
  }
}

// Helper function to generate account slug
function generateAccountSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

// Helper function to generate brand slug
function generateBrandSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

// Helper function to generate workspace slug
function generateWorkspaceSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}