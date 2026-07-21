import type { ValidationError } from './types'

interface ValidationErrorSummaryProps {
  errors: ValidationError[]
  show: boolean
}

/**
 * ValidationErrorSummary Component
 * 
 * Displays a prominent error summary box with all validation errors.
 * Used across multiple onboarding steps for consistent error display.
 */
export function ValidationErrorSummary({ errors, show }: ValidationErrorSummaryProps) {
  if (!show || errors.length === 0) {
    return null
  }

  return (
    <div className="p-8 bg-red-50 border-2 border-red-200 rounded-2xl mb-12">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-lg font-bold">!</span>
        </div>
        <div>
          <h4 className="font-bold text-red-800 text-xl mb-3">Please fix the following errors:</h4>
          <ul className="text-red-700 space-y-3">
            {errors.map((error, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="font-medium text-lg">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface FieldErrorProps {
  error?: string
  show: boolean
}

/**
 * FieldError Component
 * 
 * Displays an inline error message below a form field.
 */
export function FieldError({ error, show }: FieldErrorProps) {
  if (!show || !error) {
    return null
  }

  return (
    <p className="text-red-500 flex items-center gap-3 font-medium text-lg">
      <span className="text-red-500">⚠</span>
      {error}
    </p>
  )
}
