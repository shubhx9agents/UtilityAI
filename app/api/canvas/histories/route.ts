import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentType } from '@/types'
import { getErrorMessage } from '@/lib/types/errors'

// GET /api/canvas/histories - Get agent session histories for orchestrator context
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const agentType = searchParams.get('agent_type')
        const limit = parseInt(searchParams.get('limit') || '10')

        // Get recent sessions
        let query = supabase
            .from('agent_sessions')
            .select('id, agent_type, session_name, response, form_data, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (agentType) {
            query = query.eq('agent_type', agentType)
        }

        const { data: sessions, error } = await query

        if (error) {
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
        }

        // Group by agent type for orchestrator context
        const historiesByAgent: Record<string, any> = {}

        for (const session of sessions || []) {
            const agentId = session.agent_type
            if (!historiesByAgent[agentId]) {
                historiesByAgent[agentId] = {
                    agent_id: agentId,
                    history_id: `history_${agentId}_${user.id}`,
                    last_sessions: []
                }
            }

            // Create summary from response or session name
            let summary = session.session_name || 'Untitled session'
            if (session.response) {
                // Extract first 200 chars as summary
                summary = session.response.substring(0, 200) + (session.response.length > 200 ? '...' : '')
            }

            // Extract key facts from form_data
            const keyFacts: string[] = []
            if (session.form_data && typeof session.form_data === 'object') {
                for (const [key, value] of Object.entries(session.form_data)) {
                    if (value && typeof value === 'string' && value.length < 100) {
                        keyFacts.push(`${key}: ${value}`)
                    }
                }
            }

            historiesByAgent[agentId].last_sessions.push({
                session_id: session.id,
                summary,
                key_facts: keyFacts.slice(0, 5),
                created_at: session.created_at
            })
        }

        const histories = Object.values(historiesByAgent)

        return NextResponse.json({ histories })
    } catch (error: unknown) {
        console.error('Get histories error:', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST /api/canvas/histories - Create/update a history summary
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { session_id, summary, key_facts = [], output_fields = {} } = body

        if (!session_id || !summary) {
            return NextResponse.json({
                error: 'session_id and summary are required'
            }, { status: 400 })
        }

        // Get the session to verify ownership and get agent_type
        const { data: session, error: sessionError } = await supabase
            .from('agent_sessions')
            .select('id, agent_type, user_id')
            .eq('id', session_id)
            .eq('user_id', user.id)
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Create or update history summary
        const { data, error } = await supabase
            .from('agent_history_summaries')
            .upsert({
                user_id: user.id,
                agent_type: session.agent_type,
                session_id: session_id,
                summary,
                key_facts,
                output_fields
            }, {
                onConflict: 'session_id'
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
        }

        return NextResponse.json({ history_summary: data })
    } catch (error: unknown) {
        console.error('Create history error:', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
