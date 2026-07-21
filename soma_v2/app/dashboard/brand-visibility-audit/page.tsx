"use client"

import React from 'react'
import BrandVisibilityAuditReport from '@/components/reports/brand-visibility-audit-report'
import { useBrand } from '@/lib/contexts/brand-context'

export default function BrandVisibilityAuditPage() {
  const { currentBrand, isLoading } = useBrand()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentBrand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">No Brand Selected</h2>
        <p className="text-muted-foreground">Please select a brand to view the visibility audit report.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <BrandVisibilityAuditReport brandId={currentBrand.id} />
    </div>
  )
}
