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
                <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
                    <CardHeader className="text-center py-12">
                        <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <CardTitle>Create Your First Flow</CardTitle>
                        <CardDescription>
                            Build automated business workflows
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
