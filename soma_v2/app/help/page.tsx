import PageFromSanity, { generateMetadata as generatePageMetadata } from '@/app/(marketing)/sanity-page'

export const revalidate = 60

export async function generateMetadata() {
  return generatePageMetadata({ slug: 'help' })
}

export default function HelpPage() {
  return <PageFromSanity slug="help" />
}
