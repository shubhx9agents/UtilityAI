import { NextRequest, NextResponse } from 'next/server'
import { sanitizeUrl } from '@/utils/sanitize'

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL is from allowed domains only
    const ALLOWED_DOMAINS = ['your-cdn.com', 'api.groq.com']
    try {
        const parsed = new URL(url)
        if (!ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d))) {
            return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    try {
        const sanitized = sanitizeUrl(url)
        const response = await fetch(sanitized)
        if (!response.ok) throw new Error('Failed to fetch image')

        const blob = await response.blob()
        const headers = new Headers()
        // Force octet-stream to ensure browser download
        headers.set('Content-Type', 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename="generated-image-${Date.now()}.png"`)

        return new NextResponse(blob, {
            status: 200,
            headers,
        })
    } catch (error: any) {
        console.error('Download Proxy Error:', error)
        return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
    }
}
