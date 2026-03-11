import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user before logout
        const { data: { user } } = await supabase.auth.getUser()

        // Log logout
        if (user) {
            await logAuditEvent({
                userId: user.id,
                userEmail: user.email || undefined,
                action: AUDIT_ACTIONS.USER_LOGOUT,
                resourceType: 'user',
                resourceId: user.id,
                details: { email: user.email },
                request,
            })
        }

        // Sign out
        const { error } = await supabase.auth.signOut()

        if (error) {
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error('Logout API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
