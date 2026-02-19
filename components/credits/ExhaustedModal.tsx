'use client'

import { useEffect, useState } from 'react'
import { useCredits } from '@/contexts/CreditsContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Zap, X, Crown, TrendingUp } from 'lucide-react'

/**
 * ExhaustedModal — shown on dashboard load for FREE users whose credits are exhausted.
 * Premium users do NOT see this modal (they have higher limits).
 */
export function ExhaustedModal() {
    const { exhausted, usage, limits, loading } = useCredits()
    const { plan, upgrade } = useSubscription()
    const [open, setOpen] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (loading || dismissed) return
        // Only show to free users with any exhausted agents or canvas
        if (plan !== 'free') return
        if (exhausted.any_agent || exhausted.canvas) {
            setOpen(true)
        }
    }, [loading, plan, exhausted, dismissed])

    if (!open) return null

    const handleUpgrade = () => {
        upgrade()
        setOpen(false)
    }

    const handleClose = () => {
        setOpen(false)
        setDismissed(true)
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
                <div className="relative rounded-2xl border border-amber-500/30 bg-zinc-950 shadow-2xl shadow-amber-500/10 overflow-hidden">
                    {/* Gradient top bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="p-7">
                        {/* Icon */}
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <Zap className="h-8 w-8 text-amber-500" />
                        </div>

                        {/* Heading */}
                        <h2 className="text-center text-xl font-bold text-white mb-2">
                            Free Credits Exhausted
                        </h2>
                        <p className="text-center text-sm text-zinc-400 mb-6">
                            You have used all your free credits. Upgrade for more access.
                        </p>

                        {/* Usage summary */}
                        <div className="mb-6 rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Credits Used</span>
                                <span className="font-semibold text-white">
                                    {usage.total_credits_used} / {limits.outputs}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Canvas Creations</span>
                                <span className="font-semibold text-white">
                                    {usage.canvas_creations_used} / {limits.canvas}
                                </span>
                            </div>
                        </div>

                        {/* Premium benefits */}
                        <ul className="mb-6 space-y-2">
                            {[
                                '50 total credits (5× more)',
                                '20 Canvas creations (6× more)',
                                'Priority AI processing',
                            ].map((benefit) => (
                                <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>

                        {/* CTA buttons */}
                        <button
                            onClick={handleUpgrade}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-900 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30 mb-3"
                        >
                            <Crown className="h-4 w-4" />
                            Upgrade to Premium
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full rounded-xl border border-white/10 px-6 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
