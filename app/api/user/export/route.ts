import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { rateLimit, API_RATE_LIMIT } from '@/lib/security'
import { getErrorMessage } from '@/lib/types/errors'

export async function GET(request: NextRequest) {
    try {
        // Rate limit to prevent abuse
        const rateLimitResult = await rateLimit(request, API_RATE_LIMIT)
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!
        }

        // Authenticate the requesting user
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to export your data.' },
                { status: 401 }
            )
        }

        const userId = user.id

        // Fetch all user data from every related table
        const [
            profileResult,
            onboardingResult,
            flowsResult,
            canvasesResult,
            notesResult,
            libraryResult,
            sessionsResult,
            workflowsResult,
            executionsResult,
            historySummariesResult,
            usageResult,
            creditTransactionsResult,
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId),
            supabase.from('onboarding_progress').select('*').eq('user_id', userId),
            supabase.from('flows').select('*').eq('user_id', userId),
            supabase.from('canvases').select('*').eq('user_id', userId),
            supabase.from('notes').select('*').eq('user_id', userId),
            supabase.from('library_items').select('*').eq('user_id', userId),
            supabase.from('agent_sessions').select('*').eq('user_id', userId),
            supabase.from('workflows').select('*').eq('user_id', userId),
            supabase.from('workflow_executions').select('*').eq('user_id', userId),
            supabase.from('agent_history_summaries').select('*').eq('user_id', userId),
            supabase.from('user_usage').select('*').eq('user_id', userId),
            supabase.from('credit_transactions').select('*').eq('user_id', userId),
        ])

        const exportData = {
            export_metadata: {
                exported_at: new Date().toISOString(),
                user_id: userId,
                user_email: user.email || null,
                format: 'JSON',
                gdpr_article: 'Article 20 – Right to Data Portability',
            },
            auth_user: {
                id: user.id,
                email: user.email || null,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at || null,
            },
            profile: profileResult.data || [],
            onboarding_progress: onboardingResult.data || [],
            flows: flowsResult.data || [],
            canvases: canvasesResult.data || [],
            notes: notesResult.data || [],
            library_items: libraryResult.data || [],
            agent_sessions: sessionsResult.data || [],
            workflows: workflowsResult.data || [],
            workflow_executions: executionsResult.data || [],
            agent_history_summaries: historySummariesResult.data || [],
            user_usage: usageResult.data || [],
            credit_transactions: creditTransactionsResult.data || [],
        }

        // Log the export for audit
        await logAuditEvent({
            userId,
            userEmail: user.email || undefined,
            action: AUDIT_ACTIONS.USER_DATA_EXPORT,
            resourceType: 'user',
            resourceId: userId,
            details: {
                email: user.email,
                exported_at: exportData.export_metadata.exported_at,
                reason: 'GDPR Right to Data Portability – user-initiated data export',
            },
            request,
        })

        // Return as downloadable JSON file
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="user_data_export_${userId}_${Date.now()}.json"`,
            },
        })
    } catch (error: unknown) {
        console.error('User export API error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
