import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin Dashboard | UtilityAI',
    description: 'Admin panel for managing users, roles, and system settings.',
    robots: { index: false, follow: false },
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
