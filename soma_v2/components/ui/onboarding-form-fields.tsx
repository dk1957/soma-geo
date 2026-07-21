import * as React from "react"
import { cn } from "@/lib/utils"

// Onboarding-specific styling that matches dropdown field dimensions
const onboardingFieldClasses = "w-full px-6 py-5 border-2 border-border rounded-xl bg-background text-foreground text-xl font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30"

// Enhanced onboarding input with consistent styling
function OnboardingInput({ 
  className, 
  hasError = false, 
  type, 
  ...props 
}: React.ComponentProps<"input"> & { hasError?: boolean }) {
  return (
    <input
      type={type}
      className={cn(
        onboardingFieldClasses,
        hasError && "border-red-300 focus:border-red-500 focus:ring-red-200",
        className
      )}
      {...props}
    />
  )
}

// Enhanced onboarding textarea with consistent styling
function OnboardingTextarea({ 
  className, 
  hasError = false, 
  ...props 
}: React.ComponentProps<"textarea"> & { hasError?: boolean }) {
  return (
    <textarea
      className={cn(
        onboardingFieldClasses,
        "min-h-[120px] resize-vertical",
        hasError && "border-red-300 focus:border-red-500 focus:ring-red-200",
        className
      )}
      {...props}
    />
  )
}

// Enhanced onboarding select with consistent styling
function OnboardingSelect({ 
  className, 
  hasError = false, 
  children,
  ...props 
}: React.ComponentProps<"select"> & { hasError?: boolean }) {
  return (
    <select
      className={cn(
        onboardingFieldClasses,
        "cursor-pointer",
        hasError && "border-red-300 focus:border-red-500 focus:ring-red-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

// Enhanced button for onboarding dropdown trigger with consistent styling
function OnboardingDropdownTrigger({ 
  className, 
  hasError = false, 
  children,
  ...props 
}: React.ComponentProps<"button"> & { hasError?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        onboardingFieldClasses,
        "cursor-pointer flex items-center justify-between",
        hasError && "border-red-300 focus:border-red-500 focus:ring-red-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Utility function to get onboarding field classes for custom components
export const getOnboardingInputClassName = (fieldName?: string, hasError: boolean = false) => {
  return cn(
    onboardingFieldClasses,
    hasError && "border-red-300 focus:border-red-500 focus:ring-red-200"
  )
}

export { 
  OnboardingInput, 
  OnboardingTextarea, 
  OnboardingSelect, 
  OnboardingDropdownTrigger 
}