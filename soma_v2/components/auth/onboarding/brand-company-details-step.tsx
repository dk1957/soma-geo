"use client"

import { Label } from "@/components/ui/label"
import { OnboardingInput, OnboardingSelect } from "@/components/ui/onboarding-form-fields"
import { OnboardingStepWrapper } from './onboarding-step-wrapper'
import { FieldError } from './validation-errors'
import type { OnboardingStepProps } from './types'

/**
 * BrandCompanyDetailsStep Component
 * 
 * Step 3 of onboarding (AGENCY ONLY): Collect client company details
 * 
 * Features:
 * - Brand company name (required)
 * - Website URL (optional with validation)
 * - Location selection
 * - Field-level error display
 * - Only shown for agency accounts
 */
export function BrandCompanyDetailsStep({
  formData,
  onFormDataChange,
  onNext,
  onBack,
  validationErrors = [],
  showValidation = false,
  isFormLocked = false,
  countryOptions = []
}: OnboardingStepProps) {
  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message
  }

  return (
    <OnboardingStepWrapper
      title="Your client's company"
      subtitle="The organization behind the brand you'll be monitoring"
      onBack={onBack}
      onNext={onNext}
      backLabel="Back"
      nextLabel="Next: Set up the brand"
      validationErrors={validationErrors}
      showValidation={showValidation}
      isFormLocked={isFormLocked}
    >
      <div className="space-y-4">
        <Label htmlFor="brandCompanyName" className="text-lg font-bold text-foreground">
          Company name *
        </Label>
        <OnboardingInput
          id="brandCompanyName"
          value={formData.brandCompanyName}
          onChange={(e) => onFormDataChange({ ...formData, brandCompanyName: e.target.value })}
          placeholder="e.g., Acme Corp"
          hasError={showValidation && !!getFieldError('brandCompanyName')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('brandCompanyName')} show={showValidation} />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="brandCompanyWebsite" className="text-lg font-bold text-foreground">
          Company website
        </Label>
        <p className="text-sm text-muted-foreground -mt-2">
          Helps us understand the company and generate better prompts.
        </p>
        <OnboardingInput
          id="brandCompanyWebsite"
          value={formData.brandCompanyWebsite}
          onChange={(e) => onFormDataChange({ ...formData, brandCompanyWebsite: e.target.value })}
          placeholder="https://company.com"
          hasError={showValidation && !!getFieldError('brandCompanyWebsite')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('brandCompanyWebsite')} show={showValidation} />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="brandCompanyLocation" className="text-lg font-bold text-foreground">
          Company headquarters
        </Label>
        <OnboardingSelect
          id="brandCompanyLocation"
          value={formData.brandCompanyLocation}
          onChange={(e) => onFormDataChange({ ...formData, brandCompanyLocation: e.target.value })}
          disabled={isFormLocked}
        >
          <option value="">Select country...</option>
          {countryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </OnboardingSelect>
      </div>
    </OnboardingStepWrapper>
  )
}
