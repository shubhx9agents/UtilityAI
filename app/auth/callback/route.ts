import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

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
                // Block unapproved Google OAuth users from completing login.
                if (user.app_metadata?.provider === 'google' && user.email) {
                    const normalizedEmail = user.email.trim().toLowerCase()
                    try {
                        const supabaseAdmin = createServiceRoleClient()
                        
                        // First check if user already has a valid profile
                        const { data: profile } = await supabaseAdmin
                            .from('profiles')
                            .select('id')
                            .eq('id', user.id)
                            .maybeSingle()

                        // If they have a profile, they are an existing valid user (do not block)
                        let approvedRequest = null
                        let approvalError = null

                        if (!profile) {
                            const result = await supabaseAdmin
                                .from('account_requests')
                                .select('id, updated_at')
                                .ilike('email', normalizedEmail)
                                .eq('status', 'approved')
                                .maybeSingle()
                            approvedRequest = result.data
                            approvalError = result.error
                        }

                        if (approvalError) {
                            await logAuditEvent({
                                userId: user.id,
                                userEmail: user.email || undefined,
                                action: AUDIT_ACTIONS.LOGIN_FAILED,
                                resourceType: 'user',
                                resourceId: user.id,
                                details: {
                                    method: 'oauth',
                                    provider: 'google',
                                    reason: 'Approval lookup failed',
                                    email: user.email,
                                },
                                request,
                                supabase,
                            })

                            await supabase.auth.signOut()

                            const blockedResponse = NextResponse.redirect(
                                `${origin}/login?error=oauth_verification_failed`
                            )
                            for (const { name, value, options } of cookiesToSet) {
                                blockedResponse.cookies.set(name, value, options)
                            }
                            return blockedResponse
                        }

                        let isRecreatedUser = false
                        if (approvedRequest) {
                            const userCreatedAt = new Date(user.created_at).getTime()
                            const requestUpdatedAt = new Date(approvedRequest.updated_at).getTime()
                            
                            // If the auth user was created more than 5 minutes AFTER the request was approved,
                            // it means their original account was deleted and Google OAuth just created a new one.
                            if (userCreatedAt > requestUpdatedAt + 5 * 60 * 1000) {
                                isRecreatedUser = true
                                
                                // Reset their request status to pending so admin can review again
                                await supabaseAdmin
                                    .from('account_requests')
                                    .update({ status: 'pending' })
                                    .eq('id', approvedRequest.id)
                            }
                        }

                        if (!profile && (!approvedRequest || isRecreatedUser)) {
                            await logAuditEvent({
                                userId: user.id,
                                userEmail: user.email || undefined,
                                action: AUDIT_ACTIONS.LOGIN_FAILED,
                                resourceType: 'user',
                                resourceId: user.id,
                                details: {
                                    method: 'oauth',
                                    provider: 'google',
                                    reason: 'Account is not approved',
                                    email: user.email,
                                },
                                request,
                                supabase,
                            })

                            // OAuth can auto-create auth.users entries before callback.
                            // Remove unapproved accounts so admin invite flow doesn't get blocked.
                            await supabaseAdmin.auth.admin.deleteUser(user.id)
                            await supabase.auth.signOut()

                            const blockedResponse = NextResponse.redirect(
                                `${origin}/login?error=approval_required`
                            )
                            for (const { name, value, options } of cookiesToSet) {
                                blockedResponse.cookies.set(name, value, options)
                            }
                            return blockedResponse
                        }
                    } catch {
                        await logAuditEvent({
                            userId: user.id,
                            userEmail: user.email || undefined,
                            action: AUDIT_ACTIONS.LOGIN_FAILED,
                            resourceType: 'user',
                            resourceId: user.id,
                            details: {
                                method: 'oauth',
                                provider: 'google',
                                reason: 'Approval check exception',
                                email: user.email,
                            },
                            request,
                            supabase,
                        })

                        await supabase.auth.signOut()

                        const blockedResponse = NextResponse.redirect(
                            `${origin}/login?error=oauth_verification_failed`
                        )
                        for (const { name, value, options } of cookiesToSet) {
                            blockedResponse.cookies.set(name, value, options)
                        }
                        return blockedResponse
                    }
                }

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
