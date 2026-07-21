import CaseStudyPageFromSanity, { generateMetadata as generateCaseStudyMetadata } from '@/app/(marketing)/case-study-page'
import { client } from '@/sanity/lib/client'
import { CASE_STUDY_SLUGS_QUERY } from '@/lib/sanity/queries'

export const revalidate = 60

export async function generateStaticParams() {
  const caseStudies = await client.fetch<Array<{ slug: string }>>(CASE_STUDY_SLUGS_QUERY)
  return caseStudies.map((cs) => ({ slug: cs.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateCaseStudyMetadata({ params: { slug } })
}

export default async function CaseStudyRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CaseStudyPageFromSanity slug={slug} />
}
