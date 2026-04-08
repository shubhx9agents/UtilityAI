import { NextRequest, NextResponse } from 'next/server'
import { sanitizeUrl } from '@/utils/sanitize'

const DEFAULT_ALLOWED_DOMAINS = [
    'your-cdn.com',
    'api.groq.com',
    'googleusercontent.com',
    'gstatic.com',
    'googleapis.com',
    'bytepluses.com',
    'byteplusapi.com',
    'byteimg.com',
    'volces.com',
    'cloudfront.net',
]

const getAllowedDomains = () => {
    const envDomains = (process.env.ALLOWED_IMAGE_PROXY_DOMAINS || '')
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean)

    return Array.from(new Set([...DEFAULT_ALLOWED_DOMAINS, ...envDomains]))
}

const isAllowedHost = (hostname: string) => {
    const normalized = hostname.toLowerCase()
    return getAllowedDomains().some(domain => normalized === domain || normalized.endsWith(`.${domain}`))
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')
    const filename = request.nextUrl.searchParams.get('filename')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 })
    }

    if (!isAllowedHost(parsed.hostname)) {
        return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
    }

    try {
        const sanitized = sanitizeUrl(url)
        const response = await fetch(sanitized)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)

        const blob = await response.blob()
        const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream'
        const safeFilename = (filename && filename.trim()) ? filename.trim() : `generated-image-${Date.now()}.png`

        const headers = new Headers()
        headers.set('Content-Type', contentType)
        headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`)
        headers.set('Cache-Control', 'no-store')

        return new NextResponse(blob, {
            status: 200,
            headers,
        })
    } catch (error: unknown) {
        console.error('Download Proxy Error:', error)
        return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
    }
}
