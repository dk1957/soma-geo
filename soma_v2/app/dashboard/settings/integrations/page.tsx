import { Suspense } from 'react'
import IntegrationsClient from './integrations-client'

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationsClient />
    </Suspense>
  )
}
