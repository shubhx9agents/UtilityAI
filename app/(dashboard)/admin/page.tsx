'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminStats, AuditLog } from '@/types'
import {
    Users,
    Activity,
    TrendingUp,
    Shield,
    Database,
    Clock,
    ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch stats
            const statsRes = await fetch('/api/admin/stats')
            if (!statsRes.ok) {
                if (statsRes.status === 403) {
                    router.push('/dashboard')
                    return
                }
                throw new Error('Failed to fetch stats')
            }
            const statsData = await statsRes.json()
            setStats(statsData.data)

            // Fetch recent audit logs
            const logsRes = await fetch('/api/admin/audit-logs?limit=10')
            if (logsRes.ok) {
                const logsData = await logsRes.json()
                setRecentLogs(logsData.data || [])
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Manage users, view audit logs, and monitor system activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered accounts
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Agent sessions created
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.recent_activity_24h || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Actions in last 24h
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Used Agent</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold capitalize">
                            {stats?.most_used_agents[0]?.agent_type.replace(/_/g, ' ') || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.most_used_agents[0]?.usage_count || 0} sessions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/admin/audit-logs">
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Audit Logs</CardTitle>
                                        <CardDescription>View all system activity</CardDescription>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/users">
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">User Management</CardTitle>
                                        <CardDescription>Manage user roles</CardDescription>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Recent Activity */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest audit log entries</CardDescription>
                        </div>
                        <Link href="/admin/audit-logs">
                            <Button variant="outline" size="sm">
                                View All
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No recent activity
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                >
                                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium">{log.user_email || 'System'}</span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                                {log.action}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Most Active Users */}
            {stats && stats.most_active_users.length > 0 && (
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle>Most Active Users (24h)</CardTitle>
                        <CardDescription>Users with the most activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.most_active_users.map((user, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                                >
                                    <span className="text-sm font-medium">{user.user_email}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {user.action_count} actions
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
