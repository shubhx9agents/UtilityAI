'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface PlanLimits {
    per_agent: number  // = outputs limit (kept for UI compat)
    outputs: number
    canvas: number
}

export interface UsageData {
    total_credits_used: number
    canvas_creations_used: number
}

export interface ExhaustionState {
    any_agent: boolean
    canvas: boolean
}

interface CreditsContextType {
    plan: 'free' | 'premium'
    limits: PlanLimits
    usage: UsageData
    exhausted: ExhaustionState
    loading: boolean
    /**
     * Returns true if the user has hit their total output aggregate limit.
     * agentType parameter is accepted for API compat but is not used for enforcement.
     */
    isAgentExhausted: (agentType?: string) => boolean
    /** True if the canvas creation quota is full */
    isCanvasExhausted: boolean
    /** Manually re-fetch usage (call after any agent run/canvas create) */
    refetchUsage: () => Promise<void>
}

const DEFAULT_LIMITS: PlanLimits = { per_agent: 10, outputs: 10, canvas: 3 }
const DEFAULT_USAGE: UsageData = { total_credits_used: 0, canvas_creations_used: 0 }
const DEFAULT_EXHAUSTED: ExhaustionState = { any_agent: false, canvas: false }

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function CreditsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [plan, setPlan] = useState<'free' | 'premium'>('free')
    const [limits, setLimits] = useState<PlanLimits>(DEFAULT_LIMITS)
    const [usage, setUsage] = useState<UsageData>(DEFAULT_USAGE)
    const [exhausted, setExhausted] = useState<ExhaustionState>(DEFAULT_EXHAUSTED)
    const [loading, setLoading] = useState(false)

    const fetchUsage = useCallback(async () => {
        if (!user?.id) {
            setPlan('free')
            setLimits(DEFAULT_LIMITS)
            setUsage(DEFAULT_USAGE)
            setExhausted(DEFAULT_EXHAUSTED)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/credits/usage')
            if (!res.ok) return
            const data = await res.json()
            setPlan(data.plan ?? 'free')
            setLimits({
                per_agent: data.limits?.per_agent ?? data.limits?.outputs ?? 10,
                outputs: data.limits?.outputs ?? data.limits?.per_agent ?? 10,
                canvas: data.limits?.canvas ?? 3,
            })
            setUsage({
                total_credits_used: data.usage?.total_credits_used ?? 0,
                canvas_creations_used: data.usage?.canvas_creations_used ?? 0,
            })
            setExhausted({
                any_agent: data.exhausted?.any_agent ?? false,
                canvas: data.exhausted?.canvas ?? false,
            })
        } catch (e) {
            console.error('[CreditsContext] Failed to fetch usage:', e)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    useEffect(() => { fetchUsage() }, [fetchUsage])

    // Aggregate check — agentType param kept for backward API compat only
    const isAgentExhausted = useCallback(
        (_agentType?: string) => usage.total_credits_used >= limits.outputs,
        [usage.total_credits_used, limits.outputs]
    )

    const isCanvasExhausted = usage.canvas_creations_used >= limits.canvas

    return (
        <CreditsContext.Provider
            value={{
                plan,
                limits,
                usage,
                exhausted,
                loading,
                isAgentExhausted,
                isCanvasExhausted,
                refetchUsage: fetchUsage,
            }}
        >
            {children}
        </CreditsContext.Provider>
    )
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useCredits() {
    const ctx = useContext(CreditsContext)
    if (!ctx) throw new Error('useCredits must be used within a CreditsProvider')
    return ctx
}
