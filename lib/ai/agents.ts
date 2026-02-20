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
        ],
    },
    image_generation: {
        system_message: 'Professional AI image editing prompts.',
        questions: ['Base Image', 'Instructional Prompt', 'Reference Image (Optional)', 'Image Model'],
        image_fields: ['Base Image', 'Reference Image (Optional)'],
    },
    linkedin_headshot: {
        system_message: 'Generate a professional LinkedIn headshot from any image.',
        questions: ['User Image', 'Instructional Prompt', 'Image Model'],
        image_fields: ['User Image'],
    },
}

const DEFAULT_IMAGE_MODEL = 'nano-banana-pro-preview'
const BYTEPLUS_IMAGE_MODELS = new Set(['seedream-4-0-250828'])

export class AIAgentService {
    constructor() { }

    private resolveImageModel(context: Record<string, any>): string {
        const raw = typeof context.image_model === 'string'
            ? context.image_model
            : (typeof context['Image Model'] === 'string' ? context['Image Model'] : '')
        const trimmed = raw.trim()
        return trimmed || DEFAULT_IMAGE_MODEL
    }

    private isBytePlusModel(model: string): boolean {
        return BYTEPLUS_IMAGE_MODELS.has(model)
    }

    private cleanBase64(dataUrl: string): string {
        if (!dataUrl || typeof dataUrl !== 'string') return ''
        const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.*)$/)
        return match ? match[1] : dataUrl
    }

    private ensureDataUrl(img: string): string {
        if (!img) return ''
        if (img.startsWith('data:image/') || img.startsWith('http')) return img
        // Default to jpeg if no prefix, though ideally we should know the type
        return `data:image/jpeg;base64,${img}`
    }

    private buildGeminiImageParts(images: string[]): Array<{ inlineData: { mimeType: string; data: string } }> {
        const parts: Array<{ inlineData: { mimeType: string; data: string } }> = []
        for (const image of images) {
            const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
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

    private getDimensions(aspectRatio: string = 'Square'): { width: number; height: number; geminiRatio: string } {
        switch (aspectRatio) {
            case 'Portrait':
                return { width: 768, height: 1024, geminiRatio: '3:4' }
            case 'Landscape':
                return { width: 1024, height: 768, geminiRatio: '4:3' }
            case 'Square':
            default:
                return { width: 1024, height: 1024, geminiRatio: '1:1' }
        }
    }

    private async runGeminiImageGeneration(prompt: string, images: string[], model: string, aspectRatio: string = 'Square'): Promise<string> {
        const geminiApiKey = process.env.GEMINI_API_KEY
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY is missing in .env.local')
        }

        // Add aspect ratio instruction to prompt since Gemini API doesn't support it in config
        const aspectRatioInstruction = aspectRatio === 'Portrait'
            ? ' IMPORTANT: Generate the image in PORTRAIT orientation (vertical, 3:4 aspect ratio, taller than wide).'
            : aspectRatio === 'Landscape'
                ? ' IMPORTANT: Generate the image in LANDSCAPE orientation (horizontal, 4:3 aspect ratio, wider than tall).'
                : ' IMPORTANT: Generate the image in SQUARE format (1:1 aspect ratio, equal width and height).';

        const enhancedPrompt = prompt + aspectRatioInstruction;

        const parts = [{ text: enhancedPrompt }, ...this.buildGeminiImageParts(images)]
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    // Note: Gemini API might not support aspectRatio in all versions/models yet, 
                    // but we pass it if supported. If not, prompt engineering or crop might be needed.
                    // For now, attempting to pass it or rely on prompt instruction if API fails.
                    // checking docs, aspectRatio is not standard in v1beta... 
                    // Let's allow prompt to influence it too.
                }
            })
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Gemini API Error: ${text.substring(0, 200)}`)
        }

        const data = await res.json()
        const partsOut = data.candidates?.[0]?.content?.parts || []
        const imagePart = partsOut.find((part: any) => part.inlineData?.data)
        if (imagePart?.inlineData?.data) {
            const mimeType = imagePart.inlineData.mimeType || 'image/png'
            return `data:${mimeType};base64,${imagePart.inlineData.data}`
        }

        const textPart = partsOut.find((part: any) => typeof part.text === 'string')
        if (textPart?.text && textPart.text.trim().startsWith('http')) {
            return textPart.text.trim()
        }

        throw new Error('Gemini image generation returned no image data.')
    }

    async runAgent(
        agentType: AgentType,
        userInput: string,
        context: Record<string, any> = {}
    ): Promise<{ response: string; refined_prompt?: string }> {
        if (!AGENT_CONFIGS[agentType]) {
            throw new Error(`Unknown agent type: ${agentType}`)
        }

        console.log(`[AIAgentService] Running ${agentType} with input:\n${userInput.substring(0, 500)}...`)

        const config = AGENT_CONFIGS[agentType]

        try {
            if (agentType === 'deep_research') {
                return await this.runDeepResearch(userInput, context)
            }


            if (agentType === 'ad_copy') {
                return await this.runAdCopy(userInput, context)
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
    // ... (skip runDeepResearch, runAdCopy, runGroqAgent) ...

    private async runImageGeneration(userInput: string, context: Record<string, any>): Promise<{ response: string; refined_prompt: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        const bytePlusKey = process.env.BYTEPLUS_API_KEY
        const imageModel = this.resolveImageModel(context)
        const aspectRatio = context.aspect_ratio || 'Square'
        const { width, height } = this.getDimensions(aspectRatio)

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        if (this.isBytePlusModel(imageModel) && !bytePlusKey) {
            throw new Error('BYTEPLUS_API_KEY is missing in .env.local')
        }

        try {
            // 1. Groq Call - Refine prompt for ad/product image generation
            const systemMessage = `You are an expert AI image prompt engineer specializing in advertisement and product imagery.
Your task is to take a user's base image and their instructional prompt, and generate a highly detailed, refined prompt for an AI image generator.

CRITICAL REQUIREMENTS:
1. The output must be an AD IMAGE or PRODUCT IMAGE — NOT a portrait or headshot.
2. Focus on the user's instructional prompt as the primary directive.
3. If a base image is provided, describe how to incorporate or transform it per the user's instructions.
4. Include details about composition, lighting, style, and visual quality.
5. Output ONLY the refined prompt text — no preamble, no explanation.`.trim()

            // Extract instructional prompt from context if provided separately
            const instructionalPrompt = typeof context.instructional_prompt === 'string'
                ? context.instructional_prompt.trim()
                : (typeof context['Instructional Prompt'] === 'string'
                    ? context['Instructional Prompt'].trim()
                    : (typeof context.prompt === 'string' ? context.prompt.trim() : ''))
            const groqUserInput = instructionalPrompt
                ? `User Instruction: ${instructionalPrompt}\n\n${userInput}`
                : userInput

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
            const refinedPrompt = groqData.choices?.[0]?.message?.content || groqUserInput

            // 2. Image Generation (Gemini default, BytePlus optional)
            // Only pick up base/reference images — NOT user_image/user_photo (those belong to linkedin_headshot)
            const contextImages = Object.entries(context)
                .filter(([key, val]) => {
                    if (typeof val !== 'string' || !val.startsWith('data:image/')) return false
                    const k = key.toLowerCase()
                    return !k.includes('user_image') && !k.includes('user_photo') && !k.includes('headshot')
                })
                .map(([, val]) => val as string)

            const imageUrl = this.isBytePlusModel(imageModel)
                ? await (async () => {
                    const body = {
                        model: imageModel,
                        prompt: refinedPrompt,
                        image: contextImages.length > 0
                            ? contextImages.slice(0, 2).map(img => this.ensureDataUrl(img))
                            : [
                                this.ensureDataUrl(context.base_image),
                                this.ensureDataUrl(context.reference_image)
                            ].filter(Boolean),
                        response_format: 'url',
                        size: `${width}x${height}`
                    }
                    console.log('[BytePlus Request Body]:', JSON.stringify({ ...body, image: body.image.map(i => i.substring(0, 50) + '...') }))

                    const bytePlusRes = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bytePlusKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    })

                    if (!bytePlusRes.ok) {
                        const text = await bytePlusRes.text()
                        console.error('BytePlus API Error:', text)
                        throw new Error(`BytePlus API Error: ${bytePlusRes.status} - ${text.substring(0, 200)}`)
                    }

                    const bytePlusData = await bytePlusRes.json()
                    const url = bytePlusData.data?.[0]?.url || bytePlusData.url
                    if (!url) {
                        throw new Error('Image Generation failed: No URL returned from BytePlus.')
                    }
                    return url
                })()
                : await this.runGeminiImageGeneration(refinedPrompt, contextImages, imageModel, aspectRatio)

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
        const imageModel = this.resolveImageModel(context)
        const aspectRatio = context.aspect_ratio || 'Square'
        const { width, height } = this.getDimensions(aspectRatio)

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        if (this.isBytePlusModel(imageModel) && !bytePlusKey) {
            throw new Error('BYTEPLUS_API_KEY is missing in .env.local')
        }

        try {
            const backgroundPreference = typeof context.headshot_background === 'string' ? context.headshot_background : ''
            const outfitPreference = typeof context.headshot_outfit === 'string' ? context.headshot_outfit : ''
            // Also read the instructional_prompt field added to the agent config
            const instructionalPrompt = typeof context.instructional_prompt === 'string'
                ? context.instructional_prompt.trim()
                : (typeof context['Instructional Prompt'] === 'string' ? context['Instructional Prompt'].trim() : '')
            const preferenceNotes = [
                instructionalPrompt ? `User style request: ${instructionalPrompt}` : '',
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
            3. If the user provided a style request, follow it as the primary directive for background, attire, and mood.
            4. Detailed background: Use the user's preferred background if provided. Otherwise pick a neutral office, modern library, or soft-focus minimalist architectural background.
            5. Lighting: Soft cinematic studio lighting, butterfly lighting, or natural window light.
            6. Attire: Use the user's preferred attire if provided. Otherwise choose professional business wear (blazer, suit, or smart professional blouse/shirt).
            7. Resolution: High definition, 8k, sharp focus on the eyes, cinematic quality.
            
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

            // 2. Image Generation (Gemini default, BytePlus optional)
            // Only pick up user portrait images — NOT base_image/reference_image (those belong to image_generation)
            const contextImages = Object.entries(context)
                .filter(([key, val]) => {
                    if (typeof val !== 'string' || !val.startsWith('data:image/')) return false
                    const k = key.toLowerCase()
                    return k.includes('user_image') || k.includes('user_photo') || k.includes('headshot') || k === 'user_image'
                })
                .map(([, val]) => val as string)
            // Fallback: if no specific user portrait field found, use the first image in context
            if (contextImages.length === 0) {
                const fallback = Object.values(context).find(val => typeof val === 'string' && (val as string).startsWith('data:image/'))
                if (fallback) contextImages.push(fallback as string)
            }

            const imageUrl = this.isBytePlusModel(imageModel)
                ? await (async () => {
                    const body = {
                        model: imageModel,
                        prompt: refinedPrompt,
                        image: contextImages.length > 0
                            ? [this.ensureDataUrl(contextImages[0])]
                            : [this.ensureDataUrl(context.user_image)].filter(Boolean),
                        response_format: 'url',
                        size: `${width}x${height}`
                    }
                    console.log('[BytePlus LinkedIn Request Body]:', JSON.stringify({ ...body, image: body.image.map(i => i.substring(0, 50) + '...') }))

                    const bytePlusRes = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${bytePlusKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    })

                    if (!bytePlusRes.ok) {
                        const text = await bytePlusRes.text()
                        console.error('BytePlus API Error:', text)
                        throw new Error(`BytePlus API Error: ${bytePlusRes.status} - ${text.substring(0, 200)}`)
                    }

                    const bytePlusData = await bytePlusRes.json()
                    const url = bytePlusData.data?.[0]?.url || bytePlusData.url
                    if (!url) {
                        throw new Error('Image Generation failed: No URL returned from BytePlus.')
                    }
                    return url
                })()
                : await this.runGeminiImageGeneration(refinedPrompt, contextImages, imageModel, aspectRatio)

            return {
                response: imageUrl,
                refined_prompt: refinedPrompt
            }
        } catch (error: any) {
            console.error('LinkedIn Headshot error:', error)
            throw error
        }
    }

    private async runDeepResearch(userInput: string, context: Record<string, any> = {}): Promise<{ response: string }> {
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY
        const groqApiKey = process.env.GROQ_API_KEY

        if (!perplexityApiKey) {
            throw new Error('PERPLEXITY_API_KEY is missing in .env.local')
        }

        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        console.log(`Deep Research: Starting Perplexity call [Key: ${perplexityApiKey.substring(0, 5)}...]`)

        // Extract user inputs from context to build a comprehensive research prompt
        const extractedInputs: Record<string, any> = {}
        const configQuestions = AGENT_CONFIGS['deep_research'].questions
        const explicitUserContext = [
            context.user_input,
            context.instructional_prompt,
            context.prompt,
            context.task,
        ]
            .filter(value => typeof value === 'string' && value.trim().length > 0)
            .map(value => value.trim())
            .join('\n\n')

        // Try to extract values from context using various field name formats
        for (const question of configQuestions) {
            const fieldKey = question.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

            // Check multiple possible field name formats
            const possibleKeys = [
                fieldKey,
                question,
                question.toLowerCase(),
                question.replace(/\s+/g, '_')
            ]

            for (const key of possibleKeys) {
                if (context[key] !== undefined && context[key] !== '') {
                    extractedInputs[question] = context[key]
                    console.log(`[Deep Research Debug] Found match: "${question}" -> context["${key}"] = "${context[key]}"`)
                    break
                }
            }
        }

        const previousStepOutputs = Object.entries(context)
            .filter(([key, value]) => {
                const isStepOutput = key.includes('_output') || key.includes('_response')
                const isImage = typeof value === 'string' && value.startsWith('data:image/')
                return isStepOutput && !isImage && value !== undefined && value !== null && `${value}`.trim() !== ''
            })
            .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)

        // Build a structured research prompt from user inputs
        let researchPrompt = explicitUserContext || userInput

        // If we have extracted inputs, build a detailed prompt
        if (Object.keys(extractedInputs).length > 0) {
            researchPrompt = explicitUserContext
                ? `PRIMARY REQUEST (HIGHEST PRIORITY):\n${explicitUserContext}\n\nSupporting profile context (use only if it does not conflict):\n`
                : 'Conduct comprehensive market and competitor research based on the following information:\n\n'

            for (const [field, value] of Object.entries(extractedInputs)) {
                researchPrompt += `${field}: ${value}\n`
            }

            researchPrompt += '\nIf any supporting profile detail conflicts with the PRIMARY REQUEST, follow the PRIMARY REQUEST.'
            researchPrompt += '\nProvide detailed insights on market trends, competitors, target audience analysis, and strategic recommendations.'

            if (previousStepOutputs.length > 0) {
                researchPrompt += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
            }

            if (!explicitUserContext && userInput?.trim()) {
                researchPrompt += `\n\nExecution context:\n${userInput}`
            }
        } else if (previousStepOutputs.length > 0 && !/previous step outputs/i.test(userInput)) {
            researchPrompt += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
        }

        console.log(`[Deep Research] Using prompt:\n${researchPrompt.substring(0, 300)}...`)

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
                        { role: 'user', content: researchPrompt }
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


    private async runAdCopy(userInput: string, context: Record<string, any> = {}): Promise<{ response: string }> {
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY
        const groqApiKey = process.env.GROQ_API_KEY

        if (!perplexityApiKey || !groqApiKey) {
            throw new Error('Required API keys (PERPLEXITY_API_KEY, GROQ_API_KEY) are missing.')
        }

        // Extract user inputs from context to build a comprehensive ad generation prompt
        const extractedInputs: Record<string, any> = {}
        const configQuestions = AGENT_CONFIGS['ad_copy'].questions
        const explicitUserContext = [
            context.user_input,
            context.instructional_prompt,
            context.prompt,
            context.task,
        ]
            .filter(value => typeof value === 'string' && value.trim().length > 0)
            .map(value => value.trim())
            .join('\n\n')

        // Try to extract values from context using various field name formats
        for (const question of configQuestions) {
            const fieldKey = question.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

            // Check multiple possible field name formats
            const possibleKeys = [
                fieldKey,
                question,
                question.toLowerCase(),
                question.replace(/\s+/g, '_')
            ]

            for (const key of possibleKeys) {
                if (context[key] !== undefined && context[key] !== '') {
                    extractedInputs[question] = context[key]
                    console.log(`[Ad Copy Debug] Found match: "${question}" -> context["${key}"] = "${context[key]}"`)
                    break
                }
            }
        }

        const previousStepOutputs = Object.entries(context)
            .filter(([key, value]) => {
                const isStepOutput = key.includes('_output') || key.includes('_response')
                const isImage = typeof value === 'string' && value.startsWith('data:image/')
                return isStepOutput && !isImage && value !== undefined && value !== null && `${value}`.trim() !== ''
            })
            .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)

        // Build a structured ad generation request from user inputs
        let adRequest = explicitUserContext || userInput

        // If we have extracted inputs, build a detailed prompt
        if (Object.keys(extractedInputs).length > 0) {
            adRequest = explicitUserContext
                ? `PRIMARY REQUEST (HIGHEST PRIORITY):\n${explicitUserContext}\n\nSupporting profile context (use only if it does not conflict):\n`
                : 'Generate ad copy for the following product/service:\n\n'

            for (const [field, value] of Object.entries(extractedInputs)) {
                adRequest += `${field}: ${value}\n`
            }

            adRequest += '\nIf any supporting profile detail conflicts with the PRIMARY REQUEST, follow the PRIMARY REQUEST.'
            adRequest += '\nConduct market research and generate high-converting ad variations based on this information.'

            if (previousStepOutputs.length > 0) {
                adRequest += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
            }

            if (!explicitUserContext && userInput?.trim()) {
                adRequest += `\n\nExecution context:\n${userInput}`
            }
        } else if (previousStepOutputs.length > 0 && !/previous step outputs/i.test(userInput)) {
            adRequest += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
        }

        console.log(`[Ad Copy] Using request:\n${adRequest.substring(0, 300)}...`)

        try {
            // 1. Market Research using Perplexity
            const searchPrompt = `Role: You are an expert Direct Response Marketing Strategist and Deep-Dive Market Researcher.

Task: Conduct a comprehensive market research and competitive analysis based on the user's request: "${adRequest}".
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

REQUIRED ANGLES: Problem-Solution, Benefit-Driven, Emotional, Urgency, Social Proof.

QUANTITY REQUIREMENT (CRITICAL):
- Generate EXACTLY 10 ad variations PER PLATFORM.
- If user requests Instagram and Google, generate 10 for Instagram AND 10 for Google (20 total rows).
- If user requests Facebook, Instagram, and LinkedIn, generate 10 for each (30 total rows).
- DO NOT split 10 ads across multiple platforms. Each platform gets its own 10 ads.
- Mix different angles across the 10 variations for each platform.
- Ensure diversity in messaging, hooks, and CTAs for each platform.

OUTPUT FORMAT RULES:
1. Output ONLY a valid CSV. No preamble, no post-text.
2. Headers MUST be: Platform,Angle,Headline,Body,CTA
3. NO line breaks inside fields. Replace any newlines with spaces.
4. Ensure all fields are properly escaped if they contain commas (use double quotes).
5. Generate 10 unique variations for each requested platform.`

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
${adRequest}`
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



    getAgentQuestions(agentType: AgentType): string[] {
        if (AGENT_CONFIGS[agentType]) {
            return AGENT_CONFIGS[agentType].questions
        }
        return []
    }
}

export const aiService = new AIAgentService()
