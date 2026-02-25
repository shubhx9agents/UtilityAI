'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { ParticleCard, BentoCardGrid } from '@/components/ui/MagicBento'
import { ArrowRight, Play } from 'lucide-react'

const agents = [
  {
    id: 'deep_research',
    name: 'Deep Research',
    description: 'Comprehensive market analysis and competitor research',
    svgSrc: '/landing_page_deep_research.svg',
    label: 'Analysis',
    color: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
    href: '/agents/deep_research',
  },
  {
    id: 'image_generation',
    name: 'Ad Image Generation',
    description: 'Generate and edit advertisement images with AI',
    svgSrc: '/landing_page_ad_image.svg',
    label: 'Visuals',
    color: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/10',
    href: '/agents/image_generation',
  },
  {
    id: 'linkedin_headshot',
    name: 'LinkedIn Headshot',
    description: 'Generate professional LinkedIn headshots',
    svgSrc: '/landing_page_linkedin.svg',
    label: 'Profile',
    color: 'from-cyan-500 to-blue-600',
    bgGlow: 'bg-cyan-500/10',
    href: '/agents/linkedin_headshot',
  },
  {
    id: 'ad_copy',
    name: 'Ad Copy Generator',
    description: 'Generate high-converting ad variations in CSV format',
    svgSrc: '/landing_page_ad_copy.svg',
    label: 'Copy',
    color: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
    href: '/agents/ad_copy',
  },
  {
    id: 'book_writing',
    name: 'Book Writing Agent',
    description: 'Generate complete, structured books with AI ghostwriting',
    svgSrc: '/landing_page_book_writing.svg',
    label: 'Writing',
    color: 'from-purple-500 to-violet-600',
    bgGlow: 'bg-purple-500/10',
    href: '/agents/book_writing',
  },
]

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white mb-2">
          AI Agents
        </h1>
        <p className="text-white/50">
          Choose from 5 specialized AI agents to accelerate your business.
        </p>
      </div>

      <BentoCardGrid className="!grid-cols-1 !max-w-none sm:!grid-cols-2 lg:!grid-cols-4 gap-4 !p-0">
        {agents.map((agent) => (
          <Link key={agent.id} href={agent.href} className="flex">
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
                  {agent.description}
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
  )
}
