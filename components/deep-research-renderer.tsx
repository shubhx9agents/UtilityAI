'use client'

import React from 'react'

// --- Helpers: safe type coercion for LLM output ---
function toArr(v: unknown): string[] {
    if (Array.isArray(v)) return v.map(x => toStr(x))
    if (typeof v === 'string' && v.trim()) {
        const str = v.trim()
        // If it looks like a comma/semicolon/newline separated list, split it
        if (str.includes('\n')) return str.split('\n').map(s => s.trim().replace(/^[-*•]\s+/, '')).filter(Boolean)
        if (str.includes(';')) return str.split(';').map(s => s.trim()).filter(Boolean)
        if (str.includes(',') && str.split(',').length > 2) return str.split(',').map(s => s.trim()).filter(Boolean)
        return [str]
    }
    if (v && typeof v === 'object') {
        try { return Object.values(v).map(x => toStr(x)) } catch { return [] }
    }
    return []
}
function toStr(v: unknown): string {
    if (typeof v === 'string') return v
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    try { return JSON.stringify(v) } catch { return '—' }
}
function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '#'
    let sanitized = url.trim()
    if (!sanitized) return '#'
    if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
        sanitized = 'https://' + sanitized
    }
    return sanitized
}

// --- Types ---

interface Competitor {
    name: string
    website: string
    profile: { niche: string; target_audience: string; geography: string }
    offerings: { what_they_sell: string; key_features: string[]; core_promise: string; usp: string }
    funnel: { type: string; stages: string[]; lead_magnet: string | null }
    pricing: { model: string; estimated_range: string | null; publicly_listed: boolean }
    metrics: { resolution_rate: string | null; automation_level: string | null }
}

interface AdEntry {
    ad_number: number
    hook: string
    message: string
    offer: string
    creative_type: string
    cta: string
    angle: string
}

interface AdResearch {
    competitor: string
    platform: string
    ad_library_url: string
    ads: AdEntry[]
}

interface LandingPage {
    competitor: string
    url: string
    structure: { page_flow: string[]; headlines: string[] }
    conversion_elements: {
        emotional_triggers: string[]
        social_proof: string[]
        offer_positioning: string
        funnel_path: string
    }
}

interface MessagingPatterns {
    repeated_pains: string[]
    repeated_desires: string[]
    repeated_objections: string[]
    common_hooks: string[]
    target_identities: string[]
    winning_angles: { pain_to_desire: string; key_promises: string[] }
}

interface CustomerInsights {
    top_pains: { rank: number; pain: string }[]
    top_desires: { rank: number; desire: string }[]
    top_objections: { rank: number; objection: string }[]
    buying_psychology: { why_buy: string[]; why_not_buy: string[] }
    emotional_triggers: { status: string; emotions: string[] }
}

interface GapAnalysis {
    market_gaps: string[]
    competitor_blind_spots: string[]
    your_opportunity: {
        unique_positioning: string
        category_positioning: string
        big_idea: string
        pricing_strategy: {
            model: string
            tiers: { name: string; price: string; features: string }[]
            competitive_advantage: string
        }
    }
}

interface FunnelStrategy {
    recommended_hooks: string[]
    winning_angles: string[]
    big_promise: string
    creative_formats: string[]
    funnel_stages: {
        tofu: { ad: string; lead_magnet: string }
        mofu: { content: string; conversion: string }
        bofu: { action: string; offer: string }
        retention: { nurture: string; downsell: string }
    }
    launch_messaging: string
    target_channels: string[]
}

interface DeepResearchData {
    meta_information?: unknown
    competitors?: Competitor[]
    ad_research?: AdResearch[]
    landing_pages?: LandingPage[]
    messaging_patterns?: MessagingPatterns
    customer_insights?: CustomerInsights
    gap_analysis?: GapAnalysis
    funnel_strategy?: FunnelStrategy
}

// --- Helpers ---

function angleColor(angle: string) {
    const a = angle.toLowerCase()
    if (a.includes('pain')) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (a.includes('desire')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (a.includes('status')) return 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    if (a.includes('logic')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    return 'bg-white/5 text-white/40 border-white/10'
}

function SectionHeader({ label, title, count }: { label: string; title: string; count?: string }) {
    return (
        <div className="mb-8 pb-5 border-b border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 mb-1">{label}</p>
            <div className="flex items-baseline gap-3">
                <h2 className="text-[22px] font-black text-white tracking-tight leading-none">{title}</h2>
                {count && <span className="text-white/20 text-xs font-bold">{count}</span>}
            </div>
        </div>
    )
}

function Pill({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'amber' | 'red' | 'green' | 'blue' | 'violet' }) {
    const styles: Record<string, string> = {
        default: 'bg-white/5 border-white/10 text-white/50',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400/80',
        red: 'bg-red-500/10 border-red-500/20 text-red-400/80',
        green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/80',
        blue: 'bg-sky-500/10 border-sky-500/20 text-sky-400/80',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400/80',
    }
    return (
        <span className={`inline-flex items-center border text-[10px] font-semibold px-2.5 py-1 rounded-lg ${styles[variant]}`}>
            {children}
        </span>
    )
}

function Divider() {
    return <div className="my-14 border-t border-white/[0.05]" />
}

// --- Section: Competitors ---

function CompetitorsSection({ data }: { data: Competitor[] }) {
    return (
        <div>
            <SectionHeader label="01 — Competitive Landscape" title="Top Competitors" count={`${data.length} analysed`} />
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] mb-10">
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.015]">
                            {['Company', 'Geography', 'Funnel Type', 'Pricing', 'Key Features'].map((h) => (
                                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/25">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((c, i) => (
                            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-3.5">
                                    <a href={sanitizeUrl(c.website)} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-sm hover:text-amber-300 transition-colors group">
                                        {toStr(c.name)}
                                        <svg className="w-3 h-3 opacity-40 group-hover:opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400/80 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                        {toStr(c.profile?.geography)}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-white/40 text-xs">{toStr(c.funnel?.type)}</td>
                                <td className="px-5 py-3.5 text-white/60 text-xs font-semibold">{toStr(c.pricing?.estimated_range ?? c.pricing?.model)}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {toArr(c.offerings?.key_features).slice(0, 3).map((f, fi) => (
                                            <span key={fi} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                                                {f}
                                            </span>
                                        ))}
                                        {toArr(c.offerings?.key_features).length > 3 && <span className="text-[9px] text-white/20">+{toArr(c.offerings.key_features).length - 3}</span>}
                                        {toArr(c.offerings?.key_features).length === 0 && <span className="text-white/20 text-[10px]">Not specified</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="space-y-5">
                {data.map((c, i) => (
                    <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.05]">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/20 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                <h3 className="text-base font-black text-white">{toStr(c.name)}</h3>
                                <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400/70 text-[10px] font-bold px-2 py-0.5 rounded-md">{toStr(c.profile?.geography)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-white/30 text-xs font-semibold">{toStr(c.pricing?.estimated_range ?? c.pricing?.model ?? 'Custom')}</span>
                                <a href={sanitizeUrl(c.website)} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-amber-500/50 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                    Visit Site
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.04]">
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Niche</p>
                                <p className="text-white/60 text-xs leading-relaxed">{toStr(c.profile?.niche)}</p>
                                <p className="text-white/30 text-[11px] mt-1.5 leading-relaxed">{toStr(c.profile?.target_audience)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Core Promise</p>
                                <p className="text-white/60 text-xs leading-relaxed">{toStr(c.offerings?.core_promise)}</p>
                                <p className="text-amber-400/60 text-[11px] mt-1.5 font-semibold">{toStr(c.offerings?.usp)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">What They Sell</p>
                                <p className="text-white/50 text-xs leading-relaxed">{toStr(c.offerings?.what_they_sell)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2.5">Key Features</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {toArr(c.offerings?.key_features).map((f, fi) => <Pill key={fi}>{f}</Pill>)}
                                </div>
                                {c.funnel?.stages && c.funnel.stages.length > 0 && (
                                    <>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-4 mb-2">Funnel</p>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {toArr(c.funnel.stages).map((s, si) => (
                                                <React.Fragment key={si}>
                                                    <span className="text-[10px] text-white/40 font-medium">{toStr(s)}</span>
                                                    {si < toArr(c.funnel.stages).length - 1 && <span className="text-white/15 text-[10px]">›</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Section: Ad Research ---

function AdResearchSection({ data }: { data: AdResearch[] }) {
    return (
        <div>
            <SectionHeader label="02 — Ad Intelligence" title="Ad Research" count="Meta Ads Library" />
            <div className="space-y-8">
                {data.map((entry, i) => (
                    <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.05] flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-black text-white">{toStr(entry.competitor)}</h3>
                                <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400/70 text-[10px] font-bold px-2 py-0.5 rounded-md">{toStr(entry.platform)}</span>
                            </div>
                            {entry.ad_library_url && (
                                <a href={sanitizeUrl(entry.ad_library_url)} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all text-blue-400/80 hover:text-blue-300 text-[11px] font-bold px-4 py-2 rounded-xl">
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    View Meta Ads Library
                                    <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        {['#', 'Hook', 'Message', 'Offer', 'Creative', 'CTA', 'Angle'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(entry.ads ?? []).map((ad, ai) => (
                                        <tr key={ai} className="border-b border-white/[0.025] hover:bg-white/[0.01] transition-colors align-top">
                                            <td className="px-4 py-3.5 text-white/15 font-black text-xs tabular-nums">{toStr(ad.ad_number)}</td>
                                            <td className="px-4 py-3.5 text-white/75 font-semibold text-xs max-w-[160px] leading-relaxed">
                                                <span className="text-white/30">"</span>{toStr(ad.hook)}<span className="text-white/30">"</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-white/45 text-xs max-w-[180px] leading-relaxed">{toStr(ad.message)}</td>
                                            <td className="px-4 py-3.5 text-emerald-400/70 text-xs font-medium">{toStr(ad.offer)}</td>
                                            <td className="px-4 py-3.5 text-white/30 text-xs">{toStr(ad.creative_type)}</td>
                                            <td className="px-4 py-3.5">
                                                <span className="bg-amber-500/10 text-amber-400/80 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">{toStr(ad.cta)}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${angleColor(toStr(ad.angle))}`}>{toStr(ad.angle)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Section: Landing Pages ---

function LandingPagesSection({ data }: { data: LandingPage[] }) {
    return (
        <div>
            <SectionHeader label="03 — Funnel Intelligence" title="Landing Page Breakdown" />
            <div className="space-y-5">
                {data.map((page, i) => (
                    <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.05] flex-wrap gap-3">
                            <h3 className="text-sm font-black text-white">{toStr(page.competitor)}</h3>
                            {page.url && (
                                <a href={sanitizeUrl(page.url)} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/35 hover:text-amber-400 border border-white/[0.08] hover:border-amber-500/30 bg-transparent hover:bg-amber-500/5 transition-all px-3 py-1.5 rounded-xl"
                                    title={page.url}>
                                    <span className="truncate max-w-[300px]">{toStr(page.url)}</span>
                                    <svg className="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.04]">
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Page Flow</p>
                                <ol className="space-y-2">
                                    {toArr(page.structure?.page_flow).map((step, si) => (
                                        <li key={si} className="flex items-start gap-2.5 text-xs text-white/45 leading-relaxed">
                                            <span className="shrink-0 w-4 h-4 rounded-full bg-white/5 border border-white/10 text-white/30 text-[9px] font-black flex items-center justify-center mt-0.5">{si + 1}</span>
                                            {toStr(step)}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Headlines</p>
                                <div className="space-y-2">
                                    {toArr(page.structure?.headlines).map((h, hi) => (
                                        <p key={hi} className="text-xs text-white/60 font-semibold leading-relaxed border-l-2 border-amber-500/30 pl-3 italic">{toStr(h)}</p>
                                    ))}
                                </div>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2.5">Emotional Triggers</p>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {toArr(page.conversion_elements?.emotional_triggers).map((t, ti) => <Pill key={ti} variant="red">{toStr(t)}</Pill>)}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2.5">Social Proof</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {toArr(page.conversion_elements?.social_proof).map((s, si) => <Pill key={si} variant="green">{toStr(s)}</Pill>)}
                                </div>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2.5">Offer Positioning</p>
                                <p className="text-white/45 text-xs leading-relaxed mb-3">{toStr(page.conversion_elements?.offer_positioning)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Conversion Path</p>
                                <p className="text-amber-400/60 text-xs font-semibold">{toStr(page.conversion_elements?.funnel_path)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Section: Messaging Patterns ---

function MessagingSection({ data }: { data: MessagingPatterns }) {
    return (
        <div>
            <SectionHeader label="04 — Market Messaging" title="Messaging Patterns" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="border border-red-500/10 bg-red-500/[0.03] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400/50 mb-4">Repeated Pains</p>
                    <ul className="space-y-2.5">
                        {toArr(data.repeated_pains).map((item, i) => (
                            <li key={i} className="text-xs text-white/55 flex items-start gap-2 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-red-400/40 shrink-0 mt-1.5" />{toStr(item)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border border-emerald-500/10 bg-emerald-500/[0.03] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/50 mb-4">Repeated Desires</p>
                    <ul className="space-y-2.5">
                        {toArr(data.repeated_desires).map((item, i) => (
                            <li key={i} className="text-xs text-white/55 flex items-start gap-2 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-emerald-400/40 shrink-0 mt-1.5" />{toStr(item)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border border-amber-500/10 bg-amber-500/[0.02] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/50 mb-4">Repeated Objections</p>
                    <ul className="space-y-2.5">
                        {toArr(data.repeated_objections).map((item, i) => (
                            <li key={i} className="text-xs text-white/55 flex items-start gap-2 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-amber-400/40 shrink-0 mt-1.5" />{toStr(item)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {toArr(data.common_hooks).length > 0 && (
                <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Common Hooks</p>
                    <div className="flex flex-wrap gap-2">
                        {toArr(data.common_hooks).map((h, i) => (
                            <span key={i} className="bg-white/[0.03] border border-white/10 text-white/55 text-xs font-medium px-3 py-1.5 rounded-xl italic">"{toStr(h)}"</span>
                        ))}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {toArr(data.target_identities).length > 0 && (
                    <div className="border border-white/[0.06] rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Target Identities</p>
                        <div className="flex flex-wrap gap-2">
                            {toArr(data.target_identities).map((id, i) => <Pill key={i} variant="violet">{toStr(id)}</Pill>)}
                        </div>
                    </div>
                )}
                {data.winning_angles && (
                    <div className="border border-white/[0.06] rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Winning Angle</p>
                        <p className="text-white/60 text-sm font-semibold mb-3 leading-relaxed">{toStr(data.winning_angles.pain_to_desire)}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {toArr(data.winning_angles?.key_promises).map((p, i) => <Pill key={i} variant="amber">{toStr(p)}</Pill>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Section: Customer Insights ---

function CustomerInsightsSection({ data }: { data: CustomerInsights }) {
    return (
        <div>
            <SectionHeader label="05 — Avatar Research" title="Customer Insights" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400/50 mb-3">Top 10 Pains</p>
                    <ol className="space-y-1.5">
                        {(Array.isArray(data.top_pains) ? data.top_pains : []).map((item: any) => (
                            <li key={item?.rank ?? 0} className="flex items-start gap-2.5 bg-red-500/[0.03] border border-red-500/[0.07] rounded-xl px-3 py-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400/80 text-[9px] font-black flex items-center justify-center tabular-nums">{toStr(item?.rank)}</span>
                                <p className="text-white/55 text-xs leading-relaxed">{toStr(item?.pain)}</p>
                            </li>
                        ))}
                    </ol>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/50 mb-3">Top 10 Desires</p>
                    <ol className="space-y-1.5">
                        {(Array.isArray(data.top_desires) ? data.top_desires : []).map((item: any) => (
                            <li key={item?.rank ?? 0} className="flex items-start gap-2.5 bg-emerald-500/[0.03] border border-emerald-500/[0.07] rounded-xl px-3 py-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80 text-[9px] font-black flex items-center justify-center tabular-nums">{toStr(item?.rank)}</span>
                                <p className="text-white/55 text-xs leading-relaxed">{toStr(item?.desire)}</p>
                            </li>
                        ))}
                    </ol>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/50 mb-3">Top 10 Objections</p>
                    <ol className="space-y-1.5">
                        {(Array.isArray(data.top_objections) ? data.top_objections : []).map((item: any) => (
                            <li key={item?.rank ?? 0} className="flex items-start gap-2.5 bg-amber-500/[0.02] border border-amber-500/[0.07] rounded-xl px-3 py-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-[9px] font-black flex items-center justify-center tabular-nums">{toStr(item?.rank)}</span>
                                <p className="text-white/55 text-xs leading-relaxed">{toStr(item?.objection)}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
            {data.buying_psychology && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="border border-emerald-500/10 bg-emerald-500/[0.02] rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/50 mb-3">Why They Buy</p>
                        <ul className="space-y-2">
                            {toArr(data.buying_psychology?.why_buy).map((r, i) => (
                                <li key={i} className="text-xs text-white/55 flex items-start gap-2 leading-relaxed">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400/40 shrink-0 mt-1.5" />{toStr(r)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="border border-red-500/10 bg-red-500/[0.02] rounded-2xl p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400/50 mb-3">Why They Don't Buy</p>
                        <ul className="space-y-2">
                            {toArr(data.buying_psychology?.why_not_buy).map((r, i) => (
                                <li key={i} className="text-xs text-white/55 flex items-start gap-2 leading-relaxed">
                                    <span className="w-1 h-1 rounded-full bg-red-400/40 shrink-0 mt-1.5" />{toStr(r)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {data.emotional_triggers && (
                <div className="border border-violet-500/10 bg-violet-500/[0.03] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/50 mb-2">Emotional and Status Triggers</p>
                    <p className="text-violet-300/70 font-semibold text-sm mb-3">Status Identity: {toStr(data.emotional_triggers.status)}</p>
                    <div className="flex flex-wrap gap-2">
                        {toArr(data.emotional_triggers?.emotions).map((e, i) => <Pill key={i} variant="violet">{toStr(e)}</Pill>)}
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Section: Gap Analysis ---

function GapAnalysisSection({ data }: { data: GapAnalysis }) {
    const opp = data.your_opportunity
    return (
        <div>
            <SectionHeader label="06 — Opportunity Map" title="Gap and Opportunity Analysis" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-400/50 mb-4">Market Gaps</p>
                    <ul className="space-y-3">
                        {toArr(data.market_gaps).map((g, i) => (
                            <li key={i} className="text-xs text-white/55 flex items-start gap-2.5 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-sky-400/40 shrink-0 mt-1.5" />{toStr(g)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400/50 mb-4">Competitor Blind Spots</p>
                    <ul className="space-y-3">
                        {toArr(data.competitor_blind_spots).map((g, i) => (
                            <li key={i} className="text-xs text-white/55 flex items-start gap-2.5 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-red-400/40 shrink-0 mt-1.5" />{toStr(g)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {opp && (
                <div className="space-y-4">
                    <div className="border border-amber-500/20 bg-amber-500/[0.05] rounded-2xl px-6 py-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-2">Big Idea to Dominate</p>
                        <p className="text-white font-black text-lg leading-snug">{toStr(opp.big_idea)}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-white/[0.06] rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Category Positioning</p>
                            <p className="text-amber-400/80 font-black text-sm">{toStr(opp.category_positioning)}</p>
                        </div>
                        <div className="border border-white/[0.06] rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Unique Positioning</p>
                            <p className="text-white/60 text-xs leading-relaxed">{toStr(opp.unique_positioning)}</p>
                        </div>
                    </div>
                    {opp.pricing_strategy?.tiers && opp.pricing_strategy.tiers.length > 0 && (
                        <div className="border border-white/[0.06] rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Pricing Recommendation — {toStr(opp.pricing_strategy.model)}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                {opp.pricing_strategy.tiers.map((tier, i) => (
                                    <div key={i} className="border border-amber-500/[0.12] bg-amber-500/[0.04] rounded-xl p-4 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">{toStr(tier.name)}</p>
                                        <p className="text-2xl font-black text-amber-400 mb-2">{toStr(tier.price)}</p>
                                        <p className="text-[11px] text-white/35 leading-relaxed">{toStr(tier.features)}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-emerald-400/60 font-semibold">{toStr(opp.pricing_strategy.competitive_advantage)}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// --- Section: Funnel Strategy ---

function FunnelStrategySection({ data }: { data: FunnelStrategy }) {
    const stages = [
        {
            key: 'tofu', label: 'TOFU — Top of Funnel',
            borderColor: 'border-sky-500/20', bgColor: 'bg-sky-500/[0.04]', labelColor: 'text-sky-400/60',
            content: data.funnel_stages?.tofu ? [
                data.funnel_stages.tofu.ad || (data.funnel_stages.tofu as any).top_of_funnel_ad,
                data.funnel_stages.tofu.lead_magnet || (data.funnel_stages.tofu as any).leadMagnet
            ] : [],
        },
        {
            key: 'mofu', label: 'MOFU — Middle of Funnel',
            borderColor: 'border-amber-500/20', bgColor: 'bg-amber-500/[0.04]', labelColor: 'text-amber-400/60',
            content: data.funnel_stages?.mofu ? [
                data.funnel_stages.mofu.content || (data.funnel_stages.mofu as any).middle_of_funnel_content,
                data.funnel_stages.mofu.conversion || (data.funnel_stages.mofu as any).middle_of_funnel_conversion
            ] : [],
        },
        {
            key: 'bofu', label: 'BOFU — Bottom of Funnel',
            borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/[0.04]', labelColor: 'text-emerald-400/60',
            content: data.funnel_stages?.bofu ? [
                data.funnel_stages.bofu.action || (data.funnel_stages.bofu as any).bottom_of_funnel_action,
                data.funnel_stages.bofu.offer || (data.funnel_stages.bofu as any).bottom_of_funnel_offer
            ] : [],
        },
        {
            key: 'retention', label: 'RETENTION',
            borderColor: 'border-violet-500/20', bgColor: 'bg-violet-500/[0.04]', labelColor: 'text-violet-400/60',
            content: data.funnel_stages?.retention ? [
                data.funnel_stages.retention.nurture || (data.funnel_stages.retention as any).nurture_strategy,
                data.funnel_stages.retention.downsell || (data.funnel_stages.retention as any).downsell_offer
            ] : [],
        },
    ]

    return (
        <div>
            <SectionHeader label="07 — Launch Direction" title="My Funnel and Ad Direction" />
            {data.big_promise && (
                <div className="border border-amber-500/20 bg-amber-500/[0.05] rounded-2xl px-6 py-5 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-2">Big Promise</p>
                    <p className="text-white font-black text-lg leading-snug">{toStr(data.big_promise)}</p>
                </div>
            )}
            <div className="space-y-3 mb-8">
                {stages.map((stage, i) => (
                    <div key={stage.key}>
                        <div className={`border ${stage.borderColor} ${stage.bgColor} rounded-2xl p-5`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${stage.labelColor} mb-2`}>{stage.label}</p>
                            {stage.content.filter(Boolean).map((line, li) => (
                                <p key={li} className="text-white/50 text-xs leading-relaxed">{toStr(line)}</p>
                            ))}
                        </div>
                        {i < stages.length - 1 && (
                            <div className="flex justify-center py-1">
                                <span className="text-white/15 text-xs font-bold">↓</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Best Hooks</p>
                    <ul className="space-y-2">
                        {toArr(data.recommended_hooks).map((h, i) => (
                            <li key={i} className="text-xs text-white/60 font-semibold leading-relaxed border-l-2 border-amber-500/30 pl-3 italic">{toStr(h)}</li>
                        ))}
                    </ul>
                </div>
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Winning Angles</p>
                    <ul className="space-y-2">
                        {toArr(data.winning_angles).map((a, i) => (
                            <li key={i} className="text-xs text-white/50 flex items-start gap-2 leading-relaxed">
                                <span className="text-amber-400/30 shrink-0 font-bold">›</span>{toStr(a)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Creative Formats</p>
                    <div className="flex flex-wrap gap-1.5">
                        {toArr(data.creative_formats).map((f, i) => <Pill key={i}>{toStr(f)}</Pill>)}
                    </div>
                </div>
                <div className="border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Target Channels</p>
                    <div className="flex flex-wrap gap-1.5">
                        {toArr(data.target_channels).map((c, i) => <Pill key={i} variant="blue">{toStr(c)}</Pill>)}
                    </div>
                </div>
            </div>
            {data.launch_messaging && (
                <div className="border border-white/[0.08] bg-white/[0.02] rounded-2xl px-6 py-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Launch Message</p>
                    <p className="text-white/65 text-sm leading-relaxed font-medium italic">"{toStr(data.launch_messaging)}"</p>
                </div>
            )}
        </div>
    )
}

// --- Main Renderer ---

export function DeepResearchRenderer({ rawResponse, onForceMarkdown }: { rawResponse: string, onForceMarkdown?: () => void }) {
    const jsonStr = rawResponse.startsWith('DEEP_RESEARCH_JSON:')
        ? rawResponse.slice('DEEP_RESEARCH_JSON:'.length)
        : rawResponse

    let data: DeepResearchData | null = null
    try {
        data = JSON.parse(jsonStr)
    } catch {
        return (
            <div className="p-8 text-center border border-dashed border-red-500/20 rounded-2xl bg-red-500/5">
                <p className="text-red-400 text-sm font-semibold">Failed to parse research data.</p>
                <p className="text-white/40 text-xs mt-2">The AI output may be in an unexpected format.</p>
                <button 
                    type="button"
                    className="text-amber-500/60 text-[10px] uppercase font-bold tracking-widest mt-4 cursor-pointer hover:text-amber-400 transition-colors" 
                    onClick={() => onForceMarkdown?.()}
                >
                    View raw report instead
                </button>
            </div>
        )
    }

    const d = data
    if (!d || (!d.competitors?.length && !d.ad_research?.length && !d.landing_pages?.length)) {
        return (
            <div className="p-8 text-center border border-dashed border-amber-500/20 rounded-2xl bg-amber-500/5">
                <p className="text-amber-400 text-sm font-semibold">Incomplete research data.</p>
                <p className="text-white/40 text-xs mt-2">The report was generated but could not be fully structured.</p>
                <button 
                    type="button"
                    className="text-amber-500/60 text-[10px] uppercase font-bold tracking-widest mt-4 cursor-pointer hover:text-amber-400 transition-colors" 
                    onClick={() => onForceMarkdown?.()}
                >
                    View raw report instead
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-0 text-sm" id="deep-research-content">
            {d.competitors && d.competitors.length > 0 && (
                <><CompetitorsSection data={d.competitors} /><Divider /></>
            )}
            {d.ad_research && d.ad_research.length > 0 && (
                <><AdResearchSection data={d.ad_research} /><Divider /></>
            )}
            {d.landing_pages && d.landing_pages.length > 0 && (
                <><LandingPagesSection data={d.landing_pages} /><Divider /></>
            )}
            {d.messaging_patterns && (
                <><MessagingSection data={d.messaging_patterns} /><Divider /></>
            )}
            {d.customer_insights && (
                <><CustomerInsightsSection data={d.customer_insights} /><Divider /></>
            )}
            {d.gap_analysis && (
                <><GapAnalysisSection data={d.gap_analysis} /><Divider /></>
            )}
            {d.funnel_strategy && (
                <FunnelStrategySection data={d.funnel_strategy} />
            )}
        </div>
    )
}
