import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * GET /api/auth/subscription
 * Returns the current user's subscription type ('free' | 'premium') from DB.
 */
export async function GET(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ type: 'free' })
        }

        // Use service role to reliably read the profile
        const supabaseAdmin = createServiceRoleClient()
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('account_type')
            .eq('id', user.id)
            .single()

        const type = profile?.account_type === 'premium' || profile?.account_type === 'enterprise'
            ? 'premium'
            : 'free'

        return NextResponse.json({ type })
    } catch (error: any) {
        console.error('Subscription GET error:', error)
        return NextResponse.json({ type: 'free' })
    }
}
