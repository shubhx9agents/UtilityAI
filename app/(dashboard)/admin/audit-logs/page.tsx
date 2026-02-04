'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AuditLog, AuditAction } from '@/types'
import { Clock, Filter, ChevronLeft, ChevronRight, Search, Shield, Trash2 } from 'lucide-react'
import Link from 'next/link'

const AUDIT_ACTIONS: AuditAction[] = [
    'user.login',
    'user.logout',
    'user.signup',
    'session.created',
    'session.updated',
    'session.deleted',
    'session.restored',
    'role.updated',
]

export default function AuditLogsPage() {
    const router = useRouter()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [totalCount, setTotalCount] = useState(0)
    const [showClearDialog, setShowClearDialog] = useState(false)
    const [clearing, setClearing] = useState(false)

    // Filters
    const [actionFilter, setActionFilter] = useState<string>('all')
    const [searchEmail, setSearchEmail] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const logsPerPage = 50

    useEffect(() => {
        fetchAuditLogs()
    }, [actionFilter, currentPage])

    const fetchAuditLogs = async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams({
                limit: logsPerPage.toString(),
                offset: ((currentPage - 1) * logsPerPage).toString(),
            })

            if (actionFilter !== 'all') {
                params.append('action', actionFilter)
            }

            const res = await fetch(`/api/admin/audit-logs?${params}`)

            if (!res.ok) {
                if (res.status === 403) {
                    router.push('/dashboard')
                    return
                }
                throw new Error('Failed to fetch audit logs')
            }

            const data = await res.json()
            setLogs(data.data || [])
            setTotalCount(data.count || 0)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClearLogs = async () => {
        try {
            setClearing(true)
            const res = await fetch('/api/admin/audit-logs/clear', {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to clear audit logs')
            }

            // Refresh the logs
            await fetchAuditLogs()
            setShowClearDialog(false)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setClearing(false)
        }
    }

    const filteredLogs = searchEmail
        ? logs.filter(log =>
            log.user_email?.toLowerCase().includes(searchEmail.toLowerCase())
        )
        : logs

    const totalPages = Math.ceil(totalCount / logsPerPage)

    const getActionColor = (action: string) => {
        if (action.startsWith('user.')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        if (action.startsWith('session.')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        if (action.startsWith('role.')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Admin
                    </Button>
                </Link>
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit Logs</h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Complete audit trail of all system activities
                </p>
            </div>

            {/* Filters */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action Type</label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    {AUDIT_ACTIONS.map(action => (
                                        <SelectItem key={action} value={action}>
                                            {action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search by Email</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="user@example.com"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>
                                Showing {filteredLogs.length} of {totalCount} entries
                            </CardDescription>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowClearDialog(true)}
                            disabled={totalCount === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-muted-foreground">Loading audit logs...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-destructive">
                            <p>{error}</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No audit logs found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-mono px-2 py-1 rounded ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-sm font-medium truncate">
                                                    {log.user_email || 'System'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                <div>
                                                    <span className="font-medium">Time:</span>{' '}
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                                {log.resource_type && (
                                                    <div>
                                                        <span className="font-medium">Resource:</span>{' '}
                                                        {log.resource_type}
                                                    </div>
                                                )}
                                                {log.ip_address && (
                                                    <div>
                                                        <span className="font-medium">IP:</span>{' '}
                                                        {log.ip_address}
                                                    </div>
                                                )}
                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <div className="sm:col-span-2">
                                                        <span className="font-medium">Details:</span>{' '}
                                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                            {JSON.stringify(log.details)}
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Clear Logs Confirmation Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Audit Logs?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete all audit log entries from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowClearDialog(false)}
                            disabled={clearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearLogs}
                            disabled={clearing}
                        >
                            {clearing ? 'Clearing...' : 'Clear All Logs'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
