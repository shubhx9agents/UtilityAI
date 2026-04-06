import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        // Collect cookies that Supabase wants to set so we can attach them to the response
        const cookiesToSet: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookies) {
                        cookiesToSet.push(...cookies)
                    },
                },
            }
        )

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

        // Build response with auth cookies (cleared) properly set on the response
        const response = NextResponse.json({ success: true })
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (error: unknown) {
        console.error('Logout API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
