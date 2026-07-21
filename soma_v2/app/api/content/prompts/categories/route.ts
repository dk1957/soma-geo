import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const workspaceId = searchParams.get('workspace_id')

    if (!brandId || !workspaceId) {
      return NextResponse.json({ error: 'Brand ID and Workspace ID are required' }, { status: 400 })
    }

    // Verify user has access to this brand
    const { data: brandAccess, error: accessError } = await supabase
      .from('brand_managers')
      .select('role')
      .eq('brand_id', brandId)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    // Get category statistics via direct query (RPC function not yet in schema)
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('category, id, prompt_performances(visibility_score)')
      .eq('brand_id', brandId)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (promptsError) {
      console.error('Error fetching category stats:', promptsError)
      return NextResponse.json({ error: 'Failed to fetch category data' }, { status: 500 })
    }

    // Manual calculation
    const categoryMap = new Map()
    
    prompts.forEach((prompt: any) => {
      const category = prompt.category || 'general'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          count: 0,
          total_score: 0,
          avg_score: 0
        })
      }
      
      const cat = categoryMap.get(category)
      cat.count++
      
      // Calculate average score from performances
      const performances = prompt.prompt_performances || []
      const avgScore = performances.length > 0
        ? performances.reduce((sum: number, p: any) => sum + (p.visibility_score || 0), 0) / performances.length
        : 0
      cat.total_score += avgScore
    })

    // Finalize averages
    const categories = Array.from(categoryMap.values()).map((cat: any) => ({
      ...cat,
      avg_score: cat.count > 0 ? (cat.total_score / cat.count).toFixed(1) : 0,
      color: getCategoryColor(cat.name)
    }))

    return NextResponse.json({
      success: true,
      data: categories
    })

    // Format the database function results
    const formattedCategories = categoryStats.map((cat: any) => ({
      name: cat.category_name,
      count: cat.prompt_count,
      avg_score: parseFloat(cat.avg_performance || 0).toFixed(1),
      color: getCategoryColor(cat.category_name)
    }))

    return NextResponse.json({
      success: true,
      data: formattedCategories
    })

  } catch (error) {
    console.error('Error in prompts categories GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'product_features': 'bg-blue-100 text-blue-800',
    'infrastructure': 'bg-green-100 text-green-800',
    'safety': 'bg-purple-100 text-purple-800',
    'pricing': 'bg-orange-100 text-orange-800',
    'technology': 'bg-pink-100 text-pink-800',
    'comparison': 'bg-indigo-100 text-indigo-800',
    'general': 'bg-gray-100 text-gray-800'
  }
  return colorMap[category] || 'bg-gray-100 text-gray-800'
}