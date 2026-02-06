'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface UseThemeState {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: 'light' | 'dark'
    isDark: boolean
    isLight: boolean
    toggleTheme: () => void
    mounted: boolean
}

/**
 * Custom hook for theme management
 * Wraps next-themes with additional utilities
 */
export function useTheme(): UseThemeState {
    const { theme, setTheme, resolvedTheme } = useNextTheme()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    // Default to light theme during SSR
    const actualResolvedTheme = mounted ? (resolvedTheme as 'light' | 'dark') : 'light'

    return {
        theme: (theme as Theme) || 'system',
        setTheme: (newTheme: Theme) => setTheme(newTheme),
        resolvedTheme: actualResolvedTheme,
        isDark: actualResolvedTheme === 'dark',
        isLight: actualResolvedTheme === 'light',
        toggleTheme,
        mounted,
    }
}

export default useTheme
