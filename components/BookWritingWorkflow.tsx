'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/types/errors'
import { Sparkles, BookOpen, CheckCircle2, RotateCcw, Loader2, ChevronRight, ArrowLeft, Download, Copy, FileText, MessageCircle, Send, Pencil } from 'lucide-react'
import KindleBookReader from '@/components/KindleBookReader'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AgentSessionHistory } from '@/components/agent-session-history'
import { History, LayoutTemplate, BookText } from 'lucide-react'
import FlipBookViewer from '@/components/FlipBookViewer'
import { AgentSession } from '@/types'

/* ─── Types ─── */
interface Book {
    title: string
    author: string
    description: string
    themes: string[]
    chapters: string[]
    amazonLink?: string
}

interface ChapterOutline {
    number: number
    title: string
    description: string
    keyPoints: string[]
}

interface Outline {
    bookTitle: string
    bookSubtitle: string
    introduction: string
    chapters: ChapterOutline[]
}

type Phase = 'input' | 'researching' | 'outline' | 'writing' | 'complete'

/* ─── Phase labels for the progress indicator ─── */
const PHASE_LABELS: Record<Phase, string> = {
    input: 'Enter Topic',
    researching: 'Researching',
    outline: 'Review Outline',
    writing: 'Writing Chapters',
    complete: 'Complete',
}

export default function BookWritingWorkflow({ onCreditDeduct }: { onCreditDeduct?: () => void }) {
    const [topic, setTopic] = useState('')
    const [phase, setPhase] = useState<Phase>('input')
    const [researchStatus, setResearchStatus] = useState('')
    const [books, setBooks] = useState<Book[]>([])
    const [outline, setOutline] = useState<Outline | null>(null)
    const [researchSummary, setResearchSummary] = useState('')

    // Chapter writing state
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0)
    const [generatedChapters, setGeneratedChapters] = useState<string[]>([])
    const [approvedChapters, setApprovedChapters] = useState<boolean[]>([])
    const [currentChapterContent, setCurrentChapterContent] = useState('')
    const [isGeneratingChapter, setIsGeneratingChapter] = useState(false)
    const [mergedBook, setMergedBook] = useState('')
    const [pdfFilename, setPdfFilename] = useState('')
    const [viewMode, setViewMode] = useState<'reader' | '3d'>('reader')

    // Session History State
    const [showHistory, setShowHistory] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [sessionKey, setSessionKey] = useState(0)
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [showChat, setShowChat] = useState(false)

    const saveBookSession = async (
        finalBook: string,
        bookOutline: Outline,
        messages?: Array<{ role: 'user' | 'assistant'; content: string }>
    ) => {
        try {
            const res = await fetch('/api/agents/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_type: 'book_writing',
                    form_data: {
                        'Book Topic': topic,
                        outline: bookOutline
                    },
                    response: finalBook,
                    refined_prompt: bookOutline.bookTitle,
                    chat_messages: messages || chatMessages,
                }),
            })

            const data = await res.json()
            if (res.ok && data.data) {
                setCurrentSessionId(data.data.id)
                setSessionKey(prev => prev + 1)
            }
        } catch (error) {
            console.error('Failed to save session:', error)
        }
    }

    const handleSessionRestore = (session: AgentSession) => {
        setPhase('complete')
        setTopic(session.form_data?.['Book Topic'] || '')
        setOutline(session.form_data?.outline || null)
        setMergedBook(session.response || '')
        setChatMessages(session.chat_messages || [])
        setShowChat(Boolean(session.chat_messages && session.chat_messages.length > 0))
        setCurrentSessionId(session.id)
        setShowHistory(false)
        setPdfFilename(session.form_data?.outline?.bookTitle || session.refined_prompt || '')
        toast.success('Book restored from history')
    }

    /* ────────────────────────────────────────────
       PHASE 1 — Research
    ──────────────────────────────────────────── */
    const handleResearch = async () => {
        if (!topic.trim()) {
            toast.error('Please enter a book topic first')
            return
        }
        setChatMessages([])
        setShowChat(false)
        setCurrentSessionId(null)
        setPhase('researching')
        setResearchStatus('🔍 Searching the web for top books on this topic...')
        try {
            const res = await fetch('/api/agents/book-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.trim() })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Research failed' }))
                throw new Error(err.error || 'Research request failed')
            }
            setResearchStatus('📚 Analyzing book summaries and chapter structures...')
            const data = await res.json()
            setResearchStatus('🧠 Architecting your 10-chapter outline...')
            await new Promise(r => setTimeout(r, 600))
            setBooks(data.books || [])
            setOutline(data.outline || null)
            setResearchSummary(data.researchSummary || '')
            if (data.outline?.bookTitle) {
                setPdfFilename(data.outline.bookTitle)
            }
            setPhase('outline')
        } catch (err) {
            toast.error(getErrorMessage(err))
            setPhase('input')
        }
    }

    /* ────────────────────────────────────────────
       PHASE 2 — Generate a chapter
    ──────────────────────────────────────────── */
    const handleGenerateChapter = async (chapterIdx: number, forceRefresh = false) => {
        if (!outline) return
        setIsGeneratingChapter(true)
        setCurrentChapterContent('')

        const chapter = outline.chapters[chapterIdx]
        const previousChapterTitles = outline.chapters
            .slice(0, chapterIdx)
            .map(c => c.title)

        try {
            const res = await fetch('/api/agents/book-chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    bookTitle: outline.bookTitle,
                    bookSubtitle: outline.bookSubtitle,
                    researchSummary,
                    chapterNumber: chapter.number,
                    totalChapters: outline.chapters.length,
                    chapterTitle: chapter.title,
                    chapterDescription: chapter.description,
                    keyPoints: chapter.keyPoints,
                    previousChapterTitles,
                    forceRefresh
                })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Chapter generation failed' }))
                throw new Error(err.error || 'Chapter generation failed')
            }

            const data = await res.json()
            setCurrentChapterContent(data.chapterContent || '')
        } catch (err) {
            toast.error(getErrorMessage(err))
        } finally {
            setIsGeneratingChapter(false)
        }
    }

    /* ────────────────────────────────────────────
       Start writing (first chapter)
    ──────────────────────────────────────────── */
    const handleStartWriting = async () => {
        setPhase('writing')
        setCurrentChapterIdx(0)
        setGeneratedChapters([])
        setApprovedChapters([])
        await handleGenerateChapter(0)

        // Deduct credit once at this point
        try {
            await fetch('/api/credits/usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_type: 'book_writing' })
            })
            onCreditDeduct?.()
        } catch { /* non-critical */ }
    }

    /* Approve current chapter → proceed to next */
    const handleApproveChapter = async () => {
        if (!outline) return
        const newGenerated = [...generatedChapters]
        newGenerated[currentChapterIdx] = currentChapterContent
        setGeneratedChapters(newGenerated)

        const newApproved = [...approvedChapters]
        newApproved[currentChapterIdx] = true
        setApprovedChapters(newApproved)

        const nextIdx = currentChapterIdx + 1

        if (nextIdx >= outline.chapters.length) {
            // All chapters done — merge book
            const intro = `# ${outline.bookTitle}\n## ${outline.bookSubtitle}\n\n*${outline.introduction}*\n\n---\n\n`
            const fullBook = intro + newGenerated.join('\n\n---\n\n')
            setMergedBook(fullBook)
            setPhase('complete')
            toast.success('🎉 Your 50-page book is complete!')
            await saveBookSession(fullBook, outline)
        } else {
            setCurrentChapterIdx(nextIdx)
            await handleGenerateChapter(nextIdx)
        }
    }

    /* Regenerate current chapter */
    const handleRegenerateChapter = async () => {
        await handleGenerateChapter(currentChapterIdx, true)
    }

    /* ────────────────────────────────────────────
       Download helpers
    ──────────────────────────────────────────── */
    const downloadMarkdown = () => {
        const el = document.createElement('a')
        el.href = URL.createObjectURL(new Blob([mergedBook], { type: 'text/markdown' }))
        el.download = `${pdfFilename || outline?.bookTitle || 'book'}.md`
        el.click()
    }

    const copyAll = () => {
        navigator.clipboard.writeText(mergedBook)
        toast.success('Book copied to clipboard')
    }

    const downloadAsPDF = () => {
        if (!mergedBook || !outline) return

        const mdToHtml = (md: string): string => {
            const sections = md.split(/\n---+\n/)
            return sections.map((section, i) => {
                const html = section
                    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
                    .split(/\n\n+/)
                    .map(block => {
                        const trimmed = block.trim()
                        if (!trimmed) return ''
                        if (trimmed.startsWith('<')) return trimmed
                        return `<p>${trimmed.replace(/\n/g, ' ')}</p>`
                    })
                    .filter(Boolean)
                    .join('\n')
                return i === 0 ? html : `<div class="chapter-break">${html}</div>`
            }).join('\n')
        }

        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pdfFilename || outline.bookTitle}</title>
  <style>
    @page { margin: 20mm 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      font-size: 12pt;
      line-height: 1.9;
      max-width: 700px;
      margin: 0 auto;
      padding: 0 20px;
    }
    h1 {
      font-size: 26pt;
      font-weight: 800;
      text-align: center;
      color: #111;
      margin: 48px 0 12px;
      line-height: 1.25;
      page-break-after: avoid;
    }
    h2 {
      font-size: 15pt;
      font-weight: 700;
      color: #2d0a6a;
      margin-top: 36px;
      margin-bottom: 10px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #3d0e8a;
      margin-top: 22px;
      margin-bottom: 7px;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 13px;
      line-height: 1.9;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }
    li {
      margin-bottom: 7px;
      line-height: 1.8;
    }
    ul, ol { padding-left: 24px; margin-bottom: 14px; }
    strong { font-weight: bold; color: #111; }
    em { font-style: italic; }
    .chapter-break {
      page-break-before: always;
      padding-top: 24px;
    }
    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
${mdToHtml(mergedBook)}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
</script>
</body>
</html>`

        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        if (!win) {
            toast.error('Popup blocked — please allow popups and try again')
        } else {
            toast.success('Print dialog will open — choose "Save as PDF" to download')
            setTimeout(() => URL.revokeObjectURL(url), 10000)
        }
    }


    /* ────────────────────────────────────────────
       RENDER
    ──────────────────────────────────────────── */

    const updateSessionChat = async (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
        if (!currentSessionId) return
        try {
            await fetch(`/api/agents/sessions/${currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_messages: messages }),
            })
        } catch (error) {
            console.error('Failed to update book chat session:', error)
        }
    }

    const handleBookChatSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!chatInput.trim() || !mergedBook) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setShowChat(true)

        const nextMessages = [...chatMessages, { role: 'user' as const, content: userMessage }]
        setChatMessages(nextMessages)
        setChatLoading(true)

        try {
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages,
                    agent_type: 'book_writing',
                    initialContext: mergedBook,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to get chat response')

            const updatedMessages = [...nextMessages, { role: 'assistant' as const, content: data.response }]
            setChatMessages(updatedMessages)

            if (currentSessionId) {
                await updateSessionChat(updatedMessages)
            } else if (outline) {
                await saveBookSession(mergedBook, outline, updatedMessages)
            }
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setChatLoading(false)
        }
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-4">
                    <Link href="/agents">
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 -ml-3 rounded-lg px-3 w-fit">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight text-white">Book Writing Agent</h1>
                        <p className="text-white/40 text-sm mt-2 max-w-xl">Researches the top books on any topic and writes a complete, original 50-page book — one chapter at a time with your approval.</p>
                    </div>
                </div>
                <div className="flex items-center shrink-0">
                    <Button
                        onClick={() => setShowHistory(!showHistory)}
                        className="h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl px-6 font-medium transition-all"
                    >
                        <History className="h-4 w-4 mr-2" />
                        {showHistory ? 'Close History' : 'Session History'}
                    </Button>
                </div>
            </div>

            {showHistory && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <AgentSessionHistory
                        key={sessionKey}
                        agentType="book_writing"
                        onSessionRestore={handleSessionRestore}
                        currentSessionId={currentSessionId}
                        refreshKey={sessionKey}
                    />
                </div>
            )}

            {/* Phase Progress Indicator */}
            <div className="flex items-center gap-2 flex-wrap">
                {(['input', 'researching', 'outline', 'writing', 'complete'] as Phase[]).map((p, i) => {
                    const phases: Phase[] = ['input', 'researching', 'outline', 'writing', 'complete']
                    const phaseIdx = phases.indexOf(phase)
                    const thisIdx = phases.indexOf(p)
                    const isDone = thisIdx < phaseIdx
                    const isActive = p === phase
                    return (
                        <div key={p} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : isDone ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                {isDone ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                                {PHASE_LABELS[p]}
                            </div>
                            {i < 4 && <ChevronRight className="h-3 w-3 text-white/20" />}
                        </div>
                    )
                })}
            </div>

            {/* ── PHASE: INPUT ── */}
            {phase === 'input' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <BookOpen className="h-7 w-7 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">What should your book be about?</h2>
                                <p className="text-white/40 text-sm mt-1">We&apos;ll research the best books on this topic and write an original 50-page book.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-white/60 text-xs font-bold uppercase tracking-widest block">Book Topic</label>
                            <Input
                                placeholder="e.g. Machine Learning, Stoic Philosophy, Personal Finance..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:border-amber-500/50 placeholder:text-white/20 text-base"
                            />
                        </div>
                        <Button
                            onClick={handleResearch}
                            disabled={!topic.trim()}
                            className="w-full h-14 bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all"
                        >
                            <Sparkles className="h-5 w-5 mr-2" />
                            Begin Research & Outline
                        </Button>
                    </div>
                </div>
            )}

            {/* ── PHASE: RESEARCHING ── */}
            {phase === 'researching' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-16 flex flex-col items-center gap-8 text-center">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center">
                                <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                            </div>
                            <div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">Researching &ldquo;{topic}&rdquo;</h2>
                            <p className="text-amber-400 text-sm font-medium animate-pulse">{researchStatus}</p>
                        </div>
                        <div className="space-y-2 w-full max-w-sm">
                            {['Searching Amazon & web for top books', 'Fetching summaries & chapters', 'Architecting your 10-chapter outline'].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-left text-xs text-white/40">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500/50 shrink-0" />
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── PHASE: OUTLINE ── */}
            {phase === 'outline' && outline && (
                <div className="space-y-8">
                    {/* Editable Book Title & Subtitle */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 text-center space-y-6">
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="relative group">
                                <label className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                    <Pencil className="h-3 w-3" /> Book Title (Editable)
                                </label>
                                <Input
                                    value={outline.bookTitle}
                                    onChange={(e) => {
                                        setOutline({ ...outline, bookTitle: e.target.value })
                                        setPdfFilename(e.target.value)
                                    }}
                                    className="text-3xl sm:text-4xl font-black text-white bg-white/5 border-white/10 text-center h-16 sm:h-20 rounded-2xl focus:border-amber-500/50"
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                    <Pencil className="h-3 w-3" /> Subtitle (Editable)
                                </label>
                                <Input
                                    value={outline.bookSubtitle}
                                    onChange={(e) => setOutline({ ...outline, bookSubtitle: e.target.value })}
                                    className="text-white/70 text-lg bg-white/5 border-white/10 text-center h-12 sm:h-14 rounded-xl focus:border-amber-500/50"
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                    <Pencil className="h-3 w-3" /> Introduction (Editable)
                                </label>
                                <textarea
                                    value={outline.introduction}
                                    onChange={(e) => setOutline({ ...outline, introduction: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 text-white/40 text-sm p-4 rounded-xl focus:border-amber-500/50 focus:outline-none min-h-[100px] transition-all text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Top 10 Books Grid */}
                    <div>
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">📚 Based on Research from {books.length} Top Books</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {books.slice(0, 10).map((book, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-4 space-y-2 hover:border-amber-500/20 transition-all">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                                        <span className="text-amber-500 text-xs font-black">#{i + 1}</span>
                                    </div>
                                    <p className="text-white text-xs font-bold leading-tight">{book.title}</p>
                                    <p className="text-white/40 text-[10px] font-medium">{book.author}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chapter Outline */}
                    <div>
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">📖 10-Chapter Outline (50 Pages)</h3>
                        <div className="space-y-4">
                            {outline.chapters.map((ch, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-amber-500/20 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                        <span className="text-white/60 text-xs font-black">{ch.number}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3 w-full">
                                        <div className="flex items-center gap-2">
                                            <Pencil className="h-3 w-3 text-amber-500/40" />
                                            <Input
                                                value={ch.title}
                                                onChange={(e) => {
                                                    const newChapters = [...outline.chapters]
                                                    newChapters[i] = { ...ch, title: e.target.value }
                                                    setOutline({ ...outline, chapters: newChapters })
                                                }}
                                                className="bg-white/5 border-white/10 text-white font-bold h-10 px-4 rounded-xl focus:border-amber-500/50"
                                            />
                                        </div>
                                        <textarea
                                            value={ch.description}
                                            onChange={(e) => {
                                                const newChapters = [...outline.chapters]
                                                newChapters[i] = { ...ch, description: e.target.value }
                                                setOutline({ ...outline, chapters: newChapters })
                                            }}
                                            className="w-full bg-white/[0.01] border border-white/5 text-white/40 text-xs p-3 rounded-xl focus:border-amber-500/50 focus:outline-none min-h-[60px] resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleStartWriting}
                        className="w-full h-14 bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Start Writing — Chapter 1 of {outline.chapters.length}
                    </Button>
                    <p className="text-white/20 text-xs text-center -mt-4">This uses 1 credit for the complete 50-page book</p>
                </div>
            )}

            {/* ── PHASE: WRITING ── */}
            {phase === 'writing' && outline && (
                <div className="grid gap-8 lg:grid-cols-12">

                    {/* Left: Chapter progress sidebar */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-3 sticky top-6">
                            <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">Chapter Progress</h3>
                            {outline.chapters.map((ch, i) => {
                                const isApproved = approvedChapters[i]
                                const isCurrent = i === currentChapterIdx && !isApproved
                                return (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? 'bg-amber-500/10 border border-amber-500/20' : isApproved ? 'bg-green-500/5 border border-green-500/20' : 'border border-transparent'}`}>
                                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isApproved ? 'bg-green-500/20' : isCurrent ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                                            {isApproved ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : isCurrent ? <Loader2 className={`h-4 w-4 text-amber-500 ${isGeneratingChapter ? 'animate-spin' : ''}`} /> : <span className="text-white/20 text-[10px] font-bold">{i + 1}</span>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[10px] font-bold truncate ${isApproved ? 'text-green-400' : isCurrent ? 'text-amber-400' : 'text-white/20'}`}>
                                                Ch. {i + 1}
                                            </p>
                                            <p className={`text-[9px] truncate ${isApproved ? 'text-green-400/60' : isCurrent ? 'text-amber-400/60' : 'text-white/10'}`}>{ch.title}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: Current chapter preview */}
                    <div className="lg:col-span-9 space-y-6">
                        {outline.chapters[currentChapterIdx] && (
                            <div className="bg-white/[0.02] border border-amber-500/20 rounded-3xl overflow-hidden">
                                {/* Chapter header */}
                                <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Chapter {outline.chapters[currentChapterIdx].number} of {outline.chapters.length}</p>
                                        <h3 className="text-white font-bold text-lg mt-0.5">{outline.chapters[currentChapterIdx].title}</h3>
                                    </div>
                                    {isGeneratingChapter && (
                                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Writing...
                                        </div>
                                    )}
                                </div>

                                {/* Chapter content */}
                                <div className="p-8">
                                    {isGeneratingChapter ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                                            <div className="relative">
                                                <div className="h-20 w-20 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center">
                                                    <Sparkles className="h-10 w-10 text-amber-500 animate-pulse" />
                                                </div>
                                                <div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-full" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-white font-bold">Writing Chapter {outline.chapters[currentChapterIdx].number}...</p>
                                                <p className="text-white/40 text-sm">Generating ~2,500 words of rich content</p>
                                            </div>
                                        </div>
                                    ) : currentChapterContent ? (
                                        <ScrollArea className="h-[480px]">
                                            <div className="prose prose-invert prose-amber max-w-none
                                                prose-h2:text-2xl prose-h2:font-bold prose-h2:text-amber-500 prose-h2:mt-10 prose-h2:mb-4
                                                prose-h3:text-lg prose-h3:font-bold prose-h3:text-white/90 prose-h3:mt-8
                                                prose-p:text-white/70 prose-p:leading-8 prose-p:text-[15px] prose-p:mb-5
                                                prose-strong:text-white
                                            ">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentChapterContent}</ReactMarkdown>
                                            </div>
                                        </ScrollArea>
                                    ) : null}
                                </div>

                                {/* Approval bar */}
                                {!isGeneratingChapter && currentChapterContent && (
                                    <div className="px-8 py-6 border-t border-white/5 flex items-center gap-4 bg-white/[0.02]">
                                        <Button
                                            onClick={handleApproveChapter}
                                            className="flex-1 h-12 bg-green-500 text-black hover:bg-green-400 font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                            {currentChapterIdx === outline.chapters.length - 1
                                                ? '✅ Approve & Complete Book'
                                                : `✅ Looks Good — Write Chapter ${currentChapterIdx + 2}`}
                                        </Button>
                                        <Button
                                            onClick={handleRegenerateChapter}
                                            variant="outline"
                                            className="h-12 px-6 border-white/10 text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Regenerate
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PHASE: COMPLETE ── */}
            {phase === 'complete' && outline && mergedBook && (
                <div className="space-y-8">
                    {/* Success Banner */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-green-500/10 border border-amber-500/30 rounded-3xl p-8 text-center space-y-4">
                        <div className="text-5xl">🎉</div>
                        <h2 className="text-3xl font-black text-white">{outline.bookTitle}</h2>
                        <p className="text-white/50 text-lg">{outline.bookSubtitle}</p>
                        <div className="flex items-center justify-center gap-6 text-xs text-white/40 font-bold uppercase tracking-widest">
                            <span>10 Chapters</span>
                            <span>·</span>
                            <span>~50 Pages</span>
                            <span>·</span>
                            <span>~25,000 Words</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <div className="flex items-center gap-2">
                            <Input
                                value={pdfFilename}
                                onChange={(e) => setPdfFilename(e.target.value)}
                                placeholder="PDF File Name"
                                className="h-12 w-64 bg-white/5 border-white/10 text-white rounded-xl focus:border-amber-500/50"
                            />
                            <Button
                                onClick={downloadAsPDF}
                                className="h-12 bg-amber-500 text-black hover:bg-amber-400 font-bold rounded-xl px-8 flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                        <Button onClick={downloadMarkdown} variant="outline" className="h-12 border-white/10 text-white hover:bg-white/5 rounded-xl px-8 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Download Markdown
                        </Button>
                        <Button onClick={copyAll} variant="outline" className="h-12 border-white/10 text-white hover:bg-white/5 rounded-xl px-8 flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            Copy All
                        </Button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex justify-center mt-4">
                        <div className="bg-white/[0.02] border border-white/10 p-1 rounded-2xl flex items-center gap-1">
                            <Button
                                onClick={() => setViewMode('reader')}
                                variant="ghost"
                                className={`rounded-xl h-10 px-6 font-bold flex items-center gap-2 transition-all ${viewMode === 'reader' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                Reader View
                            </Button>
                            <Button
                                onClick={() => setViewMode('3d')}
                                variant="ghost"
                                className={`rounded-xl h-10 px-6 font-bold flex items-center gap-2 transition-all ${viewMode === '3d' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <BookText className="h-4 w-4" />
                                3D Flipbook
                            </Button>
                        </div>
                    </div>

                    {/* Full Book Reader */}
                    {viewMode === 'reader' ? (
                        <div className="w-full min-h-[700px] rounded-3xl overflow-hidden bg-white/[0.02] border border-white/10 animate-in fade-in zoom-in-95 duration-500">
                            <KindleBookReader content={mergedBook} />
                        </div>
                    ) : (
                        <div className="w-full min-h-[700px] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                            <FlipBookViewer
                                content={mergedBook}
                                title={outline.bookTitle}
                                subtitle={outline.bookSubtitle}
                            />
                        </div>
                    )}

                    <div className="border border-white/10 bg-[#030303] rounded-3xl overflow-hidden">
                        <div className="px-6 sm:px-8 py-6 border-b border-white/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Refinement Oracle</h3>
                                    <p className="text-white/40 text-sm">Chat directly with the agent to fine-tune your report</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowChat(prev => !prev)}
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                            >
                                {showChat ? 'Minimize Interface' : 'Open Conversation'}
                            </Button>
                        </div>

                        {showChat && (
                            <div className="p-6 sm:p-8 space-y-4">
                                <ScrollArea className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                    {chatMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-white/40 px-6">
                                            <MessageCircle className="h-10 w-10 mb-3 text-white/25" />
                                            <p className="text-sm leading-relaxed">Ask for chapter rewrites, tone changes, structural edits, or stronger hooks.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pb-2">
                                            {chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-amber-500 text-black font-semibold' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                                                        {msg.role === 'assistant' ? (
                                                            <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/80">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {chatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Thinking
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ScrollArea>

                                <form onSubmit={handleBookChatSubmit} className="flex gap-3">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask for refinements to your book..."
                                        disabled={chatLoading}
                                        className="h-12 bg-white/5 border-white/10 text-white rounded-xl"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="h-12 w-12 p-0 rounded-xl bg-amber-500 text-black hover:bg-amber-400"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

