import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { aiService } from './agents'
import {
    WorkflowPlan,
    WorkflowStep,
    WorkflowExecution,
    StepExecution,
    AgentType,
    ExecutionStatus,
    StepExecutionStatus,
    FinalResponseStrategy,
} from '@/types'
import { getExecutionOrder } from './orchestrator'

export interface ExecutionResult {
    execution_id: string
    status: ExecutionStatus
    step_results: Record<string, any>
    final_result: any
    error?: string
}

export class WorkflowExecutionService {
    private supabase = createServiceRoleClient()

    // Create a new workflow execution
    async createExecution(
        workflowId: string,
        userId: string,
        userInputs: Record<string, any>
    ): Promise<string> {
        const { data, error } = await this.supabase
            .from('workflow_executions')
            .insert({
                workflow_id: workflowId,
                user_id: userId,
                status: 'pending',
                user_inputs: userInputs,
            })
            .select('id')
            .single()

        if (error) {
            throw new Error(`Failed to create execution: ${error.message}`)
        }

        return data.id
    }

    // Execute a workflow
    async executeWorkflow(
        workflowId: string,
        userId: string,
        userInputs: Record<string, any>
    ): Promise<ExecutionResult> {
        // Get the workflow
        const { data: workflow, error: workflowError } = await this.supabase
            .from('workflows')
            .select('*')
            .eq('id', workflowId)
            .single()

        if (workflowError || !workflow) {
            throw new Error(`Workflow not found: ${workflowError?.message}`)
        }

        const plan = workflow.workflow_plan as WorkflowPlan

        // Create execution record
        const executionId = await this.createExecution(workflowId, userId, userInputs)

        // Update status to running
        await this.updateExecutionStatus(executionId, 'running')

        try {
            // Create step execution records
            await this.createStepExecutions(executionId, plan.steps)

            // Get execution order (topological sort)
            const executionOrder = getExecutionOrder(plan.steps)

            // Execute steps in order
            const stepResults: Record<string, any> = {}

            for (let stepIndex = 0; stepIndex < executionOrder.length; stepIndex++) {
                const stepId = executionOrder[stepIndex]
                const isCancelled = await this.isExecutionCancelled(executionId)
                if (isCancelled) {
                    return await this.handleCancelledExecution(executionId, executionOrder.slice(stepIndex), stepResults)
                }

                const step = plan.steps.find(s => s.step_id === stepId)!

                // Check if all dependencies are completed
                const canExecute = this.checkDependencies(step, stepResults)
                if (!canExecute) {
                    await this.updateStepStatus(executionId, stepId, 'skipped', null, 'Dependencies not met')
                    continue
                }

                try {
                    // Build input for this step
                    const stepInput = this.buildStepInput(step, userInputs, stepResults)

                    // Update step status to running
                    await this.updateStepStatus(executionId, stepId, 'running', stepInput)

                    // Execute the agent
                    const result = await this.executeStep(step, stepInput)

                    // Store result
                    stepResults[stepId] = result

                    // Update step status to completed
                    await this.updateStepStatus(executionId, stepId, 'completed', stepInput, null, result)
                } catch (stepError: any) {
                    console.error(`Step ${stepId} failed:`, stepError)
                    await this.updateStepStatus(executionId, stepId, 'failed', null, stepError.message)
                    stepResults[stepId] = { error: stepError.message }
                }
            }

            const cancelledBeforeFinalization = await this.isExecutionCancelled(executionId)
            if (cancelledBeforeFinalization) {
                return await this.handleCancelledExecution(executionId, [], stepResults)
            }

            // Generate final result
            const finalResult = await this.generateFinalResult(
                plan.final_response_strategy,
                stepResults
            )

            // Update execution to completed
            await this.supabase
                .from('workflow_executions')
                .update({
                    status: 'completed',
                    final_result: finalResult,
                    completed_at: new Date().toISOString()
                })
                .eq('id', executionId)

            return {
                execution_id: executionId,
                status: 'completed',
                step_results: stepResults,
                final_result: finalResult
            }
        } catch (error: any) {
            // Update execution to failed
            await this.supabase
                .from('workflow_executions')
                .update({
                    status: 'failed',
                    error_message: error.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', executionId)

            return {
                execution_id: executionId,
                status: 'failed',
                step_results: {},
                final_result: null,
                error: error.message
            }
        }
    }

    // Create step execution records
    private async createStepExecutions(executionId: string, steps: WorkflowStep[]): Promise<void> {
        const stepExecutions = steps.map(step => ({
            execution_id: executionId,
            step_id: step.step_id,
            agent_type: step.agent_id,
            status: 'pending' as StepExecutionStatus,
            input_data: {}
        }))

        const { error } = await this.supabase
            .from('step_executions')
            .insert(stepExecutions)

        if (error) {
            throw new Error(`Failed to create step executions: ${error.message}`)
        }
    }

    // Update execution status
    private async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
        await this.supabase
            .from('workflow_executions')
            .update({ status })
            .eq('id', executionId)
    }

    private async isExecutionCancelled(executionId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('workflow_executions')
            .select('status')
            .eq('id', executionId)
            .single()

        if (error || !data) {
            return false
        }

        return data.status === 'cancelled'
    }

    private async handleCancelledExecution(
        executionId: string,
        remainingStepIds: string[],
        stepResults: Record<string, any>
    ): Promise<ExecutionResult> {
        const cancelledAt = new Date().toISOString()

        for (const stepId of remainingStepIds) {
            await this.updateStepStatus(
                executionId,
                stepId,
                'skipped',
                undefined,
                'Execution cancelled by user'
            )
        }

        const finalResult = {
            message: 'Execution cancelled by user',
            partial_results: stepResults
        }

        await this.supabase
            .from('workflow_executions')
            .update({
                status: 'cancelled',
                final_result: finalResult,
                completed_at: cancelledAt
            })
            .eq('id', executionId)

        return {
            execution_id: executionId,
            status: 'cancelled',
            step_results: stepResults,
            final_result: finalResult
        }
    }

    // Update step status
    private async updateStepStatus(
        executionId: string,
        stepId: string,
        status: StepExecutionStatus,
        inputData?: any,
        errorMessage?: string | null,
        outputData?: any
    ): Promise<void> {
        const update: any = { status }

        if (inputData !== undefined) {
            update.input_data = inputData
        }
        if (status === 'running') {
            update.started_at = new Date().toISOString()
        }
        if (status === 'completed' || status === 'failed' || status === 'skipped') {
            update.completed_at = new Date().toISOString()
        }
        if (errorMessage) {
            update.error_message = errorMessage
        }
        if (outputData !== undefined) {
            update.output_data = outputData
        }

        await this.supabase
            .from('step_executions')
            .update(update)
            .eq('execution_id', executionId)
            .eq('step_id', stepId)
    }

    // Check if step dependencies are met
    private checkDependencies(step: WorkflowStep, stepResults: Record<string, any>): boolean {
        if (!step.depends_on || step.depends_on.length === 0) {
            return true
        }

        return step.depends_on.every(dep => {
            const result = stepResults[dep]
            return result && !result.error
        })
    }

    // Build input for a step
    private buildStepInput(
        step: WorkflowStep,
        userInputs: Record<string, any>,
        stepResults: Record<string, any>
    ): Record<string, any> {
        const input: Record<string, any> = {}

        // Add user inputs
        if (step.input_mapping.from_user) {
            for (const field of step.input_mapping.from_user) {
                if (userInputs[field] !== undefined) {
                    input[field] = userInputs[field]

                    // Handle step-prefixed fields (e.g., "step_1_image_model" -> "image_model")
                    // This allows unique inputs per step while preserving agent compatibility
                    if (field.startsWith(`${step.step_id}_`)) {
                        const originalField = field.substring(step.step_id.length + 1)
                        input[originalField] = userInputs[field]
                    }
                }
            }
        }

        // Backward compatibility: older workflow plans may not include "user_input"
        // in from_user, but execution can still provide it.
        if (input.user_input === undefined && userInputs.user_input !== undefined) {
            input.user_input = userInputs.user_input
        }

        // Add inputs from previous steps
        if (step.input_mapping.from_steps) {
            for (const [stepId, fields] of Object.entries(step.input_mapping.from_steps)) {
                const stepResult = stepResults[stepId]
                if (stepResult) {
                    for (const field of fields) {
                        if (stepResult[field] !== undefined) {
                            input[`${stepId}_${field}`] = stepResult[field]
                        } else if (stepResult.response) {
                            // Use the full response if specific field not found
                            input[`${stepId}_output`] = stepResult.response
                        }
                    }
                }
            }
        }

        // Add history context if specified
        if (step.input_mapping.from_history) {
            input.history_context = step.input_mapping.from_history
        }

        return input
    }

    // Execute a single step
    private async executeStep(step: WorkflowStep, input: Record<string, any>): Promise<any> {
        const agentType = step.agent_id as AgentType

        // Build the input string for the agent
        let inputString = ''

        // If there's previous step output, include it
        const previousOutputs = Object.entries(input)
            .filter(([key, value]) => {
                // Filter out large image data from text prompt
                const isImage = typeof value === 'string' && (value.startsWith('data:image/') || value.length > 5000)
                return (key.includes('_output') || key.includes('_response')) && !isImage
            })
            .map(([key, value]) => `Previous step (${key}): ${typeof value === 'string' ? value : JSON.stringify(value)}`)

        if (previousOutputs.length > 0) {
            inputString += 'Context from previous steps:\n' + previousOutputs.join('\n\n') + '\n\n'
        }

        // Add user inputs (Filter out base64 for the text prompt)
        const userFields = Object.entries(input)
            .filter(([key, value]) => {
                const isImage = typeof value === 'string' && (value.startsWith('data:image/') || value.length > 5000)
                return !key.includes('_output') && !key.includes('_response') && key !== 'history_context' && !isImage
            })
            .map(([key, value]) => `${key}: ${value}`)

        if (userFields.length > 0) {
            inputString += 'User inputs:\n' + userFields.join('\n') + '\n\n'
        }

        // Add step description as instruction
        inputString += `Task: ${step.description}`

        // Run the agent
        // Construct a more structured input string
        let structuredInput = ''

        // 1. Prioritize explicit instructions
        const instructionFields = ['instructional_prompt', 'user_input', 'prompt', 'task']
        const mainInstruction = userFields
            .filter(f => instructionFields.some(i => f.toLowerCase().startsWith(i)))
            .map(f => f.split(':').slice(1).join(':').trim())
            .join('\n')

        if (mainInstruction) {
            structuredInput += `MAIN INSTRUCTION:\n${mainInstruction}\n\n`
        } else if (step.description) {
            structuredInput += `MAIN TASK: ${step.description}\n\n`
        }

        // Keep upstream step outputs in structured prompts so downstream agents
        // still receive dependency context even when structured mode is used.
        if (previousOutputs.length > 0) {
            structuredInput += `PREVIOUS STEP OUTPUTS:\n${previousOutputs.join('\n\n')}\n\n`
        }

        // 2. Add configuration/parameters as context
        const configFields = userFields.filter(f => !instructionFields.some(i => f.toLowerCase().startsWith(i)))
        if (configFields.length > 0) {
            structuredInput += `CONFIGURATION & CONTEXT:\n${configFields.join('\n')}\n\n`
        }

        // Fallback if no specific structure
        if (!structuredInput) {
            structuredInput = inputString
            console.log(`[Workflow Debug] Step ${step.step_id} - Using raw input string`)
        } else {
            console.log(`[Workflow Debug] Step ${step.step_id} - Using structured input:\n${structuredInput}`)
        }

        // Run the agent with stricter input
        console.log(`[Workflow Debug] Step ${step.step_id} (${step.agent_id}) - Final input object keys:`, Object.keys(input))
        console.log(`[Workflow Debug] Step ${step.step_id} - Structured input preview:`, structuredInput.substring(0, 500))

        const result = await aiService.runAgent(agentType, structuredInput || inputString, input)

        return {
            response: result.response,
            refined_prompt: result.refined_prompt,
            agent_type: agentType,
            step_id: step.step_id
        }
    }

    // Generate final result based on strategy
    private async generateFinalResult(
        strategy: FinalResponseStrategy,
        stepResults: Record<string, any>
    ): Promise<any> {
        const relevantResults = strategy.from_steps
            .map(stepId => stepResults[stepId])
            .filter(r => r && !r.error)

        if (relevantResults.length === 0) {
            return {
                summary: 'No successful step results to combine',
                results: stepResults
            }
        }

        // Check if all relevant results are images
        const allImages = relevantResults.every(r => r.agent_type === 'image_generation' || r.agent_type === 'linkedin_headshot')
        if (allImages && relevantResults.length > 0) {
            return {
                response: relevantResults.length === 1 ? relevantResults[0].response : relevantResults.map(r => r.response),
                agent_type: relevantResults[0].agent_type,
                individual_results: relevantResults
            }
        }

        switch (strategy.type) {
            case 'concatenate':
                return {
                    combined: relevantResults.map(r => r.response).join('\n\n---\n\n'),
                    individual_results: relevantResults
                }

            case 'select_best':
                // For now, return the last result as "best"
                // In future, could use AI to select
                return {
                    selected: relevantResults[relevantResults.length - 1],
                    all_results: relevantResults
                }

            case 'merge_and_summarize':
            default:
                // Use AI to merge and summarize
                const mergePrompt = `
You are combining outputs from multiple AI agents. Here are the results:

${relevantResults.map((r, i) => `--- Result ${i + 1} (${r.agent_type}) ---\n${r.response}`).join('\n\n')}

Instructions: ${strategy.instructions}

Provide a comprehensive, unified response that combines the best insights from all results.
`
                try {
                    // Use Groq for summarization
                    const groqApiKey = process.env.GROQ_API_KEY
                    if (!groqApiKey) {
                        return {
                            summary: 'Unable to merge results (no API key)',
                            individual_results: relevantResults
                        }
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
                                { role: 'system', content: 'You are an expert at synthesizing information from multiple sources.' },
                                { role: 'user', content: mergePrompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 4000
                        })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to merge results')
                    }

                    const data = await response.json()
                    return {
                        summary: data.choices[0]?.message?.content || 'Failed to generate summary',
                        individual_results: relevantResults
                    }
                } catch (error) {
                    return {
                        summary: 'Error merging results',
                        individual_results: relevantResults
                    }
                }
        }
    }

    // Get execution status with step details
    async getExecutionStatus(executionId: string): Promise<WorkflowExecution & { steps: StepExecution[] }> {
        const { data: execution, error: execError } = await this.supabase
            .from('workflow_executions')
            .select('*')
            .eq('id', executionId)
            .single()

        if (execError || !execution) {
            throw new Error(`Execution not found: ${execError?.message}`)
        }

        const { data: steps, error: stepsError } = await this.supabase
            .from('step_executions')
            .select('*')
            .eq('execution_id', executionId)
            .order('started_at', { ascending: true })

        if (stepsError) {
            throw new Error(`Failed to get step executions: ${stepsError.message}`)
        }

        return {
            ...execution,
            steps: steps || []
        }
    }

    // Cancel an execution
    async cancelExecution(executionId: string): Promise<void> {
        await this.supabase
            .from('workflow_executions')
            .update({
                status: 'cancelled',
                completed_at: new Date().toISOString()
            })
            .eq('id', executionId)
    }
}

export const workflowExecutionService = new WorkflowExecutionService()
