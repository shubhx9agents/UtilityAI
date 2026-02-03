'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AGENT_CONFIGS } from '@/lib/ai/agents'
import { AgentType } from '@/types'
import { Sparkles, ArrowLeft, Copy, Download, FileJson, FileText, Image as ImageIcon, Upload, MessageCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AgentPage() {
    const params = useParams()
    const agentId = params.agentId as AgentType
    const agent = AGENT_CONFIGS[agentId]

    const [formData, setFormData] = useState<Record<string, string>>({})
    const [additionalDetails, setAdditionalDetails] = useState('')
    const [response, setResponse] = useState('')
    const [refinedPrompt, setRefinedPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Chat conversation state
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [showChat, setShowChat] = useState(false)

    // Check if this agent supports chat
    // const chatEnabledAgents = ['deep_research', 'image_generation', 'email_sequence', 'sales_script']
    // const isChatEnabled = chatEnabledAgents.includes(agentId)
    const isChatEnabled = true

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [field]: reader.result as string
                }))
            }
            reader.readAsDataURL(file)
            toast.success(`${file.name} uploaded successfully`)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResponse('')
        setError('')

        let fullInput = ''
        let context: Record<string, any> = {}

        if (agentId === 'image_generation') {
            fullInput = formData['Instructional Prompt'] || ''
            context = {
                base_image: formData['Base Image'],
                reference_image: formData['Reference Image (Optional)']
            }
        } else if (agentId === 'linkedin_headshot') {
            fullInput = `Additional Details: ${additionalDetails}`
            context = {
                user_image: formData['User Image']
            }
        } else {
            // Construct the input from form data
            const questionAnswers = agent.questions.map((q, idx) => {
                const answer = formData[q] || ''
                return `${q}: ${answer}`
            }).join('\n')

            fullInput = `${questionAnswers}\n\nAdditional Details: ${additionalDetails}`
        }

        try {
            const res = await fetch('/api/agents/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: agentId,
                    input: fullInput,
                    context
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response')
            }

            if (data.response) {
                setResponse(data.response)
                if (data.refined_prompt) {
                    setRefinedPrompt(data.refined_prompt)
                }
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(response)
        toast.success('Copied to clipboard')
    }

    const downloadImage = () => {
        try {
            // Use our proxy endpoint to bypass CORS and force download
            const downloadUrl = `/api/download?url=${encodeURIComponent(response)}`
            window.location.href = downloadUrl
            toast.success('Download started')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download image')
        }
    }

    const downloadAsMarkdown = () => {
        const element = document.createElement('a')
        const file = new Blob([response], { type: 'text/markdown' })
        element.href = URL.createObjectURL(file)
        element.download = `${agentId}-report.md`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const downloadAsPDF = () => {
        const printContent = document.getElementById('report-content')
        if (!printContent) return

        const originalContent = document.body.innerHTML
        const printStyles = `
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                    }
                    .no-print { display: none !important; }
                }
            </style>
        `

        const newWindow = window.open('', '_blank')
        if (newWindow) {
            newWindow.document.write('<html><head><title>AI Agent Report</title>')
            newWindow.document.write(printStyles)
            // Add Tailwind and global styles for the new window
            const links = document.querySelectorAll('link[rel="stylesheet"]')
            links.forEach(link => {
                newWindow.document.write(link.outerHTML)
            })
            newWindow.document.write('</head><body>')
            newWindow.document.write(printContent.outerHTML)
            newWindow.document.write('</body></html>')
            newWindow.document.close()

            // Wait for resources to load before printing
            newWindow.setTimeout(() => {
                newWindow.print()
                newWindow.close()
            }, 500)
        }
    }

    const handleChatSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!chatInput.trim()) return

        const userMessage = chatInput.trim()
        setChatInput('')

        // Add user message to chat
        const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }]
        setChatMessages(newMessages)
        setChatLoading(true)

        try {
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    agent_type: agentId
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response')
            }

            // Add AI response to chat
            setChatMessages([...newMessages, { role: 'assistant' as const, content: data.response }])
        } catch (error: any) {
            console.error('Chat error:', error)
            toast.error(error.message || 'Failed to get chat response')
        } finally {
            setChatLoading(false)
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
                                        {question.toLowerCase().includes('image') ? (
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    id={`question-${index}`}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, question)}
                                                    disabled={loading}
                                                    className="cursor-pointer"
                                                />
                                                {formData[question] && (
                                                    <div className="h-10 w-10 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                                        <img src={formData[question]} alt="Preview" className="h-full w-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : question.toLowerCase().includes('prompt') || question.toLowerCase().includes('beliefs') ? (
                                            <textarea
                                                id={`question-${index}`}
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder={`Enter ${question.toLowerCase()}`}
                                                value={formData[question] || ''}
                                                onChange={(e) => handleInputChange(question, e.target.value)}
                                                disabled={loading}
                                            />
                                        ) : (
                                            <Input
                                                id={`question-${index}`}
                                                placeholder={`Enter ${question.toLowerCase()}`}
                                                value={formData[question] || ''}
                                                onChange={(e) => handleInputChange(question, e.target.value)}
                                                disabled={loading}
                                            />
                                        )}
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
                            <div className="space-y-4">
                                <div className="flex justify-end space-x-2 no-print">
                                    {agentId === 'image_generation' || agentId === 'linkedin_headshot' ? (
                                        <Button variant="outline" size="sm" onClick={downloadImage}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copy
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={downloadAsMarkdown}>
                                                <Download className="h-4 w-4 mr-2" />
                                                .MD
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                PDF
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div id="report-content" className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-6 bg-background min-h-[400px]">
                                    {(agentId === 'image_generation' || agentId === 'linkedin_headshot') && response.startsWith('http') ? (
                                        <div className="flex justify-center">
                                            <img src={response} alt="Generated Asset" className="max-w-full rounded-lg shadow-lg" />
                                        </div>
                                    ) : (
                                        <div className="markdown-container prose dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {response}
                                            </ReactMarkdown>
                                        </div>
                                    )}
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

            {/* Chat Conversation Section - Only for enabled agents */}
            {isChatEnabled && (
                <Card className="mt-6">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center text-lg sm:text-xl">
                                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    AI Conversation
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Have a follow-up conversation with the AI agent
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowChat(!showChat)}
                                className="w-full sm:w-auto"
                            >
                                {showChat ? 'Hide Chat' : 'Show Chat'}
                            </Button>
                        </div>
                    </CardHeader>
                    {showChat && (
                        <CardContent className="pt-0">
                            <div className="space-y-3 sm:space-y-4">
                                {/* Chat Messages */}
                                <div className="border rounded-lg p-3 sm:p-4 h-64 sm:h-96 overflow-y-auto bg-muted/20">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center py-8 sm:py-12 text-muted-foreground">
                                            <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                                            <p className="text-xs sm:text-sm">Start a conversation with the AI agent</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 sm:space-y-4">
                                            {chatMessages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                            }`}
                                                    >
                                                        {msg.role === 'assistant' ? (
                                                            <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {chatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-muted rounded-lg p-2.5 sm:p-3">
                                                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleChatSubmit} className="flex gap-2">
                                    <Input
                                        placeholder="Type your message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        disabled={chatLoading}
                                        className="flex-1 text-sm"
                                    />
                                    <Button type="submit" disabled={chatLoading || !chatInput.trim()} size="sm" className="px-3 sm:px-4">
                                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    )
}
