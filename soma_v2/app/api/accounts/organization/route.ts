import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const organizationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  enhanced_settings: z.object({
    branding: z.object({
      logo_url: z.string().nullable().optional(),
      primary_color: z.string().optional(),
      secondary_color: z.string().optional(),
      custom_domain: z.string().nullable().optional(),
    }).optional(),
    security_policies: z.object({
      enforce_2fa: z.boolean().optional(),
      session_timeout_minutes: z.number().optional(),
      ip_whitelist: z.array(z.string()).optional(),
      allowed_domains: z.array(z.string()).optional(),
      password_policy: z.object({
        min_length: z.number().optional(),
        require_uppercase: z.boolean().optional(),
        require_lowercase: z.boolean().optional(),
        require_numbers: z.boolean().optional(),
        require_symbols: z.boolean().optional(),
        max_age_days: z.number().optional(),
      }).optional(),
    }).optional(),
    integrations: z.object({
      sso_enabled: z.boolean().optional(),
      saml_config: z.any().optional(),
      api_access_enabled: z.boolean().optional(),
      webhook_urls: z.array(z.string()).optional(),
    }).optional(),
    limits: z.object({
      max_users: z.number().optional(),
      max_brands: z.number().optional(),
      max_audits_per_month: z.number().optional(),
      storage_limit_gb: z.number().optional(),
    }).optional(),
  }).optional(),
  billing_contact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    address: z.union([
      z.string().nullable(),
      z.object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().optional(),
        country: z.string().optional()
      })
    ]).optional(),
    tax_id: z.string().nullable().optional(),
  }).optional(),
})

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Get the current user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // First, let's check if the user has an account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1)

    // Check for account_users table
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('*')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .limit(1)

    // If no organization exists, create one for development
    if (!accountUsers || accountUsers.length === 0) {
      // First create an account
      const { data: newAccount, error: createAccountError } = await supabase
        .from('accounts')
        .insert({
          name: 'Demo Organization',
          slug: 'demo-org',
          description: 'A demonstration organization for development',
          account_type: 'enterprise',
          billing_plan: 'professional',
          billing_status: 'active',
          owner_clerk_id: user.clerkUserId,
          enhanced_settings: {
            branding: {
              logo_url: null,
              primary_color: '#0f172a',
              secondary_color: '#64748b',
              custom_domain: null
            },
            security_policies: {
              enforce_2fa: false,
              session_timeout_minutes: 480,
              ip_whitelist: [],
              allowed_domains: [],
              password_policy: {
                min_length: 8,
                require_uppercase: true,
                require_lowercase: true,
                require_numbers: true,
                require_symbols: false,
                max_age_days: 90
              }
            },
            integrations: {
              sso_enabled: false,
              saml_config: null,
              api_access_enabled: true,
              webhook_urls: []
            },
            limits: {
              max_users: 50,
              max_brands: 10,
              max_audits_per_month: 500,
              storage_limit_gb: 100
            }
          },
          billing_contact: {
            name: 'Demo User',
            email: user.clerkUser?.email || user.profile?.email,
            phone: null,
            address: null,
            tax_id: null
          },
          current_usage: {
            users_active: 1,
            brands_active: 2,
            audits_run: 15,
            storage_used_gb: 2.5
          }
        })
        .select()
        .single()

      if (createAccountError) {
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
      }

      // Add user as owner
      const { error: membershipError } = await supabase
        .from('account_users')
        .insert({
          account_id: newAccount.id,
          clerk_id: user.clerkUserId,
          user_id: user.profile?.id,
          role: 'owner',
          is_active: true
        })

      if (membershipError) {
        // Log error but continue - user creation succeeded
      }

      // Transform the data to match frontend expectations
      const transformedAccount = {
        ...newAccount,
        usage_current_period: {
          users_active: newAccount.current_usage?.team_members || 1,
          brands_active: newAccount.current_usage?.brands || 2,
          audits_run: newAccount.current_usage?.audits_this_month || 15,
          storage_used_gb: 2.5
        },
        enhanced_settings: {
          ...newAccount.enhanced_settings,
          limits: newAccount.enhanced_settings?.usage_limits || {
            max_users: 50,
            max_brands: 10,
            max_audits_per_month: 500,
            storage_limit_gb: 100
          }
        },
        organization_details: {
          total_members: 1,
          account_age_days: 0,
          subscription_days_remaining: null,
          is_trial: false,
          features_enabled: newAccount.enhanced_settings?.features_enabled || [],
          integrations_active: newAccount.enhanced_settings?.allowed_integrations?.length || 2
        }
      }

      return NextResponse.json({
        success: true,
        data: transformedAccount
      })
    }

    // Get user's organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts!inner(
          id,
          name,
          slug,
          description,
          account_type,
          billing_plan,
          trial_ends_at,
          billing_status,
          enhanced_settings,
          billing_contact,
          current_usage,
          created_at,
          updated_at
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (membershipError) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (!memberships) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const organization = memberships.accounts as any
    
    // Transform the data to match frontend expectations
    const transformedOrganization = {
      ...organization,
      // Map current_usage to usage_current_period for frontend compatibility
      usage_current_period: {
        users_active: organization.current_usage?.team_members || 1,
        brands_active: organization.current_usage?.brands || 0,
        audits_run: organization.current_usage?.audits_this_month || 0,
        storage_used_gb: organization.current_usage?.storage_used_gb || 0
      },
      // Ensure enhanced_settings has the expected structure
      enhanced_settings: {
        ...organization.enhanced_settings,
        limits: organization.enhanced_settings?.usage_limits || {
          max_users: 10,
          max_brands: 5,
          max_audits_per_month: 100,
          storage_limit_gb: 10
        }
      },
      // Add additional organization details
      organization_details: {
        total_members: organization.current_usage?.team_members || 1,
        account_age_days: Math.floor((new Date().getTime() - new Date(organization.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        subscription_days_remaining: organization.trial_ends_at ? 
          Math.max(0, Math.floor((new Date(organization.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
          null,
        is_trial: organization.billing_status === 'trialing',
        features_enabled: organization.enhanced_settings?.features_enabled || [],
        integrations_active: organization.enhanced_settings?.allowed_integrations?.length || 0
      }
    }
    
    return NextResponse.json({
      success: true,
      data: transformedOrganization
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Get the authenticated user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = organizationUpdateSchema.parse(body)

    // Get user's organization (must be admin or owner)
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .in('role', ['admin', 'owner'])
      .limit(1)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Unauthorized to modify organization' }, { status: 403 })
    }

    // Update the organization
    const { data: updatedOrganization, error: updateError } = await supabase
      .from('accounts')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.account_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    // Log the organization update
    await supabase.rpc('log_account_action', {
      p_account_id: membership.account_id,
      p_user_id: user.profile?.id,
      p_action: 'organization_updated',
      p_resource_type: 'organization',
      p_resource_id: membership.account_id,
      p_details: {
        updated_fields: Object.keys(validatedData),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedOrganization
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}