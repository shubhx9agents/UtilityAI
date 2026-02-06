import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Authentication | UtilityAI',
    description: 'Sign in or create an account to access UtilityAI\'s AI-powered business tools.',
    robots: { index: true, follow: true },
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
