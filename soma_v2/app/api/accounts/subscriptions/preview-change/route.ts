// ============================================================================
// API Route: Preview Subscription Change
// GET /api/dashboard/subscriptions/preview-change
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { previewSubscriptionChange } from '@/lib/services/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const newPlanSlug = searchParams.get('new_plan');
    
    if (!accountId || !newPlanSlug) {
      return NextResponse.json(
        { error: 'account_id and new_plan required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to this account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', accountId)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single();
    
    if (!accountUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const preview = await previewSubscriptionChange(accountId, newPlanSlug);
    
    if (!preview) {
      return NextResponse.json(
        { error: 'Unable to generate preview' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error previewing subscription change:', error);
    return NextResponse.json(
      { error: 'Failed to preview subscription change' },
      { status: 500 }
    );
  }
}
