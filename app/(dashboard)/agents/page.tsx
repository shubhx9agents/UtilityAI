'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Sparkles,
    MessageSquare,
    Image,
    Phone,
    FileText,
    Mail,
    Share2,
    Search,
    DollarSign,
    TrendingUp,
} from 'lucide-react'

const agents = [
    {
        id: 'deep_research',
        name: 'Deep Research',
        description: 'Comprehensive market analysis and competitor research',
        icon: Search,
        color: 'bg-purple-500',
    },
    {
        id: 'image_generation',
        name: 'Ad Image Generation',
        description: 'Generate and edit advertisement images with AI',
        icon: Image,
        color: 'bg-rose-500',
    },
    {
        id: 'linkedin_headshot',
        name: 'LinkedIn Headshot',
        description: 'Generate professional LinkedIn headshots',
        icon: Sparkles,
        color: 'bg-blue-600',
    },
    {
        id: 'ad_copy',
        name: 'Ad Copy Generator',
        description: 'Generate high-converting ad variations in CSV format',
        icon: Share2,
        color: 'bg-orange-500',
    },
]

export default function AgentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
                <p className="text-muted-foreground mt-2">
                    Choose from 4 specialized AI agents to accelerate your business
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                    <Link key={agent.id} href={`/agents/${agent.id}`}>
                        <Card className="border-2 hover:border-purple-300 dark:border-border dark:hover:border-purple-500 bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card shadow-sm hover:shadow-xl transition-all cursor-pointer h-full hover:scale-[1.02] group">
                            <CardHeader>
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-lg ${agent.color} text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                                        <agent.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg group-hover:text-purple-600 dark:group-hover:text-primary transition-colors">{agent.name}</CardTitle>
                                        <CardDescription className="mt-1.5 text-gray-600 dark:text-muted-foreground">
                                            {agent.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full border-2 hover:bg-purple-50 dark:hover:bg-accent group-hover:border-purple-300 dark:group-hover:border-purple-500 transition-all">
                                    Start Agent
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
