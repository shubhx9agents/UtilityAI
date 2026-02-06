import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Account | UtilityAI',
    description: 'Join UtilityAI and start using AI-powered agents for marketing, research, ad copy, and business growth.',
    openGraph: {
        title: 'Create Account | UtilityAI',
        description: 'Join UtilityAI and start using AI-powered agents for marketing and growth.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Create Account | UtilityAI',
        description: 'Join UtilityAI and start using AI-powered agents.',
    },
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
