'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useCredits } from '@/contexts/CreditsContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/landing/Logo'
import {
  LayoutDashboard,
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  Rocket,
  Bot,
  Crown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Onboarding', href: '/onboarding', icon: Rocket },
  { name: 'AI Agents', href: '/agents', icon: Bot },
  { name: 'Canvas', href: '/canvas', icon: Layers },
  { name: 'Usage & Credits', href: '/usage', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profileStatus, signOut } = useAuth()
  const { isPremium, upgrade } = useSubscription()
  const { usage, limits } = useCredits()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Sync with localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    // Use requestAnimationFrame to defer state update and avoid lint warning
    requestAnimationFrame(() => {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored === 'true') {
        setSidebarCollapsed(true)
      }
      setMounted(true)
    })
  }, [])

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Premium Dark sidebar with glassmorphism - Collapsible */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full transform ease-out lg:translate-x-0 ${mounted ? 'transition-all duration-300' : ''
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {/* Animated gradient border on the right */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />

        {/* Glassmorphic background */}
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" />

        {/* Subtle mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />

        {/* Collapse toggle button - Desktop only - Modern pill design */}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className={`absolute top-7 z-50 hidden lg:flex h-7 items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 backdrop-blur-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 ${sidebarCollapsed ? 'w-7 -right-3.5' : 'w-7 -right-3.5'}`}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="relative">
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            )}
          </div>
        </button>

        <div className="relative flex h-full flex-col">
          <div className={`flex h-20 items-center border-b border-white/5 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
            <Link href="/dashboard" className="group flex items-center gap-2">
              <Logo size="sm" showText={!sidebarCollapsed} animate={false} />
            </Link>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-all lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <nav className={`flex-1 space-y-1 overflow-y-auto scrollbar-hide py-6 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center rounded-xl transition-all duration-200 ${sidebarCollapsed
                    ? 'justify-center px-0 py-3'
                    : 'gap-3 px-3 py-3'
                    } ${isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen(false)
                    }
                  }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {/* Active background with gradient */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20`} />
                  )}

                  {/* Hover background */}
                  <div className={`absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity ${!isActive && 'group-hover:opacity-100'}`} />

                  {/* Active indicator bar */}
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50" />
                  )}

                  {/* Icon with glow on active */}
                  <div className="relative">
                    <item.icon className={`relative h-5 w-5 shrink-0 transition-all ${isActive ? 'text-amber-500' : 'group-hover:text-amber-400'}`} />
                    {isActive && sidebarCollapsed && (
                      <div className="absolute inset-0 bg-amber-500/30 blur-lg" />
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <span className="relative text-sm font-medium whitespace-nowrap">{item.name}</span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                      {item.name}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Upgrade button — only shown for Free users */}
          {!isPremium && (
            <div className={`px-3 pb-2 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              {sidebarCollapsed ? (
                /* Collapsed: icon-only with tooltip */
                <div className="group relative">
                  <button
                    onClick={upgrade}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-900 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all duration-200"
                    title="Upgrade to Premium"
                    id="sidebar-upgrade-btn-collapsed"
                    aria-label="Upgrade to Premium"
                  >
                    <Crown className="h-4 w-4" />
                  </button>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                    Upgrade to Premium
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
                  </div>
                </div>
              ) : (
                /* Expanded: full upgrade button */
                <button
                  onClick={upgrade}
                  id="sidebar-upgrade-btn"
                  className="group relative w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/25 px-3 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300 transition-all duration-200"
                  aria-label="Upgrade to Premium"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm shadow-amber-500/40">
                    <Crown className="h-3.5 w-3.5 text-zinc-900" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="leading-none">Upgrade Plan</span>
                    <span className="text-[10px] text-amber-500/60 mt-0.5 font-normal">Unlock premium features</span>
                  </div>
                  <Sparkles className="ml-auto h-3.5 w-3.5 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                </button>
              )}
            </div>
          )}

          <div className={`border-t border-white/5 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {/* Premium user card - different layout when collapsed */}
            {sidebarCollapsed ? (
              /* Collapsed: Just avatar with tooltip */
              <div className="flex flex-col items-center gap-2">
                <div className="group relative">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-900 font-bold shadow-lg shadow-amber-500/20 cursor-pointer">
                    <span className="text-sm">
                      {user?.user_metadata?.name?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl min-w-[140px]">
                    <p className="font-semibold">{user?.user_metadata?.name || user?.email?.split('@')[0]}</p>
                    <p className="text-amber-500/80 mt-0.5">{isPremium ? 'Premium Plan ★' : `Free Plan • ${Math.round((usage.total_credits_used / limits.per_agent) * 100)}%`}</p>
                  </div>
                </div>

                {/* Collapsed action buttons */}
                <button
                  onClick={handleSignOut}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                    Sign Out
                  </div>
                </button>
              </div>
            ) : (
              /* Expanded: Full user card */
              <>
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur-sm">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-900 font-bold shadow-lg shadow-amber-500/20">
                      <span className="text-sm">
                        {user?.user_metadata?.name?.charAt(0).toUpperCase() ||
                          user?.email?.charAt(0).toUpperCase() || '?'}
                      </span>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.user_metadata?.name || user?.email?.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-3 w-3 text-amber-500" />
                        <p className="text-xs text-amber-500/80 font-medium">
                          {isPremium ? 'Premium Plan' : 'Free Plan'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Credits Used</span>
                      <span className="text-white font-medium">
                        {usage.total_credits_used} / {limits.outputs}
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        style={{ width: `${Math.min(100, Math.round((usage.total_credits_used / limits.per_agent) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Canvas: {usage.canvas_creations_used} / {limits.canvas}</span>
                      <span className={`font-medium ${usage.total_credits_used >= limits.outputs ? 'text-red-400' : 'text-zinc-400'
                        }`}>
                        {usage.total_credits_used >= limits.outputs ? 'Exhausted' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Premium dark main area with mesh gradient */}
      <div className={`dashboard-warm min-h-screen relative ${mounted ? 'transition-all duration-300' : ''} ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Mesh gradient background */}
        <div className={`fixed inset-0 bg-[#030303] ${mounted ? 'transition-all duration-300' : ''} ${sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(245,158,11,0.1),_transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,_rgba(120,80,40,0.05),_transparent)]" />
        </div>

        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-all lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
          </div>
        </header>

        <main className="relative p-4 sm:p-6 lg:p-8">
          {(profileStatus === 'suspended' || profileStatus === 'deleted') && pathname !== '/settings' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                <LogOut className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white">
                {profileStatus === 'deleted' ? 'Account Deleted' : 'Account Suspended'}
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                {profileStatus === 'deleted'
                  ? 'Your account has been deleted. You no longer have access to the AI Agents or Canvas.'
                  : 'Your account is currently suspended. Please contact support if you believe this is an error.'}
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
