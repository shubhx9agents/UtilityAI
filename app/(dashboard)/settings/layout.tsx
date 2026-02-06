import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Settings | UtilityAI',
    description: 'Manage your UtilityAI account settings, preferences, and API keys.',
    robots: { index: false, follow: false },
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
