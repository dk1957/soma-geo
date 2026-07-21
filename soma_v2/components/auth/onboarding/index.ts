/**
 * Onboarding Components
 * 
 * Modular onboarding wizard components for brand setup flow.
 * Each step is a separate component for better maintainability and testing.
 * 
 * Usage:
 * ```tsx
 * import { 
 *   UserTypeSelection, 
 *   OrganizationDetailsStep,
 *   BrandSetupStep 
 * } from '@/components/auth/onboarding'
 * ```
 */

// Types and Constants
export * from './types'
export * from './constants'

// Utility Components
export { ValidationErrorSummary, FieldError } from './validation-errors'
export { OnboardingStepWrapper } from './onboarding-step-wrapper'

// Step Components
export { UserTypeSelection } from './user-type-selection'
export { OrganizationDetailsStep } from './organization-details-step'
export { BrandCompanyDetailsStep } from './brand-company-details-step'
export { BrandSetupStep } from './brand-setup-step'
export { BusinessContextStep } from './business-context-step'
