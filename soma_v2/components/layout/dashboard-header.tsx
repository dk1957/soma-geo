"use client"

import { BrandSelector } from "@/components/layout/brand-selector"
import { RunControl } from "@/components/layout/run-control"
import { HelpGuide } from "@/components/layout/help-guide"
import { NotificationBell } from "@/components/layout/notification-bell"
import { useBrand } from "@/lib/contexts/brand-context"

interface DashboardHeaderProps {
  onDataRefresh?: () => void
}

export function DashboardHeader({ onDataRefresh }: DashboardHeaderProps) {
  const { currentBrand, currentAccount } = useBrand()
  
  return (
    <header className="sticky top-0 z-50 flex items-center justify-end px-4 lg:px-6 py-[14px] bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Right side - Notifications, Run Control (admin only), Help and Brand Selector */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Notification Bell */}
        <NotificationBell 
          brandId={currentBrand?.id} 
          accountId={currentAccount?.id}
        />

        {/* Run Control - Shows only for admins or in development */}
        <RunControl onDataRefresh={onDataRefresh} />

        {/* Help Guide */}
        <HelpGuide />

        {/* Brand Selector */}
        <BrandSelector />
      </div>
    </header>
  )
}