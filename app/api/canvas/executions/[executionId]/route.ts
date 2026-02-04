import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { workflowExecutionService } from '@/lib/ai/workflow-executor'

// GET /api/canvas/executions/[executionId] - Get execution status with steps
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { executionId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user owns this execution
        const { data: execution, error: execError } = await supabase
            .from('workflow_executions')
            .select('*')
            .eq('id', executionId)
            .eq('user_id', user.id)
            .single()

        if (execError || !execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
        }

        // Get step executions
        const { data: steps, error: stepsError } = await supabase
            .from('step_executions')
            .select('*')
            .eq('execution_id', executionId)
            .order('started_at', { ascending: true })

        if (stepsError) {
            return NextResponse.json({ error: stepsError.message }, { status: 500 })
        }

        return NextResponse.json({
            execution: {
                ...execution,
                steps: steps || []
            }
        })
    } catch (error: any) {
        console.error('Get execution error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/canvas/executions/[executionId] - Cancel execution
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { executionId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user owns this execution
        const { data: execution } = await supabase
            .from('workflow_executions')
            .select('id, status')
            .eq('id', executionId)
            .eq('user_id', user.id)
            .single()

        if (!execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
        }

        if (execution.status === 'completed' || execution.status === 'failed') {
            return NextResponse.json({ error: 'Cannot cancel completed execution' }, { status: 400 })
        }

        await workflowExecutionService.cancelExecution(executionId)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Cancel execution error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
