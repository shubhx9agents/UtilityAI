import { AgentType, AgentConfig } from '@/types'

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
    business_snapshot: {
        system_message: 'Condensed foundational business profile.',
        questions: ['Business name', 'Industry/niche', 'Target audience', 'Mission statement'],
    },
    ad_copy: {
        system_message: 'High-converting ad variations for various platforms.',
        questions: ['Product/Service Name', 'Main Features/Benefits', 'Target Audience', 'Ad Tone (e.g. funny, professional, urgent)', 'Specific Platforms (e.g. Facebook, Instagram, LinkedIn, Google)'],
    },
    graphics: {
        system_message: 'AI-ready image and logo prompts.',
        questions: ['Brand style', 'Color preferences', 'Visual themes'],
    },
    landing_page: {
        system_message: 'High-converting landing page copy.',
        questions: ['Page goal', 'Unique value proposition', 'Key features'],
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
        image_fields: ['Base Image', 'Reference Image (Optional)'],
    },
    linkedin_headshot: {
        system_message: 'Generate a professional LinkedIn headshot from any image.',
        questions: ['User Image'],
        image_fields: ['User Image'],
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

            if (agentType === 'ad_copy') {
                return await this.runAdCopy(userInput)
            }

            if (agentType === 'image_generation') {
                return await this.runImageGeneration(userInput, context)
            }

            if (agentType === 'linkedin_headshot') {
                return await this.runLinkedInHeadshot(userInput, context)
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

    private async runAdCopy(userInput: string): Promise<{ response: string }> {
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY
        const groqApiKey = process.env.GROQ_API_KEY

        if (!perplexityApiKey || !groqApiKey) {
            throw new Error('Required API keys (PERPLEXITY_API_KEY, GROQ_API_KEY) are missing.')
        }

        try {
            // 1. Market Research using Perplexity
            const searchPrompt = `Role: You are an expert Direct Response Marketing Strategist and Deep-Dive Market Researcher.

Task: Conduct a comprehensive market research and competitive analysis based on the user's request: "${userInput}".
 You must reverse-engineer the top players in the market to provide a blueprint for entry and domination.

Instructions:
1.  **Scope:** Analyze both local (specifically India if implied by context) and global top competitors.
2.  **Data Extraction:** Do not just list facts. You must analyze the *business model*, *funnels*, and *psychology* behind the competitors.
3.  **Inference:** If specific pricing or ad data is not explicitly public, use your knowledge base to estimate typical market rates and infer strategies based on common industry patterns.

Output Format:
You must strictly structure your response into the following 7 numbered sections:

### 1. Top Competitors (India + Global)
Select 3-5 top competitors. For each, provide a detailed breakdown including:
* **Name & Website**
* **Niche & Audience:** (Who specifically are they targeting?)
* **What they sell:** (Core offer)
* **Funnel Type:** (e.g., Content -> VSL -> Call, or Free Guide -> Course)
* **Core Promise & USP:** (What makes them unique?)
* **Pricing:** (Specific price points or estimated ranges)
* **Lead Magnet:** (What are they giving away for free?)

### 2. Ad Research
Analyze the advertising strategy (Meta/YouTube/Search). For each major competitor, identify:
* **Hooks:** The first sentence/visual used to grab attention.
* **Message:** The core argument.
* **Creative Style:** (e.g., Selfie video, infographic, testimonial).
* **Angle:** Classify the psychological angle used (e.g., Status, Pain, Desire, Logic, Fear).

### 3. Landing Page & Funnel Breakdown
Reverse engineer their conversion mechanisms.
* **Page Structure:** How is information flowed?
* **Headlines & Emotional Triggers:** What emotions are they leveraging?
* **Social Proof:** How do they prove results?
* **Upsells/Downsells:** What happens after the first "yes"?

### 4. Messaging Patterns Working in the Market
Synthesize the data to find commonalities.
* **Repeated Pains & Desires:** What is everyone talking about?
* **Common Hooks & Objections:** What barriers are they addressing?
* **Winning Angles:** What specific promises are converting right now?

### 5. Customer Insights (Avatar Research)
Create a deep psychological profile of the target customer.
* **Top 10 Pains:** (Specific, visceral problems).
* **Top 10 Desires:** (What they strictly want).
* **Top 10 Objections:** (Why they wouldn't buy).
* **Buying Triggers:** Why do they finally say yes?

### 6. Gap & Opportunity Analysis
Based on the above, identify where a new entrant can win.
* **Market Missing:** What are competitors ignoring?
* **Competitor Blindspots:** What are they not saying?
* **Suggested USP:** A unique angle for the user.
* **Category Definition:** Define a specific sub-niche.
* **Pricing Recommendation:** Where should the user price their offer?

### 7. Proposed Funnel + Ad Direction
Create a strategy for the user.
* **Best Hooks:** Write 3 specific hooks based on the research.
* **Winning Angles:** Which psychological levers to pull.
* **Creative Formats:** What type of content should be created.
* **Funnel Outline:** A step-by-step customer journey.
* **Key Launch Messages:** The core arguments to use in copy.`

            const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${perplexityApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        { role: 'system', content: 'You are a world-class market researcher and ad strategist. Provide deep, data-driven insights. Focus only on relevant platforms.' },
                        { role: 'user', content: searchPrompt }
                    ]
                })
            })

            const contentType = perplexityRes.headers.get('content-type')
            if (!perplexityRes.ok || !contentType?.includes('application/json')) {
                const text = await perplexityRes.text()
                throw new Error(`Perplexity Research Error: ${perplexityRes.status}`)
            }

            const perplexityData = await perplexityRes.json()
            const researchData = perplexityData.choices?.[0]?.message?.content || 'No specific research found.'

            // 2. Ad Copy Generation using Groq
            const systemPrompt = `You are an expert Ad Copy Generator. 
Based on the provided research, generate high-converting ad copies for the requested platforms.

STRICT PLATFORM RULE:
- ONLY generate ads for the platforms explicitly mentioned in the user input.
- If no platform is mentioned, default to Facebook and Instagram.
- DO NOT add extra platforms.

PLATFORM CHARACTER LIMITS (STRICT):
- Facebook: Headline (max 40), Body (max 125)
- Instagram: Body (max 125)
- LinkedIn: Headline (max 70), Body (max 600)
- Google Search: Headline (max 30), Description (max 90)

REQUIRED ANGLES: Problem-Solution, Benefit-Driven, Emotional.

OUTPUT FORMAT RULES:
1. Output ONLY a valid CSV. No preamble, no post-text.
2. Headers MUST be: Platform,Angle,Headline,Body,CTA
3. NO line breaks inside fields. Replace any newlines with spaces.
4. Ensure all fields are properly escaped if they contain commas (use double quotes).
5. Generate variations for each requested angle per platform.`

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
                        {
                            role: 'user',
                            content: `MARKET RESEARCH DATA:
${researchData}

USER INPUT:
${userInput}`
                        }
                    ],
                    temperature: 0.7
                })
            })

            if (!groqRes.ok) throw new Error('Groq generation failed')

            const groqData = await groqRes.json()
            let csvOutput = groqData.choices?.[0]?.message?.content || ''

            // Clean up possible markdown code block wrappers
            csvOutput = csvOutput.replace(/^```csv\n?/, '').replace(/\n?```$/, '').trim()

            return { response: csvOutput }

        } catch (error: any) {
            console.error('Ad Copy Agent Error:', error)
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
            // Dynamically find images in context (as Canvas uses dynamic field names)
            const contextImages = Object.values(context).filter(val => typeof val === 'string' && val.startsWith('data:image/'))

            const bytePlusRes = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bytePlusKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'seedream-4-0-250828',
                    prompt: refinedPrompt,
                    image: contextImages.length > 0 ? contextImages.slice(0, 2) : [
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

    private async runLinkedInHeadshot(userInput: string, context: Record<string, any>): Promise<{ response: string; refined_prompt: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        const bytePlusKey = process.env.BYTEPLUS_API_KEY

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        if (!bytePlusKey) {
            throw new Error('BYTEPLUS_API_KEY is missing in .env.local')
        }

        try {
            const backgroundPreference = typeof context.headshot_background === 'string' ? context.headshot_background : ''
            const outfitPreference = typeof context.headshot_outfit === 'string' ? context.headshot_outfit : ''
            const preferenceNotes = [
                backgroundPreference ? `Preferred background: ${backgroundPreference}` : '',
                outfitPreference ? `Preferred attire: ${outfitPreference}` : ''
            ].filter(Boolean).join('\n')

            // 1. Groq Call - Refine the prompt for LinkedIn Professionalism
            const systemMessage = `
            You are an expert AI prompt engineer specializing in professional photography and portraiture.
            Your task is to take a user's image and request, and generate a highly detailed, comprehensive prompt for an AI image generator (BytePlus seedream-4-0).
            
            The goal is to create a "Natural LinkedIn Professional Photograph".
            
            CRITICAL REQUIREMENTS:
            1. The user's face MUST NOT CHANGE. It must be perfectly preserved and look very realistic.
            2. The style must be professional, high-end, and natural (avoid over-retouching).
            3. Detailed background: Use the user's preferred background if provided. Otherwise pick a neutral office, modern library, or soft-focus minimalist architectural background.
            4. Lighting: Soft cinematic studio lighting, butterfly lighting, or natural window light.
            5. Attire: Use the user's preferred attire if provided. Otherwise choose professional business wear (blazer, suit, or smart professional blouse/shirt).
            6. Resolution: High definition, 8k, sharp focus on the eyes, cinematic quality.
            
            Output ONLY the refined prompt text.
            `.trim()

            const groqUserInput = preferenceNotes ? `${userInput}\n${preferenceNotes}` : userInput

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
                        { role: 'user', content: groqUserInput }
                    ]
                })
            })

            if (!groqRes.ok) {
                throw new Error(`Groq Prompt Refiner Error (Status ${groqRes.status})`)
            }

            const groqData = await groqRes.json()
            const refinedPrompt = groqData.choices?.[0]?.message?.content || "Professional LinkedIn headshot, corporate style, high quality"

            // 2. BytePlus Call
            // Dynamically find images in context (as Canvas uses dynamic field names)
            const contextImages = Object.values(context).filter(val => typeof val === 'string' && val.startsWith('data:image/'))

            const bytePlusRes = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bytePlusKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'seedream-4-0-250828',
                    prompt: refinedPrompt,
                    image: contextImages.length > 0 ? [contextImages[0]] : [
                        context.user_image
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
            console.error('LinkedIn Headshot error:', error)
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
