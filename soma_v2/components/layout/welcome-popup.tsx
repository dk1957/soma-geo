'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Sparkles, Clock, TrendingUp } from 'lucide-react'

interface WelcomePopupProps {
  open: boolean
  onClose: () => void
  brandName?: string
}

export function WelcomePopup({ open, onClose, brandName }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md border border-gray-200 shadow-sm p-0 overflow-hidden"
        style={{ background: 'white' }}
      >
        <VisuallyHidden>
          <DialogTitle>Welcome to Your Dashboard</DialogTitle>
        </VisuallyHidden>
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          
          <h2 className="text-2xl font-semibold text-black mb-2">
            Welcome to Your Dashboard
          </h2>
          
          {brandName && (
            <p className="text-sm text-gray-600 mb-4">
              Your AI visibility analysis for <span className="font-medium text-black">{brandName}</span> is being processed
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="px-8 pb-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-black mb-1">
                Analysis in Progress
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your AI visibility responses are being analyzed across multiple models and markets. This typically takes a few hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
              <TrendingUp className="h-4 w-4 text-gray-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-black mb-1">
                Check Back Soon
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Return in a few hours to see your comprehensive visibility report, competitive insights, and optimization recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 pb-8">
          <Button 
            onClick={onClose}
            className="w-full bg-black text-white hover:bg-gray-800 border-0 h-10 text-sm font-medium"
          >
            Explore Dashboard
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            You'll be notified when your analysis is ready
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
