import { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap Generator
 * Automatically generates sitemap.xml at /sitemap.xml
 * 
 * Only includes public pages - excludes authenticated routes
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://utilityai.com'

    // Public pages that should be indexed
    const publicPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
    ]

    return publicPages
}
