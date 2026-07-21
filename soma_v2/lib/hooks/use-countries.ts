// React hook for accessing countries data on the client side

'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Country, CountryOption } from '@/lib/services/countries-service'

interface UseCountriesReturn {
  countries: Country[]
  countryOptions: CountryOption[]
  isLoading: boolean
  error: string | null
  getCountryByCode: (code: string) => Country | undefined
  getCountryName: (code: string) => string
  getCountryNames: (codes: string[]) => string[]
  getCountryNamesJoined: (codes: string[], separator?: string) => string
}

/**
 * React hook to fetch and manage countries data
 */
export function useCountries(): UseCountriesReturn {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data, error: fetchError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message || fetchError.code || 'Unknown Supabase error')
      }

      setCountries(data || [])
    } catch (err) {
      console.error('Error fetching countries:', err instanceof Error ? err.message : JSON.stringify(err))
      setError(err instanceof Error ? err.message : 'Failed to fetch countries')
      
      // Set fallback countries
      setCountries(getFallbackCountries())
    } finally {
      setIsLoading(false)
    }
  }

  const countryOptions: CountryOption[] = countries.map(country => ({
    value: country.code,
    label: `${country.flag_emoji || ''} ${country.name}`.trim(),
    region: country.region,
    country
  }))

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(country => 
      country.code.toLowerCase() === code.toLowerCase()
    )
  }

  const getCountryName = (code: string): string => {
    const country = getCountryByCode(code)
    return country?.name || code.toUpperCase()
  }

  const getCountryNames = (codes: string[]): string[] => {
    return codes.map(code => getCountryName(code))
  }

  const getCountryNamesJoined = (codes: string[], separator: string = ', '): string => {
    return getCountryNames(codes).join(separator)
  }

  return {
    countries,
    countryOptions,
    isLoading,
    error,
    getCountryByCode,
    getCountryName,
    getCountryNames,
    getCountryNamesJoined
  }
}

/**
 * Fallback countries for when database is unavailable
 */
function getFallbackCountries(): Country[] {
  return [
    { id: 'za-fallback', code: 'za', name: 'South Africa', flag_emoji: '🇿🇦', region: 'Africa', is_active: true, sort_order: 1 },
    { id: 'ng-fallback', code: 'ng', name: 'Nigeria', flag_emoji: '🇳🇬', region: 'Africa', is_active: true, sort_order: 2 },
    { id: 'ke-fallback', code: 'ke', name: 'Kenya', flag_emoji: '🇰🇪', region: 'Africa', is_active: true, sort_order: 3 },
    { id: 'gh-fallback', code: 'gh', name: 'Ghana', flag_emoji: '🇬🇭', region: 'Africa', is_active: true, sort_order: 4 },
    { id: 'eg-fallback', code: 'eg', name: 'Egypt', flag_emoji: '🇪🇬', region: 'Africa', is_active: true, sort_order: 5 },
    { id: 'ma-fallback', code: 'ma', name: 'Morocco', flag_emoji: '🇲🇦', region: 'Africa', is_active: true, sort_order: 6 },
    { id: 'us-fallback', code: 'us', name: 'United States', flag_emoji: '🇺🇸', region: 'Americas', is_active: true, sort_order: 200 },
    { id: 'gb-fallback', code: 'gb', name: 'United Kingdom', flag_emoji: '🇬🇧', region: 'Europe', is_active: true, sort_order: 201 },
    { id: 'de-fallback', code: 'de', name: 'Germany', flag_emoji: '🇩🇪', region: 'Europe', is_active: true, sort_order: 202 },
    { id: 'fr-fallback', code: 'fr', name: 'France', flag_emoji: '🇫🇷', region: 'Europe', is_active: true, sort_order: 203 },
    { id: 'ca-fallback', code: 'ca', name: 'Canada', flag_emoji: '🇨🇦', region: 'Americas', is_active: true, sort_order: 204 },
    { id: 'au-fallback', code: 'au', name: 'Australia', flag_emoji: '🇦🇺', region: 'Oceania', is_active: true, sort_order: 205 },
  ]
}