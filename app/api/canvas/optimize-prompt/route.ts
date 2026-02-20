import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { prompt, label, description } = await req.json()

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            console.error('[Optimize Prompt API] GROQ_API_KEY is missing')
            return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 })
        }

        const systemMessage = `Record: You are an expert prompt engineer specializing in structured AI instructions.
Task: Your goal is to take a user's input and transform it into a professional, context-rich, and highly structured prompt for an AI agent.

CRITICAL REQUIREMENTS:
1. Preserve User Intent: Do NOT change the core meaning or goals of the user's text.
2. Enrich & Refine: Clarify vague points, expand on thin details with relevant industry context, and improve the professional tone.
3. Clarity & Structure: Use clear structure but avoid excessive use of symbols like '#' and '*'. Keep it professional and "clear cut".
4. Completeness: Ensure all necessary parameters for the task are addressed.
5. NO PREAMBLE: Output ONLY the optimized prompt text. Do not say "Here is the optimized prompt" or "Sure, I can help". Do not use multiple levels of bolding or large headers if not necessary.

Context for this input:
- Field Label: ${label || 'General Input'}
- Field Description: ${description || 'N/A'}

User Input to Optimize:
"${prompt}"`.trim()

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error(`[Optimize Prompt API] Groq error (Status ${response.status}):`, error)
            return NextResponse.json({ error: 'Failed to optimize prompt' }, { status: 502 })
        }

        const data = await response.json()
        const optimizedPrompt = data.choices?.[0]?.message?.content?.trim()

        if (!optimizedPrompt) {
            return NextResponse.json({ error: 'Received empty response from AI' }, { status: 502 })
        }

        return NextResponse.json({ optimizedPrompt })
    } catch (error: any) {
        console.error('[Optimize Prompt API] Server error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
