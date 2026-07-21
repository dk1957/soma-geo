"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface InteractiveButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loadingText?: string
  successText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function InteractiveButton({
  children,
  onClick,
  loadingText = "Loading...",
  successText,
  variant = "default",
  size = "default",
  className,
  disabled,
}: InteractiveButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)

    if (successText) {
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 2000)
    }

    onClick?.()
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={disabled || isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : isSuccess ? successText : children}
    </Button>
  )
}
