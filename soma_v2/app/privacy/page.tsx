import { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MultiStructuredData, buildBreadcrumb } from '@/components/marketing/structured-data'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Soma AI',
  description: 'Privacy Policy for the Soma AI Generative Engine Optimization platform. Learn how we collect, use, protect, and share your information.',
  alternates: {
    canonical: 'https://withsoma.ai/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MultiStructuredData schemas={[
        buildBreadcrumb([
          { name: 'Home', url: 'https://withsoma.ai' },
          { name: 'Privacy Policy', url: 'https://withsoma.ai/privacy' },
        ]),
      ]} />
      <SiteHeader />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600 mb-4">
              This policy explains how Soma AI collects, uses, and protects your information.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Last Updated: April 12, 2026</span>
              <span>Effective: April 12, 2026</span>
            </div>
          </div>

          <div className="max-w-none space-y-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-8 [&_h2]:border-t [&_h2]:border-gray-100 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_ul_ul]:mt-2 [&_ul_ul]:mb-0 [&_li]:text-gray-700 [&_li]:leading-relaxed [&_a]:text-black [&_a]:underline [&_a:hover]:text-gray-600 [&_strong]:text-black [&_strong]:font-semibold">

            <h2 className="!border-t-0 !pt-0 !mt-0">1. Introduction</h2>
            <p>
              Soma AI (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our website at withsoma.ai and the Soma AI platform (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By using the Service, you consent to the practices described in this Privacy Policy. If you do not agree with these practices, please do not use the Service.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, company name, job title, and password when you create an account</li>
              <li><strong>Billing Information:</strong> Payment card details, billing address, and transaction history (processed securely through Stripe; we do not store full card numbers)</li>
              <li><strong>Brand Information:</strong> Brand names, website URLs, competitor names, and industry categories you enter for monitoring</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support requests you send to us</li>
              <li><strong>Team Management Data:</strong> Email addresses and roles of team members you invite to your account</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, monitoring runs initiated, reports viewed, and interaction patterns within the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, screen resolution, and language preferences</li>
              <li><strong>Log Data:</strong> IP address, access times, referring URLs, and server response codes</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies, local storage, and similar technologies to maintain sessions, remember preferences, and analyze usage (see Section 7)</li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <ul>
              <li><strong>Authentication Providers:</strong> If you sign in via Google or other OAuth providers, we receive your name, email, and profile picture as authorized by you</li>
              <li><strong>AI Platform Responses:</strong> We collect and store responses from AI platforms (ChatGPT, Claude, Gemini, Perplexity, Grok, Llama) when monitoring your brand visibility. These are publicly generated responses and do not contain your private data</li>
              <li><strong>Publicly Available Data:</strong> We may collect publicly available information about your brand from websites, reviews, and media to provide optimization recommendations</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve the Soma AI platform, including monitoring AI search visibility, generating reports, and delivering recommendations</li>
              <li><strong>Account Management:</strong> To create and manage your account, process billing, and manage team access</li>
              <li><strong>Communication:</strong> To send service updates, billing confirmations, security alerts, and support responses</li>
              <li><strong>Analytics and Improvement:</strong> To understand usage patterns, identify issues, and improve the Service</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, abuse, and security incidents</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Marketing:</strong> To send promotional communications about new features or services, with your consent where required by law. You can opt out at any time</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third parties who assist us in operating the Service, including:
                <ul>
                  <li>Supabase (database and authentication infrastructure)</li>
                  <li>Stripe (payment processing)</li>
                  <li>Resend (transactional email delivery)</li>
                  <li>Vercel (hosting and content delivery)</li>
                  <li>AI platform providers (for brand visibility queries only)</li>
                </ul>
              </li>
              <li><strong>Within Your Organization:</strong> With other team members in your account, according to the role-based permissions you configure</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or government regulation</li>
              <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of Soma AI, our users, or the public</li>
              <li><strong>With Your Consent:</strong> In any other circumstance where you have given explicit consent</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the Service. Specifically:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained for the duration of your account plus 30 days after termination</li>
              <li><strong>Monitoring Data:</strong> AI visibility reports and monitoring history are retained for the duration of your subscription</li>
              <li><strong>Billing Records:</strong> Retained for 7 years as required by tax and financial reporting regulations</li>
              <li><strong>Communication Records:</strong> Support correspondence retained for 3 years</li>
              <li><strong>Usage Logs:</strong> Retained for 12 months for analytics and security purposes</li>
            </ul>
            <p>
              You may request deletion of your data at any time by contacting us. We will process deletion requests within 30 days, subject to legal retention requirements.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Row Level Security (RLS) policies ensuring strict data isolation between accounts</li>
              <li>Secure authentication with PKCE flow and auto-refresh tokens</li>
              <li>Role-based access controls within multi-tenant architecture</li>
              <li>Regular security assessments and monitoring</li>
              <li>PCI DSS compliance through Stripe for payment processing</li>
            </ul>
            <p>
              While we take reasonable precautions, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data.
            </p>

            <h2>7. Cookies and Tracking Technologies</h2>
            <p>We use the following types of cookies and similar technologies:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for authentication, session management, and core functionality. These cannot be disabled</li>
              <li><strong>Preference Cookies:</strong> Store your settings such as brand selection, workspace preferences, and display options</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service so we can improve it</li>
            </ul>
            <p>
              You can manage cookie preferences through your browser settings. Disabling essential cookies may prevent you from using certain features of the Service.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Request that we limit processing of your information in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing of your personal information for direct marketing purposes</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a>. We will respond within 30 days.
            </p>

            <h2>9. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with additional rights:
            </p>
            <ul>
              <li><strong>Right to Know:</strong> You may request details about the categories and specific pieces of personal information we have collected, the sources, the business purposes, and the categories of third parties with whom we share it</li>
              <li><strong>Right to Delete:</strong> You may request deletion of your personal information, with certain exceptions</li>
              <li><strong>Right to Opt Out:</strong> We do not sell personal information. If this changes, we will provide a &quot;Do Not Sell My Personal Information&quot; mechanism</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
            </ul>
            <p>
              To submit a CCPA request, email us at <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a> with the subject line &quot;CCPA Request.&quot;
            </p>

            <h2>10. International Data Transfers</h2>
            <p>
              The Service is operated from the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate. These countries may have different data protection laws than your jurisdiction.
            </p>
            <p>
              For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we rely on Standard Contractual Clauses approved by the European Commission as the legal mechanism for cross-border data transfers. By using the Service, you consent to the transfer of your information as described in this section.
            </p>

            <h2>11. European Privacy Rights (GDPR)</h2>
            <p>
              If you are located in the EEA or United Kingdom, you have rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul>
              <li>All rights listed in Section 8 above</li>
              <li><strong>Legal Basis:</strong> We process your personal data based on: (a) your consent, (b) performance of our contract with you, (c) our legitimate interests (improving the Service, preventing fraud), and (d) compliance with legal obligations</li>
              <li><strong>Data Protection Authority:</strong> You have the right to lodge a complaint with your local data protection authority</li>
            </ul>

            <h2>12. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a>, and we will take steps to delete such information.
            </p>

            <h2>13. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>

            <h2>14. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on the Service at least 30 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised policy.
            </p>

            <h2>15. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a></li>
              <li>Phone: <a href="tel:+19105199239">+1 (910) 519-9239</a></li>
              <li>Web: <Link href="/contact">withsoma.ai/contact</Link></li>
            </ul>
            <p>
              For GDPR-related inquiries, you may also contact our data protection team at <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a> with the subject line &quot;Data Protection Inquiry.&quot;
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
