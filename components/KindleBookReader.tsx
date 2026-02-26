'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Plus,
    Minus,
    Bookmark,
    Play,
    Pause,
    BookOpen,
} from 'lucide-react'

interface KindleBookReaderProps {
    content: string
}

type ThemeMode = 'light' | 'dark'
const FONT_PX = [13, 15, 17, 19]
const FONT_LABELS = ['S', 'M', 'L', 'XL']

/* ── helpers ── */
function splitIntoPages(markdown: string): string[] {
    const byHr = markdown.split(/\n---+\n/).map(p => p.trim()).filter(Boolean)
    if (byHr.length > 1) return byHr
    const byH2 = markdown.split(/(?=^## )/m).map(p => p.trim()).filter(Boolean)
    if (byH2.length > 1) return byH2
    return [markdown]
}

function detectBookSize(n: number): 'small' | 'medium' | 'large' {
    if (n <= 6) return 'small'
    if (n <= 12) return 'medium'
    return 'large'
}

function playFlipSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const dur = 0.16
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp((-i / d.length) * 8)
        const src = ctx.createBufferSource(); src.buffer = buf
        const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 1800; flt.Q.value = 0.7
        const g = ctx.createGain(); g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
        src.connect(flt); flt.connect(g); g.connect(ctx.destination)
        src.start(); src.stop(ctx.currentTime + dur)
    } catch (_) { }
}

/* ── shared text renderer for pages ── */
function PageContent({ markdown, isDark, fontSize }: { markdown: string; isDark: boolean; fontSize: number }) {
    const t = isDark ? '#c8b89a' : '#2c1810'
    const acc = isDark ? '#c084fc' : '#6b21a8'
    const font = 'Georgia, serif'
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => <h1 style={{ fontSize: fontSize * 1.4, fontWeight: 800, color: t, borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`, paddingBottom: 10, marginBottom: 18, fontFamily: font }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: fontSize * 1.15, fontWeight: 700, color: acc, marginTop: 22, marginBottom: 10, fontFamily: font }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: fontSize * 1.05, fontWeight: 700, color: t, marginTop: 16, marginBottom: 8, fontFamily: font }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: t, marginBottom: 13, textAlign: 'justify', fontFamily: font, fontSize: fontSize }}>{children}</p>,
                li: ({ children }) => <li style={{ color: t, marginBottom: 5, fontFamily: font, fontSize: fontSize }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: isDark ? '#e2d5c3' : '#1a0a00', fontWeight: 700 }}>{children}</strong>,
            }}
        >
            {markdown}
        </ReactMarkdown>
    )
}

/* ════════════════════════════════════════════ */
export default function KindleBookReader({ content }: KindleBookReaderProps) {
    const pages = splitIntoPages(content)
    const totalPages = pages.length
    const bookSize = detectBookSize(totalPages)

    /* book dimensions — explicit, no height:100% tricks */
    const BOOK_H = bookSize === 'small' ? 460 : bookSize === 'medium' ? 540 : 620
    const SPINE_W = bookSize === 'small' ? 18 : bookSize === 'medium' ? 28 : 42

    const [page, setPage] = useState(0)
    const [direction, setDirection] = useState<'fwd' | 'bwd' | null>(null)
    const [flipping, setFlipping] = useState(false)
    const [theme, setTheme] = useState<ThemeMode>('light')
    const [fontIdx, setFontIdx] = useState(1)
    const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
    const [auto, setAuto] = useState(false)
    const [dragX, setDragX] = useState<number | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const isDark = theme === 'dark'
    const pageBg = isDark ? '#1c1410' : '#f5f0e8'
    const pageText = isDark ? '#c8b89a' : '#2c1810'
    const spineColor = isDark ? '#1e1230' : '#311450'
    const coverGrad = isDark ? '#2d1b4e' : '#4a2070'
    const paperLine = isDark
        ? 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.015) 28px,rgba(255,255,255,0.016) 29px)'
        : 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(0,0,0,0.025) 28px,rgba(0,0,0,0.026) 29px)'

    const flip = useCallback((dir: 'fwd' | 'bwd') => {
        if (flipping) return
        if (dir === 'fwd' && page >= totalPages - 1) return
        if (dir === 'bwd' && page <= 0) return
        playFlipSound()
        setDirection(dir)
        setFlipping(true)
        setTimeout(() => {
            setPage(p => dir === 'fwd' ? p + 1 : p - 1)
            setFlipping(false)
            setDirection(null)
        }, 420)
    }, [flipping, page, totalPages])

    /* keyboard */
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') flip('fwd'); if (e.key === 'ArrowLeft') flip('bwd') }
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
    }, [flip])

    /* auto flip */
    useEffect(() => {
        if (auto) timerRef.current = setInterval(() => flip('fwd'), 4000)
        else if (timerRef.current) clearInterval(timerRef.current)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [auto, flip])
    useEffect(() => { if (page >= totalPages - 1 && auto) setAuto(false) }, [page, totalPages, auto])

    const onDragStart = (e: React.MouseEvent | React.TouchEvent) => setDragX('touches' in e ? e.touches[0].clientX : e.clientX)
    const onDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (dragX === null) return
        const x = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
        if (Math.abs(dragX - x) > 48) flip(dragX - x > 0 ? 'fwd' : 'bwd')
        setDragX(null)
    }

    const toggleMark = () => setBookmarked(prev => { const n = new Set(prev); n.has(page) ? n.delete(page) : n.add(page); return n })
    const isMarked = bookmarked.has(page)
    const fontSize = FONT_PX[fontIdx]

    /* ── Ctrl button helper ── */
    const CtrlBtn = ({ onClick, active = false, accent = '#c084fc', children }: { onClick: () => void; active?: boolean; accent?: string; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 10,
                border: `1px solid ${active ? accent + '66' : 'rgba(255,255,255,0.1)'}`,
                background: active ? accent + '22' : 'rgba(255,255,255,0.05)',
                color: active ? accent : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
            }}
        >{children}</button>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '20px 12px 16px', width: '100%', boxSizing: 'border-box' }}>

            {/* ── Controls ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <CtrlBtn onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                    {isDark ? <Sun size={12} /> : <Moon size={12} />} {isDark ? 'Light' : 'Dark'}
                </CtrlBtn>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                    <button onClick={() => setFontIdx(p => Math.max(0, p - 1))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }} disabled={fontIdx === 0}><Minus size={12} /></button>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', minWidth: 18, textAlign: 'center' }}>{FONT_LABELS[fontIdx]}</span>
                    <button onClick={() => setFontIdx(p => Math.min(3, p + 1))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }} disabled={fontIdx === 3}><Plus size={12} /></button>
                </div>

                <CtrlBtn onClick={() => setAuto(p => !p)} active={auto} accent="#c084fc">
                    {auto ? <Pause size={12} /> : <Play size={12} />} Auto
                </CtrlBtn>

                <CtrlBtn onClick={toggleMark} active={isMarked} accent="#fbbf24">
                    <Bookmark size={12} fill={isMarked ? '#fbbf24' : 'none'} /> Mark
                </CtrlBtn>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                    <BookOpen size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{bookSize} · {totalPages}p</span>
                </div>
            </div>

            {/* ── Book Stage ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>

                {/* Left Arrow */}
                <button
                    onClick={() => flip('bwd')}
                    disabled={page <= 0 || flipping}
                    style={{ ...arrowStyle, opacity: page <= 0 ? 0.2 : 1 }}
                >
                    <ChevronLeft size={20} />
                </button>

                {/* ── The Book ── */}
                <div
                    onMouseDown={onDragStart} onMouseUp={onDragEnd}
                    onTouchStart={onDragStart} onTouchEnd={onDragEnd}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 500,
                        height: BOOK_H,         /* EXPLICIT HEIGHT — no 100% tricks */
                        cursor: dragX !== null ? 'grabbing' : 'grab',
                        filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.55)) drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
                        flexShrink: 1,
                    }}
                >
                    {/* Depth stack — slightly offset pages behind */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute', top: i * 1.5, right: -(i * 1.8),
                            width: '100%', height: BOOK_H,
                            background: isDark ? `hsl(36,28%,${13 + i * 2}%)` : `hsl(36,38%,${90 + i}%)`,
                            borderRadius: '3px 8px 8px 3px',
                            zIndex: -i - 1,
                        }} />
                    ))}

                    {/* Spine */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, width: SPINE_W, height: BOOK_H,
                        background: `linear-gradient(to right, ${spineColor}, ${coverGrad}88)`,
                        borderRadius: '4px 0 0 4px', zIndex: 10,
                        boxShadow: 'inset -3px 0 10px rgba(0,0,0,0.4), 4px 0 8px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ writingMode: 'vertical-rl', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800, transform: 'rotate(180deg)' }}>AI Book</span>
                    </div>

                    {/* ── Page Face ── */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: SPINE_W, right: 0, bottom: 0,
                        background: pageBg,
                        backgroundImage: paperLine,
                        borderRadius: '0 8px 8px 0',
                        overflow: 'hidden',
                        zIndex: 5,
                        boxShadow: 'inset -1px 0 6px rgba(0,0,0,0.08)',
                    }}>
                        {/* Corner curl */}
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
                            borderStyle: 'solid',
                            borderWidth: `0 0 ${flipping && direction === 'fwd' ? 52 : 22}px ${flipping && direction === 'fwd' ? 52 : 22}px`,
                            borderColor: `transparent transparent ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} transparent`,
                            transition: 'border-width 0.3s ease', zIndex: 20, pointerEvents: 'none',
                        }} />

                        {/* Bookmark ribbon */}
                        {isMarked && (
                            <div style={{
                                position: 'absolute', top: 0, right: 28, width: 18, height: 44,
                                background: 'linear-gradient(to bottom,#f59e0b,#d97706)',
                                borderRadius: '0 0 6px 6px', zIndex: 15,
                                boxShadow: '0 4px 8px rgba(245,158,11,0.35)',
                            }} />
                        )}

                        {/* Text content */}
                        <div style={{
                            padding: '28px 30px 24px',
                            height: '100%', overflowY: 'auto',
                            boxSizing: 'border-box',
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'} transparent`,
                        }}>
                            <PageContent markdown={pages[page]} isDark={isDark} fontSize={fontSize} />
                        </div>

                        {/* Flip overlay animation */}
                        {flipping && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 30,
                                background: `${pageBg}dd`,
                                transformOrigin: direction === 'fwd' ? 'left center' : 'right center',
                                animation: direction === 'fwd'
                                    ? 'kFlipFwd 0.42s cubic-bezier(0.4,0,0.2,1) forwards'
                                    : 'kFlipBwd 0.42s cubic-bezier(0.4,0,0.2,1) forwards',
                                backfaceVisibility: 'hidden',
                                boxShadow: direction === 'fwd' ? '-8px 0 20px rgba(0,0,0,0.25)' : '8px 0 20px rgba(0,0,0,0.25)',
                            }} />
                        )}
                    </div>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => flip('fwd')}
                    disabled={page >= totalPages - 1 || flipping}
                    style={{ ...arrowStyle, opacity: page >= totalPages - 1 ? 0.2 : 1 }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* ── Progress ── */}
            <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${((page + 1) / totalPages) * 100}%`, height: '100%', background: 'linear-gradient(to right,#a855f7,#7c3aed)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Page {page + 1} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[...Array(Math.min(totalPages, 20))].map((_, i) => (
                            <button key={i}
                                onClick={() => { if (i === page || flipping) return; playFlipSound(); setPage(i) }}
                                style={{
                                    width: i === page ? 18 : 6, height: 6, borderRadius: 3, padding: 0,
                                    background: i === page ? 'linear-gradient(to right,#a855f7,#7c3aed)' : bookmarked.has(i) ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
                                }}
                                title={`Page ${i + 1}${bookmarked.has(i) ? ' ★' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes kFlipFwd {
                    0%   { transform: perspective(1200px) rotateY(0deg);    opacity:1; }
                    50%  { transform: perspective(1200px) rotateY(-88deg);  opacity:0.5; }
                    100% { transform: perspective(1200px) rotateY(-180deg); opacity:0; }
                }
                @keyframes kFlipBwd {
                    0%   { transform: perspective(1200px) rotateY(0deg);   opacity:1; }
                    50%  { transform: perspective(1200px) rotateY(88deg);  opacity:0.5; }
                    100% { transform: perspective(1200px) rotateY(180deg); opacity:0; }
                }
            `}</style>
        </div>
    )
}

const arrowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 44, height: 44, borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
}
