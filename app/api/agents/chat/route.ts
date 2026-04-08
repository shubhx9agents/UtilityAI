import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/utils/sanitize'
import { preCheckAgentCredit, deductAgentCreditOnSuccess, creditExhaustedResponse } from '@/lib/credits'
import { getErrorMessage } from '@/lib/types/errors'

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

type GeminiTextPart = { text?: string }
type GeminiCandidate = { content?: { parts?: GeminiTextPart[] } }
type GeminiGenerateResponse = { candidates?: GeminiCandidate[] }

const DEFAULT_GEMINI_VISION_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']
const DEFAULT_VISION_RETRIES_PER_MODEL = 3
const RETRYABLE_GEMINI_STATUSES = new Set([429, 500, 502, 503, 504])

const getVisionModelFallbacks = (): string[] => {
    const envModels = (process.env.GEMINI_VISION_MODELS || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)

    const merged = envModels.length > 0 ? envModels : DEFAULT_GEMINI_VISION_MODELS
    return Array.from(new Set(merged))
}

const getVisionRetryCount = (): number => {
    const raw = Number(process.env.GEMINI_VISION_RETRIES_PER_MODEL || DEFAULT_VISION_RETRIES_PER_MODEL)
    if (!Number.isFinite(raw)) return DEFAULT_VISION_RETRIES_PER_MODEL
    const rounded = Math.floor(raw)
    return Math.min(Math.max(1, rounded), 6)
}

const wait = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
}

const retryBackoffMs = (attempt: number) => Math.min(3500, 500 * Math.pow(2, attempt))

const extractGeminiText = (payload: GeminiGenerateResponse): string | null => {
    const parts = payload.candidates?.[0]?.content?.parts
    if (!parts || parts.length === 0) return null
    const textPart = parts.find((part) => typeof part?.text === 'string')
    const text = textPart?.text?.trim()
    return text && text.length >= 5 ? text : null
}

async function runGeminiVisionWithFallback(
    geminiApiKey: string,
    geminiMessages: Array<{ role: string; parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> }>
): Promise<string> {
    let lastError = 'No response from any model'
    const retriesPerModel = getVisionRetryCount()

    for (const model of getVisionModelFallbacks()) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        for (let attempt = 0; attempt < retriesPerModel; attempt++) {
            try {
                const geminiRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': geminiApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ contents: geminiMessages })
                })

                if (!geminiRes.ok) {
                    const status = geminiRes.status
                    const errorText = await geminiRes.text()
                    const isRetryable = RETRYABLE_GEMINI_STATUSES.has(status)
                    lastError = `[${model}] status=${status} ${errorText}`

                    if (isRetryable && attempt < retriesPerModel - 1) {
                        await wait(retryBackoffMs(attempt))
                        continue
                    }
                    break
                }

                const geminiData = await geminiRes.json() as GeminiGenerateResponse
                const response = extractGeminiText(geminiData)
                if (response) return response

                lastError = `[${model}] No valid response from model`
                if (attempt < retriesPerModel - 1) {
                    await wait(retryBackoffMs(attempt))
                    continue
                }
                break
            } catch (error) {
                lastError = `[${model}] ${getErrorMessage(error)}`
                if (attempt < retriesPerModel - 1) {
                    await wait(retryBackoffMs(attempt))
                    continue
                }
                break
            }
        }
    }
    throw new Error(`Gemini vision failed after model fallback: ${lastError}`)
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

        const preCheck = await preCheckAgentCredit(user.id)
        if (!preCheck.allowed) {
            return NextResponse.json(creditExhaustedResponse(preCheck), { status: 402 })
        }

        const systemMessages: Record<string, string> = {
            deep_research: 'You are a strategic market research expert. Provide actionable insights and analysis.',
            ad_copy: 'You are a direct response copywriting expert. Help refine and improve ad copy.',
            image_generation: 'You are an AI image generation expert. Help users refine their image prompts and provide feedback.',
            linkedin_headshot: 'You are a professional photography and personal branding expert. Analyze headshot photos and provide constructive feedback on lighting, composition, expression, attire, and overall professional appearance. Be specific and actionable.',
            book_writing: 'You are an experienced book editor and writing coach. Give precise, chapter-aware revisions while preserving the author voice.',
            default: 'You are a helpful AI assistant specialized in marketing and business strategy.'
        }

        let systemMessage = systemMessages[agent_type || 'default'] || systemMessages.default

        if (initialContext) {
            systemMessage += `\n\nCONTEXT FROM AGENT OUTPUT:\nThe user has just generated the following content using the ${agent_type} agent. Use this context to answer any follow-up questions:\n\n${initialContext.substring(0, 10000)}`
        }

        const sanitizedMessages = messages.map((msg: { role?: string; content?: string }) => ({
            role: msg.role,
            content: sanitizeText(typeof msg.content === 'string' ? msg.content : '')
        }))

        const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || ''
        const agentKey = agent_type ? `${agent_type}_chat` : 'chat'

        if (uploadedImages && Object.keys(uploadedImages).length > 0) {
            try {
                const geminiApiKey = process.env.GEMINI_API_KEY
                if (!geminiApiKey) {
                    throw new Error('GEMINI_API_KEY is missing')
                }

                const imageParts = buildGeminiImageParts(uploadedImages)
                if (imageParts.length === 0) {
                    throw new Error('No valid base64 image payloads for vision analysis')
                }

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
                const response = await runGeminiVisionWithFallback(geminiApiKey, geminiMessages)
                await deductAgentCreditOnSuccess(user.id, agentKey)
                return NextResponse.json({ response })
            } catch (visionError) {
                console.error('Vision chat failed:', visionError)
                const isImageSpecificAgent = agent_type === 'image_generation' || agent_type === 'linkedin_headshot'
                if (isImageSpecificAgent) {
                    const details = process.env.NODE_ENV !== 'production'
                        ? getErrorMessage(visionError)
                        : undefined
                    return NextResponse.json(
                        { error: 'Image analysis failed for this chat turn. Please retry in a few seconds.', details },
                        { status: 502 }
                    )
                }
                systemMessage += '\n\nNOTE: Image analysis was unavailable for this turn. Use the textual context to answer as helpfully as possible.'
            }
        }

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
            return NextResponse.json({ error: 'Failed to get chat response' }, { status: 500 })
        }

        const groqData = await groqRes.json()
        const response = groqData.choices?.[0]?.message?.content

        if (!response || response.trim().length < 5) {
            return NextResponse.json({ error: 'No valid response generated' }, { status: 500 })
        }

        await deductAgentCreditOnSuccess(user.id, agentKey)
        return NextResponse.json({ response })

    } catch (error: unknown) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
