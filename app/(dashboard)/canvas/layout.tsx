import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Canvas | UtilityAI',
    description: 'Design and orchestrate multi-agent AI workflows with the visual canvas editor.',
    robots: { index: false, follow: false },
}

export default function CanvasLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
