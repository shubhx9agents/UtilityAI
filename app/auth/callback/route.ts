import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Log successful login
                await logAuditEvent({
                    userId: user.id,
                    userEmail: user.email || undefined,
                    action: AUDIT_ACTIONS.USER_LOGIN,
                    resourceType: 'user',
                    resourceId: user.id,
                    details: {
                        method: 'oauth',
                        provider: 'google', // We can assume google for now or inspect the URL if needed, but 'oauth' in details is good enough
                        email: user.email
                    },
                    request,
                    supabase,
                })
            }
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}/dashboard`)
}
