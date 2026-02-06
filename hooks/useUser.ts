'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRoleType } from '@/types'

export interface UseUserState {
    user: User | null
    loading: boolean
    error: string | null
    role: UserRoleType
    isAdmin: boolean
    isMod: boolean
    refresh: () => Promise<void>
}

/**
 * Custom hook for user authentication state
 * Provides user data, role, and admin/mod status
 */
export function useUser(): UseUserState {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRoleType>('user')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) {
                throw userError
            }

            setUser(user)

            // Fetch role if user exists
            if (user) {
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()

                setRole((roleData?.role as UserRoleType) || 'user')
            } else {
                setRole('user')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch user')
            setUser(null)
            setRole('user')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                if (!session?.user) {
                    setRole('user')
                } else {
                    // Refetch role on auth change
                    fetchUser()
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [fetchUser, supabase.auth])

    return {
        user,
        loading,
        error,
        role,
        isAdmin: role === 'admin',
        isMod: role === 'mod' || role === 'admin',
        refresh: fetchUser,
    }
}

export default useUser
