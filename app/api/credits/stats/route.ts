import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getUserPlan, getUserUsage, PLAN_LIMITS } from '@/lib/credits'
import { subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * GET /api/credits/stats
 * Returns detailed usage statistics for the dashboard.
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id
        const adminSupabase = createServiceRoleClient()

        console.log(`[StatsAPI] Fetching stats for user: ${userId}`)

        // 1. Fetch Plan & Usage Summary (using standard helpers to match sidebar/logic everywhere)
        const [plan, usage] = await Promise.all([
            getUserPlan(userId),
            getUserUsage(userId)
        ])

        console.log(`[StatsAPI] User Plan: ${plan}, Usage: ${usage.total_credits_used}`)

        const limits = PLAN_LIMITS[plan]

        // 2. Fetch Daily Usage Trend (Last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
        const { data: transactions, error: txError } = await adminSupabase
            .from('credit_transactions')
            .select('credits_consumed, created_at, action, agent_type')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo)
            .order('created_at', { ascending: true })

        if (txError) console.error('[StatsAPI] Transactions query error:', txError)
        console.log(`[StatsAPI] Found ${transactions?.length || 0} transactions since ${thirtyDaysAgo}`)

        // Process trend data
        const trendData: Record<string, number> = {}
        // Initialize last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
            trendData[date] = 0
        }

        const txs = transactions || []
        txs.forEach(tx => {
            // Important: parse the date in a way that handles UTC properly
            const date = format(new Date(tx.created_at), 'yyyy-MM-dd')
            if (trendData[date] !== undefined) {
                trendData[date] += tx.credits_consumed
            } else {
                // If it's a very recent transaction (same minute) it might slightly differ depending on server time
                // but usually subDays(new Date(), 30) covers it.
            }
        })

        const trendArray = Object.entries(trendData)
            .map(([date, credits]) => ({ date, credits }))
            .sort((a, b) => a.date.localeCompare(b.date))

        // 3. Usage Breakdown by Agent/Action
        const breakdown: Record<string, number> = {}
        txs.forEach(tx => {
            // Priority: agent_type > action
            const key = tx.agent_type || tx.action
            breakdown[key] = (breakdown[key] || 0) + tx.credits_consumed
        })

        const breakdownArray = Object.entries(breakdown)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        // 4. Workflow Stats
        const [workflowsCount, activeWorkflowsCount, executionsCount] = await Promise.all([
            adminSupabase.from('workflows').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            adminSupabase.from('workflows').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
            adminSupabase.from('workflow_executions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ])

        // 5. Recent History (Last 10 transactions)
        const { data: recentHistory } = await adminSupabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        const history = recentHistory || []

        return NextResponse.json({
            plan,
            limits,
            usage: {
                total_credits_used: usage.total_credits_used,
                canvas_creations_used: usage.canvas_creations_used,
                remaining_credits: Math.max(0, limits.outputs - usage.total_credits_used)
            },
            stats: {
                total_workflows: workflowsCount.count || 0,
                active_workflows: activeWorkflowsCount.count || 0,
                total_executions: executionsCount.count || 0
            },
            trend: trendArray,
            breakdown: breakdownArray,
            history: history
        })

    } catch (error: any) {
        console.error('Credits stats API error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stats' },
            { status: 500 }
        )
    }
}
