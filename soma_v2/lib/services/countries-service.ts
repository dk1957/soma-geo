// Countries service for consistent country data management across the app

import { createClient } from '@/lib/supabase/server'

export interface Country {
  id: string
  code: string
  name: string
  flag_emoji?: string
  region: string
  sub_region?: string
  is_active: boolean
  sort_order: number
}

export interface CountryOption {
  value: string // country code
  label: string // formatted as "🇿🇦 South Africa"
  region: string
  country: Country // full country data
}

class CountriesService {
  private cache: Country[] | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  /**
   * Get all countries from database with caching
   */
  async getAllCountries(): Promise<Country[]> {
    // Return cached data if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching countries:', error)
      throw new Error(`Failed to fetch countries: ${error.message}`)
    }

    // Update cache
    this.cache = data
    this.cacheExpiry = Date.now() + this.CACHE_DURATION

    return data || []
  }

  /**
   * Get countries formatted as dropdown options
   */
  async getCountryOptions(): Promise<CountryOption[]> {
    const countries = await this.getAllCountries()
    
    return countries.map(country => ({
      value: country.code,
      label: `${country.flag_emoji || ''} ${country.name}`.trim(),
      region: country.region,
      country
    }))
  }

  /**
   * Get country by code
   */
  async getCountryByCode(code: string): Promise<Country | null> {
    const countries = await this.getAllCountries()
    return countries.find(country => country.code.toLowerCase() === code.toLowerCase()) || null
  }

  /**
   * Get country name by code
   */
  async getCountryName(code: string): Promise<string> {
    const country = await this.getCountryByCode(code)
    return country?.name || code.toUpperCase()
  }

  /**
   * Get multiple country names by codes
   */
  async getCountryNames(codes: string[]): Promise<string[]> {
    const countries = await this.getAllCountries()
    const countryMap = new Map(countries.map(country => [country.code.toLowerCase(), country.name]))
    
    return codes.map(code => countryMap.get(code.toLowerCase()) || code.toUpperCase())
  }

  /**
   * Get multiple country names joined by separator
   */
  async getCountryNamesJoined(codes: string[], separator: string = ', '): Promise<string> {
    const names = await this.getCountryNames(codes)
    return names.join(separator)
  }

  /**
   * Get countries grouped by region
   */
  async getCountriesByRegion(): Promise<Record<string, Country[]>> {
    const countries = await this.getAllCountries()
    const grouped: Record<string, Country[]> = {}

    countries.forEach(country => {
      if (!grouped[country.region]) {
        grouped[country.region] = []
      }
      grouped[country.region].push(country)
    })

    return grouped
  }

  /**
   * Clear cache (useful for testing or when countries are updated)
   */
  clearCache(): void {
    this.cache = null
    this.cacheExpiry = 0
  }
}

// Export singleton instance
export const countriesService = new CountriesService()

// Export for server-side usage
export default CountriesService