import { GoogleGenerativeAI } from '@google/generative-ai'
import { AgentType, AgentConfig } from '@/types'

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
    business_snapshot: {
        system_message:
            "You are a Business Snapshot Agent. Ask targeted questions about the user's business name, industry, target audience, and mission. Provide a concise foundational business profile.",
        questions: ['Business name', 'Industry/niche', 'Target audience', 'Mission statement'],
    },
    ad_copy: {
        system_message:
            'You are an Ad Copy Agent. Create compelling ad variations for different platforms (Google, Facebook, LinkedIn) with headlines and descriptions.',
        questions: ['Platform', 'Ad objective', 'Key message', 'Target audience'],
    },
    graphics: {
        system_message:
            'You are a Graphics Generator Agent. Create detailed image prompts for logos, brand assets, and social media graphics based on brand style.',
        questions: ['Brand style', 'Color preferences', 'Visual themes'],
    },
    sales_script: {
        system_message:
            'You are a Sales Call Script Agent. Generate effective sales scripts with objection handling and closing techniques.',
        questions: ['Sales scenario', 'Product/service details', 'Target pain points'],
    },
    landing_page: {
        system_message:
            'You are a Landing Page Copy Agent. Create compelling landing page content with headlines, sections, and CTAs.',
        questions: ['Page goal', 'Unique value proposition', 'Key features'],
    },
    email_sequence: {
        system_message:
            'You are an Email Sequence Agent. Design complete email campaigns with subject lines and content for different stages.',
        questions: ['Campaign type', 'Audience segment', 'Campaign goal'],
    },
    social_media: {
        system_message:
            'You are a Social Media Content Agent. Create platform-specific posts, content calendars, and hashtag strategies.',
        questions: ['Platforms', 'Content pillars', 'Posting frequency'],
    },
    seo: {
        system_message:
            'You are an SEO & Content Strategy Agent. Provide keyword research, blog outlines, and meta descriptions.',
        questions: ['Target keywords', 'Content topics', 'Competitors'],
    },
    pricing: {
        system_message:
            'You are a Product Pricing & Packaging Agent. Design pricing tiers, value propositions, and packaging strategies.',
        questions: ['Cost structure', 'Competitor pricing', 'Value perception'],
    },
    growth: {
        system_message:
            'You are a Growth & CRO Agent. Provide optimization recommendations, test hypotheses, and funnel improvements.',
        questions: ['Current funnel', 'Conversion goals', 'A/B test ideas'],
    },
    deep_research: {
        system_message:
            'You are a world-class marketing strategist and competitor research analyst. You specialize in deep niche research, competitive intelligence, and customer psychology.',
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
        system_message:
            'You are an expert Image Editing Prompt Designer. Your job is to convert the user\'s request into a clean, simple, professional editing prompt for an AI image editor.',
        questions: ['Base Image', 'Instructional Prompt', 'Reference Image (Optional)'],
    },
}

export class AIAgentService {
    private genAI: GoogleGenerativeAI | null = null

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey)
        }
    }

    async runAgent(
        agentType: AgentType,
        userInput: string,
        context: Record<string, any> = {}
    ): Promise<{ response: string; refined_prompt?: string }> {
        if (!this.genAI) {
            throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.')
        }

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

            // Use Gemini 2.0 Flash model (latest and fastest)
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

            // Construct the prompt with system message and user input
            const prompt = `${config.system_message}

User Input: ${userInput}

Please provide a detailed, helpful response based on the information provided.`

            // Generate content
            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            return { response: text || 'No response generated. Please try again.' }
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
