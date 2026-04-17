import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const tokenHash = requestUrl.searchParams.get('token_hash')
    const type = requestUrl.searchParams.get('type')
    const origin = requestUrl.origin
    const nextParam = requestUrl.searchParams.get('next')
    const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'
    const isOtpCallback = tokenHash && (type === 'recovery' || type === 'invite')

    if (code || isOtpCallback) {
        // Collect cookies that Supabase sets during session exchange/verification.
        const cookieStore = await cookies()
        type CookieToSet = {
            name: string
            value: string
            options?: Parameters<(typeof cookieStore)['set']>[2]
        }
        const cookiesToSet: CookieToSet[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesArr) {
                        cookiesToSet.push(...cookiesArr)
                        cookiesArr.forEach(({ name, value, options }) => {
                            try {
                                cookieStore.set(name, value, options)
                            } catch {}
                        })
                    },
                },
            }
        )

        const { error } = code
            ? await supabase.auth.exchangeCodeForSession(code)
            : await supabase.auth.verifyOtp({
                  token_hash: tokenHash!,
                  type: type as 'recovery' | 'invite',
              })

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user) {
                await logAuditEvent({
                    userId: user.id,
                    userEmail: user.email || undefined,
                    action: AUDIT_ACTIONS.USER_LOGIN,
                    resourceType: 'user',
                    resourceId: user.id,
                    details: {
                        method: isOtpCallback ? 'email_link' : 'oauth',
                        provider: 'callback',
                        email: user.email,
                    },
                    request,
                    supabase,
                })
            }
        }

        const redirectResponse = NextResponse.redirect(`${origin}${next}`)
        for (const { name, value, options } of cookiesToSet) {
            redirectResponse.cookies.set(name, value, options)
        }
        return redirectResponse
    }

    return NextResponse.redirect(`${origin}${next}`)
}
