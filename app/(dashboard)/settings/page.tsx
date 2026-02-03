'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account and preferences
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Settings */}
                <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-foreground">
                            <User className="h-5 w-5 text-purple-500 dark:text-foreground" />
                            <span>Profile</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                            />
                        </div>
                        <Button className="border-2">Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-foreground">
                            <Shield className="h-5 w-5 text-purple-500 dark:text-foreground" />
                            <span>Security</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Manage your password and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button className="border-2">Update Password</Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-foreground">
                            <Bell className="h-5 w-5 text-purple-500 dark:text-foreground" />
                            <span>Notifications</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Configure your notification preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-foreground">Email Notifications</p>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Receive updates via email
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="border-2">Enable</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-foreground">AI Agent Updates</p>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Get notified about new AI features
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="border-2">Enable</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
