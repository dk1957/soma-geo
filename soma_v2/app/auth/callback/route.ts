/**
 * @deprecated This route handles Supabase OAuth callback flow.
 * With Clerk migration, authentication is handled by Clerk's middleware and SignIn/SignUp components.
 * This route is kept for backwards compatibility during the migration period.
 * 
 * NOTE: This uses Supabase auth internally and may not work correctly with Clerk-authenticated users.
 * For new implementations, use Clerk's authentication flow instead.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

// Simple user status checker
async function checkUserStatusOnServer(supabase: any, userId: string) {
  try {
    // Check if user has an account (either as owner OR member)
    // First check ownership
    const { data: ownedAccounts, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)

    // Then check membership
    const { data: memberAccounts, error: memberError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)

    const hasAccount = (ownedAccounts && ownedAccounts.length > 0) || (memberAccounts && memberAccounts.length > 0)

    if (!hasAccount) {
      return { redirect: '/onboarding', reason: 'no_account' }
    }

    // If user is a member, they inherit the brand from the account
    // So we just need to check if the account has brands
    let accountId = ownedAccounts?.[0]?.id || memberAccounts?.[0]?.account_id
    
    if (accountId) {
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('account_id', accountId)
        .limit(1)

      if (brandError || !brands || brands.length === 0) {
        // If invited user joins an account with no brands, they might need to create one
        // But usually invited users join established accounts
        return { redirect: '/onboarding', reason: 'no_brand' }
      }
    }

    // Check onboarding completion status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed_at, onboarding_status')
      .eq('user_id', userId)
      .single();

    // Check if user has generated any reports (audit_results — legacy table, may not exist)
    let hasGeneratedReport = false
    try {
      const { data: auditResults, error: auditError } = await supabase
        .from('audit_results')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
      hasGeneratedReport = !auditError && !!auditResults && auditResults.length > 0
    } catch {
      // Table may not exist — ignore
    }

    console.log('🔍 Auth callback onboarding check:', {
      userId,
      profile,
      profileError: profileError?.message,
      profileStatus: profile?.onboarding_status,
      profileCompletedAt: profile?.onboarding_completed_at,
      hasAuditResults: hasGeneratedReport
    })

    // Onboarding completion is based on report generation, not just account+brand setup
    const hasCompletedStatus = profile?.onboarding_status === 'completed'
    const hasCompletedTimestamp = profile?.onboarding_completed_at !== null
    const hasCompleted = hasCompletedStatus && hasCompletedTimestamp
    
    // Allow users with account+brand but no report to proceed to onboarding
    if (!hasCompleted) {
      if (hasGeneratedReport) {
        // User has generated report but onboarding not marked complete - send to dashboard
        console.log('🔄 Auth callback: user has reports but onboarding incomplete - sending to dashboard')
        return { redirect: '/dashboard', reason: 'has_reports_incomplete_onboarding' }
      } else {
        // User needs to generate report - send to onboarding
        console.log('🔄 Auth callback: sending to onboarding - needs to generate first report')
        return { redirect: '/onboarding', reason: 'needs_first_report' }
      }
    }

    console.log('✅ Auth callback: user has completed onboarding, sending to dashboard')
    return { redirect: '/dashboard', reason: 'authenticated_completed_user' }

  } catch (error) {
    console.error('Error checking user status:', error)
    return { redirect: '/onboarding', reason: 'error_fallback' }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next')
  const returnTo = searchParams.get('return_to')
  // Direct invitation token from magic link flow
  const directInvitationToken = searchParams.get('invitation_token')

  console.log('🔍 Auth callback received:', {
    hasCode: !!code,
    hasError: !!error,
    origin,
    next,
    returnTo,
    directInvitationToken,
    timestamp: new Date().toISOString()
  })

  // Extract invitation token from return_to URL OR use direct token from magic link
  let invitationToken = directInvitationToken
  if (!invitationToken) {
    const inviteTokenMatch = returnTo?.match(/\/invite\/([a-f0-9-]+)/)
    invitationToken = inviteTokenMatch ? inviteTokenMatch[1] : null
  }
  
  if (invitationToken) {
    console.log('🎫 Invitation token detected:', invitationToken, directInvitationToken ? '(from magic link)' : '(from OAuth)')
  }

  // Handle OAuth provider errors
  if (error) {
    console.error('🚨 OAuth provider error:', { error, errorDescription })
    
    let redirectUrl = `${origin}/signin`
    const errorParams = new URLSearchParams()
    
    // Handle specific error types
    if (error === 'access_denied') {
      errorParams.set('error', 'access_denied')
      errorParams.set('error_description', 'Access was denied. Please try again.')
    } else if (error === 'server_error') {
      errorParams.set('error', 'server_error')  
      errorParams.set('error_description', 'Authentication server error. Please try again.')
    } else {
      errorParams.set('error', error)
      if (errorDescription) {
        errorParams.set('error_description', errorDescription)
      }
    }
    
    redirectUrl += `?${errorParams.toString()}`
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    console.error('❌ No authorization code received')
    return NextResponse.redirect(`${origin}/signin?error=no_code&error_description=${encodeURIComponent('No authorization code received. Please try signing in again.')}`)
  }

  try {
    console.log('🔍 Processing auth callback with code')
    
    const supabase = await createClient()
    
    // Use Supabase's standard code exchange with enhanced error handling
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('💥 Session exchange error:', exchangeError)
      
      let errorMessage = 'Authentication failed. Please try again.'
      let errorCode = 'auth_failed'
      
      // Handle specific Supabase auth errors
      if (exchangeError.message?.includes('flow_state_not_found')) {
        errorCode = 'flow_state_error'
        errorMessage = 'Authentication session expired. Please try signing in again.'
      } else if (exchangeError.message?.includes('invalid_grant')) {
        errorCode = 'invalid_grant'
        errorMessage = 'Invalid authorization code. Please try signing in again.'
      } else if (exchangeError.message?.includes('expired')) {
        errorCode = 'code_expired'
        errorMessage = 'Authorization code expired. Please try signing in again.'
      } else if (exchangeError.message?.includes('both auth code and code verifier should be non-empty')) {
        errorCode = 'pkce_error'
        errorMessage = 'Authentication flow interrupted. Please clear your browser cache and try signing in again.'
      } else if (exchangeError.message?.includes('validation_failed')) {
        errorCode = 'validation_error'
        errorMessage = 'Authentication validation failed. Please try signing in again.'
      }
      
      return NextResponse.redirect(`${origin}/signin?error=${errorCode}&error_description=${encodeURIComponent(errorMessage)}`)
    }
    
    if (!data.user || !data.session) {
      console.error('❌ No user or session data received')
      return NextResponse.redirect(`${origin}/signin?error=auth_failed&error_description=${encodeURIComponent('Authentication incomplete. Please try again.')}`)
    }

    console.log('✅ Successfully authenticated user:', {
      userId: data.user.id,
      email: data.user.email,
      hasSession: !!data.session
    })

    // If user signed up via invitation, auto-accept it and mark as active
    // OAuth/magic link users are immediately active since they're already authenticated
    if (invitationToken && data.user) {
      try {
        console.log('🎯 Auto-accepting invitation:', invitationToken)
        const serviceClient = await import('@/lib/supabase/server').then(m => m.createServiceClient())
        
        const { data: acceptResult, error: acceptError } = await serviceClient
          .rpc('accept_team_invitation', {
            invitation_token: invitationToken,
            accepting_user_uuid: data.user.id,
            mark_active: true  // Magic link/OAuth users are immediately active
          })

        if (acceptError) {
          console.error('❌ Failed to auto-accept invitation:', acceptError)
        } else if (acceptResult?.success) {
          console.log('✅ Invitation auto-accepted! Account ID:', acceptResult.account_id)
          
          // Get the account's brands to ensure they're loaded
          const { data: brands, error: brandsError } = await serviceClient
            .from('brands')
            .select('id, name, slug')
            .eq('account_id', acceptResult.account_id)
            .eq('is_active', true)
          
          if (brandsError) {
            console.error('❌ Failed to load account brands:', brandsError)
          } else {
            console.log('✅ Account has', brands?.length || 0, 'brand(s):', brands?.map(b => b.name).join(', '))
          }
          
          // Redirect to dashboard with account parameter to ensure proper context loading
          const dashboardUrl = brands && brands.length > 0
            ? `${origin}/dashboard?account=${acceptResult.account_id}&brand=${brands[0].id}`
            : `${origin}/dashboard?account=${acceptResult.account_id}`
            
          console.log('🔄 Redirecting invited user to:', dashboardUrl)
          const response = NextResponse.redirect(dashboardUrl)
          response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
          response.headers.set('Pragma', 'no-cache')
          response.headers.set('Expires', '0')
          return response
        }
      } catch (inviteError) {
        console.error('❌ Error auto-accepting invitation:', inviteError)
      }
    }

    // Ensure user profile exists
    try {
      const { error: profileError } = await supabase.rpc('ensure_user_profile', { 
        user_uuid: data.user.id 
      })
      
      if (profileError) {
        console.warn('Profile creation warning:', profileError)
      }
    } catch (profileErr) {
      console.warn('Profile check failed:', profileErr)
    }

    // Verify session persistence
    try {
      const { data: verifySession, error: verifyError } = await supabase.auth.getUser()
      if (verifyError || !verifySession.user) {
        console.warn('⚠️ Session verification failed:', verifyError?.message)
      } else {
        console.log('✅ Session verified for user:', verifySession.user.id)
      }
    } catch (verifyErr) {
      console.warn('Session verification error:', verifyErr)
    }

    // Check if user has pending accepted invitations (email/password signup) and activate them
    try {
      const serviceClient = await import('@/lib/supabase/server').then(m => m.createServiceClient())
      
      // Find any inactive account_users entries for this user (from invitation acceptance)
      const { data: inactiveAccounts, error: checkError } = await serviceClient
        .from('account_users')
        .select('account_id, role')
        .eq('user_id', data.user.id)
        .eq('is_active', false)
      
      if (!checkError && inactiveAccounts && inactiveAccounts.length > 0) {
        console.log('🔍 Found inactive invited user accounts:', inactiveAccounts.length)
        
        // Activate all inactive accounts for this user
        for (const account of inactiveAccounts) {
          const { data: activateResult, error: activateError } = await serviceClient
            .rpc('activate_invited_user', {
              user_uuid: data.user.id,
              account_uuid: account.account_id
            })
          
          if (activateError) {
            console.error('❌ Failed to activate user in account:', account.account_id, activateError)
          } else if (activateResult?.success) {
            console.log('✅ User activated in account:', account.account_id)
            
            // Get the account's brands
            const { data: brands, error: brandsError } = await serviceClient
              .from('brands')
              .select('id, name, slug')
              .eq('account_id', account.account_id)
              .eq('is_active', true)
            
            if (brandsError) {
              console.error('❌ Failed to load account brands:', brandsError)
            } else {
              console.log('✅ Account has', brands?.length || 0, 'brand(s):', brands?.map(b => b.name).join(', '))
            }
            
            // Redirect invited user directly to their organization dashboard with brand parameter
            const dashboardUrl = brands && brands.length > 0
              ? `${origin}/dashboard?account=${account.account_id}&brand=${brands[0].id}`
              : `${origin}/dashboard?account=${account.account_id}`
              
            console.log('🔄 Redirecting activated user to:', dashboardUrl)
            const response = NextResponse.redirect(dashboardUrl)
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
            response.headers.set('Pragma', 'no-cache')
            response.headers.set('Expires', '0')
            return response
          }
        }
      }
    } catch (activateError) {
      console.error('❌ Error checking/activating invited user:', activateError)
    }
    
    // Check user status and redirect appropriately
    const statusResult = await checkUserStatusOnServer(supabase, data.user.id)
    
    console.log('🔄 Redirect decision:', statusResult)
    
    // If return_to is specified, use it as the redirect destination
    let finalRedirect: string
    if (returnTo) {
      finalRedirect = `/auth/success?next=${encodeURIComponent(returnTo)}`
    } else if (next && statusResult.reason === 'authenticated_completed_user') {
      const nextUrl = next.startsWith('/') ? next : '/dashboard'
      finalRedirect = `/auth/success?next=${encodeURIComponent(nextUrl)}`
    } else {
      finalRedirect = `/auth/success?next=${encodeURIComponent(statusResult.redirect)}`
    }
    
    const redirectUrl = `${origin}${finalRedirect}`
    console.log('🚀 Redirecting to success page:', redirectUrl)
    
    // Create a server-side redirect with session cookies properly set
    const response = NextResponse.redirect(redirectUrl)
    
    // Add cache control headers to prevent caching of this redirect
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
      
  } catch (err) {
    console.error('💥 Auth callback error:', err)
    return NextResponse.redirect(`${origin}/signin?error=server_error&error_description=${encodeURIComponent('Authentication failed due to server error. Please try again.')}`)
  }
}
