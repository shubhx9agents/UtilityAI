'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/landing/Logo'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, signInWithGoogle } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const approvalRequiredError =
        searchParams.get('error') === 'approval_required'
            ? 'Your account is pending admin approval. Please request access and wait for approval.'
            : ''
    const displayError = error || approvalRequiredError

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setLoading(true)

        const { error } = await signInWithGoogle()

        if (error) {
            setError(error.message)
            setLoading(false)
        }
        // Note: For OAuth, the redirect happens automatically via Supabase
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
                        Transform Your Business with AI
                    </h1>
                    <p className="text-xl text-zinc-400 mb-8 animate-fade-in">
                        Access powerful AI agents, automate workflows, and boost productivity with our comprehensive platform.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 animate-slide-up">
                        {[
                            "10+ Specialized AI Agents",
                            "Automated Workflows",
                            "Real-time Collaboration"
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

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4">
                {/* Logo for mobile */}
                <Link href="/" className="lg:hidden absolute top-6 left-6 flex items-center space-x-2 animate-slide-up">
                    <Logo size="sm" showText={true} animate={false} />
                </Link>

                <Card className="relative w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm animate-scale-in">
                    <CardHeader className="space-y-1 text-center pb-6">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center animate-pulse">
                            <Lock className="h-8 w-8 text-amber-500" />
                        </div>
                        <CardTitle className="font-heading text-3xl font-bold text-zinc-100">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Sign in to access your AI-powered workspace
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {displayError && (
                                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm animate-shake">
                                    {displayError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
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
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
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
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                                    <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20" />
                                    <span>Remember me</span>
                                </label>
                                <Link href="/forgot-password" className="text-amber-500 hover:text-amber-400 transition-colors font-medium">
                                    Forgot password?
                                </Link>
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
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Sign In
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-all duration-300"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </Button>
                            <div className="text-sm text-center text-zinc-400">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
                                    Sign up for free
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
