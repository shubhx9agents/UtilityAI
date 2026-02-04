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
import { AdminUser, UserRoleType } from '@/types'
import { Users, Search, ChevronLeft, Shield, Crown, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function UserManagementPage() {
    const router = useRouter()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [newRole, setNewRole] = useState<UserRoleType>('user')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/users')

            if (!res.ok) {
                if (res.status === 403) {
                    router.push('/dashboard')
                    return
                }
                throw new Error('Failed to fetch users')
            }

            const data = await res.json()
            setUsers(data.data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateRole = async () => {
        if (!selectedUser) return

        try {
            setUpdating(true)
            const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update role')
            }

            toast.success('User role updated successfully')
            setSelectedUser(null)
            fetchUsers()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setUpdating(false)
        }
    }

    const filteredUsers = searchQuery
        ? users.filter(user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : users

    const adminCount = users.filter(u => u.role === 'admin').length
    const userCount = users.filter(u => u.role === 'user').length

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
                    <Users className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Manage user accounts and roles
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>

                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adminCount}</div>
                    </CardContent>
                </Card>

                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Search Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        Showing {filteredUsers.length} of {users.length} users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-muted-foreground">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-destructive">
                            <p>{error}</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No users found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium truncate">
                                                    {user.email}
                                                </span>
                                                {user.role === 'admin' ? (
                                                    <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded flex items-center gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        User
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                                <div>
                                                    <span className="font-medium">Joined:</span>{' '}
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Last Login:</span>{' '}
                                                    {user.last_sign_in_at
                                                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                                                        : 'Never'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Sessions:</span>{' '}
                                                    {user.session_count}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setNewRole(user.role)
                                            }}
                                            className="shrink-0"
                                        >
                                            Change Role
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Update Role Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update User Role</DialogTitle>
                        <DialogDescription>
                            Change the role for {selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Role</label>
                            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRoleType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {newRole === 'admin' ? (
                                <p>⚠️ Admins have full access to the admin panel and can manage other users.</p>
                            ) : (
                                <p>Regular users have access to all agent features but cannot access the admin panel.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={updating}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRole} disabled={updating || newRole === selectedUser?.role}>
                            {updating ? 'Updating...' : 'Update Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
