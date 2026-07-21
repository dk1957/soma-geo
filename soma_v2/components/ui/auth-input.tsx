import * as React from "react"
import { Input } from "./input"

/**
 * AuthInput - A development-safe input component that suppresses hydration warnings
 * caused by third-party scripts (like Google Analytics) adding tracking attributes.
 * 
 * This component uses suppressHydrationWarning only in development to avoid
 * hydration mismatch errors while maintaining proper SSR in production.
 */
function AuthInput(props: React.ComponentProps<typeof Input>) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return (
    <div suppressHydrationWarning={isDevelopment}>
      <Input {...props} />
    </div>
  )
}

export { AuthInput }