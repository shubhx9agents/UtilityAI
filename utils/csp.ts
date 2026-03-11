/**
 * Content Security Policy (CSP) Utilities
 * Provides configurable CSP header generation for different environments
 */

export interface CSPDirectives {
    'default-src'?: string[]
    'script-src'?: string[]
    'style-src'?: string[]
    'img-src'?: string[]
    'font-src'?: string[]
    'connect-src'?: string[]
    'frame-src'?: string[]
    'frame-ancestors'?: string[]
    'base-uri'?: string[]
    'form-action'?: string[]
    'object-src'?: string[]
    'media-src'?: string[]
    'worker-src'?: string[]
    'manifest-src'?: string[]
    'upgrade-insecure-requests'?: boolean
    'block-all-mixed-content'?: boolean
}

/**
 * Default CSP configuration for production
 */
export const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        'https://accounts.google.com',
        'https://*.supabase.co',
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components/tailwind
        'https://fonts.googleapis.com',
    ],
    'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.supabase.co',
        'https://*.googleusercontent.com',
        'https://api.groq.com',
        'https://images.unsplash.com',
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
    ],
    'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.groq.com',
        'https://api.perplexity.ai',
        'https://generativelanguage.googleapis.com',
        'https://accounts.google.com',
    ],
    'frame-src': [
        "'self'",
        'https://accounts.google.com',
        'https://*.supabase.co',
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': true,
}

/**
 * Development CSP - more permissive for local development
 */
export const DEV_CSP_DIRECTIVES: CSPDirectives = {
    ...DEFAULT_CSP_DIRECTIVES,
    'connect-src': [
        "'self'",
        'http://localhost:*',
        'ws://localhost:*',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.groq.com',
        'https://api.perplexity.ai',
        'https://generativelanguage.googleapis.com',
        'https://accounts.google.com',
    ],
    'upgrade-insecure-requests': false, // Don't force HTTPS in dev
}

/**
 * Build CSP header string from directives
 */
export function buildCSPHeader(directives: CSPDirectives): string {
    const parts: string[] = []

    for (const [key, value] of Object.entries(directives)) {
        if (value === true) {
            // Boolean directives like upgrade-insecure-requests
            parts.push(key)
        } else if (value === false) {
            // Skip false boolean directives
            continue
        } else if (Array.isArray(value) && value.length > 0) {
            parts.push(`${key} ${value.join(' ')}`)
        }
    }

    return parts.join('; ')
}

/**
 * Get CSP header for current environment
 */
export function getCSPHeader(): string {
    const isDev = process.env.NODE_ENV === 'development'
    const directives = isDev ? DEV_CSP_DIRECTIVES : DEFAULT_CSP_DIRECTIVES
    return buildCSPHeader(directives)
}

/**
 * Generate nonce for inline scripts (for future use)
 * Use this with `script-src 'nonce-{value}'` instead of unsafe-inline
 */
export function generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Buffer.from(array).toString('base64')
}

/**
 * CSP violation report endpoint data structure
 */
export interface CSPViolationReport {
    'csp-report': {
        'blocked-uri': string
        'document-uri': string
        'original-policy': string
        'violated-directive': string
        disposition: 'enforce' | 'report'
        'source-file'?: string
        'line-number'?: number
        'column-number'?: number
    }
}

/**
 * Log CSP violation for monitoring
 */
export function logCSPViolation(report: CSPViolationReport): void {
    const violation = report['csp-report']
    console.warn('CSP Violation:', {
        blockedUri: violation['blocked-uri'],
        violatedDirective: violation['violated-directive'],
        documentUri: violation['document-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
    })
}

/**
 * Security headers to add to all responses
 */
export const SECURITY_HEADERS: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

/**
 * Get all security headers including CSP
 */
export function getAllSecurityHeaders(): Record<string, string> {
    return {
        ...SECURITY_HEADERS,
        'Content-Security-Policy': getCSPHeader(),
    }
}
