'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
        description: 'Access 4 specialized AI agents',
        href: '/agents',
        icon: Zap,
        color: 'text-purple-500',
    },
    {
        title: 'New Canvas',
        description: 'Design your strategy',
        href: '/canvas',
        icon: Layers,
        color: 'text-orange-500',
    },
]

const stats = [
    { name: 'AI Agents', value: '4', icon: Sparkles },
    { name: 'Active Sessions', value: '12', icon: Zap },
]

export default function DashboardPage() {
    const { user } = useAuth()

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
            {/* Welcome Banner with Gradient */}
            <div className="gradient-purple rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium opacity-90 mb-2">SYSTEM ONLINE</p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3 break-words">
                            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
                        </h1>
                        <p className="text-white/80 text-sm sm:text-base md:text-lg">
                            Your AI credits are healthy with <span className="font-semibold">850 tokens</span> remaining for this billing cycle.
                        </p>
                    </div>
                    <Link href="/upgrade">
                        <Button className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-4 sm:px-6 w-full sm:w-auto">
                            Upgrade Plan
                        </Button>
                    </Link>
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

                <Link href="/canvas">
                    <button className="group bg-card hover:bg-accent border border-border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left w-full">
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
                </Link>

                <Link href="/voice">
                    <button className="group bg-card hover:bg-accent border border-border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left w-full">
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
                </Link>
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

            {/* AI Agents Section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-6">AI Agents</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <Link href="/agents/deep_research">
                        <Card className="card-hover cursor-pointer group border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-purple">
                                            <Target className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">Deep Research</CardTitle>
                                            <CardDescription>Comprehensive market analysis</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/image_generation">
                        <Card className="card-hover cursor-pointer group border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-pink">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">Ad Image Generation</CardTitle>
                                            <CardDescription>AI-powered ad visuals</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/linkedin_headshot">
                        <Card className="card-hover cursor-pointer group border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-green">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">LinkedIn Headshot</CardTitle>
                                            <CardDescription>Professional profile photos</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/agents/ad_copy">
                        <Card className="card-hover cursor-pointer group border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="icon-badge icon-badge-orange">
                                            <Zap className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">Ad Copy Generator</CardTitle>
                                            <CardDescription>High-converting ad variations</CardDescription>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <span className="text-sm">Explore premium features</span>
                        <Link href="/upgrade">
                            <Button size="sm" variant="outline">View Plans</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
