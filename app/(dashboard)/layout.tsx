'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
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
import { useState, useEffect } from 'react'

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
    const [isAdmin, setIsAdmin] = useState(false)

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const res = await fetch('/api/admin/check')
                const data = await res.json()
                console.log('Admin check response:', data)
                setIsAdmin(data.isAdmin === true)
            } catch (error) {
                console.error('Failed to check admin status:', error)
                setIsAdmin(false)
            }
        }
        if (user) {
            checkAdminStatus()
        }
    }, [user, pathname])

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
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]'
                                        }`}
                                    onClick={(e) => {
                                        // Only close sidebar on mobile (< lg breakpoint)
                                        const isMobile = window.innerWidth < 1024
                                        if (isMobile) {
                                            setSidebarOpen(false)
                                        }
                                    }}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}

                        {/* Admin Link - Only visible to admins */}
                        {isAdmin && (
                            <>
                                <div className="border-t border-border my-2" />
                                <Link
                                    href="/admin"
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname?.startsWith('/admin')
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-muted-foreground hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-[1.02]'
                                        }`}
                                    onClick={(e) => {
                                        const isMobile = window.innerWidth < 1024
                                        if (isMobile) {
                                            setSidebarOpen(false)
                                        }
                                    }}
                                >
                                    <Shield className="h-5 w-5" />
                                    <span>Admin Panel</span>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* User Profile Card */}
                    <div className="p-4 border-t border-border">
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-white">
                                        {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {user?.user_metadata?.name || user?.email?.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Usage</span>
                                    <span className="font-medium">75%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: '75%' }} />
                                </div>
                                <p className="text-xs text-muted-foreground">750 / 1000 credits used</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 space-y-2">
                            <ThemeToggle />
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
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-14 sm:h-16 bg-card border-b border-border">
                    <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-8">
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
                <main className="p-3 sm:p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
