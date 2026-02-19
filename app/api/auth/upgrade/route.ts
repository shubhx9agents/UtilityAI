import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * POST /api/auth/upgrade
 * Upgrades the current authenticated user to premium.
 * Uses service role to bypass RLS — user identity is verified via session cookie first.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify the user is authenticated (using session cookie)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Use service role to update the profile (bypasses RLS entirely)
        const supabaseAdmin = createServiceRoleClient()

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ account_type: 'premium' })
            .eq('id', user.id)

        if (error) {
            console.error('Upgrade DB error:', error)
            return NextResponse.json(
                { error: `Failed to upgrade: ${error.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, type: 'premium' })
    } catch (error: any) {
        console.error('Upgrade API error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to upgrade subscription' },
            { status: 500 }
        )
    }
}
