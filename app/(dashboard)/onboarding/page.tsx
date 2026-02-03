'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle2, Circle } from 'lucide-react'

const onboardingSteps = [
    {
        id: 1,
        title: 'Business Snapshot',
        description: 'Tell us about your business',
        completed: false,
    },
    {
        id: 2,
        title: 'Goals & Objectives',
        description: 'Define your business goals',
        completed: false,
    },
    {
        id: 3,
        title: 'Target Audience',
        description: 'Identify your ideal customers',
        completed: false,
    },
    {
        id: 4,
        title: 'Marketing Channels',
        description: 'Choose your marketing platforms',
        completed: false,
    },
    {
        id: 5,
        title: 'AI Agent Selection',
        description: 'Pick your first AI agents',
        completed: false,
    },
]

export default function OnboardingPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight">Welcome to UtilityAI!</h1>
                <p className="text-muted-foreground mt-3 text-lg">
                    Let's get you set up in just a few steps
                </p>
            </div>

            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card">
                <CardHeader>
                    <CardTitle className="text-gray-800 dark:text-foreground">Onboarding Progress</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-muted-foreground">
                        Complete these steps to unlock the full potential of UtilityAI
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {onboardingSteps.map((step, index) => (
                        <div
                            key={step.id}
                            className="flex items-start space-x-4 p-4 rounded-lg border-2 hover:border-purple-300 dark:border-border dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-accent transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex-shrink-0 mt-1">
                                {step.completed ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <Circle className="h-6 w-6 text-purple-500 dark:text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-foreground">
                                    Step {step.id}: {step.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                    {step.description}
                                </p>
                            </div>
                            <Button variant={step.completed ? "outline" : "default"} size="sm" className="border-2">
                                {step.completed ? 'Review' : 'Start'}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button size="lg" className="px-8">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Onboarding
                </Button>
            </div>
        </div>
    )
}
