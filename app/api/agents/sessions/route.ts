import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentSession } from '@/types'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { createSessionSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeJson } from '@/utils/sanitize'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate input with Zod (rejects extra fields)
        const validation = validateInput(createSessionSchema, body)
        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { agent_type, form_data, response, refined_prompt, chat_messages = [] } = validation.data

        // Sanitize form data
        const sanitizedFormData = sanitizeJson(form_data as Record<string, unknown>)

        // Generate session name
        const now = new Date()
        const agentName = agent_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const sessionName = `${agentName} - ${now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })}, ${now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`

        const { data, error } = await supabase
            .from('agent_sessions')
            .insert({
                user_id: user.id,
                agent_type,
                session_name: sessionName,
                form_data: sanitizedFormData,
                response,
                refined_prompt,
                chat_messages,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log audit event
        await logAuditEvent({
            userId: user.id,
            userEmail: user.email,
            action: AUDIT_ACTIONS.SESSION_CREATED,
            resourceType: 'session',
            resourceId: data.id,
            details: {
                agent_type,
                session_name: sessionName,
            },
            request,
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Session API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create session' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const agentType = searchParams.get('agent_type')

        let query = supabase
            .from('agent_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (agentType) {
            query = query.eq('agent_type', agentType)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching sessions:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Session API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch sessions' },
            { status: 500 }
        )
    }
}
