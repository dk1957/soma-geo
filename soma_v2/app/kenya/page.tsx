import CountryPageFromSanity, { generateCountryMetadata } from '@/app/(marketing)/country-page'

export const revalidate = 60

export async function generateMetadata() {
  return generateCountryMetadata({ slug: 'kenya' })
}

export default function KenyaPage() {
  return <CountryPageFromSanity slug="kenya" />
}
