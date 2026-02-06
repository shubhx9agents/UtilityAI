import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard | UtilityAI',
    description: 'Your UtilityAI dashboard - manage AI agents, workflows, and business tools.',
    robots: { index: false, follow: false },
}

export default function DashboardPageLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
