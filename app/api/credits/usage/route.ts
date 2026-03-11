import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getUserUsage, PLAN_LIMITS } from '@/lib/credits'
import { getErrorMessage } from '@/lib/types/errors'

/**
 * GET /api/credits/usage
 * Returns current aggregate usage and limits for the authenticated user.
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [plan, usage] = await Promise.all([
            getUserPlan(user.id),
            getUserUsage(user.id),
        ])

        const limits = PLAN_LIMITS[plan]
        const agentExhausted = usage.total_credits_used >= limits.outputs
        const canvasExhausted = usage.canvas_creations_used >= limits.canvas

        return NextResponse.json({
            plan,
            limits: {
                per_agent: limits.outputs,   // kept for UI compat (sidebar progress bar)
                outputs: limits.outputs,
                canvas: limits.canvas,
            },
            usage: {
                total_credits_used: usage.total_credits_used,
                canvas_creations_used: usage.canvas_creations_used,
                // per_agent_credits omitted — no longer tracked for enforcement
            },
            exhausted: {
                any_agent: agentExhausted,
                canvas: canvasExhausted,
                // by_agent removed — enforcement is now aggregate-only
            },
        })
    } catch (error: unknown) {
        console.error('Credits usage API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
