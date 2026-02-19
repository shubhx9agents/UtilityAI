'use client'

import { useSubscription } from '@/contexts/SubscriptionContext'
import { ZapOff, Crown } from 'lucide-react'

interface ExhaustedBannerProps {
    message?: string
    /** show the upgrade button only for free users */
    showUpgrade?: boolean
    className?: string
}

/**
 * Inline banner shown above disabled agent inputs or Canvas create buttons
 * when the user has exhausted their credits.
 */
export function ExhaustedBanner({
    message = 'Credits exhausted. Please upgrade your plan.',
    showUpgrade = true,
    className = '',
}: ExhaustedBannerProps) {
    const { plan, upgrade } = useSubscription()
    const isFree = plan !== 'premium'

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 ${className}`}
            role="alert"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <ZapOff className="h-4 w-4 text-red-400" />
            </div>
            <p className="flex-1 text-sm text-red-300 font-medium">{message}</p>
            {showUpgrade && isFree && (
                <button
                    onClick={upgrade}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20"
                >
                    <Crown className="h-3 w-3" />
                    Upgrade
                </button>
            )}
        </div>
    )
}
