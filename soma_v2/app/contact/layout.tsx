import { Metadata } from "next"
import { MultiStructuredData, buildBreadcrumb } from "@/components/marketing/structured-data"

export const metadata: Metadata = {
  title: "Contact Soma AI | Get in Touch",
  description: "Contact Soma AI for expert guidance on Generative Engine Optimization. Talk to our team about monitoring and improving your brand visibility across ChatGPT, Claude, Gemini, and Perplexity.",
  keywords: [
    "contact Soma AI",
    "GEO consultation",
    "AI optimization experts",
    "AI search optimization help",
  ],
  openGraph: {
    title: "Contact Soma AI",
    description: "Get in touch with the Soma AI team for AI search visibility guidance.",
    type: "website",
    url: "https://withsoma.ai/contact",
  },
  alternates: {
    canonical: "https://withsoma.ai/contact",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MultiStructuredData schemas={[
        buildBreadcrumb([
          { name: 'Home', url: 'https://withsoma.ai' },
          { name: 'Contact', url: 'https://withsoma.ai/contact' },
        ]),
      ]} />
      {children}
    </>
  )
}
