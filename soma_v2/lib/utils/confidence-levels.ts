/**
 * Utility functions for handling confidence levels and data quality indicators
 */

export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'No data' | 'Error loading data'

export interface FriendlyConfidenceLevel {
  label: string
  description: string
  color: 'red' | 'orange' | 'yellow' | 'green' | 'gray'
  variant: 'destructive' | 'secondary' | 'outline' | 'default'
}

/**
 * Convert confidence level to friendly, user-readable label
 */
export function getFriendlyConfidenceLevel(level: ConfidenceLevel): FriendlyConfidenceLevel {
  switch (level) {
    case 'very_low':
      return {
        label: 'Very Low Visibility',
        description: 'Insufficient data to provide reliable insights',
        color: 'red',
        variant: 'destructive'
      }
    
    case 'low':
      return {
        label: 'Low Visibility',
        description: 'Limited data available, insights may be incomplete',
        color: 'orange',
        variant: 'secondary'
      }
    
    case 'medium':
      return {
        label: 'Medium Visibility',
        description: 'Good data coverage with reliable insights',
        color: 'yellow',
        variant: 'outline'
      }
    
    case 'high':
      return {
        label: 'High Visibility',
        description: 'Excellent data coverage with highly reliable insights',
        color: 'green',
        variant: 'default'
      }
    
    case 'No data':
      return {
        label: 'No Data Available',
        description: 'Analytics data is not yet available',
        color: 'gray',
        variant: 'outline'
      }
    
    case 'Error loading data':
      return {
        label: 'Data Error',
        description: 'Unable to load analytics data',
        color: 'red',
        variant: 'destructive'
      }
    
    default:
      return {
        label: 'Unknown Status',
        description: 'Unable to determine data quality',
        color: 'gray',
        variant: 'outline'
      }
  }
}

/**
 * Get confidence level icon based on the level
 */
export function getConfidenceIcon(level: ConfidenceLevel): string {
  switch (level) {
    case 'very_low':
    case 'low':
      return '🔴'
    case 'medium':
      return '🟡'
    case 'high':
      return '🟢'
    case 'No data':
    case 'Error loading data':
      return '⚪'
    default:
      return '❓'
  }
}

/**
 * Get Tailwind CSS classes for confidence level styling
 */
export function getConfidenceLevelClasses(level: ConfidenceLevel): {
  badgeClasses: string
  textClasses: string
  backgroundClasses: string
} {
  const friendly = getFriendlyConfidenceLevel(level)
  
  switch (friendly.color) {
    case 'red':
      return {
        badgeClasses: 'bg-red-50 text-red-700 border-red-200',
        textClasses: 'text-red-600',
        backgroundClasses: 'bg-red-50 border-red-200'
      }
    
    case 'orange':
      return {
        badgeClasses: 'bg-orange-50 text-orange-700 border-orange-200',
        textClasses: 'text-orange-600',
        backgroundClasses: 'bg-orange-50 border-orange-200'
      }
    
    case 'yellow':
      return {
        badgeClasses: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        textClasses: 'text-yellow-600',
        backgroundClasses: 'bg-yellow-50 border-yellow-200'
      }
    
    case 'green':
      return {
        badgeClasses: 'bg-green-50 text-green-700 border-green-200',
        textClasses: 'text-green-600',
        backgroundClasses: 'bg-green-50 border-green-200'
      }
    
    case 'gray':
    default:
      return {
        badgeClasses: 'bg-gray-50 text-gray-700 border-gray-200',
        textClasses: 'text-gray-600',
        backgroundClasses: 'bg-gray-50 border-gray-200'
      }
  }
}