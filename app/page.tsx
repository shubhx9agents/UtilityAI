import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UtilityAI
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl">
              Transform your business with AI-powered agents for marketing, sales, and growth.
              10 specialized agents ready to accelerate your success.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            {[
              { title: 'Business Snapshot', desc: 'Create your business profile' },
              { title: 'Ad Copy', desc: 'Generate compelling ads' },
              { title: 'Sales Scripts', desc: 'Perfect your pitch' },
              { title: 'Landing Pages', desc: 'Convert more visitors' },
              { title: 'Email Campaigns', desc: 'Engage your audience' },
              { title: 'Growth & CRO', desc: 'Optimize your funnel' },
            ].map((agent) => (
              <div
                key={agent.title}
                className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <h3 className="font-semibold text-lg mb-2">{agent.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
