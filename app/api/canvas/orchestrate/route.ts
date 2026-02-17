import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OrchestratorRequest } from '@/types'
import {
    ORCHESTRATOR_SYSTEM_PROMPT,
    ORCHESTRATOR_AGENTS,
    buildOrchestratorPrompt,
    parseOrchestratorResponse,
    generateDefaultWorkflow,
    enforceLinearWorkflowPlan
} from '@/lib/ai/orchestrator'
import { AGENT_CONFIGS } from '@/lib/ai/agents'

type AgentInputSpec = {
    agent_id: string
    questions: string[]
    image_fields?: string[]
}

const IMAGE_MODEL_LABEL = 'Image Model'
const PRIMARY_USER_INPUT = {
    field: 'user_input',
    label: 'Current business/product context',
    type: 'text' as const
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
        .map(agentId => {
            const config = AGENT_CONFIGS[agentId as keyof typeof AGENT_CONFIGS]
            return {
                agent_id: agentId,
                questions: config?.questions || [],
                image_fields: config?.image_fields || []
            }
        })
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

const parseJsonOutput = (raw: string): any[] => {
    let jsonStr = raw.trim()
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
    }
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
        jsonStr = arrayMatch[0]
    }
    try {
        const parsed = JSON.parse(jsonStr)
        return Array.isArray(parsed) ? parsed : []
    } catch (e) {
        console.warn('Failed to parse JSON output:', e)
        return []
    }
}

const ensurePrimaryUserInput = (
    inputs: Array<{ field: string, label: string, type: 'text' | 'image' }>
): Array<{ field: string, label: string, type: 'text' | 'image' }> => {
    const seen = new Set<string>()
    const normalized: Array<{ field: string, label: string, type: 'text' | 'image' }> = []

    const ordered = [PRIMARY_USER_INPUT, ...inputs]
    for (const input of ordered) {
        const field = (input.field || '').trim().toLowerCase()
        if (!field || seen.has(field)) continue
        seen.add(field)
        normalized.push({
            field,
            label: input.label || field,
            type: input.type === 'image' ? 'image' : 'text'
        })
    }

    return normalized
}

const buildCombinedInputs = async (
    agentIds: string[],
    existingInputs: string[],
    groqApiKey: string
): Promise<Array<{ field: string, label: string, type: 'text' | 'image' }>> => {
    const specs = buildAgentInputSpecs(agentIds)
    const needsImageModel = agentIds.some(id => id === 'image_generation' || id === 'linkedin_headshot')

    // Fallback logic
    const allQuestions = Array.from(new Set([
        ...existingInputs,
        ...specs.flatMap(spec => spec.questions),
        ...(needsImageModel ? [IMAGE_MODEL_LABEL] : [])
    ]))

    const fallbackInputs = allQuestions.map(q => {
        const isImage = specs.some(s => s.image_fields?.includes(q))
        return {
            field: q.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            label: q,
            type: (isImage ? 'image' : 'text') as 'text' | 'image'
        }
    })

    if (specs.length === 0) return ensurePrimaryUserInput(fallbackInputs)

    const prompt = `You are designing a unified input form for a multi-agent AI workflow.
Your goal is to merge questions from multiple agents into a single, cohesive list of USER INPUTS.

RULES:
1. MAX 10 questions total.
2. If multiple agents ask for similar info (e.g., "Target Audience" and "Who is the audience?"), merge them into ONE question.
3. Preserve the "type": "image" for fields that require image uploads (like base images or user photos).
4. If any image agent is included, ALWAYS include "Image Model" as a text field.
5. Return ONLY a JSON array of objects with this structure:
   [{"field": "variable_name", "label": "Human Friendly Label", "type": "text" | "image"}]

Agents and their specific questions:
${JSON.stringify(specs, null, 2)}

Existing workflow inputs to consider:
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
                    { role: 'system', content: 'You are a precise workflow architect. You merge complex requirements into simple forms.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 1000
            })
        })

        if (!response.ok) return ensurePrimaryUserInput(fallbackInputs)

        const data = await response.json()
        const llmResponse = data.choices?.[0]?.message?.content || ''
        const parsed = parseJsonOutput(llmResponse)

        if (parsed.length === 0) return ensurePrimaryUserInput(fallbackInputs)

        const hasImageModel = parsed.some((item: any) => (item.label || '').toLowerCase() === 'image model' || item.field === 'image_model')
        if (needsImageModel && !hasImageModel) {
            if (parsed.length >= 10) {
                parsed.pop()
            }
            parsed.push({
                field: 'image_model',
                label: IMAGE_MODEL_LABEL,
                type: 'text'
            })
        }

        // Ensure valid structure and limit to 10
        const normalized = parsed.slice(0, 10).map((item: any) => ({
            field: item.field || 'input',
            label: item.label || 'Input',
            type: item.type === 'image' ? 'image' : 'text'
        }))
        return ensurePrimaryUserInput(normalized)
    } catch (error) {
        console.warn('Combined input generation failed:', error)
        return ensurePrimaryUserInput(fallbackInputs)
    }
}

const applyCombinedInputsToPlan = (plan: any, combinedInputs: Array<{ field: string, label: string, type: 'text' | 'image' }>) => {
    if (!plan?.steps || !Array.isArray(plan.steps) || combinedInputs.length === 0) return
    const normalizedInputs = ensurePrimaryUserInput(combinedInputs)
    const fields = normalizedInputs.map(i => i.field)
    for (const step of plan.steps) {
        if (!step.input_mapping) {
            step.input_mapping = {}
        }
        step.input_mapping.from_user = fields
        step.input_mapping.user_input_specs = normalizedInputs
    }
}

const getWorkflowMode = (mode: unknown): 'sequential' | 'parallel' | 'mixed' => {
    if (mode === 'parallel' || mode === 'mixed') return mode
    return 'sequential'
}

const normalizeSelectedAgents = (selectedAgents: unknown): string[] => {
    if (!Array.isArray(selectedAgents)) return []
    const allowed = new Set(Object.keys(ORCHESTRATOR_AGENTS))
    const seen = new Set<string>()
    const normalized: string[] = []

    for (const rawAgentId of selectedAgents) {
        if (typeof rawAgentId !== 'string') continue
        const agentId = rawAgentId.trim()
        if (!agentId || !allowed.has(agentId) || seen.has(agentId)) continue
        seen.add(agentId)
        normalized.push(agentId)
    }

    return normalized
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
        const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : ''
        const selectedAgents = normalizeSelectedAgents(body.selected_agents)
        const hasSelectedAgents = selectedAgents.length > 0
        const workflowMode = getWorkflowMode(body.mode)

        if (!instruction && !hasSelectedAgents) {
            return NextResponse.json({
                error: 'Either instruction or selected_agents is required'
            }, { status: 400 })
        }

        // If just agents selected without instruction, generate default workflow
        if (hasSelectedAgents && !instruction) {
            let plan = generateDefaultWorkflow(
                selectedAgents,
                workflowMode
            )

            // Enforce linear structure for sequential mode
            if (workflowMode === 'sequential') {
                plan = enforceLinearWorkflowPlan(plan)
            }

            const groqApiKey = process.env.GROQ_API_KEY
            if (!groqApiKey) {
                return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
            }
            const combinedInputs = await buildCombinedInputs(
                selectedAgents,
                [],
                groqApiKey
            )
            applyCombinedInputsToPlan(plan, combinedInputs)
            return NextResponse.json({ workflow_plan: plan })
        }

        // Build orchestrator request
        const availableAgentIds = hasSelectedAgents
            ? selectedAgents
            : Object.keys(ORCHESTRATOR_AGENTS)

        const agents = availableAgentIds.map(id => ({
            id,
            name: ORCHESTRATOR_AGENTS[id].name,
            capabilities: ORCHESTRATOR_AGENTS[id].capabilities,
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
        let prompt = buildOrchestratorPrompt(orchestratorRequest)
        if (hasSelectedAgents) {
            prompt += `\n\nIMPORTANT: Use ONLY these selected agent IDs: ${selectedAgents.join(', ')}.`
        }

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
        if (hasSelectedAgents) {
            const selectedAgentSet = new Set(selectedAgents)
            const planSteps = Array.isArray(result.workflow_plan?.steps)
                ? result.workflow_plan.steps
                : []
            const hasDisallowedAgent = planSteps.some(step => !selectedAgentSet.has(step.agent_id))
            const usedAgentIds = new Set(planSteps.map(step => step.agent_id))
            const missingSelectedAgent = selectedAgents.some(agentId => !usedAgentIds.has(agentId))

            if (hasDisallowedAgent || missingSelectedAgent) {
                result.workflow_plan = generateDefaultWorkflow(selectedAgents, workflowMode)
            }
        }

        // Enforce linear workflow structure
        console.log('BEFORE enforceLinear:', JSON.stringify(result.workflow_plan.steps.map(s => ({ id: s.step_id, depends_on: s.depends_on })), null, 2))
        console.log('BEFORE final_response_strategy.from_steps:', result.workflow_plan.final_response_strategy.from_steps)

        result.workflow_plan = enforceLinearWorkflowPlan(result.workflow_plan)

        console.log('AFTER enforceLinear:', JSON.stringify(result.workflow_plan.steps.map(s => ({ id: s.step_id, depends_on: s.depends_on })), null, 2))
        console.log('AFTER final_response_strategy.from_steps:', result.workflow_plan.final_response_strategy.from_steps)

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
