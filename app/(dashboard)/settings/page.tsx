'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { User, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="mt-2 text-muted-foreground">
                    Manage your account and preferences
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-warm-border bg-warm-surface shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <User className="h-5 w-5 text-amber-500" />
                            <span>Profile</span>
                        </CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" type="text" placeholder="Your name" />
                        </div>
                        <Button className="rounded-lg bg-amber-500 text-zinc-900 hover:bg-amber-600 border-0">Save Changes</Button>
                    </CardContent>
                </Card>

                <Card className="border-warm-border bg-warm-surface shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <Shield className="h-5 w-5 text-amber-500" />
                            <span>Security</span>
                        </CardTitle>
                        <CardDescription>
                            Manage your password and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" placeholder="••••••••" />
                        </div>
                        <Button className="rounded-lg border-warm-border">Update Password</Button>
                    </CardContent>
                </Card>

                <Card className="border-warm-border bg-warm-surface shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <Bell className="h-5 w-5 text-amber-500" />
                            <span>Notifications</span>
                        </CardTitle>
                        <CardDescription>
                            Configure your notification preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-warm-border p-4">
                            <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg border-warm-border">Enable</Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-warm-border p-4">
                            <div>
                                <p className="font-medium text-foreground">AI Agent Updates</p>
                                <p className="text-sm text-muted-foreground">Get notified about new AI features</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg border-warm-border">Enable</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
