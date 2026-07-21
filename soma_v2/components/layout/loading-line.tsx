"use client"

import { useNavigation } from "@/lib/contexts/navigation-context"
import { cn } from "@/lib/utils"

export function LoadingLine() {
  const { isNavigating } = useNavigation()

  return (
    <div className="fixed top-[57px] left-0 right-0 z-50 h-1">
      <div 
        className={cn(
          "h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-200 ease-out transform-gpu",
          isNavigating 
            ? "opacity-100 animate-loading-progress" 
            : "opacity-0"
        )}
        style={{
          transformOrigin: 'left center',
        }}
      />
      <style jsx>{`
        @keyframes loading-progress {
          0% { 
            transform: scaleX(0);
          }
          30% { 
            transform: scaleX(0.4);
          }
          60% { 
            transform: scaleX(0.7);
          }
          80% { 
            transform: scaleX(0.85);
          }
          95% { 
            transform: scaleX(0.95);
          }
          100% { 
            transform: scaleX(1);
          }
        }
        
        .animate-loading-progress {
          animation: loading-progress 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }
      `}</style>
    </div>
  )
}