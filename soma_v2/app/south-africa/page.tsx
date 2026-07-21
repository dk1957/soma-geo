import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'south-africa' })
}

export default function SouthAfricaPage() {
  return <CountryPageFromSanity slug="south-africa" />
}
