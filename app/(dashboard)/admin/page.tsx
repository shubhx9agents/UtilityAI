'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Users, Activity, Database } from 'lucide-react'

const stats = [
    { name: 'Total Users', value: '0', icon: Users, change: '+0%' },
    { name: 'Active Sessions', value: '0', icon: Activity, change: '+0%' },
    { name: 'Database Size', value: '0 MB', icon: Database, change: '+0%' },
    { name: 'API Calls Today', value: '0', icon: Activity, change: '+0%' },
]

export default function AdminPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <span>Admin Dashboard</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage users, monitor system health, and view analytics
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.name}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.change} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>
                            View and manage user accounts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            View All Users
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            Create New User
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>
                            Monitor application performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">API Status</span>
                            <span className="text-sm font-medium text-green-500">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Database</span>
                            <span className="text-sm font-medium text-green-500">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">AI Service</span>
                            <span className="text-sm font-medium text-green-500">Active</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
