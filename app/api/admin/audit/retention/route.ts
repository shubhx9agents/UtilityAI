import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS, archiveOldAuditLogs, purgeAncientAuditLogs } from '@/lib/audit'
import { getErrorMessage } from '@/lib/types/errors'

/**
 * POST /api/admin/audit/retention
 * Triggers audit log archival and purge based on retention policy.
 * - Archive: marks logs older than 90 days as archived
 * - Purge:   deletes logs older than 365 days
 *
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!roleData || roleData.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
        }

        // Parse optional overrides from body
        let activeDays = 90
        let totalRetentionDays = 365
        try {
            const body = await request.json()
            if (body.activeDays && typeof body.activeDays === 'number') {
                activeDays = Math.max(1, Math.floor(body.activeDays))
            }
            if (body.totalRetentionDays && typeof body.totalRetentionDays === 'number') {
                totalRetentionDays = Math.max(activeDays + 1, Math.floor(body.totalRetentionDays))
            }
        } catch {
            // Body is optional; use defaults
        }

        // Step 1: Archive old logs (>90 days by default)
        const archiveResult = await archiveOldAuditLogs(activeDays)

        // Step 2: Purge ancient logs (>365 days by default)
        const purgeResult = await purgeAncientAuditLogs(totalRetentionDays)

        // Audit the retention action itself
        await logAuditEvent({
            userId: user.id,
            userEmail: user.email || undefined,
            action: AUDIT_ACTIONS.ROLE_UPDATED, // closest existing admin action
            resourceType: 'audit_logs',
            details: {
                operation: 'retention_policy_executed',
                activeDays,
                totalRetentionDays,
                archivedCount: archiveResult.archivedCount,
                deletedCount: purgeResult.deletedCount,
            },
            request,
        })

        return NextResponse.json({
            message: 'Audit log retention policy executed successfully',
            archived: archiveResult.archivedCount,
            purged: purgeResult.deletedCount,
            policy: {
                activeDays,
                totalRetentionDays,
            },
        })
    } catch (error: unknown) {
        console.error('Audit retention API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
