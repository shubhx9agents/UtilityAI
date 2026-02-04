import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateSessionRequest } from '@/types'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { sessionId } = await params

        const { data, error } = await supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (error) {
            console.error('Error fetching session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Session API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch session' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { sessionId } = await params

        const body: UpdateSessionRequest = await request.json()

        console.log('PATCH /api/agents/sessions/[sessionId]')
        console.log('Session ID:', sessionId)
        console.log('Update body:', JSON.stringify(body, null, 2))

        const { data, error } = await supabase
            .from('agent_sessions')
            .update(body)
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('Session updated successfully:', data.id)
        console.log('Updated chat_messages:', data.chat_messages)

        // Log audit event
        await logAuditEvent({
            userId: user?.id,
            userEmail: user?.email,
            action: AUDIT_ACTIONS.SESSION_UPDATED,
            resourceType: 'session',
            resourceId: sessionId,
            details: {
                updated_fields: Object.keys(body),
            },
            request,
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Session API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update session' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { sessionId } = await params

        const { error } = await supabase
            .from('agent_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error deleting session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log audit event
        await logAuditEvent({
            userId: user?.id,
            userEmail: user?.email,
            action: AUDIT_ACTIONS.SESSION_DELETED,
            resourceType: 'session',
            resourceId: sessionId,
            request,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Session API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete session' },
            { status: 500 }
        )
    }
}
