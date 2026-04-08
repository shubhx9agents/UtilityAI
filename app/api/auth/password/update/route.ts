import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { updatePasswordSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Get current session
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Check if user is a Google auth user
        if (user.app_metadata.provider === 'google') {
            return NextResponse.json(
                { error: 'Password changes are not available for Google-authenticated users.' },
                { status: 403 }
            )
        }

        // 3. Validate input
        const body = await request.json()
        const validation = validateInput(updatePasswordSchema, body)

        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { currentPassword, newPassword } = validation.data

        // 4. Verify current password
        // The most reliable way to verify the current password in Supabase is to try to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
        })

        if (verifyError) {
            await logAuditEvent({
                userId: user.id,
                userEmail: user.email,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                resourceType: 'user',
                details: { reason: 'Incorrect current password during update' },
                request,
            })
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
        }

        // 5. Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) {
            return NextResponse.json({ error: getErrorMessage(updateError) }, { status: 400 })
        }

        // 6. Log success
        await logAuditEvent({
            userId: user.id,
            userEmail: user.email,
            action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
            resourceType: 'user',
            details: { method: 'settings' },
            request,
        })

        return NextResponse.json({ message: 'Password changed successfully' })

    } catch (error: unknown) {
        console.error('Password Update API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
