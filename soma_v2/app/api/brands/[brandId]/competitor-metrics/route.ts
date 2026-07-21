import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(request: Request) {
  try {
    // Use the project's supabase helper which bypasses RLS
    const supabase = createServiceClient()

    // Extract brandId from the request URL: /api/brands/[brandId]/competitor-metrics
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const brandId = pathParts[3]

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Verify authentication
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate brand access
    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Competitor metrics not yet implemented
    return NextResponse.json(
      { error: 'Competitor metrics are not yet available. This feature is coming soon.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error fetching competitor metrics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
