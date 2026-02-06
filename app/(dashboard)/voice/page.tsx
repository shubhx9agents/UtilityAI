'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function VoicePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in p-4">
            <div className="text-center space-y-8 max-w-lg mx-auto">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                    <div className="relative p-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800">
                        <Mic className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Voice Command
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        We're fine-tuning our speech recognition engine.
                        <br />
                        Voice controls will be available in the next update.
                    </p>
                </div>

                <Card className="bg-card/50 border-dashed">
                    <CardContent className="pt-6">
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">Planned Capabilities:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Navigate pages with voice commands</li>
                                <li>Dictate prompts to AI agents</li>
                                <li>Control workflows hands-free</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <div className="pt-4">
                    <Button variant="outline" size="lg" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
