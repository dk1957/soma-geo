import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'germany' })
}

export default function GermanyPage() {
  return <CountryPageFromSanity slug="germany" />
}
