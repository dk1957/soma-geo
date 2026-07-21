// ============================================================================
// API Route: Get Account Subscription
// GET /api/dashboard/subscriptions/current
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getAccountSubscription, getFullSubscriptionDetails } from '@/lib/services/subscription-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Get account_id from query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.json({ error: 'account_id required' }, { status: 400 });
    }
    
    // Verify user has access to this account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', accountId)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single();
    
    if (!accountUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get subscription data
    const [quotas, fullDetails] = await Promise.all([
      getAccountSubscription(accountId),
      getFullSubscriptionDetails(accountId),
    ]);
    
    // Get current brand count
    const { count: currentBrandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_active', true);
    
    // Get brand IDs for this account
    const { data: brandIds } = await supabase
      .from('brands')
      .select('id')
      .eq('account_id', accountId)
      .eq('is_active', true);
    
    const activeBrandIds = brandIds?.map(b => b.id) || [];
    
    // Get total prompts and competitors across all brands
    let totalPromptsCount = 0;
    let totalCompetitorsCount = 0;
    
    if (activeBrandIds.length > 0) {
      const [{ count: promptsCount }, { count: competitorsCount }] = await Promise.all([
        supabase
          .from('user_prompts')
          .select('*', { count: 'exact', head: true })
          .in('brand_id', activeBrandIds),
        supabase
          .from('competitors')
          .select('*', { count: 'exact', head: true })
          .in('brand_id', activeBrandIds)
      ]);
      
      totalPromptsCount = promptsCount || 0;
      totalCompetitorsCount = competitorsCount || 0;
    }
    
    // Enrich quotas with current usage
    const enrichedQuotas = quotas ? {
      ...quotas,
      current_brands_count: currentBrandsCount || 0,
      total_prompts_count: totalPromptsCount,
      total_competitors_count: totalCompetitorsCount,
    } : null;
    
    return NextResponse.json({
      success: true,
      quotas: enrichedQuotas,
      subscription: fullDetails,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
