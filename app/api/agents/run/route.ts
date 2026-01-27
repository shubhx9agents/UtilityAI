import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/agents'
import { AgentType } from '@/types'

export async function POST(request: NextRequest) {
    try {
        // Get user from session
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

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

        // Add user ID to context
        context.user_id = user.id

        // Run the AI agent
        const response = await aiService.runAgent(
            agent_type as AgentType,
            input,
            context
        )

        return NextResponse.json({ response })
    } catch (error: any) {
        console.error('Agent API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to run agent' },
            { status: 500 }
        )
    }
}
