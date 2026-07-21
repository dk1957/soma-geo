import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'united-kingdom' })
}

export default function UnitedKingdomPage() {
  return <CountryPageFromSanity slug="united-kingdom" />
}
