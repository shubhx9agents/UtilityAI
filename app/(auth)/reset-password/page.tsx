'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/landing/Logo'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [initializingSession, setInitializingSession] = useState(true)
    const [sessionReady, setSessionReady] = useState(false)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        let isMounted = true

        const initializeRecoverySession = async () => {
            try {
                const currentUrl = new URL(window.location.href)
                const code = currentUrl.searchParams.get('code')
                const tokenHash = currentUrl.searchParams.get('token_hash')
                const queryType = currentUrl.searchParams.get('type')
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')
                const hashType = hashParams.get('type')

                if (code) {
                    await supabase.auth.exchangeCodeForSession(code)
                } else if (tokenHash && (queryType === 'recovery' || queryType === 'invite')) {
                    await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: queryType,
                    })
                } else if (accessToken && refreshToken && (hashType === 'recovery' || hashType === 'invite')) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })
                }

                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (!isMounted) return

                if (session) {
                    setSessionReady(true)
                    // Remove sensitive auth params from URL once session is persisted.
                    window.history.replaceState({}, document.title, '/reset-password')
                } else {
                    setSessionReady(false)
                    setError('Invalid or expired reset link. Please request a new one.')
                }
            } catch (sessionError: unknown) {
                if (!isMounted) return
                setSessionReady(false)
                setError(
                    sessionError instanceof Error
                        ? sessionError.message
                        : 'Unable to validate reset link. Please try again.'
                )
            } finally {
                if (isMounted) {
                    setInitializingSession(false)
                }
            }
        }

        initializeRecoverySession()

        return () => {
            isMounted = false
        }
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!sessionReady) {
            setError('Reset session is missing. Please open the latest email link again.')
            setLoading(false)
            return
        }

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Password must contain uppercase, lowercase, and a number')
            setLoading(false)
            return
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.updateUser({
            password,
            data: { must_change_password: false },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
        } else {
            // Also update the profile to clear must_change_password
            if (user) {
                await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)
            }

            setSuccess(true)
            setLoading(false)
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)
        }
    }

    if (success) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-2xl animate-fade-in">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <CardTitle className="font-heading text-2xl text-zinc-100">Password Reset Complete</CardTitle>
                        <CardDescription className="text-zinc-400 mt-2">
                            Your password has been successfully updated. Redirecting you to the dashboard...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
            <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2 animate-fade-in">
                <Logo size="sm" showText={true} animate={false} />
            </Link>

            <Card className="relative w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm animate-scale-in">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center animate-pulse">
                        <Lock className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="font-heading text-3xl font-bold text-zinc-100">Create New Password</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Enter your new secure password below to regain access to your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm animate-shake">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">
                                New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading || initializingSession}
                                    className="pl-10 pr-10 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-zinc-300">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading || initializingSession}
                                    className="pl-10 pr-10 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-amber-500 text-zinc-900 hover:bg-amber-600 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300 group"
                            disabled={loading || initializingSession || !sessionReady}
                        >
                            {loading || initializingSession ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {initializingSession ? 'Validating Link...' : 'Updating Password...'}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    Update Password
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
