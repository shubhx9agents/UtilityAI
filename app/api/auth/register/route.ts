import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json()

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Log successful registration
        if (data.user) {
            await logAuditEvent({
                userId: data.user.id,
                userEmail: data.user.email || undefined,
                action: AUDIT_ACTIONS.USER_SIGNUP,
                resourceType: 'user',
                resourceId: data.user.id,
                details: { email: data.user.email, name },
                request,
            })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Register API error:', error)
        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        )
    }
}
