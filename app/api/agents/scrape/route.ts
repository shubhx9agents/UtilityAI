import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { url } = body

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
        }

        // Validate URL
        let parsedUrl: URL
        try {
            parsedUrl = new URL(url.trim())
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid protocol')
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
        }

        console.log(`[Scrape] Using Groq compound to visit: ${parsedUrl.href}`)

        // Use Groq compound model — it natively visits and extracts web content
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
                'Groq-Model-Version': 'latest',
            },
            body: JSON.stringify({
                model: 'groq/compound-mini',
                messages: [
                    {
                        role: 'user',
                        content: `Extract and return ALL the main textual content from this page: ${parsedUrl.href}\n\nReturn only the raw content — all headings, paragraphs, lists, and key data from the page. No commentary, no summarization, no skipping. Preserve the structure with line breaks.`,
                    },
                ],
            }),
            signal: AbortSignal.timeout(25000),
        })

        if (!groqRes.ok) {
            const errText = await groqRes.text()
            console.error(`[Scrape] Groq compound error (${groqRes.status}):`, errText.substring(0, 200))
            return NextResponse.json(
                { error: `Failed to visit URL (${groqRes.status})` },
                { status: 422 }
            )
        }

        const groqData = await groqRes.json()
        const content = groqData.choices?.[0]?.message?.content?.trim() ?? ''

        if (!content || content.length < 50) {
            return NextResponse.json(
                { error: 'Could not extract meaningful content from this URL' },
                { status: 422 }
            )
        }

        // Cap at ~10000 chars to stay within reasonable token limits when combined with other links
        const cappedContent = content.length > 10000
            ? content.substring(0, 10000) + '\n\n[Content truncated at 10000 characters]'
            : content

        console.log(`[Scrape] Success: extracted ${cappedContent.length} chars from ${parsedUrl.hostname}`)

        return NextResponse.json({ content: cappedContent, url: parsedUrl.href })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Scrape] Error:', msg)

        if (msg.includes('timeout') || msg.includes('abort')) {
            return NextResponse.json({ error: 'Request timed out — the URL may be slow or unreachable' }, { status: 422 })
        }

        return NextResponse.json({ error: 'Scrape failed' }, { status: 500 })
    }
}
