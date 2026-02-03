import { AgentType, AgentConfig } from '@/types'

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
    business_snapshot: {
        system_message: 'Condensed foundational business profile.',
        questions: ['Business name', 'Industry/niche', 'Target audience', 'Mission statement'],
    },
    ad_copy: {
        system_message: 'Ad variations for multiple platforms.',
        questions: ['Platform', 'Ad objective', 'Key message', 'Target audience'],
    },
    graphics: {
        system_message: 'AI-ready image and logo prompts.',
        questions: ['Brand style', 'Color preferences', 'Visual themes'],
    },
    sales_script: {
        system_message: 'Professional sales scripts and pitch guidance.',
        questions: [
            'Sales scenario (cold call / field sales / B2B / B2C / event pitching, etc.)',
            'Product or service details',
            'Target customer pain points',
            'Additional context or constraints (region, pricing tier, objections, tone, etc.)',
        ],
    },
    landing_page: {
        system_message: 'High-converting landing page copy.',
        questions: ['Page goal', 'Unique value proposition', 'Key features'],
    },
    email_sequence: {
        system_message: 'Ready-to-send marketing and sales email sequences.',
        questions: [
            'Campaign type (cold outreach, follow-up, nurturing, re-engagement, launch, etc.)',
            'Audience segment (persona, role, industry, seniority)',
            'Campaign goal (book a call, demo signup, awareness, conversion)',
            'Additional context (brand tone, region, urgency, compliance notes)',
        ],
    },
    social_media: {
        system_message: 'Post ideas and hashtag strategies.',
        questions: ['Platforms', 'Content pillars', 'Posting frequency'],
    },
    seo: {
        system_message: 'Keywords, outlines, and meta tags.',
        questions: ['Target keywords', 'Content topics', 'Competitors'],
    },
    pricing: {
        system_message: 'Pricing tiers and packaging strategy.',
        questions: ['Cost structure', 'Competitor pricing', 'Value perception'],
    },
    growth: {
        system_message: 'Funnel and conversion optimization.',
        questions: ['Current funnel', 'Conversion goals', 'A/B test ideas'],
    },
    deep_research: {
        system_message: 'Strategic market and competitor research.',
        questions: [
            'niche',
            'Geography',
            'Target audience',
            'Primary problem I solve',
            'Secondary problems',
            'My experience',
            'Types of cases I’ve worked with',
            'My core philosophy or approach',
            'Primary promise',
            'Important beliefs I hold',
        ],
    },
    image_generation: {
        system_message: 'Professional AI image editing prompts.',
        questions: ['Base Image', 'Instructional Prompt', 'Reference Image (Optional)'],
    },
}

export class AIAgentService {
    constructor() { }

    async runAgent(
        agentType: AgentType,
        userInput: string,
        context: Record<string, any> = {}
    ): Promise<{ response: string; refined_prompt?: string }> {
        if (!AGENT_CONFIGS[agentType]) {
            throw new Error(`Unknown agent type: ${agentType}`)
        }

        const config = AGENT_CONFIGS[agentType]

        try {
            if (agentType === 'deep_research') {
                return await this.runDeepResearch(userInput)
            }

            if (agentType === 'image_generation') {
                return await this.runImageGeneration(userInput, context)
            }

            // Default to Groq for all other agents as requested (stick to groq api key only)
            return await this.runGroqAgent(agentType, userInput)
        } catch (error: any) {
            console.error(`AIAgentService Error [${agentType}]:`, error)
            throw new Error(`${agentType.replace('_', ' ')} Agent failed: ${error.message || 'Unknown error'}`)
        }
    }

    private async runDeepResearch(userInput: string): Promise<{ response: string }> {
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY
        const groqApiKey = process.env.GROQ_API_KEY

        if (!perplexityApiKey) {
            throw new Error('PERPLEXITY_API_KEY is missing in .env.local')
        }

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        console.log(`Deep Research: Starting Perplexity call [Key: ${perplexityApiKey.substring(0, 5)}...]`)

        try {
            const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${perplexityApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; UtilityAI/1.0)'
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        { role: 'system', content: AGENT_CONFIGS['deep_research'].system_message },
                        { role: 'user', content: userInput }
                    ]
                })
            })

            const contentType = perplexityRes.headers.get('content-type')
            if (!perplexityRes.ok || !contentType?.includes('application/json')) {
                const text = await perplexityRes.text()
                console.error(`Perplexity Error [${perplexityRes.status}]:`, text)
                if (text.includes('<html>')) {
                    throw new Error(`Perplexity returned an HTML error page. (Status ${perplexityRes.status}). This usually means the API key is invalid or the model name "sonar" is not supported for your account.`)
                }
                throw new Error(`Perplexity API Error: ${text.substring(0, 150)}`)
            }

            const perplexityData = await perplexityRes.json()
            const rawOutput = perplexityData.choices?.[0]?.message?.content

            if (!rawOutput) {
                throw new Error('Perplexity returned an empty response.')
            }

            // 2. Groq Structuring
            const llmInput = `
TASK: REPORT_GENERATION
=== RAW_RESEARCH_DATA ===
${rawOutput}
=== END_OF_INPUT ===`.trim()

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a world-class marketing strategist and researcher. 
                            Your task is to take raw research data and transform it into a stunning, professional, and highly actionable research report.
                            Use Markdown to format the output with clear headings, subheadings, bullet points, and tables.
                            Make it look premium, like a high-end consulting firm's deliverable.
                            Ensure all key insights, competitor details, and strategic recommendations are preserved and highlighted.`
                        },
                        { role: 'user', content: llmInput }
                    ]
                })
            })

            if (!groqRes.ok) {
                console.warn('Groq structuring failed, returning raw Perplexity output.')
                return { response: rawOutput }
            }

            const groqData = await groqRes.json()
            return { response: groqData.choices?.[0]?.message?.content || rawOutput }

        } catch (error: any) {
            console.error('Deep Research multi-step error:', error)
            throw error
        }
    }

    private async runGroqAgent(agentType: AgentType, userInput: string): Promise<{ response: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        const config = AGENT_CONFIGS[agentType]
        let systemPrompt = config.system_message

        // Detailed internal prompts for specific agents to ensure quality regardless of UI minimalistic text
        if (agentType === 'sales_script') {
            systemPrompt = "You are a Sales Script Agent. Generate actionable, on-ground–ready sales guidance for sales representatives doing cold calls, in-person pitching, or mass presentations. Your output must include: 1) Sales Highlights (Core value proposition, key pain points mapped to solutions, objection handling, closing hooks/CTA), 2) Pitch Guidance (Slide-by-slide deck outline, talking points per slide, suggested tone, time allocation, and delivery tips). Format your response professionally using Markdown."
        } else if (agentType === 'email_sequence') {
            systemPrompt = "You are an Email Sequence Agent. Generate ready-to-send email sequences for different marketing and sales campaigns.\n\nSTRICT FORMATTING RULE: For each email, you MUST follow this structure exactly:\n**Subject: [Subject Line]**\n\n[Body Content]\n\n---\n\nEnsure there is at least one empty line between the Subject and the Body. Do not merge lines. Body copy should be optimized for response rate and include appropriate emojis. The output must be professionally formatted and ready for easy copy-pasting."
        }

        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userInput }
                    ],
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

            return { response }
        } catch (error: any) {
            console.error(`Groq Agent Error [${agentType}]:`, error)
            throw error
        }
    }

    private async runImageGeneration(userInput: string, context: Record<string, any>): Promise<{ response: string; refined_prompt: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        const bytePlusKey = process.env.BYTEPLUS_API_KEY

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        if (!bytePlusKey) {
            throw new Error('BYTEPLUS_API_KEY is missing in .env.local')
        }

        try {
            // 1. Groq Call
            const systemMessage = AGENT_CONFIGS['image_generation'].system_message
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
                        { role: 'user', content: userInput }
                    ]
                })
            })

            if (!groqRes.ok) {
                throw new Error(`Groq Prompt Refiner Error (Status ${groqRes.status})`)
            }

            const groqData = await groqRes.json()
            const refinedPrompt = groqData.choices?.[0]?.message?.content || userInput

            // 2. BytePlus
            const bytePlusRes = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bytePlusKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'seedream-4-0-250828',
                    prompt: refinedPrompt,
                    image: [
                        context.base_image,
                        context.reference_image
                    ].filter(Boolean),
                    response_format: 'url',
                    size: '2K'
                })
            })

            if (!bytePlusRes.ok) {
                const text = await bytePlusRes.text()
                console.error('BytePlus API Error:', text)
                throw new Error(`BytePlus API Error: ${bytePlusRes.status}`)
            }

            const bytePlusData = await bytePlusRes.json()
            const imageUrl = bytePlusData.data?.[0]?.url || bytePlusData.url

            if (!imageUrl) {
                throw new Error('Image Generation failed: No URL returned from BytePlus.')
            }

            return {
                response: imageUrl,
                refined_prompt: refinedPrompt
            }
        } catch (error: any) {
            console.error('Image Generation error:', error)
            throw error
        }
    }

    getAgentQuestions(agentType: AgentType): string[] {
        if (AGENT_CONFIGS[agentType]) {
            return AGENT_CONFIGS[agentType].questions
        }
        return []
    }
}

export const aiService = new AIAgentService()
