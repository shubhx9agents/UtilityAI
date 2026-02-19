import { createServiceRoleClient } from '@/lib/supabase/service-role'

// ─────────────────────────────────────────────
// Plan limit constants
// ─────────────────────────────────────────────
export const PLAN_LIMITS = {
    free: {
        outputs: 10,   // total successful agent outputs across ALL agents
        canvas: 3,    // total canvas workflows that can be created
    },
    premium: {
        outputs: 50,
        canvas: 20,
    },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS

// Backwards-compat alias used in some UI components
export const PLAN_LIMITS_COMPAT = {
    free: { per_agent: PLAN_LIMITS.free.outputs, canvas: PLAN_LIMITS.free.canvas },
    premium: { per_agent: PLAN_LIMITS.premium.outputs, canvas: PLAN_LIMITS.premium.canvas },
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface UserUsage {
    total_credits_used: number
    canvas_creations_used: number
}

export interface CreditCheckResult {
    allowed: boolean
    reason: string
    used?: number
    limit?: number
}

// ─────────────────────────────────────────────
// Get user's plan type from profiles table
// ─────────────────────────────────────────────
export async function getUserPlan(userId: string): Promise<PlanKey> {
    const supabase = createServiceRoleClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', userId)
        .single()

    return profile?.account_type === 'premium' || profile?.account_type === 'enterprise'
        ? 'premium'
        : 'free'
}

// ─────────────────────────────────────────────
// Get user's current usage
// ─────────────────────────────────────────────
export async function getUserUsage(userId: string): Promise<UserUsage> {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
        .from('user_usage')
        .select('total_credits_used, canvas_creations_used')
        .eq('user_id', userId)
        .single()

    if (!data) {
        return { total_credits_used: 0, canvas_creations_used: 0 }
    }

    return {
        total_credits_used: data.total_credits_used ?? 0,
        canvas_creations_used: data.canvas_creations_used ?? 0,
    }
}

// ─────────────────────────────────────────────
// Pre-check agent credit (read-only, no deduction)
// Use this BEFORE the AI call to give an early 402.
// ─────────────────────────────────────────────
export async function preCheckAgentCredit(
    userId: string,
): Promise<CreditCheckResult> {
    const plan = await getUserPlan(userId)
    const maxTotal = PLAN_LIMITS[plan].outputs

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('pre_check_agent_credit', {
        p_user_id: userId,
        p_max_total: maxTotal,
    })

    if (error) {
        console.error('[Credits] pre_check_agent_credit error:', error)
        throw new Error('Failed to check credits')
    }

    const result = data as { allowed: boolean; reason: string; used: number; limit: number }
    return { allowed: result.allowed, reason: result.reason, used: result.used, limit: result.limit }
}

// ─────────────────────────────────────────────
// Deduct agent credit AFTER a successful AI response
// Atomic: re-checks limit under a row lock to prevent double-spend.
// Returns { allowed: false } if the slot was taken by a concurrent request.
// ─────────────────────────────────────────────
export async function deductAgentCreditOnSuccess(
    userId: string,
    agentType: string,
): Promise<CreditCheckResult> {
    const plan = await getUserPlan(userId)
    const maxTotal = PLAN_LIMITS[plan].outputs

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('deduct_agent_credit_v2', {
        p_user_id: userId,
        p_agent_type: agentType,
        p_max_total: maxTotal,
    })

    if (error) {
        console.error('[Credits] deduct_agent_credit_v2 error:', error)
        // Don't throw — log and allow (prevents blocking legitimate responses on DB hiccups)
        return { allowed: true, reason: 'db_error_passthrough' }
    }

    const result = data as { allowed: boolean; reason: string; used: number; limit: number }
    return { allowed: result.allowed, reason: result.reason, used: result.used, limit: result.limit }
}

// ─────────────────────────────────────────────
// Enforce + deduct canvas creation credit (atomic, unchanged logic)
// ─────────────────────────────────────────────
export async function enforceAndDeductCanvasCredit(
    userId: string
): Promise<CreditCheckResult> {
    const plan = await getUserPlan(userId)
    const maxCanvas = PLAN_LIMITS[plan].canvas

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('deduct_canvas_credit', {
        p_user_id: userId,
        p_max_canvas: maxCanvas,
    })

    if (error) {
        console.error('[Credits] deduct_canvas_credit error:', error)
        throw new Error('Failed to check/deduct canvas credits')
    }

    const result = data as { allowed: boolean; reason: string; used: number; limit: number }
    return { allowed: result.allowed, reason: result.reason, used: result.used, limit: result.limit }
}

// ─────────────────────────────────────────────
// Build a structured 402 error response payload
// ─────────────────────────────────────────────
export function creditExhaustedResponse(check: CreditCheckResult) {
    return {
        error: 'Credits exhausted. Please upgrade your plan.',
        code: 'CREDITS_EXHAUSTED',
        details: {
            reason: check.reason,
            used: check.used,
            limit: check.limit,
        },
    }
}
