export interface RetryOptions {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    retryOn?: (error: unknown, attempt: number) => boolean
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        retryOn = (error) => {
            // Retry on network errors and 5xx responses
            if (error instanceof Error && error.message.includes('fetch')) return true
            return false
        }
    } = options

    let lastError: unknown
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            if (attempt === maxRetries || !retryOn(error, attempt)) {
                throw error
            }
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
    throw lastError
}
