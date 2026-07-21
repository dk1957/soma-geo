import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import { cookies } from 'next/headers'

// Get ghost session for impersonation
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email: userEmail } = guard

    const body = await request.json()
    const { accountId, brandId } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const adminSupabase = createServiceClient()

    // Verify the account exists
    const { data: account, error: accountError } = await adminSupabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get the first brand if not specified
    let targetBrandId = brandId
    if (!targetBrandId) {
      const { data: brands } = await adminSupabase
        .from('brands')
        .select('id')
        .eq('account_id', accountId)
        .limit(1)
      
      targetBrandId = brands?.[0]?.id
    }

    // Set ghost session cookies
    const cookieStore = await cookies()
    
    // Store admin's original session for return
    cookieStore.set('admin_ghost_original_user', guard.user.clerkUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    cookieStore.set('admin_ghost_account_id', accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    if (targetBrandId) {
      cookieStore.set('admin_ghost_brand_id', targetBrandId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 // 1 hour
      })
    }

    cookieStore.set('admin_is_ghosting', 'true', {
      httpOnly: false, // Allow client-side access for UI indicator
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    // Log the ghost session
    console.log(`[ADMIN] Ghost session started: Admin ${userEmail} -> Account ${account.name} (${accountId})`)
    await logAdminAction({ action: 'ghost_session_start', adminEmail: userEmail, targetId: accountId, targetType: 'account', metadata: { accountName: account.name, brandId: targetBrandId } })

    return NextResponse.json({
      success: true,
      message: `Ghost session started for ${account.name}`,
      account: {
        id: account.id,
        name: account.name
      },
      brandId: targetBrandId,
      redirectUrl: targetBrandId 
        ? `/dashboard?brand=${targetBrandId}` 
        : '/dashboard'
    })

  } catch (error) {
    console.error('Admin ghost session error:', error)
    return NextResponse.json({
      error: 'Failed to start ghost session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// End ghost session
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email: userEmail } = guard

    const cookieStore = await cookies()
    
    // Clear ghost session cookies
    cookieStore.delete('admin_ghost_original_user')
    cookieStore.delete('admin_ghost_account_id')
    cookieStore.delete('admin_ghost_brand_id')
    cookieStore.delete('admin_is_ghosting')

    console.log(`[ADMIN] Ghost session ended: Admin ${userEmail}`)
    await logAdminAction({ action: 'ghost_session_end', adminEmail: userEmail })

    return NextResponse.json({
      success: true,
      message: 'Ghost session ended',
      redirectUrl: '/admin'
    })

  } catch (error) {
    console.error('Admin end ghost session error:', error)
    return NextResponse.json({
      error: 'Failed to end ghost session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
