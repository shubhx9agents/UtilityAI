import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { loginSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeEmail } from '@/utils/sanitize'
import { rateLimit, AUTH_RATE_LIMIT, getClientIp, recordFailedLogin, clearFailedLogins, isIpBlocked } from '@/lib/security'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        // Check if IP is blocked
        const ip = getClientIp(request)
        if (isIpBlocked(ip)) {
            return NextResponse.json(
                { error: 'Access denied. Please contact support.' },
                { status: 403 }
            )
        }

        // Apply rate limiting for auth endpoints (5 attempts per 15 minutes)
        const rateLimitResult = await rateLimit(request, AUTH_RATE_LIMIT)
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!
        }

        const body = await request.json()

        // Validate input with Zod (rejects extra fields)
        const validation = validateInput(loginSchema, body)
        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { email, password } = validation.data
        const sanitizedEmail = sanitizeEmail(email)

        if (!sanitizedEmail) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

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

        const { data, error } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password,
        })

        if (error) {
            // Record failed login attempt
            recordFailedLogin(ip, sanitizedEmail)

            // Log failed login for audit trail (SOC 2 CC6.1)
            await logAuditEvent({
                userEmail: sanitizedEmail,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                resourceType: 'user',
                details: { email: sanitizedEmail, reason: getErrorMessage(error) },
                request,
            })

            return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 })
        }

        // Clear failed login attempts on success
        clearFailedLogins(ip, sanitizedEmail)

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

        // Build response with auth cookies properly set on the response
        const response = NextResponse.json({ data })
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (error: unknown) {
        console.error('Login API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
