import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        // Get user from session
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { messages, agent_type } = body

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            )
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY is not configured' },
                { status: 500 }
            )
        }

        // Define system messages for different agents
        const systemMessages: Record<string, string> = {
            deep_research: 'You are a strategic market and competitor research expert. Provide detailed, actionable insights based on the conversation. Use markdown formatting for clarity.',
            image_generation: 'You are an AI image generation expert. Help users refine their image prompts and provide creative suggestions. Discuss composition, style, colors, and visual elements.',
            email_sequence: 'You are an email marketing expert. Help users craft compelling email campaigns, subject lines, and sequences. Provide strategic advice on timing, personalization, and conversion optimization.',
            sales_script: 'You are a professional sales coach. Help users develop effective sales scripts, handle objections, and improve their pitch. Provide actionable advice for different sales scenarios.',
            business_snapshot: 'You are a business strategy expert. Help users define their business profile, value proposition, and core offerings.',
            ad_copy: 'You are a professional copywriter specializing in advertising. Create compelling, high-converting ad copy for various platforms.',
            graphics: 'You are a visual design director. helping users describe and plan visual assets for their brand.',
            landing_page: 'You are a conversion rate optimization expert and copywriter. Help users structure and write high-converting landing pages.',
            social_media: 'You are a social media manager. Help users plan content calendars, write engaging posts, and grow their audience.',
            seo: 'You are an SEO specialist. Help users with keyword research, content strategy, and on-page optimization.',
            pricing: 'You are a pricing strategy consultant. Help users structure pricing tiers, define packages, and maximize revenue.',
            growth: 'You are a growth hacker and marketing strategist. Help users optimize their funnel and improve conversion rates.',
            linkedin_headshot: 'You are a professional photography consultant. Help users plan and refine their professional headshots.'
        }

        const systemMessage = systemMessages[agent_type] || 'You are a helpful AI assistant.'

        // Prepare messages for Groq
        const groqMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ]

        // Call Groq API
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 4096
            })
        })

        if (!groqRes.ok) {
            const errorData = await groqRes.json().catch(() => ({}))
            throw new Error(`Groq API Error: ${errorData.error?.message || groqRes.statusText}`)
        }

        const groqData = await groqRes.json()
        const response = groqData.choices?.[0]?.message?.content

        if (!response) {
            throw new Error('Groq returned an empty response.')
        }

        return NextResponse.json({ response })
    } catch (error: any) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to get chat response' },
            { status: 500 }
        )
    }
}
