import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/auth/admin'
import { ReactNode } from 'react'

export default async function CRMLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/signin?redirect_url=/admin/crm')

  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!isAdminEmail(userEmail)) redirect('/dashboard')

  return <>{children}</>
}
