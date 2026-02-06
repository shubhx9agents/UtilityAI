import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login | UtilityAI',
    description: 'Sign in to your UtilityAI account to access AI-powered business tools for marketing, sales, and growth.',
    openGraph: {
        title: 'Login | UtilityAI',
        description: 'Sign in to your UtilityAI account to access AI-powered business tools.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Login | UtilityAI',
        description: 'Sign in to your UtilityAI account to access AI-powered business tools.',
    },
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
