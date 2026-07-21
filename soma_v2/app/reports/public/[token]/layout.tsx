import { ReactNode } from 'react'

console.log('🟢 Public report layout loaded - Route config:', {
  dynamic: 'force-dynamic',
  revalidate: 0,
  runtime: 'nodejs',
  dynamicParams: true
})

// Route segment config - must be in server component (layout)
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Tell Next.js this is a dynamic route (don't pre-render at build time)
export const dynamicParams = true

export default function PublicReportLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
