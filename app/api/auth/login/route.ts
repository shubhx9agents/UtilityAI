import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Log successful login
        if (data.user) {
            await logAuditEvent({
                userId: data.user.id,
                userEmail: data.user.email || undefined,
                action: AUDIT_ACTIONS.USER_LOGIN,
                resourceType: 'user',
                resourceId: data.user.id,
                details: { email: data.user.email },
                request,
            })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Login API error:', error)
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        )
    }
}
