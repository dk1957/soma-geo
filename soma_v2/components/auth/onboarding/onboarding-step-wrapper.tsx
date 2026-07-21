"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ValidationErrorSummary } from './validation-errors'
import type { ValidationError } from './types'

interface OnboardingStepWrapperProps {
  title: string
  subtitle: string
  children: React.ReactNode
  onBack?: () => void
  onNext: () => void
  backLabel?: string
  nextLabel?: string
  validationErrors?: ValidationError[]
  showValidation?: boolean
  isLoading?: boolean
  isFormLocked?: boolean
}

/**
 * OnboardingStepWrapper Component
 * 
 * Reusable wrapper for onboarding steps with consistent layout.
 * Features:
 * - Consistent header styling
 * - Back button (optional)
 * - Validation error summary
 * - Next button with loading state
 * - Responsive padding and spacing
 */
export function OnboardingStepWrapper({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  validationErrors = [],
  showValidation = false,
  isLoading = false,
  isFormLocked = false
}: OnboardingStepWrapperProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-background border-2 border-border rounded-3xl p-12">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-muted-foreground hover:text-foreground mb-8 font-medium transition-colors text-lg"
          >
            <ArrowLeft className="h-6 w-6 mr-3" />
            {backLabel}
          </button>
        )}
        
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <ValidationErrorSummary 
          errors={validationErrors} 
          show={showValidation} 
        />
        
        <div className="space-y-8">
          {children}
        </div>
        
        <Button 
          onClick={onNext} 
          disabled={isFormLocked || isLoading}
          className="w-full h-12 text-lg font-bold mt-12 rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              Analyzing your brand...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="ml-3 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
