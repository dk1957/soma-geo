import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'nigeria' })
}

export default function NigeriaPage() {
  return <CountryPageFromSanity slug="nigeria" />
}
