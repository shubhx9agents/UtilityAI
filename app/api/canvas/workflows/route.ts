import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateWorkflowRequest, UpdateWorkflowRequest, WorkflowPlan } from '@/types'
import { validateWorkflowPlan } from '@/lib/ai/orchestrator'

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
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ workflows: data })
    } catch (error: any) {
        console.error('List workflows error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
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

        const body: CreateWorkflowRequest = await request.json()
        const { name, description, workflow_plan } = body

        console.log('Creating workflow:', { name, user_id: user.id })

        if (!name) {
            return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 })
        }

        // Validate workflow plan if provided
        if (workflow_plan) {
            const validationErrors = validateWorkflowPlan(workflow_plan)
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
                name,
                description: description || null,
                workflow_plan: workflow_plan || {
                    workflow_name: name,
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
            return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }

        return NextResponse.json({ workflow: data }, { status: 201 })
    } catch (error: any) {
        console.error('Create workflow error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
