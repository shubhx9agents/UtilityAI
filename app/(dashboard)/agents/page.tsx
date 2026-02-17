'use client'

import Link from 'next/link'
import {
  Sparkles,
  Image,
  Share2,
  Search,
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

import { ParticleCard, BentoCardGrid } from '@/components/ui/MagicBento'
import { ArrowRight, Target } from 'lucide-react'

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white mb-2">
          AI Agents
        </h1>
        <p className="text-white/50">
          Choose from 4 specialized AI agents to accelerate your business.
        </p>
      </div>

      <BentoCardGrid className="!grid-cols-1 !max-w-none md:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`} className="flex">
            <ParticleCard
              className="magic-bento-card w-full !aspect-square group border-[#262626] bg-[#030303] flex flex-col pt-8 magic-bento-card--static-glow"
              glowColor="245, 158, 11"
              enableTilt={false}
              particleCount={0}
            >
              <div className="magic-bento-card__header">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-4 transition-transform group-hover:scale-110`}>
                  <agent.icon className="h-6 w-6" />
                </div>
                <Target className="h-4 w-4 text-amber-500/20 group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="magic-bento-card__content mt-auto">
                <h3 className="magic-bento-card__title text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  {agent.name}
                </h3>
                <p className="magic-bento-card__description text-sm opacity-50 text-white/70 line-clamp-2">
                  {agent.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-bold text-amber-500 opacity-0 transition-all group-hover:opacity-100">
                  Select Agent <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </ParticleCard>
          </Link>
        ))}
      </BentoCardGrid>
    </div>
  )
}
