'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AGENT_CONFIGS } from '@/lib/ai/agents'
import { AgentType } from '@/types'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AgentPage() {
    const params = useParams()
    const agentId = params.agentId as AgentType
    const agent = AGENT_CONFIGS[agentId]

    const [formData, setFormData] = useState<Record<string, string>>({})
    const [additionalDetails, setAdditionalDetails] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!agent) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/agents">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Agents
                        </Button>
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Not Found</CardTitle>
                        <CardDescription>
                            The requested AI agent could not be found.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const handleInputChange = (question: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [question]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResponse('')
        setError('')

        // Construct the input from form data
        const questionAnswers = agent.questions.map((q, idx) => {
            const answer = formData[q] || ''
            return `${q}: ${answer}`
        }).join('\n')

        const fullInput = `${questionAnswers}\n\nAdditional Details: ${additionalDetails}`

        try {
            const res = await fetch('/api/agents/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: agentId,
                    input: fullInput,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response')
            }

            if (data.response) {
                setResponse(data.response)
            } else if (data.error) {
                setError(data.error)
            }
        } catch (error: any) {
            console.error('Agent error:', error)
            setError(error.message || 'Failed to get response from AI agent')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/agents">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Agents
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight capitalize">
                    {agentId.replace(/_/g, ' ')} Agent
                </h1>
                <p className="text-muted-foreground mt-2">
                    {agent.system_message}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Input</CardTitle>
                        <CardDescription>
                            Answer the following questions to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                {agent.questions.map((question, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label htmlFor={`question-${index}`}>{question}</Label>
                                        <Input
                                            id={`question-${index}`}
                                            placeholder={`Enter ${question.toLowerCase()}`}
                                            value={formData[question] || ''}
                                            onChange={(e) => handleInputChange(question, e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="additional">Additional Details (Optional)</Label>
                                <textarea
                                    id="additional"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Provide any additional context or requirements..."
                                    value={additionalDetails}
                                    onChange={(e) => setAdditionalDetails(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate with AI
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Response Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI Response</CardTitle>
                        <CardDescription>
                            Your personalized results will appear here
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    <strong>Error:</strong> {error}
                                </p>
                            </div>
                        ) : response ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                                    {response}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Submit your input to generate AI-powered results</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
