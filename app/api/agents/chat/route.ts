import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agentChatSchema, validateInput, validationErrorResponse } from '@/lib/validations'
import { sanitizeText } from '@/utils/sanitize'

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

        // Validate input with Zod (rejects extra fields)
        const validation = validateInput(agentChatSchema, body)
        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.errors), { status: 400 })
        }

        const { messages, agent_type } = validation.data

        // Sanitize message content
        const sanitizedMessages = messages.map(msg => ({
            ...msg,
            content: sanitizeText(msg.content)
        }))

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

        const systemMessage = systemMessages[agent_type || 'deep_research'] || 'You are a helpful AI assistant.'

        // Prepare messages for Groq (use sanitized messages)
        const groqMessages = [
            { role: 'system', content: systemMessage },
            ...sanitizedMessages
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
