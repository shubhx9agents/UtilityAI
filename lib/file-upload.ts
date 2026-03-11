/**
 * File Upload Protection Utilities
 * Validates file types, sizes, and sanitizes filenames
 * Prevents malware and malicious file uploads
 */

// ============================================================================
// ALLOWED FILE TYPES
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
] as const

export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
] as const

export const ALLOWED_FILE_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
] as const

export type AllowedMimeType = typeof ALLOWED_FILE_TYPES[number]

// ============================================================================
// FILE SIZE LIMITS
// ============================================================================

export const FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024,      // 5MB for images
    document: 10 * 1024 * 1024,  // 10MB for documents
    default: 10 * 1024 * 1024,   // 10MB default max
} as const

// Correct Content-Type for serving SVG files (must NOT be served as text/html)
export const SVG_CONTENT_TYPE = 'image/svg+xml' as const

// ============================================================================
// DANGEROUS PATTERNS
// ============================================================================

// File extensions that are dangerous
const DANGEROUS_EXTENSIONS = [
    '.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1',
    '.vbs', '.js', '.jar', '.php', '.py', '.rb',
    '.pl', '.cgi', '.asp', '.aspx', '.jsp',
    '.scr', '.pif', '.com', '.msi', '.app',
    '.dmg', '.pkg', '.deb', '.rpm',
    '.htaccess', '.htpasswd', '.html', '.htm', '.shtml'
]

// Magic bytes for file type verification
const FILE_SIGNATURES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface FileValidationResult {
    valid: boolean
    error?: string
    sanitizedName?: string
    sanitizedSvgContent?: string
}

/**
 * Validate file MIME type
 */
export function validateMimeType(
    mimetype: string,
    allowedTypes: readonly string[] = ALLOWED_FILE_TYPES
): boolean {
    return allowedTypes.includes(mimetype as AllowedMimeType)
}

/**
 * Validate file size
 */
export function validateFileSize(
    size: number,
    maxSize: number = FILE_SIZE_LIMITS.default
): boolean {
    return size > 0 && size <= maxSize
}

/**
 * Check if filename has dangerous extension
 */
export function hasDangerousExtension(filename: string): boolean {
    const lowerName = filename.toLowerCase()
    return DANGEROUS_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
    // Get extension
    const lastDot = filename.lastIndexOf('.')
    const ext = lastDot > 0 ? filename.substring(lastDot).toLowerCase() : ''
    const name = lastDot > 0 ? filename.substring(0, lastDot) : filename

    // Sanitize name part
    const sanitizedName = name
        // Remove path traversal
        .replace(/\.\./g, '')
        // Remove slashes
        .replace(/[/\\]/g, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Replace special characters
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        // Remove consecutive underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_+|_+$/g, '')
        // Limit length
        .substring(0, 100)

    // Generate unique suffix
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)

    return `${sanitizedName}_${timestamp}_${random}${ext}`
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
        'text/csv': '.csv',
    }
    return mimeToExt[mimetype] || ''
}

/**
 * Verify file signature (magic bytes)
 */
export async function verifyFileSignature(
    file: File | Blob,
    expectedMime: string
): Promise<boolean> {
    const signatures = FILE_SIGNATURES[expectedMime]
    if (!signatures) {
        // No signature to verify
        return true
    }

    const buffer = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    return signatures.some(sig =>
        sig.every((byte, index) => bytes[index] === byte)
    )
}

/**
 * Check for script content in SVG files
 */
export function containsScriptInSvg(content: string): boolean {
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /xlink:href\s*=\s*["']javascript:/i,
    ]
    return dangerousPatterns.some(pattern => pattern.test(content))
}

/**
 * Sanitize SVG content by stripping dangerous elements and attributes.
 * This acts as a server-side sanitizer since DOMPurify requires a DOM.
 * Removes: script, iframe, object, embed, foreignObject, use with external hrefs,
 *          all event handler attributes (on*), javascript: URIs, and data: URIs in href/xlink:href.
 */
export function sanitizeSvg(content: string): string {
    let sanitized = content

    // Remove dangerous elements and their contents
    const dangerousElements = [
        'script', 'iframe', 'object', 'embed', 'foreignObject',
        'math', 'form', 'input', 'textarea', 'button', 'select',
    ]
    for (const tag of dangerousElements) {
        // Remove opening+closing tags with content
        sanitized = sanitized.replace(
            new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi'), ''
        )
        // Remove self-closing tags
        sanitized = sanitized.replace(
            new RegExp(`<${tag}[^>]*\/?>`, 'gi'), ''
        )
    }

    // Remove all event handler attributes (on*="...")
    sanitized = sanitized.replace(
        /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ''
    )

    // Remove javascript: and data: URIs in href and xlink:href attributes
    sanitized = sanitized.replace(
        /((?:xlink:)?href\s*=\s*)(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi,
        '$1""'
    )
    sanitized = sanitized.replace(
        /((?:xlink:)?href\s*=\s*)(?:"\s*data:[^"]*"|'\s*data:[^']*')/gi,
        '$1""'
    )

    // Remove <use> elements with external references (potential SSRF)
    sanitized = sanitized.replace(
        /<use[^>]*(?:xlink:)?href\s*=\s*(?:"(?:https?:|\/\/)[^"]*"|'(?:https?:|\/\/)[^']*')[^>]*\/?>/gi, ''
    )

    // Remove set and animate elements that can trigger script behavior
    sanitized = sanitized.replace(
        /<(?:set|animate)[^>]*attributeName\s*=\s*(?:"on[^"]*"|'on[^']*')[^>]*\/?>/gi, ''
    )

    return sanitized
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
    file: File,
    options: {
        allowedTypes?: readonly string[]
        maxSize?: number
        verifySignature?: boolean
    } = {}
): Promise<FileValidationResult> {
    const {
        allowedTypes = ALLOWED_FILE_TYPES,
        maxSize = FILE_SIZE_LIMITS.default,
        verifySignature = true,
    } = options

    // Check file size
    if (!validateFileSize(file.size, maxSize)) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
        }
    }

    // Check MIME type
    if (!validateMimeType(file.type, allowedTypes)) {
        return {
            valid: false,
            error: `File type "${file.type}" is not allowed`,
        }
    }

    // Check filename
    if (hasDangerousExtension(file.name)) {
        return {
            valid: false,
            error: 'File has a potentially dangerous extension',
        }
    }

    // Verify file signature
    if (verifySignature) {
        const signatureValid = await verifyFileSignature(file, file.type)
        if (!signatureValid) {
            return {
                valid: false,
                error: 'File content does not match declared type',
            }
        }
    }

    // Special handling for SVG files: reject if malicious, then sanitize
    let sanitizedSvgContent: string | undefined
    if (file.type === 'image/svg+xml') {
        const content = await file.text()
        if (containsScriptInSvg(content)) {
            return {
                valid: false,
                error: 'SVG file contains potentially malicious content',
            }
        }
        // Even if no overt script tags, sanitize defensively
        sanitizedSvgContent = sanitizeSvg(content)
    }

    // Generate sanitized filename
    const sanitizedName = sanitizeFilename(file.name)

    return {
        valid: true,
        sanitizedName,
        ...(sanitizedSvgContent !== undefined && { sanitizedSvgContent }),
    }
}

/**
 * Create a safe File object with sanitized name
 */
export function createSafeFile(file: File, sanitizedName: string): File {
    return new File([file], sanitizedName, { type: file.type })
}

// ============================================================================
// SUPABASE STORAGE HELPERS
// ============================================================================

/**
 * Generate a safe storage path
 */
export function generateStoragePath(
    userId: string,
    filename: string,
    folder: string = 'uploads'
): string {
    const sanitizedFilename = sanitizeFilename(filename)
    return `${folder}/${userId}/${sanitizedFilename}`
}

/**
 * Validate and prepare file for Supabase upload
 */
export async function prepareFileForUpload(
    file: File,
    userId: string,
    options: {
        allowedTypes?: readonly string[]
        maxSize?: number
        folder?: string
    } = {}
): Promise<{
    valid: boolean
    error?: string
    file?: File
    path?: string
}> {
    const validation = await validateFile(file, {
        allowedTypes: options.allowedTypes,
        maxSize: options.maxSize,
    })

    if (!validation.valid) {
        return { valid: false, error: validation.error }
    }

    // For SVG files, use the sanitized content instead of the raw file
    let safeFile: File
    if (file.type === 'image/svg+xml' && validation.sanitizedSvgContent !== undefined) {
        const svgBlob = new Blob([validation.sanitizedSvgContent], { type: SVG_CONTENT_TYPE })
        safeFile = new File([svgBlob], validation.sanitizedName!, { type: SVG_CONTENT_TYPE })
    } else {
        safeFile = createSafeFile(file, validation.sanitizedName!)
    }
    const path = generateStoragePath(userId, validation.sanitizedName!, options.folder)

    return {
        valid: true,
        file: safeFile,
        path,
    }
}
