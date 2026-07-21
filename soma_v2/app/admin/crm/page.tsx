import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/auth/admin'
import { CRMView } from './crm-view'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const user = await currentUser()
  if (!user) redirect('/signin?redirect_url=/admin/crm')

  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!isAdminEmail(userEmail)) redirect('/dashboard')

  return <CRMView userEmail={userEmail} />
}
