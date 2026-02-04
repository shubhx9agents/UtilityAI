import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateSessionRequest, AgentSession } from '@/types'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: CreateSessionRequest = await request.json()
        const { agent_type, form_data, response, refined_prompt, chat_messages = [] } = body

        if (!agent_type || !form_data) {
            return NextResponse.json(
                { error: 'agent_type and form_data are required' },
                { status: 400 }
            )
        }

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
                form_data,
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
