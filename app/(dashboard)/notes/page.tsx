'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StickyNote, Plus } from 'lucide-react'

export default function NotesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
                    <p className="text-muted-foreground mt-2">
                        Capture and organize your ideas
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-2 hover:border-amber-400 dark:hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-lg bg-gradient-to-br from-white to-amber-50/20 dark:from-card dark:to-card">
                    <CardHeader className="text-center py-12">
                        <StickyNote className="h-12 w-12 mx-auto mb-4 text-amber-500 dark:text-muted-foreground" />
                        <CardTitle className="text-gray-800 dark:text-foreground">Create Your First Note</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Start capturing your ideas and insights
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
