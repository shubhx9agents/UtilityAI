'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3,
    History,
    TrendingUp,
    CreditCard,
    Activity,
    Workflow,
    Users,
    Zap,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Sparkles,
    Info
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useCredits } from '@/contexts/CreditsContext'

interface StatsData {
    plan: 'free' | 'premium'
    limits: {
        outputs: number
        canvas: number
    }
    usage: {
        total_credits_used: number
        canvas_creations_used: number
        remaining_credits: number
    }
    stats: {
        total_workflows: number
        active_workflows: number
        total_executions: number
    }
    trend: Array<{ date: string; credits: number }>
    breakdown: Array<{ name: string; value: number }>
    history: Array<{
        id: string
        action: string
        agent_type: string | null
        credits_consumed: number
        created_at: string
    }>
}

export default function UsagePage() {
    const [data, setData] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const { isPremium, upgrade } = useSubscription()
    const { usage, limits: contextLimits } = useCredits()

    useEffect(() => {
        fetchStats()

        // Re-fetch on window focus to catch updates from other tabs
        window.addEventListener('focus', fetchStats)
        return () => window.removeEventListener('focus', fetchStats)
    }, [usage.total_credits_used, usage.canvas_creations_used]) // Real-time update dependency

    const fetchStats = async () => {
        try {
            // Only show loader on initial fetch to avoid background flicker
            if (!data) setLoading(true)

            const res = await fetch('/api/credits/stats')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-t-2 border-amber-500 animate-spin" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-amber-500/20" />
                </div>
            </div>
        )
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    const COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#78350f']

    return (
        <motion.div
            className="space-y-8 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        Usage & Credits
                        <Sparkles className="h-6 w-6 text-amber-500" />
                    </h1>
                    <p className="text-zinc-400">Monitor your credit consumption and workflow performance.</p>
                </div>
                {!isPremium && (
                    <Button
                        onClick={upgrade}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold px-6 rounded-xl shadow-lg shadow-amber-500/20"
                    >
                        Upgrade to Premium
                    </Button>
                )}
            </div>

            {/* Summary Cards - Using Context Data for Real-Time & Consistency */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Credits"
                    value={usage.total_credits_used}
                    limit={contextLimits.outputs}
                    subtitle={`Used out of ${contextLimits.outputs}`}
                    icon={<CreditCard className="h-5 w-5" />}
                    progress={(usage.total_credits_used / contextLimits.outputs) * 100}
                />
                <SummaryCard
                    title="Remaining"
                    value={Math.max(0, contextLimits.outputs - usage.total_credits_used)}
                    subtitle="Credits available"
                    icon={<Zap className="h-5 w-5" />}
                    color="amber"
                />
                <SummaryCard
                    title="Executions"
                    value={data.stats.total_executions}
                    subtitle="Total workflow runs"
                    icon={<Activity className="h-5 w-5" />}
                    color="blue"
                />
                <SummaryCard
                    title="Workflows"
                    value={data.stats.total_workflows}
                    subtitle={`${data.stats.active_workflows} active workflows`}
                    icon={<Workflow className="h-5 w-5" />}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart - Usage Trend */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Credit Usage Trend</h3>
                            </div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Last 30 Days</p>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend}>
                                    <defs>
                                        <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        minTickGap={30}
                                    />
                                    <YAxis stroke="#52525b" fontSize={12} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            borderColor: '#3f3f46',
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                        labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="credits"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCredits)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                {/* Breakdown Chart */}
                <motion.div variants={itemVariants}>
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl p-6 h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Usage Breakdown</h3>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.breakdown} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                    <XAxis type="number" stroke="#52525b" fontSize={12} hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#a1a1aa"
                                        fontSize={11}
                                        width={100}
                                        tickFormatter={(val) => val.split('_').join(' ')}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            borderColor: '#3f3f46',
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {data.breakdown?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                {/* Activity Table */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                    <History className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Detailed Activity</h3>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">Recent Transactions</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Activity</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agent / Feature</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Credits</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.history?.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${tx.action === 'agent_run' ? 'bg-amber-500/10 text-amber-500' :
                                                        tx.action === 'canvas_create' ? 'bg-blue-500/10 text-blue-500' :
                                                            'bg-zinc-500/10 text-zinc-500'
                                                        }`}>
                                                        {tx.action === 'agent_run' ? <Zap className="h-3.5 w-3.5" /> :
                                                            tx.action === 'canvas_create' ? <Workflow className="h-3.5 w-3.5" /> :
                                                                <Activity className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-white capitalize">
                                                        {tx.action.split('_').join(' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-400">
                                                {tx.agent_type ? tx.agent_type.split('_').join(' ') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500">
                                                {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-semibold text-white">
                                                    -{tx.credits_consumed}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.history.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                                                No activity recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/10 p-6">
                    <div className="flex gap-4">
                        <div className="p-3 h-fit rounded-xl bg-amber-500/20 text-amber-500">
                            <Info className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-2">How credits work</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Credits are consumed for each successful agent execution and workflow creation.
                                Free plan users have limited credits, while Premium users enjoy significantly higher limits.
                                Credits are reset monthly or upon plan renewal.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 p-6 border-l-2 border-l-amber-500">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <h4 className="text-white font-semibold mb-2">Need more capacity?</h4>
                            <p className="text-sm text-zinc-400">
                                Unlock higher limits, advanced agents, and unlimited canvas orchestrations with a premium subscription.
                            </p>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={upgrade}
                                className="text-amber-500 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                View Pricing Plans <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    )
}

function SummaryCard({ title, value, limit, subtitle, icon, progress, color = 'amber' }: any) {
    const colorMap: Record<string, string> = {
        amber: 'from-amber-500 to-amber-600',
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600'
    }

    const bgColorMap: Record<string, string> = {
        amber: 'bg-amber-500/10 text-amber-500',
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-emerald-500/10 text-emerald-500',
        purple: 'bg-purple-500/10 text-purple-500'
    }

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
            }}
        >
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl p-6 hover:border-white/10 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${bgColorMap[color]}`}>
                        {icon}
                    </div>
                    {progress !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${progress > 80 ? 'bg-red-500/10 text-red-500' : 'bg-neutral-500/10 text-zinc-400'
                            }`}>
                            {progress.toFixed(0)}% Used
                        </span>
                    )}
                </div>

                <div>
                    <h4 className="text-zinc-500 text-sm font-medium">{title}</h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white leading-tight">{value}</span>
                        {limit && <span className="text-zinc-600 font-medium">/ {limit}</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
                </div>

                {progress !== undefined && (
                    <div className="mt-4 space-y-2">
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${colorMap[color]}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, progress)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    )
}
