import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGENT_CONFIGS } from '@/lib/ai/agents'

type InputQuestion = { field: string, label: string, type: 'text' | 'image', group?: string }

const PRIMARY_USER_INPUT_QUESTION: InputQuestion = {
    field: 'user_input',
    label: 'Current business/product context',
    type: 'text',
    group: 'Current Run'
}

const ensurePrimaryUserInputQuestion = (questions: InputQuestion[]): InputQuestion[] => {
    const seen = new Set<string>()
    const normalized: InputQuestion[] = []
    const ordered = [PRIMARY_USER_INPUT_QUESTION, ...questions]

    for (const q of ordered) {
        const field = (q.field || '').trim().toLowerCase()
        if (!field || seen.has(field)) continue
        seen.add(field)
        normalized.push({
            field,
            label: q.label || field,
            type: q.type === 'image' ? 'image' : 'text',
            group: q.group
        })
    }

    return normalized
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { mode, agentIds, currentPlan } = body

        if (!mode || !agentIds || !Array.isArray(agentIds)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
        }

        // 1. Get Agent Schemas
        const agentSchemas = agentIds.map(id => ({
            id,
            name: AGENT_CONFIGS[id as keyof typeof AGENT_CONFIGS]?.system_message || id,
            questions: AGENT_CONFIGS[id as keyof typeof AGENT_CONFIGS]?.questions || [],
            image_fields: AGENT_CONFIGS[id as keyof typeof AGENT_CONFIGS]?.image_fields || []
        }))

        // 2. Branch based on mode
        if (mode === 'manual') {
            return await handleManualMode(agentSchemas, groqApiKey)
        } else {
            // Hybrid Mode
            const { data: onboarding } = await supabase
                .from('onboarding_progress')
                .select('step_outputs')
                .eq('user_id', user.id)
                .maybeSingle()

            return await handleHybridMode(agentSchemas, onboarding?.step_outputs || {}, groqApiKey)
        }

    } catch (error: any) {
        console.error('Input config error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function handleManualMode(schemas: any[], apiKey: string) {
    const prompt = `You are a workflow architect. Merge these agent input requirements into a single, deduplicated, and logically structured list of questions.
    
    RULES:
    1. Merge semantically overlapping fields (e.g., "Product Details" + "Product Info" -> one question).
    2. Maintain a structured hierarchy: General Info, Product/Service, Target Audience, Brand, Technical, Media.
    3. NO LIMIT on the number of questions.
    4. Group questions logically.
    5. Preserved "type": "image" for image fields.
    6. Always include "Image Model" (type: text) if any agent is an image generator.
    
    AGENT SCHEMAS:
    ${JSON.stringify(schemas, null, 2)}
    
    Return ONLY a JSON array: [{"field": "string", "label": "string", "type": "text" | "image", "group": "string"}]`

    const response = await callGroq(prompt, apiKey)
    const questions = Array.isArray(response) ? response : []
    return NextResponse.json({ inputs: ensurePrimaryUserInputQuestion(questions) })
}

async function handleHybridMode(schemas: any[], onboardingData: any, apiKey: string) {
    const prompt = `You are a workflow architect. I have onboarding metadata for this user.
    I need to generate follow-up questions for a multi-agent workflow.
    
    CRITICAL RULES:
    1. Extract ALL relevant fields from ONBOARDING DATA that match the agent requirements.
    2. For each agent, map onboarding fields to agent fields:
       - deep_research: niche, Geography, Target audience, Primary problem I solve, Secondary problems, My experience, Types of cases I've worked with, My core philosophy or approach, Primary promise
       - ad_copy: Product/Service Name (from onboarding product/service), Main Features/Benefits, Target Audience, Ad Tone, Specific Platforms
       - image_generation: extract any relevant visual/brand details
    3. DO NOT just inject "niche" alone - extract ALL matching fields from onboarding.
    4. Only ask new_questions for fields that are NOT available in onboarding data.
    5. If onboarding has product details, extract them for ad_copy agent.
    6. Always include "Image Model" (type: text) if any agent is an image generator.
    
    ONBOARDING DATA:
    ${JSON.stringify(onboardingData, null, 2)}
    
    AGENT SCHEMAS:
    ${JSON.stringify(schemas, null, 2)}
    
    Return ONLY a JSON object: 
    {
      "injected_data": {"field_id": "value"},  // Extract ALL relevant fields, not just one!
      "new_questions": [{"field": "string", "label": "string", "type": "text" | "image", "group": "string"}]
    }`

    const response = await callGroq(prompt, apiKey)
    const injectedData = response && typeof response === 'object' && !Array.isArray(response)
        ? (response.injected_data || {})
        : {}
    const newQuestions = response && typeof response === 'object' && !Array.isArray(response) && Array.isArray(response.new_questions)
        ? response.new_questions
        : []

    return NextResponse.json({
        injected_data: injectedData,
        new_questions: ensurePrimaryUserInputQuestion(newQuestions)
    })
}

async function callGroq(prompt: string, apiKey: string) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })
    })

    if (!res.ok) throw new Error('Groq API failed')
    const data = await res.json()
    const content = data.choices[0].message.content
    try {
        const parsed = JSON.parse(content)
        // If it's the manual mode array, it might be wrapped or direct
        return parsed.inputs || parsed.new_questions ? parsed : (Array.isArray(parsed) ? parsed : Object.values(parsed)[0])
    } catch (e) {
        console.error('Failed to parse Groq JSON:', content)
        throw new Error('Invalid JSON from AI')
    }
}
