import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { isAdminEmail } from '@/lib/auth/admin'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()

  if (!user) {
    redirect('/signin?redirect_url=/admin')
  }

  const userEmail = user.emailAddresses[0]?.emailAddress
  
  if (!isAdminEmail(userEmail)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
