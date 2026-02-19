'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type PlanType = 'free' | 'premium'

type SubscriptionContextType = {
    plan: PlanType
    isPremium: boolean
    upgrade: () => void
    showUpgradeModal: boolean
    closeUpgradeModal: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const STORAGE_KEY_PREFIX = 'utilityai_plan_'

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [plan, setPlan] = useState<PlanType>('free')
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    const storageKey = user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : STORAGE_KEY_PREFIX + 'guest'

    // On user change: fetch plan from DB (source of truth), cache in localStorage
    useEffect(() => {
        if (!user?.id) {
            setPlan('free')
            return
        }

        // Show cached value instantly while DB fetch runs
        try {
            const cached = window.localStorage.getItem(storageKey)
            if (cached === 'premium') setPlan('premium')
        } catch { /* ignore */ }

        // Sync from DB
        fetch('/api/auth/subscription')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return
                const serverPlan: PlanType = data.type === 'premium' ? 'premium' : 'free'
                setPlan(serverPlan)
                try { window.localStorage.setItem(storageKey, serverPlan) } catch { /* ignore */ }
            })
            .catch(() => { /* keep cached value on network error */ })
    }, [user?.id, storageKey])

    const upgrade = useCallback(() => {
        if (plan === 'premium') return

        // Optimistically update UI
        setPlan('premium')
        try { window.localStorage.setItem(storageKey, 'premium') } catch { /* ignore */ }
        setShowUpgradeModal(true)

        // Persist to DB (fire and forget — UI already updated)
        fetch('/api/auth/upgrade', { method: 'POST' })
            .then(res => {
                if (!res.ok) console.error('Upgrade API failed:', res.status)
            })
            .catch(err => console.error('Upgrade network error:', err))
    }, [plan, storageKey])

    const closeUpgradeModal = useCallback(() => setShowUpgradeModal(false), [])

    return (
        <SubscriptionContext.Provider value={{ plan, isPremium: plan === 'premium', upgrade, showUpgradeModal, closeUpgradeModal }}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const ctx = useContext(SubscriptionContext)
    if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider')
    return ctx
}
