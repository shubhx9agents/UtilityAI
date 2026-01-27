'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
    Sparkles,
    Layers,
    GitBranch,
    StickyNote,
    FolderOpen,
    TrendingUp,
    Zap,
    Target,
} from 'lucide-react'

const quickActions = [
    {
        title: 'Start Onboarding',
        description: 'Complete your business profile',
        href: '/onboarding',
        icon: Sparkles,
        color: 'text-blue-500',
    },
    {
        title: 'AI Agents',
        description: 'Access 10 specialized AI agents',
        href: '/agents',
        icon: Zap,
        color: 'text-purple-500',
    },
    {
        title: 'Create Flow',
        description: 'Build a new business flow',
        href: '/flows',
        icon: GitBranch,
        color: 'text-green-500',
    },
    {
        title: 'New Canvas',
        description: 'Design your strategy',
        href: '/canvas',
        icon: Layers,
        color: 'text-orange-500',
    },
    {
        title: 'Take Notes',
        description: 'Capture your ideas',
        href: '/notes',
        icon: StickyNote,
        color: 'text-yellow-500',
    },
    {
        title: 'Library',
        description: 'Access your resources',
        href: '/library',
        icon: FolderOpen,
        color: 'text-pink-500',
    },
]

const stats = [
    { name: 'AI Agents', value: '10', icon: Sparkles },
    { name: 'Active Flows', value: '0', icon: GitBranch },
    { name: 'Notes', value: '0', icon: StickyNote },
    { name: 'Library Items', value: '0', icon: FolderOpen },
]

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="lg:pl-64">
                <main className="p-4 lg:p-8">
                    <div className="space-y-8">
                        {/* Welcome Section */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Here's what's happening with your AI-powered business tools
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <Card key={stat.name}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {stat.name}
                                        </CardTitle>
                                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {quickActions.map((action) => (
                                    <Link key={action.title} href={action.href}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                            <CardHeader>
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-lg bg-muted ${action.color}`}>
                                                        <action.icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{action.title}</CardTitle>
                                                        <CardDescription>{action.description}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Getting Started */}
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    <span>Getting Started</span>
                                </CardTitle>
                                <CardDescription>
                                    Complete these steps to get the most out of UtilityAI
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Complete onboarding</span>
                                    <Link href="/onboarding">
                                        <Button size="sm">Start</Button>
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Try an AI agent</span>
                                    <Link href="/agents">
                                        <Button size="sm" variant="outline">Explore</Button>
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Create your first flow</span>
                                    <Link href="/flows">
                                        <Button size="sm" variant="outline">Create</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
