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
        id: 'business_snapshot',
        name: 'Business Snapshot',
        description: 'Create your foundational business profile',
        icon: Sparkles,
        color: 'bg-blue-500',
    },
    {
        id: 'ad_copy',
        name: 'Ad Copy Generator',
        description: 'Create compelling ads for multiple platforms',
        icon: MessageSquare,
        color: 'bg-purple-500',
    },
    {
        id: 'graphics',
        name: 'Graphics Prompts',
        description: 'Generate detailed image prompts for your brand',
        icon: Image,
        color: 'bg-pink-500',
    },
    {
        id: 'sales_script',
        name: 'Sales Scripts',
        description: 'Perfect your sales pitch and objection handling',
        icon: Phone,
        color: 'bg-green-500',
    },
    {
        id: 'landing_page',
        name: 'Landing Page Copy',
        description: 'Create high-converting landing page content',
        icon: FileText,
        color: 'bg-orange-500',
    },
    {
        id: 'email_sequence',
        name: 'Email Campaigns',
        description: 'Design complete email sequences',
        icon: Mail,
        color: 'bg-red-500',
    },
    {
        id: 'social_media',
        name: 'Social Media',
        description: 'Create platform-specific content calendars',
        icon: Share2,
        color: 'bg-cyan-500',
    },
    {
        id: 'seo',
        name: 'SEO & Content',
        description: 'Keyword research and content strategy',
        icon: Search,
        color: 'bg-indigo-500',
    },
    {
        id: 'pricing',
        name: 'Pricing Strategy',
        description: 'Design pricing tiers and packages',
        icon: DollarSign,
        color: 'bg-yellow-500',
    },
    {
        id: 'growth',
        name: 'Growth & CRO',
        description: 'Optimize your funnel and conversions',
        icon: TrendingUp,
        color: 'bg-emerald-500',
    },
    {
        id: 'deep_research',
        name: 'Deep Market Research',
        description: 'Generate comprehensive market research reports',
        icon: Search,
        color: 'bg-stone-500',
    },
    {
        id: 'image_generation',
        name: 'Ad Image Generator',
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
]

export default function AgentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
                <p className="text-muted-foreground mt-2">
                    Choose from 11 specialized AI agents to accelerate your business
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                    <Link key={agent.id} href={`/agents/${agent.id}`}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer h-full hover:scale-105">
                            <CardHeader>
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-lg ${agent.color} text-white`}>
                                        <agent.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                                        <CardDescription className="mt-1.5">
                                            {agent.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full">
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
