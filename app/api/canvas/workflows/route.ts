import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkflowPlan } from '@/types'
import { validateWorkflowPlan } from '@/lib/ai/orchestrator'
import { createWorkflowSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeText } from '@/utils/sanitize'
import { enforceAndDeductCanvasCredit, creditExhaustedResponse } from '@/lib/credits'
import { getErrorMessage } from '@/lib/types/errors'

// GET /api/canvas/workflows - List user's workflows
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // Validate status parameter if provided
        if (status && !['draft', 'active', 'archived'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 })
        }

        let query = supabase
            .from('workflows')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
        }

        return NextResponse.json({ workflows: data })
    } catch (error: unknown) {
        console.error('List workflows error:', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST /api/canvas/workflows - Create a new workflow
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate input with Zod (rejects extra fields)
        const validation = validateInput(createWorkflowSchema, body)
        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { name, description, workflow_plan } = validation.data
        const sanitizedName = sanitizeText(name)
        const sanitizedDescription = description ? sanitizeText(description) : null

        // ── Backend canvas quota enforcement (cheat-proof) ──
        const canvasCheck = await enforceAndDeductCanvasCredit(user.id)
        if (!canvasCheck.allowed) {
            return NextResponse.json(creditExhaustedResponse(canvasCheck), { status: 402 })
        }

        console.log('Creating workflow:', { name: sanitizedName, user_id: user.id })

        // Validate workflow plan if provided
        if (workflow_plan) {
            const validationErrors = validateWorkflowPlan(workflow_plan as WorkflowPlan)
            if (validationErrors.length > 0) {
                return NextResponse.json({
                    error: 'Invalid workflow plan',
                    validation_errors: validationErrors
                }, { status: 400 })
            }
        }

        const { data, error } = await supabase
            .from('workflows')
            .insert({
                user_id: user.id,
                name: sanitizedName,
                description: sanitizedDescription,
                workflow_plan: workflow_plan || {
                    workflow_name: sanitizedName,
                    steps: [],
                    final_response_strategy: {
                        type: 'merge_and_summarize',
                        from_steps: [],
                        instructions: 'Combine all outputs'
                    }
                },
                status: 'draft'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            return NextResponse.json({ error: getErrorMessage(error), details: error }, { status: 500 })
        }

        return NextResponse.json({ workflow: data }, { status: 201 })
    } catch (error: unknown) {
        console.error('Create workflow error:', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
