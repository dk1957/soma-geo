import CaseStudiesIndexPageFromSanity, { metadata as caseStudiesMetadata } from '@/app/(marketing)/case-studies-index-page'

export const revalidate = 60
export const metadata = caseStudiesMetadata

export default function CaseStudiesPage() {
  return <CaseStudiesIndexPageFromSanity />
}
