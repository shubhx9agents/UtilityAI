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
import { AGENT_CONFIGS } from '@/lib/ai/agents'

type AgentInputSpec = {
    agent_id: string
    questions: string[]
}

const normalizeInputLabel = (label: string): string => {
    return label.replace(/\s+/g, ' ').trim()
}

const dedupeInputs = (inputs: string[]): string[] => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const input of inputs) {
        const normalized = normalizeInputLabel(input)
        const key = normalized.toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        result.push(normalized)
    }
    return result
}

const buildAgentInputSpecs = (agentIds: string[]): AgentInputSpec[] => {
    return agentIds
        .map(agentId => ({
            agent_id: agentId,
            questions: AGENT_CONFIGS[agentId as keyof typeof AGENT_CONFIGS]?.questions || []
        }))
        .filter(spec => spec.questions.length > 0)
}

const extractAgentIdsFromPlan = (plan: any): string[] => {
    const agentIds = new Set<string>()
    if (plan?.steps && Array.isArray(plan.steps)) {
        for (const step of plan.steps) {
            if (step?.agent_id) agentIds.add(step.agent_id)
        }
    }
    return Array.from(agentIds)
}

const parseJsonArray = (raw: string): string[] => {
    let jsonStr = raw.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
    }
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
        jsonStr = arrayMatch[0]
    }
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
}

const buildCombinedInputs = async (
    agentIds: string[],
    existingInputs: string[],
    groqApiKey: string
): Promise<string[]> => {
    const specs = buildAgentInputSpecs(agentIds)
    const fallbackInputs = dedupeInputs([
        ...existingInputs,
        ...specs.flatMap(spec => spec.questions)
    ])

    if (specs.length === 0) return fallbackInputs

    const prompt = `You are combining input fields for a multi-agent workflow.

Each agent has its own input questions. Merge them into a single, deduplicated list of user inputs for the workflow.
You may add missing but necessary inputs if the combined workflow would need them.

Return ONLY a JSON array of strings. Keep each string short, human-friendly, and specific.

Agents and their questions:
${JSON.stringify(specs, null, 2)}

Existing workflow inputs (if any):
${JSON.stringify(existingInputs, null, 2)}
`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a precise workflow input planner. Return only JSON arrays.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 600
            })
        })

        if (!response.ok) {
            return fallbackInputs
        }

        const data = await response.json()
        const llmResponse = data.choices?.[0]?.message?.content || ''
        const parsed = parseJsonArray(llmResponse)
        return dedupeInputs([...parsed, ...fallbackInputs])
    } catch (error) {
        console.warn('Combined input generation failed:', error)
        return fallbackInputs
    }
}

const applyCombinedInputsToPlan = (plan: any, combinedInputs: string[]) => {
    if (!plan?.steps || !Array.isArray(plan.steps) || combinedInputs.length === 0) return
    for (const step of plan.steps) {
        if (!step.input_mapping) {
            step.input_mapping = {}
        }
        step.input_mapping.from_user = combinedInputs
    }
}

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
            const groqApiKey = process.env.GROQ_API_KEY
            if (!groqApiKey) {
                return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
            }
            const combinedInputs = await buildCombinedInputs(
                selected_agents as string[],
                [],
                groqApiKey
            )
            applyCombinedInputsToPlan(plan, combinedInputs)
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

        const agentIds = extractAgentIdsFromPlan(result.workflow_plan)
        const existingInputs = result.workflow_plan.steps
            ?.flatMap(step => step.input_mapping?.from_user || []) || []
        const combinedInputs = await buildCombinedInputs(
            agentIds,
            existingInputs,
            groqApiKey
        )
        applyCombinedInputsToPlan(result.workflow_plan, combinedInputs)

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
