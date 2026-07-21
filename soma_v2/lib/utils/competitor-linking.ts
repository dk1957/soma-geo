import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-create a brand entry for a competitor and return the linked_brand_id.
 * If a brand with the same name already exists in the account, links to it instead.
 * Returns the linked_brand_id or null if creation failed.
 */
export async function getOrCreateCompetitorBrand(
  supabase: SupabaseClient,
  accountId: string,
  competitorName: string,
  competitorDomain?: string | null,
  primaryBrandId?: string
): Promise<string | null> {
  try {
    // Check if a brand entry already exists with the same name in this account
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('account_id', accountId)
      .ilike('name', competitorName.trim())
      .limit(1)
      .single()

    if (existingBrand) {
      return existingBrand.id
    }

    // Get the primary brand's category to satisfy the check_brand_has_category constraint
    let brandCategory = 'general'
    if (primaryBrandId) {
      const { data: primaryBrand } = await supabase
        .from('brands')
        .select('brand_category')
        .eq('id', primaryBrandId)
        .single()
      if (primaryBrand?.brand_category) {
        brandCategory = primaryBrand.brand_category
      }
    }

    // Create a brand entry for this competitor
    const slug = competitorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: newBrand, error } = await supabase
      .from('brands')
      .insert({
        account_id: accountId,
        name: competitorName.trim(),
        slug: `${slug}-competitor`,
        brand_type: 'client',
        brand_category: brandCategory,
        primary_domain: competitorDomain || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error || !newBrand) {
      console.warn(`[competitor-linking] Failed to create brand for "${competitorName}":`, error?.message)
      return null
    }

    console.log(`[competitor-linking] Created brand entry for competitor "${competitorName}" → ${newBrand.id}`)
    return newBrand.id
  } catch (err) {
    console.warn(`[competitor-linking] Error linking competitor "${competitorName}":`, err)
    return null
  }
}

/**
 * Auto-link multiple competitors after insertion.
 * Call this after inserting competitors to create brand entries for each.
 */
export async function linkCompetitorsAfterInsert(
  supabase: SupabaseClient,
  accountId: string,
  brandId: string,
  competitorNames: string[],
  competitorDomain?: string | null
): Promise<void> {
  // Get all freshly inserted competitors that need linking
  const { data: unlinked } = await supabase
    .from('competitors')
    .select('id, competitor_name, competitor_domain')
    .eq('brand_id', brandId)
    .is('linked_brand_id', null)
    .in('competitor_name', competitorNames)

  if (!unlinked || unlinked.length === 0) return

  for (const comp of unlinked) {
    const linkedBrandId = await getOrCreateCompetitorBrand(
      supabase,
      accountId,
      comp.competitor_name,
      comp.competitor_domain,
      brandId
    )

    if (linkedBrandId) {
      await supabase
        .from('competitors')
        .update({ linked_brand_id: linkedBrandId })
        .eq('id', comp.id)
    }
  }
}
