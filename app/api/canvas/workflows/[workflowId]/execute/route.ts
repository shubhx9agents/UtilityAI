import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { workflowExecutionService } from '@/lib/ai/workflow-executor'

type OnboardingStepOutputs = Record<string, any>

const asText = (value: unknown): string => {
    if (value === undefined || value === null) return ''
    if (Array.isArray(value)) return value.map(item => asText(item)).filter(Boolean).join(', ')
    const text = String(value).trim()
    return text
}

const buildOnboardingDefaults = (onboarding: OnboardingStepOutputs): Record<string, string> => {
    if (!onboarding || typeof onboarding !== 'object') return {}

    const businessName = asText(onboarding.business_name)
    const industry = asText(onboarding.industry)
    const audience = asText(onboarding.audience_desc)
    const goals = asText(onboarding.primary_goal)
    const painPoints = asText(onboarding.pain_points)
    const description = asText(onboarding.description)
    const mission = asText(onboarding.mission)
    const usp = asText(onboarding.usp)
    const tone = asText(onboarding.tone_voice)
    const channels = asText(onboarding.marketing_channels)

    const defaults: Record<string, string> = {
        business_name: businessName,
        company_name: businessName,
        product_service_name: businessName,
        product_name: businessName,
        service_name: businessName,
        niche: industry,
        industry,
        target_audience: audience,
        audience,
        goals,
        primary_goal: goals,
        primary_problem: painPoints,
        secondary_problems: painPoints,
        pain_points: painPoints,
        business_description: description,
        description,
        mission_statement: mission,
        core_philosophy: mission,
        primary_promise: usp,
        usp,
        ad_tone: tone,
        tone_of_voice: tone,
        platforms: channels,
        marketing_channels: channels,
    }

    return Object.entries(defaults).reduce((acc, [key, value]) => {
        if (value) {
            acc[key] = value
        }
        return acc
    }, {} as Record<string, string>)
}

const buildOnboardingContextBlock = (onboarding: OnboardingStepOutputs): string => {
    if (!onboarding || typeof onboarding !== 'object') return ''

    const lines = [
        `Business name: ${asText(onboarding.business_name)}`,
        `Industry: ${asText(onboarding.industry)}`,
        `Target audience: ${asText(onboarding.audience_desc)}`,
        `Primary goal: ${asText(onboarding.primary_goal)}`,
        `Pain points: ${asText(onboarding.pain_points)}`,
        `Mission: ${asText(onboarding.mission)}`,
        `Unique value proposition: ${asText(onboarding.usp)}`,
        `Tone of voice: ${asText(onboarding.tone_voice)}`,
        `Marketing channels: ${asText(onboarding.marketing_channels)}`
    ].filter(line => !line.endsWith(': '))

    return lines.join('\n')
}

const mergeExecutionInputsWithOnboarding = (
    userInputs: Record<string, any>,
    onboarding: OnboardingStepOutputs
): Record<string, any> => {
    const defaults = buildOnboardingDefaults(onboarding)
    const merged = { ...defaults, ...userInputs }
    const context = buildOnboardingContextBlock(onboarding)

    if (!context) {
        return merged
    }

    const marker = 'Business profile context:'
    const existingUserInput = typeof merged.user_input === 'string' ? merged.user_input.trim() : ''
    if (!existingUserInput) {
        merged.user_input = `${marker}\n${context}`
        return merged
    }

    if (!existingUserInput.toLowerCase().includes(marker.toLowerCase())) {
        merged.user_input = `${existingUserInput}\n\n${marker}\n${context}`
    }

    return merged
}

// POST /api/canvas/workflows/[workflowId]/execute - Execute a workflow
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workflowId: string }> }
) {
    try {
        const { workflowId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user owns this workflow
        const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .select('id, status')
            .eq('id', workflowId)
            .eq('user_id', user.id)
            .single()

        if (workflowError || !workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
        }

        const body = await request.json()
        const { user_inputs = {} } = body
        const normalizedUserInputs = user_inputs && typeof user_inputs === 'object' && !Array.isArray(user_inputs)
            ? user_inputs
            : {}

        const { data: onboarding } = await supabase
            .from('onboarding_progress')
            .select('step_outputs')
            .eq('user_id', user.id)
            .maybeSingle()

        const mergedUserInputs = mergeExecutionInputsWithOnboarding(
            normalizedUserInputs,
            onboarding?.step_outputs || {}
        )

        // Execute the workflow
        const result = await workflowExecutionService.executeWorkflow(
            workflowId,
            user.id,
            mergedUserInputs
        )

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Execute workflow error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/canvas/workflows/[workflowId]/execute - Get executions for a workflow
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workflowId: string }> }
) {
    try {
        const { workflowId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('workflow_executions')
            .select('*')
            .eq('workflow_id', workflowId)
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(20)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ executions: data })
    } catch (error: any) {
        console.error('Get executions error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
