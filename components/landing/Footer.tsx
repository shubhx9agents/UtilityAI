'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Agents', href: '#agents' },
    { name: 'Canvas', href: '/canvas' },
    { name: 'Changelog', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
  ],
  resources: [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Community', href: '#' },
    { name: 'Support', href: '#' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '#' },
    { name: 'Security', href: '#' },
  ],
}

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]' },
  { name: 'GitHub', icon: Github, href: '#', color: 'hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]' },
  { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@utilityai.com', color: 'hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  return (
    <footer className="relative py-12 px-6">
      {/* BentoGrid Style Wrapper */}
      <div className="mx-auto max-w-7xl">
        <motion.div 
          className="relative rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.08)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Glassmorphism BentoCard background */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03]" />
          <div className="absolute inset-0 border border-white/[0.12] rounded-3xl" />
          
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02] rounded-3xl"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <motion.div 
              className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
              className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/8 rounded-full blur-[80px]"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.06, 0.1, 0.06]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Inner glow on edges */}
          <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />

          {/* Content */}
          <div className="relative z-10 p-8 sm:p-12 lg:p-16">
            {/* Newsletter section */}
            <motion.div 
              className="mb-12 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Newsletter card glass background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-transparent rounded-2xl" />
              <div className="absolute inset-0 backdrop-blur-xl rounded-2xl" />
              <div className="absolute inset-0 border border-amber-500/30 rounded-2xl" />
              
              {/* Animated border glow on hover */}
              <motion.div 
                className="absolute inset-0 rounded-2xl"
                animate={{ opacity: isHovered ? 1 : 0.5 }}
                style={{ boxShadow: '0 0 50px rgba(245,158,11,0.15), inset 0 0 30px rgba(245,158,11,0.05)' }}
              />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                    <Mail className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Stay in the loop</h3>
                    <p className="text-white/60 text-sm">Get product updates and AI tips.</p>
                  </div>
                </div>
                <form className="flex w-full lg:w-auto gap-3" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative flex-1 lg:w-64">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.5)] transition-shadow text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Subscribe <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-12" />

            {/* Main footer content */}
            <div className="grid gap-10 lg:grid-cols-6">
              {/* Brand */}
              <div className="lg:col-span-2">
                <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
                  <span className="text-lg font-bold uppercase tracking-wide">
                    <span className="text-white">UTILITY</span>
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">AI</span>
                  </span>
                </Link>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
                  One platform, four specialized agents. Built for marketing and sales teams who ship fast.
                </p>
                {/* Social links */}
                <div className="flex gap-2.5">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      className={`w-10 h-10 rounded-lg bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center text-white/50 transition-all duration-300 ${social.color}`}
                      aria-label={social.name}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <social.icon className="w-4 h-4" />
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-4">
                {Object.entries(footerLinks).map(([category, links]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                      {category}
                    </h3>
                    <ul className="space-y-3">
                      {links.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.href}
                            className="group text-sm text-white/50 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <span className="relative">
                              {link.name}
                              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300" />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mt-12 mb-8" />

            {/* Bottom section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-white/40">
                © {new Date().getFullYear()} UtilityAI. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                All systems operational
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
