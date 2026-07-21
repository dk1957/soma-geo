/**
 * @deprecated This route handles Supabase OAuth success redirect.
 * With Clerk migration, authentication is handled by Clerk's middleware and SignIn/SignUp components.
 * This route is kept for backwards compatibility during the migration period.
 * 
 * NOTE: This uses Supabase auth internally and may not work correctly with Clerk-authenticated users.
 * For new implementations, use Clerk's authentication flow instead.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

// Check user status to determine appropriate redirect
async function checkUserRedirect(supabase: any, userId: string): Promise<string> {
  try {
    // Check if user has an account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', userId)

    // Take the first account if multiple exist
    const account = accounts && accounts.length > 0 ? accounts[0] : null

    if (accountError || !account) {
      return '/onboarding'
    }

    // Check if user has a brand
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('account_id', account.id)
      .limit(1)

    if (brandError || !brands || brands.length === 0) {
      return '/onboarding'
    }

        // Check onboarding completion status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed_at, onboarding_status')
      .eq('user_id', userId)
      .single();

    // Check if user has generated any reports (legacy table — may not exist)
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

    console.log('🔍 Auth success onboarding check:', {
      userId,
      profile,
      profileError: profileError?.message,
      profileStatus: profile?.onboarding_status,
      profileCompletedAt: profile?.onboarding_completed_at,
      hasAuditResults: hasGeneratedReport
    })

    // Onboarding completion is based on report generation
    const hasCompletedStatus = profile?.onboarding_status === 'completed'
    const hasCompletedTimestamp = profile?.onboarding_completed_at !== null
    const hasCompleted = hasCompletedStatus && hasCompletedTimestamp
    
    if (!hasCompleted) {
      if (hasGeneratedReport) {
        // User has generated report but onboarding not marked complete - send to dashboard
        console.log('🔄 Auth success: user has reports but onboarding incomplete - sending to dashboard')
        return '/dashboard'
      } else {
        // User needs to generate report - send to onboarding
        console.log('🔄 Auth success: sending to onboarding - needs to generate first report')
        return '/onboarding'
      }
    }

    console.log('✅ Auth success: user has completed onboarding, sending to dashboard')
    return '/dashboard'

  } catch (error) {
    console.error('Error checking user status:', error)
    return '/onboarding'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedNext = searchParams.get('next')

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Determine the appropriate redirect based on user's actual status
      const redirectPath = await checkUserRedirect(supabase, user.id)
      
      console.log('✅ Auth success: checking user status', {
        userId: user.id,
        requestedNext,
        determinedRedirect: redirectPath
      })

      // Only allow dashboard access if user has completed onboarding
      if (requestedNext === '/dashboard' && redirectPath === '/onboarding') {
        console.log('🔄 Auth success: user requested dashboard but needs onboarding first')
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Use the determined redirect path, but prefer requestedNext if user is cleared for dashboard
      let finalRedirect = redirectPath
      if (redirectPath === '/dashboard' && requestedNext) {
        finalRedirect = requestedNext
      }

      console.log('✅ Auth success: redirecting authenticated user to:', finalRedirect)
      return NextResponse.redirect(new URL(finalRedirect, request.url))
    } else {
      console.log('❌ Auth success: no user found, redirecting to signin')
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  } catch (error) {
    console.error('❌ Auth success error:', error)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
}