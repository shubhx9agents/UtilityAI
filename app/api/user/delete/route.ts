import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { rateLimit, AUTH_RATE_LIMIT } from '@/lib/security'
import { getErrorMessage } from '@/lib/types/errors'

export async function POST(request: NextRequest) {
    try {
        // Rate limit to prevent abuse
        const rateLimitResult = await rateLimit(request, AUTH_RATE_LIMIT)
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!
        }

        // Authenticate the requesting user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to delete your account.' },
                { status: 401 }
            )
        }

        const userId = user.id
        const userEmail = user.email || 'unknown'

        // Log the deletion request BEFORE deleting (audit_logs uses ON DELETE SET NULL,
        // so the log is preserved with user_id set to NULL after auth.users row is removed)
        await logAuditEvent({
            userId,
            userEmail,
            action: AUDIT_ACTIONS.USER_DELETED,
            resourceType: 'user',
            resourceId: userId,
            details: {
                email: userEmail,
                deleted_at: new Date().toISOString(),
                reason: 'GDPR Right to Erasure – user-initiated account deletion',
            },
            request,
        })

        // Use service-role client to delete the user from auth.users.
        // All related data in public tables is cascade-deleted by the database
        // foreign key constraints (profiles, flows, canvases, notes, library_items,
        // agent_sessions, onboarding_progress, user_roles, workflows,
        // workflow_executions, agent_history_summaries, user_usage,
        // credit_transactions). audit_logs.user_id is SET NULL (preserved for compliance).
        const serviceClient = createServiceRoleClient()
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('Failed to delete user:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete account. Please try again or contact support.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Your account and all associated data have been permanently deleted.',
        })
    } catch (error: unknown) {
        console.error('User delete API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
