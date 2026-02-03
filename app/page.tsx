'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Target, TrendingUp, Shield, Rocket } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between animate-slide-up">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">UtilityAI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
            <Link href="#agents" className="text-gray-300 hover:text-white transition-colors">AI Agents</Link>
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Get Started
              </Button>
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 animate-scale-in">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-200">10 AI-Powered Agents Ready</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="text-white">Transform Your Business</span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                    with AI Power
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-xl text-gray-300 md:text-2xl">
                  Accelerate growth with specialized AI agents for marketing, sales, and strategy.
                  <span className="text-purple-400 font-semibold"> 10x your productivity</span> today.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 group">
                    <Rocket className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30">
                    Explore Features
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">10+</div>
                  <div className="text-sm text-gray-400">AI Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">50K+</div>
                  <div className="text-sm text-gray-400">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">99%</div>
                  <div className="text-sm text-gray-400">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Ad Copy Generator',
                desc: 'Create compelling ads that convert',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Target,
                title: 'Deep Research',
                desc: 'AI-powered market analysis',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Zap,
                title: 'Sales Scripts',
                desc: 'Perfect your pitch instantly',
                color: 'from-orange-500 to-red-500'
              },
              {
                icon: TrendingUp,
                title: 'Growth & CRO',
                desc: 'Optimize your conversion funnel',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: Shield,
                title: 'Business Strategy',
                desc: 'Data-driven strategic planning',
                color: 'from-indigo-500 to-purple-500'
              },
              {
                icon: Rocket,
                title: 'Landing Pages',
                desc: 'Convert more visitors to customers',
                color: 'from-pink-500 to-rose-500'
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© 2026 UtilityAI. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
