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
                            <Input id="name" type="text" placeholder="Your name" className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50" />
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
                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-white/70">Current Password</Label>
                            <Input id="current-password" type="password" placeholder="••••••••" className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-white/70">New Password</Label>
                            <Input id="new-password" type="password" placeholder="••••••••" className="bg-[#0d0d0d] border-[#262626] text-white focus:border-amber-500/50" />
                        </div>
                        <Button variant="outline" className="rounded-lg border-[#262626] text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-bold">Update Password</Button>
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
