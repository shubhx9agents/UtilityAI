'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { User, Bell, Shield, Lock, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
    const { user } = useAuth()

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const isGoogleUser = user?.app_metadata?.provider === 'google'

    const handleUpdatePassword = async () => {
        setError(null)
        setSuccess(null)

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/password/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to update password')
            } else {
                setSuccess('Password changed successfully')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Settings</h1>
                <p className="mt-2 text-white/50">
                    Manage your account and preferences
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-[#262626] bg-[#030303] shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <User className="h-5 w-5 text-amber-500" />
                            <span>Profile</span>
                        </CardTitle>
                        <CardDescription className="text-white/50">
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/70">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-[#0d0d0d] border-[#262626] text-white/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white/70">Name</Label>
                            <Input id="name" type="text" placeholder="Your name" defaultValue={user?.user_metadata?.name || ''} className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50" />
                        </div>
                        <Button className="rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-bold px-8">Save Changes</Button>
                    </CardContent>
                </Card>

                <Card className="border-[#262626] bg-[#030303] shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="h-5 w-5 text-amber-500" />
                            <span>Security</span>
                        </CardTitle>
                        <CardDescription className="text-white/50">
                            Manage your password and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isGoogleUser ? (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-4">
                                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-white font-medium">Google Authentication</p>
                                    <p className="text-sm text-white/50 leading-relaxed">
                                        Since you are logged in via Google, password changes are not available.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-[#262626] text-white/70 hover:bg-white/5 hover:text-white"
                                    onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                                >
                                    Manage Google Security <ExternalLink className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {error && (
                                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-1">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        <span>{success}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="current-password" className="text-white/70">Current Password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-white/70">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-white/70">Confirm New Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleUpdatePassword}
                                        disabled={loading}
                                        className="rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all font-bold disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : 'Update Password'}
                                    </Button>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-amber-500 hover:text-amber-400 transition-colors text-center font-medium"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-[#262626] bg-[#030303] shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Bell className="h-5 w-5 text-amber-500" />
                            <span>Notifications</span>
                        </CardTitle>
                        <CardDescription className="text-white/50">
                            Configure your notification preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-[#262626] p-4 bg-white/5">
                            <div>
                                <p className="font-medium text-white">Email Notifications</p>
                                <p className="text-sm text-white/50">Receive updates via email</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg border-[#262626] text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-bold">Enable</Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#262626] p-4 bg-white/5">
                            <div>
                                <p className="font-medium text-white">AI Agent Updates</p>
                                <p className="text-sm text-white/50">Get notified about new AI features</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg border-[#262626] text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-bold">Enable</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
