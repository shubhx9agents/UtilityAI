import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/types/errors'
import { generateCacheKey, getCachedGeneration, setCachedGeneration } from '@/lib/cache'

export const maxDuration = 120

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { topic } = body
        if (!topic?.trim()) {
            return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
        }

        // ── Check Cache ──
        const cacheKey = generateCacheKey(user.id, 'book_writing_research', topic.trim())
        const cachedResult = await getCachedGeneration(cacheKey)
        if (cachedResult) {
            console.log(`[Cache Hit] Returning cached book research for topic: ${topic}`)
            return NextResponse.json(cachedResult)
        }

        const perplexityApiKey = process.env.PERPLEXITY_API_KEY
        if (!perplexityApiKey) {
            return NextResponse.json({ error: 'PERPLEXITY_API_KEY is not configured' }, { status: 500 })
        }

        // Step 1: Find top 10 books on the topic
        const bookSearchPrompt = `Find the top 10 most popular, highly-rated books about "${topic}".
For each book, provide:
1. Title
2. Author
3. A 2-3 sentence description of what the book covers
4. Key themes (3-5 bullet points)
5. A rough chapter breakdown (list 5-8 chapters with their topics)
6. Amazon link if known (or write "N/A")

Format your response as a JSON array with exactly this structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "description": "What the book covers...",
    "themes": ["theme1", "theme2", "theme3"],
    "chapters": ["Chapter 1: Topic", "Chapter 2: Topic"],
    "amazonLink": "https://amazon.com/... or N/A"
  }
]

Return ONLY the JSON array, no extra text.`

        const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional bibliographer and book researcher. Search the web for real, existing books and return accurate information. Always return valid JSON.'
                    },
                    { role: 'user', content: bookSearchPrompt }
                ]
            })
        })

        if (!perplexityRes.ok) {
            const errorText = await perplexityRes.text()
            throw new Error(`Perplexity API error: ${perplexityRes.status} - ${errorText.substring(0, 200)}`)
        }

        const perplexityData = await perplexityRes.json()
        const rawContent = perplexityData.choices?.[0]?.message?.content || ''

        // Extract JSON from the response
        let books: any[] = []
        try {
            // Try to extract JSON array from the response
            const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                books = JSON.parse(jsonMatch[0])
            } else {
                // Fallback: parse directly
                books = JSON.parse(rawContent)
            }
        } catch {
            // If JSON parsing fails, return a structured error with the raw content for debugging
            console.error('Failed to parse books JSON:', rawContent.substring(0, 500))
            throw new Error('Failed to parse book research results. Please try again.')
        }

        // Ensure we have books data
        if (!Array.isArray(books) || books.length === 0) {
            throw new Error('No books found for this topic. Please try a more specific topic.')
        }

        // Limit to max 10 books
        const topBooks = books.slice(0, 10)

        // Step 2: Generate synthesis — what a new book combining all these should cover
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is not configured')
        }

        const bookSummary = topBooks
            .map((b: any, i: number) => `${i + 1}. "${b.title}" by ${b.author}: ${b.description}. Key themes: ${Array.isArray(b.themes) ? b.themes.join(', ') : 'various'}. Chapters: ${Array.isArray(b.chapters) ? b.chapters.join(', ') : 'various'}`)
            .join('\n\n')

        const outlinePrompt = `You are a world-class book architect. Based on these top 10 books about "${topic}", create a 10-chapter outline for a NEW, ORIGINAL, comprehensive book that synthesizes and surpasses all of them.

TOP BOOKS RESEARCH:
${bookSummary}

Create an outline for an original 50-page (~25,000 word) book with exactly 10 chapters.
Each chapter should be approximately 2,500 words.

Return ONLY this exact JSON structure:
{
  "bookTitle": "A compelling original title for the new book",
  "bookSubtitle": "A descriptive subtitle",
  "introduction": "2-3 sentences about what this book will cover and why it's unique",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "description": "2-3 sentences about what this chapter covers",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"]
    }
  ]
}`

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a master book architect. Return only valid JSON, no markdown fences.' },
                    { role: 'user', content: outlinePrompt }
                ],
                temperature: 0.7,
                max_tokens: 4096,
                response_format: { type: 'json_object' }
            })
        })

        if (!groqRes.ok) {
            const err = await groqRes.text()
            throw new Error(`Groq outline error: ${groqRes.status} - ${err.substring(0, 200)}`)
        }

        const groqData = await groqRes.json()
        const outlineRaw = groqData.choices?.[0]?.message?.content || '{}'
        let outline: any = {}
        try {
            outline = JSON.parse(outlineRaw)
        } catch {
            throw new Error('Failed to parse chapter outline. Please try again.')
        }

        const resultPayload = {
            books: topBooks,
            outline,
            researchSummary: bookSummary
        }

        // Save to Cache
        await setCachedGeneration(cacheKey, resultPayload)

        return NextResponse.json(resultPayload)

    } catch (error: unknown) {
        console.error('[Book Research Error]', error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
