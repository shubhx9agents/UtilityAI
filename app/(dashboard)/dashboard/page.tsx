'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import {
  Sparkles,
  Layers,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const quickActions = [
  {
    title: 'Start New Flow',
    description: 'Automate a new task',
    href: '/onboarding',
    icon: Sparkles,
    accent: 'amber',
  },
  {
    title: 'Edit Project',
    description: 'Continue on canvas',
    href: '/canvas',
    icon: Layers,
    accent: 'teal',
  },
  {
    title: 'Voice Command',
    description: 'Quick AI request',
    href: '/voice',
    icon: Target,
    accent: 'rose',
  },
]

const stats = [
  { name: 'AI Agents', value: '4', icon: Sparkles },
  { name: 'Active Sessions', value: '12', icon: Zap },
]

const agentsList = [
  { name: 'Deep Research', href: '/agents/deep_research', desc: 'Market analysis' },
  { name: 'Ad Image Generation', href: '/agents/image_generation', desc: 'Ad visuals' },
  { name: 'LinkedIn Headshot', href: '/agents/linkedin_headshot', desc: 'Profile photos' },
  { name: 'Ad Copy Generator', href: '/agents/ad_copy', desc: 'Ad variations' },
]

const gettingStartedSteps = [
  { step: 'Complete onboarding', action: 'Start', href: '/onboarding' },
  { step: 'Try an AI agent', action: 'Explore', href: '/agents' },
  { step: 'Explore premium features', action: 'View Plans', href: '/upgrade' },
]

const accentBg: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700',
  teal: 'bg-teal-100 text-teal-700',
  rose: 'bg-rose-100 text-rose-700',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const displayName =
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'there')

  return (
    <div className="space-y-8">
      {/* Welcome - warm card */}
      <Card className="overflow-hidden border-warm-border bg-warm-surface">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-700/80">
                System online
              </p>
              <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Welcome back, {displayName}
              </h1>
              <p className="mt-2 text-muted-foreground">
                <span className="font-semibold text-foreground">850 tokens</span>{' '}
                remaining this billing cycle.
              </p>
            </div>
            <Link href="/upgrade" className="shrink-0">
              <Button className="rounded-lg bg-amber-500 font-medium text-stone-900 hover:bg-amber-600">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Bento: quick actions + stats */}
      <div className="bento-grid bento-grid-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="h-full border-warm-border bg-warm-surface transition hover:border-amber-200 hover:shadow-md">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentBg[action.accent]}`}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading font-semibold text-foreground">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-amber-600">
                  Go <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}

        {stats.map((stat) => (
          <Card
            key={stat.name}
            className="border-warm-border bg-warm-surface"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-stone-400" />
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Agents bento */}
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          AI Agents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Launch an agent or chain them in the canvas.
        </p>
        <div className="bento-grid bento-grid-4 mt-4 gap-4">
          {agentsList.map((agent) => (
            <Link key={agent.name} href={agent.href}>
              <Card className="group h-full border-warm-border bg-warm-surface transition hover:border-amber-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-amber-600">
                        {agent.name}
                      </CardTitle>
                      <CardDescription>{agent.desc}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started - table */}
      <Card className="border-warm-border bg-warm-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Complete these to get the most out of UtilityAI
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-warm-border hover:bg-warm-muted/50">
                <TableHead className="font-medium text-foreground">Step</TableHead>
                <TableHead className="w-[140px] text-right font-medium text-stone-700">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gettingStartedSteps.map((row) => (
                <TableRow
                  key={row.step}
                  className="border-warm-border hover:bg-warm-muted/50"
                >
                  <TableCell className="text-foreground">{row.step}</TableCell>
                  <TableCell className="text-right">
                    <Link href={row.href}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-warm-border"
                      >
                        {row.action}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
