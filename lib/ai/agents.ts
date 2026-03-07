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
        description: 'World-class marketing strategist and competitor research analyst. Expert in deep niche research and competitive intelligence.',
        system_message: `You are a world-class marketing strategist and competitor research analyst.

You specialize in:
- Deep niche research (India + Global)
- Competitive intelligence
- Funnel deconstruction
- Paid ads analysis (Meta-first)
- Customer psychology & buying behavior
- Positioning, messaging, and category creation

You think in terms of:
- Pains vs desires
- Hormonal / psychological / behavioral triggers (when applicable)
- Status, identity, and emotional drivers
- Market sophistication levels
- Offer-market fit

Your outputs are:
- Extremely detailed
- Based on real-world marketing patterns
- Structured, logical, and example-driven
- Actionable for founders, coaches, consultants, and educators

You NEVER assume the niche.
You ONLY use information provided in the user prompt.

When researching competitors, you:
- Cover India + Global
- Focus on leaders, challengers, and digital-first brands
- Break down funnels, ads, and messaging patterns
- Identify gaps and white-space opportunities

Follow the structure EXACTLY as provided by the user.
Do not skip sections.
Do not compress detail.`,
        questions: [
            'niche',
            'Geography',
            'Target audience',
            'Primary problem I solve',
            'Secondary problems',
            'My experience',
            'Types of cases I\u2019ve worked with',
            'My core philosophy or approach',
            'Primary promise',
            'Important beliefs I hold',
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
    course_generator: {
        system_message: 'Expert curriculum designer and program architect specializing in execution-ready educational systems.',
        questions: [
            'Program Title (Desired)',
            'Core Subject/Expertise Area',
            'Target Audience Details',
            'Learning Objectives',
            'Program Duration (e.g., 4 weeks, 8 modules)',
            'Teaching Style/Tone',
        ],
    },
    book_writing: {
        system_message: 'Generate a complete, high-quality book based on your inputs — fully structured with chapters, storytelling, and a powerful conclusion.',
        questions: [
            'Book Title',
            'Book Genre',
            'Target Audience',
            'Tone of Writing',
            'Purpose of Book',
            'Number of Pages (5 / 10 / 15)',
            'Writing Style (Storytelling / Educational / Persuasive / Conversational / Academic)',
        ],
    },
    webinar_script: {
        system_message: 'Master webinar architect and scriptwriter specializing in high-engagement, professionally paced host scripts.',
        questions: [
            'Webinar Topic/Subject',
            'Target Audience',
            'Goal of the Webinar (e.g., educational, sales, training)',
            'Desired Tone (e.g., conversational, authoritative, energetic)',
            'Key Themes/Talking Points',
            'Call-to-Action (CTA)',
            'How long is the webinar? (15 minutes / 30 minutes / 1 hour)',
        ],
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

            if (agentType === 'course_generator') {
                return await this.runCourseGenerator(userInput, context)
            }

            if (agentType === 'webinar_script') {
                return await this.runWebinarScriptGenerator(userInput, context)
            }

            if (agentType === 'book_writing') {

                return await this.runBookWriting(userInput, context)
            }

            // Default to Groq for all other agents as requested (stick to groq api key only)
            return await this.runGroqAgent(agentType, userInput)
        } catch (error: any) {
            console.error(`AIAgentService Error [${agentType}]:`, error)
            throw new Error(`${agentType.replace('_', ' ')} Agent failed: ${error.message || 'Unknown error'}`)
        }
    }

    private async runWebinarScriptGenerator(userInput: string, context: Record<string, any> = {}): Promise<{ response: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY

        if (!groqApiKey) throw new Error('GROQ_API_KEY is missing in .env.local')
        if (!perplexityApiKey) throw new Error('PERPLEXITY_API_KEY is missing in .env.local')

        const durationKey = Object.keys(context).find(k => k.toLowerCase().includes('how long') || k.toLowerCase().includes('duration'))
        const duration = (durationKey ? context[durationKey] : null) || context.duration || '30 minutes'

        console.log(`[Webinar Script] Starting research for stats and examples for a ${duration} session...`)

        // 1. Research Step: Use Perplexity to find real-world stats, case studies, and examples
        const researchPrompt = `Find specific, documented real-world statistics, quantitative data points, and concrete case studies/examples related to the following webinar topic and details:
        "${userInput}"
        
        Focus on providing:
        - Recent industry statistics (with numbers).
        - Specific company or individual success stories.
        - Proven frameworks or data-backed trends.
        - Common pain points backed by recent surveys or reports.
        
        The research must support a ${duration} webinar, so provide enough depth for a comprehensive session.`

        const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: 'You are a high-level research analyst for professional speakers and brand architects. Provide high-accuracy, data-dense research including specific numbers and real-world case studies.' },
                    { role: 'user', content: researchPrompt }
                ]
            })
        })

        const researchData = perplexityRes.ok
            ? (await perplexityRes.json()).choices?.[0]?.message?.content
            : 'No real-time supplemental research available. Please use generic professional examples and plausible industry stats.'

        // 2. Generation Step: Use Groq to build the script with researched data
        const masterSystemPrompt = `You are a World-Class Webinar Architect and Elite Scriptwriter with over 15 years of experience crafting multi-million dollar webinar funnels. You write for top-tier industry leaders who demand perfection, authority, and high-conversion storytelling.

IDENTITY & PHILOSOPHY:
- STYLE: You write with the gravitas of a high-level consultant and the engagement of a master storyteller.
- VOICE: Natural, authoritative, energetic, and perfectly paced.
- GOAL: To keep the audience glued to their seats for the ENTIRE duration while delivering massive value.
- DATA-DRIVEN: Use the provided research data (stats and examples) to build an ironclad case.

STRICT DURATION & PACING (MANDATORY):
You MUST calculate the word count based on a normal speaking rate of exactly 140 words per minute (WPM).
- For a 15-minute webinar: You MUST write ~2,100 words.
- For a 30-minute webinar: You MUST write ~4,200 words.
- For a 60-minute (1 hour) webinar: You MUST write ~8,400 words.
- For a 120-minute (2 hour) webinar: You MUST write ~16,800 words.

**IMPORTANT**: You are strictly evaluated on meeting the word count for the requested duration. If the duration is "${duration}", your response MUST be comprehensive and detailed enough to fill that time at 140 WPM. Do not summarize. Elaborate on every point, provide sub-examples, and use transitional storytelling to maintain the length without fluff.

REQUIRED SCRIPT ARCHITECTURE:
1. THE HOOK (0-5%): A provocative statement, a striking stat, or a vivid "future state" vision.
2. THE AUTHORITY (5-10%): Build rapport. Why should they listen NOW? (Inject case studies/stats here).
3. THE PROMISE (10-15%): Set the agenda. "By the end of this hour, you will..."
4. THE CONTENT BLOCKS (15-75%): 
   - Break this into 3-5 major Pillars. 
   - For EACH pillar: Explain the Concept -> Provide a REAL-WORLD EXAMPLE (from research) -> Cite a DATA POINT (from research) -> Give a STEP-BY-STEP ACTIONABLE LIST.
5. THE SHIFT (75-85%): Recap the value. Bridge from "How" to "What's Next."
6. THE CALL TO ACTION / CLOSE (85-100%): Clear, persuasive, and high-urgency closing.

FORMATTING REQUIREMENTS:
- Use ## for Section Titles.
- Use ### for Sub-headings.
- Use **[Bold Text]** for Host Instructions (e.g., **[Pause for reflection]**, **[Next Slide: Revenue Chart]**).
- Use Numbered Lists (1. 2. 3.) and Bullet Points for all technical or step-by-step instructions.
- Ensure spoken words are written out in full.

Exclusion Rules:
- NEVER mention AI or your generation process.
- NEVER use generic placeholders like "[Insert Stat Here]". Use the actual data provided or specific plausible examples.
- NEVER cut corners on length. If it's a 1-hour script, the word count must reflect a full hour of speaking.`.trim()

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: masterSystemPrompt },
                    {
                        role: 'user',
                        content: `GENERATE A FULL, ELABORATE WEBINAR SCRIPT FOR A ${duration} SESSION.

TOPIC/USER INPUTS:
${userInput}

SUPPLEMENTAL RESEARCH (STATS & CASE STUDIES):
${researchData}

INSTRUCTIONS: 
1. Use the research data to inject specific numbers and actual real-life examples.
2. Ensure the script length matches the ${duration} timeframe exactly. For a 1-hour session, write with extreme depth.
3. Use a point-wise, structured approach for all instructional parts.`
                    }
                ],
                max_tokens: 8192,
                temperature: 0.75
            })
        })

        if (!groqRes.ok) {
            const text = await groqRes.text()
            throw new Error(`Groq Webinar Script Error (${groqRes.status}): ${text.substring(0, 200)}`)
        }

        const groqData = await groqRes.json()
        const scriptContent = groqData.choices?.[0]?.message?.content

        if (!scriptContent) {
            throw new Error('Webinar Script Agent returned an empty response.')
        }

        return { response: scriptContent }
    }

    private async runBookWriting(userInput: string, context: Record<string, any> = {}): Promise<{ response: string }> {

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        const masterSystemPrompt = `You are an elite ghostwriter with decades of experience writing bestselling books across every genre. You write with deep humanity, emotional intelligence, and literary craft. You have been hired to write a complete, full-length book manuscript.

═══════════════════════════════════════════
IDENTITY & VOICE RULES (NON-NEGOTIABLE)
═══════════════════════════════════════════

1. You are the AUTHOR. Write as the author speaking directly to the reader. Use "you" to address the reader, never referring to them in the third person like "the reader" or "students" or "the audience."
2. NEVER say "In this chapter, we will explore..." — that is AI filler. Just write the content directly.
3. NEVER use the phrase "In conclusion," "To summarize," or any transitional filler that signals AI writing.
4. NEVER mention AI, language models, or that this was generated. You are a human author.
5. NEVER write placeholder text like "[Insert story here]" or "[Example]."
6. Write FULL, RICH, SUBSTANTIAL content in every chapter — not summaries, not outlines, not bullet points of what you "could" write. Write the actual prose.
7. Each paragraph must be at least 4–6 sentences. Chapters must feel genuinely written, not sketched.
8. The tone, genre, and writing style provided by the user must be felt in EVERY sentence — not just mentioned.
9. Weave in the book's purpose, theme, and the reader's world naturally within the prose — never list them as metadata or announce them.

═══════════════════════════════════════════
FORMATTING RULES (STRICTLY FOLLOW)
═══════════════════════════════════════════

START the entire response with the book title, centred and prominent, like this:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BOOK TITLE IN ALL CAPS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Then the author's byline (just: "A Book"), then a blank line, then begin.

EVERY CHAPTER must be separated by this exact page-break marker on its own line:

---PAGE BREAK---

Each chapter/section heading must be on its own line, formatted EXACTLY like this (with ## prefix):

## Chapter [Number]: [Chapter Title]

For the opening preface/foreword, use:

## Preface

For the closing section, use:

## Epilogue

The ## heading and the first paragraph MUST be separated by a blank line. NEVER run the heading into the paragraph on the same line.

Use SUBHEADINGS within a chapter sparingly and only when a genuine topic shift occurs, formatted as:

### Subheading Title

Paragraph spacing: leave one blank line between paragraphs.

═══════════════════════════════════════════
CONTENT DEPTH REQUIREMENT
═══════════════════════════════════════════

Each "page" = approximately 500 words of actual written prose.

Page count rules:

5 Pages (~2,500 words total):
  - Powerful Preface / Opening (1 page)
  - Chapter 1 (1 page)
  - Chapter 2 (1 page)
  - Chapter 3 (1 page)
  - Closing / Epilogue (1 page)

10 Pages (~5,000 words total):
  - Preface (0.5 page)
  - Chapter 1–6 (1.5 pages each avg)
  - Epilogue (0.5 page)

15 Pages (~7,500 words total):
  - Preface (0.5 page)
  - Chapter 1–10 (1.2 pages each avg)
  - A real Case Study or Story chapter
  - Epilogue / Final Reflection (1 page)

HIT THE WORD COUNT. Do not cut short. If you reach 8,000 tokens, continue writing until the book is genuinely complete.

═══════════════════════════════════════════
STORYTELLING & LITERARY QUALITY
═══════════════════════════════════════════

- Open every chapter with a hook: a vivid scene, a provocative question, a striking statement, or an anecdote.
- Build emotional progression: early chapters plant a seed; middle chapters develop conflict or insight; final chapters deliver transformation.
- Use concrete, sensory detail. Show, don't tell.
- If the style is Storytelling: weave a narrative arc with characters, tension, and resolution.
- If Educational: use clear explanations, real-world examples, and a mentor's warmth — not a textbook's coldness.
- If Persuasive: build an iron-clad argument with evidence, logic, and emotional appeals.
- If Conversational: write like you're speaking with a close friend over coffee — relaxed but intelligent.
- If Academic: maintain scholarly rigour, cite reasoning carefully, and use precise language.

═══════════════════════════════════════════
WHAT TO DO WITH USER INPUTS
═══════════════════════════════════════════

The user will give you: title, genre, target audience, tone, purpose, page count, and writing style.

- TITLE: Display as the book's actual title. Let it echo through the book's themes.
- GENRE: Let it shape the genre conventions, tropes, and reader expectations you meet or subvert.
- TARGET AUDIENCE: Understand who they are deeply. Write FOR them — their world, struggles, aspirations — but never announce "this book is for students" inside the prose. Speak to them as equals.
- TONE: This is the emotional colour of every sentence. Inspirational? Every line lifts. Dark? Every line has weight.
- PURPOSE: This is the transformation you're giving the reader. Build towards it.
- WRITING STYLE: This defines the structural and voice approach.
- PAGE COUNT: Determines structure and depth. Honour it fully.`.trim()

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: masterSystemPrompt },
                    {
                        role: 'user',
                        content: `Please write the complete book manuscript using the following details:\n\n${userInput}\n\nRemember: write the FULL book — every page, every chapter, every word of prose. Do not summarise or skip ahead. Begin directly with the book title header and write through to the final page.`
                    }
                ],
                max_tokens: 8192,
                temperature: 0.85
            })
        })

        if (!groqRes.ok) {
            const text = await groqRes.text()
            throw new Error(`Groq Book Writing Error (${groqRes.status}): ${text.substring(0, 200)}`)
        }

        const groqData = await groqRes.json()
        const bookContent = groqData.choices?.[0]?.message?.content

        if (!bookContent) {
            throw new Error('Book Writing Agent returned an empty response.')
        }

        // 1. Convert page break markers to markdown horizontal rules
        let formatted = bookContent.replace(/---PAGE BREAK---/g, '\n\n---\n\n')

        // 2. Ensure lines that look like chapter/section headings but lack ## get promoted
        //    Matches lines like: "Chapter 1: Title" or "Preface" or "Epilogue" at the start of a line
        formatted = formatted.replace(
            /^(Chapter\s+\d+\s*:.*|Preface|Foreword|Epilogue|Final Reflection|Closing Thoughts?)\s*$/gim,
            (match: string) => `## ${match.replace(/^#+\s*/, '').trim()}`
        )

        // 3. Convert ~ Subheading ~ style to ### Subheading
        formatted = formatted.replace(/^~+\s*(.+?)\s*~+\s*$/gim, '### $1')

        // 4. Remove any stray "Conclusion" headings the LLM might still emit and replace with Epilogue
        formatted = formatted.replace(/^(##?\s*)Conclusion\s*$/gim, '$1Epilogue')

        return { response: formatted }
    }

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
        const geo = extractedInputs['Geography'] || extractedInputs['geography'] || 'India + Global'
        let researchPrompt: string

        if (Object.keys(extractedInputs).length > 0 || explicitUserContext) {
            const niche = extractedInputs['niche'] || extractedInputs['Niche'] || ''
            const geography = geo
            const targetAudience = extractedInputs['Target audience'] || extractedInputs['target_audience'] || ''
            const primaryProblem = extractedInputs['Primary problem I solve'] || extractedInputs['primary_problem_i_solve'] || ''
            const secondaryProblems = extractedInputs['Secondary problems'] || extractedInputs['secondary_problems'] || ''
            const experience = extractedInputs['My experience'] || extractedInputs['my_experience'] || ''
            const caseTypes = extractedInputs['Types of cases I\u2019ve worked with'] || extractedInputs['types_of_cases_ive_worked_with'] || ''
            const philosophy = extractedInputs['My core philosophy or approach'] || extractedInputs['my_core_philosophy_or_approach'] || ''
            const primaryPromise = extractedInputs['Primary promise'] || extractedInputs['primary_promise'] || ''
            const beliefs = extractedInputs['Important beliefs I hold'] || extractedInputs['important_beliefs_i_hold'] || ''

            researchPrompt = `My niche: ${niche || explicitUserContext || userInput}

Geography: ${geography}

Target audience: ${targetAudience}

Primary problem I solve: ${primaryProblem}

Secondary problems: ${secondaryProblems}

My experience: ${experience}

Types of cases I've worked with: ${caseTypes}

My core philosophy or approach: ${philosophy}

Primary promise: ${primaryPromise}

Important beliefs I hold: ${beliefs}

TASK:
Act as a world-class marketing strategist + competitor research analyst.
Do a full deep-dive on my niche (${geography}).

Give very detailed answers using real examples.

Follow this exact structure:

1. Top Competitors (${geography})
   For each competitor:
   - Name, Website, Niche, Audience
   - What they sell
   - Funnel type
   - Core promise & USP
   - Pricing
   - Lead magnet (if any)

2. Ad Research
   For each competitor:
   - Meta Ads Library link
   - Break down 3–5 top performing ads:
     - Hook
     - Message
     - Offer
     - Creative style
     - CTA
     - Angle (Pain / Desire / Status / Logic)

3. Landing Page & Funnel Breakdown
   - Page structure
   - Headlines
   - Emotional triggers
   - Social proof
   - Offer positioning
   - Upsells / Downsell flow

4. Messaging Patterns Working in the Market
   - Repeated pains
   - Repeated desires
   - Repeated objections
   - Common hooks
   - Identity/messages they target
   - Winning angles and promises

5. Customer Insights (Avatar Research)
   Give me:
   - Top 10 pains
   - Top 10 desires
   - Top 10 objections
   - Why people buy / don't buy
   - Status + emotional triggers

6. Gap & Opportunity Analysis for ME
   - What the market is missing
   - What competitors are not saying
   - What USP I can own
   - Category I should position myself as
   - Big idea I can dominate
   - Pricing recommendation

7. My Funnel + Ad Direction
   Based on all research, give me:
   - My best hooks
   - Winning angles
   - Big promise
   - Creative formats to use
   - My funnel outline
   - My key messages for launch`

            if (previousStepOutputs.length > 0) {
                researchPrompt += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
            }
        } else {
            researchPrompt = userInput
            if (previousStepOutputs.length > 0 && !/previous step outputs/i.test(userInput)) {
                researchPrompt += `\n\nPrevious workflow step outputs:\n${previousStepOutputs.join('\n\n')}`
            }
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
            const citations: string[] = perplexityData.citations || []
            const searchResults: any[] = perplexityData.search_results || []
            const usageStats = perplexityData.usage || {}
            const researchId = perplexityData.id || ''

            if (!rawOutput) {
                throw new Error('Perplexity returned an empty response.')
            }

            // 2. Groq Structuring — build a flat LLM input with meta + raw output
            const llmInput = `
TASK:
STRUCTURE_AND_EXTRACT

STRICT INSTRUCTIONS:
- Do NOT summarize
- Do NOT add new data
- Do NOT infer missing data
- Preserve all text verbatim
- Preserve all sources and citations
- If data is missing, set value to null
- Output ONLY valid JSON matching the schema

=== META ===
id: ${researchId}
model: sonar

usage:
${JSON.stringify(usageStats, null, 2)}

citations:
${JSON.stringify(citations, null, 2)}

search_results:
${JSON.stringify(searchResults, null, 2)}

=== RAW_ASSISTANT_OUTPUT ===
${rawOutput}

=== END_OF_INPUT ===`.trim()

            const GROQ_STRUCTURING_SYSTEM = `You are an expert competitive intelligence analyst and market research formatter.

Your task is to transform raw competitive analysis data into a structured JSON object.

Parse EVERY piece of data from the input. Do NOT summarize. Do NOT omit. Preserve verbatim text.

Output ONLY a single valid JSON object — no markdown, no code fences, no preamble — matching this exact schema:

{
  "meta_information": {
    "research_id": string,
    "model": string,
    "timestamp": string,
    "usage_stats": { "prompt_tokens": number, "completion_tokens": number, "total_tokens": number, "search_context_size": string, "total_cost": number },
    "citations": string[]
  },
  "competitors": [{
    "name": string, "website": string,
    "profile": { "niche": string, "target_audience": string, "geography": string },
    "offerings": { "what_they_sell": string, "key_features": string[], "core_promise": string, "usp": string },
    "funnel": { "type": string, "stages": string[], "lead_magnet": string | null },
    "pricing": { "model": string, "estimated_range": string | null, "publicly_listed": boolean },
    "metrics": { "resolution_rate": string | null, "automation_level": string | null }
  }],
  "ad_research": [{
    "competitor": string, "platform": string, "ad_library_url": string,
    "ads": [{ "ad_number": number, "hook": string, "message": string, "offer": string, "creative_type": string, "cta": string, "angle": string }]
  }],
  "landing_pages": [{
    "competitor": string, "url": string,
    "structure": { "page_flow": string[], "headlines": string[] },
    "conversion_elements": { "emotional_triggers": string[], "social_proof": string[], "offer_positioning": string, "funnel_path": string }
  }],
  "messaging_patterns": {
    "repeated_pains": string[], "repeated_desires": string[], "repeated_objections": string[],
    "common_hooks": string[], "target_identities": string[],
    "winning_angles": { "pain_to_desire": string, "key_promises": string[] }
  },
  "customer_insights": {
    "top_pains": [{ "rank": number, "pain": string }],
    "top_desires": [{ "rank": number, "desire": string }],
    "top_objections": [{ "rank": number, "objection": string }],
    "buying_psychology": { "why_buy": string[], "why_not_buy": string[] },
    "emotional_triggers": { "status": string, "emotions": string[] }
  },
  "gap_analysis": {
    "market_gaps": string[], "competitor_blind_spots": string[],
    "your_opportunity": {
      "unique_positioning": string, "category_positioning": string, "big_idea": string,
      "pricing_strategy": { "model": string, "tiers": [{ "name": string, "price": string, "features": string }], "competitive_advantage": string }
    }
  },
  "funnel_strategy": {
    "recommended_hooks": string[], "winning_angles": string[], "big_promise": string,
    "creative_formats": string[],
    "funnel_stages": {
      "tofu": { "ad": string, "lead_magnet": string },
      "mofu": { "content": string, "conversion": string },
      "bofu": { "action": string, "offer": string },
      "retention": { "nurture": string, "downsell": string }
    },
    "launch_messaging": string,
    "target_channels": string[]
  }
}`

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'moonshotai/kimi-k2-instruct',
                    messages: [
                        { role: 'system', content: GROQ_STRUCTURING_SYSTEM },
                        { role: 'user', content: llmInput }
                    ],
                    temperature: 0.1,
                    max_tokens: 8192,
                    response_format: { type: 'json_object' }
                })
            })

            if (!groqRes.ok) {
                console.warn('Groq structuring failed, returning raw Perplexity output.')
                return { response: rawOutput }
            }

            const groqData = await groqRes.json()
            const structuredContent = groqData.choices?.[0]?.message?.content

            if (!structuredContent) {
                return { response: rawOutput }
            }

            // Validate it's real JSON before returning — prefix with DEEP_RESEARCH_JSON: so frontend can detect it
            try {
                JSON.parse(structuredContent)
                return { response: `DEEP_RESEARCH_JSON:${structuredContent}` }
            } catch {
                return { response: rawOutput }
            }

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
- Generate at least 3 distinct variations per platform.
- Each variation must use a different hook and psychological angle.

Output Format: Use Markdown with clear headings for each platform and variation.`

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
                        { role: 'user', content: `REQUEST:\n${adRequest}\n\nRESEARCH DATA:\n${researchData}` }
                    ],
                    temperature: 0.8
                })
            })

            if (!groqRes.ok) {
                console.warn('Groq ad generation failed, returning research only.')
                return { response: researchData }
            }

            const groqData = await groqRes.json()
            return { response: groqData.choices?.[0]?.message?.content || researchData }

        } catch (error: any) {
            console.error('Ad Copy multi-step error:', error)
            throw error
        }
    }

    private async runCourseGenerator(userInput: string, context: Record<string, any> = {}): Promise<{ response: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        const perplexityApiKey = process.env.PERPLEXITY_API_KEY

        if (!groqApiKey) throw new Error('GROQ_API_KEY is missing in .env.local')
        if (!perplexityApiKey) throw new Error('PERPLEXITY_API_KEY is missing in .env.local')

        const upstreamInsight = Object.entries(context)
            .filter(([k, v]) => k.includes('_output') || k.includes('_response'))
            .map(([k, v]) => `${k.replace('_output', '').replace('_response', '').toUpperCase()}:\n${v}`)
            .join('\n\n')

        console.log(`[Course Generator] Starting research for specific links and resources...`)

        // 1. Research Step: Use Perplexity to find specific deep links and resources
        const researchPrompt = `Find specific, direct, and high-quality web links and resources for the following course topic/details:
        "${userInput}"
        
        Search for:
        - Specific datasets (e.g., on Kaggle, UCI, or GitHub)
        - Specific academic papers or case studies (direct PDF/page links)
        - Specialized software tools or libraries (official documentation links)
        - High-quality open-source projects or repositories
        
        Ensure all links are safe, specialized, and highly relevant to the subject matter.
        Structure the output with clear categories: Platforms, Specific Projects/Datasets, Recommended Tools, and Case Studies.`

        const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: 'You are a specialized academic researcher finding precise, verified educational resources and specific project links.' },
                    { role: 'user', content: researchPrompt }
                ]
            })
        })

        const researchData = perplexityRes.ok
            ? (await perplexityRes.json()).choices?.[0]?.message?.content
            : 'No real-time supplemental research available.'

        // 2. Generation Step: Use Groq to build the curriculum with researched data
        const systemPrompt = `You are a high-tier curriculum designer, educational strategist, and program architect.
Primary Responsibility: Generate complete, execution-ready educational programs, courses, and modular learning systems.

DELIVERY STYLE:
- Output MUST be in beautiful, professional, and HIGHLY ELABORATIVE Markdown format.
- Use distinct headings (H1, H2, H3), bold text, and clear bullet points.
- **PRIORITIZE TABLES & LISTS**: Use tables and numbered lists extensively to organize information. This makes the content 10/10 in terms of readability.
- **POINT-WISE DETAIL**: Every module, lesson, and strategy must be broken down into specific, actionable points.
- **SPECIFIC WEB LINKS**: You MUST provide direct, specific, and deep links (e.g., kaggle.com/datasets/namespace/slug instead of kaggle.com). Use the provided research data to ensure accuracy. 
- **NO VAGUE LINKS**: Never point to a homepage. Point to the specific resource.
- The report must look "Deep Research" style—comprehensive, authoritative, and ready for a client.

CRITICAL CONSTRAINTS:
1. DO NOT output JSON. Use Markdown ONLY.
2. DO NOT write marketing copy. Focus on SUBSTANCE and EDUCATION.
3. DO NOT produce vague brainstorming content. Be specific and tactical.
4. Ensure every module and lesson has depth. Don't just list them; describe the transformation.
5. **No Loss of Content**: Capture all pedagogical nuances within the structured format.

PROGRAM STRUCTURE TO ELABORATE ON:
# [Program Title]
## 1. Executive Summary & Philosophy
## 2. Target Audience & Transformation Map (Use tables)
## 3. High-Level Program Roadmap (Timeline table)
## 4. Module Breakdown (Iterate through all modules)
   ### Module [N]: [Title]
   - Objective & Outcome
   - Lesson Breakdown (TABLE: Lesson Title | Core Concepts | Practical Task | Specific Deep Links)
   - Exercise Details & Project Links
   - Assessment Criteria
## 5. Delivery Strategy & Tools (TABLE: Tool Name | Function | Direct Download/Access Link)
## 6. Resources & Suggested Enhancements (Include deep links to relevant books, papers, or case studies)

UTILITYAI ALIGNMENT:
- Produce modular components.
- Ensure Canvas workflow compatibility.
- Be authoritative and EXTREMELY detailed.

Generate the complete masterpiece program structure now.`

        const userPrompt = `AUTHORITATIVE CONTEXT FROM CANVAS/WORKFLOW:
${upstreamInsight}

RESEARCHED SPECIFIC LINKS & RESOURCES:
${researchData}

USER INPUT/INSTRUCTIONS:
${userInput}

ADDITIONAL PARAMETERS FROM FORM:
${Object.entries(context)
                .filter(([k]) => !k.includes('_output') && !k.includes('_response') && k !== 'user_input')
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')}

Generate the complete masterpiece program structure now using the researched deep links.`.trim()

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.6
            })
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Groq API Error: ${res.status} - ${text.substring(0, 200)}`)
        }

        const data = await res.json()
        return { response: data.choices?.[0]?.message?.content || '' }
    }

    private async runGroqAgent(agentType: AgentType, userInput: string): Promise<{ response: string }> {
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is missing in .env.local')
        }

        const config = AGENT_CONFIGS[agentType]
        let systemPrompt = config.system_message

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
