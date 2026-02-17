'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  Search,
  Image,
  Type,
  ArrowRight,
  Zap,
  Shield,
  Users,
  Workflow,
  BarChart3,
  Star,
  Play,
  Camera,
  Code,
} from 'lucide-react'

import {
  HeroBackground,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  GlowingButton,
  BentoCard,
  AnimatedCounter,
  TestimonialCard,
  LogoCloud,
  PricingSection,
  Footer,
  Navbar,
} from '@/components/landing'

import TextType from '@/components/ui/TextType'

// Agent data with explicit Tailwind classes (dynamic classes don't work)
const agents = [
  {
    id: 'research',
    name: 'Deep Research',
    description: 'Market and competitor analysis with structured outputs ready for strategy docs.',
    icon: Search,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    linkColor: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/5',
  },
  {
    id: 'image',
    name: 'Ad Image Generation',
    description: 'On-brand visuals for ads and campaigns. Multiple formats, instant delivery.',
    icon: Image,
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-500',
    linkColor: 'text-rose-500',
    gradient: 'from-rose-500/20 to-pink-500/5',
  },
  {
    id: 'copy',
    name: 'Ad Copy Generator',
    description: 'Multiple variants, A/B-ready headlines. Never run out of creative ideas.',
    icon: Type,
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-500',
    linkColor: 'text-teal-500',
    gradient: 'from-teal-500/20 to-cyan-500/5',
  },
  {
    id: 'headshot',
    name: 'LinkedIn Headshot',
    description: 'Professional profile photos powered by AI. Upload a selfie, get polished results.',
    icon: Camera,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    linkColor: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/5',
  },
]

// Feature data for bento grid
const features = [
  {
    title: 'Unified Canvas',
    description: 'Chain agents together into powerful workflows. Visual orchestration that just works.',
    icon: Workflow,
    span: 'lg:col-span-2',
    gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    glowColor: 'rgba(245,158,11,0.3)',
  },
  {
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time. Comments, sharing, version history.',
    icon: Users,
    span: '',
    gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500',
    glowColor: 'rgba(59,130,246,0.3)',
  },
  {
    title: 'Enterprise Security',
    description: 'SOC 2 Type II certified. Your data is encrypted at rest and in transit.',
    icon: Shield,
    span: '',
    gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500',
    glowColor: 'rgba(16,185,129,0.3)',
  },
  {
    title: 'Lightning Fast',
    description: 'Optimized infrastructure for sub-second response times. No waiting.',
    icon: Zap,
    span: '',
    gradient: 'from-yellow-500/15 via-yellow-500/5 to-transparent',
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-500',
    glowColor: 'rgba(234,179,8,0.3)',
  },
  {
    title: 'API & Integrations',
    description: 'Connect with your favorite tools. REST API, webhooks, and native integrations.',
    icon: Code,
    span: '',
    gradient: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-500',
    glowColor: 'rgba(6,182,212,0.3)',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track usage, measure ROI, and optimize your workflows with detailed analytics.',
    icon: BarChart3,
    span: 'lg:col-span-3',
    gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    glowColor: 'rgba(245,158,11,0.3)',
  },
]

// Testimonials
const testimonials = [
  {
    quote: "UtilityAI has completely transformed our content workflow. What used to take our team days now happens in hours. The quality is consistently excellent.",
    author: "Sarah Chen",
    role: "Head of Marketing",
    company: "TechCorp",
    rating: 5,
  },
  {
    quote: "The Deep Research agent alone has saved us thousands in market research costs. It's like having a team of analysts on demand.",
    author: "Marcus Johnson",
    role: "VP of Strategy",
    company: "GrowthLabs",
    rating: 5,
  },
  {
    quote: "We switched from three different tools to just UtilityAI. The canvas feature is game-changing for orchestrating complex campaigns.",
    author: "Emily Rodriguez",
    role: "Creative Director",
    company: "Brandify",
    rating: 5,
  },
]

// Stats
const stats = [
  { value: 50000, suffix: '+', label: 'Active Users' },
  { value: 10, suffix: 'M+', label: 'Generations' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 4.9, suffix: '/5', label: 'User Rating' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#030303] text-foreground overflow-hidden">
      {/* Hero Background with 3D Globe and GSAP Animations */}
      <HeroBackground />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="text-center">
            {/* Main headline */}
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              <span className="text-white">One platform.</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                <TextType
                  text={["Four specialized agents."]}
                  typingSpeed={60}
                  pauseDuration={3000}
                  showCursor
                  cursorCharacter="|"
                  className="inline"
                />
              </span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
            >
              Deep research, ad creatives, LinkedIn headshots, and high-converting copy.
              Built for marketing and sales teams who ship fast.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <GlowingButton href="/register" size="lg" >
                Start free trial
              </GlowingButton>
              <GlowingButton href="#demo" variant="secondary" size="lg" icon={<Play className="w-5 h-5" />}>
                Watch demo
              </GlowingButton>
            </motion.div>

            {/* Social proof quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {/* Professional stacked avatars with real user images */}
                  <NextImage
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    alt="User"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border-2 border-[#030303] object-cover ring-2 ring-amber-500/20"
                  />
                  <NextImage
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                    alt="User"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border-2 border-[#030303] object-cover ring-2 ring-amber-500/20"
                  />
                  <NextImage
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    alt="User"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border-2 border-[#030303] object-cover ring-2 ring-amber-500/20"
                  />
                  <NextImage
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                    alt="User"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border-2 border-[#030303] object-cover ring-2 ring-amber-500/20"
                  />
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-[#030303] flex items-center justify-center text-xs font-bold text-white ring-2 ring-amber-500/20">
                    +50K
                  </div>
                </div>
                <span className="text-white/60 font-medium">trusted users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
              <div>No credit card required</div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Product Visual / Dashboard Preview */}
      <section className="relative -mt-10 pb-20 sm:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <motion.div
              className="relative rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {/* Browser mockup frame */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] rounded-2xl p-1 shadow-2xl shadow-black/50">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] rounded-t-xl">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/[0.05] rounded-lg px-4 py-1.5 text-xs text-white/40 max-w-md mx-auto text-center">
                      app.utilityai.com/canvas
                    </div>
                  </div>
                  <div className="w-16" />
                </div>

                {/* Dashboard Image */}
                <div className="rounded-b-xl overflow-hidden">
                  <img
                    src="/dashboard/preview.png"
                    alt="UtilityAI Canvas - AI Workflow Automation Dashboard"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-rose-500/20 rounded-3xl blur-3xl -z-10 opacity-50" />
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <p className="text-center text-2xl sm:text-3xl md:text-4xl text-white/70 mb-16 font-bold tracking-tight">
              Trusted by fast-growing teams worldwide
            </p>
            <LogoCloud />
          </ScrollReveal>
        </div>
      </section>

      {/* Agents Section */}
      <section id="agents" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="text-center mb-20">
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              Meet your AI agents
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Each agent is fine-tuned for one job. Use them standalone or chain them together in the canvas.
            </p>
          </ScrollReveal>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <StaggerItem key={agent.id}>
                <Link href="/register">
                  <BentoCard
                    className="h-full p-6 hover:shadow-lg"
                    gradient={`bg-gradient-to-br ${agent.gradient}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl ${agent.iconBg} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110`}
                      style={{ boxShadow: `0 0 24px 4px ${agent.iconColor === 'text-amber-500' ? 'rgba(245,158,11,0.25)' : agent.iconColor === 'text-rose-500' ? 'rgba(244,63,94,0.25)' : agent.iconColor === 'text-teal-500' ? 'rgba(20,184,166,0.25)' : 'rgba(139,92,246,0.25)'}` }}
                    >
                      <agent.icon className={`w-7 h-7 ${agent.iconColor}`} />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-3">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-white/65 leading-relaxed mb-6">
                      {agent.description}
                    </p>
                    <div className={`inline-flex items-center text-sm font-semibold ${agent.linkColor} group-hover:gap-2 transition-all`}>
                      Try agent <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </BentoCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="text-center mb-20">
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              Everything you need to ship faster
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              A complete platform built for speed, collaboration, and scale.
            </p>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 0.1} className={feature.span}>
                <BentoCard
                  className="h-full p-8 hover:shadow-lg"
                  gradient={`bg-gradient-to-br ${feature.gradient}`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110`}
                    style={{ boxShadow: `0 0 24px 4px ${feature.glowColor}` }}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/65 leading-relaxed">
                    {feature.description}
                  </p>
                </BentoCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1} className="text-center">
                <div className="font-heading text-5xl sm:text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-white/60">{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Loved by teams worldwide
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              See what marketing and sales professionals are saying about UtilityAI.
            </p>
          </ScrollReveal>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <StaggerItem key={testimonial.author}>
                <TestimonialCard {...testimonial} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <PricingSection />
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
