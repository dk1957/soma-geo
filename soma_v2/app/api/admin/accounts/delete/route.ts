import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email } = guard

    const { accountId, confirmName } = await request.json()
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verify account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Safety: require the account name to be confirmed
    if (confirmName !== account.name) {
      return NextResponse.json({ error: 'Account name confirmation does not match' }, { status: 400 })
    }

    // 2. Get all brand IDs for storage cleanup
    const { data: brands } = await supabase
      .from('brands')
      .select('id, name')
      .eq('account_id', accountId)

    const brandIds = (brands || []).map(b => b.id)

    // 3. Clean up storage files before cascade delete removes the DB records
    let storageFilesDeleted = 0
    for (const brandId of brandIds) {
      try {
        // Get storage paths for this brand
        const { data: responseFiles } = await supabase
          .from('llm_response_files')
          .select('storage_path')
          .eq('brand_id', brandId)

        if (responseFiles && responseFiles.length > 0) {
          const paths = responseFiles.map(f => f.storage_path).filter(Boolean)
          for (let i = 0; i < paths.length; i += 100) {
            const batch = paths.slice(i, i + 100)
            await supabase.storage.from('llm-responses').remove(batch)
            storageFilesDeleted += batch.length
          }
        }

        // Also clean up any folder-based storage
        const folder = `${accountId}/${brandId}`
        const { data: folderContents } = await supabase.storage
          .from('llm-responses')
          .list(folder, { limit: 1000 })

        if (folderContents && folderContents.length > 0) {
          const allPaths: string[] = []
          for (const item of folderContents) {
            const subPath = `${folder}/${item.name}`
            const { data: subContents } = await supabase.storage
              .from('llm-responses')
              .list(subPath, { limit: 1000 })

            if (subContents && subContents.length > 0) {
              for (const sub of subContents) {
                allPaths.push(`${subPath}/${sub.name}`)
              }
            } else {
              allPaths.push(subPath)
            }
          }

          for (let i = 0; i < allPaths.length; i += 100) {
            const batch = allPaths.slice(i, i + 100)
            await supabase.storage.from('llm-responses').remove(batch)
            storageFilesDeleted += batch.length
          }
        }
      } catch (storageErr) {
        console.error(`[Admin Delete Account] Storage cleanup error for brand ${brandId}:`, storageErr)
        // Continue — storage cleanup is best effort
      }
    }

    // 4. Manually delete tables that may not have ON DELETE CASCADE via account
    //    (e.g. run_responses reference run_id, not account_id directly)
    for (const brandId of brandIds) {
      // llm_response_files → brand_id  
      await supabase.from('llm_response_files').delete().eq('brand_id', brandId)

      // Get run IDs for this brand
      const { data: brandSims } = await supabase
        .from('runs')
        .select('id')
        .eq('brand_id', brandId)

      if (brandSims && brandSims.length > 0) {
        const simIds = brandSims.map(s => s.id)
        // Delete response files in batches
        for (let i = 0; i < simIds.length; i += 50) {
          const batch = simIds.slice(i, i + 50)
          await supabase.from('llm_response_files').delete().in('run_id', batch)
        }
      }

      // runs → brand_id
      await supabase.from('runs').delete().eq('brand_id', brandId)
      // user_prompts → brand_id
      await supabase.from('user_prompts').delete().eq('brand_id', brandId)
    }

    // Account-level prompts
    await supabase.from('user_prompts').delete().eq('account_id', accountId)

    // 5. Delete the account — CASCADE handles: account_users, brands, workspaces,
    //    workspace_users, account_subscriptions, account_usage, brand_managers, etc.
    const { error: deleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      console.error('[Admin Delete Account] Error deleting account:', deleteError)
      return NextResponse.json({ error: `Failed to delete account: ${deleteError.message}` }, { status: 500 })
    }

    console.log(`[Admin Delete Account] Successfully deleted account "${account.name}" (${accountId}) with ${brandIds.length} brands`)

    await logAdminAction({
      action: 'account_delete',
      adminEmail: email,
      targetId: accountId,
      targetType: 'account',
      metadata: {
        accountName: account.name,
        brandsDeleted: brandIds.length,
        brandNames: (brands || []).map(b => b.name),
        storageFilesDeleted,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Account "${account.name}" and all associated data has been permanently deleted`,
      deleted: {
        accountId,
        accountName: account.name,
        brands: brandIds.length,
        storageFiles: storageFilesDeleted,
      },
    })
  } catch (error) {
    console.error('[Admin Delete Account] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
