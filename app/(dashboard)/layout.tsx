'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Sparkles,
    Layers,
    GitBranch,
    StickyNote,
    FolderOpen,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Onboarding', href: '/onboarding', icon: Sparkles },
    { name: 'AI Agents', href: '/agents', icon: Sparkles },
    { name: 'Canvas', href: '/canvas', icon: Layers },
    { name: 'Flows', href: '/flows', icon: GitBranch },
    { name: 'Notes', href: '/notes', icon: StickyNote },
    { name: 'Library', href: '/library', icon: FolderOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, signOut } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">UtilityAI</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-card border-b border-border">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex-1" />
                        {/* Add any top-right items here */}
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
