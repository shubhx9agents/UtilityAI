import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/types/errors'
import { preCheckAgentCredit, deductAgentCreditOnSuccess, creditExhaustedResponse } from '@/lib/credits'
import { generateCacheKey, getCachedGeneration, setCachedGeneration } from '@/lib/cache'

export const maxDuration = 120

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const {
            topic,
            bookTitle,
            bookSubtitle,
            researchSummary,
            chapterNumber,
            totalChapters,
            chapterTitle,
            chapterDescription,
            keyPoints,
            previousChapterTitles = [] as string[],
            forceRefresh = false
        } = body
 
        if (!topic || !chapterNumber || !chapterTitle) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
 
        const isFirstChapter = chapterNumber === 1
 
        // ── Check Cache ──
        const cacheKey = generateCacheKey(user.id, 'book_writing_chapter', `${topic}:${chapterNumber}`, { chapterTitle })
        const cachedResult = !forceRefresh ? await getCachedGeneration(cacheKey) : null
        if (cachedResult) {
            console.log(`[Cache Hit] Returning cached chapter ${chapterNumber} for topic: ${topic}`)
            return NextResponse.json(cachedResult)
        }

        // ── Pre-check Credit (Only on first chapter) ──
        if (isFirstChapter) {
            const preCheck = await preCheckAgentCredit(user.id)
            if (!preCheck.allowed) {
                return NextResponse.json(creditExhaustedResponse(preCheck), { status: 402 })
            }
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
        }

        const isLastChapter = chapterNumber === totalChapters
        const prevChaptersText = previousChapterTitles.length > 0
            ? `\n\nPREVIOUS CHAPTERS ALREADY WRITTEN:\n${previousChapterTitles.map((t: string, i: number) => `- Chapter ${i + 1}: ${t}`).join('\n')}`
            : ''

        const systemPrompt = `You are an elite ghostwriter and expert author with decades of experience writing bestselling non-fiction books. You are writing Chapter ${chapterNumber} of 10 for a comprehensive book on "${topic}".

BOOK DETAILS:
- Title: "${bookTitle}"
- Subtitle: "${bookSubtitle}"
- This is a 10-chapter, 50-page (~25,000 word) book
- Each chapter should be approximately 2,500 words

RESEARCH FOUNDATION:
You have deeply studied and synthesized knowledge from the top 10 books on this topic:
${researchSummary}

WRITING RULES (NON-NEGOTIABLE):
1. Write approximately 2,500 words for this chapter — count carefully, do not write less than 2,000 words
2. Write as the AUTHOR speaking directly to the reader using "you"
3. NEVER say "In this chapter we will explore..." — just START writing the content
4. NEVER use placeholder text
5. Use vivid examples, analogies, and real-world applications
6. Every paragraph must be 4-6 sentences minimum
7. Open with a compelling hook (a story, provocative question, or striking fact)
8. Include practical insights, not just theory
9. Write in an authoritative but approachable tone
10. Ensure continuity with previous chapters (no topic repetition)
${isLastChapter ? '11. End with a powerful conclusion that ties the whole book together and inspires the reader to take action' : '11. End with a natural transition that sets up the next chapter'}

FORMATTING:
- Start directly with: ## Chapter ${chapterNumber}: ${chapterTitle}
- Then a blank line, then your opening paragraph
- Use ### for sub-headings (2-3 per chapter)
- Leave one blank line between paragraphs
- Do NOT use bullet points for the main narrative — prose only
- Short bullet lists only for actionable steps or key summaries`

        const userPrompt = `Write Chapter ${chapterNumber} of the book "${bookTitle}".

CHAPTER DETAILS:
Title: ${chapterTitle}
Description: ${chapterDescription}
Key Points to Cover: ${Array.isArray(keyPoints) ? keyPoints.join(', ') : keyPoints}${prevChaptersText}

${isFirstChapter ? 'This is the FIRST chapter. After the chapter heading, include a brief "About This Book" preface (2-3 paragraphs) before Chapter 1 content begins — but only include it right before Chapter 1.' : ''}

Write the FULL 2,500-word chapter now. Do not summarize. Do not outline. Write the actual prose.`

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
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 8192
            })
        })

        if (!groqRes.ok) {
            const err = await groqRes.text()
            throw new Error(`Groq chapter error: ${groqRes.status} - ${err.substring(0, 200)}`)
        }

        const groqData = await groqRes.json()
        const chapterContent = groqData.choices?.[0]?.message?.content

        if (!chapterContent) {
            throw new Error('Chapter generation returned empty content. Please try again.')
        }

        const resultPayload = {
            chapterContent,
            chapterTitle,
            chapterNumber
        }

        // ── Save to Cache ──
        await setCachedGeneration(cacheKey, resultPayload)

        // ── Deduct Credit (Only on first chapter) ──
        if (isFirstChapter) {
            console.log(`[Credits] Deducting 1 credit for first chapter of book writing (user ${user.id})`)
            await deductAgentCreditOnSuccess(user.id, 'book_writing')
        }

        return NextResponse.json(resultPayload)

    } catch (error: unknown) {
        console.error('[Book Chapter Error]', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
