import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'ghana' })
}

export default function GhanaPage() {
  return <CountryPageFromSanity slug="ghana" />
}
