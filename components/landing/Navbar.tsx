'use client'


import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GlowingButton } from './GlowingButton'
import { cn } from '@/lib/utils'

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Agents', href: '#agents' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Testimonials', href: '#testimonials' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'py-3' : 'py-6'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full flex items-center gap-0 relative pl-4 sm:pl-6" style={{marginLeft: 0}}>
          {/* Brand - Leftmost, with accessible label */}
          <Link href="/" className="flex items-center group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded" aria-label="UtilityAI Home" tabIndex={0} style={{ minWidth: 0, marginLeft: 0 }}>
            <span
              className="font-heading text-3xl font-extrabold text-white tracking-widest uppercase"
              style={{
                letterSpacing: '0.12em',
                textShadow: '0 2px 16px rgba(0,0,0,0.18), 0 1px 0 #fff1',
                fontFamily: 'Montserrat, Inter, Arial, sans-serif',
              }}
            >
              UTILITY<span className="text-amber-400">AI</span>
            </span>
          </Link>

          {/* Centered navbar pill, absolutely centered regardless of brand width */}
          <nav
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-2xl px-6 sm:px-8 py-2 transition-all duration-300 overflow-visible',
              'focus-within:ring-2 focus-within:ring-amber-400',
              scrolled
                ? 'bg-gradient-to-r from-white/[0.10] via-white/[0.07] to-white/[0.10] backdrop-blur-2xl border border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'bg-gradient-to-r from-white/[0.10] via-white/[0.06] to-white/[0.10] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(245,158,11,0.10),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]'
            )}
            style={{ minWidth: 600, maxWidth: 900, boxShadow: '0 4px 32px 0 rgba(245,158,11,0.08), 0 1.5px 0 0 rgba(255,255,255,0.08)' }}
            aria-label="Main navigation"
            role="navigation"
          >
            {/* Subtle inner glow + glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" style={{backdropFilter:'blur(18px)'}} />

            {/* Desktop Nav */}
            <div className="relative z-10 hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="px-5 py-1.5 text-base font-semibold text-white/90 hover:text-amber-400 focus-visible:text-amber-400 rounded-lg hover:bg-amber-500/10 focus-visible:bg-amber-500/10 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.97 }}
                  tabIndex={0}
                  aria-label={link.name}
                >
                  {link.name}
                </motion.a>
              ))}
              {/* CTA inside navbar pill */}
              <GlowingButton href="/register" size="default" className="ml-4 px-7 py-1.5 text-base font-semibold" aria-label="Learn More">
                Learn More
              </GlowingButton>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="relative z-10 md:hidden p-2 text-white/70 hover:text-amber-400 focus-visible:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              tabIndex={0}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-24 z-50 md:hidden"
          >
            <div className="relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <nav className="relative z-10 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-lg font-medium text-white/70 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
                  >
                    {link.name}
                  </a>
                ))}
                <hr className="border-white/10 my-2" />
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-lg font-medium text-white/70 hover:text-amber-400 transition-colors"
                >
                  Sign in
                </Link>
                <div className="mt-2">
                  <GlowingButton href="/register" className="w-full justify-center">
                    Get Started
                  </GlowingButton>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
