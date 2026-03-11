import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { loginSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeEmail } from '@/utils/sanitize'
import { rateLimit, AUTH_RATE_LIMIT, getClientIp, recordFailedLogin, clearFailedLogins, isIpBlocked } from '@/lib/security'

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

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password,
        })

        if (error) {
            // Record failed login attempt
            recordFailedLogin(ip, sanitizedEmail)
            return NextResponse.json({ error: error.message }, { status: 400 })
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

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Login API error:', error)
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        )
    }
}
