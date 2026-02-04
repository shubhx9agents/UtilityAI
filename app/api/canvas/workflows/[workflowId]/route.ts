import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateWorkflowRequest } from '@/types'
import { validateWorkflowPlan, workflowToCanvas } from '@/lib/ai/orchestrator'

// GET /api/canvas/workflows/[workflowId] - Get a specific workflow
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
            .from('workflows')
            .select('*')
            .eq('id', workflowId)
            .eq('user_id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
        }

        // Also return canvas representation
        const canvasData = data.workflow_plan?.steps?.length > 0 
            ? workflowToCanvas(data.workflow_plan)
            : { nodes: [], edges: [] }

        return NextResponse.json({ 
            workflow: data,
            canvas: canvasData
        })
    } catch (error: any) {
        console.error('Get workflow error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT /api/canvas/workflows/[workflowId] - Update a workflow
export async function PUT(
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

        const body: UpdateWorkflowRequest = await request.json()
        const updates: any = {}

        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) updates.description = body.description
        if (body.status !== undefined) updates.status = body.status

        if (body.workflow_plan !== undefined) {
            const validationErrors = validateWorkflowPlan(body.workflow_plan)
            if (validationErrors.length > 0) {
                return NextResponse.json({ 
                    error: 'Invalid workflow plan',
                    validation_errors: validationErrors 
                }, { status: 400 })
            }
            updates.workflow_plan = body.workflow_plan
        }

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('workflows')
            .update(updates)
            .eq('id', workflowId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ workflow: data })
    } catch (error: any) {
        console.error('Update workflow error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/canvas/workflows/[workflowId] - Delete a workflow
export async function DELETE(
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

        const { error } = await supabase
            .from('workflows')
            .delete()
            .eq('id', workflowId)
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete workflow error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
