'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sparkles,
  Search,
  Image,
  Share2,
  TrendingUp,
  Check,
  ArrowRight,
  Zap,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-zinc-900">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-semibold tracking-tight">
              UtilityAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#agents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Agents
            </a>
            <a href="#compare" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Compare
            </a>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="rounded-lg bg-amber-500 font-medium text-zinc-900 hover:bg-amber-600 border-0">
                Get Started
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-6 shadow-lg">
            <nav className="flex flex-col space-y-4">
              <a
                href="#agents"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Agents
              </a>
              <a
                href="#compare"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Compare
              </a>
              <Link
                href="/login"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full rounded-lg bg-amber-500 font-medium text-zinc-900 hover:bg-amber-600 border-0">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-amber-500">
              AI-powered workflow
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              One platform.
              <br />
              <span className="text-amber-500">Four specialist agents.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Deep research, ad creatives, LinkedIn headshots, and high-converting
              copy. Built for marketing and sales teams who ship fast.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full rounded-lg bg-amber-500 font-medium text-zinc-900 hover:bg-amber-600 border-0 sm:w-auto">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#agents" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-lg sm:w-auto">
                  See agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bento - features */}
      <section id="agents" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          AI agents
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each agent is tuned for one job. Use them alone or chain them in the canvas.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/register" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">Deep Research</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Market and competitor analysis. Structured outputs you can drop into strategy docs.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-amber-500 group-hover:text-amber-600">
              Try agent <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>

          <Link href="/register" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                <Image className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">Ad Image Generation</h3>
              <p className="mt-2 text-sm text-muted-foreground">On-brand visuals for ads and campaigns.</p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-rose-500 group-hover:text-rose-600">
              Try agent <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>

          <Link href="/register" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-500">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">Ad Copy Generator</h3>
              <p className="mt-2 text-sm text-muted-foreground">Multiple variants, A/B-ready headlines.</p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-teal-500 group-hover:text-teal-600">
              Try agent <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>

          <Link href="/register" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">LinkedIn Headshot</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Professional profile photos powered by AI. Upload a selfie, get polished headshots.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-amber-500 group-hover:text-amber-600">
              Try agent <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Why UtilityAI
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Clear scope, modular agents, and a canvas to orchestrate workflows.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-heading font-semibold">Capability</TableHead>
                  <TableHead className="font-heading font-semibold">Included</TableHead>
                  <TableHead className="font-heading font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Deep Research</TableCell>
                  <TableCell><Check className="h-5 w-5 text-amber-500" /></TableCell>
                  <TableCell className="text-muted-foreground">Market & competitor analysis</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ad Image Generation</TableCell>
                  <TableCell><Check className="h-5 w-5 text-amber-500" /></TableCell>
                  <TableCell className="text-muted-foreground">On-brand creatives</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ad Copy Generator</TableCell>
                  <TableCell><Check className="h-5 w-5 text-amber-500" /></TableCell>
                  <TableCell className="text-muted-foreground">A/B-ready variations</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">LinkedIn Headshot</TableCell>
                  <TableCell><Check className="h-5 w-5 text-amber-500" /></TableCell>
                  <TableCell className="text-muted-foreground">Professional profile photos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Canvas & orchestration</TableCell>
                  <TableCell><Check className="h-5 w-5 text-amber-500" /></TableCell>
                  <TableCell className="text-muted-foreground">Chain agents into workflows</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-border bg-amber-500/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="font-heading text-3xl font-bold text-amber-600">4</div>
              <div className="mt-1 text-sm text-muted-foreground">Specialist agents</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-amber-600">1</div>
              <div className="mt-1 text-sm text-muted-foreground">Unified canvas</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-amber-600">—</div>
              <div className="mt-1 text-sm text-muted-foreground">No lock-in</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-amber-600">
                <Zap className="inline h-8 w-8" />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Ship faster</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 px-6 py-12 text-center sm:px-12">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Ready to 10x your output?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start with a free trial. No credit card required.
            </p>
            <Link href="/register" className="mt-6 inline-block">
              <Button size="lg" className="rounded-lg bg-amber-500 font-medium text-zinc-900 hover:bg-amber-600 border-0">
                Start free trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex justify-center">
            <Link href="/privacy">
              <Button variant="outline" className="rounded-lg">
                Privacy
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} UtilityAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}


