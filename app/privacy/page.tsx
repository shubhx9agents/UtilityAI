import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <Link href="/">
              <Button variant="outline" className="rounded-lg">
                Back
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-muted-foreground">
            This Privacy Policy explains how UtilityAI collects, uses, and protects your
            information. Last updated: March 2026.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-8 text-sm text-muted-foreground">
          {/* Information We Collect */}
          <div>
            <p className="font-medium text-foreground text-base">Information We Collect</p>
            <p className="mt-2">
              We collect account details, usage data, and content you upload or generate in
              order to provide and improve UtilityAI features.
            </p>
          </div>

          {/* How We Use Information */}
          <div>
            <p className="font-medium text-foreground text-base">How We Use Information</p>
            <p className="mt-2">
              We use your data to operate the service, personalize outputs, secure the
              platform, and support troubleshooting.
            </p>
          </div>

          {/* Legal Basis for Processing */}
          <div>
            <p className="font-medium text-foreground text-base">Legal Basis for Processing</p>
            <p className="mt-2">
              Under the General Data Protection Regulation (GDPR), we process your personal data
              on the following legal bases:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Contract performance:</strong> Processing necessary to provide the
                UtilityAI service you signed up for, including account management, AI agent
                execution, and content generation.
              </li>
              <li>
                <strong>Legitimate interests:</strong> Processing for security monitoring,
                fraud prevention, service improvement, and troubleshooting, where these
                interests are not overridden by your rights.
              </li>
              <li>
                <strong>Consent:</strong> Where you opt-in to analytics cookies or optional
                data processing via our cookie consent banner. You may withdraw consent at any
                time by clearing your browser storage and revisiting the site.
              </li>
              <li>
                <strong>Legal obligation:</strong> Processing required to comply with
                applicable laws, regulations, or lawful government requests.
              </li>
            </ul>
          </div>

          {/* Cookie Usage */}
          <div>
            <p className="font-medium text-foreground text-base">Cookie Usage</p>
            <p className="mt-2">
              UtilityAI uses cookies and similar technologies. Below is a detailed breakdown:
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium text-foreground">Strictly Necessary Cookies</p>
                <p className="mt-1">
                  These cookies are essential for the service to function and cannot be
                  disabled.
                </p>
                <ul className="mt-1 list-disc pl-6 space-y-1">
                  <li>
                    <strong>Supabase authentication cookies</strong> (e.g.,{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">sb-*-auth-token</code>):
                    Used to maintain your authenticated session. These are httpOnly, secure
                    cookies set by the Supabase SSR library. Expiry: session duration
                    (typically 1 hour, refreshed automatically).
                  </li>
                  <li>
                    <strong>Theme preference</strong>: Stored via{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>{' '}
                    to remember your light/dark mode selection. Not transmitted to servers.
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Optional Cookies</p>
                <ul className="mt-1 list-disc pl-6 space-y-1">
                  <li>
                    <strong>Analytics cookies</strong>: If you consent via our cookie banner,
                    we may use analytics to understand usage patterns and improve the service.
                    These are only set after explicit user consent.
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Cookie Consent</p>
                <p className="mt-1">
                  When you first visit UtilityAI, a cookie consent banner is presented. Your
                  consent choice is stored locally (in{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>)
                  and includes a timestamp. You can reset your preferences at any time by
                  clearing your browser&apos;s local storage and revisiting the site, which
                  will re-display the consent banner.
                </p>
              </div>
            </div>
          </div>

          {/* Third-Party AI Services */}
          <div>
            <p className="font-medium text-foreground text-base">Third-Party AI Services</p>
            <p className="mt-2">
              UtilityAI integrates with the following third-party AI providers to power its
              agent features. When you interact with AI agents, the prompts and inputs you
              provide may be sent to these services for processing:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li>
                <strong>Groq (Groq, Inc.)</strong> — Used for high-speed large language model
                inference. Your prompts are sent to Groq&apos;s API for processing. Groq&apos;s
                servers are located in the United States. Groq does not use customer data for
                model training. See:{' '}
                <a
                  href="https://groq.com/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Groq Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Perplexity (Perplexity AI, Inc.)</strong> — Used for deep research and
                web-augmented AI responses. Query content is sent to Perplexity&apos;s API.
                Perplexity&apos;s servers are located in the United States. See:{' '}
                <a
                  href="https://www.perplexity.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Perplexity Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Google (Google LLC — Gemini API)</strong> — Used for AI agent
                processing via the Gemini language model. Prompt data is sent to Google&apos;s
                API endpoints. Google&apos;s servers may process data globally. See:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>BytePlus (BytePlus Pte. Ltd.)</strong> — Used for supplementary AI
                capabilities. Data sent to BytePlus may be processed in Singapore or other
                regions. See:{' '}
                <a
                  href="https://www.byteplus.com/en/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  BytePlus Privacy Policy
                </a>
                .
              </li>
            </ul>
            <p className="mt-2">
              We only send the minimum data necessary (your prompt/input) to these services.
              We do not send your email address, password, or account metadata to AI providers.
            </p>
          </div>

          {/* Data Transfers */}
          <div>
            <p className="font-medium text-foreground text-base">International Data Transfers</p>
            <p className="mt-2">
              Some of the third-party AI services listed above process data outside the
              European Economic Area (EEA), primarily in the United States and Singapore. Where
              personal data is transferred outside the EEA, we rely on the following
              safeguards:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European
                Commission, where applicable and available from the provider.
              </li>
              <li>
                <strong>Adequacy decisions</strong> by the European Commission for the
                recipient country, where available.
              </li>
              <li>
                <strong>EU-U.S. Data Privacy Framework</strong> certification of the recipient,
                where applicable (e.g., Google LLC).
              </li>
            </ul>
            <p className="mt-2">
              Supabase (our authentication and database provider) stores data in data centers
              selected during project setup, and supports EU-hosted instances. Our primary
              Supabase instance processes authentication and user data.
            </p>
          </div>

          {/* Data Sharing */}
          <div>
            <p className="font-medium text-foreground text-base">Data Sharing</p>
            <p className="mt-2">
              We do not sell personal data. We only share information with trusted service
              providers required to operate UtilityAI, specifically the AI providers listed
              above and our infrastructure provider (Supabase for authentication and database,
              Vercel for hosting).
            </p>
          </div>

          {/* Retention */}
          <div>
            <p className="font-medium text-foreground text-base">Data Retention</p>
            <p className="mt-2">
              We retain your data for the following specific periods:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Account data</strong> (email, profile): Retained for the duration of
                your account. Deleted within 30 days of account deletion request.
              </li>
              <li>
                <strong>AI session history &amp; generated content</strong>: Retained for 90
                days from creation, after which it is automatically purged unless you
                explicitly save it.
              </li>
              <li>
                <strong>Audit logs</strong> (security events, login attempts): Retained for
                12 months for security and compliance purposes.
              </li>
              <li>
                <strong>Server &amp; application logs</strong>: Retained for 30 days for
                debugging and reliability purposes.
              </li>
              <li>
                <strong>Payment records</strong> (if applicable): Retained for 7 years to
                comply with financial record-keeping regulations.
              </li>
            </ul>
            <p className="mt-2">
              Third-party AI providers may have their own retention policies for data
              processed through their APIs. Please consult their respective privacy policies
              linked above.
            </p>
          </div>

          {/* Your Rights */}
          <div>
            <p className="font-medium text-foreground text-base">Your Rights</p>
            <p className="mt-2">
              Under the GDPR and applicable privacy laws, you have the following rights:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Right of access:</strong> Request a copy of the personal data we hold
                about you.
              </li>
              <li>
                <strong>Right to rectification:</strong> Request correction of inaccurate data.
              </li>
              <li>
                <strong>Right to erasure:</strong> Request deletion of your personal data via
                the account settings or by contacting support. We will process deletion
                requests within 30 days.
              </li>
              <li>
                <strong>Right to data portability:</strong> Request an export of your data in
                a machine-readable format (JSON) via the account settings or by contacting
                support.
              </li>
              <li>
                <strong>Right to restrict processing:</strong> Request that we limit how we
                use your data.
              </li>
              <li>
                <strong>Right to object:</strong> Object to processing based on legitimate
                interests.
              </li>
              <li>
                <strong>Right to withdraw consent:</strong> Where processing is based on
                consent (e.g., analytics cookies), you may withdraw consent at any time.
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, use the self-service options in your account
              settings or contact support. We will respond to requests within 30 days.
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="font-medium text-foreground text-base">Contact</p>
            <p className="mt-2">
              If you have questions about this Privacy Policy or wish to exercise your data
              rights, please contact us at the support channels provided within the UtilityAI
              platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
