import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'uae' })
}

export default function UAEPage() {
  return <CountryPageFromSanity slug="uae" />
}
