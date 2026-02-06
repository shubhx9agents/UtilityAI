import { Metadata } from 'next'

/**
 * SEO Utilities
 * Centralized metadata generation for consistent SEO across pages
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://utilityai.com'
const SITE_NAME = 'UtilityAI'
const DEFAULT_OG_IMAGE = '/og-image.png'

export interface SeoConfig {
    title: string
    description: string
    path?: string
    ogImage?: string
    noIndex?: boolean
}

/**
 * Generate complete metadata for a page
 */
export function generateMetadata({
    title,
    description,
    path = '',
    ogImage = DEFAULT_OG_IMAGE,
    noIndex = false,
}: SeoConfig): Metadata {
    const url = `${BASE_URL}${path}`
    const fullTitle = `${title} | ${SITE_NAME}`

    return {
        title: fullTitle,
        description,
        metadataBase: new URL(BASE_URL),
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: SITE_NAME,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [ogImage],
        },
        robots: noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true },
    }
}

/**
 * Pre-defined metadata for common pages
 */
export const PAGE_METADATA = {
    home: generateMetadata({
        title: 'AI-Powered Business Tools',
        description: 'Transform your business with AI-powered agents for marketing, sales, and growth. Get started with UtilityAI today.',
        path: '/',
    }),
    login: generateMetadata({
        title: 'Login',
        description: 'Sign in to your UtilityAI account to access AI-powered business tools.',
        path: '/login',
    }),
    register: generateMetadata({
        title: 'Create Account',
        description: 'Join UtilityAI and start using AI-powered agents for marketing, sales, and business growth.',
        path: '/register',
    }),
    dashboard: generateMetadata({
        title: 'Dashboard',
        description: 'Your UtilityAI dashboard - manage AI agents, workflows, and business tools.',
        path: '/dashboard',
        noIndex: true,
    }),
    agents: generateMetadata({
        title: 'AI Agents',
        description: 'Access specialized AI agents for research, marketing, ad copy, and more.',
        path: '/agents',
        noIndex: true,
    }),
    canvas: generateMetadata({
        title: 'Canvas',
        description: 'Design and orchestrate multi-agent workflows with the visual canvas.',
        path: '/canvas',
        noIndex: true,
    }),
    settings: generateMetadata({
        title: 'Settings',
        description: 'Manage your UtilityAI account settings and preferences.',
        path: '/settings',
        noIndex: true,
    }),
    admin: generateMetadata({
        title: 'Admin Dashboard',
        description: 'Admin panel for managing users and system settings.',
        path: '/admin',
        noIndex: true,
    }),
    onboarding: generateMetadata({
        title: 'Onboarding',
        description: 'Complete your business profile setup.',
        path: '/onboarding',
        noIndex: true,
    }),
    flows: generateMetadata({
        title: 'Flows',
        description: 'Manage your automated workflows and conversation flows.',
        path: '/flows',
        noIndex: true,
    }),
    library: generateMetadata({
        title: 'Library',
        description: 'Your file library and assets.',
        path: '/library',
        noIndex: true,
    }),
    notes: generateMetadata({
        title: 'Notes',
        description: 'Your notes and documentation.',
        path: '/notes',
        noIndex: true,
    }),
}
