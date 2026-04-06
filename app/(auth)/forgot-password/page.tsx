'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Mail, KeyRound } from 'lucide-react'
import { Logo } from '@/components/landing/Logo'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-2xl animate-fade-in">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-emerald-500" />
                        </div>
                        <CardTitle className="font-heading text-2xl text-zinc-100">Check your email</CardTitle>
                        <CardDescription className="text-zinc-400 mt-2">
                            We've sent a password reset link to <span className="text-zinc-200 font-medium">{email}</span>. Click the link to set a new password.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pb-6">
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/login')}
                            className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white"
                        >
                            Return to login
                        </Button>
                    </CardFooter>
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
                        <KeyRound className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="font-heading text-3xl font-bold text-zinc-100">
                        Reset Password
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Enter your email and we'll send you a link to reset your password.
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
                            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-amber-500 text-zinc-900 hover:bg-amber-600 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300 group"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending Link...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    Send Reset Link
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                        <div className="text-sm text-center text-zinc-400">
                            Remember your password?{' '}
                            <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors flex items-center justify-center mt-2 group">
                                <ArrowLeft className="mr-1 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" /> Back to login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
