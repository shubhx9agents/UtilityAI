'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitBranch, Plus } from 'lucide-react'

export default function FlowsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Flows</h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage your business workflows
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Flow
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-2 hover:border-purple-400 dark:hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-lg bg-gradient-to-br from-white to-purple-50/20 dark:from-card dark:to-card">
                    <CardHeader className="text-center py-12">
                        <GitBranch className="h-12 w-12 mx-auto mb-4 text-purple-500 dark:text-muted-foreground" />
                        <CardTitle className="text-gray-800 dark:text-foreground">Create Your First Flow</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Build automated business workflows
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
