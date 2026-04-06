import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (code) {
        // Collect cookies that Supabase sets during code exchange
        const cookieStore = await cookies()
        const cookiesToSet: { name: string; value: string; options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesArr) {
                        // Collect all cookies — we'll apply them to the redirect response
                        cookiesToSet.push(...cookiesArr)
                        // Also set on the cookieStore so subsequent calls (getUser) can read them
                        cookiesArr.forEach(({ name, value, options }) => {
                            try { cookieStore.set(name, value, options) } catch {}
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await logAuditEvent({
                    userId: user.id,
                    userEmail: user.email || undefined,
                    action: AUDIT_ACTIONS.USER_LOGIN,
                    resourceType: 'user',
                    resourceId: user.id,
                    details: {
                        method: 'oauth',
                        provider: 'callback',
                        email: user.email
                    },
                    request,
                    supabase,
                })
            }
        }

        // Create redirect response and manually propagate all session cookies
        const redirectResponse = NextResponse.redirect(`${origin}${next}`)
        for (const { name, value, options } of cookiesToSet) {
            redirectResponse.cookies.set(name, value, options)
        }
        return redirectResponse
    }

    // No code provided — just redirect
    return NextResponse.redirect(`${origin}${next}`)
}
