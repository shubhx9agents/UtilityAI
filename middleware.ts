import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { validateOrigin } from '@/lib/security'

const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || ''

// HTTP methods that change state and require origin validation (CSRF protection)
const STATE_CHANGING_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT'])

function setCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export async function middleware(request: NextRequest) {
    // Handle CORS preflight for API routes
    if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
        return setCorsHeaders(new NextResponse(null, { status: 200 }))
    }

    // Validate request origin for state-changing API requests (CSRF protection)
    if (
        request.nextUrl.pathname.startsWith('/api/') &&
        STATE_CHANGING_METHODS.has(request.method)
    ) {
        if (!validateOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Invalid request origin' },
                { status: 403 }
            )
        }
    }

    const response = await updateSession(request)

    // Add CORS headers to API route responses
    if (request.nextUrl.pathname.startsWith('/api/')) {
        setCorsHeaders(response)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
