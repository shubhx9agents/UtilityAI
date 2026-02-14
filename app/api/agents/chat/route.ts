import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/utils/sanitize'

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
        // Get user from session
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { messages, agent_type, initialContext, uploadedImages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
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

        // Append initial context if provided
        if (initialContext) {
            systemMessage += `\n\nCONTEXT FROM AGENT OUTPUT:\nThe user has just generated the following content using the ${agent_type} agent. Use this context to answer any follow-up questions:\n\n${initialContext.substring(0, 10000)}` // Limit context size
        }

        // Sanitize user messages
        const sanitizedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: sanitizeText(msg.content)
        }))

        const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || ''

        // If images are uploaded, use Gemini Vision API
        if (uploadedImages && Object.keys(uploadedImages).length > 0) {
            const geminiApiKey = process.env.GEMINI_API_KEY
            if (!geminiApiKey) {
                return NextResponse.json(
                    { error: 'GEMINI_API_KEY is missing' },
                    { status: 500 }
                )
            }

            const imageParts = buildGeminiImageParts(uploadedImages)

            // Build conversation history for Gemini
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
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: geminiMessages })
                }
            )

            if (!geminiRes.ok) {
                const errorText = await geminiRes.text()
                console.error('Gemini Vision API Error:', errorText)
                return NextResponse.json(
                    { error: 'Failed to analyze image' },
                    { status: 500 }
                )
            }

            const geminiData = await geminiRes.json()
            const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to analyze the image.'

            return NextResponse.json({ response })
        }

        // Otherwise, use Groq for text-only chat
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY is missing' },
                { status: 500 }
            )
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
            return NextResponse.json(
                { error: 'Failed to get chat response' },
                { status: 500 }
            )
        }

        const groqData = await groqRes.json()
        const response = groqData.choices?.[0]?.message?.content || 'No response generated.'

        return NextResponse.json({ response })
    } catch (error: any) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
