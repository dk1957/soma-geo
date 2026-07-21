"use client"

import { Label } from "@/components/ui/label"
import { OnboardingInput, OnboardingSelect } from "@/components/ui/onboarding-form-fields"
import { OnboardingStepWrapper } from './onboarding-step-wrapper'
import { FieldError } from './validation-errors'
import type { OnboardingStepProps } from './types'

/**
 * OrganizationDetailsStep Component
 * 
 * Step 2 of onboarding: Collect organization (agency/company) details
 * 
 * Features:
 * - Dynamic labels based on user type (agency vs in-house)
 * - Organization name (required)
 * - Website URL (optional with validation)
 * - Location selection
 * - Field-level error display
 */
export function OrganizationDetailsStep({
  formData,
  onFormDataChange,
  onNext,
  onBack,
  validationErrors = [],
  showValidation = false,
  isFormLocked = false,
  userType,
  countryOptions = []
}: OnboardingStepProps) {
  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message
  }

  return (
    <OnboardingStepWrapper
      title={userType === "agency" ? "Your agency" : "Your company"}
      subtitle={userType === "agency" 
        ? "We'll create your agency workspace — you can add client brands after this" 
        : "This becomes your account name on Soma AI"
      }
      onBack={onBack}
      onNext={onNext}
      backLabel="Back"
      nextLabel={userType === "agency" ? "Next: Your client's company" : "Next: Set up your brand"}
      validationErrors={validationErrors}
      showValidation={showValidation}
      isFormLocked={isFormLocked}
    >
      <div className="space-y-4">
        <Label htmlFor="organizationName" className="text-lg font-bold text-foreground">
          {userType === "agency" ? "Agency name *" : "Company name *"}
        </Label>
        <OnboardingInput
          id="organizationName"
          value={formData.organizationName}
          onChange={(e) => onFormDataChange({ ...formData, organizationName: e.target.value })}
          placeholder={userType === "agency" ? "Your agency name" : "Your company name"}
          hasError={showValidation && !!getFieldError('organizationName')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('organizationName')} show={showValidation} />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="organizationWebsite" className="text-lg font-bold text-foreground">
          {userType === "agency" ? "Agency website" : "Company website"}
        </Label>
        <p className="text-sm text-muted-foreground -mt-2">
          We&apos;ll scan your site to generate smarter monitoring prompts.
        </p>
        <OnboardingInput
          id="organizationWebsite"
          value={formData.organizationWebsite}
          onChange={(e) => onFormDataChange({ ...formData, organizationWebsite: e.target.value })}
          placeholder={userType === "agency" ? "https://youragency.com" : "https://yourcompany.com"}
          hasError={showValidation && !!getFieldError('organizationWebsite')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('organizationWebsite')} show={showValidation} />
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="location" className="text-lg font-bold text-foreground">
          Headquarters
        </Label>
        <OnboardingSelect
          id="location"
          value={formData.location}
          onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
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
