import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify account exists
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, name, created_at')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // Get brands first (needed for downstream counts)
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .eq('account_id', accountId)

  const brandIds = (brands || []).map(b => b.id)

  // Gather all counts in parallel
  const [
    usersResult,
    workspacesResult,
    subscriptionsResult,
    promptsResult,
    ...brandScopedResults
  ] = await Promise.all([
    supabase.from('account_users').select('user_id, clerk_id, role', { count: 'exact', head: false }).eq('account_id', accountId),
    supabase.from('workspaces').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
    supabase.from('account_subscriptions').select('id, status, plan:subscription_plans(display_name)', { count: 'exact', head: false }).eq('account_id', accountId),
    supabase.from('user_prompts').select('id', { count: 'exact', head: true }).eq('account_id', accountId),
    ...(brandIds.length > 0 ? [
      supabase.from('runs').select('id', { count: 'exact', head: true }).in('brand_id', brandIds),
      supabase.from('llm_response_files').select('id', { count: 'exact', head: true }).in('brand_id', brandIds),
    ] : []),
  ])

  const runCount = brandScopedResults[0]?.count || 0
  const responseFileCount = brandScopedResults[1]?.count || 0

  // Estimate storage files (best effort, non-blocking)
  let storageFileCount = 0
  try {
    for (const brandId of brandIds) {
      const folder = `${accountId}/${brandId}`
      const { data: folderContents } = await supabase.storage
        .from('llm-responses')
        .list(folder, { limit: 1000 })
      if (folderContents) {
        for (const item of folderContents) {
          const { data: subContents } = await supabase.storage
            .from('llm-responses')
            .list(`${folder}/${item.name}`, { limit: 1000 })
          storageFileCount += subContents?.length || 1
        }
      }
    }
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    success: true,
    data: {
      account: { id: account.id, name: account.name, created_at: account.created_at },
      counts: {
        brands: brands?.length || 0,
        members: usersResult.count || 0,
        workspaces: workspacesResult.count || 0,
        subscriptions: subscriptionsResult.count || 0,
        runs: runCount,
        responseFiles: responseFileCount,
        storageFiles: storageFileCount,
        prompts: promptsResult.count || 0,
      },
      brands: (brands || []).map(b => ({ id: b.id, name: b.name })),
      members: (usersResult.data || []).map((u: any) => ({ id: u.user_id || u.clerk_id, role: u.role })),
      subscription: subscriptionsResult.data?.[0] || null,
    },
  })
}
