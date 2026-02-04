import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, updateUserRole } from '@/lib/admin'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { UserRoleType } from '@/types'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // Verify admin access
        await requireAdmin()

        const { userId } = await params
        const body = await request.json()
        const { role } = body as { role: UserRoleType }

        if (!role || (role !== 'user' && role !== 'admin')) {
            return NextResponse.json(
                { error: 'Invalid role. Must be "user" or "admin"' },
                { status: 400 }
            )
        }

        // Get current admin user
        const supabase = await createClient()
        const {
            data: { user: adminUser },
        } = await supabase.auth.getUser()

        // Update the role
        await updateUserRole(userId, role)

        // Get target user email
        const { data: targetUser } = await supabase.auth.admin.getUserById(userId)

        // Log audit event
        await logAuditEvent({
            userId: adminUser?.id,
            userEmail: adminUser?.email,
            action: AUDIT_ACTIONS.ROLE_UPDATED,
            resourceType: 'user',
            resourceId: userId,
            details: {
                new_role: role,
                target_user_email: targetUser?.user?.email,
            },
            request,
        })

        return NextResponse.json({
            message: 'User role updated successfully',
            data: { userId, role },
        })
    } catch (error: any) {
        console.error('Update role API error:', error)

        if (error.message === 'Unauthorized: Admin access required') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to update user role' },
            { status: 500 }
        )
    }
}
