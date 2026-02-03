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
        <div className="space-y-6 md:space-y-8 animate-fade-in">
            {/* Welcome Banner with Gradient */}
            <div className="gradient-purple rounded-xl md:rounded-2xl p-4 md:p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-xs md:text-sm font-medium opacity-90 mb-2">SYSTEM ONLINE</p>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-3">
                            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
                        </h1>
                        <p className="text-white/80 text-sm md:text-lg">
                            Your AI credits are healthy with <span className="font-semibold">850 tokens</span> remaining for this billing cycle.
                        </p>
                    </div>
                    <Button className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-4 md:px-6 w-full md:w-auto">
                        Upgrade Plan
                    </Button>
                </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/onboarding">
                    <button className="group bg-card hover:bg-accent border border-border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left w-full">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="icon-badge icon-badge-blue">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Start New Flow</h3>
                                <p className="text-sm text-muted-foreground">Automate a new task</p>
                            </div>
                        </div>
                    </button>
                </Link>

                <button className="group bg-card hover:bg-accent border border-border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="icon-badge icon-badge-cyan">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Edit Project</h3>
                            <p className="text-sm text-muted-foreground">Continue working</p>
                        </div>
                    </div>
                </button>

                <button className="group bg-card hover:bg-accent border border-border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="icon-badge icon-badge-purple">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Voice Command</h3>
                            <p className="text-sm text-muted-foreground">Quick AI request</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 dark:text-foreground">
                                {stat.name}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-purple-500 dark:text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-white dark:to-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* AI Agents Section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-6">AI Agents</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <Link href="/agents/deep_research">
                        <Card className="card-hover cursor-pointer group border-2 hover:border-purple-300 dark:border-border dark:hover:border-purple-500 bg-gradient-to-br from-white to-purple-50/30 dark:from-card dark:to-card shadow-sm hover:shadow-lg transition-all">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-purple shadow-md">
                                            <Target className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-purple-600 dark:group-hover:text-primary transition-colors">Deep Research</CardTitle>
                                            <CardDescription className="text-gray-600 dark:text-muted-foreground">Comprehensive market analysis</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-purple-500 dark:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/image_generation">
                        <Card className="card-hover cursor-pointer group border-2 hover:border-pink-300 dark:border-border dark:hover:border-pink-500 bg-gradient-to-br from-white to-pink-50/30 dark:from-card dark:to-card shadow-sm hover:shadow-lg transition-all">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-pink shadow-md">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-pink-600 dark:group-hover:text-primary transition-colors">Ad Image Generation</CardTitle>
                                            <CardDescription className="text-gray-600 dark:text-muted-foreground">AI-powered ad visuals</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-pink-500 dark:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/linkedin_headshot">
                        <Card className="card-hover cursor-pointer group border-2 hover:border-blue-300 dark:border-border dark:hover:border-blue-500 bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-card shadow-sm hover:shadow-lg transition-all">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-blue shadow-md">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-primary transition-colors">LinkedIn Headshot</CardTitle>
                                            <CardDescription className="text-gray-600 dark:text-muted-foreground">Professional AI headshots</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-blue-500 dark:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/sales_script">
                        <Card className="card-hover cursor-pointer group border-2 hover:border-blue-300 dark:border-border dark:hover:border-blue-500 bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-card shadow-sm hover:shadow-lg transition-all">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-blue shadow-md">
                                            <FolderOpen className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-primary transition-colors">Sales Scripts</CardTitle>
                                            <CardDescription className="text-gray-600 dark:text-muted-foreground">Perfect your pitch</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-blue-500 dark:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
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
    )
}
