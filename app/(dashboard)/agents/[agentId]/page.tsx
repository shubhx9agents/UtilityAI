'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AGENT_CONFIGS } from '@/lib/ai/agents'
import { AgentType, AgentSession } from '@/types'
import { Sparkles, ArrowLeft, Copy, Download, FileJson, FileText, Image as ImageIcon, Upload, MessageCircle, Send, RotateCcw, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AgentSessionHistory } from '@/components/agent-session-history'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

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
    const [hasAutofilled, setHasAutofilled] = useState(false)
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)
    const supabase = createClient()

    // Fetch and Autofill Onboarding Data
    useEffect(() => {
        const fetchOnboardingAndAutofill = async () => {
            if (hasAutofilled) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('onboarding_progress')
                .select('step_outputs')
                .eq('user_id', user.id)
                .maybeSingle()

            if (data?.step_outputs) {
                const onboardingData = data.step_outputs
                const newFormData = { ...formData }
                let hasUpdates = false

                // normalize string helper
                const norm = (s: string) => s.toLowerCase().trim()

                // Detailed mapping of Agent Questions to Onboarding Data Fields
                const mapping: Record<string, string | undefined> = {
                    // Deep Research & General
                    'niche': onboardingData.industry,
                    'industry/niche': onboardingData.industry,
                    'industry': onboardingData.industry,
                    'target audience': onboardingData.audience_desc,
                    'audience': onboardingData.audience_desc,
                    'primary problem i solve': onboardingData.pain_points,
                    'secondary problems': onboardingData.pain_points,
                    'pain points': onboardingData.pain_points,
                    'my experience': onboardingData.description, // Fallback
                    'business description': onboardingData.description,
                    'description': onboardingData.description,
                    'my core philosophy or approach': onboardingData.mission,
                    'mission statement': onboardingData.mission,
                    'important beliefs i hold': onboardingData.mission,
                    'primary promise': onboardingData.usp,
                    'unique value proposition': onboardingData.usp,
                    'usp': onboardingData.usp,
                    'business name': onboardingData.business_name,
                    'company name': onboardingData.business_name,
                    'product/service name': onboardingData.business_name,

                    // Ad Copy & Marketing
                    'main features/benefits': onboardingData.usp,
                    'ad tone (e.g. funny, professional, urgent)': onboardingData.tone_voice,
                    'ad tone': onboardingData.tone_voice,
                    'tone of voice': onboardingData.tone_voice,
                    'brand style': onboardingData.tone_voice,
                    'specific platforms (e.g. facebook, instagram, linkedin, google)': onboardingData.marketing_channels?.join(', '),
                    'platforms': onboardingData.marketing_channels?.join(', '),
                    'marketing channels': onboardingData.marketing_channels?.join(', '),

                    // Landing Page & Growth
                    'page goal': onboardingData.primary_goal,
                    'conversion goals': onboardingData.primary_goal,
                    'primary business goal': onboardingData.primary_goal,
                }

                agent.questions.forEach(q => {
                    const lowerKey = norm(q)

                    // 1. Try manual mapping first
                    if (!newFormData[q] && mapping[lowerKey]) {
                        newFormData[q] = mapping[lowerKey]!
                        hasUpdates = true
                    }
                    // 2. Try direct key match if no mapping found
                    else if (!newFormData[q] && onboardingData[q]) {
                        newFormData[q] = onboardingData[q]
                        hasUpdates = true
                    }
                })

                if (hasUpdates) {
                    setFormData(newFormData)
                    toast.success('Autofilled from your profile')
                }
                setHasAutofilled(true)
            } else {
                setShowOnboardingBanner(true)
            }
        }

        fetchOnboardingAndAutofill()
    }, [agent, hasAutofilled])

    // Chat conversation state
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [showChat, setShowChat] = useState(false)

    // Session state
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [sessionKey, setSessionKey] = useState(0) // Force re-render of session history

    // Helper to parse simple CSV
    const parseCSV = (csv: string) => {
        try {
            const lines = csv.split('\n').filter(line => line.trim())
            if (lines.length === 0) return []

            return lines.map(line => {
                const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                return matches ? matches.map(m => m.replace(/^"|"$/g, '')) : line.split(',')
            })
        } catch (e) {
            console.error('CSV Parsing failed:', e)
            return []
        }
    }

    // Check if this agent supports chat
    // const chatEnabledAgents = ['deep_research', 'image_generation', 'linkedin_headshot', 'ad_copy']
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

                // Auto-save session after successful response
                await saveSession(data.response, data.refined_prompt)
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
            toast.error('Failed to download: URL likely expired')
        }
    }

    const downloadAsFile = (type: 'md' | 'csv') => {
        const element = document.createElement('a')
        const blobType = type === 'md' ? 'text/markdown' : 'text/csv'
        const file = new Blob([response], { type: blobType })
        element.href = URL.createObjectURL(file)
        element.download = `${agentId}-report.${type}`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        toast.success(`Downloaded as ${type.toUpperCase()}`)
    }

    const downloadAsMarkdown = () => downloadAsFile('md')
    const downloadAsCSV = () => downloadAsFile('csv')

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
            const updatedMessages = [...newMessages, { role: 'assistant' as const, content: data.response }]
            setChatMessages(updatedMessages)

            console.log('Chat messages to save:', updatedMessages)
            console.log('Current session ID:', currentSessionId)
            console.log('Current response:', response)

            // Always try to update or create session with chat messages
            if (currentSessionId) {
                console.log('Updating existing session with chat')
                await updateSessionChat(updatedMessages)
            } else if (response) {
                console.log('Creating new session with chat')
                await saveSession(response, refinedPrompt, updatedMessages)
            } else {
                console.warn('No session ID and no response - chat messages may not be saved')
            }
        } catch (error: any) {
            console.error('Chat error:', error)
            toast.error(error.message || 'Failed to get chat response')
        } finally {
            setChatLoading(false)
        }
    }

    const saveSession = async (responseText: string, refinedPromptText?: string, messages?: Array<{ role: 'user' | 'assistant', content: string }>) => {
        try {
            const res = await fetch('/api/agents/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: agentId,
                    form_data: formData,
                    response: responseText,
                    refined_prompt: refinedPromptText,
                    chat_messages: messages || chatMessages
                }),
            })

            const data = await res.json()
            if (res.ok && data.data) {
                setCurrentSessionId(data.data.id)
                setSessionKey(prev => prev + 1) // Refresh session history
                console.log('Session saved with ID:', data.data.id)
                console.log('Saved chat messages:', messages || chatMessages)
                toast.success('Session saved')
            } else {
                console.error('Failed to save session:', data)
            }
        } catch (error) {
            console.error('Failed to save session:', error)
        }
    }

    const updateSessionChat = async (messages: Array<{ role: 'user' | 'assistant', content: string }>) => {
        if (!currentSessionId) {
            console.warn('No session ID to update')
            return
        }

        console.log('Updating session', currentSessionId, 'with messages:', messages)

        try {
            const res = await fetch(`/api/agents/sessions/${currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_messages: messages
                }),
            })

            if (res.ok) {
                console.log('Session updated successfully')
            } else {
                const data = await res.json()
                console.error('Failed to update session:', data)
            }
        } catch (error) {
            console.error('Failed to update session:', error)
        }
    }

    const handleSessionRestore = (session: AgentSession) => {
        console.log('Restoring session:', session.id)
        console.log('Session chat_messages:', session.chat_messages)
        console.log('Chat messages length:', session.chat_messages?.length)

        setFormData(session.form_data || {})
        setResponse(session.response || '')
        setRefinedPrompt(session.refined_prompt || '')
        setChatMessages(session.chat_messages || [])
        setCurrentSessionId(session.id)

        const shouldShowChat = session.chat_messages && session.chat_messages.length > 0
        console.log('Should show chat:', shouldShowChat)
        setShowChat(shouldShowChat)

        toast.success('Session restored')
    }

    const handleNewSession = () => {
        setFormData({})
        setAdditionalDetails('')
        setResponse('')
        setRefinedPrompt('')
        setChatMessages([])
        setCurrentSessionId(null)
        setShowChat(false)
        setError('')
        toast.success('New session started')
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

            {showOnboardingBanner && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Complete your profile for better AI results</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">Agents work better with business context.</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto" asChild>
                        <a href="/onboarding">Complete Profile</a>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowOnboardingBanner(false)}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
                            {agentId.replace(/_/g, ' ')} Agent
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-2">
                            {agent.system_message}
                        </p>
                    </div>
                    {(response || currentSessionId) && (
                        <Button
                            variant="outline"
                            onClick={handleNewSession}
                            className="w-full sm:w-auto shrink-0"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            New Session
                        </Button>
                    )}
                </div>
            </div>

            {/* Session History */}
            <AgentSessionHistory
                key={sessionKey}
                agentType={agentId}
                onSessionRestore={handleSessionRestore}
                currentSessionId={currentSessionId}
                refreshKey={sessionKey}
            />

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
                                    ) : agentId === 'ad_copy' ? (
                                        <Button variant="outline" size="sm" onClick={downloadAsCSV} className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                            <Download className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                                            Download .CSV
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
                                            <Button variant="outline" size="sm" onClick={downloadAsCSV} className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                                <Download className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                                                .CSV
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                PDF
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div id="report-content" className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-6 bg-background h-[600px] max-h-[80vh] overflow-y-auto">
                                    {agentId === 'ad_copy' ? (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {parseCSV(response)[0]?.map((header, i) => (
                                                            <TableHead key={i} className="font-bold">{header}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {parseCSV(response).slice(1).map((row, i) => (
                                                        <TableRow key={i}>
                                                            {row.map((cell, j) => (
                                                                <TableCell key={j}>{cell}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (agentId === 'image_generation' || agentId === 'linkedin_headshot') && response.startsWith('http') ? (
                                        <div className="flex justify-center">
                                            <img
                                                src={response}
                                                alt="Generated Asset"
                                                className="max-w-full rounded-lg shadow-lg"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                                                            <div class="flex flex-col items-center justify-center p-12 bg-muted rounded-lg border border-dashed border-border text-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-muted-foreground opacity-50"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                                <h3 class="font-semibold text-lg">Image Expired</h3>
                                                                <p class="text-sm text-muted-foreground mt-2 max-w-xs">The temporary link for this image has expired. Please generate a new image.</p>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
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
