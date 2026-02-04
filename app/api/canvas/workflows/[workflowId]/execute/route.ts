import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { workflowExecutionService } from '@/lib/ai/workflow-executor'

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

        // Execute the workflow
        const result = await workflowExecutionService.executeWorkflow(
            workflowId,
            user.id,
            user_inputs
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
