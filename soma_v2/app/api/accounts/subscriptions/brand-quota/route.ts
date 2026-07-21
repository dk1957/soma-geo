// ============================================================================
// API Route: Get Brand Quota
// GET /api/dashboard/subscriptions/brand-quota
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBrandQuota } from '@/lib/services/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brand_id');
    
    if (!brandId) {
      return NextResponse.json({ error: 'brand_id required' }, { status: 400 });
    }
    
    // Verify user has access to this brand
    const { data: brand } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single();
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single();
    
    if (!accountUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const quota = await getBrandQuota(brandId);
    
    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      quota,
    });
  } catch (error) {
    console.error('Error fetching brand quota:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand quota' },
      { status: 500 }
    );
  }
}
