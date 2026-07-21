import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your AI Visibility Report | Soma AI',
  description: 'Your personalized brand visibility report across AI search engines.',
  robots: { index: false, follow: false },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
