'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Sparkles, X, Zap, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/contexts/SubscriptionContext'

export function UpgradeModal() {
    const { showUpgradeModal, closeUpgradeModal } = useSubscription()

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeUpgradeModal()
        },
        [closeUpgradeModal]
    )

    useEffect(() => {
        if (showUpgradeModal) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [showUpgradeModal, handleKeyDown])

    return (
        <AnimatePresence>
            {showUpgradeModal && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="upgrade-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
                        onClick={closeUpgradeModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        key="upgrade-modal"
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-950 shadow-2xl shadow-amber-500/20 overflow-hidden pointer-events-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="upgrade-modal-title"
                        >
                            {/* Ambient glow overlay */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-orange-900/5 pointer-events-none" />

                            {/* Shimmer sweep */}
                            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                                <div className="absolute inset-0 w-2/3 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-shimmer-sweep" />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={closeUpgradeModal}
                                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                                aria-label="Close modal"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="relative p-8 text-center">
                                {/* Icon + crown badge */}
                                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                                    {/* Outer glow ring */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-xl animate-pulse" />
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-30 blur-md" />
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40">
                                        <Crown className="h-9 w-9 text-zinc-900" strokeWidth={2.5} />
                                    </div>
                                    {/* Sparkle badge */}
                                    <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 border-2 border-amber-500/60">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                    </div>
                                </div>

                                {/* Headline */}
                                <h2
                                    id="upgrade-modal-title"
                                    className="font-heading text-2xl font-bold text-white mb-2"
                                >
                                    Your plan has been{' '}
                                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                        upgraded !
                                    </span>
                                </h2>

                                <p className="text-white/60 text-sm leading-relaxed mb-6">
                                    Welcome to <span className="text-amber-400 font-semibold">Premium</span>. You now
                                    have access to unlimited AI tokens, priority processing, and all advanced features.
                                </p>

                                {/* Feature pills */}
                                <div className="flex flex-wrap justify-center gap-2 mb-8">
                                    {[
                                        { icon: Zap, label: 'Unlimited Tokens' },
                                        { icon: CheckCircle, label: 'Priority Access' },
                                        { icon: Sparkles, label: 'All Features' },
                                    ].map(({ icon: Icon, label }) => (
                                        <span
                                            key={label}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
                                        >
                                            <Icon className="h-3 w-3" />
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <Button
                                    onClick={closeUpgradeModal}
                                    id="upgrade-modal-close-btn"
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-bold text-base hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-[1.02] active:scale-100"
                                >
                                    Start Exploring Premium
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
