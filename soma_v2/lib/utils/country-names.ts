// Utility function to convert country codes to full country names
// NOTE: This is now deprecated in favor of the database-driven countries service
// Use countriesService or useCountries hook instead for consistent data

export const COUNTRY_CODE_TO_NAME_MAP: Record<string, string> = {
  // Africa
  'za': 'South Africa',
  'ng': 'Nigeria',
  'ke': 'Kenya',
  'eg': 'Egypt',
  'ma': 'Morocco',
  'gh': 'Ghana',
  'et': 'Ethiopia',
  'tz': 'Tanzania',
  'ug': 'Uganda',
  'dz': 'Algeria',
  'tn': 'Tunisia',
  'zw': 'Zimbabwe',
  'bw': 'Botswana',
  'na': 'Namibia',
  'rw': 'Rwanda',
  'zm': 'Zambia',
  'ao': 'Angola',
  'mz': 'Mozambique',
  'mg': 'Madagascar',
  'cm': 'Cameroon',
  'ci': 'Ivory Coast',
  'sn': 'Senegal',
  'ml': 'Mali',
  'bf': 'Burkina Faso',
  'ne': 'Niger',
  'td': 'Chad',
  'ly': 'Libya',
  'sd': 'Sudan',
  'cd': 'DR Congo',

  // Middle East
  'ae': 'UAE',
  'sa': 'Saudi Arabia',
  'qa': 'Qatar',
  'kw': 'Kuwait',
  'bh': 'Bahrain',
  'om': 'Oman',
  'jo': 'Jordan',
  'lb': 'Lebanon',
  'sy': 'Syria',
  'iq': 'Iraq',
  'ir': 'Iran',
  'tr': 'Turkey',
  'il': 'Israel',
  'ps': 'Palestine',

  // Major World Countries
  'us': 'United States',
  'uk': 'United Kingdom',
  'de': 'Germany',
  'fr': 'France',
  'it': 'Italy',
  'es': 'Spain',
  'nl': 'Netherlands',
  'ch': 'Switzerland',
  'ca': 'Canada',
  'au': 'Australia',
  'jp': 'Japan',
  'cn': 'China',
  'in': 'India',
  'br': 'Brazil',
  'mx': 'Mexico',
  'ru': 'Russia',
  'kr': 'South Korea',
  'sg': 'Singapore',
  'se': 'Sweden',
  'no': 'Norway',
  'dk': 'Denmark',
  'fi': 'Finland',
  'be': 'Belgium',
  'at': 'Austria',
  'pt': 'Portugal',
  'ie': 'Ireland',
  'nz': 'New Zealand',
}

/**
 * Converts a single country code to full country name
 * @param countryCode - Two-letter country code (e.g., 'za', 'ng')
 * @returns Full country name (e.g., 'South Africa', 'Nigeria')
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_CODE_TO_NAME_MAP[countryCode.toLowerCase()] || countryCode.toUpperCase()
}

/**
 * Converts an array of country codes to full country names and joins them
 * @param countryCodes - Array of two-letter country codes
 * @param separator - String to join country names with (default: ', ')
 * @returns Joined string of full country names
 */
export function getCountryNamesJoined(countryCodes: string[], separator: string = ', '): string {
  return countryCodes.map(code => getCountryName(code)).join(separator)
}

/**
 * Converts an array of country codes to full country names
 * @param countryCodes - Array of two-letter country codes
 * @returns Array of full country names
 */
export function getCountryNames(countryCodes: string[]): string[] {
  return countryCodes.map(code => getCountryName(code))
}