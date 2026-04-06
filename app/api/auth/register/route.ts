import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { registerSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeEmail, sanitizeText } from '@/utils/sanitize'
import { rateLimit, AUTH_RATE_LIMIT, getClientIp, isIpBlocked } from '@/lib/security'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request)
        if (isIpBlocked(ip)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const rateLimitResult = await rateLimit(request, AUTH_RATE_LIMIT)
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!
        }

        const body = await request.json()

        // Validate input with Zod (rejects extra fields)
        const validation = validateInput(registerSchema, body)
        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { email, password, name } = validation.data
        const sanitizedEmail = sanitizeEmail(email)
        const sanitizedName = sanitizeText(name)

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

        const { data, error } = await supabase.auth.signUp({
            email: sanitizedEmail,
            password,
            options: {
                data: {
                    name: sanitizedName,
                },
            },
        })

        if (error) {
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 })
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

        // Build response with auth cookies properly set on the response
        const response = NextResponse.json({ data })
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (error: unknown) {
        console.error('Register API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
