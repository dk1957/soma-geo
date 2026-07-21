import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email } = guard

    const { brandId } = await request.json()
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verify brand exists and get its account info
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // 2. Get all run IDs for cleanup
    const { data: runs } = await supabase
      .from('runs')
      .select('id')
      .eq('brand_id', brandId)

    const runIds = runs?.map(s => s.id) || []

    // 3. Delete llm_response_files and their storage files
    if (runIds.length > 0) {
      // Get storage paths before deleting records
      const { data: responseFiles } = await supabase
        .from('llm_response_files')
        .select('storage_path')
        .eq('brand_id', brandId)

      // Delete storage files in batches
      if (responseFiles && responseFiles.length > 0) {
        const paths = responseFiles.map(f => f.storage_path).filter(Boolean)
        if (paths.length > 0) {
          // Delete in batches of 100
          for (let i = 0; i < paths.length; i += 100) {
            const batch = paths.slice(i, i + 100)
            await supabase.storage.from('llm-responses').remove(batch)
          }
        }
      }

      // Delete llm_response_files records
      const { error: filesError } = await supabase
        .from('llm_response_files')
        .delete()
        .eq('brand_id', brandId)

      if (filesError) {
        console.error('[Admin Delete Brand] Error deleting llm_response_files:', filesError)
      }

      // Delete runs
      const { error: simsError } = await supabase
        .from('runs')
        .delete()
        .eq('brand_id', brandId)

      if (simsError) {
        console.error('[Admin Delete Brand] Error deleting runs:', simsError)
      }
    }

    // 5. Delete user_prompts
    const { error: promptsError } = await supabase
      .from('user_prompts')
      .delete()
      .eq('brand_id', brandId)

    if (promptsError) {
      console.error('[Admin Delete Brand] Error deleting user_prompts:', promptsError)
    }

    // 6. Also clean up storage folder for this brand
    try {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', brand.account_id)
        .single()

      if (accountData) {
        const brandFolder = `${brand.account_id}/${brandId}`
        const { data: folderContents } = await supabase.storage
          .from('llm-responses')
          .list(brandFolder, { limit: 1000 })

        if (folderContents && folderContents.length > 0) {
          // List and delete all nested files
          const allPaths: string[] = []
          for (const item of folderContents) {
            const subPath = `${brandFolder}/${item.name}`
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

          if (allPaths.length > 0) {
            for (let i = 0; i < allPaths.length; i += 100) {
              await supabase.storage.from('llm-responses').remove(allPaths.slice(i, i + 100))
            }
          }
        }
      }
    } catch (storageErr) {
      console.error('[Admin Delete Brand] Storage cleanup error (non-fatal):', storageErr)
    }

    // 7. Finally delete the brand itself
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)

    if (deleteError) {
      console.error('[Admin Delete Brand] Error deleting brand:', deleteError)
      return NextResponse.json({ error: 'Failed to delete brand record' }, { status: 500 })
    }

    console.log(`[Admin Delete Brand] Successfully deleted brand "${brand.name}" (${brandId}) from account ${brand.account_id}`)
    await logAdminAction({ action: 'brand_delete', adminEmail: email, targetId: brandId, targetType: 'brand', metadata: { brandName: brand.name, accountId: brand.account_id, runsDeleted: runIds.length } })

    return NextResponse.json({
      success: true,
      message: `Brand "${brand.name}" has been permanently deleted`,
      deletedBrandId: brandId,
      deletedRuns: runIds.length
    })
  } catch (error) {
    console.error('[Admin Delete Brand] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
