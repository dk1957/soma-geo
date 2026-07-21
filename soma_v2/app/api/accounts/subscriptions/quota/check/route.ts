// ============================================================================
// API Route: Check Quota
// GET /api/dashboard/subscriptions/quota/check
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import {
  canCreateBrand,
  canAddPrompt,
  canAddCompetitor,
  canUseModelProvider,
} from '@/lib/services/subscription-service';
import type { ModelProvider } from '@/lib/types/subscription';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resource_type'); // 'brand', 'prompt', 'competitor', 'model'
    const accountId = searchParams.get('account_id');
    const brandId = searchParams.get('brand_id');
    const modelProvider = searchParams.get('model_provider') as ModelProvider;
    
    if (!resourceType) {
      return NextResponse.json({ error: 'resource_type required' }, { status: 400 });
    }
    
    let quotaCheck;
    
    switch (resourceType) {
      case 'brand':
        if (!accountId) {
          return NextResponse.json({ error: 'account_id required for brand check' }, { status: 400 });
        }
        quotaCheck = await canCreateBrand(accountId);
        break;
        
      case 'prompt':
        if (!brandId) {
          return NextResponse.json({ error: 'brand_id required for prompt check' }, { status: 400 });
        }
        quotaCheck = await canAddPrompt(brandId);
        break;
        
      case 'competitor':
        if (!brandId) {
          return NextResponse.json({ error: 'brand_id required for competitor check' }, { status: 400 });
        }
        quotaCheck = await canAddCompetitor(brandId);
        break;
        
      case 'model':
        if (!brandId || !modelProvider) {
          return NextResponse.json({ error: 'brand_id and model_provider required for model check' }, { status: 400 });
        }
        quotaCheck = await canUseModelProvider(brandId, modelProvider);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid resource_type' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      quota: quotaCheck,
    });
  } catch (error) {
    console.error('Error checking quota:', error);
    return NextResponse.json(
      { error: 'Failed to check quota' },
      { status: 500 }
    );
  }
}
