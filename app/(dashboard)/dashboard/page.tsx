'use client'

import React, { useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useCredits } from '@/contexts/CreditsContext'
import { ExhaustedModal } from '@/components/credits/ExhaustedModal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Palette,
  Box,
  Activity,
  Play,
  Rocket,
  Star,
  Crown,
} from 'lucide-react'
import { ParticleCard, BentoCardGrid, GlobalSpotlight } from '@/components/ui/MagicBento'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const quickActions = [
  {
    title: 'Start New Flow',
    description: 'Automate a new task',
    href: '/onboarding',
    icon: Workflow,
    accent: 'amber',
    label: 'Automation',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
  },
  {
    title: 'Edit Project',
    description: 'Continue on canvas',
    href: '/canvas',
    icon: Palette,
    accent: 'teal',
    label: 'Design',
    gradient: 'from-teal-500/20 via-cyan-500/10 to-transparent',
  },
]

// Dynamic stats are inside the component now

const agentsList = [
  {
    name: 'Deep Research',
    href: '/agents/deep_research',
    desc: 'Market analysis',
    label: 'Analysis',
    svgSrc: '/landing_page_deep_research.svg',
    color: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10'
  },
  {
    name: 'Ad Image Generation',
    href: '/agents/image_generation',
    desc: 'Ad visuals',
    label: 'Visuals',
    svgSrc: '/landing_page_ad_image.svg',
    color: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/10'
  },
  {
    name: 'LinkedIn Headshot',
    href: '/agents/linkedin_headshot',
    desc: 'Profile photos',
    label: 'Profile',
    svgSrc: '/landing_page_linkedin.svg',
    color: 'from-cyan-500 to-blue-600',
    bgGlow: 'bg-cyan-500/10'
  },
  {
    name: 'Ad Copy Generator',
    href: '/agents/ad_copy',
    desc: 'Ad variations',
    label: 'Copy',
    svgSrc: '/landing_page_ad_copy.svg',
    color: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10'
  },
  {
    name: 'Course/Coaching Generator',
    href: '/agents/course_generator',
    desc: 'Structured curricula',
    label: 'Program',
    svgSrc: '/landing_page_deep_research.svg',
    color: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/10'
  },
  {
    name: 'Book Writing Agent',
    href: '/agents/book_writing',
    desc: 'AI ghostwriting',
    label: 'Writing',
    svgSrc: '/landing_page_deep_research.svg',
    color: 'from-purple-500 to-violet-600',
    bgGlow: 'bg-purple-500/10'
  },
  {
    name: 'Webinar Script Generator',
    href: '/agents/webinar_script',
    desc: 'Engagement scripts',
    label: 'Presenting',
    svgSrc: '/landing_page_deep_research.svg',
    color: 'from-indigo-500 to-blue-600',
    bgGlow: 'bg-indigo-500/10'
  },
  {
    name: 'Reel Script Generator',
    href: '/agents/reel_script',
    desc: 'Viral IG Reels',
    label: 'Social',
    svgSrc: '/landing_page_ad_copy.svg',
    color: 'from-fuchsia-500 to-pink-600',
    bgGlow: 'bg-fuchsia-500/10'
  }
]

const gettingStartedSteps = [
  { step: 'Complete onboarding', action: 'Start', href: '/onboarding', status: 'Pending', icon: Rocket, progress: 0 },
  { step: 'Try an AI agent', action: 'Explore', href: '/agents', status: 'Recommended', icon: Sparkles, progress: 0 },
  { step: 'Explore premium features', action: 'View Plans', href: '/upgrade', status: 'Pro', icon: Star, progress: 0 },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { isPremium, upgrade } = useSubscription()
  const { usage, limits } = useCredits()
  const gridRef = useRef<HTMLDivElement>(null)
  
  const [activeSessions, setActiveSessions] = useState('0')

  useEffect(() => {
    const fetchSessionCount = async () => {
      if (!user?.id) return
      const supabase = createClient()
      const { count } = await supabase
        .from('agent_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      if (count !== null) {
        setActiveSessions(count.toString())
      }
    }
    fetchSessionCount()
  }, [user?.id])

  const stats = [
    { name: 'AI Agents', value: agentsList.length.toString(), icon: Box, label: 'Resources', color: 'text-blue-400' },
    { name: 'Active Sessions', value: activeSessions, icon: Activity, label: 'Activity', color: 'text-emerald-400' },
  ]

  const displayName =
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'there')

  return (
    <div className="space-y-8 pb-12">
      {/* Credit exhaustion modal for free users */}
      <ExhaustedModal />
      <GlobalSpotlight gridRef={gridRef} spotlightRadius={400} glowColor="245, 158, 11" />

      {/* Welcome - Premium hero card with subtle gradient border */}
      <ParticleCard
        className="magic-bento-card !aspect-auto !min-h-0 overflow-hidden border border-amber-500/20 bg-[#030303] relative noise-overlay"
        particleCount={12}
        enableTilt={false}
        enableMagnetism={false}
        glowColor="245, 158, 11"
      >
        {/* Subtle corner glow accents */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

        {/* Shimmer sweep overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none z-20">
          <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-sweep" />
        </div>

        {/* Inner content container */}
        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                System online
              </p>
            </div>
            <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">{displayName}</span>
            </h1>
            <p className="mt-2 text-white/50">
              You have{' '}
              <span className="font-bold text-amber-500">
                {Math.max(0, limits.outputs - usage.total_credits_used)} credits
              </span>{' '}
              remaining this cycle.
            </p>
          </div>

          {/* Upgrade / Premium badge */}
          {isPremium ? (
            <div className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30">
              <Crown className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">Premium Active</span>
            </div>
          ) : (
            <button
              id="dashboard-upgrade-btn"
              onClick={upgrade}
              className="group shrink-0 relative rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-8 py-4 text-base font-bold text-black transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 active:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                Upgrade Plan
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          )}
        </div>
      </ParticleCard>

      {/* Bento: quick actions + stats with premium visuals */}
      <BentoCardGrid gridRef={gridRef} className="!grid-cols-1 !max-w-none md:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} className="flex">
            <ParticleCard
              className="magic-bento-card w-full !aspect-square group border-[#262626] bg-[#030303] relative overflow-hidden hover:scale-[1.03] hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 noise-overlay"
              glowColor="245, 158, 11"
              enableTilt={false}
              particleCount={6}
            >
              {/* Vibrant base gradient - always visible */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient.replace('/20', '/40').replace('/10', '/20')} opacity-100`} />

              {/* Multiple glassmorphism layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />

              {/* Animated gradient bloom on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient.replace('/20', '/60').replace('/10', '/40')} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

              {/* Large centered icon with halo glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative animate-breathe">
                  {/* Triple-layer icon glow halo */}
                  <div className="absolute -inset-8 rounded-full bg-amber-500/5 blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
                  <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/30 transition-all duration-500" />
                  <action.icon className="h-20 w-20 text-white/20 group-hover:text-white/50 transition-all duration-500 group-hover:scale-110 drop-shadow-2xl" strokeWidth={1} />
                </div>
              </div>

              <div className="magic-bento-card__header relative z-10">
                <div className="magic-bento-card__label text-xs uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-all">{action.label}</div>
                <div className="relative p-2.5 rounded-xl bg-white/10 group-hover:bg-amber-500/30 transition-all duration-500 shadow-lg shadow-black/20 group-hover:shadow-amber-500/20 animate-halo-glow">
                  <action.icon className="h-5 w-5 text-amber-400 transition-all duration-500 group-hover:scale-125 group-hover:text-amber-300" />
                </div>
              </div>
              <div className="magic-bento-card__content mt-auto relative z-10">
                <h3 className="magic-bento-card__title text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300 drop-shadow-lg">{action.title}</h3>
                <p className="magic-bento-card__description text-white/60 group-hover:text-white/90 transition-colors">{action.description}</p>
                {/* Launch text always visible - brighter on hover */}
                <div className="mt-4 flex items-center text-sm font-bold text-amber-500/60 group-hover:text-amber-400 transition-all duration-300">
                  <Play className="mr-1.5 h-4 w-4 fill-current" /> Launch
                </div>
              </div>
            </ParticleCard>
          </Link>
        ))}

        {stats.map((stat) => (
          <ParticleCard
            key={stat.name}
            className="magic-bento-card w-full !aspect-square border-[#262626] bg-[#030303] group relative overflow-hidden hover:scale-[1.03] hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 noise-overlay"
            glowColor="245, 158, 11"
            enableTilt={false}
            particleCount={4}
          >
            {/* Matching gradient background like action cards */}
            <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent`} />

            {/* Glassmorphism layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />

            {/* Animated radial gradient bloom on hover */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-500/20 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Large background number with breathing effect */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="text-[140px] font-black text-white/[0.04] group-hover:text-white/[0.08] transition-all duration-700 group-hover:scale-110 animate-breathe drop-shadow-2xl">
                {stat.value}
              </span>
            </div>

            <div className="magic-bento-card__header relative z-10">
              <div className="magic-bento-card__label text-xs uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-all">{stat.label}</div>
              <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-amber-500/20 transition-all duration-500 shadow-lg shadow-black/20 group-hover:shadow-amber-500/20">
                <stat.icon className={`h-5 w-5 ${stat.color} transition-all duration-500 group-hover:scale-125`} />
              </div>
            </div>
            <div className="magic-bento-card__content mt-auto relative z-10">
              <div className="text-5xl font-black tracking-tighter bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:via-amber-300 group-hover:to-amber-500 transition-all duration-500 drop-shadow-lg">
                {stat.value}
              </div>
              <h3 className="text-sm font-medium text-white/60 mt-1 group-hover:text-white/90 transition-colors">
                {stat.name}
              </h3>
            </div>
          </ParticleCard>
        ))}
      </BentoCardGrid>

      {/* AI Agents - Premium card design with icons */}
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
            <Button variant="ghost" size="sm" className="group text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl">
              View All Agents <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <BentoCardGrid className="!grid-cols-1 !max-w-none sm:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
          {agentsList.map((agent) => (
            <Link key={agent.name} href={agent.href} className="flex">
              <ParticleCard
                className="magic-bento-card w-full group !aspect-square border-[#262626] bg-[#030303] flex flex-col relative overflow-hidden hover:scale-[1.03] hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 noise-overlay"
                glowColor="245, 158, 11"
                enableTilt={false}
                particleCount={4}
              >
                {/* Vibrant colored gradient background - always visible */}
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-[0.15]`} />

                {/* Glassmorphism layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />

                {/* Animated gradient bloom on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-[0.25] transition-opacity duration-700`} />

                {/* Large centered agent icon with halo glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`relative flex h-28 w-28 items-center justify-center rounded-3xl ${agent.bgGlow.replace('/10', '/20')} border border-white/10 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:border-white/20 animate-breathe`}>
                    {/* Triple-layer icon glow halo */}
                    <div className={`absolute -inset-6 rounded-full bg-gradient-to-br ${agent.color} opacity-10 blur-3xl group-hover:opacity-30 transition-all duration-700`} />
                    <div className={`absolute -inset-3 rounded-full bg-gradient-to-br ${agent.color} opacity-20 blur-2xl group-hover:opacity-40 transition-all duration-500`} />
                    <NextImage src={agent.svgSrc} alt={agent.name} width={56} height={56} className="h-14 w-14 object-contain drop-shadow-lg" />
                  </div>
                </div>

                {/* Bottom gradient fade for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#030303] via-[#030303]/90 to-transparent" />

                <div className="magic-bento-card__header relative z-10">
                  <div className="magic-bento-card__label text-[10px] uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">{agent.label}</div>
                  <div className={`flex items-center gap-1.5`}>
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${agent.color} shadow-lg shadow-current animate-pulse`} />
                  </div>
                </div>
                <div className="magic-bento-card__content mt-auto relative z-10">
                  <h3 className="magic-bento-card__title text-base font-bold text-white group-hover:text-amber-300 transition-colors duration-300 drop-shadow-lg">
                    {agent.name}
                  </h3>
                  <p className="magic-bento-card__description text-xs text-white/50 group-hover:text-white/80 transition-colors">
                    {agent.desc}
                  </p>
                  {/* Launch indicator - always visible, brighter on hover */}
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-500/50 group-hover:text-amber-400 transition-all duration-300">
                    <Play className="h-3 w-3 fill-current" />
                    <span>Launch Agent</span>
                  </div>
                </div>
              </ParticleCard>
            </Link>
          ))}
        </BentoCardGrid>
      </div>

      {/* Getting started - Premium design with progress indicators */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#030303] shadow-xl relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />

        <div className="relative flex items-center gap-4 border-b border-white/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Getting Started</h2>
            <p className="text-sm text-white/50">Complete these steps to maximize your productivity.</p>
          </div>
          {/* Progress indicator */}
          <div className="ml-auto hidden sm:flex items-center gap-3">
            <div className="text-xs text-white/40">0 of 3 completed</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-1.5 w-6 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Steps to take</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">Category</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-white/40">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gettingStartedSteps.map((row) => (
                <tr key={row.step} className="group hover:bg-amber-500/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* Step icon with animation */}
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all">
                        <row.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{row.step}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.status === 'Pro' ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20' :
                      row.status === 'Pending' ? 'bg-white/10 text-white/60 border border-white/10' :
                        'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={row.href}>
                      <Button
                        size="sm"
                        className="h-9 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 font-bold px-6 shadow-lg shadow-amber-500/20 transition-all active:scale-95 hover:shadow-amber-500/30"
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
