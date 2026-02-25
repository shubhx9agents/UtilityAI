import {
    AgentType,
    WorkflowPlan,
    WorkflowStep,
    StepInputMapping,
    FinalResponseStrategy,
    AgentHistoryContext,
    OrchestratorRequest,
    OrchestratorResponse,
} from '@/types'
import { AGENT_CONFIGS } from './agents'

// System prompt for the Canvas Orchestrator
export const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Canvas Orchestrator for UtilityAI.
Your job is to design multi-agent workflows. You do NOT execute agents - you only create the plan.

**Available Agents and Their EXACT Capabilities:**
1. **deep_research** - Market analysis, competitor research, industry trends. Best for: research tasks, market insights.
2. **ad_copy** - High-converting ad copy for multiple platforms (Facebook, Instagram, LinkedIn, Google). Creates variations with different angles. Outputs CSV format. Best for: advertising campaigns, A/B testing ad variations.
3. **image_generation** - Generate ONE advertisement image per call. LIMITATION: Can only create 1 image at a time.
4. **linkedin_headshot** - Generate professional LinkedIn headshots. LIMITATION: Only for profile photos.
5. **course_generator** - Generate complete, structured, execution-ready educational programs, courses, and coaching systems. Outputs in JSON format. Best for: curriculum design, program architecture, lesson planning.

**CRITICAL LIMITATIONS:**
- image_generation creates ONLY 1 image per step. For 5 images, you need 5 separate steps with image_generation.
- Each agent has a specific purpose. Use ad_copy for advertising copy.
- ad_copy outputs CSV format with columns: Platform, Angle, Headline, Body, CTA.
- Be realistic about what each agent can do.

**Workflow Structure:**
{
  "workflow_name": "string",
  "steps": [
    {
      "step_id": "string",
      "agent_id": "string",
      "description": "what this step does - be specific about the single output",
      "depends_on": ["step_id_1"],
      "input_mapping": {
        "from_user": ["field1"],
        "from_steps": {
          "step_id_1": ["output"]
        }
      }
    }
  ],
  "final_response_strategy": {
    "type": "merge_and_summarize",
    "from_steps": ["step_id_2", "step_id_3"],
    "instructions": "how to combine all outputs"
  }
}

**Example: "Create 3 ad images based on research"**
This requires 4 steps:
1. step_1_research (deep_research) - Do the research
2. step_2_image_1 (image_generation) - Create first ad image
3. step_3_image_2 (image_generation) - Create second ad image  
4. step_4_image_3 (image_generation) - Create third ad image

**Rules:**
- Always generate a SIMPLE LINEAR CHAIN (one-to-one connections) for orchestrator-generated workflows.
- Each step should depend on ONLY the immediately previous step (no automatic branching).
- final_response_strategy.from_steps must contain ONLY the last step_id.
- Use clear step_ids like "step_1_research", "step_2_ad_copy"
- For multiple images, create multiple image_generation steps in sequence
- Match agent_id to the task type correctly
- Avoid circular dependencies
- Return ONLY valid JSON

Note: Users can manually create branching workflows in the canvas, but orchestrator should generate linear chains.

Return only the JSON plan, no explanations.`

// Available agent definitions for orchestrator (only active agents)
export const ORCHESTRATOR_AGENTS: Record<string, { name: string; capabilities: string[] }> = {
    deep_research: {
        name: 'Deep Research',
        capabilities: ['Comprehensive market analysis', 'Competitor research', 'Industry trends', 'Target audience insights']
    },
    image_generation: {
        name: 'Ad Image Generation',
        capabilities: ['Generate advertisement images', 'Edit images with AI', 'Create visual content']
    },
    linkedin_headshot: {
        name: 'LinkedIn Headshot',
        capabilities: ['Generate professional headshots', 'Profile photo enhancement']
    },

    ad_copy: {
        name: 'Ad Copy Generator',
        capabilities: ['Generate high-converting ad copy for multiple platforms', 'Create variations with different angles (Problem-Solution, Benefit-Driven, Emotional)', 'Platform-specific copy (Facebook, Instagram, LinkedIn, Google)', 'CSV output with Platform, Angle, Headline, Body, CTA', 'A/B testing variations']
    },
    course_generator: {
        name: 'Course/Coaching Generator',
        capabilities: ['Complete curriculum design', 'Structured coaching program architecture', 'Modular learning system generation', 'Detailed lesson content and assessments', 'Delivery strategy and timeline planning']
    },
}

// Validate workflow plan structure
export function validateWorkflowPlan(plan: WorkflowPlan): string[] {
    const errors: string[] = []

    if (!plan.workflow_name || typeof plan.workflow_name !== 'string') {
        errors.push('workflow_name is required and must be a string')
    }

    if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
        errors.push('steps must be a non-empty array')
    }

    const stepIds = new Set<string>()
    const agentTypes = Object.keys(ORCHESTRATOR_AGENTS)

    for (const step of plan.steps) {
        if (!step.step_id) {
            errors.push('Each step must have a step_id')
            continue
        }

        if (stepIds.has(step.step_id)) {
            errors.push(`Duplicate step_id: ${step.step_id}`)
        }
        stepIds.add(step.step_id)

        if (!step.agent_id || !agentTypes.includes(step.agent_id)) {
            errors.push(`Invalid agent_id in step ${step.step_id}: ${step.agent_id}`)
        }

        // Check for circular dependencies
        if (step.depends_on) {
            for (const dep of step.depends_on) {
                if (dep === step.step_id) {
                    errors.push(`Step ${step.step_id} cannot depend on itself`)
                }
            }
        }
    }

    // Check for circular dependency chains
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function hasCycle(stepId: string): boolean {
        if (recursionStack.has(stepId)) return true
        if (visited.has(stepId)) return false

        visited.add(stepId)
        recursionStack.add(stepId)

        const step = plan.steps.find(s => s.step_id === stepId)
        if (step?.depends_on) {
            for (const dep of step.depends_on) {
                if (hasCycle(dep)) return true
            }
        }

        recursionStack.delete(stepId)
        return false
    }

    for (const step of plan.steps) {
        if (hasCycle(step.step_id)) {
            errors.push(`Circular dependency detected involving step: ${step.step_id}`)
            break
        }
    }

    // Validate final_response_strategy
    if (!plan.final_response_strategy) {
        errors.push('final_response_strategy is required')
    } else {
        const validTypes = ['merge_and_summarize', 'concatenate', 'select_best', 'custom']
        if (!validTypes.includes(plan.final_response_strategy.type)) {
            errors.push(`Invalid final_response_strategy type: ${plan.final_response_strategy.type}`)
        }

        if (!Array.isArray(plan.final_response_strategy.from_steps)) {
            errors.push('final_response_strategy.from_steps must be an array')
        } else {
            for (const stepRef of plan.final_response_strategy.from_steps) {
                if (!stepIds.has(stepRef)) {
                    errors.push(`final_response_strategy references unknown step: ${stepRef}`)
                }
            }
        }
    }

    return errors
}

// Get topological order of steps for execution
export function getExecutionOrder(steps: WorkflowStep[]): string[] {
    const order: string[] = []
    const visited = new Set<string>()
    const stepMap = new Map(steps.map(s => [s.step_id, s]))

    function visit(stepId: string) {
        if (visited.has(stepId)) return
        visited.add(stepId)

        const step = stepMap.get(stepId)
        if (step?.depends_on) {
            for (const dep of step.depends_on) {
                visit(dep)
            }
        }
        order.push(stepId)
    }

    for (const step of steps) {
        visit(step.step_id)
    }

    return order
}

// Build the orchestrator prompt with agents and histories
export function buildOrchestratorPrompt(request: OrchestratorRequest): string {
    let prompt = 'Available Agents:\n'

    for (const agent of request.agents) {
        const config = ORCHESTRATOR_AGENTS[agent.id as AgentType]
        prompt += `\n- ${agent.name} (id: ${agent.id})\n`
        prompt += `  Capabilities: ${config?.capabilities.join(', ') || agent.capabilities.join(', ')}\n`
        prompt += `  Status: ${agent.current_state}\n`
        if (agent.history_id) {
            prompt += `  History ID: ${agent.history_id}\n`
        }
    }

    if (request.histories && request.histories.length > 0) {
        prompt += '\n\nAgent Histories:\n'
        for (const history of request.histories) {
            prompt += `\n${history.agent_id} (history_id: ${history.history_id}):\n`
            for (const session of history.last_sessions) {
                prompt += `  - Session ${session.session_id} (${session.created_at}):\n`
                prompt += `    Summary: ${session.summary}\n`
                if (session.key_facts.length > 0) {
                    prompt += `    Key Facts: ${session.key_facts.join('; ')}\n`
                }
            }
        }
    }

    prompt += `\n\nUser Instruction:\n${request.user_instruction}`
    prompt += '\n\nGenerate a workflow plan as JSON only. No explanation, just the JSON.'

    return prompt
}

// Parse orchestrator LLM response
export function parseOrchestratorResponse(response: string): OrchestratorResponse {
    // Try to extract JSON from the response
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
    }

    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (objectMatch) {
        jsonStr = objectMatch[0]
    }

    try {
        const plan = JSON.parse(jsonStr) as WorkflowPlan
        const validationErrors = validateWorkflowPlan(plan)

        return {
            workflow_plan: plan,
            validation_errors: validationErrors.length > 0 ? validationErrors : undefined
        }
    } catch (error) {
        return {
            workflow_plan: {
                workflow_name: 'Error',
                steps: [],
                final_response_strategy: {
                    type: 'merge_and_summarize',
                    from_steps: [],
                    instructions: ''
                }
            },
            validation_errors: [`Failed to parse JSON: ${error}`]
        }
    }
}

// Convert workflow plan to canvas nodes and edges
export function workflowToCanvas(plan: WorkflowPlan): { nodes: any[]; edges: any[] } {
    const nodes: any[] = []
    const edges: any[] = []
    const stepPositions = new Map<string, { x: number; y: number }>()

    // Calculate positions based on dependencies (simple layout)
    const levels = new Map<string, number>()
    const executionOrder = getExecutionOrder(plan.steps)

    // Assign levels
    for (const stepId of executionOrder) {
        const step = plan.steps.find(s => s.step_id === stepId)!
        let level = 0
        if (step.depends_on && step.depends_on.length > 0) {
            level = Math.max(...step.depends_on.map(d => (levels.get(d) || 0) + 1))
        }
        levels.set(stepId, level)
    }

    // Group steps by level
    const stepsByLevel = new Map<number, string[]>()
    for (const [stepId, level] of levels) {
        if (!stepsByLevel.has(level)) {
            stepsByLevel.set(level, [])
        }
        stepsByLevel.get(level)!.push(stepId)
    }

    // Position nodes
    const nodeWidth = 200
    const nodeHeight = 80
    const horizontalGap = 100
    const verticalGap = 120

    for (const [level, stepIds] of stepsByLevel) {
        const totalWidth = stepIds.length * nodeWidth + (stepIds.length - 1) * horizontalGap
        const startX = -totalWidth / 2 + nodeWidth / 2

        stepIds.forEach((stepId, index) => {
            const x = startX + index * (nodeWidth + horizontalGap)
            const y = level * (nodeHeight + verticalGap)
            stepPositions.set(stepId, { x, y })
        })
    }

    // Create nodes
    for (const step of plan.steps) {
        const position = step.position || stepPositions.get(step.step_id) || { x: 0, y: 0 }
        const inputs = step.input_mapping?.user_input_specs?.map(spec => spec.field)
            || step.input_mapping?.from_user
            || []
        const outputs = step.outputs || ['output']

        nodes.push({
            id: step.step_id,
            type: 'agent',
            position,
            data: {
                label: ORCHESTRATOR_AGENTS[step.agent_id as AgentType]?.name || step.agent_id,
                step_id: step.step_id,
                agent_type: step.agent_id,
                description: step.description,
                status: 'pending',
                inputs,
                outputs,
            }
        })
    }

    // Create edges
    for (const step of plan.steps) {
        if (step.depends_on) {
            for (const dep of step.depends_on) {
                edges.push({
                    id: `${dep}-${step.step_id}`,
                    source: dep,
                    target: step.step_id
                })
            }
        }
    }

    // Add final output node
    const maxLevel = Math.max(...Array.from(levels.values()))
    nodes.push({
        id: 'final_output',
        type: 'output',
        position: { x: 0, y: (maxLevel + 1) * (nodeHeight + verticalGap) },
        data: {
            label: 'Final Output',
            description: plan.final_response_strategy.instructions,
            status: 'pending'
        }
    })

    // Connect final steps to output
    for (const stepId of plan.final_response_strategy.from_steps) {
        edges.push({
            id: `${stepId}-final_output`,
            source: stepId,
            target: 'final_output'
        })
    }

    return { nodes, edges }
}

// Enforce a simple linear chain (one-to-one) between steps
export function enforceLinearWorkflowPlan(plan: WorkflowPlan): WorkflowPlan {
    if (!plan.steps || plan.steps.length === 0) return plan

    const order = getExecutionOrder(plan.steps)
    const stepMap = new Map(plan.steps.map(step => [step.step_id, step]))
    const steps: WorkflowStep[] = []

    order.forEach((stepId, index) => {
        const original = stepMap.get(stepId)
        if (!original) return

        const prevId = index > 0 ? order[index - 1] : null
        const inputMapping = { ...(original.input_mapping || {}) }

        if (prevId) {
            const existingFromSteps = original.input_mapping?.from_steps || {}
            inputMapping.from_steps = {
                [prevId]: existingFromSteps[prevId] || ['output']
            }
        } else {
            inputMapping.from_steps = {}
        }

        steps.push({
            ...original,
            depends_on: prevId ? [prevId] : [],
            input_mapping: inputMapping,
        })
    })

    const lastStepId = order[order.length - 1]

    return {
        ...plan,
        steps,
        final_response_strategy: {
            ...plan.final_response_strategy,
            from_steps: lastStepId ? [lastStepId] : [],
        }
    }
}

// Generate a default workflow from agent selection
export function generateDefaultWorkflow(
    agents: string[],
    mode: 'sequential' | 'parallel' | 'mixed' = 'sequential'
): WorkflowPlan {
    const steps: WorkflowStep[] = []

    if (mode === 'sequential') {
        agents.forEach((agentId, index) => {
            const config = ORCHESTRATOR_AGENTS[agentId]
            steps.push({
                step_id: `step_${index + 1}_${agentId}`,
                agent_id: agentId,
                description: `Run ${config?.name || agentId} agent`,
                depends_on: index > 0 ? [`step_${index}_${agents[index - 1]}`] : [],
                input_mapping: {
                    from_user: ['user_input'],
                    from_steps: index > 0 ? { [`step_${index}_${agents[index - 1]}`]: ['output'] } : {}
                }
            })
        })
    } else if (mode === 'parallel') {
        agents.forEach((agentId, index) => {
            const config = ORCHESTRATOR_AGENTS[agentId]
            steps.push({
                step_id: `step_${index + 1}_${agentId}`,
                agent_id: agentId,
                description: `Run ${config?.name || agentId} agent in parallel`,
                depends_on: [],
                input_mapping: {
                    from_user: ['user_input']
                }
            })
        })
    }

    // For sequential mode, only the last step should connect to final output
    // For parallel mode, all steps connect to final output
    const finalSteps = mode === 'sequential' && steps.length > 0
        ? [steps[steps.length - 1].step_id]
        : steps.map(s => s.step_id)

    return {
        workflow_name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Workflow`,
        steps,
        final_response_strategy: {
            type: 'merge_and_summarize',
            from_steps: finalSteps,
            instructions: 'Combine all agent outputs into a comprehensive result'
        }
    }
}
