"use client"

import { useEffect, useRef } from "react"
import { useNavigation } from "@/lib/contexts/navigation-context"
import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { finishNavigation } = useNavigation()
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      previousPathname.current = pathname
      finishNavigation()
    }
  }, [pathname, finishNavigation])

  return <>{children}</>
}