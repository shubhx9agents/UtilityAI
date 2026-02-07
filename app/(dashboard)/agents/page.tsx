'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Sparkles,
  Image,
  Share2,
  Search,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

const agents = [
  {
    id: 'deep_research',
    name: 'Deep Research',
    description: 'Comprehensive market analysis and competitor research',
    icon: Search,
    accent: 'amber',
  },
  {
    id: 'image_generation',
    name: 'Ad Image Generation',
    description: 'Generate and edit advertisement images with AI',
    icon: Image,
    accent: 'rose',
  },
  {
    id: 'linkedin_headshot',
    name: 'LinkedIn Headshot',
    description: 'Generate professional LinkedIn headshots',
    icon: Sparkles,
    accent: 'teal',
  },
  {
    id: 'ad_copy',
    name: 'Ad Copy Generator',
    description: 'Generate high-converting ad variations in CSV format',
    icon: Share2,
    accent: 'orange',
  },
]

const accentMap: Record<string, string> = {
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  orange: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
}

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          AI Agents
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose from 4 specialized AI agents to accelerate your business
        </p>
      </div>

      <div className="bento-grid bento-grid-4 gap-4">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="h-full border-warm-border bg-warm-surface transition hover:border-amber-500/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentMap[agent.accent]}`}
                  >
                    <agent.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg text-foreground group-hover:text-amber-600">
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {agent.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-warm-border hover:bg-warm-muted"
                >
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
