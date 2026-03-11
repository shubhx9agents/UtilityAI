import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/utils/sanitize'
import { preCheckAgentCredit, deductAgentCreditOnSuccess, creditExhaustedResponse } from '@/lib/credits'
import { getErrorMessage } from '@/lib/types/errors'

// Build Gemini image parts from base64 data
function buildGeminiImageParts(images: Record<string, string>): Array<{ inlineData: { mimeType: string; data: string } }> {
    const parts: Array<{ inlineData: { mimeType: string; data: string } }> = []
    for (const imageData of Object.values(images)) {
        const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
        if (!match) continue
        parts.push({
            inlineData: {
                mimeType: match[1],
                data: match[2]
            }
        })
    }
    return parts
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { messages, agent_type, initialContext, uploadedImages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
        }

        // ── 1. Pre-check aggregate credit limit (no deduction yet) ──
        const preCheck = await preCheckAgentCredit(user.id)
        if (!preCheck.allowed) {
            return NextResponse.json(creditExhaustedResponse(preCheck), { status: 402 })
        }

        // System messages for different agent types
        const systemMessages: Record<string, string> = {
            deep_research: 'You are a strategic market research expert. Provide actionable insights and analysis.',
            ad_copy: 'You are a direct response copywriting expert. Help refine and improve ad copy.',
            image_generation: 'You are an AI image generation expert. Help users refine their image prompts and provide feedback.',
            linkedin_headshot: 'You are a professional photography and personal branding expert. Analyze headshot photos and provide constructive feedback on lighting, composition, expression, attire, and overall professional appearance. Be specific and actionable.',
            default: 'You are a helpful AI assistant specialized in marketing and business strategy.'
        }

        let systemMessage = systemMessages[agent_type || 'default'] || systemMessages.default

        if (initialContext) {
            systemMessage += `\n\nCONTEXT FROM AGENT OUTPUT:\nThe user has just generated the following content using the ${agent_type} agent. Use this context to answer any follow-up questions:\n\n${initialContext.substring(0, 10000)}`
        }

        const sanitizedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: sanitizeText(msg.content)
        }))

        const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || ''
        const agentKey = agent_type ? `${agent_type}_chat` : 'chat'

        // ── 2. Call the LLM (Gemini for images, Groq for text) ──

        if (uploadedImages && Object.keys(uploadedImages).length > 0) {
            const geminiApiKey = process.env.GEMINI_API_KEY
            if (!geminiApiKey) {
                return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 })
            }

            const imageParts = buildGeminiImageParts(uploadedImages)
            const geminiMessages = [
                {
                    role: 'user',
                    parts: [
                        { text: systemMessage },
                        ...imageParts,
                        { text: `Here are the uploaded images for analysis. ${lastUserMessage}` }
                    ]
                }
            ]

            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': geminiApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ contents: geminiMessages })
                }
            )

            if (!geminiRes.ok) {
                const errorText = await geminiRes.text()
                console.error('Gemini Vision API Error:', errorText)
                // No credit deducted — API failure
                return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
            }

            const geminiData = await geminiRes.json()
            const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

            // ── 3. Validate & deduct only on valid response ──
            if (!response || response.trim().length < 5) {
                return NextResponse.json({ error: 'No valid response from vision model' }, { status: 500 })
            }

            await deductAgentCreditOnSuccess(user.id, agentKey)
            return NextResponse.json({ response })
        }

        // Text-only path — Groq
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY is missing' }, { status: 500 })
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemMessage },
                    ...sanitizedMessages
                ]
            })
        })

        if (!groqRes.ok) {
            const errorText = await groqRes.text()
            console.error('Groq API Error:', errorText)
            // No credit deducted — API failure
            return NextResponse.json({ error: 'Failed to get chat response' }, { status: 500 })
        }

        const groqData = await groqRes.json()
        const response = groqData.choices?.[0]?.message?.content

        // ── 3. Validate & deduct only on valid response ──
        if (!response || response.trim().length < 5) {
            return NextResponse.json({ error: 'No valid response generated' }, { status: 500 })
        }

        await deductAgentCreditOnSuccess(user.id, agentKey)
        return NextResponse.json({ response })

    } catch (error: unknown) {
        console.error('Chat API Error:', error)
        // No credit deducted — uncaught error
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
