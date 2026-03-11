import { createClient } from '@/lib/supabase/server'
import { AuditAction, AuditLog } from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Log an audit event to the database
 * This function should be called from API routes to track user actions
 */
export async function logAuditEvent({
    userId,
    userEmail,
    action,
    resourceType,
    resourceId,
    details,
    request,
    supabase,
}: {
    userId?: string | null
    userEmail?: string | null
    action: AuditAction
    resourceType?: string
    resourceId?: string
    details?: Record<string, any>
    request?: Request
    supabase?: SupabaseClient
}): Promise<void> {
    try {
        const supabaseClient = supabase || await createClient()

        // Extract IP address and user agent from request if provided
        let ipAddress: string | null = null
        let userAgent: string | null = null

        if (request) {
            // Get IP address from various headers (considering proxies)
            ipAddress =
                request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                request.headers.get('x-real-ip') ||
                request.headers.get('cf-connecting-ip') ||
                null

            userAgent = request.headers.get('user-agent') || null
        }

        // Insert audit log
        const { error } = await supabaseClient.from('audit_logs').insert({
            user_id: userId || null,
            user_email: userEmail || null,
            action,
            resource_type: resourceType || null,
            resource_id: resourceId || null,
            details: details || null,
            ip_address: ipAddress,
            user_agent: userAgent,
        })

        if (error) {
            console.error('Failed to log audit event:', error)
            // Don't throw error - audit logging should not break the main flow
        }
    } catch (error) {
        console.error('Error in logAuditEvent:', error)
        // Silent fail - audit logging is important but not critical
    }
}

/**
 * Get audit logs with optional filters
 * This should only be called by admin users
 */
export async function getAuditLogs(filters?: {
    userId?: string
    action?: AuditAction
    resourceType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}): Promise<{ data: AuditLog[]; count: number }> {
    const supabase = await createClient()

    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }

    if (filters?.action) {
        query = query.eq('action', filters.action)
    }

    if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
    }

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
    }

    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching audit logs:', error)
        throw new Error('Failed to fetch audit logs')
    }

    return {
        data: (data as AuditLog[]) || [],
        count: count || 0,
    }
}

/**
 * Audit action constants for easy reference
 */
export const AUDIT_ACTIONS = {
    // User actions
    USER_LOGIN: 'user.login' as AuditAction,
    USER_LOGOUT: 'user.logout' as AuditAction,
    USER_SIGNUP: 'user.signup' as AuditAction,
    USER_PASSWORD_RESET: 'user.password_reset' as AuditAction,
    USER_DELETED: 'user.deleted' as AuditAction,
    USER_DATA_EXPORT: 'user.data_export' as AuditAction,

    // Session actions
    SESSION_CREATED: 'session.created' as AuditAction,
    SESSION_UPDATED: 'session.updated' as AuditAction,
    SESSION_DELETED: 'session.deleted' as AuditAction,
    SESSION_RESTORED: 'session.restored' as AuditAction,

    // Security events
    LOGIN_FAILED: 'user.login_failed' as AuditAction,
    IP_BLOCKED: 'security.ip_blocked' as AuditAction,
    RATE_LIMITED: 'security.rate_limited' as AuditAction,
    DATA_EXPORTED: 'user.data_exported' as AuditAction,

    // Admin actions
    ROLE_UPDATED: 'role.updated' as AuditAction,
} as const

// ============================================================================
// AUDIT LOG RETENTION / ARCHIVAL (SOC 2 CC7.4)
// ============================================================================

/**
 * Archive audit logs older than the active retention period.
 * Marks logs older than `activeDays` (default 90) as archived by
 * setting `details.archived = true` and `details.archived_at`.
 * Returns the number of rows archived.
 */
export async function archiveOldAuditLogs(
    activeDays: number = 90
): Promise<{ archivedCount: number }> {
    const supabase = await createClient()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - activeDays)
    const cutoffISO = cutoff.toISOString()

    // Update rows that are older than cutoff and not yet archived
    const { data, error } = await supabase.rpc('archive_audit_logs', {
        cutoff_date: cutoffISO,
    })

    if (error) {
        // If the RPC doesn't exist, fall back to a direct update
        console.warn('archive_audit_logs RPC not found, using direct update:', error.message)
        const { data: updatedRows, error: updateError } = await supabase
            .from('audit_logs')
            .update({
                details: {
                    archived: true,
                    archived_at: new Date().toISOString(),
                },
            })
            .lt('created_at', cutoffISO)
            .not('details->>archived', 'eq', 'true')
            .select('id')

        if (updateError) {
            console.error('Failed to archive audit logs:', updateError)
            throw new Error('Failed to archive audit logs')
        }
        return { archivedCount: updatedRows?.length || 0 }
    }

    return { archivedCount: typeof data === 'number' ? data : 0 }
}

/**
 * Purge audit logs older than the total retention period.
 * Deletes logs older than `totalRetentionDays` (default 365).
 * Returns the number of rows deleted.
 */
export async function purgeAncientAuditLogs(
    totalRetentionDays: number = 365
): Promise<{ deletedCount: number }> {
    const supabase = await createClient()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - totalRetentionDays)
    const cutoffISO = cutoff.toISOString()

    const { data: deletedRows, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffISO)
        .select('id')

    if (error) {
        console.error('Failed to purge ancient audit logs:', error)
        throw new Error('Failed to purge audit logs')
    }

    return { deletedCount: deletedRows?.length || 0 }
}
