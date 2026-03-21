'use client'

import React, { useState, useEffect, useRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FlipBookViewerProps {
    content: string
    title: string
    subtitle: string
}

/* ── helpers ── */
function splitIntoPages(markdown: string): string[] {
    const byHr = markdown.split(/\n---+\n/).map(p => p.trim()).filter(Boolean)
    if (byHr.length > 1) {
        const subPages: string[] = []
        for (const segment of byHr) {
            const byH3 = segment.split(/(?=^### )/m).map(p => p.trim()).filter(Boolean)
            if (byH3.length > 1) {
                subPages.push(...byH3)
            } else {
                subPages.push(segment)
            }
        }
        return subPages
    }
    const byH2 = markdown.split(/(?=^## )/m).map(p => p.trim()).filter(Boolean)
    if (byH2.length > 1) {
        const subPages: string[] = []
        for (const segment of byH2) {
            const byH3 = segment.split(/(?=^### )/m).map(p => p.trim()).filter(Boolean)
            if (byH3.length > 1) {
                subPages.push(...byH3)
            } else {
                subPages.push(segment)
            }
        }
        return subPages
    }
    return [markdown]
}

// Fixed forwardRef component for the pages
const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number: number | string, isCover?: boolean }>((props, ref) => {
    return (
        <div 
            className={`flex flex-col items-center justify-between border-l border-black/10 overflow-hidden shadow-inner relative transform-gpu ${props.isCover ? 'bg-gradient-to-br from-indigo-950 via-blue-900 to-cyan-900 text-amber-50 border-none drop-shadow-2xl' : 'bg-[#fffaf0] text-[#1e293b]'}`} 
            ref={ref} 
            data-density={props.isCover ? 'hard' : 'soft'}
        >
            {/* Page content */}
            <div className={`w-full h-full flex flex-col ${props.isCover ? 'p-12 justify-center items-center text-center relative' : 'px-10 py-12 text-left'} overflow-y-auto flipbook-scroll`}>
                {props.children}
            </div>

            {/* Page Number (Not on cover) */}
            {!props.isCover && (
                <div className="absolute bottom-4 w-full text-center text-[10px] font-medium text-black/30 tracking-widest font-mono">
                    - {props.number} -
                </div>
            )}
            
            {/* Spine Shadow Gradient */}
            {!props.isCover && typeof props.number === 'number' && props.number % 2 === 0 && (
                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
            )}
            {!props.isCover && typeof props.number === 'number' && props.number % 2 !== 0 && (
                <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
            )}
            
            {/* Custom scrollbar styles for individual pages */}
            <style jsx>{`
                .flipbook-scroll::-webkit-scrollbar { width: 4px; }
                .flipbook-scroll::-webkit-scrollbar-track { background: transparent; }
                .flipbook-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
})
Page.displayName = 'Page'

export default function FlipBookViewer({ content, title, subtitle }: FlipBookViewerProps) {
    const [pages, setPages] = useState<string[]>([])
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const bookRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
        if (content) {
            setPages(splitIntoPages(content))
        }
    }, [content])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`)
            })
        } else {
            document.exitFullscreen()
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    if (!mounted) {
        return (
            <div className="w-full h-[600px] flex items-center justify-center bg-black/20 rounded-3xl border border-white/10">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
        )
    }

    return (
        <div ref={containerRef} className={`relative flex flex-col items-center justify-center bg-slate-950 overflow-hidden transition-all duration-500 ${isFullscreen ? 'h-screen w-screen p-8 fixed inset-0 z-50' : 'w-full h-[850px] rounded-3xl border border-white/20 p-4 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]'}`}>
            
            {/* Rich Colorful Ambient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center justify-center text-white/50 text-xs font-bold font-mono shadow-xl mr-2">
                    Page {currentPage} of {pages.length + 2}
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => bookRef.current?.pageFlip().flipPrev()} 
                    className="h-10 w-10 p-0 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all hover:scale-105"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => bookRef.current?.pageFlip().flipNext()} 
                    className="h-10 w-10 p-0 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all hover:scale-105"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleFullscreen} 
                    className="h-10 w-10 p-0 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 ml-2 transition-all hover:scale-105"
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
            </div>

            {/* The 3D Book Container */}
            <div className={`w-full h-full flex items-center justify-center px-4 ${isFullscreen ? 'max-w-6xl' : ''}`}>
                <div className="shadow-2xl shadow-amber-500/5 relative drop-shadow-[0_25px_35px_rgba(0,0,0,0.5)]">
                    {/* @ts-ignore */}
                    <HTMLFlipBook 
                        width={550} 
                        height={750} 
                        size="stretch"
                        minWidth={400}
                        maxWidth={650}
                        minHeight={500}
                        maxHeight={850}
                        maxShadowOpacity={0.7}
                        showCover={true}
                        mobileScrollSupport={true}
                        ref={bookRef}
                        className="flip-book-renderer"
                        style={{ margin: '0 auto' }}
                        flippingTime={1000}
                        usePortrait={false}
                        startZIndex={0}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={true}
                        disableFlipByClick={false}
                        onFlip={(e: any) => setCurrentPage(e.data)}
                    >
                        {/* Front Cover */}
                        <Page number="Cover" isCover>
                            <div className="absolute inset-0 bg-noise opacity-[0.25] mix-blend-overlay pointer-events-none" />
                            {/* Inner gold border */}
                            <div className="absolute inset-4 border-[3px] border-double border-amber-400/50 rounded-sm pointer-events-none" />
                            <div className="absolute inset-6 border border-amber-400/20 rounded-sm pointer-events-none" />
                            
                            <div className="w-full h-full p-10 flex flex-col justify-between items-center text-center z-10">
                                <div className="mt-12 space-y-6">
                                    <div className="h-2 w-20 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mx-auto rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                    <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-yellow-300 to-amber-600 tracking-tight leading-tight filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2">
                                        {title}
                                    </h1>
                                    <h2 className="text-lg text-amber-200 font-bold tracking-wide drop-shadow-md">
                                        {subtitle}
                                    </h2>
                                </div>
                                <div className="mb-8 p-4 border-t border-amber-400/30 w-3/4 mx-auto">
                                    <p className="text-xs text-amber-300/80 uppercase tracking-[0.4em] font-black drop-shadow-sm">Auto-Generated</p>
                                </div>
                            </div>
                        </Page>

                        {/* Internal Pages */}
                        {pages.map((pageContent, idx) => (
                            <Page key={idx} number={idx + 1}>
                                <div className="prose max-w-none prose-headings:font-bold prose-h1:text-indigo-950 prose-h2:text-blue-900 prose-h3:text-cyan-900 prose-p:text-justify prose-p:leading-[1.9] prose-p:text-[15px] prose-a:text-blue-600 prose-strong:text-slate-900 text-slate-800 font-serif">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{pageContent}</ReactMarkdown>
                                </div>
                            </Page>
                        ))}

                        {/* Back Cover */}
                        <Page number="Back" isCover>
                            <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none" />
                            <div className="absolute inset-4 border-2 border-amber-500/30 rounded-sm pointer-events-none" />
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 z-10">
                                <div className="space-y-4">
                                    <div className="h-12 w-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-xl font-bold italic text-amber-500/50">
                                        Fin
                                    </div>
                                    <p className="text-xs text-amber-300/40 uppercase tracking-[0.3em] font-medium">Thank you for reading</p>
                                </div>
                            </div>
                        </Page>
                    </HTMLFlipBook>
                </div>
            </div>
            
            <style jsx global>{`
                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }
            `}</style>
        </div>
    )
}
