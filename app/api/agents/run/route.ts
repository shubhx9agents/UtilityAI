import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/agents'
import { AgentType } from '@/types'
import { preCheckAgentCredit, deductAgentCreditOnSuccess, creditExhaustedResponse } from '@/lib/credits'

export const maxDuration = 60 // Allow up to 60 seconds for long generation tasks

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { agent_type, input, context = {} } = body

        if (!agent_type || !input) {
            return NextResponse.json(
                { error: 'Missing required fields: agent_type and input' },
                { status: 400 }
            )
        }

        // ── 1. Pre-check credit limit (fast read-only gate, no deduction yet) ──
        const preCheck = await preCheckAgentCredit(user.id)
        if (!preCheck.allowed) {
            return NextResponse.json(creditExhaustedResponse(preCheck), { status: 402 })
        }

        // ── 2. Execute the AI agent ──
        context.user_id = user.id
        const response = await aiService.runAgent(
            agent_type as AgentType,
            input,
            context
        )

        // All agent types (text, image) place their output in the `response` field
        const responseText = response?.response || ''
        const errorKeywords = ['error:', 'failed:', 'denied', 'unauthorized', 'bad request', 'invalid']
        const isActuallyError = errorKeywords.some(kw => responseText.toLowerCase().includes(kw))

        const hasValidOutput = response &&
            typeof response === 'object' &&
            typeof responseText === 'string' &&
            responseText.trim().length > 10 &&
            !isActuallyError

        if (!hasValidOutput) {
            console.warn(`[Credits] Skipping deduction for suspicious or empty response from ${agent_type}`)
            return NextResponse.json({
                error: 'Agent returned an empty or invalid response',
                details: responseText.substring(0, 100)
            }, { status: 500 })
        }

        // ── 4. Deduct credit post-success (atomic re-check under DB lock) ──
        console.log(`[Credits] Deducting 1 credit for successful ${agent_type} run for user ${user.id}`)
        await deductAgentCreditOnSuccess(user.id, agent_type)

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Agent API Error:', error)
        // No credit deducted — error paths never charge
        return NextResponse.json(
            { error: error.message || 'Failed to run agent' },
            { status: 500 }
        )
    }
}
