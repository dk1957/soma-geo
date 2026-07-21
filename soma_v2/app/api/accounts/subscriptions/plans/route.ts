// ============================================================================
// API Route: Get Subscription Plans
// GET /api/dashboard/subscriptions/plans
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlans } from '@/lib/services/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const plans = await getSubscriptionPlans();
    
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
