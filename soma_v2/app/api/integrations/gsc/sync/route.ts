/**
 * GSC Sync API
 * 
 * Triggers a sync of GSC performance data for a brand
 */

import { NextRequest, NextResponse } from 'next/server'
import { gscOAuthService } from '@/lib/services/gsc-oauth-service'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    await gscOAuthService.syncPerformanceData(brand_id)

    return NextResponse.json({ success: true, message: 'Data synced successfully' })

  } catch (error) {
    console.error('GSC sync error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync data'
    
    // Provide user-friendly error messages for common issues
    if (errorMessage.includes('sufficient permission')) {
      return NextResponse.json({ 
        error: 'Permission denied. Please ensure your Google account has Owner or Full access to this Search Console property.',
        details: 'Go to Search Console → Settings → Users and permissions to check your access level.'
      }, { status: 403 })
    }
    
    if (errorMessage.includes('API has not been used') || errorMessage.includes('is disabled')) {
      return NextResponse.json({ 
        error: 'Search Console API is not enabled for this Google Cloud project.',
        details: 'Please enable the Search Console API in Google Cloud Console.'
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
