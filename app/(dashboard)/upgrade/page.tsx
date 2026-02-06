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
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Unlock Premium Power
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Supercharge your workflow with advanced AI capabilities, unlimited history, and priority support.
                </p>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 gap-8 pt-6">
                {/* Free Plan */}
                <Card className="relative border-border bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="text-2xl">Starter</span>
                            <Badge variant="secondary">Current</Badge>
                        </CardTitle>
                        <CardDescription>Perfect for exploring AI capabilities</CardDescription>
                        <div className="pt-4">
                            <span className="text-4xl font-bold">$0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-3" />
                                <span>Access 4 Basic AI Agents</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-3" />
                                <span>1,000 AI Token Credits/mo</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-3" />
                                <span>Standard Processing Speed</span>
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <X className="h-4 w-4 mr-3" />
                                <span>Deep Research & Analysis</span>
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <X className="h-4 w-4 mr-3" />
                                <span>Export to PDF & CSV</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="relative border-purple-500/50 bg-gradient-to-b from-purple-500/5 to-transparent shadow-xl border-2">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 border-none px-4 py-1">
                            Recommended
                        </Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="text-2xl">Pro</span>
                            <Sparkles className="h-5 w-5 text-purple-500" />
                        </CardTitle>
                        <CardDescription>For power users and professionals</CardDescription>
                        <div className="pt-4">
                            <span className="text-4xl font-bold">$29</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-blue-500 mr-3" />
                                <span className="font-medium">Access All 12+ Specialist Agents</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-blue-500 mr-3" />
                                <span className="font-medium">Unlimited AI Tokens</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-blue-500 mr-3" />
                                <span className="font-medium">Fastest 'Turbo' Processing</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-blue-500 mr-3" />
                                <span>Persistent Storage (Never Expire)</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="h-4 w-4 text-blue-500 mr-3" />
                                <span>Priority 24/7 Support</span>
                            </li>
                        </ul>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg" disabled>
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

