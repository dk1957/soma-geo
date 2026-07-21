import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Fetch active countries ordered by sort_order and name
    const { data: countries, error } = await supabase
      .from('countries')
      .select('id, code, name, flag_emoji, region, sub_region, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching countries:', error)
      return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      countries: countries || [] 
    })
  } catch (error) {
    console.error('Unexpected error fetching countries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
