'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Check, X, Sparkles, Zap, Shield, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function UpgradePage() {
    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white">
                    Unlock Premium Power
                </h1>
                <p className="text-xl text-white/50 max-w-2xl mx-auto">
                    Supercharge your workflow with advanced AI capabilities, unlimited history, and priority support.
                </p>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 gap-8 pt-6">
                {/* Free Plan */}
                <Card className="relative border-[#262626] bg-[#030303]">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-white">
                            <span className="text-2xl font-bold">Starter</span>
                            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">Current</Badge>
                        </CardTitle>
                        <CardDescription className="text-white/40 font-medium">Perfect for exploring AI capabilities</CardDescription>
                        <div className="pt-4">
                            <span className="text-5xl font-bold text-white">$0</span>
                            <span className="text-white/40 ml-2">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center text-white/60">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span>Access 4 Basic AI Agents</span>
                            </li>
                            <li className="flex items-center text-white/60">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span>1,000 AI Token Credits/mo</span>
                            </li>
                            <li className="flex items-center text-white/60">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span>Standard Processing Speed</span>
                            </li>
                            <li className="flex items-center text-white/30">
                                <X className="h-4 w-4 mr-3" />
                                <span>Deep Research & Analysis</span>
                            </li>
                            <li className="flex items-center text-white/30">
                                <X className="h-4 w-4 mr-3" />
                                <span>Export to PDF & CSV</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="relative border-amber-500/30 bg-[#0d0d0d] shadow-[0_0_30px_rgba(245,158,11,0.05)] border-2">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-500 text-black border-none px-6 py-1.5 font-bold shadow-lg shadow-amber-500/20">
                            Recommended
                        </Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-white mt-2">
                            <span className="text-2xl font-bold">Pro</span>
                            <Sparkles className="h-6 w-6 text-amber-500" />
                        </CardTitle>
                        <CardDescription className="text-amber-500/60 font-medium">For power users and professionals</CardDescription>
                        <div className="pt-4">
                            <span className="text-5xl font-bold text-white">$29</span>
                            <span className="text-white/40 ml-2">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center text-white/80">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span className="font-bold">Access All 12+ Specialist Agents</span>
                            </li>
                            <li className="flex items-center text-white/80">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span className="font-bold">Unlimited AI Tokens</span>
                            </li>
                            <li className="flex items-center text-white/80">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span className="font-bold">Fastest 'Turbo' Processing</span>
                            </li>
                            <li className="flex items-center text-white/80">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span>Persistent Storage (Never Expire)</span>
                            </li>
                            <li className="flex items-center text-white/80">
                                <Check className="h-4 w-4 text-amber-500 mr-3" />
                                <span>Priority 24/7 Support</span>
                            </li>
                        </ul>
                        <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 text-lg shadow-lg shadow-amber-500/20" disabled>
                            Upgrade Now
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Coming Soon Section */}
            <div className="mt-16 text-center space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-muted">
                    <Rocket className="h-6 w-6 text-muted-foreground animate-pulse" />
                </div>
                <h2 className="text-2xl font-semibold">Coming Soon</h2>
                <p className="text-muted-foreground">
                    We are currently finalizing our payment infrastructure to ensure secure and seamless transactions.
                    The Pro plan will be available for subscription in the coming weeks.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                    <Button variant="ghost" disabled>
                        Join Waitlist
                    </Button>
                </div>
            </div>
        </div>
    )
}

