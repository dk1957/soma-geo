"use client"

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

interface NavigationContextType {
  isNavigating: boolean
  setIsNavigating: (loading: boolean) => void
  startNavigation: () => void
  finishNavigation: () => void
  notifyPageReady: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationStartTime = useRef<number | null>(null)
  const fallbackTimer = useRef<NodeJS.Timeout | null>(null)

  const startNavigation = useCallback(() => {
    setIsNavigating(true)
    navigationStartTime.current = Date.now()
    
    // Clear any existing fallback timer
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current)
    }
    
    // Fallback: Force finish navigation after 3 seconds to prevent stuck state
    fallbackTimer.current = setTimeout(() => {
      setIsNavigating(false)
      navigationStartTime.current = null
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current)
        fallbackTimer.current = null
      }
    }, 3000)
  }, [])

  const finishNavigation = useCallback(() => {
    setIsNavigating(false)
    navigationStartTime.current = null
    
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current)
      fallbackTimer.current = null
    }
  }, [])

  const notifyPageReady = useCallback(() => {
    finishNavigation()
  }, [finishNavigation])

  return (
    <NavigationContext.Provider value={{
      isNavigating,
      setIsNavigating,
      startNavigation,
      finishNavigation,
      notifyPageReady
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}