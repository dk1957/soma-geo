'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBrand } from '@/lib/contexts/brand-context'

export default function BrandPage({ params }: { params: Promise<{ brandId: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { switchBrand } = useBrand()
  
  useEffect(() => {
    const handleBrandSwitch = async () => {
      const resolvedParams = await params
      
      // Switch to the brand and redirect to dashboard
      if (resolvedParams.brandId) {
        await switchBrand(resolvedParams.brandId)
        
        // Redirect to main dashboard after setting the brand
        router.replace('/dashboard')
      }
    }
    
    handleBrandSwitch()
  }, [params, searchParams, switchBrand, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Switching to brand...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the dashboard.</p>
      </div>
    </div>
  )
}