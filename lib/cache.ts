import { Redis } from '@upstash/redis'
import crypto from 'crypto'

// Initialize Redis client using Upstash env vars
export const redisCache = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null

/**
 * Creates a deterministic SHA-256 hash string from an object payload
 */
export function generateCacheKey(userId: string, agentType: string, input: string, context: Record<string, any> = {}): string {
    const payload = JSON.stringify({ input, context })
    const hash = crypto.createHash('sha256').update(payload).digest('hex')
    return `generation:${userId}:${agentType}:${hash}`
}

/**
 * Safely fetches a cached generation result
 */
export async function getCachedGeneration(key: string): Promise<any | null> {
    if (!redisCache) return null
    try {
        const cachedData = await redisCache.get(key)
        return cachedData ? cachedData : null
    } catch (error) {
        console.warn(`[Cache] Failed to fetch key ${key}:`, error)
        return null
    }
}

/**
 * Saves a generation result to the cache with an expiration time
 * @param ttlSeconds Default 24 hours (86400 seconds)
 */
export async function setCachedGeneration(key: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    if (!redisCache) return
    try {
        await redisCache.set(key, data, { ex: ttlSeconds })
    } catch (error) {
        console.warn(`[Cache] Failed to set key ${key}:`, error)
    }
}
