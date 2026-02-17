'use client'

import React, { useRef } from 'react'
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
import { ParticleCard, BentoCardGrid, GlobalSpotlight } from '@/components/ui/MagicBento'

const quickActions = [
  {
    title: 'Start New Flow',
    description: 'Automate a new task',
    href: '/onboarding',
    icon: Sparkles,
    accent: 'amber',
    label: 'Automation'
  },
  {
    title: 'Edit Project',
    description: 'Continue on canvas',
    href: '/canvas',
    icon: Layers,
    accent: 'teal',
    label: 'Design'
  },
]

const stats = [
  { name: 'AI Agents', value: '4', icon: Sparkles, label: 'Resources' },
  { name: 'Active Sessions', value: '12', icon: Zap, label: 'Activity' },
]

const agentsList = [
  { name: 'Deep Research', href: '/agents/deep_research', desc: 'Market analysis', label: 'Analysis' },
  { name: 'Ad Image Generation', href: '/agents/image_generation', desc: 'Ad visuals', label: 'Visuals' },
  { name: 'LinkedIn Headshot', href: '/agents/linkedin_headshot', desc: 'Profile photos', label: 'Profile' },
  { name: 'Ad Copy Generator', href: '/agents/ad_copy', desc: 'Ad variations', label: 'Copy' },
]

const gettingStartedSteps = [
  { step: 'Complete onboarding', action: 'Start', href: '/onboarding', status: 'Pending' },
  { step: 'Try an AI agent', action: 'Explore', href: '/agents', status: 'Recommended' },
  { step: 'Explore premium features', action: 'View Plans', href: '/upgrade', status: 'Pro' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const gridRef = useRef<HTMLDivElement>(null)

  const displayName =
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'there')

  return (
    <div className="space-y-8 pb-12">
      <GlobalSpotlight gridRef={gridRef} spotlightRadius={400} glowColor="245, 158, 11" />

      {/* Welcome - Refined warm card */}
      <ParticleCard
        className="magic-bento-card !aspect-auto !min-h-0 overflow-hidden border-[#262626] bg-[#030303]"
        particleCount={8}
        enableTilt={false}
        enableMagnetism={false}
        glowColor="245, 158, 11"
      >
        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-500/80">
                System online
              </p>
            </div>
            <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 text-white/60">
              You have <span className="font-semibold text-amber-500">850 tokens</span> remaining this billing cycle.
            </p>
          </div>
          <Link href="/upgrade" className="shrink-0">
            <Button className="rounded-xl bg-amber-500 px-8 py-6 text-lg font-bold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/40">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </ParticleCard>

      {/* Bento: quick actions + stats (5 Equal Columns) */}
      <BentoCardGrid gridRef={gridRef} className="!grid-cols-1 !max-w-none md:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} className="flex">
            <ParticleCard
              className="magic-bento-card w-full !aspect-square group border-[#262626] bg-[#030303]"
              glowColor="245, 158, 11"
              enableTilt={false}
              particleCount={6}
            >
              <div className="magic-bento-card__header">
                <div className="magic-bento-card__label text-xs uppercase tracking-widest opacity-40">{action.label}</div>
                <action.icon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="magic-bento-card__content mt-auto">
                <h3 className="magic-bento-card__title text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{action.title}</h3>
                <p className="magic-bento-card__description opacity-50 text-white/80">{action.description}</p>
                <div className="mt-4 flex items-center text-sm font-bold text-amber-500 opacity-0 transition-all group-hover:opacity-100">
                  Launch <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </ParticleCard>
          </Link>
        ))}

        {stats.map((stat) => (
          <ParticleCard
            key={stat.name}
            className="magic-bento-card w-full !aspect-square border-[#262626] bg-[#030303]"
            glowColor="245, 158, 11"
            enableTilt={false}
            particleCount={4}
          >
            <div className="magic-bento-card__header">
              <div className="magic-bento-card__label text-xs uppercase tracking-widest opacity-40">{stat.label}</div>
              <stat.icon className="h-4 w-4 text-white/40" />
            </div>
            <div className="magic-bento-card__content mt-auto">
              <div className="text-4xl font-bold tracking-tighter text-amber-500">
                {stat.value}
              </div>
              <h3 className="text-sm font-medium text-white/60 mt-1">
                {stat.name}
              </h3>
            </div>
          </ParticleCard>
        ))}
      </BentoCardGrid>

      {/* AI Agents bento */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
              AI Agents
            </h2>
            <p className="text-sm text-white/50">
              Launch an agent or chain them in the canvas.
            </p>
          </div>
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
              View All Agents <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <BentoCardGrid className="!grid-cols-1 !max-w-none sm:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
          {agentsList.map((agent) => (
            <Link key={agent.name} href={agent.href} className="flex">
              <ParticleCard
                className="magic-bento-card w-full group !aspect-square border-[#262626] bg-[#030303] flex flex-col pt-8 magic-bento-card--static-glow"
                glowColor="245, 158, 11"
                enableTilt={false}
                particleCount={4}
              >
                <div className="magic-bento-card__header">
                  <div className="magic-bento-card__label text-[10px] uppercase tracking-widest opacity-40">{agent.label}</div>
                  <Target className="h-4 w-4 text-amber-500/30 group-hover:text-amber-500 transition-colors" />
                </div>
                <div className="magic-bento-card__content mt-auto">
                  <h3 className="magic-bento-card__title text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {agent.name}
                  </h3>
                  <p className="magic-bento-card__description text-xs opacity-50 text-white/70">
                    {agent.desc}
                  </p>
                </div>
              </ParticleCard>
            </Link>
          ))}
        </BentoCardGrid>
      </div>

      {/* Getting started - Refined table-based UI */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#030303] shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#262626] bg-white/5 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Getting Started</h2>
            <p className="text-sm text-white/50">Complete these steps to maximize your productivity.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Steps to take</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Category</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-white/40">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {gettingStartedSteps.map((row) => (
                <tr key={row.step} className="group hover:bg-amber-500/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 group-hover:scale-150 transition-transform" />
                      <span className="text-sm font-medium text-white/80">{row.step}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${row.status === 'Pro' ? 'bg-amber-500 text-black' :
                      row.status === 'Pending' ? 'bg-white/10 text-white' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={row.href}>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-bold px-6 shadow-lg shadow-amber-500/10 transition-all active:scale-95"
                      >
                        {row.action}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
