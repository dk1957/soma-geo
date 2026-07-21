import { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { MultiStructuredData, buildBreadcrumb } from '@/components/marketing/structured-data'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Soma AI',
  description: 'Terms of Service for the Soma AI Generative Engine Optimization platform. Read our terms governing your use of our AI search visibility monitoring and optimization services.',
  alternates: {
    canonical: 'https://withsoma.ai/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MultiStructuredData schemas={[
        buildBreadcrumb([
          { name: 'Home', url: 'https://withsoma.ai' },
          { name: 'Terms of Service', url: 'https://withsoma.ai/terms' },
        ]),
      ]} />
      <SiteHeader />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600 mb-4">
              These terms govern your use of the Soma AI platform and services.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Last Updated: April 12, 2026</span>
              <span>Effective: April 12, 2026</span>
            </div>
          </div>

          <div className="max-w-none space-y-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-8 [&_h2]:border-t [&_h2]:border-gray-100 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_ul_ul]:mt-2 [&_ul_ul]:mb-0 [&_li]:text-gray-700 [&_li]:leading-relaxed [&_a]:text-black [&_a]:underline [&_a:hover]:text-gray-600 [&_strong]:text-black [&_strong]:font-semibold">

            <h2 className="!border-t-0 !pt-0 !mt-0">1. Agreement to Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Soma AI (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Soma AI platform, website at withsoma.ai, APIs, and related services (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Soma AI is a Generative Engine Optimization (GEO) platform that provides:
            </p>
            <ul>
              <li>AI search visibility monitoring across large language model platforms including ChatGPT, Claude, Gemini, Perplexity, Grok, and Llama</li>
              <li>LLM Visibility Index (LVI) scoring and analytics</li>
              <li>Brand mention tracking, sentiment analysis, and citation analysis</li>
              <li>Competitor benchmarking and positioning reports</li>
              <li>Content optimization recommendations</li>
              <li>Scheduled monitoring runs and automated reporting</li>
              <li>Free AI visibility audits</li>
            </ul>
            <p>
              The Service analyzes publicly available data — including your website content, third-party reviews, and published media — to determine how AI search engines reference your brand. We do not access your internal systems, customer databases, or private information.
            </p>

            <h2>3. Account Registration and Security</h2>
            <p>
              To use the Service, you must create an account and provide accurate, complete, and current information. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring all users added to your account comply with these Terms</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe are being used fraudulently.
            </p>

            <h2>4. Subscription Plans and Billing</h2>
            <h3>4.1 Plans</h3>
            <p>
              The Service is offered under tiered subscription plans (Growth, Pro, and Enterprise), each with defined usage quotas including the number of brands, prompts per brand, competitors, team members, AI model platforms, and monthly monitoring runs. Current plan details and pricing are available at <Link href="/contact">withsoma.ai/contact</Link>.
            </p>
            <h3>4.2 Billing</h3>
            <p>
              Subscriptions are billed in advance on a recurring basis according to your selected billing cycle (monthly, quarterly, biannual, or annual). All fees are quoted in U.S. dollars and are non-refundable except as required by applicable law. We use Stripe to process payments. By providing payment information, you authorize us to charge the applicable fees.
            </p>
            <h3>4.3 Free Trials</h3>
            <p>
              We may offer a free trial period. If you do not cancel before the trial ends, your subscription will automatically convert to a paid plan, and you will be charged the applicable fee.
            </p>
            <h3>4.4 Plan Changes</h3>
            <p>
              You may upgrade your plan at any time, and the change takes effect immediately with prorated billing. Downgrades take effect at the end of the current billing period. Usage quotas will be adjusted accordingly.
            </p>
            <h3>4.5 Overages and Limits</h3>
            <p>
              If you reach your plan&apos;s usage limits, new monitoring runs will pause until you upgrade or your usage resets at the start of the next billing cycle. Your existing data and reports remain accessible.
            </p>

            <h2>5. Multi-Tenant Architecture and Data Isolation</h2>
            <p>
              The Service operates on a multi-tenant architecture with strict data isolation between accounts. Each account may manage multiple brands and workspaces. Data associated with one account is never accessible to another account. Role-based access controls (owner, admin, account manager, member, viewer) govern permissions within each account.
            </p>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the Service to monitor brands or entities you do not have authorization to monitor</li>
              <li>Resell, sublicense, or redistribute the Service without a written agreement</li>
              <li>Use automated tools to scrape, crawl, or extract data from the Service beyond authorized API access</li>
              <li>Submit prompts or content designed to exploit, attack, or manipulate AI model providers</li>
              <li>Use the Service to generate spam, misleading content, or deceptive optimization tactics</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <h3>7.1 Our Property</h3>
            <p>
              The Service, including all software, algorithms, the LVI scoring methodology, user interface designs, documentation, and branding, is owned by Soma AI and protected by intellectual property laws. These Terms do not grant you any rights to our trademarks, logos, or brand elements.
            </p>
            <h3>7.2 Your Content</h3>
            <p>
              You retain ownership of the data, brand information, prompts, and other content you provide to the Service (&quot;Your Content&quot;). You grant us a limited, non-exclusive license to use Your Content solely to provide and improve the Service. We will not sell or share Your Content with third parties except as described in our <Link href="/privacy">Privacy Policy</Link>.
            </p>
            <h3>7.3 Generated Reports and Analytics</h3>
            <p>
              Reports, scores, analytics, and recommendations generated by the Service based on Your Content are provided for your use. You may use, share, and distribute your reports within your organization. White-label reporting is available on applicable plans.
            </p>

            <h2>8. Third-Party AI Platforms</h2>
            <p>
              The Service interacts with third-party AI platforms (OpenAI, Anthropic, Google, Perplexity, xAI, Meta) to monitor how these platforms reference your brand. We are not affiliated with these providers, and their responses are subject to their own terms and may change without notice. We do not guarantee the accuracy, completeness, or consistency of AI-generated responses, as these are controlled by the respective AI providers.
            </p>

            <h2>9. Data Processing and Privacy</h2>
            <p>
              Our collection and use of personal information is governed by our <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Service, you acknowledge that you have read and understood our Privacy Policy.
            </p>

            <h2>10. Service Availability and Modifications</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time. We will provide reasonable notice of material changes. Scheduled maintenance windows will be communicated in advance when possible.
            </p>

            <h2>11. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. AI SEARCH RESULTS AND RECOMMENDATIONS ARE INFORMATIONAL AND SHOULD NOT BE RELIED UPON AS THE SOLE BASIS FOR BUSINESS DECISIONS.
            </p>

            <h2>12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOMA AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>

            <h2>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Soma AI, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) Your Content.
            </p>

            <h2>14. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. You may cancel your subscription through your dashboard settings. Upon termination:
            </p>
            <ul>
              <li>Your access to the Service will end at the conclusion of your current billing period</li>
              <li>Your data will be retained for 30 days, after which it will be permanently deleted</li>
              <li>You may request an export of your data prior to deletion</li>
              <li>Any outstanding fees remain due and payable</li>
            </ul>
            <p>
              We may terminate or suspend your access immediately if you breach these Terms, without liability and without prejudice to any other remedies.
            </p>

            <h2>15. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any disputes arising under these Terms shall first be addressed through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. The arbitration shall take place in Wilmington, Delaware. Either party may seek injunctive relief in a court of competent jurisdiction.
            </p>

            <h2>16. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes via email or through the Service at least 30 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
            </p>

            <h2>17. General Provisions</h2>
            <ul>
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Soma AI.</li>
              <li><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions will continue in effect.</li>
              <li><strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver of that provision.</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our prior written consent. We may assign our rights to a successor entity in a merger, acquisition, or sale of assets.</li>
              <li><strong>Force Majeure:</strong> We shall not be liable for any failure to perform due to circumstances beyond our reasonable control, including natural disasters, war, pandemic, or failures of third-party services.</li>
            </ul>

            <h2>18. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:hello@withsoma.ai">hello@withsoma.ai</a></li>
              <li>Phone: <a href="tel:+19105199239">+1 (910) 519-9239</a></li>
              <li>Web: <Link href="/contact">withsoma.ai/contact</Link></li>
            </ul>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
