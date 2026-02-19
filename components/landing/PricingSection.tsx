'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Crown } from 'lucide-react'
import { GlowingButton } from './GlowingButton'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  href: string
  isUpgrade?: boolean
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for trying out UtilityAI',
    features: [
      '50 AI generations/month',
      'Access to all 4 agents',
      'Basic canvas workflows',
      'Email support',
    ],
    cta: 'Start for free',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For professionals and growing teams',
    features: [
      'Unlimited AI generations',
      'Priority GPU access',
      'Advanced orchestration',
      'API access',
      'Priority support',
      'Team collaboration',
    ],
    cta: 'Upgrade to Premium',
    popular: true,
    href: '/register',
    isUpgrade: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large teams with custom needs',
    features: [
      'Everything in Pro',
      'Custom model fine-tuning',
      'Dedicated infrastructure',
      'SLA guarantee',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact sales',
    href: '/register',
  },
]

export function PricingSection() {
  const { upgrade, isPremium } = useSubscription()

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((tier, i) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            'relative p-8 rounded-3xl',
            'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
            'border border-white/[0.08]',
            'backdrop-blur-sm',
            tier.popular && 'border-amber-500/50 shadow-[0_0_60px_-15px_rgba(245,158,11,0.4)]'
          )}
        >
          {/* Popular badge */}
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{tier.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{tier.price}</span>
              {tier.period && (
                <span className="text-white/50">{tier.period}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-white/60">{tier.description}</p>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-sm text-white/70">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {tier.isUpgrade ? (
            /* Upgrade button for Pro tier — calls context upgrade() */
            isPremium ? (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
                <Crown className="w-4 h-4" />
                Premium Active
              </div>
            ) : (
              <button
                id="pricing-upgrade-btn"
                onClick={upgrade}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 text-sm font-semibold hover:from-amber-400 hover:to-orange-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] transition-all hover:scale-[1.02] active:scale-100"
              >
                <Sparkles className="w-4 h-4" />
                {tier.cta}
              </button>
            )
          ) : (
            <GlowingButton
              href={tier.href}
              variant={tier.popular ? 'primary' : 'secondary'}
              className="w-full justify-center"
            >
              {tier.cta}
            </GlowingButton>
          )}
        </motion.div>
      ))}
    </div>
  )
}
