import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI Agents | UtilityAI',
    description: 'Access specialized AI agents for market research, ad copy, email campaigns, sales scripts, and more.',
    robots: { index: false, follow: false },
}

export default function AgentsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
