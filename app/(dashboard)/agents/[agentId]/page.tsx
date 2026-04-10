'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { createClient } from '@/lib/supabase/client'
import { AGENT_CONFIGS } from '@/lib/ai/agents'
import { AgentType, AgentSession } from '@/types'
import { Sparkles, ArrowLeft, Copy, Download, FileJson, FileText, Image as ImageIcon, Upload, MessageCircle, Send, RotateCcw, XCircle, History, Loader2, Clock, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getErrorMessage } from '@/lib/types/errors'
import { AgentSessionHistory } from '@/components/agent-session-history'
import KindleBookReader from '@/components/KindleBookReader'
import { useCredits } from '@/contexts/CreditsContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { ExhaustedBanner } from '@/components/credits/ExhaustedBanner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ParticleCard, GlobalSpotlight } from '@/components/ui/MagicBento'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DeepResearchRenderer } from '@/components/deep-research-renderer'
import BookWritingWorkflow from '@/components/BookWritingWorkflow'

const DEFAULT_IMAGE_MODEL = 'nano-banana-pro'
const IMAGE_RESPONSE_KEYS = [
    'image_url',
    'headshot_url',
    'output_image',
    'generated_image',
    'url',
    'response',
]

const extractImageFromUnknown = (value: unknown, seen = new Set<unknown>()): string | null => {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return null

        if (trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed)) {
            return trimmed
        }

        const markdownImage = trimmed.match(/!\[[^\]]*]\((data:image\/[^\s)]+|https?:\/\/[^\s)]+)\)/i)
        if (markdownImage?.[1]) {
            return markdownImage[1]
        }

        try {
            const parsed = JSON.parse(trimmed)
            const fromParsed = extractImageFromUnknown(parsed, seen)
            if (fromParsed) return fromParsed
        } catch {
            // not a JSON payload
        }

        const fallbackUrl = trimmed.match(/(data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s"'<>`]+)/i)
        return fallbackUrl?.[1] ?? null
    }

    if (typeof value !== 'object') return null
    if (seen.has(value)) return null
    seen.add(value)

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = extractImageFromUnknown(item, seen)
            if (found) return found
        }
        return null
    }

    const record = value as Record<string, unknown>
    for (const key of IMAGE_RESPONSE_KEYS) {
        const found = extractImageFromUnknown(record[key], seen)
        if (found) return found
    }

    for (const nestedValue of Object.values(record)) {
        const found = extractImageFromUnknown(nestedValue, seen)
        if (found) return found
    }

    return null
}
const IMAGE_MODEL_OPTIONS = [
    { value: 'nano-banana-2', label: 'Nano Banana 2 (Gemini 3.1 Flash — Fast)' },
    { value: 'nano-banana-pro', label: 'Nano Banana Pro (Gemini 3 Pro — High Fidelity)' },
    { value: 'seedream-4-0-250828', label: 'Seedream 4 (BytePlus)' },
]

/* ── Reel Script JSON Renderer ─────────────────────────────────────────────── */
function ReelScriptRenderer({ raw }: { raw: string }) {
    let data: Record<string, any> | null = null
    try {
        // Strip markdown code fences if model wrapped the JSON
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
        data = JSON.parse(cleaned)
    } catch {
        // Fallback: render as plain markdown
        return (
            <div className="markdown-container prose prose-invert prose-amber max-w-none prose-p:text-white/60 prose-p:leading-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw}</ReactMarkdown>
            </div>
        )
    }

    if (!data) return null

    const script: string[] = Array.isArray(data.script) ? data.script : []
    const directorNotes = data.director_notes || {}
    const reusePotential = data.reuse_potential || {}

    return (
        <div className="space-y-8 text-sm">

            {/* HOOK */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 mb-3">Hook</p>
                <p className="text-xl font-bold text-white leading-snug">&ldquo;{data.hook}&rdquo;</p>
                {data.hook_rationale && (
                    <p className="mt-3 text-white/50 text-xs leading-relaxed border-t border-white/5 pt-3">{data.hook_rationale}</p>
                )}
            </div>

            {/* STRUCTURE */}
            {(data.structure_used || data.structure_rationale) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Structure</p>
                    {data.structure_used && <p className="text-white font-semibold">{data.structure_used}</p>}
                    {data.structure_rationale && <p className="text-white/50 text-xs mt-1 leading-relaxed">{data.structure_rationale}</p>}
                </div>
            )}

            {/* FULL SCRIPT */}
            {script.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Full Script</p>
                    <ol className="space-y-3">
                        {script.map((line, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span className="text-white/80 leading-relaxed">{line}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* DURATION + CTA */}
            <div className="grid grid-cols-2 gap-4">
                {data.estimated_duration_seconds > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Est. Duration</p>
                        <p className="text-2xl font-black text-amber-500">{data.estimated_duration_seconds}s</p>
                    </div>
                )}
                {data.cta_type && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">CTA Type</p>
                        <p className="text-white font-bold">{data.cta_type}</p>
                        {data.cta_rationale && <p className="text-white/40 text-xs mt-1 leading-relaxed">{data.cta_rationale}</p>}
                    </div>
                )}
            </div>

            {/* DIRECTOR NOTES */}
            {Object.keys(directorNotes).length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Director Notes</p>
                    <div className="space-y-4">
                        {directorNotes.hook_delivery && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-1">Hook Delivery</p>
                                <p className="text-white/60 leading-relaxed text-xs">{directorNotes.hook_delivery}</p>
                            </div>
                        )}
                        {directorNotes.body_pacing && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-1">Body Pacing</p>
                                <p className="text-white/60 leading-relaxed text-xs">{directorNotes.body_pacing}</p>
                            </div>
                        )}
                        {directorNotes.cta_delivery && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-1">CTA Delivery</p>
                                <p className="text-white/60 leading-relaxed text-xs">{directorNotes.cta_delivery}</p>
                            </div>
                        )}
                        {directorNotes.visual_suggestions && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-1">Visual Suggestions</p>
                                <p className="text-white/60 leading-relaxed text-xs">{directorNotes.visual_suggestions}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* REUSE POTENTIAL */}
            {(reusePotential.series_angle || reusePotential.part_2_hook) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Reuse Potential</p>
                    {reusePotential.series_angle && (
                        <div className="mb-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-1">Series Angle</p>
                            <p className="text-white/60 leading-relaxed text-xs">{reusePotential.series_angle}</p>
                        </div>
                    )}
                    {reusePotential.part_2_hook && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 mb-2">Part 2 Hook</p>
                            <p className="text-white/80 font-medium leading-snug">&ldquo;{reusePotential.part_2_hook}&rdquo;</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function AgentPageContent() {
    const params = useParams()
    const agentId = params.agentId as AgentType
    const agent = AGENT_CONFIGS[agentId]
    const { isAgentExhausted, refetchUsage } = useCredits()
    const { isPremium } = useSubscription()
    const isExhausted = isAgentExhausted(agentId)

    const [formData, setFormData] = useState<Record<string, string>>({})
    const [additionalDetails, setAdditionalDetails] = useState('')
    const [response, setResponse] = useState('')
    const [metaCsv, setMetaCsv] = useState('')
    const [activeTab, setActiveTab] = useState<'standard' | 'meta'>('standard')
    const [refinedPrompt, setRefinedPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [headshotBackground, setHeadshotBackground] = useState('')
    const [headshotOutfit, setHeadshotOutfit] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
    const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL)
    // Reel script: up to 5 reference links with scrape status
    const [reelLinks, setReelLinks] = useState<Array<{ url: string; status: 'idle' | 'loading' | 'ok' | 'error'; content: string; error: string }>>([
        { url: '', status: 'idle', content: '', error: '' },
    ])
    const [hasAutofilled, setHasAutofilled] = useState(false)
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [customFilename, setCustomFilename] = useState('')
    const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'md' | 'csv' | 'image' | null>(null)
    const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({}) // Track uploaded images for chat context
    const [aspectRatio, setAspectRatio] = useState('Square') // Aspect ratio state
    const [showHistory, setShowHistory] = useState(false)
    const [formStep, setFormStep] = useState(0)
    const [showFullscreenOutput, setShowFullscreenOutput] = useState(false)
    const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false)
    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)

    // ── Book Writing has its own dedicated workflow UI ──
    if (agentId === 'book_writing') {
        return (
            <ErrorBoundary>
                <BookWritingWorkflow onCreditDeduct={refetchUsage} />
            </ErrorBoundary>
        )
    }

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
                    'secondary problems': onboardingData.secondary_problems,
                    'pain points': onboardingData.pain_points,
                    'my experience': onboardingData.description, // Fallback
                    'business description': onboardingData.description,
                    'description': onboardingData.description,
                    'my core philosophy or approach': onboardingData.mission,
                    'mission statement': onboardingData.mission,
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

    useEffect(() => {
        if (agentId === 'image_generation' || agentId === 'linkedin_headshot') {
            const preset = typeof formData['Image Model'] === 'string' && formData['Image Model'].trim()
                ? formData['Image Model']
                : DEFAULT_IMAGE_MODEL
            setImageModel(preset)
            if (!formData['Image Model']) {
                setFormData(prev => ({
                    ...prev,
                    'Image Model': preset
                }))
            }
        }
    }, [agentId])

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

    const isImageAgent = agentId === 'image_generation' || agentId === 'linkedin_headshot' || agentId === 'ad_copy'
    const renderedImage = extractImageFromUnknown(response)

    const convertBlobToDataUrl = (blob: Blob): Promise<string> => (
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
            reader.readAsDataURL(blob)
        })
    )

    const resolveImageSourceForChat = async (imageSource: string): Promise<string | null> => {
        if (!imageSource) return null
        if (imageSource.startsWith('data:image/')) return imageSource

        const imgRes = await fetch(`/api/download?url=${encodeURIComponent(imageSource)}`)
        if (!imgRes.ok) throw new Error('Proxy fetch failed')
        const blob = await imgRes.blob()
        const dataUrl = await convertBlobToDataUrl(blob)
        return dataUrl.startsWith('data:image/') ? dataUrl : null
    }

    const cacheGeneratedImageForChat = async (imageSource: string | null) => {
        if (!imageSource || !isImageAgent) return

        try {
            const resolvedImage = await resolveImageSourceForChat(imageSource)
            if (resolvedImage) {
                setUploadedImages({ 'Generated Output': resolvedImage })
            } else {
                setUploadedImages({})
            }
        } catch (error) {
            console.error('Failed to fetch generated image for chat analysis via proxy:', error)
            setUploadedImages({})
        }
    }

    const getVisionImagesForChat = async (): Promise<Record<string, string> | undefined> => {
        const validUploadedImages = Object.fromEntries(
            Object.entries(uploadedImages).filter(([, value]) => typeof value === 'string' && value.startsWith('data:image/'))
        ) as Record<string, string>

        if (Object.keys(validUploadedImages).length > 0) {
            return validUploadedImages
        }

        if (!isImageAgent || !renderedImage) return undefined

        try {
            const resolvedImage = await resolveImageSourceForChat(renderedImage)
            if (!resolvedImage) return undefined
            const preparedImages = { 'Generated Output': resolvedImage }
            setUploadedImages(preparedImages)
            return preparedImages
        } catch (error) {
            console.error('Failed to prepare rendered image for vision chat:', error)
            return undefined
        }
    }

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
                <Card className="border-warm-border bg-warm-surface">
                    <CardHeader>
                        <CardTitle className="text-foreground">Agent Not Found</CardTitle>
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
                const base64Data = reader.result as string
                setFormData(prev => ({
                    ...prev,
                    [field]: base64Data
                }))
                // Store image for chat context
                setUploadedImages(prev => ({
                    ...prev,
                    [field]: base64Data
                }))
            }
            reader.readAsDataURL(file)
            toast.success(`${file.name} uploaded successfully`)
        }
    }

    // ── Reel Script: scrape a single link ─────────────────────────────────────
    const scrapeReelLink = async (index: number, url: string) => {
        if (!url.trim()) return
        let validUrl: string
        try {
            validUrl = new URL(url.trim()).href
        } catch {
            setReelLinks(prev => {
                const next = [...prev]
                next[index] = { ...next[index], status: 'error', error: 'Invalid URL', content: '' }
                return next
            })
            return
        }
        setReelLinks(prev => {
            const next = [...prev]
            next[index] = { ...next[index], url: validUrl, status: 'loading', error: '', content: '' }
            return next
        })
        try {
            const res = await fetch('/api/agents/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: validUrl }),
            })
            const data = await res.json()
            if (!res.ok || data.error) {
                setReelLinks(prev => {
                    const next = [...prev]
                    next[index] = { ...next[index], status: 'error', error: data.error || 'Failed to scrape', content: '' }
                    return next
                })
            } else {
                setReelLinks(prev => {
                    const next = [...prev]
                    next[index] = { ...next[index], status: 'ok', content: data.content, error: '' }
                    return next
                })
            }
        } catch {
            setReelLinks(prev => {
                const next = [...prev]
                next[index] = { ...next[index], status: 'error', error: 'Network error', content: '' }
                return next
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent, forceRefresh = false) => {
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
                reference_image: formData['Reference Image (Optional)'],
                image_model: formData['Image Model'] || imageModel,
                aspect_ratio: aspectRatio
            }
        } else if (agentId === 'linkedin_headshot') {
            const backgroundTemplate = headshotBackground || formData['Background Template'] || ''
            const outfitTemplate = headshotOutfit || formData['Clothing Template'] || ''
            const preferenceLines = [
                backgroundTemplate ? `Preferred background: ${backgroundTemplate}` : '',
                outfitTemplate ? `Preferred attire: ${outfitTemplate}` : ''
            ].filter(Boolean)

            fullInput = `Additional Details: ${additionalDetails}${preferenceLines.length > 0 ? `\n${preferenceLines.join('\n')}` : ''}`
            context = {
                user_image: formData['User Image'],
                ...(backgroundTemplate ? { headshot_background: backgroundTemplate } : {}),
                ...(outfitTemplate ? { headshot_outfit: outfitTemplate } : {}),
                image_model: formData['Image Model'] || imageModel,
                aspect_ratio: 'Square',
                ...(selectedTemplate ? { headshot_template: selectedTemplate } : {})
            }
        } else if (agentId === 'reel_script') {
            const contentIdea = formData['Content Idea or Topic'] || ''
            const extras = additionalDetails.trim()
            fullInput = extras ? `${contentIdea}\n\nAdditional Instructions: ${extras}` : contentIdea
            context = {}
            reelLinks.forEach((link, i) => {
                if (link.status === 'ok' && link.content) {
                    context[`reference_content_${i + 1}`] = link.content
                }
            })
        } else {
            // Construct the input from form data
            const questionAnswers = agent.questions.map((q, idx) => {
                const answer = formData[q] || ''
                return `${q}: ${answer}`
            }).join('\n')

            fullInput = `${questionAnswers}\n\nAdditional Details: ${additionalDetails}`
            // Pass the structured form data in the context as well
            context = { ...formData }
        }

        try {
            const res = await fetch('/api/agents/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: agentId,
                    input: fullInput,
                    context,
                    forceRefresh
                }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Server Error (${res.status})` }))
                throw new Error(errorData.error || `Request failed with status ${res.status}`)
            }

            const data = await res.json()

            if (data.response) {
                setResponse(data.response)
                if (data.meta_csv) {
                    setMetaCsv(data.meta_csv)
                }
                if (data.refined_prompt) {
                    setRefinedPrompt(data.refined_prompt)
                }
                // Refresh usage so sidebar updates
                refetchUsage()

                // Clear uploaded images after generation
                setUploadedImages({})

                // For image agents, store generated output as chat vision context
                if (isImageAgent) {
                    const generatedImage = extractImageFromUnknown(data.response)
                    await cacheGeneratedImageForChat(generatedImage)
                }

                // Auto-save session after successful response
                await saveSession(data.response, data.refined_prompt)
            } else if (data.error) {
                setError(data.error)
            }
        } catch (error: unknown) {
            console.error('Agent error:', error)
            setError(getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    const handleOptimizePrompts = async () => {
        const questionsToOptimize = agent.questions.filter(q => {
            const question = q.toLowerCase()
            return question.includes('prompt') ||
                question.includes('beliefs') ||
                question.includes('philosophy') ||
                question.includes('experience') ||
                question.includes('audience') ||
                question.includes('problem') ||
                question.includes('description') ||
                question.includes('mission') ||
                question.includes('vision') ||
                question.includes('promise') ||
                question.includes('niche') ||
                question.includes('topic') ||
                question.includes('content') ||
                question.includes('idea') ||
                question.includes('subject') ||
                question.includes('goal') ||
                question.includes('curriculum');
        });

        const filledQuestions = questionsToOptimize.filter(q => (formData[q] || '').trim().length > 0);

        if (filledQuestions.length === 0) {
            toast.error('Please enter some text in the fields to optimize')
            return
        }

        setIsOptimizingPrompt(true)
        const toastId = toast.loading('Optimizing all prompts...')
        try {
            const results = await Promise.all(filledQuestions.map(async (q) => {
                const prompt = formData[q]
                try {
                    const res = await fetch('/api/canvas/optimize-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt, label: q })
                    })
                    if (!res.ok) return { question: q, optimized: null }
                    const data = await res.json()
                    return { question: q, optimized: data.optimizedPrompt }
                } catch (e) {
                    return { question: q, optimized: null }
                }
            }))

            const newFormData = { ...formData }
            let successCount = 0
            results.forEach(res => {
                if (res.optimized) {
                    newFormData[res.question] = res.optimized
                    successCount++
                }
            })

            setFormData(newFormData)
            if (successCount === filledQuestions.length) {
                toast.success('All fields optimized successfully!', { id: toastId })
            } else if (successCount > 0) {
                toast.success(`Optimized ${successCount} out of ${filledQuestions.length} fields`, { id: toastId })
            } else {
                toast.error('Failed to optimize fields', { id: toastId })
            }
        } catch (error) {
            console.error('Optimization error:', error)
            toast.error('An error occurred during optimization', { id: toastId })
        } finally {
            setIsOptimizingPrompt(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(response)
        toast.success('Copied to clipboard')
    }

    const downloadImage = (customFilename?: string) => {
        try {
            const filename = customFilename ? `${customFilename}.png` : `${agentId}-image.png`
            const imageArtifact = extractImageFromUnknown(response)
            if (!imageArtifact) {
                toast.error('No generated image found to download')
                return
            }

            if (imageArtifact.startsWith('data:image/')) {
                const link = document.createElement('a')
                link.href = imageArtifact
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('Download started')
                return
            }

            // Use our proxy endpoint to bypass CORS and force download
            const downloadUrl = `/api/download?url=${encodeURIComponent(imageArtifact)}&filename=${encodeURIComponent(filename)}`
            window.location.href = downloadUrl
            toast.success('Download started')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download: URL likely expired')
        }
    }

    const downloadAsFile = (type: 'md' | 'csv', customFilename?: string) => {
        const element = document.createElement('a')
        const blobType = type === 'md' ? 'text/markdown' : 'text/csv'
        const content = (type === 'csv' && activeTab === 'meta' && metaCsv) ? metaCsv : response
        const file = new Blob([content], { type: blobType })
        element.href = URL.createObjectURL(file)
        element.download = customFilename ? `${customFilename}.${type}` : `${agentId}-report.${type}`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        toast.success(`Downloaded as ${type.toUpperCase()}`)
    }

    const downloadAsMarkdown = (customFilename?: string) => downloadAsFile('md', customFilename)
    const downloadAsCSV = (customFilename?: string) => downloadAsFile('csv', customFilename)

    const downloadAsPDF = async (customFilename?: string) => {
        const { default: html2pdf } = await import('html2pdf.js')
        const filename = customFilename ? `${customFilename}.pdf` : `${agentId}-report.pdf`
        const pdfSettings = {
            margin: [15, 15, 15, 15],
            filename,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }


        /* ── Deep Research: build clean HTML from JSON for PDF ── */
        if (agentId === 'deep_research' && response.startsWith('DEEP_RESEARCH_JSON:')) {
            const jsonStr = response.slice('DEEP_RESEARCH_JSON:'.length)
            let drData: any = null
            try { drData = JSON.parse(jsonStr) } catch { }
            if (!drData) { toast.error('Failed to parse research data for PDF'); return }

            const esc = (s: any) => {
                if (s === null || s === undefined) return '—'
                const str = typeof s === 'string' ? s : String(s)
                return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            }

            const buildCompetitorsHtml = (comps: any[]) => {
                let html = '<h2>01 — Competitive Landscape</h2>'
                html += '<table><thead><tr><th>Company</th><th>Geography</th><th>Niche</th><th>Core Promise</th><th>Weakness / USP</th><th>Pricing</th></tr></thead><tbody>'
                comps.forEach(c => {
                    html += `<tr>
                        <td><strong>${esc(c.name)}</strong></td>
                        <td>${esc(c.profile?.geography)}</td>
                        <td>${esc(c.profile?.niche)}<br/><small>${esc(c.profile?.target_audience)}</small></td>
                        <td>${esc(c.offerings?.core_promise)}</td>
                        <td>${esc(c.offerings?.usp)}</td>
                        <td>${esc(c.pricing?.estimated_range ?? c.pricing?.model)}</td>
                    </tr>`
                })
                html += '</tbody></table>'

                comps.forEach((c, i) => {
                    html += `<h3>${String(i + 1).padStart(2, '0')}. ${esc(c.name)}</h3>`
                    html += `<p><strong>What They Sell:</strong> ${esc(c.offerings?.what_they_sell)}</p>`
                    if (c.offerings?.key_features?.length) {
                        html += '<p><strong>Key Features:</strong></p><ul>'
                        c.offerings.key_features.forEach((f: string) => { html += `<li>${esc(f)}</li>` })
                        html += '</ul>'
                    }
                    if (c.funnel?.stages?.length) {
                        html += `<p><strong>Funnel (${esc(c.funnel.type)}):</strong> ${c.funnel.stages.map((s: string) => esc(s)).join(' → ')}</p>`
                    }
                    if (c.funnel?.lead_magnet) html += `<p><strong>Lead Magnet:</strong> ${esc(c.funnel.lead_magnet)}</p>`
                })
                return html
            }

            const buildAdsHtml = (ads: any[]) => {
                let html = '<div class="page-break"></div><h2>02 — Ad Intelligence</h2>'
                ads.forEach(entry => {
                    html += `<h3>${esc(entry.competitor)} — ${esc(entry.platform)}</h3>`
                    if (entry.ad_library_url) html += `<p><a href="${entry.ad_library_url}">View Ads Library →</a></p>`
                    html += '<table><thead><tr><th>#</th><th>Hook</th><th>Message</th><th>Offer</th><th>Creative</th><th>CTA</th><th>Angle</th></tr></thead><tbody>'
                        ; (entry.ads ?? []).forEach((ad: any) => {
                            html += `<tr>
                            <td>${ad.ad_number}</td>
                            <td>"${esc(ad.hook)}"</td>
                            <td>${esc(ad.message)}</td>
                            <td>${esc(ad.offer)}</td>
                            <td>${esc(ad.creative_type)}</td>
                            <td><strong>${esc(ad.cta)}</strong></td>
                            <td>${esc(ad.angle)}</td>
                        </tr>`
                        })
                    html += '</tbody></table>'
                })
                return html
            }

            const buildLandingPagesHtml = (pages: any[]) => {
                let html = '<div class="page-break"></div><h2>03 — Funnel Intelligence: Landing Pages</h2>'
                pages.forEach(pg => {
                    html += `<h3>${esc(pg.competitor)}</h3>`
                    if (pg.url) html += `<p><a href="${pg.url}">${esc(pg.url)}</a></p>`
                    html += '<table><thead><tr><th>Aspect</th><th>Details</th></tr></thead><tbody>'
                    if (pg.structure?.page_flow?.length) {
                        html += `<tr><td><strong>Page Flow</strong></td><td>${pg.structure.page_flow.map((s: string, i: number) => `${i + 1}. ${esc(s)}`).join('<br/>')}</td></tr>`
                    }
                    if (pg.structure?.headlines?.length) {
                        html += `<tr><td><strong>Headlines</strong></td><td>${pg.structure.headlines.map((h: string) => `"${esc(h)}"`).join('<br/>')}</td></tr>`
                    }
                    if (pg.conversion_elements) {
                        const ce = pg.conversion_elements
                        if (ce.emotional_triggers?.length) html += `<tr><td><strong>Emotional Triggers</strong></td><td>${ce.emotional_triggers.map((t: string) => esc(t)).join(', ')}</td></tr>`
                        if (ce.social_proof?.length) html += `<tr><td><strong>Social Proof</strong></td><td>${ce.social_proof.map((s: string) => esc(s)).join(', ')}</td></tr>`
                        if (ce.offer_positioning) html += `<tr><td><strong>Offer Positioning</strong></td><td>${esc(ce.offer_positioning)}</td></tr>`
                        if (ce.funnel_path) html += `<tr><td><strong>Conversion Path</strong></td><td>${esc(ce.funnel_path)}</td></tr>`
                    }
                    html += '</tbody></table>'
                })
                return html
            }

            const buildMessagingHtml = (msg: any) => {
                let html = '<div class="page-break"></div><h2>04 — Market Messaging Patterns</h2>'
                html += '<table><thead><tr><th>Category</th><th>Details</th></tr></thead><tbody>'
                const sections = [
                    { title: 'Repeated Pains', items: msg.repeated_pains },
                    { title: 'Repeated Desires', items: msg.repeated_desires },
                    { title: 'Repeated Objections', items: msg.repeated_objections },
                    { title: 'Common Hooks', items: msg.common_hooks },
                    { title: 'Target Identities', items: msg.target_identities },
                ]
                sections.forEach(s => {
                    if (s.items?.length) {
                        html += `<tr><td><strong>${s.title}</strong></td><td>${s.items.map((item: string, i: number) => `${i + 1}. ${esc(item)}`).join('<br/>')}</td></tr>`
                    }
                })
                html += '</tbody></table>'
                if (msg.winning_angles) {
                    html += '<h3>Winning Angle</h3>'
                    html += '<table><thead><tr><th>Aspect</th><th>Details</th></tr></thead><tbody>'
                    html += `<tr><td><strong>Pain → Desire</strong></td><td>${esc(msg.winning_angles.pain_to_desire)}</td></tr>`
                    if (msg.winning_angles.key_promises?.length) {
                        html += `<tr><td><strong>Key Promises</strong></td><td>${msg.winning_angles.key_promises.map((p: string, i: number) => `${i + 1}. ${esc(p)}`).join('<br/>')}</td></tr>`
                    }
                    html += '</tbody></table>'
                }
                return html
            }

            const buildInsightsHtml = (ins: any) => {
                let html = '<div class="page-break"></div><h2>05 — Customer Insights</h2>'
                // Pains, Desires, Objections as tables
                const lists = [
                    { title: 'Top Pains', items: ins.top_pains, key: 'pain' },
                    { title: 'Top Desires', items: ins.top_desires, key: 'desire' },
                    { title: 'Top Objections', items: ins.top_objections, key: 'objection' },
                ]
                lists.forEach(l => {
                    if (l.items?.length) {
                        html += `<h3>${l.title}</h3>`
                        html += '<table><thead><tr><th>Rank</th><th>Description</th></tr></thead><tbody>'
                        l.items.forEach((item: any) => {
                            html += `<tr><td>${item.rank}</td><td>${esc(item[l.key])}</td></tr>`
                        })
                        html += '</tbody></table>'
                    }
                })
                // Buying Psychology as table
                if (ins.buying_psychology) {
                    html += '<h3>Buying Psychology</h3>'
                    html += '<table><thead><tr><th>Factor</th><th>Details</th></tr></thead><tbody>'
                    if (ins.buying_psychology.why_buy?.length) {
                        html += `<tr><td><strong>Why They Buy</strong></td><td>${ins.buying_psychology.why_buy.map((r: string, i: number) => `${i + 1}. ${esc(r)}`).join('<br/>')}</td></tr>`
                    }
                    if (ins.buying_psychology.why_not_buy?.length) {
                        html += `<tr><td><strong>Why They Don't Buy</strong></td><td>${ins.buying_psychology.why_not_buy.map((r: string, i: number) => `${i + 1}. ${esc(r)}`).join('<br/>')}</td></tr>`
                    }
                    html += '</tbody></table>'
                }
                // Emotional Triggers as table
                if (ins.emotional_triggers) {
                    html += '<h3>Emotional & Status Triggers</h3>'
                    html += '<table><thead><tr><th>Aspect</th><th>Details</th></tr></thead><tbody>'
                    html += `<tr><td><strong>Status Identity</strong></td><td>${esc(ins.emotional_triggers.status)}</td></tr>`
                    if (ins.emotional_triggers.emotions?.length) {
                        html += `<tr><td><strong>Emotions</strong></td><td>${ins.emotional_triggers.emotions.map((e: string) => esc(e)).join(', ')}</td></tr>`
                    }
                    html += '</tbody></table>'
                }
                return html
            }

            const buildGapHtml = (gap: any) => {
                let html = '<div class="page-break"></div><h2>06 — Gap & Opportunity Analysis</h2>'
                html += '<table><thead><tr><th>Category</th><th>Details</th></tr></thead><tbody>'
                if (gap.market_gaps?.length) {
                    html += `<tr><td><strong>Market Gaps</strong></td><td>${gap.market_gaps.map((g: string, i: number) => `${i + 1}. ${esc(g)}`).join('<br/>')}</td></tr>`
                }
                if (gap.competitor_blind_spots?.length) {
                    html += `<tr><td><strong>Competitor Blind Spots</strong></td><td>${gap.competitor_blind_spots.map((g: string, i: number) => `${i + 1}. ${esc(g)}`).join('<br/>')}</td></tr>`
                }
                html += '</tbody></table>'
                const opp = gap.your_opportunity
                if (opp) {
                    if (opp.big_idea) html += `<div class="highlight-box"><strong>Big Idea:</strong> ${esc(opp.big_idea)}</div>`
                    html += '<table><thead><tr><th>Positioning</th><th>Details</th></tr></thead><tbody>'
                    if (opp.category_positioning) html += `<tr><td><strong>Category</strong></td><td>${esc(opp.category_positioning)}</td></tr>`
                    if (opp.unique_positioning) html += `<tr><td><strong>Unique</strong></td><td>${esc(opp.unique_positioning)}</td></tr>`
                    html += '</tbody></table>'
                    if (opp.pricing_strategy?.tiers?.length) {
                        html += `<h3>Pricing Recommendation — ${esc(opp.pricing_strategy.model)}</h3>`
                        html += '<table><thead><tr><th>Tier</th><th>Price</th><th>Features</th></tr></thead><tbody>'
                        opp.pricing_strategy.tiers.forEach((t: any) => {
                            html += `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.price)}</td><td>${esc(t.features)}</td></tr>`
                        })
                        html += '</tbody></table>'
                        if (opp.pricing_strategy.competitive_advantage) html += `<p><em>${esc(opp.pricing_strategy.competitive_advantage)}</em></p>`
                    }
                }
                return html
            }

            const buildFunnelHtml = (fun: any) => {
                let html = '<div class="page-break"></div><h2>07 — Funnel & Ad Direction</h2>'
                if (fun.big_promise) html += `<div class="highlight-box"><strong>Big Promise:</strong> ${esc(fun.big_promise)}</div>`
                // Funnel stages table
                if (fun.funnel_stages) {
                    html += '<h3>Funnel Stages</h3>'
                    html += '<table><thead><tr><th>Stage</th><th>Details</th></tr></thead><tbody>'
                    const stageLabels = [
                        { key: 'tofu', label: 'TOFU — Top of Funnel' },
                        { key: 'mofu', label: 'MOFU — Middle of Funnel' },
                        { key: 'bofu', label: 'BOFU — Bottom of Funnel' },
                        { key: 'retention', label: 'Retention' },
                    ]
                    stageLabels.forEach(s => {
                        const stage = fun.funnel_stages[s.key]
                        if (stage) {
                            const details = Object.entries(stage).filter(([, v]) => v).map(([k, v]) => `<strong>${k}:</strong> ${esc(v as string)}`).join('<br/>')
                            html += `<tr><td><strong>${s.label}</strong></td><td>${details}</td></tr>`
                        }
                    })
                    html += '</tbody></table>'
                }
                // Hooks, Angles, Formats, Channels — all as one table
                html += '<h3>Strategy Details</h3>'
                html += '<table><thead><tr><th>Category</th><th>Details</th></tr></thead><tbody>'
                const listSections = [
                    { title: 'Best Hooks', items: fun.recommended_hooks },
                    { title: 'Winning Angles', items: fun.winning_angles },
                    { title: 'Creative Formats', items: fun.creative_formats },
                    { title: 'Target Channels', items: fun.target_channels },
                ]
                listSections.forEach(s => {
                    if (s.items?.length) {
                        html += `<tr><td><strong>${s.title}</strong></td><td>${s.items.map((item: string, i: number) => `${i + 1}. ${esc(item)}`).join('<br/>')}</td></tr>`
                    }
                })
                html += '</tbody></table>'
                if (fun.launch_messaging) html += `<div class="highlight-box"><strong>Launch Message:</strong> <em>"${esc(fun.launch_messaging)}"</em></div>`
                return html
            }

            let fullHtml = ''
            if (drData.competitors?.length) fullHtml += buildCompetitorsHtml(drData.competitors)
            if (drData.ad_research?.length) fullHtml += buildAdsHtml(drData.ad_research)
            if (drData.landing_pages?.length) fullHtml += buildLandingPagesHtml(drData.landing_pages)
            if (drData.messaging_patterns) fullHtml += buildMessagingHtml(drData.messaging_patterns)
            if (drData.customer_insights) fullHtml += buildInsightsHtml(drData.customer_insights)
            if (drData.gap_analysis) fullHtml += buildGapHtml(drData.gap_analysis)
            if (drData.funnel_strategy) fullHtml += buildFunnelHtml(drData.funnel_strategy)

            const overlay = document.createElement('div')
            overlay.style.cssText = `
                position:fixed;top:0;left:0;width:750px;height:auto;min-height:100vh;
                z-index:99999;background:#fff;overflow:visible;
                font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
                color:#1a1a1a;font-size:10pt;line-height:1.6;
            `
            overlay.innerHTML = `
                <div style="padding:36px 40px;background:#fff;width:750px;box-sizing:border-box;">
                    <h1 style="text-align:center;font-size:20pt;font-weight:900;margin-bottom:8px;color:#111;">Deep Research Report</h1>
                    <p style="text-align:center;font-size:9pt;color:#888;margin-bottom:32px;">Generated by UtilityAI</p>
                    ${fullHtml}
                </div>
                <style>
                    .page-break { page-break-before: always; padding-top: 16px; }
                    h2 {
                        font-size: 14pt; font-weight: 800; color: #111;
                        border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;
                        margin-top: 28px; margin-bottom: 14px;
                        page-break-after: avoid;
                    }
                    h3 {
                        font-size: 11pt; font-weight: 700; color: #333;
                        margin-top: 18px; margin-bottom: 8px;
                        page-break-after: avoid;
                    }
                    p {
                        font-size: 9.5pt; margin-bottom: 8px; color: #222;
                        line-height: 1.6; word-wrap: break-word;
                    }
                    table {
                        width: 100%; border-collapse: collapse; margin: 12px 0;
                        table-layout: fixed; word-wrap: break-word;
                        page-break-inside: auto;
                    }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th {
                        background: #f3f4f6; padding: 8px 10px; border: 1px solid #d1d5db;
                        font-size: 8pt; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: #374151; text-align: left;
                        word-wrap: break-word;
                    }
                    td {
                        padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 9pt;
                        color: #222; vertical-align: top; word-wrap: break-word;
                        overflow-wrap: break-word;
                    }
                    ul {
                        list-style-type: disc; padding-left: 22px;
                        margin: 6px 0 14px;
                    }
                    ol {
                        list-style-type: decimal; padding-left: 22px;
                        margin: 6px 0 14px;
                    }
                    li {
                        font-size: 9.5pt; color: #222; margin-bottom: 5px;
                        line-height: 1.55; display: list-item;
                        page-break-inside: avoid;
                    }
                    a { color: #1d4ed8; text-decoration: underline; }
                    strong { font-weight: 700; }
                    em { font-style: italic; }
                    small { font-size: 8pt; color: #666; }
                    .highlight-box {
                        background: #fffbeb; border: 1px solid #f59e0b;
                        border-radius: 6px; padding: 12px 16px; margin: 12px 0;
                        font-size: 10pt; color: #111;
                    }
                </style>
            `
            document.body.appendChild(overlay)
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
            try {
                await html2pdf()
                    .set({
                        ...pdfSettings,
                        pagebreak: {
                            mode: ['avoid-all', 'css'],
                            avoid: ['tr', 'li', 'h2', 'h3', '.highlight-box'],
                        },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            logging: false,
                            windowWidth: 750,
                        },
                    })
                    .from(overlay.querySelector('div') as HTMLElement)
                    .save()
            } finally {
                document.body.removeChild(overlay)
            }
            return
        }

        /* ── All other agents: original clone-based approach ── */
        const reportContent = document.getElementById('report-content')
        if (!reportContent) return

        const pdfContainer = document.createElement('div')
        pdfContainer.className = 'pdf-export-container'

        const contentClone = reportContent.cloneNode(true) as HTMLElement
        contentClone.classList.remove('h-[600px]', 'max-h-[80vh]', 'overflow-y-auto', 'border', 'rounded-md', 'bg-background')
        contentClone.classList.remove('prose-invert')
        contentClone.querySelectorAll('.prose-invert').forEach(el => el.classList.remove('prose-invert'))

        contentClone.querySelectorAll('*').forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.color = '#000000'
                Array.from(el.classList).filter(c => c.startsWith('bg-') || c.startsWith('text-') || c.startsWith('border-') || c === 'prose-invert').forEach(c => el.classList.remove(c))
            }
        })

        Object.assign(contentClone.style, { height: 'auto', maxHeight: 'none', overflow: 'visible', border: 'none', background: '#ffffff', padding: '40px', width: '100%' })
        contentClone.className += ' pdf-export'

        pdfContainer.appendChild(contentClone)
        Object.assign(pdfContainer.style, { position: 'absolute', top: '-9999px', left: '0', width: '800px' })
        document.body.appendChild(pdfContainer)

        const exportStyles = document.createElement('style')
        exportStyles.textContent = `
            /* ── Base reset for PDF ── */
            .pdf-export-container,
            .pdf-export-container * {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .pdf-export-container,
            .pdf-export-container .pdf-export {
                color: #111111 !important;
                background: #ffffff !important;
                line-height: 1.6 !important;
            }

            /* ── Force all text visible ── */
            .pdf-export-container [class*="text-white"] { color: #111111 !important; }
            .pdf-export-container [class*="text-white/"] { color: #111111 !important; }
            .pdf-export-container [class*="text-amber"] { color: #92400e !important; }
            .pdf-export-container [class*="text-red"] { color: #991b1b !important; }
            .pdf-export-container [class*="text-emerald"] { color: #065f46 !important; }
            .pdf-export-container [class*="text-sky"] { color: #1e3a5f !important; }
            .pdf-export-container [class*="text-blue"] { color: #1e40af !important; }
            .pdf-export-container [class*="text-violet"] { color: #4c1d95 !important; }
            .pdf-export-container [class*="text-orange"] { color: #7c2d12 !important; }

            /* ── Force all backgrounds light ── */
            .pdf-export-container [class*="bg-white"] { background-color: #f9fafb !important; }
            .pdf-export-container [class*="bg-amber"] { background-color: #fef3c7 !important; }
            .pdf-export-container [class*="bg-red"] { background-color: #fee2e2 !important; }
            .pdf-export-container [class*="bg-emerald"] { background-color: #d1fae5 !important; }
            .pdf-export-container [class*="bg-sky"] { background-color: #e0f2fe !important; }
            .pdf-export-container [class*="bg-blue"] { background-color: #dbeafe !important; }
            .pdf-export-container [class*="bg-violet"] { background-color: #ede9fe !important; }
            .pdf-export-container [class*="bg-orange"] { background-color: #ffedd5 !important; }

            /* ── Force borders visible ── */
            .pdf-export-container [class*="border-white"] { border-color: #e5e7eb !important; }
            .pdf-export-container [class*="border-amber"] { border-color: #d97706 !important; }
            .pdf-export-container [class*="border-red"] { border-color: #ef4444 !important; }
            .pdf-export-container [class*="border-emerald"] { border-color: #10b981 !important; }
            .pdf-export-container [class*="border-sky"] { border-color: #0ea5e9 !important; }
            .pdf-export-container [class*="border-blue"] { border-color: #3b82f6 !important; }
            .pdf-export-container [class*="border-violet"] { border-color: #8b5cf6 !important; }

            /* ── Dividers ── */
            .pdf-export-container [class*="border-t"] { border-top-color: #e5e7eb !important; }
            .pdf-export-container [class*="border-b"] { border-bottom-color: #e5e7eb !important; }
            .pdf-export-container [class*="border-l"] { border-left-color: #d1d5db !important; }
            .pdf-export-container [class*="divide-white"] > * + * { border-color: #e5e7eb !important; }

            /* ── Standard elements ── */
            .pdf-export-container h1, .pdf-export-container h2 { color: #111111 !important; }
            .pdf-export-container h2 { font-size: 16pt !important; margin-top: 24px !important; margin-bottom: 12px !important; font-weight: 800 !important; }
            .pdf-export-container p { margin-bottom: 8px !important; color: #111111 !important; }
            .pdf-export-container table { width: 100% !important; border-collapse: collapse !important; margin: 16px 0 !important; page-break-inside: auto !important; }
            .pdf-export-container tr { page-break-inside: avoid !important; page-break-after: auto !important; }
            .pdf-export-container th { background-color: #f3f4f6 !important; padding: 10px 12px !important; border: 1px solid #d1d5db !important; color: #111111 !important; text-align: left !important; font-weight: 700 !important; }
            .pdf-export-container td { border: 1px solid #e5e7eb !important; padding: 10px 12px !important; color: #111111 !important; vertical-align: top !important; }
            .pdf-export-container a { color: #1d4ed8 !important; text-decoration: underline !important; }
            .pdf-export-container span { color: inherit !important; }
            .pdf-export-container ul { list-style-type: disc !important; padding-left: 24px !important; margin-bottom: 12px !important; }
            .pdf-export-container ol { list-style-type: decimal !important; padding-left: 24px !important; margin-bottom: 12px !important; }
            .pdf-export-container li { color: #111111 !important; margin-bottom: 6px !important; display: list-item !important; text-align: left !important; page-break-inside: avoid !important; }

            /* ── Gradient overrides ── */
            .pdf-export-container [class*="from-"] { background-image: none !important; }
            .pdf-export-container [class*="to-"] { background-image: none !important; }
            .pdf-export-container [class*="bg-gradient"] { background-image: none !important; background-color: #fffbeb !important; }
        `
        document.head.appendChild(exportStyles)
        try {
            await html2pdf().set(pdfSettings).from(contentClone).save()
        } finally {
            document.body.removeChild(pdfContainer)
            document.head.removeChild(exportStyles)
        }
    }

    const handleChatSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!chatInput.trim()) return

        const userMessage = chatInput.trim()
        setChatInput('')

        const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }]
        setChatMessages(newMessages)
        setChatLoading(true)

        try {
            const visionImages = await getVisionImagesForChat()
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    agent_type: agentId,
                    initialContext: renderedImage || response,
                    uploadedImages: visionImages
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                const detail = typeof data.details === 'string' && data.details.trim()
                    ? ` (${data.details.substring(0, 180)})`
                    : ''
                throw new Error(`${data.error || 'Failed to get response'}${detail}`)
            }

            const updatedMessages = [...newMessages, { role: 'assistant' as const, content: data.response }]
            setChatMessages(updatedMessages)

            if (currentSessionId) {
                await updateSessionChat(updatedMessages)
            } else if (response) {
                await saveSession(response, refinedPrompt, updatedMessages)
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
                setSessionKey(prev => prev + 1)

                // Broadcast update to other tabs/components
                try {
                    const channel = new BroadcastChannel('agent_sessions_sync')
                    channel.postMessage({ type: 'SESSION_CREATED', agentType: agentId })
                    channel.close()
                } catch (e) {
                    console.error('BroadcastChannel error:', e)
                }
                toast.success('Session saved')
            }
        } catch (error) {
            console.error('Failed to save session:', error)
        }
    }

    const updateSessionChat = async (messages: Array<{ role: 'user' | 'assistant', content: string }>) => {
        if (!currentSessionId) return
        try {
            await fetch(`/api/agents/sessions/${currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_messages: messages }),
            })
        } catch (error) {
            console.error('Failed to update session:', error)
        }
    }

    const handleSessionRestore = (session: AgentSession) => {
        setFormData(session.form_data || {})
        setHeadshotBackground(session.form_data?.['Background Template'] || '')
        setHeadshotOutfit(session.form_data?.['Clothing Template'] || '')
        setImageModel(session.form_data?.['Image Model'] || DEFAULT_IMAGE_MODEL)
        const restoredResponse = session.response || ''
        setResponse(restoredResponse)
        // Extract meta_csv if stored in metadata or reconstructed (simplified for now: session might not have it yet)
        setMetaCsv('')
        setRefinedPrompt(session.refined_prompt || '')
        setChatMessages(session.chat_messages || [])
        setCurrentSessionId(session.id)
        setShowChat(session.chat_messages && session.chat_messages.length > 0)
        setUploadedImages({})
        if (isImageAgent) {
            const restoredImage = extractImageFromUnknown(restoredResponse)
            void cacheGeneratedImageForChat(restoredImage)
        }
        toast.success('Session restored')
    }

    const handleNewSession = () => {
        setFormData({})
        setAdditionalDetails('')
        setResponse('')
        setRefinedPrompt('')
        setHeadshotBackground('')
        setHeadshotOutfit('')
        setImageModel(DEFAULT_IMAGE_MODEL)
        setChatMessages([])
        setCurrentSessionId(null)
        setShowChat(false)
        setError('')
        toast.success('New session started')
    }

    const CSVTable = ({ csvData }: { csvData: string }) => {
        const rows = csvData.trim().split('\n').map(row => {
            const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (matches) return matches.map(m => m.trim().replace(/^"|"$/g, ''));
            return row.split(',').map(c => c.trim());
        });

        if (rows.length < 2) return <div className="p-10 text-center text-white/40 italic">Formatting output structure...</div>;

        const headers = rows[0];
        const data = rows.slice(1);

        return (
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            {headers.map((h, i) => (
                                <th key={i} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/90 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-amber-500/[0.02] transition-colors group">
                                {row.map((cell, j) => (
                                    <td key={j} className="px-6 py-5 text-[13px] text-white/60 leading-relaxed font-medium group-hover:text-white/90 transition-colors">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div ref={containerRef} className="max-w-[1600px] mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 relative">
            <GlobalSpotlight gridRef={containerRef} glowColor="245, 158, 11" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                    <div className="flex flex-col items-start gap-3">
                        <Link href="/agents">
                            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 -ml-3 rounded-lg px-3 mb-2">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight capitalize text-white opacity-95">
                            {agentId.replace(/_/g, ' ')}
                        </h1>
                    </div>
                    {agentId !== 'course_generator' && (
                        <p className="text-sm sm:text-base text-white/40 max-w-2xl leading-relaxed font-light whitespace-pre-line">
                            {agent.description || agent.system_message}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        onClick={() => setShowHistory(!showHistory)}
                        className="h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl px-6 font-medium transition-all"
                    >
                        <History className="h-4 w-4 mr-2" />
                        {showHistory ? 'Close History' : 'Session History'}
                    </Button>
                    {(response || currentSessionId) && (
                        <Button
                            onClick={handleNewSession}
                            className="h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 rounded-xl px-6 font-medium transition-all"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            New Session
                        </Button>
                    )}
                </div>
            </div>

            {showOnboardingBanner && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white">Complete your professional profile</p>
                        <p className="text-xs text-white/50">Your agents will generate 3x more accurate results with your business context.</p>
                    </div>
                    <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-lg px-4" asChild>
                        <a href="/onboarding">Boost AI Accuracy</a>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={() => setShowOnboardingBanner(false)}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {showHistory && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <AgentSessionHistory
                        key={sessionKey}
                        agentType={agentId}
                        onSessionRestore={(session) => {
                            handleSessionRestore(session);
                            setShowHistory(false);
                        }}
                        currentSessionId={currentSessionId}
                        refreshKey={sessionKey}
                    />
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12 items-start">
                <div className="lg:col-span-12 xl:col-span-5 h-full">
                    <ParticleCard
                        className="w-full border-white/10 bg-[#030303] overflow-hidden shadow-2xl !aspect-auto h-[850px] magic-bento-card--static-glow"
                        particleCount={0}
                        glowColor="245, 158, 11"
                        enableTilt={false}
                    >
                        <div className="p-6 sm:p-10 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-10 shrink-0">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                    <Sparkles className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Project Specs</h2>
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">Configure parameters</p>
                                </div>
                            </div>

                            <div className="flex-1 -mx-2 px-2 overflow-y-auto custom-scrollbar">
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-8 pb-4">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-1">
                                                {Array.from({ length: agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3) }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 w-8 rounded-full transition-all duration-300 ${formStep >= i ? 'bg-amber-500' : 'bg-white/10'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                Step {formStep + 1} of {agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3)}
                                            </span>
                                        </div>

                                        {agent.questions.slice(formStep * (agentId === 'linkedin_headshot' ? 1 : 3), (formStep + 1) * (agentId === 'linkedin_headshot' ? 1 : 3)).map((question, index) => {
                                            const globalIndex = formStep * 3 + index;
                                            const isTextArea =
                                                question.toLowerCase().includes('prompt') ||
                                                question.toLowerCase().includes('beliefs') ||
                                                question.toLowerCase().includes('philosophy') ||
                                                question.toLowerCase().includes('experience') ||
                                                question.toLowerCase().includes('audience') ||
                                                question.toLowerCase().includes('problem') ||
                                                question.toLowerCase().includes('description') ||
                                                question.toLowerCase().includes('mission') ||
                                                question.toLowerCase().includes('vision') ||
                                                question.toLowerCase().includes('promise') ||
                                                question.toLowerCase().includes('idea') ||
                                                question.toLowerCase().includes('topic') ||
                                                question.toLowerCase().includes('niche');

                                            return (
                                                <div key={globalIndex} className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                                    <Label className="text-white/80 text-xs font-bold uppercase tracking-widest ml-1 opacity-70" htmlFor={`question-${globalIndex}`}>
                                                        {question}
                                                    </Label>
                                                    {agent.image_fields?.includes(question) ? (
                                                        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-amber-500/30 transition-all">
                                                            <Input
                                                                id={`question-${globalIndex}`}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileChange(e, question)}
                                                                disabled={loading}
                                                                className="cursor-pointer bg-transparent border-none text-white file:text-white file:bg-white/10 file:font-bold file:px-4 file:py-2 file:rounded-xl h-auto p-0"
                                                            />
                                                            {formData[question] && (
                                                                <div className="h-14 w-14 border border-white/20 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                                                    <img src={formData[question]} alt="Preview" className="h-full w-full object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : question.toLowerCase() === 'image model' ? (
                                                        <Select
                                                            value={formData[question] || imageModel}
                                                            onValueChange={(value) => {
                                                                setImageModel(value)
                                                                handleInputChange(question, value)
                                                            }}
                                                        >
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-amber-500/50 hover:border-white/20 transition-all">
                                                                <SelectValue placeholder="Select high-performance model" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl">
                                                                {(agentId === 'linkedin_headshot'
                                                                    ? IMAGE_MODEL_OPTIONS.filter(o => o.value !== 'seedream-4-0-250828')
                                                                    : IMAGE_MODEL_OPTIONS
                                                                ).map(option => (
                                                                    <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 rounded-xl my-1">
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : isTextArea ? (
                                                        <textarea
                                                            id={`question-${globalIndex}`}
                                                            className="flex min-h-[160px] w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all placeholder:text-white/10 resize-none hover:border-white/20"
                                                            placeholder={`Detail your ${question.toLowerCase()}...`}
                                                            value={formData[question] || ''}
                                                            onChange={(e) => handleInputChange(question, e.target.value)}
                                                            disabled={loading}
                                                        />
                                                    ) : (
                                                        <Input
                                                            id={`question-${globalIndex}`}
                                                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:border-amber-500/50 placeholder:text-white/10 hover:border-white/20 transition-all"
                                                            placeholder={`Enter ${question.toLowerCase()}`}
                                                            value={formData[question] || ''}
                                                            onChange={(e) => handleInputChange(question, e.target.value)}
                                                            disabled={loading}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {formStep === (agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3) - 1) && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                            {/* ── LinkedIn Headshot: Template Grid + Advanced Options ── */}
                                            {agentId === 'linkedin_headshot' && (
                                                <div className="space-y-6 pt-6 border-t border-white/5">
                                                    {/* Template Grid */}
                                                    <div className="space-y-3">
                                                        <Label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1">Choose a Style Template</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {[
                                                                {
                                                                    id: 'architectural-stairs',
                                                                    name: 'Architectural Stairs',
                                                                    badge: 'SaaS Founder',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no altered facial proportions, no chest hair). The subject is seated casually on modern white concrete stairs inside a minimalist architectural space. Strong rectangular sunlight from window slats creates sharp geometric highlights and soft ambient shadows across the wall and steps. Low front-left wide lifestyle angle, capturing the relaxed full-body pose, staircase depth, sunlit wall, and surrounding negative space.\n\nPose: Leaning slightly back against the wall, shoulders relaxed but upright, left arm resting confidently on the stair beside them, right arm casually placed over a bent knee; one leg bent, one extended — composed, decisive, founder-level calm.\n\nOutfit: Matte charcoal, graphite, or deep navy tailored blazer with modern minimal structure (no shine, no heavy padding), premium white or soft off-white cotton shirt (top button open, no tie), tailored dark grey or stone trousers with clean lines. Minimal black or dark brown leather loafers or sleek dress shoes. No flashy accessories. Optional understated silver or steel watch only if it feels intentional.\n\nLighting: Strong natural daylight with crisp-edged horizontal light bands; controlled contrast with soft highlight roll-off on the face; directional shadows sculpting facial structure while keeping skin tones neutral and executive-clean.\n\nEnvironment: Pale grey/white architectural wall, refined concrete stair texture, sharp minimalist geometry. A black or dark leather tech work bag placed subtly on a lower step — modern founder context without distraction.\n\nColor Palette: Cool executive neutrals — charcoal, navy, white, soft greys — restrained palette with subtle cinematic cool shadows and natural skin warmth.\n\nLens & Depth: Moderate depth of field; face, blazer fabric, and upper body razor-sharp; background stairs and wall softly fading; slight foreground stair blur adding depth and realism.\n\nMood: Visionary, intelligent, grounded authority; modern SaaS AI founder energy; minimalist editorial realism that communicates trust, scale, and long-term thinking — authentic, premium, and distinctly non-AI-looking.\n\nQuality: 8K hyper-realistic, true photographic grain, sharp eyes and skin texture, zero AI artifacts, cinematic depth of field. Square 1:1 crop.`
                                                                },
                                                                {
                                                                    id: 'forbes-cover',
                                                                    name: 'Forbes Cover',
                                                                    badge: 'Editorial',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no facial distortion, no chest hair). The subject is standing confidently in a refined executive environment designed specifically for magazine cover composition. The framing is vertical, upper-torso dominant, with generous negative space above and to one side.\n\nPose: Upright, composed stance; shoulders squared but relaxed. One hand resting naturally in the trouser pocket or lightly touching the blazer front; the other relaxed by the side. Chin level, gaze direct into the camera — calm authority, strategic confidence.\n\nOutfit: Impeccably tailored charcoal or deep navy blazer with premium matte fabric texture; crisp white or very light grey shirt (top button open, no tie). Clean, modern executive styling — no pocket square, no bold accessories. Optional minimalist luxury wristwatch only.\n\nExpression: Neutral to subtle half-smile — intelligent, measured, visionary. Not aggressive, not casual.\n\nLighting: Editorial magazine lighting. Soft directional key light sculpting the face; controlled fill to preserve detail; subtle rim light for separation. Balanced contrast suitable for print — no blown highlights, no harsh shadows.\n\nBackground: Minimalist, elegant corporate backdrop — smooth textured grey wall or soft architectural gradient. Clean, timeless, and distraction-free. Background slightly defocused to emphasize facial authority.\n\nColor Palette: Forbes-style executive neutrals — charcoal, navy, graphite, white, cool greys — with natural skin tones and restrained cinematic contrast.\n\nLens & Crop: Medium telephoto editorial portrait lens. Face and upper torso razor-sharp; background softly blurred. Framed for square 1:1 with intentional negative space.\n\nMood: Global SaaS AI leader. Visionary, composed, credible. High-end editorial realism suitable for Forbes cover, Bloomberg Businessweek, and international tech leadership profiles — timeless, powerful, and unmistakably human.`
                                                                },
                                                                {
                                                                    id: 'corporate-interior',
                                                                    name: 'Corporate Interior',
                                                                    badge: 'Executive',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no facial distortion, no chest hair). The subject is standing confidently inside a refined, modern architectural space designed for executive portraits. The background features a minimalist corporate environment with clean vertical lines, matte concrete or textured stone walls, subtle glass elements, and soft depth — elegant, global, and timeless.\n\nPose: Standing upright with relaxed confidence; shoulders open, posture straight. One hand resting naturally in the trouser pocket, the other relaxed by the side or lightly adjusting the blazer cuff — calm authority, not posed. Chin level, composed expression with subtle, intelligent confidence.\n\nOutfit: Tailored charcoal, deep navy, or graphite blazer with premium fabric texture; crisp white or very light grey shirt (top button open, no tie). Perfectly fitted trousers in a matching or slightly lighter tone. Polished black or dark brown leather dress shoes. No loud accessories. Optional minimalist executive wristwatch only.\n\nLighting: Controlled natural daylight mixed with soft studio fill. Directional key light from the side to sculpt facial structure; subtle rim light separating the subject from the background. No harsh shadows — clean, editorial, executive lighting.\n\nEnvironment: Minimalist corporate interior — neutral-toned wall, soft architectural depth, faint glass or metallic accents. No logos, no text, no distractions. Background slightly out of focus to maintain authority on the subject.\n\nColor Palette: Executive neutrals — charcoal, navy, graphite, white, cool greys — with restrained contrast and natural skin tones. Subtle cinematic cool shadows, zero saturation spikes.\n\nLens & Depth: Medium telephoto portrait lens (editorial style). Face, eyes, and blazer texture razor-sharp; background softly blurred for separation and depth. No wide-angle distortion.\n\nMood: Calm power, global SaaS leadership, strategic intelligence. Modern AI founder energy — credible, visionary, composed. True photographic realism suitable for Forbes, Bloomberg, and international business press. Clean, timeless, unmistakably human — not AI-like.\n\nQuality: 8K hyper-realistic, true photographic detail, zero AI artifacts. Square 1:1 crop.`
                                                                },
                                                                {
                                                                    id: 'rooftop-skyline',
                                                                    name: 'Rooftop Skyline',
                                                                    badge: 'Visionary',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no altered facial proportions). The subject is standing on a modern urban rooftop terrace with a blurred city skyline in the golden-hour background. [Pose: standing relaxed with slight contrapposto, arms loosely at sides or one hand in pocket, confident gaze slightly off-camera] [Outfit: tailored dark blazer, well-fitted dark trousers, open-collar shirt] [Lighting: warm golden hour sunlight from behind and to the right creating a natural rim light, soft reflector fill on the face, cinematic bokeh city lights in background] [Environment: clean rooftop parapet, defocused glass buildings and warm city glow, sky transitioning from deep blue to amber] [Mood: Ambitious, forward-thinking, entrepreneurial premium] [Quality: 8K, hyper-realistic, sharp face and eyes, cinematic golden-hour bokeh] Square 1:1 crop, head-and-shoulders framing.`
                                                                },
                                                                {
                                                                    id: 'glass-office',
                                                                    name: 'Glass Office',
                                                                    badge: 'Modern Pro',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no altered facial proportions). The subject is standing in front of a large floor-to-ceiling glass wall inside a premium modern office. Outside the glass, a soft urban skyline is visible in diffused daylight. [Pose: standing upright, slight lean against the glass wall, arms crossed loosely or one hand in pocket, confident direct gaze] [Outfit: slim-fit charcoal or midnight blue blazer, white or pale blue fitted shirt, dark dress trousers] [Lighting: soft diffused natural daylight through the glass, clean even illumination on the face, subtle fill from opposite side] [Environment: frameless glass wall, faint reflections, blurred premium city view] [Mood: Modern, sharp, globally connected executive presence] [Quality: 8K, hyper-realistic, sharp face and eyes, cinematic depth of field] Square 1:1 crop, head-and-shoulders framing.`
                                                                },
                                                                {
                                                                    id: 'library-study',
                                                                    name: 'Library Study',
                                                                    badge: 'Thought Leader',
                                                                    prompt: `A hyper-realistic, photo-realistic portrait using the uploaded face with 100% facial accuracy and crisp micro-details (no altered features, no altered facial proportions). The subject is seated in a refined private library or executive study with floor-to-ceiling bookshelves behind them, defocused to a warm bokeh. [Pose: seated upright in a premium leather or dark wood chair, leaning slightly forward with elbows resting on a desk, hands clasped, engaged and thoughtful expression] [Outfit: tailored navy or charcoal blazer, crisp white or pale shirt, no tie] [Lighting: warm directional desk lamp light from the left, soft ambient fill, window light gently rimming the shoulders] [Environment: dark wood bookshelves filled with books, warm leather textures, a clean desk surface with minimal items] [Mood: Intellectual authority, depth, credibility — professor meets CEO] [Quality: 8K, hyper-realistic, sharp face and eyes, warm cinematic tones] Square 1:1 crop, head-and-shoulders framing.`
                                                                },
                                                            ].map((template) => (
                                                                <button
                                                                    key={template.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedTemplate(selectedTemplate === template.prompt ? null : template.prompt)}
                                                                    className={`relative flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200 ${selectedTemplate === template.prompt
                                                                        ? 'border-amber-500/70 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                                                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                                                                        }`}
                                                                >
                                                                    {selectedTemplate === template.prompt && (
                                                                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500" />
                                                                    )}
                                                                    <span className="text-sm font-semibold text-white leading-tight">{template.name}</span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">{template.badge}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {selectedTemplate && (
                                                            <p className="text-[11px] text-white/30 ml-1">Template selected — goes direct to Gemini, no prompt rewriting.</p>
                                                        )}
                                                    </div>

                                                    {/* Advanced Options collapsible */}
                                                    <div className="space-y-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAdvancedOptions(v => !v)}
                                                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/8 transition-all"
                                                        >
                                                            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Advanced Options</span>
                                                            <svg
                                                                className={`h-4 w-4 text-white/40 transition-transform duration-200 ${showAdvancedOptions ? 'rotate-180' : ''}`}
                                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {showAdvancedOptions && (
                                                            <div className="grid gap-4 sm:grid-cols-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="space-y-2">
                                                                    <Label className="text-white/50 text-[10px] font-bold uppercase tracking-widest ml-1">Environment</Label>
                                                                    <Select
                                                                        value={headshotBackground}
                                                                        onValueChange={(value) => {
                                                                            setHeadshotBackground(value)
                                                                            handleInputChange('Background Template', value)
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl">
                                                                            <SelectValue placeholder="Background" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-xl">
                                                                            <SelectItem value="Auto (professional neutral)">System Default</SelectItem>
                                                                            <SelectItem value="Office (modern corporate workspace)">Corporate Office</SelectItem>
                                                                            <SelectItem value="Office (glass wall modern)">Modern Glass Office</SelectItem>
                                                                            <SelectItem value="Staircase (modern architectural)">Architectural Stairs</SelectItem>
                                                                            <SelectItem value="Library (modern professional)">Study/Library</SelectItem>
                                                                            <SelectItem value="Window (soft natural light)">Natural Window</SelectItem>
                                                                            <SelectItem value="Meeting room (executive boardroom)">Executive Boardroom</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-white/50 text-[10px] font-bold uppercase tracking-widest ml-1">Attire</Label>
                                                                    <Select
                                                                        value={headshotOutfit}
                                                                        onValueChange={(value) => {
                                                                            setHeadshotOutfit(value)
                                                                            handleInputChange('Clothing Template', value)
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl">
                                                                            <SelectValue placeholder="Outfit" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-xl">
                                                                            <SelectItem value="Auto (professional business wear)">Business Professional</SelectItem>
                                                                            <SelectItem value="Blazer">Modern Blazer</SelectItem>
                                                                            <SelectItem value="Suit">Executive Suit</SelectItem>
                                                                            <SelectItem value="Vest">Formal Vest</SelectItem>
                                                                            <SelectItem value="Shirt and trousers">Smart Casual Shirt</SelectItem>
                                                                            <SelectItem value="Blouse">Professional Blouse</SelectItem>
                                                                            <SelectItem value="Business casual">Relaxed Business</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Reel Script: Reference Links ── */}
                                            {agentId === 'reel_script' && (
                                                <div className="space-y-4 pt-6 border-t border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1">
                                                            Reference Links <span className="text-white/30 normal-case tracking-normal font-normal">(optional — up to 5)</span>
                                                        </Label>
                                                        {reelLinks.length < 5 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setReelLinks(prev => [...prev, { url: '', status: 'idle', content: '', error: '' }])}
                                                                className="text-[10px] text-amber-500/70 hover:text-amber-500 font-bold uppercase tracking-widest transition-colors"
                                                            >
                                                                + Add Link
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {reelLinks.map((link, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="url"
                                                                        placeholder={`https://example.com/article-${i + 1}`}
                                                                        value={link.url}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value
                                                                            setReelLinks(prev => {
                                                                                const next = [...prev]
                                                                                next[i] = { url: val, status: 'idle', content: '', error: '' }
                                                                                return next
                                                                            })
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            if (e.target.value.trim()) scrapeReelLink(i, e.target.value)
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault()
                                                                                if (link.url.trim()) scrapeReelLink(i, link.url)
                                                                            }
                                                                        }}
                                                                        disabled={loading || link.status === 'loading'}
                                                                        className={`h-11 rounded-xl bg-white/5 border text-white text-sm placeholder:text-white/20 pr-8 transition-colors ${link.status === 'ok'
                                                                            ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30'
                                                                            : link.status === 'error'
                                                                                ? 'border-red-500/50 focus-visible:ring-red-500/30'
                                                                                : 'border-white/10'
                                                                            }`}
                                                                    />
                                                                    {/* Status icon inside input */}
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                        {link.status === 'loading' && <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin" />}
                                                                        {link.status === 'ok' && (
                                                                            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                        {link.status === 'error' && (
                                                                            <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {/* Remove button */}
                                                                {reelLinks.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setReelLinks(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Error messages */}
                                                    {reelLinks.some(l => l.status === 'error') && (
                                                        <div className="space-y-1">
                                                            {reelLinks.map((l, i) => l.status === 'error' && (
                                                                <p key={i} className="text-[11px] text-red-400/80 ml-1">Link {i + 1}: {l.error}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Success summary */}
                                                    {reelLinks.some(l => l.status === 'ok') && (
                                                        <p className="text-[11px] text-emerald-500/70 ml-1">
                                                            {reelLinks.filter(l => l.status === 'ok').length} link{reelLinks.filter(l => l.status === 'ok').length > 1 ? 's' : ''} scraped — content will be included in the script.
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-white/20 ml-1">Paste a link and press Enter or click away — content is scraped automatically.</p>
                                                </div>
                                            )}

                                            {/* ── Image Generation: Canvas Dimensions ── */}
                                            {agentId === 'image_generation' && (<div className="space-y-6 pt-6 border-t border-white/5">
                                                <div className="space-y-3">
                                                    <Label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1">Canvas Dimensions</Label>
                                                    <Select
                                                        value={aspectRatio}
                                                        onValueChange={setAspectRatio}
                                                    >
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-2xl">
                                                            <SelectValue placeholder="Aspect Ratio" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-xl">
                                                            <SelectItem value="Square">Square (1:1)</SelectItem>
                                                            <SelectItem value="Portrait">Portrait (3:4)</SelectItem>
                                                            <SelectItem value="Landscape">Landscape (4:3)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            )}

                                            {agentId !== 'image_generation' && agentId !== 'linkedin_headshot' && (
                                                <div className="space-y-3 pt-4">
                                                    <Label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1" htmlFor="additional">Refinement Context (Optional)</Label>
                                                    <textarea
                                                        id="additional"
                                                        className="flex min-h-[100px] w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all placeholder:text-white/10 resize-none"
                                                        placeholder="Add any specific constraints..."
                                                        value={additionalDetails}
                                                        onChange={(e) => setAdditionalDetails(e.target.value)}
                                                        disabled={loading}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                                        {/* Exhaustion banner — shown when per-agent limit is hit */}
                                        {isExhausted && (
                                            <ExhaustedBanner message="Credits exhausted for this agent. Please upgrade your plan." />
                                        )}

                                        <div className="flex flex-col gap-3">
                                            {/* Top row of buttons */}
                                            <div className="flex gap-2 w-full max-w-sm mt-4">
                                                <Button
                                                    type="button"
                                                    className="w-full bg-warm-primary hover:bg-warm-primary/90 text-primary-foreground"
                                                    onClick={() => setResponse('')}
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                    Generate New Output
                                                </Button>
                                            </div>
                                            <div className="flex gap-3">
                                                {formStep > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setFormStep(prev => prev - 1)}
                                                        className={`h-12 border border-white/10 text-white hover:bg-white/5 rounded-xl px-4 ${formStep === (agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3) - 1) ? 'flex-1' : ''}`}
                                                        disabled={loading}
                                                    >
                                                        <ChevronLeft className="h-5 w-5 mr-2" />
                                                        Back
                                                    </Button>
                                                )}

                                                {formStep < (agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3) - 1) ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setFormStep(prev => prev + 1)}
                                                        className="flex-1 h-12 bg-white/10 text-white hover:bg-white/20 font-bold rounded-xl"
                                                        disabled={loading}
                                                    >
                                                        Continue
                                                        <ChevronRight className="h-5 w-5 ml-2" />
                                                    </Button>
                                                ) : (
                                                    isPremium && agentId !== 'linkedin_headshot' && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={handleOptimizePrompts}
                                                            disabled={loading || isOptimizingPrompt || isExhausted}
                                                            className="flex-1 h-12 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-xl px-4 flex items-center justify-center gap-2"
                                                        >
                                                            {isOptimizingPrompt ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="h-4 w-4" />
                                                            )}
                                                            <span className="text-[10px] uppercase tracking-widest font-black">Optimize</span>
                                                        </Button>
                                                    )
                                                )}
                                            </div>

                                            {/* Final Run button row (only on last step) */}
                                            {formStep === (agentId === 'linkedin_headshot' ? 2 : Math.ceil(agent.questions.length / 3) - 1) && (
                                                <Button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    className="w-full h-12 bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 border border-amber-400/20 group relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                                    disabled={loading || isExhausted}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            <span className="text-sm">Synthesizing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                                            <span className="text-[10px] whitespace-nowrap uppercase tracking-widest font-bold">
                                                                {agentId === 'deep_research' ? 'Run Deep Research' : 'Ignite Intelligence'}
                                                            </span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {response && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full flex items-center justify-center gap-2"
                                                    onClick={(e) => handleSubmit(e, true)}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                                    Regenerate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </ParticleCard>
                </div>

                <div className="lg:col-span-12 xl:col-span-7 h-full">
                    <ParticleCard
                        className="w-full border-white/10 bg-[#030303] overflow-hidden shadow-2xl !aspect-auto h-[850px] magic-bento-card--static-glow flex flex-col"
                        particleCount={0}
                        glowColor="245, 158, 11"
                        enableTilt={false}
                    >
                        <div className="p-6 sm:p-10 flex flex-col h-full flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                        <FileText className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">AI Artifact</h2>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">Generated Output</p>
                                    </div>
                                </div>

                                {response && !error && (
                                    <div className="flex items-center gap-3 no-print flex-wrap sm:flex-nowrap">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFullscreenOutput(true)}
                                            className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/20 h-10 px-4 font-bold transition-all flex items-center gap-2 group"
                                        >
                                            <Maximize2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                                            <span className="text-[10px] uppercase tracking-widest">Full View</span>
                                        </Button>

                                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1" />

                                        {agentId === 'ad_copy' ? (
                                            <div className="flex items-center gap-3">
                                                {metaCsv && (
                                                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mr-1">
                                                        <button
                                                            onClick={() => setActiveTab('standard')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'standard' ? 'bg-amber-500 text-black' : 'text-white/40 hover:text-white'}`}
                                                        >
                                                            Standard
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveTab('meta')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'meta' ? 'bg-amber-500 text-black' : 'text-white/40 hover:text-white'}`}
                                                        >
                                                            Meta Ads
                                                        </button>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const suffix = activeTab === 'meta' ? '-meta-template' : '-standard'
                                                        setCustomFilename(`${agentId}-report${suffix}`)
                                                        setDownloadFormat('csv')
                                                        setShowRenameDialog(true)
                                                    }}
                                                    className="bg-amber-500 text-black hover:bg-amber-400 hover:text-black rounded-xl h-10 px-6 font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span className="text-[10px] uppercase tracking-widest">
                                                        {activeTab === 'meta' ? 'Download Meta Bulk CSV' : 'Download Standard CSV'}
                                                    </span>
                                                </Button>
                                            </div>
                                        ) : agentId === 'image_generation' || agentId === 'linkedin_headshot' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setCustomFilename(`${agentId}-image`)
                                                    setDownloadFormat('image')
                                                    setShowRenameDialog(true)
                                                }}
                                                className="bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 h-10 px-4 transition-all flex items-center gap-2"
                                            >
                                                <Download className="h-4 w-4" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold">Export Artifact</span>
                                            </Button>
                                        ) : (
                                            <div className="flex items-center h-10 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={copyToClipboard}
                                                    className="text-white/40 hover:text-white hover:bg-white/10 px-4 h-full border-r border-white/5 rounded-none transition-all flex items-center gap-2"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Copy</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCustomFilename(`${agentId}-report`)
                                                        setDownloadFormat('md')
                                                        setShowRenameDialog(true)
                                                    }}
                                                    className="text-white/40 hover:text-white hover:bg-white/10 px-4 h-full border-r border-white/5 rounded-none transition-all flex items-center gap-2"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">MD</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCustomFilename(`${agentId}-report`)
                                                        setDownloadFormat('pdf')
                                                        setShowRenameDialog(true)
                                                    }}
                                                    className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-5 h-full rounded-none font-black transition-all flex items-center gap-2"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">PDF</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-h-0">
                                {error ? (
                                    <div className="h-full flex flex-col items-center justify-center p-10 bg-red-500/5 border border-red-500/10 rounded-3xl text-center">
                                        <XCircle className="h-16 w-16 text-red-500/40 mb-6" />
                                        <h3 className="text-xl font-bold text-white mb-2">Architectural Fault</h3>
                                        <p className="text-sm text-red-400/70 max-w-sm leading-relaxed">{error}</p>
                                        <Button onClick={() => setError('')} className="mt-8 bg-white/10 hover:bg-white/20 text-white rounded-xl px-6">
                                            Acknowledge & Retry
                                        </Button>
                                    </div>
                                ) : response ? (
                                    <div className="h-full flex flex-col min-h-0">
                                        <ScrollArea id="report-content" className="flex-1 rounded-3xl border border-white/5 bg-white/[0.01] p-6 sm:p-10">
                                            {isImageAgent && renderedImage ? (
                                                <div className="flex justify-center h-full items-center py-10">
                                                    <div className="relative group">
                                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                        <img
                                                            src={renderedImage}
                                                            alt="Generated Asset"
                                                            className="relative max-w-full rounded-2xl shadow-2xl border border-white/10"
                                                        />
                                                    </div>
                                                </div>
                                            ) : agentId === 'ad_copy' ? (
                                                <CSVTable csvData={activeTab === 'meta' && metaCsv ? metaCsv : response} />
                                            ) : agentId === 'deep_research' && response.startsWith('DEEP_RESEARCH_JSON:') ? (
                                                <DeepResearchRenderer rawResponse={response} />
                                            ) : agentId === 'reel_script' ? (
                                                <ReelScriptRenderer raw={response} />
                                            ) : (
                                                <div className="markdown-container prose prose-invert prose-amber max-w-none 
                                                    prose-h1:text-3xl prose-h1:font-black prose-h1:text-white prose-h1:mb-10 prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-6
                                                    prose-h2:text-2xl prose-h2:font-bold prose-h2:text-amber-500 prose-h2:mt-16 prose-h2:mb-6
                                                    prose-h3:text-xl prose-h3:font-bold prose-h3:text-white/90 prose-h3:mt-12
                                                    prose-p:text-white/60 prose-p:leading-8 prose-p:text-[15px] prose-p:mb-6
                                                    prose-li:text-white/60 prose-li:mb-4 prose-li:leading-7
                                                    prose-strong:text-white prose-strong:font-bold
                                                    prose-code:bg-white/5 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-amber-400
                                                ">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {response}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center bg-white/[0.01] border border-white/5 rounded-3xl px-10 py-20">
                                        <div className="relative mb-10">
                                            <div className="absolute inset-0 bg-amber-500/10 blur-[100px] rounded-full" />
                                            <div className="relative h-24 w-24 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center shadow-inner">
                                                <Sparkles className="h-12 w-12 text-amber-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-4">Awaiting Parameters</h3>
                                        <p className="text-white/30 text-base max-w-sm mx-auto leading-relaxed">Fill out the project specifications on the left to activate the AI agent and generate deep intelligence.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ParticleCard>
                </div>
            </div >

            {isChatEnabled && response && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <Card className="border-white/10 bg-[#030303] overflow-hidden !aspect-auto !min-h-0 shadow-2xl rounded-3xl">
                        <CardHeader className="pb-6 px-6 sm:px-10 border-b border-white/5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                        <MessageCircle className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-white">Refinement Oracle</CardTitle>
                                        <CardDescription className="text-white/40 font-medium">Chat directly with the agent to fine-tune your report</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowChat(!showChat)}
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 h-12 font-bold"
                                >
                                    {showChat ? 'Minimize Interface' : 'Open Conversation'}
                                </Button>
                            </div>
                        </CardHeader>
                        {showChat && (
                            <>
                                <CardContent className="p-6 sm:p-10">
                                    <div className="space-y-8">
                                        <ScrollArea className="rounded-3xl p-6 h-[500px] bg-white/[0.01] border border-white/5">
                                            {chatMessages.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-[400px] text-white/20 text-center px-10">
                                                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                                        <MessageCircle className="h-8 w-8 opacity-20" />
                                                    </div>
                                                    <p className="max-w-xs text-sm leading-relaxed">Ask clarifying questions, request deeper analysis on specific sections, or ask the AI to re-write parts of the report.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-8 pb-4">
                                                    {chatMessages.map((msg, idx) => (
                                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-6 py-4 shadow-xl ${msg.role === 'user' ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                                                                {msg.role === 'assistant' ? (
                                                                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/70">
                                                                        <ReactMarkdown
                                                                            remarkPlugins={[remarkGfm]}
                                                                            components={{
                                                                                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline" />
                                                                            }}
                                                                        >
                                                                            {msg.content}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {chatLoading && (
                                                        <div className="flex justify-start">
                                                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                                                                <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                                                                <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Synthesizing Thought</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 sm:p-10 border-t border-white/5 bg-white/[0.02]">
                                    <form onSubmit={handleChatSubmit} className="flex gap-4 w-full">
                                        <Input
                                            placeholder="Provide feedback or ask a follow-up question..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            disabled={chatLoading}
                                            className="h-16 bg-[#0a0a0a] border-white/10 text-white rounded-2xl focus:border-amber-500/50 px-6 text-base"
                                        />
                                        <Button type="submit" disabled={chatLoading || !chatInput.trim()} className="h-16 w-16 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 p-0 flex items-center justify-center shrink-0">
                                            <Send className="h-8 w-8" />
                                        </Button>
                                    </form>
                                </CardFooter>
                            </>
                        )}
                    </Card>
                </div>
            )
            }

            {
                !response && !['deep_research', 'ad_copy', 'image_generation', 'linkedin_headshot', 'course_generator', 'book_writing'].includes(agentId) && (
                    <div className="pt-20 border-t border-white/5">
                        <Footer />
                    </div>
                )
            }

            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Secure Export</DialogTitle>
                        <DialogDescription className="text-white/40">Provide a professional name for your generated {downloadFormat?.toUpperCase()} artifact.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Label htmlFor="filename" className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1 mb-2 block">Filename</Label>
                        <Input
                            id="filename"
                            value={customFilename}
                            onChange={(e) => setCustomFilename(e.target.value)}
                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:border-amber-500/50"
                        />
                    </div>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowRenameDialog(false)} className="text-white/40 hover:text-white rounded-xl">Cancel</Button>
                        <Button onClick={() => {
                            if (downloadFormat === 'pdf') downloadAsPDF(customFilename)
                            else if (downloadFormat === 'md') downloadAsMarkdown(customFilename)
                            else if (downloadFormat === 'csv') downloadAsCSV(customFilename)
                            else if (downloadFormat === 'image') downloadImage(customFilename)
                            setShowRenameDialog(false)
                        }} className="bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl px-8">Download</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showFullscreenOutput} onOpenChange={setShowFullscreenOutput}>
                <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] bg-[#030303] border-white/10 text-white rounded-3xl flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-white/5">
                        <DialogTitle className="text-2xl font-bold">AI Artifact Full View</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden p-6 sm:p-10">
                        <ScrollArea className="h-full">
                            {isImageAgent && renderedImage ? (
                                <div className="flex justify-center h-full items-center">
                                    <img src={renderedImage} alt="Generated Asset" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
                                </div>
                            ) : agentId === 'ad_copy' ? (
                                <CSVTable csvData={response} />
                            ) : agentId === 'deep_research' && response.startsWith('DEEP_RESEARCH_JSON:') ? (
                                <DeepResearchRenderer rawResponse={response} />
                            ) : agentId === 'reel_script' ? (
                                <ReelScriptRenderer raw={response} />
                            ) : (
                                <div className="markdown-container prose prose-invert prose-amber max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline" />
                                        }}
                                    >
                                        {response}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}

export default function AgentPage() {
    return (
        <ErrorBoundary>
            <AgentPageContent />
        </ErrorBoundary>
    )
}
