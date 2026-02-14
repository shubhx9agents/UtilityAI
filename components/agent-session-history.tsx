'use client'

import { useState, useEffect } from 'react'
import { AgentSession, AgentType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
    History,
    Trash2,
    ChevronRight,
    Clock,
    MessageCircle,
    Send
} from 'lucide-react'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ... (imports remain the same) 

interface AgentSessionHistoryProps {
    agentType: AgentType
    onSessionRestore: (session: AgentSession) => void
    currentSessionId?: string | null
    refreshKey?: number
}

export function AgentSessionHistory({ agentType, onSessionRestore, currentSessionId, refreshKey }: AgentSessionHistoryProps) {
    const [sessions, setSessions] = useState<AgentSession[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        fetchSessions()
    }, [agentType, refreshKey])

    const fetchSessions = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/agents/sessions?agent_type=${agentType}`)
            const data = await res.json()

            if (res.ok) {
                setSessions(data.data || [])
            } else {
                console.error('Failed to fetch sessions:', data.error)
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return

        try {
            const res = await fetch(`/api/agents/sessions/${sessionToDelete}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== sessionToDelete))
                toast.success('Session deleted')
            } else {
                toast.error('Failed to delete session')
            }
        } catch (error) {
            console.error('Error deleting session:', error)
            toast.error('Failed to delete session')
        } finally {
            setDeleteDialogOpen(false)
            setSessionToDelete(null)
        }
    }

    const confirmDelete = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSessionToDelete(sessionId)
        setDeleteDialogOpen(true)
    }

    const groupSessionsByDate = (sessions: AgentSession[]) => {
        const groups: Record<string, AgentSession[]> = {}
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        sessions.forEach(session => {
            const sessionDate = new Date(session.created_at)
            let label = ''

            if (sessionDate.toDateString() === today.toDateString()) {
                label = 'Today'
            } else if (sessionDate.toDateString() === yesterday.toDateString()) {
                label = 'Yesterday'
            } else {
                label = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }

            if (!groups[label]) {
                groups[label] = []
            }
            groups[label].push(session)
        })

        return groups
    }

    const groupedSessions = groupSessionsByDate(sessions)

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full"
                >
                    <History className="h-4 w-4 mr-2" />
                    {isOpen ? 'Hide' : 'Show'} Session History ({sessions.length})
                </Button>
            </div>

            {isOpen && (
                <Card className="mb-6 border-2 shadow-sm">
                    {/* ... (Existing session history UI remains same) ... */}
                    <CardHeader className="pb-3 px-4 sm:px-6">
                        <CardTitle className="text-base sm:text-lg flex items-center">
                            <History className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Session History
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Click on any session to restore it
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <ScrollArea className="h-[400px] pr-2 sm:pr-4">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                    <p className="text-sm">Loading sessions...</p>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">No previous sessions</p>
                                    <p className="text-xs mt-1">Your sessions will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                                        <div key={date}>
                                            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                                {date}
                                            </h3>
                                            <div className="space-y-2">
                                                {dateSessions.map(session => (
                                                    <div
                                                        key={session.id}
                                                        onClick={() => onSessionRestore(session)}
                                                        className={`group relative p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${currentSessionId === session.id
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50 hover:bg-accent'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                                <p className="text-sm font-medium truncate">
                                                                    {session.session_name || 'Untitled Session'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {new Date(session.created_at).toLocaleTimeString('en-US', {
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </p>
                                                                {session.response && (
                                                                    (agentType === 'linkedin_headshot' || agentType === 'image_generation') && session.response.startsWith('http') ? (
                                                                        <div className="mt-2 rounded-md overflow-hidden border border-border bg-muted/50 flex items-center justify-start p-1 w-fit">
                                                                            <img
                                                                                src={session.response}
                                                                                alt="Generated preview"
                                                                                className="h-16 w-auto object-contain rounded-sm"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    e.currentTarget.parentElement?.classList.add('p-2');
                                                                                    const span = document.createElement('span');
                                                                                    span.textContent = 'Expired';
                                                                                    e.currentTarget.parentElement?.appendChild(span);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-all">
                                                                            {session.response.substring(0, 60)}...
                                                                        </p>
                                                                    )
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-1 shrink-0">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                                    onClick={(e) => confirmDelete(session.id, e)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this session and all its data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

