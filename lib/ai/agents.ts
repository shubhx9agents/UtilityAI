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
    ): Promise<string> {
        if (!this.genAI) {
            throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.')
        }

        if (!AGENT_CONFIGS[agentType]) {
            throw new Error(`Unknown agent type: ${agentType}`)
        }

        const config = AGENT_CONFIGS[agentType]

        try {
            // Use Gemini 2.0 Flash model (latest and fastest)
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

            // Construct the prompt with system message and user input
            const prompt = `${config.system_message}

User Input: ${userInput}

Please provide a detailed, helpful response based on the information provided.`

            // Generate content
            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            return text || 'No response generated. Please try again.'
        } catch (error: any) {
            console.error('Gemini API Error:', error)

            if (error.message?.includes('API key')) {
                throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local')
            }

            throw new Error(`Failed to get response from Gemini: ${error.message || 'Unknown error'}`)
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
