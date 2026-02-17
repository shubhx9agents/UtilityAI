'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Upload } from 'lucide-react'

export default function LibraryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Library</h1>
                    <p className="text-white/50 mt-2">
                        Manage your files and resources
                    </p>
                </div>
                <Button className="bg-amber-500 text-black hover:bg-amber-400 font-bold">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-2 border-[#262626] hover:border-amber-500/50 transition-all cursor-pointer shadow-sm hover:shadow-amber-500/10 bg-[#030303]">
                    <CardHeader className="text-center py-12">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                        <CardTitle className="text-white">Upload Your First File</CardTitle>
                        <CardDescription className="text-white/40">
                            Store and organize your business resources
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
