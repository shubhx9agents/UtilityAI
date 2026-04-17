'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Mail, Lock, User, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/landing/Logo'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const { error: insertError } = await supabase
                .from('account_requests')
                .insert([{ name, email }])

            if (insertError) {
                if (insertError.code === '23505') {
                    // Unique violation (email already exists)
                    setError('An account request for this email already exists or the email is already in use.')
                } else {
                    setError('Failed to submit request: ' + insertError.message)
                }
            } else {
                setSuccess(true)
            }
        } catch (err: any) {
            setError('An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-heading text-2xl text-center text-zinc-100">Request Submitted!</CardTitle>
                        <CardDescription className="text-center text-zinc-400">
                            Your account request has been sent to an administrator. You will receive an email with login instructions once it is approved.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex">
            {/* Animated background elements - Warm Amber Theme */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
                <div className="max-w-xl">
                    <Link href="/" className="flex items-center space-x-3 mb-8 animate-slide-up">
                        <Logo size="lg" showText={true} animate={false} />
                    </Link>

                    <h1 className="font-heading text-5xl font-bold text-zinc-100 mb-6 animate-fade-in">
                        Join Thousands of Users
                    </h1>
                    <p className="text-xl text-zinc-400 mb-8 animate-fade-in">
                        Start your journey with UtilityAI and unlock the power of AI-driven automation for your business.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 animate-slide-up">
                        {[
                            "Free to get started",
                            "No credit card required",
                            "Cancel anytime"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-amber-500" />
                                </div>
                                <span className="text-zinc-300 text-lg">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4">
                {/* Logo for mobile */}
                <Link href="/" className="lg:hidden absolute top-6 left-6 flex items-center space-x-2 animate-slide-up">
                    <Logo size="sm" showText={true} animate={false} />
                </Link>

                <Card className="relative w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm animate-scale-in mx-4">
                    <CardHeader className="space-y-1 text-center pb-4">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center animate-pulse">
                            <User className="h-6 w-6 text-amber-500" />
                        </div>
                        <CardTitle className="font-heading text-2xl font-bold text-zinc-100">
                            Request Access
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm">
                            Submit a request to access UtilityAI
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-3">
                            {error && (
                                <div className="p-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm animate-shake">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-9 h-9 text-sm bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-9 h-9 text-sm bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3 pt-4">
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
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Submit Request
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            <div className="text-sm text-center text-zinc-400 mt-4">
                                Already have an account?{' '}
                                <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Decorative footer line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>
    )
}
