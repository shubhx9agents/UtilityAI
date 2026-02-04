import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OrchestratorRequest } from '@/types'
import {
    ORCHESTRATOR_SYSTEM_PROMPT,
    ORCHESTRATOR_AGENTS,
    buildOrchestratorPrompt,
    parseOrchestratorResponse,
    generateDefaultWorkflow
} from '@/lib/ai/orchestrator'

// POST /api/canvas/orchestrate - Generate workflow plan from natural language
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { instruction, selected_agents, mode } = body

        if (!instruction && !selected_agents) {
            return NextResponse.json({
                error: 'Either instruction or selected_agents is required'
            }, { status: 400 })
        }

        // If just agents selected without instruction, generate default workflow
        if (selected_agents && !instruction) {
            const plan = generateDefaultWorkflow(
                selected_agents as string[],
                mode || 'sequential'
            )
            return NextResponse.json({ workflow_plan: plan })
        }

        // Build orchestrator request
        const agents = Object.entries(ORCHESTRATOR_AGENTS).map(([id, config]) => ({
            id,
            name: config.name,
            capabilities: config.capabilities,
            current_state: 'idle' as const
        }))

        // Get agent histories if needed
        let histories: any[] = []
        if (instruction.toLowerCase().includes('history') ||
            instruction.toLowerCase().includes('last') ||
            instruction.toLowerCase().includes('previous')) {
            // Fetch recent sessions for context
            const { data: sessions } = await supabase
                .from('agent_sessions')
                .select('id, agent_type, session_name, response, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (sessions) {
                // Group by agent type
                const sessionsByAgent: Record<string, any[]> = {}
                for (const session of sessions) {
                    if (!sessionsByAgent[session.agent_type]) {
                        sessionsByAgent[session.agent_type] = []
                    }
                    sessionsByAgent[session.agent_type].push({
                        session_id: session.id,
                        summary: session.session_name || 'Untitled session',
                        key_facts: [],
                        created_at: session.created_at
                    })
                }

                histories = Object.entries(sessionsByAgent).map(([agentId, sessions]) => ({
                    agent_id: agentId,
                    history_id: `history_${agentId}`,
                    last_sessions: sessions.slice(0, 3)
                }))
            }
        }

        const orchestratorRequest: OrchestratorRequest = {
            user_instruction: instruction,
            agents,
            histories
        }

        // Build prompt
        const prompt = buildOrchestratorPrompt(orchestratorRequest)

        // Call Groq API for orchestration
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Groq API error:', errorText)
            return NextResponse.json({ error: 'Failed to generate workflow plan' }, { status: 500 })
        }

        const data = await response.json()
        const llmResponse = data.choices[0]?.message?.content || ''

        // Parse the response
        const result = parseOrchestratorResponse(llmResponse)

        if (result.validation_errors && result.validation_errors.length > 0) {
            return NextResponse.json({
                workflow_plan: result.workflow_plan,
                validation_errors: result.validation_errors,
                warning: 'Generated plan has validation issues'
            })
        }

        return NextResponse.json({ workflow_plan: result.workflow_plan })
    } catch (error: any) {
        console.error('Orchestrate error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/canvas/orchestrate - Get available agents
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const agents = Object.entries(ORCHESTRATOR_AGENTS).map(([id, config]) => ({
            id,
            name: config.name,
            capabilities: config.capabilities
        }))

        return NextResponse.json({ agents })
    } catch (error: any) {
        console.error('Get agents error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
