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
            information.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-6 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Information We Collect</p>
            <p className="mt-2">
              We collect account details, usage data, and content you upload or generate in
              order to provide and improve UtilityAI features.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">How We Use Information</p>
            <p className="mt-2">
              We use your data to operate the service, personalize outputs, secure the
              platform, and support troubleshooting.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Data Sharing</p>
            <p className="mt-2">
              We do not sell personal data. We only share information with trusted service
              providers required to operate UtilityAI.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Retention</p>
            <p className="mt-2">
              Content and logs may be retained for a limited period to ensure reliability,
              prevent abuse, and meet legal obligations.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Your Choices</p>
            <p className="mt-2">
              You can request access, correction, or deletion of your data by contacting
              support.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
