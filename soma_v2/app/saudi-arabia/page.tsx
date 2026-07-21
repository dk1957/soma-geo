import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'saudi-arabia' })
}

export default function SaudiArabiaPage() {
  return <CountryPageFromSanity slug="saudi-arabia" />
}
